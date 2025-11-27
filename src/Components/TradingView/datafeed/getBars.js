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
      console.log(`[getBars] Cache hit for ${cacheKey}`);
      const cachedBars = barsCache.get(cacheKey);

      // Filter bars to match the requested period
      const fromMs = from * 1000;
      const toMs = to * 1000;
      const filteredBars = cachedBars.filter(bar => bar.time >= fromMs && bar.time < toMs);

      console.log(`[getBars] Requested: ${new Date(fromMs).toISOString()} to ${new Date(toMs).toISOString()}`);
      console.log(`[getBars] Returning ${filteredBars.length} bars from cache (Total: ${cachedBars.length})`);

      onHistoryCallback(filteredBars, { noData: filteredBars.length === 0 });
      return;
    }

    // Constructing the URL for historical candles
    // Format: https://api.upstox.com/v3/historical-candle/{instrumentKey}/{interval_category}/{interval_value}/{to_date}/{from_date}
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `https://api.upstox.com/v3/historical-candle/${encodedKey}/${category}/${value}/${toDate}/${fromDate}`;

    console.log("[getBars] Fetching URL:", url);

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`
      }
    });

    console.log("[getBars] Response status:", response.status);
    // console.log("[getBars] Response data:", response.data);

    if (response.data && response.data.status === "success" && response.data.data && response.data.data.candles) {
      const candles = response.data.data.candles;
      console.log("[getBars] Candles found:", candles.length);

      const bars = candles.map(candle => ({
        time: new Date(candle[0]).getTime(),
        open: candle[1],
        high: candle[2],
        low: candle[3],
        close: candle[4],
        volume: candle[5]
      }));

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

      console.log(`[getBars] Requested: ${new Date(fromMs).toISOString()} to ${new Date(toMs).toISOString()}`);
      console.log(`[getBars] Returning ${filteredBars.length} bars from fetch (Total: ${bars.length})`);

      if (filteredBars.length === 0) {
        console.log("[getBars] No bars in requested range");
        onHistoryCallback([], { noData: true });
      } else {
        onHistoryCallback(filteredBars, { noData: false });
      }
    } else {
      console.log("[getBars] Invalid response structure or status");
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
  // console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);

  if (!subscribers[subscriberUID]) {
    subscribers[subscriberUID] = {
      symbolInfo,
      resolution,
      onRealtimeCallback
    };
  }
};

export const unsubscribeBars = (subscriberUID) => {
  // console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
  delete subscribers[subscriberUID];
};

// Listen to socket events
socketEventEmitter.on('market-data', (data) => {
  // data is the decoded protobuf message
  // Structure: { feeds: { "instrument_key": { ... } } }

  if (!data || !data.feeds) return;

  Object.values(subscribers).forEach(subscriber => {
    const { symbolInfo, onRealtimeCallback } = subscriber;
    const instrumentKey = symbolInfo.ticker;

    const feed = data.feeds[instrumentKey];
    if (feed && feed.ff && feed.ff.marketFF && feed.ff.marketFF.ltpc && feed.ff.marketFF.ltpc.ltp) {
      const ltp = feed.ff.marketFF.ltpc.ltp;
      const tradeTime = parseInt(feed.ff.marketFF.ltpc.ltt); // Last trade time

      onRealtimeCallback({
        time: tradeTime,
        close: ltp,
        open: ltp, // Approximation for realtime tick
        high: ltp,
        low: ltp,
        volume: 0 // Volume might be available elsewhere in the feed
      });
    }
  });
});
