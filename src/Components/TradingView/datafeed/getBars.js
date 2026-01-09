import { resolveResolution, getISTDate } from "./utils/dateUtils";
import { transformCandle, isValidResponse } from "./utils/transformers";
import { fetchHistoricalData, fetchIntradayData } from "./services/upstoxApiService";
import { createCacheService } from "./services/cacheService";
import { subscribeBars as subBars, unsubscribeBars as unsubBars } from "./services/subscriptionService";

// Singleton Cache for this Datafeed instance
const barsCache = createCacheService(200);

/**
 * Orchestrator function to fetch and process bars.
 */
export const getBars = async (
  symbolInfo,
  resolution,
  periodParams,
  onHistoryCallback,
  onErrorCallback
) => {
  try {
    const { category, value } = resolveResolution(resolution);
    const instrumentKey = symbolInfo.ticker;
    const isIntraday = ['minutes', 'hours'].includes(category); // "minutes" or "hours"

    const fromMs = periodParams.from * 1000;
    const toMs = periodParams.to * 1000;

    const promises = [];

    // Date Calculations
    const todayStr = getISTDate(Date.now());
    const requestFromStr = getISTDate(fromMs);
    const requestToStr = getISTDate(toMs);

    // Determine if request includes "Today" (Intraday Live Portion)
    const includesToday = (requestToStr >= todayStr) || (toMs >= Date.now());

    // --- 1. Historical Data (Pre-Today) ---
    if (isIntraday && requestFromStr < todayStr) {
      let historicalToDate = todayStr; // Exclusive end for API (usually)

      if (!includesToday) {
        // If purely historical request not touching today
        const reqEndDate = new Date(toMs);
        const reqEndDatePlusOne = new Date(reqEndDate.getTime() + 24 * 60 * 60 * 1000);
        historicalToDate = getISTDate(reqEndDatePlusOne.getTime());
      }

      if (historicalToDate > requestFromStr) {
        const apiCacheKey = `${instrumentKey}-${category}-${value}-${historicalToDate}-${requestFromStr}`;

        if (barsCache.has(apiCacheKey)) {
          promises.push(Promise.resolve(barsCache.get(apiCacheKey)));
        } else {
          promises.push(
            fetchHistoricalData(instrumentKey, category, value, requestFromStr, historicalToDate)
              .then(res => {
                if (isValidResponse(res)) {
                  const bars = res.data.data.candles.map(c => transformCandle(c, resolution));
                  barsCache.set(apiCacheKey, bars);
                  return bars;
                }
                return [];
              })
              .catch(err => {
                console.error("Historical API Error:", err);
                return [];
              })
          );
        }
      }
    } else if (!isIntraday) {
      // Daily/Weekly/Monthly Logic
      const now = new Date();
      const fiveYearsAgo = new Date(now);
      fiveYearsAgo.setFullYear(now.getFullYear() - 5);

      const fromDate = getISTDate(fiveYearsAgo.getTime());
      const toDate = getISTDate(now.getTime());

      const apiCacheKey = `${instrumentKey}-${category}-${value}-${toDate}-${fromDate}`;

      promises.push(
        fetchHistoricalData(instrumentKey, category, value, fromDate, toDate)
          .then(res => {
            if (isValidResponse(res)) {
              return res.data.data.candles.map(c => transformCandle(c, resolution));
            }
            return [];
          })
          .catch(err => {
            console.error("Daily API Error:", err);
            return [];
          })
      );
    }

    // --- 2. Intraday Data (Today) ---
    if (isIntraday && includesToday) {
      promises.push(
        fetchIntradayData(instrumentKey, category, value)
          .then(res => {
            if (isValidResponse(res)) {
              return res.data.data.candles.map(c => transformCandle(c, resolution));
            }
            return [];
          })
          .catch(err => {
            console.error("Intraday API Error:", err);
            return [];
          })
      );
    }

    // --- 3. Merge and Return ---
    const results = await Promise.all(promises);
    let bars = results.flat();

    // Filter nulls/invalid
    bars = bars.filter(b => b && b.time);

    // Sort
    bars.sort((a, b) => a.time - b.time);

    // Deduplicate (Keep last occurrence if distinct, or first. Map guarantees unique keys)
    // Using Map for O(N) dedupe
    const uniqueBarsMap = new Map();
    bars.forEach(b => uniqueBarsMap.set(b.time, b));
    bars = Array.from(uniqueBarsMap.values());

    // Filter Range
    const filteredBars = bars.filter(bar => bar.time >= fromMs && bar.time < toMs);

    // console.log(`[getBars] Returning ${filteredBars.length} bars.`);

    const cutoffTime = new Date('2020-01-01').getTime() / 1000;
    const noData = periodParams.to < cutoffTime;

    onHistoryCallback(filteredBars, { noData });

  } catch (err) {
    console.error("getBars Critical Error:", err);
    onErrorCallback(err);
  }
};

export const subscribeBars = (symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback) => {
  subBars(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback);
};

export const unsubscribeBars = (subscriberUID) => {
  unsubBars(subscriberUID);
};
