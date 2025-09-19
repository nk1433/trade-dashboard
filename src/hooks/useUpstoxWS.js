import { useMarketDataSocket } from "./useMarketDataSocket";
import { computeMetrics } from "../Store/upstoxs";
import { useMarketFeedUrl } from "./useMarketFeedUrl";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";

const token = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

export const updateWatchlistWithMetrics = async (liveFeed, scriptMap, portfolio, stats) => {
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

    const currentClose = latestDayFeed.close;
    const currentVolume = latestDayFeed.vol;
    const currentMinuteVolume = latestMinuteFeed.vol;

    const priceRatio = prevDayClose > 0 ? currentClose / prevDayClose : 0;

    // Volume surge rate (minute vs daily)
    // This shows what fraction of today's volume just happened in the last minute
    const volSurgeRate =
      currentVolume > 0 ? (currentMinuteVolume / currentVolume) * 100 : 0;

    // You can also use daily average minute volume, for example:
    // const avgMinuteVolume = currentVolume / totalTradingMinutesSoFarToday;

    const metric = await computeMetrics({
      scriptName: scriptMap[instrumentKey]?.name || '',
      symbol: scriptMap[instrumentKey]?.tradingsymbol,
      instrumentKey,
      size: portfolio.portfolioSize,
      riskOfPortfolio: portfolio.riskPercentage,
      currentDayOpen: latestDayFeed.open,
      lowPrice: latestDayFeed.low,
      currentVolume,
      high: latestDayFeed.high,
      ltp: currentClose,
      stats,
      volSurgeRate, // percent of today's volume just in the last minute
      currentMinuteVolume,
    });

    if (!acc.metrics) acc.metrics = {};
    if (!acc.bullishMB) acc.bullishMB = {};
    if (!acc.bearishMB) acc.bearishMB = {};

    acc.metrics[instrumentKey] = metric;

    if (priceRatio >= 1.04 && currentVolume > prevDayVolume && currentVolume >= 100000) {
      acc.bullishMB[instrumentKey] = metric;
    }

    if (priceRatio <= 0.96 && currentVolume > prevDayVolume && currentVolume >= 100000) {
      acc.bearishMB[instrumentKey] = metric;
    }

    return acc;
  }, Promise.resolve({ metrics: {}, bullishMB: {}, bearishMB: {} }));

  return results;
};

export const useUpstoxWS = () => {
  const scripts = niftymidsmall400float;
  const instruments = scripts.map((script) => script.instrument_key);

  const { wsUrl } = useMarketFeedUrl(token);
  useMarketDataSocket({
    wsUrl,
    request: {
      guid: "someguid",
      method: "sub",
      data: {
        mode: "full",
        instrumentKeys: instruments,
      },
    }
  });
};