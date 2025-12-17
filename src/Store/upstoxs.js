import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { calculateAllocationIntent } from "../utils/calculateMetrics";

export const computeMetrics = async (context) => {
    const {
        scriptName,
        instrumentKey,
        size,
        riskOfPortfolio,
        currentDayOpen,
        lowPrice,
        currentVolume,
        high,
        ltp,
        stats,
        currentMinuteVolume,
        symbol,
    } = context;

    let barClosingStrength = ((ltp - lowPrice) / (high - lowPrice)) * 100;
    const isUpDay = ltp >= currentDayOpen; // true if up day or flat

    if (!isUpDay) {
        barClosingStrength = ((high - ltp) / (high - lowPrice)) * 100;
    }

    const threshold = currentDayOpen * 0.99;
    const instrumentStats = stats[instrumentKey] || {};
    const { lastPrice, avgVolume21d, avgValueVolume21d } = instrumentStats;

    const avgVolume = avgVolume21d;
    const previousDayClose = lastPrice;
    const changePercentage = ((ltp - currentDayOpen) / currentDayOpen) * 100;

    let allocation;
    if (ltp > currentDayOpen) {
        allocation = calculateAllocationIntent(15, size, ltp, currentDayOpen, riskOfPortfolio);
    } else {
        // Fallback for down days: Use 1% SL to calculate quantity
        const fallbackSL = ltp * 0.99;
        const fallbackAllocation = calculateAllocationIntent(15, size, ltp, fallbackSL, riskOfPortfolio);
        allocation = {
            ...fallbackAllocation,
            maxAllocationPercentage: "-",
            riskRewardRatio: "-",
            allocationSuggestions: [],
        };
    }

    return {
        scriptName,
        symbol,
        avgVolume,
        instrumentKey,
        relativeVolumePercentage: ((currentVolume / parseFloat(avgVolume)) * 100).toFixed(2),
        gapPercentage: (((currentDayOpen - previousDayClose) / previousDayClose) * 100).toFixed(2),
        strongStart: lowPrice >= threshold,
        ltp: ltp,
        sl: currentDayOpen,
        barClosingStrength: Math.round(barClosingStrength),
        isUpDay,
        changePercentage: changePercentage.toFixed(2),
        avgValueVolume21d,
        currentMinuteVolume,
        ...allocation,
    };
};

const getMarketQuote = async (instrumentKey) => {
    const liveResponse = await fetch(
        `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${instrumentKey}&interval=1d`,
        {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('upstox_access_token') || import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`,
            },
        }
    );

    return await liveResponse.json();
};

const getStats = async () => {
    const env = import.meta.env.VITE_ENV;
    console.log(env);
    const baseUrl = env === 'DEV' ? 'http://localhost:3015' : import.meta.env.VITE_PROD_HOST;

    const stats = await fetch(
        `${baseUrl}/stats/all`,
        {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        }
    );

    return await stats.json();
};

export const getStatsForScripts = createAsyncThunk('Orders/getStats', async () => {
    const response = await getStats();
    return response.data;
});

export const updateWatchlistWithMetrics = async (liveFeed, scriptMap, portfolio, stats, tradingMode = 'PAPER') => {
    const entries = Object.entries(liveFeed.feeds);

    const results = await entries.reduce(async (accP, [instrumentKey, script]) => {
        const acc = await accP;

        // Get daily OHLC feed
        const latestDayFeed = script.fullFeed?.marketFF?.marketOHLC?.ohlc.find(feed => feed.interval === '1d');
        // Get latest minute OHLC feed
        const latestMinuteFeed = script.fullFeed?.marketFF?.marketOHLC?.ohlc.find(feed => feed.interval === 'I1');

        if (!latestDayFeed || !latestMinuteFeed) return acc;

        const prevStats = stats[instrumentKey] || {};
        const prevDayVolume = prevStats.prevDayVolume || 0;
        const prevDayClose = prevStats.lastPrice || 0;
        // Newly added metrics from stats
        const minVolume3d = prevStats.minVolume3d || 0;
        const statsPriceChange = prevStats.priceChange || 0;
        const trendIntensity = parseFloat(prevStats.trendIntensity) || 0;
        const closePrev1 = parseFloat(prevStats.closePrev1) || 0;
        const closePrev2 = parseFloat(prevStats.closePrev2) || 0;

        const currentClose = latestDayFeed.close;
        const currentLow = latestDayFeed.low;
        // const currentOpen = latestDayFeed.open;
        const currentVolume = latestDayFeed.vol;
        const currentMinuteVolume = latestMinuteFeed.vol;

        const priceRatio = prevDayClose > 0 ? currentClose / prevDayClose : 0;

        // Volume surge rate (minute vs daily)
        const volSurgeRate = currentVolume > 0 ? (currentMinuteVolume / currentVolume) * 100 : 0;

        // Select portfolio settings based on trading mode
        const activePortfolio = portfolio[tradingMode === 'PRODUCTION' ? 'prod' : 'paper'] || portfolio.paper;
        const portfolioSize = activePortfolio?.portfolioSize || 0;
        const riskPercentage = activePortfolio?.riskPercentage || 0.25;

        const metric = await computeMetrics({
            scriptName: scriptMap[instrumentKey]?.name || '',
            symbol: scriptMap[instrumentKey]?.tradingsymbol,
            instrumentKey,
            size: portfolioSize,
            riskOfPortfolio: riskPercentage,
            currentDayOpen: latestDayFeed.open,
            lowPrice: latestDayFeed.low,
            currentVolume,
            high: latestDayFeed.high,
            ltp: currentClose,
            stats,
            volSurgeRate,
            currentMinuteVolume,
        });

        if (!acc.metrics) acc.metrics = {};
        if (!acc.bullishMB) acc.bullishMB = {};
        if (!acc.bearishMB) acc.bearishMB = {};
        if (!acc.bullishSLTB) acc.bullishSLTB = {};
        if (!acc.bearishSLTB) acc.bearishSLTB = {};
        if (!acc.bullishAnts) acc.bullishAnts = {};
        if (!acc.dollar) acc.dollar = {};
        if (!acc.bearishDollar) acc.bearishDollar = {};

        acc.metrics[instrumentKey] = metric;

        if (priceRatio >= 1.04 && currentVolume > prevDayVolume && currentVolume >= 100000) {
            acc.bullishMB[instrumentKey] = metric;
        }

        if (priceRatio <= 0.96 && currentVolume > prevDayVolume && currentVolume >= 100000) {
            acc.bearishMB[instrumentKey] = metric;
        }

        if (
            minVolume3d > 100000 &&
            trendIntensity >= 1.05 &&
            latestDayFeed.close > latestDayFeed.open &&
            latestDayFeed.close > closePrev1 &&
            latestDayFeed.close / closePrev1 > closePrev1 / closePrev2 &&
            closePrev1 / closePrev2 < 1.02 &&
            closePrev1 > closePrev2 &&
            latestDayFeed.close > 100
        ) {
            acc.bullishSLTB[instrumentKey] = metric;
        }

        if (
            closePrev1 / closePrev2 >= 0.98 &&
            latestDayFeed.close / closePrev1 < closePrev1 / closePrev2 &&
            latestDayFeed.close < closePrev1 &&
            latestDayFeed.close < latestDayFeed.open &&
            minVolume3d >= 100000 &&
            (latestDayFeed.close - latestDayFeed.low) / (latestDayFeed.high - latestDayFeed.low) < 0.2 &&
            latestDayFeed.close > 100
        ) {
            acc.bearishSLTB[instrumentKey] = metric;
        }

        if (
            minVolume3d > 100000 &&
            trendIntensity >= 1.05 &&
            statsPriceChange > -1 &&
            statsPriceChange < 1
        ) {
            acc.bullishAnts[instrumentKey] = metric;
        }

        if (latestDayFeed.close - latestDayFeed.open >= 50 && currentVolume >= 100000) {
            acc.dollar[instrumentKey] = metric;
        }

        if (latestDayFeed.open - latestDayFeed.close >= 50 && currentVolume >= 100000) {
            acc.bearishDollar[instrumentKey] = metric;
        }

        //TODO: Include TI in checks.
        if ((latestDayFeed.close / prevStats.fiftyTwoWeekLow) >= 1.8 &&
            minVolume3d > 100000 &&
            statsPriceChange > -1 &&
            statsPriceChange < 1
        ) {
            acc.bullishAnts[instrumentKey] = metric;
        }

        return acc;
    }, Promise.resolve({
        metrics: {}, bullishMB: {}, bearishMB: {},
        bullishSLTB: {}, bearishSLTB: {}, bullishAnts: {},
        dollar: {}, bearishDollar: {}
    }));

    return results;
};


// Updated thunk that mimics the WebSocket structure to reuse updateWatchlistWithMetrics
export const fetchAndCalculateInitialMetrics = createAsyncThunk('Orders/fetchAndCalculateInitialMetrics', async (scripts, state) => {
    const { portfolio, settings, orders: { stats } } = state.getState();
    const tradingMode = settings?.tradingMode || 'PAPER';

    // Helper to get OHLC data
    const getOHLC = async (instrumentKey, interval) => {
        try {
            const response = await fetch(
                `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${instrumentKey}&interval=${interval}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('upstox_access_token') || import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`,
                    },
                }
            );
            return await response.json();
        } catch (e) {
            console.error(`Error fetching ${interval} for ${instrumentKey}`, e);
            return null;
        }
    };

    // Construct "liveFeed" structure from REST API data
    const feeds = {};
    const scriptMap = {};

    await Promise.all(scripts.map(async (script) => {
        const { instrument_key: instrumentKey, name, trading_symbol: tradingsymbol } = script;

        // Populate scriptMap
        scriptMap[instrumentKey] = { name, tradingsymbol };

        // Fetch 1d and 1min data concurrently
        const [dayData, minuteData] = await Promise.all([
            getOHLC(instrumentKey, '1d'),
            getOHLC(instrumentKey, '1minute')
        ]);

        const formatOHLC = (apiData, interval) => {
            if (!apiData?.data) return null;
            // apiData.data is a map { "NSE_EQ|...": { ohlc: ... } } usually for market-quote

            const dataItem = Object.values(apiData.data || {}).find(item => item.instrument_token === instrumentKey);
            if (!dataItem) return null;

            return {
                interval: interval,
                open: dataItem.live_ohlc.open,
                high: dataItem.live_ohlc.high,
                low: dataItem.live_ohlc.low,
                close: dataItem.live_ohlc.close || dataItem.last_price,
                vol: dataItem.live_ohlc.volume,
                ts: dataItem.live_ohlc.ts,
            };
        };

        const dayFeed = formatOHLC(dayData, '1d');
        const minuteFeed = formatOHLC(minuteData, 'I1');

        if (dayFeed && minuteFeed) {
            feeds[instrumentKey] = {
                fullFeed: {
                    marketFF: {
                        marketOHLC: {
                            ohlc: [dayFeed, minuteFeed]
                        }
                    }
                }
            };
        }
    }));

    const liveFeed = { feeds };

    // Call the shared function
    const metrics = await updateWatchlistWithMetrics(liveFeed, scriptMap, portfolio, stats, tradingMode);
    return metrics;
});

export const fetchHoldings = createAsyncThunk('Orders/fetchHoldings', async (_, { getState }) => {
    const { auth } = getState();
    const token = auth.token; // Upstox token

    const response = await fetch('https://api.upstox.com/v2/portfolio/long-term-holdings', {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    });

    const data = await response.json();
    return data.data || [];
});

export const placeSLMOrder = createAsyncThunk('Orders/placeSLMOrder', async (script) => {
    const {
        instrumentKey: instrument_token,
        maxShareToBuy: quantity,
        sl: trigger_price,
        ltp: price
    } = script;

    const body = JSON.stringify({
        quantity: quantity,
        product: "D",
        validity: "DAY",
        price,
        tag: "string",
        instrument_token: instrument_token,
        order_type: "SL",
        transaction_type: "BUY",
        disclosed_quantity: 0,
        trigger_price,
        is_amo: false
    });

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${import.meta.env.VITE_UPSTOXS_SANDBOX_ACCESS_KEY}`,
    };

    const requestOptions = {
        method: "POST",
        headers,
        body,
    };

    await fetch(import.meta.env.VITE_UPSTOXS_SANDBOX_BASE_URL + "order/place", requestOptions);
});

const orders = createSlice({
    name: "orders",
    initialState: {
        orders: [],
        orderMetrics: {},
        liveFeed: [],
        stats: {},
        bullishBurst: [],
        bearishBurst: [],
        bullishSLTB: [],
        bearishSLTB: [],
        bullishAnts: [],
        dollar: [],
        bearishDollar: [],
        holdings: [],
    },
    reducers: {
        setOrderMetrics(state, action) {
            const newMetrics = action.payload;
            state.orderMetrics = {
                ...state.orderMetrics,
                ...newMetrics,
            };
        },
        setLiveFeed(state, action) {
            state.liveFeed.unshift(action.payload);
        },
        setBullishMB(state, action) {
            const newMetrics = action.payload;
            state.bullishBurst = {
                ...state.bullishBurst,
                ...newMetrics,
            };
        },
        setBearishMB(state, action) {
            const newMetrics = action.payload;
            state.bearishBurst = {
                ...state.bearishBurst,
                ...newMetrics,
            };
        },
        setBullishSLTB(state, action) {
            const newMetrics = action.payload;
            state.bullishSLTB = {
                ...state.bullishSLTB,
                ...newMetrics,
            };
        },
        setBearishSLTB(state, action) {
            const newMetrics = action.payload;
            state.bearishSLTB = {
                ...state.bearishSLTB,
                ...newMetrics,
            };
        },
        setBullishAnts(state, action) {
            const newMetrics = action.payload;
            state.bullishAnts = {
                ...state.bullishAnts,
                ...newMetrics,
            };
        },
        setDollarBo(state, action) {
            const newMetrics = action.payload;
            state.dollar = {
                ...state.dollar,
                ...newMetrics,
            };
        },
        setBearishDollarBo(state, action) {
            const newMetrics = action.payload;
            state.bearishDollar = {
                ...state.bearishDollar,
                ...newMetrics,
            };
        },
    },
    extraReducers: (builder) => {
        builder.addCase(placeSLMOrder.fulfilled, (state, action) => {
            state.orders.push(action.payload);
        });
        builder.addCase(fetchAndCalculateInitialMetrics.fulfilled, (state, action) => {
            const { metrics, bullishMB, bearishMB, bullishSLTB, bearishSLTB, bullishAnts, dollar, bearishDollar } = action.payload;

            state.orderMetrics = metrics;
            state.bullishBurst = bullishMB;
            state.bearishBurst = bearishMB;
            state.bullishSLTB = bullishSLTB;
            state.bearishSLTB = bearishSLTB;
            state.bullishAnts = bullishAnts;
            state.dollar = dollar;
            state.bearishDollar = bearishDollar;
        });
        builder.addCase(getStatsForScripts.fulfilled, (state, action) => {
            state.stats = action.payload;
        });
        builder.addCase(fetchHoldings.fulfilled, (state, action) => {
            state.holdings = action.payload || [];
        });
        builder.addCase(fetchHoldings.rejected, (state, action) => {
            state.holdings = [];
            console.error('Fetch holdings failed:', action.error);
        });
    },
});

export default orders.reducer;
export const {
    setOrderMetrics, setLiveFeed, setBullishMB,
    setBearishMB, setBullishSLTB, setBearishSLTB,
    setBullishAnts, setDollarBo, setBearishDollarBo,
} = orders.actions;