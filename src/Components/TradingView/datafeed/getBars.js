import axios from "axios";
import socketEventEmitter from "../../../utils/socketEventEmitter";

// --- Pure Helper Functions ---

/**
 * Maps TradingView resolution to Upstox API format.
 * @param {string} resolution 
 * @returns {{category: string, value: string}}
 */
const resolveResolution = (resolution) => {
  const resNum = parseInt(resolution);

  if (['1D', 'D'].includes(resolution)) return { category: "days", value: "1" };
  if (['1W', 'W'].includes(resolution)) return { category: "weeks", value: "1" };
  if (['1M', 'M'].includes(resolution)) return { category: "months", value: "1" };

  if (!isNaN(resNum)) {
    if (resNum === 60) return { category: "hours", value: "1" };
    return { category: "minutes", value: resolution };
  }

  return { category: "days", value: "1" };
};

/**
 * Calculates the date range for the API call.
 * Pure function: inputs -> outputs, no side effects.
 * @param {object} periodParams 
 * @param {string} category 
 * @returns {{fromDate: string, toDate: string}}
 */
const calculateDateRange = (periodParams, category) => {
  const { to } = periodParams;
  const isIntraday = ['minutes', 'hours', 'minute', 'hour'].includes(category);

  // Robust formatter for YYYY-MM-DD in IST
  const formatYMD = (timestamp) => {
    // Add 5h 30m to get IST time from UTC timestamp
    const istDate = new Date(timestamp + (5.5 * 60 * 60 * 1000));
    return istDate.toISOString().split('T')[0];
  };

  if (isIntraday) {
    let toMs = to * 1000;

    // pagination check:
    // If 'to' is near market open (09:15-09:30 IST), TradingView likely wants previous day's data
    // Calculate hours/minutes in IST
    const istDate = new Date(toMs + (5.5 * 60 * 60 * 1000));
    const hours = istDate.getUTCHours();
    const minutes = istDate.getUTCMinutes();

    // If before 09:30 IST, fetch previous day
    // (Market starts 09:15. If request is 09:15, we need PREVIOUS day to show history)
    if (hours < 9 || (hours === 9 && minutes < 30)) {
      toMs -= 24 * 60 * 60 * 1000;
    }

    // toMs now represents the "Target Day" we want to fetch details for.
    // Upstox API: /to_date/from_date where range is [from_date, to_date)
    // To fetch data for "2025-01-08", we need from=2025-01-08, to=2025-01-09.

    const fromDateStr = formatYMD(toMs);
    const toDateStr = formatYMD(toMs + (24 * 60 * 60 * 1000));

    return {
      fromDate: fromDateStr,
      toDate: toDateStr
    };
  }

  // Daily/Weekly/Monthly -> 5 years
  const now = new Date();
  const fiveYearsAgo = new Date(now);
  fiveYearsAgo.setFullYear(now.getFullYear() - 5);

  return {
    fromDate: formatYMD(fiveYearsAgo.getTime()),
    toDate: formatYMD(now.getTime())
  };
};

/**
 * Adjusts time for daily bars to align with market open.
 * @param {number} originalTime 
 * @param {string} resolution 
 * @param {string} dateStr 
 * @returns {number}
 */
const adjustDailyBarTime = (originalTime, resolution, dateStr) => {
  const isDaily = ['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution);
  if (isDaily) {
    // Set to 09:15 IST (03:45 UTC) to ensure consistent TV rendering
    return new Date(`${dateStr}T03:45:00Z`).getTime();
  }
  return originalTime;
};

/**
 * Transforms a single API candle to a TradingView bar.
 * @param {Array} candle 
 * @param {string} resolution 
 * @returns {object}
 */
const transformCandle = (candle, resolution) => {
  const [timestampStr, open, high, low, close, volume] = candle;
  const dateStr = timestampStr.split('T')[0];
  const rawTime = new Date(timestampStr).getTime();

  return {
    time: adjustDailyBarTime(rawTime, resolution, dateStr),
    open,
    high,
    low,
    close,
    volume
  };
};

/**
 * Validates the API response structure.
 * @param {object} response 
 * @returns {boolean}
 */
const isValidResponse = (response) => {
  return response?.data?.status === "success" && Array.isArray(response?.data?.data?.candles);
};

// --- State Management Services ---

const createCacheService = (maxSize = 100) => {
  const cache = new Map();

  return {
    get: (key) => cache.get(key),
    set: (key, value) => {
      if (cache.size >= maxSize) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
      cache.set(key, value);
    },
    has: (key) => cache.has(key)
  };
};

const createSubscriptionManager = () => {
  const subscribers = new Map();

  return {
    add: (uid, config) => subscribers.set(uid, config),
    remove: (uid) => subscribers.delete(uid),
    getAll: () => Array.from(subscribers.values())
  };
};

// Instantiate singleton services for this module
const barsCache = createCacheService();
const subManager = createSubscriptionManager();

// --- Main Exported Functions ---

export const getBars = async (
  symbolInfo,
  resolution,
  periodParams,
  onHistoryCallback,
  onErrorCallback
) => {
  try {
    console.log("getBars called", { symbolInfo, resolution, periodParams });

    const { category, value } = resolveResolution(resolution);
    const { fromDate, toDate } = calculateDateRange(periodParams, category);
    const instrumentKey = symbolInfo.ticker;

    // Cache key specific to this date chunk
    const cacheKey = `${instrumentKey}-${category}-${value}-${fromDate}-${toDate}`;

    // 1. Check Cache
    if (barsCache.has(cacheKey)) {
      const cachedBars = barsCache.get(cacheKey);

      const fromMs = periodParams.from * 1000;
      const toMs = periodParams.to * 1000;
      const filteredBars = cachedBars.filter(bar => bar.time >= fromMs && bar.time < toMs);

      console.log(`[getBars] Cache hit for ${cacheKey}. Total: ${cachedBars.length}, Filtered: ${filteredBars.length}`);
      setTimeout(() => {
        // If filteredBars is empty but we have cached data for this day, it just means the requested slice is empty.
        const cutoffTime = new Date('2020-01-01').getTime() / 1000;
        const isEndHistory = periodParams.to < cutoffTime;
        onHistoryCallback(filteredBars, { noData: isEndHistory });
      }, 0);
      return;
    }

    // 2. Fetch Data
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `https://api.upstox.com/v3/historical-candle/${encodedKey}/${category}/${value}/${toDate}/${fromDate}`;
    console.log(`[getBars] Fetching URL: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`
      }
    });

    // 3. Process Response
    if (isValidResponse(response)) {
      const { candles } = response.data.data;

      const bars = candles
        .map(candle => transformCandle(candle, resolution))
        .sort((a, b) => a.time - b.time);

      barsCache.set(cacheKey, bars); // Cache the full day/chunk

      const fromMs = periodParams.from * 1000;
      const toMs = periodParams.to * 1000;
      const filteredBars = bars.filter(bar => bar.time >= fromMs && bar.time < toMs);

      console.log(`[getBars] Fetched ${bars.length} bars. Last bar time: ${new Date(bars[bars.length - 1]?.time).toLocaleString()}. Filtered: ${filteredBars.length}`);

      // Determine if we have reached the end of allowed history (e.g., year 2020)
      const cutoffTime = new Date('2020-01-01').getTime() / 1000;
      const isEndHistory = periodParams.to < cutoffTime;

      // Return all bars found in this date range. 
      setTimeout(() => {
        onHistoryCallback(filteredBars, { noData: isEndHistory });
      }, 0);
    } else {
      console.log(`[getBars] No valid candles in response. Passing empty.`);

      const cutoffTime = new Date('2020-01-01').getTime() / 1000;
      const isEndHistory = periodParams.to < cutoffTime;

      setTimeout(() => {
        onHistoryCallback([], { noData: isEndHistory });
      }, 0);
    }

  } catch (err) {
    console.error("Error fetching bars:", err);
    onErrorCallback(err);
  }
};

export const subscribeBars = (
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback
) => {
  subManager.add(subscriberUID, {
    symbolInfo,
    resolution,
    onRealtimeCallback
  });
};

export const unsubscribeBars = (subscriberUID) => {
  subManager.remove(subscriberUID);
};

// --- Socket Event Handling ---

const handleMarketData = (data) => {
  if (!data?.feeds) return;

  const subscribers = subManager.getAll();

  subscribers.forEach(({ symbolInfo, onRealtimeCallback, resolution }) => {
    const instrumentKey = symbolInfo.ticker;
    const feed = data.feeds[instrumentKey];

    // Support both fullFeed and abbreviated ff
    const marketFF = feed?.fullFeed?.marketFF || feed?.ff?.marketFF;

    if (!marketFF) return;

    const ltp = marketFF.ltpc?.ltp;
    if (!ltp) return;

    const tradeTime = parseInt(marketFF.ltpc?.ltt);
    const ohlcData = marketFF.marketOHLC?.ohlc;
    const dailyOHLC = ohlcData?.find(d => d.interval === '1d');

    // Determine bar time and OHL data
    let barTime;
    let barData;

    const isDaily = ['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution);

    if (dailyOHLC) {
      // Calculation for Bar Time
      if (isDaily) {
        const tradeTs = tradeTime || Date.now();
        const dateStr = new Date(tradeTs).toISOString().split('T')[0];
        barTime = new Date(`${dateStr}T03:45:00Z`).getTime();
      } else {
        barTime = dailyOHLC.ts;
        if (!barTime) {
          const tradeTs = tradeTime || Date.now();
          barTime = new Date(new Date(tradeTs).toISOString().split('T')[0]).getTime();
        }
      }

      barData = {
        open: dailyOHLC.open,
        high: dailyOHLC.high,
        low: dailyOHLC.low,
        close: dailyOHLC.close,
        volume: dailyOHLC.vol
      };
    } else {
      // Fallback to LTP
      barTime = tradeTime;
      barData = {
        open: ltp,
        high: ltp,
        low: ltp,
        close: ltp,
        volume: 0
      };
    }

    onRealtimeCallback({
      time: barTime,
      ...barData
    });
  });
};

socketEventEmitter.on('market-data', handleMarketData);
