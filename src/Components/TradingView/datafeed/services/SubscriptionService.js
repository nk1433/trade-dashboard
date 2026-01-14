import socketEventEmitter from "../../../../utils/socketEventEmitter";
import store from "../../../../Store";

const createSubscriptionManager = () => {
    const subscribers = new Map();

    return {
        add: (uid, config) => subscribers.set(uid, config),
        remove: (uid) => subscribers.delete(uid),
        getAll: () => Array.from(subscribers.values()),
        get: (uid) => subscribers.get(uid)
    };
};

export const subManager = createSubscriptionManager();

const calculateBarTime = (tradeTime, resolution, isDaily, dailyOHLC) => {
    // If Daily, use daily logic
    if (isDaily && dailyOHLC) {
        const dateStr = new Date(tradeTime).toISOString().split('T')[0];
        // 09:15 IST equivalent in UTC for generic day start provided 
        // (or relying on upstream dateStr logic)
        return new Date(`${dateStr}T03:45:00Z`).getTime();
    }

    // If Intraday, snap to resolution
    if (!isDaily) {
        const resInMinutes = parseInt(resolution);
        const resInMs = (!isNaN(resInMinutes) ? resInMinutes : 1) * 60 * 1000;
        return Math.floor(tradeTime / resInMs) * resInMs;
    }

    // Default Daily Fallback
    const dateStr = new Date(tradeTime).toISOString().split('T')[0];
    return new Date(`${dateStr}T03:45:00Z`).getTime();
};

const handleMarketData = (data) => {
    if (!data?.feeds) return;

    const subscribers = subManager.getAll();

    subscribers.forEach((subscriber) => {
        const { symbolInfo, onRealtimeCallback, resolution, uid } = subscriber;
        const instrumentKey = symbolInfo.ticker;
        const feed = data.feeds[instrumentKey];

        const marketFF = feed?.fullFeed?.marketFF || feed?.ff?.marketFF;
        if (!marketFF) return;

        const ltp = marketFF.ltpc?.ltp;
        if (!ltp) return;

        const tradeTime = parseInt(marketFF.ltpc?.ltt) || Date.now();
        const ohlcData = marketFF.marketOHLC?.ohlc;
        const dailyOHLC = ohlcData?.find(d => d.interval === '1d');

        const isDaily = ['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution);

        // Pure calculation derived
        const barTime = calculateBarTime(tradeTime, resolution, isDaily, dailyOHLC);

        let barData;
        if (isDaily && dailyOHLC) {
            barData = {
                open: dailyOHLC.open,
                high: dailyOHLC.high,
                low: dailyOHLC.low,
                close: dailyOHLC.close, // Using close from OHLC for daily
                volume: dailyOHLC.vol
            };
        } else {
            // Intraday Logic: stateful update
            let lastBar = subscriber.lastBar;

            // Check if we are still in the same bar
            if (lastBar && lastBar.time === barTime) {
                barData = {
                    open: lastBar.open,
                    high: Math.max(lastBar.high, ltp),
                    low: Math.min(lastBar.low, ltp),
                    close: ltp,
                    volume: lastBar.volume // We assume volume is cumulative or we don't handle it for ticks yet
                };
            } else {
                // New Bar or First Bar
                barData = {
                    open: ltp,
                    high: ltp,
                    low: ltp,
                    close: ltp,
                    volume: 0
                };
            }

            // Update local state
            subscriber.lastBar = { time: barTime, ...barData };
        }

        onRealtimeCallback({
            time: barTime,
            ...barData
        });
    });
};

// Initialize listener
socketEventEmitter.on('market-data', handleMarketData);

export const subscribeBars = (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
    subManager.add(subscriberUID, {
        symbolInfo,
        resolution,
        onRealtimeCallback
    });

    // Immediate tick update from Store to prevent lag and flickering (thin line)
    try {
        const state = store.getState();
        const liveFeed = state.orders?.liveFeed; // Array of updates, need to find latest
        // liveFeed is an array in the slice, but updated via 'unshift'. 
        // Actually, 'orders.liveFeed' in redux slice seems to be a list of recent updates?
        // Let's check upstoxs.js again. 'liveFeed: []', setLiveFeed unshifts.
        // But 'updateWatchlistWithMetrics' uses 'feeds' object structure.
        // Wait, 'updateWatchlistWithMetrics' is called with 'response' which is the raw protobuf message.
        // It updates 'metrics', 'bullishMB' etc.
        // It does NOT seem to store the full 'feeds' object in a way that is easily accessible by key in 'orders' slice?
        // 'orders.liveFeed' is an array. Searching it every time might be slow if large.
        // HOWEVER, 'orders.orderMetrics' DOES contain 'dayHigh', 'dayLow', 'dayVolume' which comes from 'latestDayFeed'.

        // BETTER APPROACH:
        // 'orderMetrics' already has 'currentDayOpen', 'dayHigh', 'dayLow', 'ltp'.
        // For DAILY charts, this is sufficient to construct the full bar!
        // For INTRADAY, we don't have the 1-min open/high/low in 'orderMetrics' explicitly?
        // Let's check 'upstoxs.js' computeMetrics call.
        // It passes 'currentMinuteVolume'.
        // It does NOT seem to pass 1-min OHLC to 'metric' object.

        // So for Daily, we can use orderMetrics.
        // For Intraday, we are stuck with LTP unless we dig into 'orders.liveFeed' array or change the store.

        // Given 'liveFeed' is likely small (recent updates), we can try to find the instrument in it?
        // Or just fix the DAILY chart first as that's the most likely use case for "body and flick".

        const metrics = state.orders?.orderMetrics;
        const instrumentKey = symbolInfo.ticker;
        const metric = metrics?.[instrumentKey];

        if (metric && metric.ltp) {
            const tradeTime = Date.now();
            const isDaily = ['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution);
            const barTime = calculateBarTime(tradeTime, resolution, isDaily, null);

            if (isDaily) {
                // For Daily, we have the full OHLC data in metrics (mapped from 'latestDayFeed')
                // metric.currentDayOpen is 'open', metric.dayHigh, metric.dayLow, metric.ltp is close
                onRealtimeCallback({
                    time: barTime,
                    open: metric.currentDayOpen || metric.ltp,
                    high: metric.dayHigh || metric.ltp,
                    low: metric.dayLow || metric.ltp,
                    close: metric.ltp,
                    volume: metric.dayVolume || 0
                });
            } else {
                // For Intraday, we skip the immediate tick to avoid the "Line then Bar" flickering artifact.
                // Sending a flat bar (Open=LTP) causes the flicker.
                // Waiting for the socket (millis/seconds) is better visually than the flickering line.
            }
        }
    } catch (e) {
        console.error("Immediate tick error", e);
    }
};

export const unsubscribeBars = (subscriberUID) => {
    subManager.remove(subscriberUID);
};
