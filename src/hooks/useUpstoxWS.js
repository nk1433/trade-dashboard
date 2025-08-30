import { useMarketDataSocket } from "./useMarketDataSocket";
import { useSelector, useDispatch } from "react-redux";
import { computeMetrics } from "../Store/upstoxs";
import { setOrderMetrics } from "../Store/upstoxs";
import { useEffect } from "react";
import { useMarketFeedUrl } from "./useMarketFeedUrl";

const token = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

export const useUpstoxWS = () => {
  const scripts = JSON.parse(localStorage.getItem('scripts')) || [];
  const instruments = scripts.map((script) => script.instrument_key);
  const scriptMap = scripts.reduce((acc, script) => {
    acc[script.instrument_key] = script;

    return acc;
  }, {});
  const portfolio = useSelector((state) => state.portfolio);
  const dispatch = useDispatch();

  const { wsUrl } = useMarketFeedUrl(token);
  const { feedData } = useMarketDataSocket({
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

  useEffect(() => {
    if (!feedData.length) return;
    const lastTick = feedData[feedData.length - 1];

    if (lastTick?.type === 0 && lastTick.feeds) {
      (async () => {
        const results = await Promise.all(
          Object.entries(lastTick.feeds).map(async ([instrumentKey, script]) => {
            const latestFeed = script.fullFeed.marketFF.marketOHLC.ohlc.find((feed) => feed.interval === '1d');

            return computeMetrics({
              scriptName: scriptMap[instrumentKey]?.name || '',
              instrumentKey,
              size: portfolio.portfolioSize,
              riskOfPortfolio: portfolio.riskPercentage,
              currentDayOpen: latestFeed.open,
              lowPrice: latestFeed.low,
              currentVolume: latestFeed.vol,
              high: latestFeed.high,
              ltp: latestFeed.close,
            });
          })
        );
        dispatch(setOrderMetrics(results));
      })();
    }
  }, [feedData, scriptMap, portfolio, dispatch]);
};