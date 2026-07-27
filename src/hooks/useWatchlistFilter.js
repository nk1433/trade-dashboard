import { useSelector } from 'react-redux';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import universe from '../index/universe.json';
import { BACKEND_URL } from '../utils/config';

// Simple helper to get flag counts
const getFlagCounts = (flaggedStocks) => {
  const counts = { red: 0, blue: 0, green: 0, orange: 0, purple: 0 };
  Object.values(flaggedStocks).forEach(flags => {
    const flagsArray = Array.isArray(flags) ? flags : [flags];
    flagsArray.forEach(color => {
      if (counts[color] !== undefined) {
        counts[color]++;
      } else {
        counts[color] = 1;
      }
    });
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
    newHighs,
    bullishReversal
  } = useSelector((state) => state.orders);

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

  const [customLists, setCustomLists] = useState(() => {
    try {
      const stored = localStorage.getItem('customLists');
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error("Failed to load custom lists", e);
      return [];
    }
  });

  const [otherSettings, setOtherSettings] = useState({});
  const [selectedIndex, setSelectedIndex] = useState('all');

  const lastSyncedRef = useRef(JSON.stringify({
    ...otherSettings,
    flaggedStocks,
    customLists
  }));

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

          const { flaggedStocks: _, customLists: backendCustomLists, ...others } = settings;
          
          setFlaggedStocks(prevFlags => {
            const newFlags = { ...prevFlags, ...backendFlags };
            
            setCustomLists(prevLists => {
              const newLists = backendCustomLists || prevLists;
              
              setOtherSettings(prevOthers => {
                const newOthers = others;
                
                lastSyncedRef.current = JSON.stringify({
                  ...newOthers,
                  flaggedStocks: newFlags,
                  customLists: newLists
                });
                
                return newOthers;
              });
              
              return newLists;
            });
            
            return newFlags;
          });
        }
      } catch (error) {
        console.error("Failed to load user settings", error);
      }
    };

    fetchSettings();
  }, []);

  // Optimize universe lookup
  const universeMap = useMemo(() => {
    return universe.reduce((acc, script) => {
      acc[script.tradingsymbol] = script;
      return acc;
    }, {});
  }, []);

  // 2. Persist to LocalStorage whenever flaggedStocks or customLists changes
  useEffect(() => {
    localStorage.setItem('flaggedStocks', JSON.stringify(flaggedStocks));
    window.dispatchEvent(new CustomEvent('FLAGS_UPDATED_EVENT', { detail: flaggedStocks }));
  }, [flaggedStocks]);

  useEffect(() => {
    localStorage.setItem('customLists', JSON.stringify(customLists));
    window.dispatchEvent(new CustomEvent('CUSTOM_LISTS_UPDATED_EVENT', { detail: customLists }));
  }, [customLists]);

  // Listen for sync events from other instances
  useEffect(() => {
    const handleFlagsUpdated = (e) => setFlaggedStocks(e.detail);
    const handleCustomListsUpdated = (e) => setCustomLists(e.detail);

    window.addEventListener('FLAGS_UPDATED_EVENT', handleFlagsUpdated);
    window.addEventListener('CUSTOM_LISTS_UPDATED_EVENT', handleCustomListsUpdated);

    return () => {
      window.removeEventListener('FLAGS_UPDATED_EVENT', handleFlagsUpdated);
      window.removeEventListener('CUSTOM_LISTS_UPDATED_EVENT', handleCustomListsUpdated);
    };
  }, []);

  // 3. Debounced Sync to Backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const payload = {
      ...otherSettings,
      flaggedStocks: flaggedStocks,
      customLists: customLists
    };

    const payloadStr = JSON.stringify(payload);
    if (lastSyncedRef.current === payloadStr) {
      return;
    }

    const syncToBackend = async () => {
      try {
        await axios.post(`${BACKEND_URL}/settings`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        lastSyncedRef.current = payloadStr;
      } catch (error) {
        console.error("Failed to sync watchlist settings", error);
      }
    };

    const timer = setTimeout(() => {
      syncToBackend();
    }, 5000); // 5 seconds debounce

    return () => clearTimeout(timer);
  }, [flaggedStocks, customLists, otherSettings]);

  // 4. Listen for External Flag Toggle Events (e.g. from IndustryVolumeShockers)
  useEffect(() => {
    const handleToggleFlagEvent = (event) => {
      const { symbol, color } = event.detail;
      if (symbol) {
        setFlaggedStocks(prev => {
          const next = { ...prev };
          const currentFlags = Array.isArray(prev[symbol]) ? prev[symbol] : (prev[symbol] ? [prev[symbol]] : []);
          
          if (color === null) {
            delete next[symbol];
            return next;
          }

          if (currentFlags.includes(color)) {
            const newFlags = currentFlags.filter(f => f !== color);
            if (newFlags.length === 0) delete next[symbol];
            else next[symbol] = newFlags;
          } else {
            next[symbol] = [...currentFlags, color];
          }
          return next;
        });
      }
    };

    window.addEventListener('TOGGLE_FLAG_EVENT', handleToggleFlagEvent);
    return () => window.removeEventListener('TOGGLE_FLAG_EVENT', handleToggleFlagEvent);
  }, []);


  const handleSelectionChange = useCallback((event) => {
    setSelectedIndex(event.target.value);
  }, []);

  const toggleFlag = useCallback((symbol, color) => {
    setFlaggedStocks(prev => {
      const next = { ...prev };
      const currentFlags = Array.isArray(prev[symbol]) ? prev[symbol] : (prev[symbol] ? [prev[symbol]] : []);
      
      if (color === null) {
        delete next[symbol];
        return next;
      }

      if (currentFlags.includes(color)) {
        const newFlags = currentFlags.filter(f => f !== color);
        if (newFlags.length === 0) delete next[symbol];
        else next[symbol] = newFlags;
      } else {
        next[symbol] = [...currentFlags, color];
      }
      return next;
    });
  }, []);

  const createCustomList = useCallback((name) => {
    if (!name || name.trim() === '') return;
    const trimmed = name.trim();
    if (!customLists.includes(trimmed)) {
      setCustomLists(prev => [...prev, trimmed]);
    }
  }, [customLists]);

  const deleteCustomList = useCallback((name) => {
    setCustomLists(prev => prev.filter(n => n !== name));
    setFlaggedStocks(prev => {
      const next = { ...prev };
      Object.keys(next).forEach((symbol) => {
        const flagsArray = Array.isArray(next[symbol]) ? next[symbol] : [next[symbol]];
        if (flagsArray.includes(name)) {
          const newFlags = flagsArray.filter(f => f !== name);
          if (newFlags.length === 0) delete next[symbol];
          else next[symbol] = newFlags;
        }
      });
      return next;
    });
    if (selectedIndex === name) {
      setSelectedIndex('all');
    }
  }, [selectedIndex]);

  const holdingsMap = useMemo(() => holdings.reduce((acc, curr) => {
    acc[curr.symbol] = curr;
    return acc;
  }, {}), [holdings]);

  const getFlaggedList = useCallback((color) => {
    const list = {};
    Object.entries(flaggedStocks).forEach(([symbol, flagColor]) => {
      const flagsArray = Array.isArray(flagColor) ? flagColor : [flagColor];
      if (flagsArray.includes(color)) {
        const script = universeMap[symbol];
        const instrumentKey = script ? script.instrument_key : symbol;
        
        if (orderMetrics && orderMetrics[instrumentKey]) {
          list[instrumentKey] = orderMetrics[instrumentKey];
        } else {
          list[instrumentKey] = {
            symbol: symbol,
            instrumentKey: instrumentKey,
            ltp: script ? script.last_price : 0,
            changePercentage: 0
          };
        }
      }
    });
    return list;
  }, [flaggedStocks, orderMetrics, universeMap]);

  const getLiveList = useCallback((sourceList) => {
    const list = {};
    if (!sourceList) return list;
    Object.keys(sourceList).forEach(instrumentKey => {
      if (orderMetrics && orderMetrics[instrumentKey]) {
        list[instrumentKey] = orderMetrics[instrumentKey];
      } else {
        list[instrumentKey] = sourceList[instrumentKey];
      }
    });
    return list;
  }, [orderMetrics]);

  const scriptsToShow = useMemo(() => {
    switch (selectedIndex) {
      case 'bullishMB': return getLiveList(bullishBurst);
      case 'bearishMB': return getLiveList(bearishBurst);
      case 'bullishSLTB': return getLiveList(bullishSLTB);
      case 'bearishSLTB': return getLiveList(bearishSLTB);
      case 'bullishAnts': return getLiveList(bullishAnts);
      case 'dollar': return getLiveList(dollar);
      case 'bearishDollar': return getLiveList(bearishDollar);
      case 'newHighs': return getLiveList(newHighs);
      case 'bullishReversal': return getLiveList(bullishReversal);
      case 'holdings': return holdingsMap || {};
      case 'redList': return getFlaggedList('red');
      case 'blueList': return getFlaggedList('blue');
      case 'greenList': return getFlaggedList('green');
      case 'orangeList': return getFlaggedList('orange');
      case 'purpleList': return getFlaggedList('purple');
      case 'all': return orderMetrics || {};
      default:
        if (customLists.includes(selectedIndex)) {
          return getFlaggedList(selectedIndex);
        }
        return orderMetrics || {};
    }
  }, [
    selectedIndex, customLists,
    bullishBurst, bearishBurst, bullishSLTB, bearishSLTB, bullishAnts, dollar, bearishDollar, newHighs, bullishReversal,
    holdingsMap, orderMetrics, getFlaggedList, getLiveList
  ]);

  const flagCounts = useMemo(() => getFlagCounts(flaggedStocks), [flaggedStocks]);

  const counts = useMemo(() => {
    const defaultCounts = {
      all: Object.keys(orderMetrics || {}).length,
      bullishMB: Object.keys(bullishBurst || {}).length,
      bearishMB: Object.keys(bearishBurst || {}).length,
      bullishSLTB: Object.keys(bullishSLTB || {}).length,
      bearishSLTB: Object.keys(bearishSLTB || {}).length,
      bullishAnts: Object.keys(bullishAnts || {}).length,
      dollar: Object.keys(dollar || {}).length,
      bearishDollar: Object.keys(bearishDollar || {}).length,
      newHighs: Object.keys(newHighs || {}).length,
      bullishReversal: Object.keys(bullishReversal || {}).length,
      holdings: holdings.length,
      redList: flagCounts.red || 0,
      blueList: flagCounts.blue || 0,
      greenList: flagCounts.green || 0,
      orangeList: flagCounts.orange || 0,
      purpleList: flagCounts.purple || 0,
    };
    
    customLists.forEach(list => {
      defaultCounts[list] = flagCounts[list] || 0;
    });
    
    return defaultCounts;
  }, [orderMetrics, bullishBurst, bearishBurst, bullishSLTB, bearishSLTB, bullishAnts, dollar, bearishDollar, newHighs, bullishReversal, holdings, flagCounts, customLists]);

  const clearFlaggedList = useCallback((color) => {
    setFlaggedStocks(prev => {
      const next = { ...prev };
      Object.keys(next).forEach((symbol) => {
        const flagsArray = Array.isArray(next[symbol]) ? next[symbol] : [next[symbol]];
        if (flagsArray.includes(color)) {
          const newFlags = flagsArray.filter(f => f !== color);
          if (newFlags.length === 0) delete next[symbol];
          else next[symbol] = newFlags;
        }
      });
      return next;
    });
  }, []);

  return {
    selectedIndex,
    handleSelectionChange,
    scriptsToShow,
    counts,
    flaggedStocks,
    customLists,
    createCustomList,
    deleteCustomList,
    toggleFlag,
    clearFlaggedList,
  };
};
