import { useMarketDataSocket } from "./useMarketDataSocket";
import { computeMetrics } from "../Store/upstoxs";
import { useMarketFeedUrl } from "./useMarketFeedUrl";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";

const token = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

export const updateWatchlistWithMetrics = async (liveFeed, scriptMap, portfolio, stats) => {
  const entries = Object.entries(liveFeed.feeds);

  const results = await entries.reduce(async (accP, [instrumentKey, script]) => {
    const acc = await accP;

    const latestFeed = script.fullFeed?.marketFF?.marketOHLC?.ohlc.find(feed => feed.interval === '1d');
    if (!latestFeed) return acc;

    const prevStats = stats[instrumentKey] || {};
    const prevDayVolume = prevStats.prevDayVolume || 0;
    const prevDayClose = prevStats.lastPrice || 0;

    const currentClose = latestFeed.close;
    const currentVolume = latestFeed.vol;

    const priceRatio = prevDayClose > 0 ? currentClose / prevDayClose : 0;

    // Compute full metrics
    const metric = await computeMetrics({
      scriptName: scriptMap[instrumentKey]?.name || '',
      instrumentKey,
      size: portfolio.portfolioSize,
      riskOfPortfolio: portfolio.riskPercentage,
      currentDayOpen: latestFeed.open,
      lowPrice: latestFeed.low,
      currentVolume,
      high: latestFeed.high,
      ltp: currentClose,
      stats,
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