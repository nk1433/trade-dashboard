import { useMarketDataSocket } from "./useMarketDataSocket";
import { useMarketFeedUrl } from "./useMarketFeedUrl";
import universe from "../index/universe.json";
import { usePortfolioDataSocket } from "./usePorfolio";
import { usePortfolioSocket } from "./usePortfolioSocket";
import { isUpstoxsWs } from "../utils/config";
import { useSandboxWS } from "./useSandboxWS";



export const useUpstoxWS = (token, isReady = true) => {
  const scripts = universe;
  const instruments = scripts.map((script) => script.instrument_key);

  const { wsUrl } = useMarketFeedUrl(token);
  const { porfolioWsUrl } = usePortfolioSocket(token);

  const request = {
    guid: "someguid",
    method: "sub",
    data: {
      mode: "full",
      instrumentKeys: instruments,
    },
  };

  useMarketDataSocket({
    wsUrl: (isUpstoxsWs && isReady) ? wsUrl : null, // Disable if sandbox or not ready
    request: (isUpstoxsWs && isReady) ? request : null
  });

  useSandboxWS({
    request: (!isUpstoxsWs && isReady) ? request : null // Enable if sandbox
  });

  usePortfolioDataSocket({ porfolioWsUrl: isReady ? porfolioWsUrl : null });
};