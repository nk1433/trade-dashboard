import axios from "axios";
import socketEventEmitter from "../../../utils/socketEventEmitter";

// Map TradingView resolution to Upstox API format
const getIntervalParams = (resolution) => {
  if (resolution === "1D" || resolution === "D") return { category: "days", value: "1" };
  if (resolution === "1W" || resolution === "W") return { category: "weeks", value: "1" };
  if (resolution === "1M" || resolution === "M") return { category: "months", value: "1" };

  // Minute resolutions
  const resNum = parseInt(resolution);
  if (!isNaN(resNum)) {
    if (resNum === 60) return { category: "hours", value: "1" };
    return { category: "minutes", value: resolution };
  }

  return { category: "days", value: "1" }; // Default
};

// Simple in-memory cache
const barsCache = new Map();

export const getBars = async (
  symbolInfo,
  resolution,
  periodParams,
  onHistoryCallback,
  onErrorCallback
) => {
  try {
    const { from, to } = periodParams;
    const instrumentKey = symbolInfo.ticker;
    const { category, value } = getIntervalParams(resolution);

    // Upstox API expects dates in YYYY-MM-DD format
    // User requested: current year from year starting to the current day
    const now = new Date();
    const currentYear = now.getFullYear();
    const fromDate = `${currentYear}-01-01`;
    const toDate = now.toISOString().split('T')[0];

    // Create a cache key based on the fixed YTD range
    const cacheKey = `${instrumentKey}-${category}-${value}-${fromDate}-${toDate}`;

    if (barsCache.has(cacheKey)) {
      const cachedBars = barsCache.get(cacheKey);

      // Filter bars to match the requested period
      const fromMs = from * 1000;
      const toMs = to * 1000;
      const filteredBars = cachedBars.filter(bar => bar.time >= fromMs && bar.time < toMs);


      onHistoryCallback(filteredBars, { noData: filteredBars.length === 0 });
      return;
    }

    // Constructing the URL for historical candles
    // Format: https://api.upstox.com/v3/historical-candle/{instrumentKey}/{interval_category}/{interval_value}/{to_date}/{from_date}
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `https://api.upstox.com/v3/historical-candle/${encodedKey}/${category}/${value}/${toDate}/${fromDate}`;


    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`
      }
    });


    if (response.data && response.data.status === "success" && response.data.data && response.data.data.candles) {
      const candles = response.data.data.candles;

      const bars = candles.map(candle => {
        let time = new Date(candle[0]).getTime();

        // Fix for Daily bars: Align to Market Open (09:15 IST)
        // This ensures the bar is correctly attributed to the trading day in TradingView (Asia/Kolkata)
        const res = resolution;
        if (res === '1D' || res === 'D' || res === '1W' || res === 'W' || res === '1M' || res === 'M') {
          const dateStr = candle[0].split('T')[0];
          // Set to 09:15 IST (03:45 UTC)

          time = new Date(`${dateStr}T03:45:00Z`).getTime();

        }

        return {
          time: time,
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
          volume: candle[5]
        };
      });

      // Sort bars by time ascending (Upstox returns descending usually, TV needs ascending)
      bars.sort((a, b) => a.time - b.time);

      // Cache the result
      barsCache.set(cacheKey, bars);

      // Clear cache if it gets too big (simple eviction)
      if (barsCache.size > 100) {
        const firstKey = barsCache.keys().next().value;
        barsCache.delete(firstKey);
      }

      // Filter bars to match the requested period
      const fromMs = from * 1000;
      const toMs = to * 1000;
      const filteredBars = bars.filter(bar => bar.time >= fromMs && bar.time < toMs);


      if (filteredBars.length === 0) {
        onHistoryCallback([], { noData: true });
      } else {
        onHistoryCallback(filteredBars, { noData: false });
      }
    } else {
      onHistoryCallback([], { noData: true });
    }
  } catch (err) {
    console.error("Error fetching bars:", err);
    onErrorCallback(err);
  }
};

const subscribers = {};

export const subscribeBars = (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback
) => {

  if (!subscribers[subscriberUID]) {
    subscribers[subscriberUID] = {
      symbolInfo,
      resolution,
      onRealtimeCallback
    };
  }
};

export const unsubscribeBars = (subscriberUID) => {
  delete subscribers[subscriberUID];
};

// Listen to socket events
// Listen to socket events
// Listen to socket events
socketEventEmitter.on('market-data', (data) => {
  // data is the decoded protobuf message
  // Structure: { feeds: { "instrument_key": { ... } } }

  if (!data || !data.feeds) return;

  Object.values(subscribers).forEach(subscriber => {
    const { symbolInfo, onRealtimeCallback, resolution } = subscriber;
    const instrumentKey = symbolInfo.ticker;

    const feed = data.feeds[instrumentKey];

    // Check for fullFeed (used in useUpstoxWS) or ff (abbreviation)
    const marketFF = feed?.fullFeed?.marketFF || feed?.ff?.marketFF;

    if (marketFF) {
      const ltp = marketFF.ltpc?.ltp;
      const tradeTime = parseInt(marketFF.ltpc?.ltt); // Last trade time

      // Try to get daily OHLC if available
      const ohlcData = marketFF.marketOHLC?.ohlc;
      const dailyOHLC = ohlcData ? ohlcData.find(d => d.interval === '1d') : null;

      if (dailyOHLC && ltp) {
        // If we have daily OHLC, use it for the candle shape
        // For daily resolution, we must use the start of the day timestamp

        // Calculate start of day timestamp (IST)
        // Assuming tradeTime is in ms. If it's epoch, we can use it to find the day start.
        // Upstox timestamps are usually in ms.

        let barTime;
        if (['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution)) {
          // Force align to 09:15 IST (03:45 UTC) to match getBars logic
          // Use trade time (LTT) to determine the date, as dailyOHLC.ts can be misleading (00:00 IST)
          const tradeTs = parseInt(marketFF.ltpc?.ltt) || Date.now();
          const tradeDate = new Date(tradeTs);
          // Indian market hours are entirely within one UTC day (03:45 - 10:00 UTC)
          const dateStr = tradeDate.toISOString().split('T')[0];
          barTime = new Date(`${dateStr}T03:45:00Z`).getTime();
        } else {
          barTime = dailyOHLC.ts;
          if (!barTime) {
            const tradeTs = parseInt(marketFF.ltpc?.ltt) || Date.now();
            const tradeDate = new Date(tradeTs);
            const dateStr = tradeDate.toISOString().split('T')[0];
            barTime = new Date(dateStr).getTime();
          }
        }

        onRealtimeCallback({
          time: barTime,
          open: dailyOHLC.open,
          high: dailyOHLC.high,
          low: dailyOHLC.low,
          close: dailyOHLC.close, // or ltp, but dailyOHLC.close should be the latest price for the day
          volume: dailyOHLC.vol
        });
      } else if (ltp) {
        // Fallback if no daily OHLC (e.g. only LTP update)
        // This will create a flat candle if used for a new bar
        onRealtimeCallback({
          time: tradeTime,
          close: ltp,
          open: ltp,
          high: ltp,
          low: ltp,
          volume: 0
        });
      }
    }
  });
});
