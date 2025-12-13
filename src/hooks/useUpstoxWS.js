import { useMarketDataSocket } from "./useMarketDataSocket";
import { useMarketFeedUrl } from "./useMarketFeedUrl";
import niftymidsmall400float from "../index/niftymidsmall400-float.json";
import { usePortfolioDataSocket } from "./usePorfolio";
import { usePortfolioSocket } from "./usePortfolioSocket";
import niftylargeCap from '../index/niftylargecap.json';
import { isUpstoxsWs } from "../utils/config";
import { useSandboxWS } from "./useSandboxWS";



export const useUpstoxWS = (token) => {
  const scripts = niftymidsmall400float;
  const instruments = scripts.map((script) => script.instrument_key);
  const niftylargeCaps = niftylargeCap.map((script) => script.instrument_key);

  const { wsUrl } = useMarketFeedUrl(token);
  const { porfolioWsUrl } = usePortfolioSocket(token);

  const request = {
    guid: "someguid",
    method: "sub",
    data: {
      mode: "full",
      instrumentKeys: [...instruments, ...niftylargeCaps],
    },
  };

  useMarketDataSocket({
    wsUrl: isUpstoxsWs ? wsUrl : null, // Disable if sandbox
    request: isUpstoxsWs ? request : null
  });

  useSandboxWS({
    request: !isUpstoxsWs ? request : null // Enable if sandbox
  });

  usePortfolioDataSocket({ porfolioWsUrl });
};