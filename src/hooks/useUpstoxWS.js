import { useMarketDataSocket } from "./useMarketDataSocket";
import { computeMetrics } from "../Store/upstoxs";
import { useMarketFeedUrl } from "./useMarketFeedUrl";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";

const token = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

export const updateWatchlistWithMetrics = async (liveFeed, scriptMap, portfolio, stats) => {
  const results = await Promise.all(
    Object.entries(liveFeed.feeds).map(async ([instrumentKey, script]) => {
      const latestFeed = script.fullFeed.marketFF.marketOHLC.ohlc.find((feed) => feed.interval === '1d');

      const metric = await computeMetrics({
        scriptName: scriptMap[instrumentKey]?.name || '',
        instrumentKey,
        size: portfolio.portfolioSize,
        riskOfPortfolio: portfolio.riskPercentage,
        currentDayOpen: latestFeed.open,
        lowPrice: latestFeed.low,
        currentVolume: latestFeed.vol,
        high: latestFeed.high,
        ltp: latestFeed.close,
        stats,
      });

      return [instrumentKey, metric];
    })
  );

  return Object.fromEntries(results);
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