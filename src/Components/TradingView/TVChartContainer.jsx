import React, { useEffect, useRef, useState } from "react";
import { widget } from "../../charting_library";
import Datafeed from "./datafeed/datafeed_custom";
import { useWatchlistFilter } from "../../hooks/useWatchlistFilter";
import {
  Box, Typography, Divider, IconButton, Menu, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Checkbox, FormControlLabel, Popover, FormGroup
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { BACKEND_URL } from '../../utils/config';
import niftylargecap from '../../index/niftylargecap.json';
import niftymidsmall400 from '../../index/niftymidsmall400-float.json';

import WatchList from "../Watchlist/Table";

const AVAILABLE_COLUMNS = [
  { id: 'scriptName', label: 'Script', minWidth: 100 },
  { id: 'ltp', label: 'LTP', minWidth: 70 },
  { id: 'changePercentage', label: 'Chg%', minWidth: 60 },
  { id: 'barClosingStrength', label: 'Str%', minWidth: 60 },
  { id: 'relativeVolumePercentage', label: 'RVol%', minWidth: 60 },
  { id: 'gapPercentage', label: 'Gap%', minWidth: 60 },
  { id: 'currentMinuteVolume', label: 'VolROC%', minWidth: 70 },
  { id: 'sl', label: 'SL', minWidth: 60 },
  { id: 'maxShareToBuy', label: 'Shares', minWidth: 60 },
  { id: 'lossInMoney', label: 'Loss', minWidth: 60 },
  { id: 'avgValueVolume21d', label: 'AvgVol', minWidth: 80 },
  { id: 'placeOrder', label: 'Order', minWidth: 80 },
];

const TVChartContainer = () => {
  const chartContainerRef = useRef();
  const tvWidgetRef = useRef(null);
  const { selectedIndex, handleSelectionChange, scriptsToShow, counts } = useWatchlistFilter();
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id || user.id || 'public_user_id';

  // Column Customization State
  const [visibleColumns, setVisibleColumns] = useState(['scriptName', 'ltp', 'changePercentage']);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

  useEffect(() => {
    const initWidget = async () => {
      let savedData = null;
      let savedDataMetaInfo = null;
      let initialSymbol = "NSE_EQ|INE002A01018|RELIANCE";

      try {
        const token = localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        // 1. Fetch list of charts
        const listRes = await fetch(`${BACKEND_URL}/api/tv/1.1/charts?client=trade-dashboard&user=${userId}`, { headers });
        const listData = await listRes.json();

        if (listData.status === 'ok' && listData.data && listData.data.length > 0) {
          const latestChart = listData.data[0];
          // initialSymbol = latestChart.symbol; // saved_data should handle symbol, but keeping as fallback

          // 2. Fetch content of the latest chart
          const contentRes = await fetch(`${BACKEND_URL}/api/tv/1.1/charts?client=trade-dashboard&user=${userId}&chart=${latestChart.id}`, { headers });
          const contentData = await contentRes.json();

          if (contentData.status === 'ok' && contentData.data && contentData.data.content) {
            savedData = JSON.parse(contentData.data.content);
            savedDataMetaInfo = {
              uid: latestChart.id,
              name: latestChart.name,
              description: latestChart.description || "",
              timestamp: latestChart.timestamp,
              resolution: latestChart.resolution,
              symbol: latestChart.symbol,
            };
          }
        }
      } catch (e) {
        console.error("Failed to fetch saved chart data", e);
      }

      const widgetOptions = {
        symbol: initialSymbol || "NSE_EQ|INE002A01018|RELIANCE",
        saved_data: savedData,
        saved_data_meta_info: savedDataMetaInfo,
        datafeed: Datafeed,
        interval: "1D",
        container: chartContainerRef.current,
        library_path: "/charting_library/",
        locale: "en",
        timezone: "Asia/Kolkata",
        fullscreen: true,
        autosize: true,
        studies_overrides: {},
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
        charts_storage_url: `${BACKEND_URL}/api/tv`,
        charts_storage_api_version: "1.1",
        client_id: "trade-dashboard",
        user_id: userId,
        load_last_chart: false,
        custom_headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      };

      const tvWidget = new widget(widgetOptions);

      // TODO: Make this dynamic
      // tvWidget.onChartReady(() => {
      //   const orderLine = tvWidget.activeChart().createOrderLine()
      //     .setTooltip("Additional order information")
      //     .setModifyTooltip("Modify order")
      //     .setCancelTooltip("Cancel order")
      //     .onMove(function () {
      //       this.setText("onMove called");
      //     })
      //     .onModify("onModify called", function (text) {
      //       this.setText(text);
      //     })
      //     .onCancel("onCancel called", function (text) {
      //       this.setText(text);
      //     })
      //     .setText("STOP: 73.5 (5,64%)")
      //     .setQuantity("2")
      //     .setPrice(1280.6);
      // });
      // tvWidget.activeChart().getTimezoneApi().setTimezone("Asia/Kolkata");
      tvWidgetRef.current = tvWidget;
    };

    initWidget();

    return () => {
      if (tvWidgetRef.current) {
        tvWidgetRef.current.remove();
        tvWidgetRef.current = null;
      }
    };
  }, []);

  const handleStockClick = (row) => {
    const symbol = row.symbol;
    const instrumentKey = row.instrumentKey;
    setSelectedSymbol(symbol);
    if (tvWidgetRef.current) {
      // Construct composite symbol: InstrumentKey|TradingSymbol
      const compositeSymbol = `${instrumentKey}|${symbol}`;

      tvWidgetRef.current.onChartReady(() => {
        tvWidgetRef.current.activeChart().setSymbol(compositeSymbol);
      });
    }
  };

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

  const handleSettingsClick = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleColumnToggle = (columnId) => {
    setVisibleColumns(prev => {
      if (prev.includes(columnId)) {
        return prev.filter(id => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const getListName = (index) => {
    switch (index) {
      case 'bullishMB': return 'Bullish MB';
      case 'bullishSLTB': return 'Bullish SLTB';
      case 'bullishAnts': return 'Bullish Ants';
      case 'dollar': return 'Dollar BO';
      case 'bearishMB': return 'Bearish MB';
      case 'bearishSLTB': return 'Bearish SLTB';
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
          width: 380, // Wider for DataGrid
          borderLeft: '1px solid var(--border-color)',
          bgcolor: 'var(--bg-secondary)',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Header with Dropdown */}
          <Box sx={{
            p: 0.625, // 5px
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
              <IconButton size="small" onClick={handleSettingsClick}><SettingsIcon fontSize="small" /></IconButton>
              <Popover
                open={Boolean(settingsAnchorEl)}
                anchorEl={settingsAnchorEl}
                onClose={handleSettingsClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              >
                <Box sx={{ p: 2, maxHeight: 300, overflowY: 'auto' }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Columns</Typography>
                  <FormGroup>
                    {AVAILABLE_COLUMNS.map((col) => (
                      <FormControlLabel
                        key={col.id}
                        control={
                          <Checkbox
                            size="small"
                            checked={visibleColumns.includes(col.id)}
                            onChange={() => handleColumnToggle(col.id)}
                          />
                        }
                        label={<Typography variant="body2">{col.label}</Typography>}
                      />
                    ))}
                  </FormGroup>
                </Box>
              </Popover>
              <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
              <IconButton size="small"><MoreHorizIcon fontSize="small" /></IconButton>
            </Box>
          </Box>

          {/* Watchlist Table */}
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <WatchList
              scripts={scriptsToShow}
              visibleColumns={visibleColumns}
              onRowClick={handleStockClick}
              compact={true}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TVChartContainer;
