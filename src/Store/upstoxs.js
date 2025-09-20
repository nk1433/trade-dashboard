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
        barClosingStrength = -Math.abs(barClosingStrength);
    }

    const threshold = currentDayOpen * 0.99;
    const instrumentStats = stats[instrumentKey] || {};
    const { lastPrice, avgVolume21d, avgValueVolume21d } = instrumentStats;

    const avgVolume = avgVolume21d;
    const previousDayClose = lastPrice;

    const changePercentage = ((ltp - currentDayOpen) / currentDayOpen) * 100;
    const allocation =
        ltp - currentDayOpen <= 0
            ? {
                maxAllocationPercentage: "-",
                riskRewardRatio: "-",
                allocationSuggestions: [],
            }
            : calculateAllocationIntent(15, size, ltp, currentDayOpen, riskOfPortfolio);

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
                Authorization: `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`,
            },
        }
    );

    return await liveResponse.json();
};

const getStats = async () => {
    const stats = await fetch(
        `http://localhost:3015/stats/all`,
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

export const calculateMetricsForScript = createAsyncThunk('Orders/calculateMetricsForScript', async (scripts, state) => {
    const { portfolio } = state.getState();
    const { orders: { stats } } = state.getState();
    const { portfolioSize, riskPercentage: riskPercentageOfPortfolio } = portfolio;

    const results = await Promise.all(
        scripts.map(async (script) => {
            try {
                const { instrument_key: instrumentKey, name: scriptName } = script;

                const size = parseFloat(portfolioSize);
                const riskOfPortfolio = parseFloat(riskPercentageOfPortfolio);

                const marketQuote = await getMarketQuote(instrumentKey);

                const {
                    live_ohlc: { open: currentDayOpen, low: lowPrice, volume: currentVolume, ts: lastTradingDay, high },
                    last_price: ltp,
                } = Object.values(marketQuote.data).find(({ instrument_token }) => {
                    return instrument_token === instrumentKey;
                });

                return await computeMetrics({
                    scriptName,
                    instrumentKey,
                    size,
                    riskOfPortfolio,
                    currentDayOpen,
                    lowPrice,
                    currentVolume,
                    lastTradingDay,
                    high,
                    ltp,
                    stats,
                });

            } catch (err) {
                console.error(`Error fetching data for ${script.name}`, err);
            }
        }),
    );

    return results;
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
        }
    },
    extraReducers: (builder) => {
        builder.addCase(placeSLMOrder.fulfilled, (state, action) => {
            state.orders.push(action.payload);
        });
        builder.addCase(calculateMetricsForScript.fulfilled, (state, action) => {
            state.orderMetrics = action.payload;
        });
        builder.addCase(getStatsForScripts.fulfilled, (state, action) => {
            state.stats = action.payload;
        });
    },
});

export default orders.reducer;
export const { setOrderMetrics, setLiveFeed, setBullishMB, setBearishMB } = orders.actions;