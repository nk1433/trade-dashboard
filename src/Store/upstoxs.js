import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { calculateAllocationIntentForScript } from "../utils/calculateMetrics";
import moment from "moment";

export const placeSLMOrder = createAsyncThunk('Orders/placeSLMOrder', async (script) => {
    const {
        instrumentKey: instrument_token, allocations,
        ltp: price
    } = script;
    const maxAllocation = Object.values(allocations).find((allocation) => {
        const { canAllocate } = allocation;

        return canAllocate;
    });
    const { sharesToBuy: quantity, sl: trigger_price } = maxAllocation;


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

const getHistoricalData = async ({ instrumentKey, toDate, fromDate }) => {
    const historicalResponse = await fetch(
        `https://api.upstox.com/v3/historical-candle/${instrumentKey}/days/1/${toDate}/${fromDate}`,
        {
            headers: {
                Authorization: `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`,
            },
        }
    );

    return await historicalResponse.json();
};

export const calculateMetricsForScript = createAsyncThunk('Orders/calculateMetricsForScript', async (scripts, state) => {
    const {  portfolio } = state.getState();
    const { portfolioSize, riskPercentage: riskPercentageOfPortfolio } = portfolio;

    const results = await Promise.all(
        scripts.map(async (script) => {
            try {
                const { instrument_key: instrumentKey, name: scriptName } = script;

                const size = parseFloat(portfolioSize);
                const riskOfPortfolio = parseFloat(riskPercentageOfPortfolio);

                const marketQuote = await getMarketQuote(instrumentKey);

                const {
                    live_ohlc: { open: currentDayOpen, low: lowPrice, volume: currentVolume, ts: lastTradingDay },
                    last_price: ltp,
                } = Object.values(marketQuote.data).find(({ instrument_token }) => {
                    return instrument_token === instrumentKey;
                });

                const threshold = currentDayOpen * 0.99;
                const allocation = calculateAllocationIntentForScript(size, 10, ltp, riskOfPortfolio);

                const historicalData = await getHistoricalData({
                    instrumentKey,
                    toDate: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                    fromDate: moment().subtract(31, 'day').format('YYYY-MM-DD'),
                });
                const candles = historicalData.data.candles;
                const totalVolume = candles.reduce((sum, candle) => sum + candle[5], 0);
                const avgVolume = (totalVolume / candles.length).toFixed(0);

                let previousDayClose = candles.find((candle) => {
                    const previousDayCandleDate = moment(lastTradingDay).subtract(1, 'day').format('DD-MM-YYYY');

                    return previousDayCandleDate === moment(candle[0]).format('DD-MM-YYYY')
                })[4];
                

                const allocation10 = calculateAllocationIntentForScript(size, 10, ltp, riskOfPortfolio);
                const allocation25 = calculateAllocationIntentForScript(size, 25, ltp, riskOfPortfolio);
                const allocation40 = calculateAllocationIntentForScript(size, 40, ltp, riskOfPortfolio);

                return {
                    scriptName,
                    avgVolume,
                    instrumentKey,
                    relativeVolumePercentage: ((currentVolume / parseFloat(avgVolume)) * 100).toFixed(2),
                    gapPercentage: (((currentDayOpen - previousDayClose) / previousDayClose) * 100).toFixed(2),
                    strongStart: lowPrice >= threshold,
                    riskRewardRatio: allocation.riskRewardRatio,
                    ltp: ltp,
                    sl: allocation10.sl,
                    allocations: {
                        10: allocation10,
                        25: allocation25,
                        40: allocation40,
                    },
                };
            } catch (err) {
                console.error(`Error fetching data for ${script.name}`, err);
            }
        }),
    );
    const sortedResults = [...results].sort((a, b) => {
        return b.relativeVolumePercentage - a.relativeVolumePercentage
    });

    return sortedResults;
});


const orders = createSlice({
    name: "orders",
    initialState: {
        orders: [],
        orderMetrics: [],
    },
    reducers: {

    },
    extraReducers: (builder) => {
        builder.addCase(placeSLMOrder.fulfilled, (state, action) => {
            state.orders.push(action.payload);
        });
        builder.addCase(calculateMetricsForScript.fulfilled, (state, action) => {
            state.orderMetrics = action.payload;
        });
    },
});

export default orders.reducer;