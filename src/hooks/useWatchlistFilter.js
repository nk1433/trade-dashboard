import { useSelector } from 'react-redux';
import { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import universe from '../index/universe.json';
import { BACKEND_URL } from '../utils/config';

// Simple helper to get flag counts
const getFlagCounts = (flaggedStocks) => {
  const counts = { red: 0, blue: 0, green: 0, orange: 0, purple: 0 };
  Object.values(flaggedStocks).forEach(color => {
    if (counts[color] !== undefined) {
      counts[color]++;
    }
  });
  return counts;
};

export const useWatchlistFilter = () => {
  const {
    orderMetrics,
    bullishBurst,
    bearishBurst,
    bullishSLTB,
    bearishSLTB,
    bullishAnts,
    dollar,
    bearishDollar,
  } = useSelector(state => state.orders);

  const { holdings } = useSelector(state => state.paperTrade);
  // Removed dependency on state.auth.token (which is Upstox token)

  // Initialize from LocalStorage
  const [flaggedStocks, setFlaggedStocks] = useState(() => {
    try {
      const stored = localStorage.getItem('flaggedStocks');
      return stored ? JSON.parse(stored) : {}; // Format: { "RELIANCE": "red", "TCS": "blue" }
    } catch (e) {
      console.error("Failed to load flagged stocks", e);
      return {};
    }
  });

  const [otherSettings, setOtherSettings] = useState({});
  const [selectedIndex, setSelectedIndex] = useState('all');

  // 1. Fetch Settings from Backend on Mount
  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      try {
        const response = await axios.get(`${BACKEND_URL}/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.status === 'success') {
          const settings = response.data.data || {};
          const backendFlags = settings.flaggedStocks || {};

          const { flaggedStocks: _, ...others } = settings;
          setOtherSettings(others);

          setFlaggedStocks(prev => ({ ...prev, ...backendFlags }));
        }
      } catch (error) {
        console.error("Failed to load user settings", error);
      }
    };

    fetchSettings();
  }, []);

  // 2. Persist to LocalStorage whenever flaggedStocks changes
  useEffect(() => {
    localStorage.setItem('flaggedStocks', JSON.stringify(flaggedStocks));
  }, [flaggedStocks]);

  // 3. Debounced Sync to Backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const syncToBackend = async () => {
      try {
        const payload = {
          ...otherSettings,
          flaggedStocks: flaggedStocks
        };

        await axios.post(`${BACKEND_URL}/settings`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error("Failed to sync watchlist flags", error);
      }
    };

    const timer = setTimeout(() => {
      syncToBackend();
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
  }, [flaggedStocks, otherSettings]);


  const handleSelectionChange = useCallback((event) => {
    setSelectedIndex(event.target.value);
  }, []);

  const toggleFlag = useCallback((symbol, color) => {
    setFlaggedStocks(prev => {
      const next = { ...prev };
      if (color === null || prev[symbol] === color) {
        delete next[symbol]; // Remove flag
      } else {
        next[symbol] = color; // Set/Update flag
      }
      return next;
    });
  }, []);

  const holdingsMap = useMemo(() => holdings.reduce((acc, curr) => {
    acc[curr.symbol] = curr;
    return acc;
  }, {}), [holdings]);

  const getFlaggedList = useCallback((color) => {
    const list = {};
    Object.entries(flaggedStocks).forEach(([symbol, flagColor]) => {
      if (flagColor === color) {
        if (orderMetrics && orderMetrics[symbol]) {
          list[symbol] = orderMetrics[symbol];
        }
        else {
          list[symbol] = {
            symbol: symbol,
            instrumentKey: symbol,
            ltp: 0,
            changePercentage: 0
          };
        }
      }
    });
    return list;
  }, [flaggedStocks, orderMetrics]);


  const scriptsToShow = useMemo(() => {
    switch (selectedIndex) {
      case 'bullishMB': return bullishBurst || {};
      case 'bearishMB': return bearishBurst || {};
      case 'bullishSLTB': return bullishSLTB || {};
      case 'bearishSLTB': return bearishSLTB || {};
      case 'bullishAnts': return bullishAnts || {};
      case 'dollar': return dollar || {};
      case 'bearishDollar': return bearishDollar || {};
      case 'holdings': return holdingsMap || {};
      case 'redList': return getFlaggedList('red');
      case 'blueList': return getFlaggedList('blue');
      case 'greenList': return getFlaggedList('green');
      case 'orangeList': return getFlaggedList('orange');
      case 'purpleList': return getFlaggedList('purple');
      case 'all':
      default: return orderMetrics || {};
    }
  }, [
    selectedIndex,
    bullishBurst, bearishBurst, bullishSLTB, bearishSLTB, bullishAnts, dollar, bearishDollar,
    holdingsMap, orderMetrics, getFlaggedList
  ]);

  const flagCounts = useMemo(() => getFlagCounts(flaggedStocks), [flaggedStocks]);

  const counts = useMemo(() => ({
    all: Object.keys(orderMetrics || {}).length,
    bullishMB: Object.keys(bullishBurst || {}).length,
    bearishMB: Object.keys(bearishBurst || {}).length,
    bullishSLTB: Object.keys(bullishSLTB || {}).length,
    bearishSLTB: Object.keys(bearishSLTB || {}).length,
    bullishAnts: Object.keys(bullishAnts || {}).length,
    dollar: Object.keys(dollar || {}).length,
    bearishDollar: Object.keys(bearishDollar || {}).length,
    holdings: holdings.length,
    redList: flagCounts.red,
    blueList: flagCounts.blue,
    greenList: flagCounts.green,
    orangeList: flagCounts.orange,
    purpleList: flagCounts.purple,
  }), [orderMetrics, bullishBurst, bearishBurst, bullishSLTB, bearishSLTB, bullishAnts, dollar, bearishDollar, holdings, flagCounts]);

  return {
    selectedIndex,
    handleSelectionChange,
    scriptsToShow,
    counts,
    flaggedStocks,
    toggleFlag,
  };
};
