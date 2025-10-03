import { useMarketDataSocket } from "./useMarketDataSocket";
import { computeMetrics } from "../Store/upstoxs";
import { useMarketFeedUrl } from "./useMarketFeedUrl";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";
import { usePortfolioDataSocket } from "./usePorfolio";
import { usePortfolioSocket } from "./usePortfolioSocket";

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
    // Newly added metrics from stats
    const minVolume3d = prevStats.minVolume3d || 0;
    const trendIntensity = parseFloat(prevStats.trendIntensity) || 0;
    const closePrev1 = parseFloat(prevStats.closePrev1) || 0;
    const closePrev2 = parseFloat(prevStats.closePrev2) || 0;

    const currentClose = latestDayFeed.close;
    const currentVolume = latestDayFeed.vol;
    const currentMinuteVolume = latestMinuteFeed.vol;

    const priceRatio = prevDayClose > 0 ? currentClose / prevDayClose : 0;

    // Volume surge rate (minute vs daily)
    const volSurgeRate = currentVolume > 0 ? (currentMinuteVolume / currentVolume) * 100 : 0;

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
      volSurgeRate,
      currentMinuteVolume,
    });

    if (!acc.metrics) acc.metrics = {};
    if (!acc.bullishMB) acc.bullishMB = {};
    if (!acc.bearishMB) acc.bearishMB = {};
    if (!acc.bullishSLTB) acc.bullishSLTB = {};
    if (!acc.bearishSLTB) acc.bearishSLTB = {};
    if (!acc.bullishAnts) acc.bullishAnts = {};

    acc.metrics[instrumentKey] = metric;

    if (priceRatio >= 1.04 && currentVolume > prevDayVolume && currentVolume >= 100000) {
      acc.bullishMB[instrumentKey] = metric;
    }

    if (priceRatio <= 0.96 && currentVolume > prevDayVolume && currentVolume >= 100000) {
      acc.bearishMB[instrumentKey] = metric;
    }

    if (
      minVolume3d > 100000 &&
      trendIntensity >= 1.05 &&
      latestDayFeed.close > latestDayFeed.open &&
      latestDayFeed.close > closePrev1 &&
      latestDayFeed.close / closePrev1 > closePrev1 / closePrev2 &&
      closePrev1 / closePrev2 < 1.02 &&
      closePrev1 > closePrev2 &&
      latestDayFeed.close > 100
    ) {
      acc.bullishSLTB[instrumentKey] = metric;
    }

    if (
      closePrev1 / closePrev2 >= 0.98 &&
      latestDayFeed.close / closePrev1 < closePrev1 / closePrev2 &&
      latestDayFeed.close < closePrev1 &&
      latestDayFeed.close < latestDayFeed.open &&
      minVolume3d >= 100000 &&
      (latestDayFeed.close - latestDayFeed.low) / (latestDayFeed.high - latestDayFeed.low) < 0.2 &&
      latestDayFeed.close > 100
    ) {
      acc.bearishSLTB[instrumentKey] = metric;
    }

    if (
      minVolume3d > 100000 &&
      trendIntensity >= 1.05 &&
      priceRatio > -0.01 &&
      priceRatio < 0.01
    ) {
      acc.bullishAnts[instrumentKey] = metric;
    }

    return acc;
  }, Promise.resolve({
    metrics: {}, bullishMB: {}, bearishMB: {},
    bullishSLTB: {}, bearishSLTB: {}, bullishAnts: {},
  }));

  return results;
};

export const useUpstoxWS = () => {
  const scripts = niftymidsmall400float;
  const instruments = scripts.map((script) => script.instrument_key);

  const { wsUrl } = useMarketFeedUrl(token);
  const { porfolioWsUrl } = usePortfolioSocket(token);
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
  usePortfolioDataSocket({ porfolioWsUrl });
};