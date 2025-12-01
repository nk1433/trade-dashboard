import React, { useEffect, useRef, useState } from "react";
import { widget } from "../../charting_library";
import Datafeed from "./datafeed/datafeed_custom";
import { useWatchlistFilter } from "../../hooks/useWatchlistFilter";
import {
  Box, Typography, Divider, IconButton, Menu, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { BACKEND_URL } from '../../utils/config';
import niftylargecap from '../../index/niftylargecap.json';
import niftymidsmall400 from '../../index/niftymidsmall400-float.json';

const TVChartContainer = () => {
  const chartContainerRef = useRef();
  const tvWidgetRef = useRef(null);
  const { selectedIndex, handleSelectionChange, scriptsToShow, counts } = useWatchlistFilter();
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id || user.id || 'public_user_id';

  // Convert filtered scripts object into array for stock list
  const dynamicStockList = Object.values(scriptsToShow);

  useEffect(() => {
    const initWidget = async () => {
      const widgetOptions = {
        symbol: "NSE_EQ|INE002A01018|RELIANCE", // Initial symbol with name
        datafeed: Datafeed,
        interval: "1D",
        container: chartContainerRef.current,
        library_path: "/charting_library/",
        locale: "en",
        timezone: "Asia/Kolkata",
        disabled_features: [
          "use_localstorage_for_settings",
          "symbol_search_hot_key",
          "create_volume_indicator_by_default",
        ],
        enabled_features: ["watchlist_sections"],
        fullscreen: false,
        autosize: true,
        studies_overrides: {},
        supports_marks: false,
        supports_timescale_marks: false,
        theme: "light",
        symbol_search_complete: (symbol, searchResultItem) => {
          return new Promise((resolve) => {
            const allScripts = [...niftylargecap, ...niftymidsmall400];
            const foundScript = allScripts.find(s => s.tradingsymbol === symbol || s.instrument_key === symbol);

            if (foundScript) {
              resolve({ symbol: foundScript.instrument_key, name: foundScript.name });
            } else {
              resolve({ symbol: symbol, name: symbol });
            }
          });
        },
        widgetbar: {
          watchlist: true,
          watchlist_settings: {
            default_symbols: ["NSE_EQ|INE002A01018", "NSE_EQ|INE242A01010"],
            readonly: true,
          },
        },
        overrides: {
          "paneProperties.background": "#ffffff",
          "paneProperties.vertGridProperties.color": "rgba(46, 46, 46, 0.06)",
          "paneProperties.horzGridProperties.color": "rgba(46, 46, 46, 0.06)",
          "mainSeriesProperties.candleStyle.upColor": "#ffffff",
          "mainSeriesProperties.candleStyle.downColor": "#000000",
          "mainSeriesProperties.candleStyle.borderUpColor": "#000000",
          "mainSeriesProperties.candleStyle.borderDownColor": "#000000",
          "mainSeriesProperties.candleStyle.wickUpColor": "#000000",
          "mainSeriesProperties.candleStyle.wickDownColor": "#000000",
          "mainSeriesProperties.statusViewStyle.showInterval": true,
          "mainSeriesProperties.statusViewStyle.symbolTextSource": "ticker",
        },
      };

      const tvWidget = new widget(widgetOptions);
      tvWidgetRef.current = tvWidget;

      tvWidget.onChartReady(() => {
        tvWidget.activeChart().createStudy('Volume', false, false);
      });
    };

    initWidget();

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, []);

  const handleStockClick = (symbol, instrumentKey) => {
    setSelectedSymbol(symbol);
    if (tvWidgetRef.current) {
      // Construct composite symbol: InstrumentKey|TradingSymbol
      // Example: NSE_EQ|INE002A01018|RELIANCE
      const compositeSymbol = `${instrumentKey}|${symbol}`;

      tvWidgetRef.current.onChartReady(() => {
        tvWidgetRef.current.activeChart().setSymbol(compositeSymbol);
      });
    }
  };

  // Sorting logic
  const [sortConfig, setSortConfig] = useState({ key: 'changePercentage', direction: 'desc' });
  const [anchorEl, setAnchorEl] = useState(null);
  const openMenu = Boolean(anchorEl);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (value) => {
    setAnchorEl(null);
    if (value) {
      handleSelectionChange({ target: { value } });
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedStockList = [...dynamicStockList].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // Handle numeric conversions if needed
    if (sortConfig.key === 'changePercentage' || sortConfig.key === 'ltp') {
      aValue = parseFloat(aValue) || 0;
      bValue = parseFloat(bValue) || 0;
    }

    // Calculate change if key is 'change'
    if (sortConfig.key === 'change') {
      aValue = (parseFloat(a.ltp) || 0) - (parseFloat(a.sl) || 0); // sl is currentDayOpen
      bValue = (parseFloat(b.ltp) || 0) - (parseFloat(b.sl) || 0);
    }

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const getListName = (index) => {
    switch (index) {
      case 'bullishMB': return 'Bullish MB';
      case 'bearishMB': return 'Bearish MB';
      case 'bullishSLTB': return 'Bullish SLTB';
      case 'bearishSLTB': return 'Bearish SLTB';
      case 'bullishAnts': return 'Bullish Ants';
      case 'dollar': return 'Dollar BO';
      case 'bearishDollar': return 'Bearish Dollar';
      case 'all': return 'All Symbols';
      default: return 'Watchlist';
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', width: '100%' }}>
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Chart Area */}
        <Box sx={{ flex: 1, position: 'relative' }}>
          <div ref={chartContainerRef} style={{ height: '100%', width: '100%' }} />
        </Box>

        {/* Side Panel */}
        <Box sx={{
          width: 320, // Slightly wider for table
          borderLeft: '1px solid var(--border-color)',
          bgcolor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with Dropdown */}
          <Box sx={{
            p: 1.5,
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'var(--bg-primary)'
          }}>
            <Box
              onClick={handleMenuClick}
              sx={{
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                borderRadius: 1,
                p: 0.5,
                '&:hover': { bgcolor: 'rgba(0,0,0,0.05)' }
              }}
            >
              <Typography variant="subtitle2" fontWeight={600} sx={{ mr: 0.5 }}>
                {getListName(selectedIndex)}
              </Typography>
              <KeyboardArrowDownIcon fontSize="small" color="action" />
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={() => handleMenuClose(null)}
              MenuListProps={{ dense: true }}
            >
              <MenuItem onClick={() => handleMenuClose('all')}>All Symbols ({counts.all})</MenuItem>
              <Divider />
              <MenuItem onClick={() => handleMenuClose('bullishMB')}>Bullish MB ({counts.bullishMB})</MenuItem>
              <MenuItem onClick={() => handleMenuClose('bearishMB')}>Bearish MB ({counts.bearishMB})</MenuItem>
              <MenuItem onClick={() => handleMenuClose('bullishSLTB')}>Bullish SLTB ({counts.bullishSLTB})</MenuItem>
              <MenuItem onClick={() => handleMenuClose('bearishSLTB')}>Bearish SLTB ({counts.bearishSLTB})</MenuItem>
              <MenuItem onClick={() => handleMenuClose('bullishAnts')}>Bullish Ants ({counts.bullishAnts})</MenuItem>
              <MenuItem onClick={() => handleMenuClose('dollar')}>Dollar BO ({counts.dollar})</MenuItem>
              <MenuItem onClick={() => handleMenuClose('bearishDollar')}>Bearish Dollar ({counts.bearishDollar})</MenuItem>
            </Menu>

            <Box>
              <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
              <IconButton size="small"><MoreHorizIcon fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* Watchlist Table */}
          <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
            <Table stickyHeader size="small" aria-label="watchlist table">
              <TableHead>
                <TableRow>
                  <TableCell
                    onClick={() => handleSort('symbol')}
                    sx={{ cursor: 'pointer', pl: 2, py: 1, bgcolor: 'var(--bg-secondary)', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}
                  >
                    Symbol
                  </TableCell>
                  <TableCell
                    align="right"
                    onClick={() => handleSort('change')}
                    sx={{ cursor: 'pointer', py: 1, bgcolor: 'var(--bg-secondary)', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}
                  >
                    Chg
                  </TableCell>
                  <TableCell
                    align="right"
                    onClick={() => handleSort('changePercentage')}
                    sx={{ cursor: 'pointer', pr: 2, py: 1, bgcolor: 'var(--bg-secondary)', fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}
                  >
                    Chg%
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedStockList.map((stock, index) => {
                  const ltp = parseFloat(stock.ltp) || 0;
                  const open = parseFloat(stock.sl) || 0; // Assuming sl is currentDayOpen based on upstoxs.js
                  const change = ltp - open;
                  const changePercent = parseFloat(stock.changePercentage) || 0;
                  const isPositive = change >= 0;
                  const color = isPositive ? '#089981' : '#F23645';

                  return (
                    <TableRow
                      key={stock.instrumentKey || index}
                      hover
                      onClick={() => handleStockClick(stock.symbol, stock.instrumentKey)}
                      selected={selectedSymbol === stock.symbol}
                      sx={{
                        cursor: 'pointer',
                        '&.Mui-selected': { bgcolor: 'rgba(0,0,0,0.05)' },
                        '&:hover': { bgcolor: 'rgba(0,0,0,0.03)' }
                      }}
                    >
                      <TableCell component="th" scope="row" sx={{ pl: 2, py: 0.75, borderBottom: '1px solid var(--border-color)' }}>
                        <Typography variant="body2" fontWeight={500}>{stock.symbol}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ py: 0.75, borderBottom: '1px solid var(--border-color)', color: color }}>
                        <Typography variant="body2">{change.toFixed(2)}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ pr: 2, py: 0.75, borderBottom: '1px solid var(--border-color)', color: color }}>
                        <Typography variant="body2">{changePercent.toFixed(2)}%</Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </Box>
  );
};

export default TVChartContainer;
