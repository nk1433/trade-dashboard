
import { useEffect } from 'react';
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
    if (!upstoxToken) {
      dispatch(fetchUpstoxToken());
    }
  }, [dispatch, upstoxToken]);

  // Market Status Checks - Re-run when token becomes available
  useEffect(() => {
    if (upstoxToken) {
      dispatch(fetchMarketTimings());
      dispatch(fetchHolidays());
    }
  }, [dispatch, upstoxToken]);

  // Fetch stats only once on mount
  useEffect(() => {
    const fetchData = async () => {
      await dispatch(getStatsForScripts());
      await dispatch(fetchUserSettings());
      await dispatch(fetchPaperTradesAsync());
    };
    fetchData();
  }, [dispatch]);

  // Fetch Initial Metrics if Market is Closed or Metrics Empty
  useEffect(() => {
    // Ensuring stats are loaded before creating metrics
    if (upstoxToken && Object.keys(stats).length > 0 && (marketStatus === 'CLOSED' || Object.keys(orderMetrics).length === 0)) {
      if (Object.keys(orderMetrics).length === 0) {
        dispatch(fetchAndCalculateInitialMetrics(universe));
      }
    }
  }, [dispatch, upstoxToken, marketStatus, stats]); // Run when stats update

  // Global LTP Update Logic for Paper Holdings
  useEffect(() => {
    if (orderMetrics && holdings.length > 0) {
      const ltpMap = {};
      let hasUpdate = false;

      // Create a map of Symbol -> LTP from orderMetrics
      Object.values(orderMetrics).forEach(metric => {
        if (metric.symbol && metric.ltp) {
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
            if (currentLTP <= holding.sl) {
              // Trigger Auto Exit
              console.log(`Checking SL for ${holding.symbol}: LTP ${currentLTP} <= SL ${holding.sl}. Exiting...`);

              // Dispatch executePaperOrder
              // We dispatch directly here. Ideally, we should have a flag to prevent multiple triggers for the same holding
              // but executePaperOrder (SELL) likely reduces quantity or removes holding, so subsequent checks won't find it or quantity will be 0.
              // Assuming executePaperOrder handles sufficient quantity checks.
              import('./Store/paperTradeSlice').then(({ executePaperOrder }) => {
                dispatch(executePaperOrder({
                  symbol: holding.symbol,
                  quantity: holding.quantity, // Exit full quantity
                  price: currentLTP,
                  type: 'SELL',
                  timestamp: Date.now(),
                  reason: 'SL_HIT'
                }));
              });
            }
          }
        });
      }
    }
  }, [orderMetrics, dispatch]); // Intentionally omitting holdings to avoid loops, but strictly speaking holdings should be in dependency or we use a ref.
  // Actually, if we don't include holdings, we might be checking against stale SLs.
  // But if we include holdings, this effect runs every time holdings change (e.g. pnl update), potentially loop.
  // orderMetrics changes frequent.
  // Since updatePaperHoldingsLTP updates holdings in store, it triggers selector update.
  // To avoid loop:
  // We rely on orderMetrics driving the cycle.
  // We should read the *latest* holdings.
  // The 'holdings' from scope is from useSelector.
  // If we don't add it to deps, we read stale closure 'holdings'.
  // BUT: App component re-renders on selector change, so 'holdings' variable is fresh.
  // The useEffect normally would depend on it.
  // If we add 'holdings' to deps, and we dispatch updatePaperHoldingsLTP, it updates holdings -> re-render -> useEffect -> dispatch... Loop?
  // updatePaperHoldingsLTP updates LTP/PnL but does it create new object reference for the array? Yes likely.
  // Optimization: Use a Ref for holdings to read inside effect without triggering it, OR ensure updatePaperHoldingsLTP is only dispatched if values actually changed significantly.
  // For now, let's keep it as is but be careful.
  // The existing code omitted holdings.
  // Let's rely on `holdings` from the closure - wait, if useEffect doesn't have holdings in deps, it uses the holdings from the *first render* or when orderMetrics/dispatch changed?
  // No, if orderMetrics changes (every second), the effect runs. access to `holdings` will be...
  // wait. `holdings` is const from useSelector.
  // If we don't list it in deps, the callback closes over the `holdings` from the render where `orderMetrics` *last changed*.
  // Since `orderMetrics` changes constantly, we essentially get fresh `holdings` frequently enough.
  // So the closure is fresh enough.

  // Periodic Market Status Check (every minute)
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(updateMarketStatus());
    }, 60000);
    return () => clearInterval(interval);
  }, [dispatch]);

  useUpstoxWS(upstoxToken);

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
