
import { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Components/molicules/Navbar';
import UpstoxSettings from './Components/UpstoxSettings';
import UpstoxCallback from './Components/UpstoxCallback';
import Login from './Components/Login';
import Signup from './Components/Signup';
import Home from './Components/molicules/Home/index';
import Settings from './Components/molicules/Settings';
import Redirect from './Components/molicules/Redirect';
import MarketBreadthTable from './Components/molicules/MarketBreadth';
import MarketHighLowWormChart from './Components/molicules/Worm/index';
import HoldingsWrapper from './Components/HoldingsWrapper';
import Scans from './Components/Scans';
import { fetchUpstoxToken } from './Store/authSlice';
import { fetchUserSettings } from './Store/portfolio';
import { useUpstoxWS } from './hooks/useUpstoxWS';
import { getStatsForScripts, fetchAndCalculateInitialMetrics } from './Store/upstoxs';
import { fetchPaperTradesAsync, updatePaperHoldingsLTP } from './Store/paperTradeSlice';
import { fetchMarketTimings, fetchHolidays, updateMarketStatus } from './Store/marketStatusSlice';
import HolidayBanner from './Components/molicules/HolidayBanner';
import MarketStatusToast from './Components/molicules/MarketStatusToast';
import universe from './index/universe.json';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/" replace />;
  }
  return children;
};


const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token: upstoxToken } = useSelector((state) => state.auth);
  const { orderMetrics, stats } = useSelector((state) => state.orders);
  const { marketStatus } = useSelector((state) => state.marketStatus);
  const { holdings } = useSelector((state) => state.paperTrade);

  useEffect(() => {
    if (!upstoxToken && localStorage.getItem('token')) {
      dispatch(fetchUpstoxToken());
    }
  }, [dispatch, upstoxToken, location.pathname]);

  // Market Status Checks - Re-run when token becomes available
  useEffect(() => {
    if (upstoxToken) {
      dispatch(fetchMarketTimings());
      dispatch(fetchHolidays());
    }
  }, [dispatch, upstoxToken]);

  const [appInitialized, setAppInitialized] = useState(false);
  const hasFetchedData = useRef(false);

  // Fetch stats only once after user logs in
  useEffect(() => {
    const appToken = localStorage.getItem('token');
    
    if (appToken && !hasFetchedData.current) {
      hasFetchedData.current = true;
      const fetchData = async () => {
        await dispatch(getStatsForScripts());
        await dispatch(fetchUserSettings());
        await dispatch(fetchPaperTradesAsync());
        setAppInitialized(true);
      };
      fetchData();
    }

    // Reset if user logs out
    if (!appToken && hasFetchedData.current) {
      hasFetchedData.current = false;
      setAppInitialized(false);
    }
  }, [dispatch, location.pathname]);

  // Fetch Initial Metrics if Market is Closed or Metrics Empty
  useEffect(() => {
    // Ensuring stats are loaded before creating metrics
    if (upstoxToken && stats && Object.keys(stats).length > 0 && (marketStatus === 'CLOSED' || !orderMetrics || Object.keys(orderMetrics).length === 0)) {
      if (!orderMetrics || Object.keys(orderMetrics).length === 0) {
        dispatch(fetchAndCalculateInitialMetrics(universe));
      }
    }
  }, [dispatch, upstoxToken, marketStatus, stats, orderMetrics]); // Run when stats update

  // Global LTP Update Logic for Paper Holdings (from live WebSocket / orderMetrics)
  // Only fires for non-fallback metrics — i.e. real live WS prices when market is OPEN.
  // isFallback=true metrics come from stale stats and must NOT overwrite the fresh LTP below.
  useEffect(() => {
    if (orderMetrics && holdings.length > 0) {
      const ltpMap = {};
      let hasUpdate = false;

      Object.values(orderMetrics).forEach(metric => {
        // Skip isFallback metrics (built from stale stats = yesterday's close).
        // These must not overwrite the fresh LTP fetched directly from Upstox below.
        if (metric.symbol && metric.ltp && !metric.isFallback) {
          ltpMap[metric.symbol] = metric.ltp;
          hasUpdate = true;
        }
      });

      if (hasUpdate) {
        dispatch(updatePaperHoldingsLTP(ltpMap));

        // Check for SL Hits
        holdings.forEach(holding => {
          const currentLTP = ltpMap[holding.symbol];
          if (currentLTP && holding.sl && holding.sl > 0) {
            // if (currentLTP <= holding.sl) { /* auto-exit logic */ }
          }
        });
      }
    }
  }, [orderMetrics, dispatch]); // Intentionally omitting holdings to avoid render loops

  // ─── Closed-Market Holdings LTP Fetch ────────────────────────────────────────
  // When market is CLOSED/UNKNOWN the WebSocket sends no tickers.
  // Fetch the latest LTP directly from the Upstox market-quote/ltp API using the
  // long-lived analytics token so BOTH the home-page sidebar AND /holdings page
  // always show the correct closing price and P&L.
  useEffect(() => {
    const analyticsToken = import.meta.env.VITE_UPSTOXS_ANALYTICS_TOKEN;
    const isMarketOpen = marketStatus === 'OPEN';

    if (isMarketOpen || !analyticsToken || holdings.length === 0) return;

    // Build instrument_key list for held symbols
    const instrumentKeys = holdings
      .map(h => {
        const entry = universe.find(s => s.tradingsymbol === h.symbol);
        return entry?.instrument_key;
      })
      .filter(Boolean);

    if (instrumentKeys.length === 0) {
      console.warn('[App Holdings LTP] No instrument keys found for holdings:', holdings.map(h => h.symbol));
      return;
    }

    const fetchClosedMarketLTP = async () => {
      try {
        const keysParam = instrumentKeys.join(',');
        const url = `https://api.upstox.com/v2/market-quote/ltp?instrument_key=${encodeURIComponent(keysParam)}`;
        console.log('[App Holdings LTP] Market not open — fetching fresh LTP:', url);

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${analyticsToken}`,
            Accept: 'application/json',
          },
        });

        const json = await res.json();
        console.log('[App Holdings LTP] API response:', json);

        if (json.status === 'success' && json.data) {
          const ltpMap = {};
          Object.entries(json.data).forEach(([key, val]) => {
            // API returns keys as "NSE_EQ:SYMBOL" (colon+symbol format)
            const symbol = key.split(':')[1];
            if (symbol && val.last_price) {
              ltpMap[symbol] = val.last_price;
            }
          });

          console.log('[App Holdings LTP] Dispatching ltpMap:', ltpMap);

          if (Object.keys(ltpMap).length > 0) {
            dispatch(updatePaperHoldingsLTP(ltpMap));
            console.log('[App Holdings LTP] ✅ Holdings updated with fresh closing prices');
          } else {
            console.warn('[App Holdings LTP] ltpMap empty — no symbols matched API response');
          }
        } else {
          console.error('[App Holdings LTP] API returned non-success:', json);
        }
      } catch (err) {
        console.error('[App Holdings LTP] Fetch failed:', err);
      }
    };

    fetchClosedMarketLTP();
  }, [marketStatus, holdings.length, dispatch]); // Re-runs when market status or holding count changes

  // Periodic Market Status Check (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(updateMarketStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useUpstoxWS(upstoxToken, appInitialized);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected Routes wrapped in Navbar (Layout) */}
      <Route element={<ProtectedRoute><Navbar /></ProtectedRoute>}>
        <Route path="/" element={<><HolidayBanner /><MarketStatusToast /><Home /></>} />
        <Route path="/upstox-settings" element={<UpstoxSettings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/redirect" element={<Redirect />} />
        <Route path="/market-breadth" element={<MarketBreadthTable />} />
        <Route path="/worm" element={<MarketHighLowWormChart />} />
        <Route path="/holdings" element={<HoldingsWrapper />} />
        <Route path="/scans" element={<Scans />} />
        <Route path="/upstox/callback" element={<UpstoxCallback />} />
        <Route path="/upstoxs/redirect" element={<UpstoxCallback />} />
      </Route>
    </Routes>
  );
};

export default App;
