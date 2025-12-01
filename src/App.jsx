import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
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
import ScanCriteriaManager from './Components/ScanCriteriaManager';

import { useUpstoxWS } from './hooks/useUpstoxWS';
import { getStatsForScripts } from './Store/upstoxs';

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

import axios from 'axios';
import { BACKEND_URL } from './utils/config';
import { useSelector } from 'react-redux';
import { fetchUpstoxToken } from './Store/authSlice';

const App = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { token: upstoxToken } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!upstoxToken) {
      dispatch(fetchUpstoxToken());
    }
  }, [dispatch, upstoxToken]);

  // Fetch stats only once on mount
  useEffect(() => {
    dispatch(getStatsForScripts());
  }, [dispatch]);

  useUpstoxWS(upstoxToken);

  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

      {/* Protected Routes wrapped in Navbar (Layout) */}
      <Route element={<ProtectedRoute><Navbar /></ProtectedRoute>}>
        <Route path="/" element={<Home />} />
        import ScanCriteriaManager from './Components/ScanCriteriaManager';

        // ... existing imports

        <Route path="/upstox-settings" element={<UpstoxSettings />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/scans" element={<ScanCriteriaManager />} />
        <Route path="/redirect" element={<Redirect />} />
        <Route path="/market-breadth" element={<MarketBreadthTable />} />
        <Route path="/worm" element={<MarketHighLowWormChart />} />
        <Route path="/upstox/callback" element={<UpstoxCallback />} />
        <Route path="/upstoxs/redirect" element={<UpstoxCallback />} />
      </Route>
    </Routes>
  );
};

export default App;
