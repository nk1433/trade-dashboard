import socketEventEmitter from "../../../../utils/socketEventEmitter";

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
};

export const unsubscribeBars = (subscriberUID) => {
    subManager.remove(subscriberUID);
};
