
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Components/molicules/Navbar';
import UpstoxSettings from './Components/UpstoxSettings';
import UpstoxCallback from './Components/UpstoxCallback';
import Login from './Components/Login';
import Signup from './Components/Signup';
import Home from './Components/molicules/Home';
import Settings from './Components/molicules/Settings';
import Redirect from './Components/molicules/Redirect';
import MarketBreadthTable from './Components/molicules/MarketBreadth';
import MarketHighLowWormChart from './Components/molicules/Worm';
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
import niftymidsmall400 from './index/niftymidsmall400-float.json';

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
    dispatch(getStatsForScripts());
    dispatch(fetchUserSettings());
    dispatch(fetchPaperTradesAsync());
  }, [dispatch]);

  // Fetch Initial Metrics if Market is Closed or Metrics Empty
  useEffect(() => {
    // Ensuring stats are loaded before creating metrics
    if (upstoxToken && Object.keys(stats).length > 0 && (marketStatus === 'CLOSED' || Object.keys(orderMetrics).length === 0)) {
      if (Object.keys(orderMetrics).length === 0) {
        dispatch(fetchAndCalculateInitialMetrics(niftymidsmall400));
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
      }
    }
  }, [orderMetrics, dispatch]); // Intentionally omitting holdings to avoid loops

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
