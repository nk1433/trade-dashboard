import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { calculateAllocationIntent, computeMetrics } from "../utils/calculateMetrics";


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

export const updateWatchlistWithMetrics = async (liveFeed, scriptMap, portfolio, stats, settings) => {
    const tradingMode = settings?.tradingMode || 'PAPER';
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

        const activePortfolio = portfolio[tradingMode === 'PRODUCTION' ? 'prod' : 'paper'] || portfolio.paper;
        const portfolioSize = activePortfolio?.portfolioSize || 0;
        const riskPercentage = activePortfolio?.riskPercentage || 0.25;
        const maxAllocation = settings?.maxAllowedAllocation || 15;

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
            maxAllocation,
        });

        if (!acc.metrics) acc.metrics = {};
        if (!acc.bullishMB) acc.bullishMB = {};
        if (!acc.bearishMB) acc.bearishMB = {};
        if (!acc.bullishSLTB) acc.bullishSLTB = {};
        if (!acc.bearishSLTB) acc.bearishSLTB = {};
        if (!acc.bullishAnts) acc.bullishAnts = {};
        if (!acc.dollar) acc.dollar = {};
        if (!acc.bearishDollar) acc.bearishDollar = {};

        acc.metrics[instrumentKey] = {
            ...metric,
            dayHigh: latestDayFeed.high,
            dayLow: latestDayFeed.low,
            dayVolume: currentVolume,
        };

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


// Updated thunk to populate metrics from Stats (no API calls)
export const fetchAndCalculateInitialMetrics = createAsyncThunk('Orders/fetchAndCalculateInitialMetrics', async (scripts, { getState }) => {
    const { portfolio, settings, orders: { stats } } = getState();

    // Construct "liveFeed" structure from Stats data
    const feeds = {};
    const scriptMap = {};

    scripts.forEach((script) => {
        const { instrument_key: instrumentKey, name, tradingsymbol } = script;
        scriptMap[instrumentKey] = { name, tradingsymbol };

        const stat = stats[instrumentKey];
        if (stat) {
            // Map stats to OHLC format expected by updateWatchlistWithMetrics
            // Assuming stats contains basic price info. If not, we fallback to lastPrice.
            const price = stat.lastPrice || 0;
            const open = stat.open || price;
            const high = stat.high || price;
            const low = stat.low || price;
            const vol = stat.volume || stat.lastTradedVolume || 0;
            const ts = stat.lastTradeTime || new Date().toISOString();

            const dayFeed = {
                interval: '1d',
                open: open,
                high: high,
                low: low,
                close: price,
                vol: vol,
                ts: ts,
            };

            // Minimal minute feed to avoid breaking calculations
            const minuteFeed = {
                interval: 'I1',
                open: price, high: price, low: price, close: price, vol: 0, ts: ts
            };

            feeds[instrumentKey] = {
                fullFeed: {
                    marketFF: {
                        marketOHLC: {
                            ohlc: [dayFeed, minuteFeed]
                        }
                    }
                }
            };
        } else {
            // Initialize with defaults if stat strictly missing but we want it in the list
            // This ensures the row appears even if stats are loading/missing
            const dayFeed = { interval: '1d', open: 0, high: 0, low: 0, close: 0, vol: 0, ts: '' };
            const minuteFeed = { interval: 'I1', open: 0, high: 0, low: 0, close: 0, vol: 0, ts: '' };

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
    });

    const liveFeed = { feeds };
    const metrics = await updateWatchlistWithMetrics(liveFeed, scriptMap, portfolio, stats, settings);
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