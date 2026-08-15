import React, { useState, useMemo, useEffect } from 'react';
import { Box, IconButton, Tooltip, Snackbar, Alert, Typography, Popover, Button, Chip, Drawer, Tabs, Tab, TextField } from '@mui/material';
import { DataGrid, GridLogicOperator, useGridApiRef } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { updatePaperHoldingsLTP, executePaperOrder, updatePaperHoldingAsync } from '../../Store/paperTradeSlice';
import { formatToIndianUnits } from '../../utils';
import OrderPanel from './OrderPanel';
import TradingViewFinancialsWidget from '../molicules/TradingViewFinancialsWidget';
import FlagMenu from './FlagMenu';

const UP_COLOR = '#26a69a'; // Lighter Teal/Green
const DOWN_COLOR = '#ef5350'; // Lighter Red

const columnMapping = {
  Flag: 'flag',
  LTP: 'ltp',
  SL: 'sl',
  Shares: 'maxShareToBuy',
  'Max Alloc': 'maxAllocationPercentage',
  'R-vol % / 21 D': 'relativeVolumePercentage',
  'Gap %': 'gapPercentage',
  'Strong Start': 'strongStart',
  'Strict Strong Start': 'strictStrongStart',
  Size: 'allocPer',
  Risk: 'riskPercentage',
  BarClosingStrength: 'barClosingStrength',
  'Change %': 'changePercentage',
  'Price Change': 'priceChange',
  'Loss': 'lossInMoney',
  'avgValueVolume21d': 'avgValueVolume21d',
  currentMinuteVolume: 'currentMinuteVolume',
  'Move Value (Cr)': 'tradedValue',
};

const initialfilterModel = {
  items: [],
  logicOperator: GridLogicOperator.And,
};

const WatchList = ({
  scripts,
  type = 'dashboard',
  visibleColumns,
  onRowClick,
  compact = false,
  flaggedStocks = {},
  onFlagChange,
  selectedRowId
}) => {
  const [filterModel, setFilterModel] = useState(initialfilterModel);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);

  // Info Popover State
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [hoveredSymbol, setHoveredSymbol] = useState(null);

  const apiRef = useGridApiRef();

  // Manage Position Drawer state
  const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
  const [selectedHolding, setSelectedHolding] = useState(null);
  const [manageTab, setManageTab] = useState(0); // 0: Modify SL, 1: Add (Buy), 2: Sell / Exit

  // Tab 0: SL inputs
  const [newSlPrice, setNewSlPrice] = useState('');

  // Tab 1: Buy inputs
  const [buyQty, setBuyQty] = useState(1);
  const [buyPrice, setBuyPrice] = useState('');
  const [buyOrderType, setBuyOrderType] = useState('MARKET'); // MARKET / LIMIT

  // Tab 2: Sell inputs
  const [sellQty, setSellQty] = useState(1);
  const [sellPrice, setSellPrice] = useState('');
  const [sellOrderType, setSellOrderType] = useState('MARKET'); // MARKET / LIMIT

  const handleOpenManage = (row) => {
    setSelectedHolding(row);
    setNewSlPrice(row.sl || '');
    
    setBuyQty(1);
    setBuyPrice(row.ltp || '');
    setBuyOrderType('MARKET');

    setSellQty(row.quantity || 1);
    setSellPrice(row.ltp || '');
    setSellOrderType('MARKET');

    setManageTab(0); // Start on Modify SL tab by default
    setManageDrawerOpen(true);
  };

  const handleCloseManage = () => {
    setManageDrawerOpen(false);
    setSelectedHolding(null);
  };

  const handleManageSlSubmit = async () => {
    try {
      const action = await dispatch(updatePaperHoldingAsync({
        symbol: selectedHolding.symbol,
        sl: Number(newSlPrice)
      }));
      if (updatePaperHoldingAsync.fulfilled.match(action)) {
        setSnackbarMessage(`Stop Loss updated to ₹${Number(newSlPrice).toFixed(2)} for ${selectedHolding.symbol}`);
        setSnackbarOpen(true);
        handleCloseManage();
      } else {
        setSnackbarMessage(`Failed to update Stop Loss: ${action.payload || "Unknown error"}`);
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage(`Error: ${err.message}`);
      setSnackbarOpen(true);
    }
  };

  const handleManageBuySubmit = async () => {
    try {
      const finalPrice = buyOrderType === 'MARKET' ? (selectedHolding.ltp || 0) : Number(buyPrice);
      const action = await dispatch(executePaperOrder({
        symbol: selectedHolding.symbol,
        quantity: Number(buyQty),
        price: finalPrice,
        type: 'BUY',
        timestamp: Date.now(),
        sl: selectedHolding.sl || 0,
        slPrice: selectedHolding.sl || 0,
        riskAmount: 0,
        riskPercentage: 0,
        slStrategy: 'custom',
        slPercentage: 0,
        risk: 0
      }));
      if (executePaperOrder.fulfilled.match(action)) {
        setSnackbarMessage(`Bought ${buyQty} shares of ${selectedHolding.symbol}`);
        setSnackbarOpen(true);
        handleCloseManage();
      } else {
        setSnackbarMessage(`Buy order failed: ${action.payload || "Unknown error"}`);
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage(`Error: ${err.message}`);
      setSnackbarOpen(true);
    }
  };

  const handleManageSellSubmit = async () => {
    try {
      const finalPrice = sellOrderType === 'MARKET' ? (selectedHolding.ltp || 0) : Number(sellPrice);
      const action = await dispatch(executePaperOrder({
        symbol: selectedHolding.symbol,
        quantity: Number(sellQty),
        price: finalPrice,
        type: 'SELL',
        timestamp: Date.now(),
        sl: selectedHolding.sl || 0,
        slPrice: selectedHolding.sl || 0,
        riskAmount: 0,
        riskPercentage: 0,
        slStrategy: 'custom',
        slPercentage: 0,
        risk: 0
      }));
      if (executePaperOrder.fulfilled.match(action)) {
        setSnackbarMessage(`Sold ${sellQty} shares of ${selectedHolding.symbol}`);
        setSnackbarOpen(true);
        handleCloseManage();
      } else {
        setSnackbarMessage(`Sell order failed: ${action.payload || "Unknown error"}`);
        setSnackbarOpen(true);
      }
    } catch (err) {
      setSnackbarMessage(`Error: ${err.message}`);
      setSnackbarOpen(true);
    }
  };

  // Keyboard navigation: Space to move to next row
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.isContentEditable) return;

      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        if (!selectedRowId || !onRowClick) return;

        try {
          const sortedRowIds = apiRef.current.getSortedRowIds();
          const currentIndex = sortedRowIds.indexOf(selectedRowId);
          
          if (currentIndex !== -1) {
            let targetIndex = -1;
            
            if (e.shiftKey) {
              // Go backwards
              if (currentIndex > 0) targetIndex = currentIndex - 1;
            } else {
              // Go forwards
              if (currentIndex < sortedRowIds.length - 1) targetIndex = currentIndex + 1;
            }
            
            if (targetIndex !== -1) {
              const targetRowId = sortedRowIds[targetIndex];
              const targetRow = apiRef.current.getRow(targetRowId);
              if (targetRow) {
                onRowClick(targetRow);
                // Scroll to keep the newly selected row in view
                apiRef.current.scrollToIndexes({ rowIndex: targetIndex });
              }
            }
          }
        } catch (err) {
          console.warn("Could not navigate to next/prev row", err);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRowId, onRowClick, apiRef]);

  const dispatch = useDispatch();
  const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');
  const token = useSelector((state) => state.auth?.token);
  const { capital, holdings } = useSelector((state) => state.paperTrade || { capital: 1000000, holdings: [] });

  const totalCurrentValue = useMemo(() => holdings.reduce((acc, curr) => acc + (curr.currentValue || (curr.ltp * curr.quantity) || 0), 0), [holdings]);
  const totalPortfolioValue = capital + totalCurrentValue;

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  // Update Paper Holdings LTP whenever scripts change
  useEffect(() => {
    if (scripts) {
      const ltpMap = {};
      Object.values(scripts).forEach(script => {
        ltpMap[script.symbol] = script.ltp;
      });
      dispatch(updatePaperHoldingsLTP(ltpMap));
    }
  }, [scripts, dispatch]);

  const columnsConfig = useMemo(() => ({
    dashboard: [
      {
        field: "flag",
        headerName: "", // Icon only header? Or empty
        width: 40, // Reduced from 50
        renderCell: (params) => {
          const symbol = params.row.symbol;
          const currentFlags = flaggedStocks[symbol] || [];

          /* 
             Handle Flag Change:
             We need to update the parent state.
             We prevent row click propagation.
          */
          const handleFlagChange = (color) => {
            if (onFlagChange) {
              onFlagChange(symbol, color);
            }
          };

          return (
            <Box onClick={(e) => e.stopPropagation()}>
              <FlagMenu
                currentFlags={currentFlags}
                onFlagChange={handleFlagChange}
              />
            </Box>
          );
        }
      },
      {
        field: "scriptName",
        headerName: "Script",
        width: 270, // This will be overridden by compact mode in makeColumns
        renderCell: (params) => {
          const isUp = params.row.isUpDay;
          const color = isUp ? UP_COLOR : DOWN_COLOR;

          // Copy to clipboard handler
          const handleCopy = (e) => {
            e.stopPropagation(); // prevent row select on click
            navigator.clipboard.writeText(params.row.symbol)
              .then(() => { /* optionally show a success message */ })
              .catch(() => { /* optionally handle errors */ });
          };

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{
                fontSize: compact ? '0.75rem' : 'inherit',
                fontWeight: compact ? 500 : 'inherit',
                textDecoration: params.row.trendIntensity > 1.05 ? 'underline' : 'none'
              }}>{params.row.symbol}</span>
              <Tooltip title="Copy script name">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  aria-label="copy script name"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          );
        },
      },

      { field: "barClosingStrength", headerName: "Closing Strength %", type: 'number', width: 85 }, // Set specific width
      {
        field: "changePercentage",
        headerName: "Change %",
        width: 65, // slightly adjusted
        renderCell: (params) => {
          const isUp = params.row.isUpDay;
          const color = isUp ? UP_COLOR : DOWN_COLOR;
          const value = params.value != null ? Number(params.value).toFixed(2) : '-';

          return <span style={{ color }}>{value}</span>;
        }
      },
      {
        field: "priceChange",
        headerName: "Change",
        width: 65, // slightly adjusted
        renderCell: (params) => {
          const value = params.value;
          const color = value > 0 ? UP_COLOR : DOWN_COLOR;
          const displayValue = value != null ? Number(value).toFixed(2) : '-';

          return <span style={{ color }}>{displayValue}</span>;
        }
      },
      { field: "relativeVolumePercentage", headerName: "R-vol % / 21 D" },
      {
        field: "gapPercentage",
        headerName: "Gap %",
        renderCell: (params) => {
          const gapupPer = params.row.gapPercentage;
          const color = gapupPer > 0 ? UP_COLOR : DOWN_COLOR;

          return <span style={{ color }}>{params.value}</span>;
        }
      },
      {
        field: "currentMinuteVolume",
        headerName: "Volume ROC %",
        width: 130,
        renderCell: (params) => {
          const color = params.value > 0 ? UP_COLOR : DOWN_COLOR;
          return <span style={{ color }}>{params.value?.toFixed(2)}</span>;
        }
      },
      {
        field: "strongStart",
        headerName: "Strong Start",
        renderCell: (params) => <>{params.row.strongStart ? "Yes" : "-"}</>,
      },
      {
        field: "strictStrongStart",
        headerName: "Strict Strong Start",
        renderCell: (params) => <>{params.row.strictStrongStart ? "Yes" : "-"}</>,
      },
      { field: "sl", headerName: "SL" },
      { field: "maxShareToBuy", headerName: "Shares" },
      { field: "maxAllocationPercentage", headerName: "Max Alloc" },
      { field: "lossInMoney", headerName: "Loss" },
      {
        field: "ltp",
        headerName: "LTP",
        renderCell: (params) => {
          const isUp = params.row.isUpDay;
          const color = isUp ? UP_COLOR : DOWN_COLOR;
          const value = params.value != null ? Number(params.value).toFixed(2) : '-';

          return <span style={{ color }}>{value}</span>;
        },
      },
      {
        field: "avgValueVolume21d",
        headerName: "Avg Value Vol (21 D)",
        width: 150,
        renderCell: (params) => {
          return <span>{formatToIndianUnits(params.value)}</span>;
        }
      },
      {
        field: "tradedValue",
        headerName: "Move Value (Cr)",
        width: 120,
        renderCell: (params) => {
          const val = params.value;
          return <span>{val > 0 ? val.toFixed(2) : '-'}</span>;
        }
      }
    ],
    // Holdings columns
    holdings: [
      {
        field: "symbol",
        headerName: "Company",
        width: 150,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 500, lineHeight: 1.2 }}>
              {params.value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              {params.row.quantity} • Avg. ₹{params.row.avgPrice?.toFixed(2)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "ltp",
        headerName: "Market Price",
        type: 'number',
        width: 120,
        renderCell: (params) => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 400 }}>
              ₹{params.value?.toFixed(2)}
            </Typography>
          </Box>
        ),
      },
      {
        field: "pnl",
        headerName: "Returns (%)",
        width: 140,
        renderCell: (params) => {
          const invested = params.row.invested || (params.row.avgPrice * params.row.quantity);
          const currentVal = params.row.currentValue || (params.row.ltp * params.row.quantity);
          const pnl = currentVal - invested;
          const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;
          const isProfit = pnl >= 0;
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 400, color: isProfit ? UP_COLOR : DOWN_COLOR }}>
                {isProfit ? '+' : ''}₹{formatToIndianUnits(pnl)}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: '0.7rem', color: isProfit ? UP_COLOR : DOWN_COLOR }}>
                ({pnlPercentage.toFixed(2)}%)
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "currentValue",
        headerName: "Current / Alloc",
        width: 140,
        renderCell: (params) => {
          const currentVal = params.row.currentValue || (params.row.ltp * params.row.quantity);
          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
              <Typography variant="body2" sx={{ fontWeight: 400 }}>
                ₹{formatToIndianUnits(currentVal)}
              </Typography>
            </Box>
          );
        }
      },
      {
        field: "risk",
        headerName: "Risk / SL",
        width: 140,
        renderCell: (params) => {
          const risk = params.row.sl ? (params.row.avgPrice - params.row.sl) * params.row.quantity : null;
          const hasRisk = risk > 0;
          const color = hasRisk ? DOWN_COLOR : 'inherit';
          const riskPercentage = risk !== null && totalPortfolioValue > 0 ? (risk / totalPortfolioValue) * 100 : null;
          const slPercentage = params.row.sl && params.row.avgPrice ? ((params.row.avgPrice - params.row.sl) / params.row.avgPrice) * 100 : null;

          return (
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {riskPercentage !== null && (
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: color, bgcolor: hasRisk ? '#fef2f2' : 'transparent', px: 0.5, py: 0.2, borderRadius: 1, fontWeight: 600 }}>
                    {riskPercentage.toFixed(2)}%
                  </Typography>
                )}
                <Typography variant="body2" sx={{ fontWeight: 400, color: color }}>
                  {risk !== null ? `₹${formatToIndianUnits(risk)}` : '-'}
                </Typography>
              </Box>
              {params.row.sl > 0 && (
                <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>
                  SL: ₹{params.row.sl.toFixed(2)} {slPercentage !== null && `(${slPercentage.toFixed(2)}%)`}
                </Typography>
              )}
            </Box>
          );
        }
      },
      {
        field: "placeOrder",
        headerName: "Actions",
        width: 120,
        sortable: false,
        renderCell: (params) => (
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => { e.stopPropagation(); handleOpenManage(params.row); }}
            sx={{
              fontSize: '0.75rem',
              py: 0.5,
              px: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1.5,
              color: '#000',
              borderColor: '#e2e8f0',
              '&:hover': {
                bgcolor: '#f8fafc',
                borderColor: '#cbd5e1'
              }
            }}
          >
            Manage
          </Button>
        )
      }
    ],
    allocationSuggestions: [
      { field: "allocPer", headerName: "Size" },
      { field: "riskPercentage", headerName: "Risk" },
    ],
  }), [tradingMode, token, dispatch, flaggedStocks, onFlagChange, totalPortfolioValue]); // Props dependencies

  const columns = makeColumns(columnsConfig[type]);

  // Helper to process columns logic
  function makeColumns(colConfig) {
    if (!colConfig) return [];
    return colConfig
      .map(col => {
        let field = '';
        let headerName = '';
        let width, renderCell, filterable, type;

        if (col.name) {
          field = columnMapping[col.name] || '';
          headerName = col.name;
          width = col.width;
          renderCell = col.renderCell ?? (col.value && col.name === "Script" ? (params) => col.value(params.row) : undefined);
          filterable = col.filterable;
          type = col.type;
        } else if (col.field && (col.headerName !== undefined)) { // Use !== undefined just in case headerName is empty string
          ({ field, headerName, width, renderCell, filterable, type } = col);
        }

        if (field === 'scriptName') {
          let flex;
          if (compact) {
            flex = 1;
            width = undefined;
          }
          renderCell = (params) => {
            const isUp = params.row.isUpDay;
            // ... logic
            const handleCopy = (e) => {
              e.stopPropagation();
              navigator.clipboard.writeText(params.row.symbol);
            };
            return (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span style={{
                  fontSize: compact ? '0.75rem' : 'inherit',
                  fontWeight: compact ? 500 : 'inherit',
                  textDecoration: params.row.trendIntensity > 1.05 ? 'underline' : 'none'
                }}>{params.row.symbol}</span>
                {!compact && (
                  <Tooltip title="Copy script name">
                    <IconButton size="small" onClick={handleCopy}>
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          };

          return {
            field,
            headerName,
            ...(width && { width }),
            ...(flex && { flex }),
            ...(renderCell && { renderCell }),
            ...(filterable !== undefined && { filterable }),
            ...(type && { type }),
          };
        }

        if (!field || (headerName === undefined)) return null;

        return {
          field,
          headerName,
          ...(width && { width }),
          ...(renderCell && { renderCell }),
          ...(filterable !== undefined && { filterable }),
          ...(type && { type }),
        };
      })
      .filter(Boolean);
  }

  const rows = Object.values(scripts).map(metric => ({
    id: metric.instrumentKey || metric.symbol,
    ...metric,
  }));

  // Handle column visibility
  // Force 'flag' to be visible if it exists in columns.
  const columnVisibilityModel = visibleColumns
    ? columns.reduce((acc, col) => {
      // Always show 'flag'
      acc[col.field] = visibleColumns.includes(col.field) || col.field === 'flag';
      return acc;
    }, {})
    : undefined;

  return (
    <div className="geist-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <DataGrid
        apiRef={apiRef}
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        rows={rows}
        columns={columns}
        getRowId={row => row.id}
        pageSizeOptions={[5, 10, 25, 100]}
        columnVisibilityModel={columnVisibilityModel}
        getRowClassName={(params) => params.row.id === selectedRowId ? 'selected-row' : ''}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        density={compact ? "compact" : "standard"}
        sx={{
          flex: 1,
          border: 'none',
          fontSize: '0.8rem', // Slimmer text
          '& .MuiDataGrid-cell': {
            borderColor: 'var(--border-color)',
            paddingTop: '2px', // Reduce padding slightly to fit slim rows better if needed
            paddingBottom: '2px',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: 500, // Reduced weight here
            textTransform: 'uppercase',
            fontSize: '0.7rem', // Smaller header text
            letterSpacing: '0.05em',
            color: 'var(--text-secondary)'
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'var(--bg-secondary)',
            cursor: onRowClick ? 'pointer' : 'default',
          },
          '& .selected-row': {
            backgroundColor: 'rgba(25, 118, 210, 0.08) !important',
          }
        }}
      />
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%', bgcolor: '#333', color: '#fff', '& .MuiAlert-icon': { color: '#4caf50' } }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <OrderPanel
        open={orderPanelOpen}
        onClose={() => setOrderPanelOpen(false)}
        script={selectedScript ? (scripts[selectedScript.instrumentKey || selectedScript.symbol] || selectedScript) : null}
        currentPrice={selectedScript ? (scripts[selectedScript.instrumentKey || selectedScript.symbol]?.ltp || selectedScript.ltp) : 0}
        tradingMode={tradingMode}
        token={token}
      />
      {/* Manage Position Drawer */}
      <Drawer
        anchor="right"
        open={manageDrawerOpen}
        onClose={handleCloseManage}
        PaperProps={{ sx: { width: 420, p: 3, display: 'flex', flexDirection: 'column', gap: 3 } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Manage Position
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {selectedHolding?.symbol} • Avg: ₹{selectedHolding?.avgPrice?.toFixed(2)}
            </Typography>
          </Box>
          <IconButton onClick={handleCloseManage} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Current Price (LTP)</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{selectedHolding?.ltp?.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Current Position</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedHolding?.quantity} shares</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">Returns</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: (selectedHolding?.pnl >= 0) ? '#059669' : '#dc2626' }}>
              {selectedHolding?.pnl >= 0 ? '+' : ''}₹{formatToIndianUnits(selectedHolding?.pnl || 0)} ({selectedHolding?.pnlPercentage?.toFixed(2)}%)
            </Typography>
          </Box>
        </Box>

        <Tabs
          value={manageTab}
          onChange={(e, val) => setManageTab(val)}
          variant="fullWidth"
          sx={{
            borderBottom: '1px solid #e2e8f0',
            '& .MuiTabs-indicator': { backgroundColor: '#000 !important' },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: '#64748b',
              '&.Mui-selected': { color: '#000 !important' }
            }
          }}
        >
          <Tab label="Modify SL" />
          <Tab label="Buy More" />
          <Tab label="Sell / Exit" />
        </Tabs>

        {/* Tab 0: Modify SL */}
        {manageTab === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Stop Loss Price</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setNewSlPrice(selectedHolding?.avgPrice?.toFixed(2))}
                  sx={{
                    py: 0.25,
                    fontSize: '0.7rem',
                    textTransform: 'none',
                    color: '#000',
                    borderColor: '#000',
                    '&:hover': { bgcolor: '#f8fafc', borderColor: '#000' }
                  }}
                >
                  Set to BE (₹{selectedHolding?.avgPrice?.toFixed(2)})
                </Button>
              </Box>
              <TextField
                type="number"
                fullWidth
                size="small"
                value={newSlPrice}
                onChange={(e) => setNewSlPrice(e.target.value)}
                placeholder="Enter Stop Loss Price"
                InputProps={{
                  startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                }}
              />
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={handleManageSlSubmit}
              disabled={!newSlPrice || Number(newSlPrice) <= 0}
              sx={{
                mt: 'auto',
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#000 !important',
                color: '#fff !important',
                '&:hover': { bgcolor: '#222 !important' },
                '&.Mui-disabled': { bgcolor: '#f1f5f9 !important', color: '#94a3b8 !important' }
              }}
            >
              Update Stop Loss
            </Button>
          </Box>
        )}

        {/* Tab 1: Buy More */}
        {manageTab === 1 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setBuyOrderType('MARKET')}
                  sx={{
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: buyOrderType === 'MARKET' ? '#000 !important' : 'transparent',
                    color: buyOrderType === 'MARKET' ? '#fff !important' : '#000',
                    border: '1px solid #000',
                    '&:hover': { bgcolor: buyOrderType === 'MARKET' ? '#222 !important' : '#f8fafc' }
                  }}
                >
                  Market
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setBuyOrderType('LIMIT')}
                  sx={{
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: buyOrderType === 'LIMIT' ? '#000 !important' : 'transparent',
                    color: buyOrderType === 'LIMIT' ? '#fff !important' : '#000',
                    border: '1px solid #000',
                    '&:hover': { bgcolor: buyOrderType === 'LIMIT' ? '#222 !important' : '#f8fafc' }
                  }}
                >
                  Limit
                </Button>
              </Box>

              <TextField
                label="Quantity"
                type="number"
                fullWidth
                size="small"
                value={buyQty}
                onChange={(e) => setBuyQty(e.target.value)}
              />

              {buyOrderType === 'LIMIT' && (
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  size="small"
                  value={buyPrice}
                  onChange={(e) => setBuyPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                  }}
                />
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ₹{formatToIndianUnits(Number(buyQty) * (buyOrderType === 'MARKET' ? (selectedHolding?.ltp || 0) : Number(buyPrice || 0)))}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={handleManageBuySubmit}
              disabled={Number(buyQty) <= 0 || (buyOrderType === 'LIMIT' && (!buyPrice || Number(buyPrice) <= 0))}
              sx={{
                mt: 'auto',
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#000 !important',
                color: '#fff !important',
                '&:hover': { bgcolor: '#222 !important' },
                '&.Mui-disabled': { bgcolor: '#f1f5f9 !important', color: '#94a3b8 !important' }
              }}
            >
              Place Buy Order
            </Button>
          </Box>
        )}

        {/* Tab 2: Sell / Exit */}
        {manageTab === 2 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={() => setSellOrderType('MARKET')}
                  sx={{
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: sellOrderType === 'MARKET' ? '#000 !important' : 'transparent',
                    color: sellOrderType === 'MARKET' ? '#fff !important' : '#000',
                    border: '1px solid #000',
                    '&:hover': { bgcolor: sellOrderType === 'MARKET' ? '#222 !important' : '#f8fafc' }
                  }}
                >
                  Market
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => setSellOrderType('LIMIT')}
                  sx={{
                    py: 0.75,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: sellOrderType === 'LIMIT' ? '#000 !important' : 'transparent',
                    color: sellOrderType === 'LIMIT' ? '#fff !important' : '#000',
                    border: '1px solid #000',
                    '&:hover': { bgcolor: sellOrderType === 'LIMIT' ? '#222 !important' : '#f8fafc' }
                  }}
                >
                  Limit
                </Button>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                {[0.25, 0.50, 0.75, 1.00].map((pct) => (
                  <Button
                    key={pct}
                    variant="outlined"
                    size="small"
                    onClick={() => setSellQty(Math.floor((selectedHolding?.quantity || 0) * pct) || 1)}
                    sx={{
                      py: 0.25,
                      flex: 1,
                      fontSize: '0.75rem',
                      textTransform: 'none',
                      color: '#000',
                      borderColor: '#cbd5e1',
                      '&:hover': { bgcolor: '#f8fafc', borderColor: '#000' }
                    }}
                  >
                    {pct === 1 ? '100%' : `${pct * 100}%`}
                  </Button>
                ))}
              </Box>

              <TextField
                label="Quantity to Sell"
                type="number"
                fullWidth
                size="small"
                value={sellQty}
                onChange={(e) => setSellQty(e.target.value)}
              />

              {sellOrderType === 'LIMIT' && (
                <TextField
                  label="Price"
                  type="number"
                  fullWidth
                  size="small"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                  }}
                />
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
                <Typography variant="body2" color="text.secondary">Estimated Credits</Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  ₹{formatToIndianUnits(Number(sellQty) * (sellOrderType === 'MARKET' ? (selectedHolding?.ltp || 0) : Number(sellPrice || 0)))}
                </Typography>
              </Box>
            </Box>
            <Button
              variant="contained"
              fullWidth
              onClick={handleManageSellSubmit}
              disabled={Number(sellQty) <= 0 || Number(sellQty) > (selectedHolding?.quantity || 0) || (sellOrderType === 'LIMIT' && (!sellPrice || Number(sellPrice) <= 0))}
              sx={{
                mt: 'auto',
                py: 1.2,
                fontWeight: 600,
                textTransform: 'none',
                bgcolor: '#000 !important',
                color: '#fff !important',
                '&:hover': { bgcolor: '#222 !important' },
                '&.Mui-disabled': { bgcolor: '#f1f5f9 !important', color: '#94a3b8 !important' }
              }}
            >
              Place Sell Order
            </Button>
          </Box>
        )}
      </Drawer>
      <Popover
        id="mouse-over-popover"
        sx={{
          pointerEvents: 'none',
        }}
        open={Boolean(infoAnchorEl)}
        anchorEl={infoAnchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => {
          setInfoAnchorEl(null);
          setHoveredSymbol(null);
        }}
        disableRestoreFocus
      >
        <Box
          sx={{ width: 400, height: 450, bgcolor: 'background.paper', border: '1px solid #ccc', p: 1 }}
          onMouseLeave={() => {
            setInfoAnchorEl(null);
            setHoveredSymbol(null);
          }}
          style={{ pointerEvents: 'auto' }} // Enable interaction within the popover
        >
          {hoveredSymbol && <TradingViewFinancialsWidget symbol={hoveredSymbol} />}
        </Box>
      </Popover>
    </div>
  );
};

WatchList.propTypes = {
  scripts: PropTypes.object,
  type: PropTypes.string,
  visibleColumns: PropTypes.arrayOf(PropTypes.string),
  onRowClick: PropTypes.func,
  compact: PropTypes.bool,
  flaggedStocks: PropTypes.object,
  onFlagChange: PropTypes.func,
  selectedRowId: PropTypes.string
};

export default WatchList;