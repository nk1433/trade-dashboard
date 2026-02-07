import React, { useState, useMemo, useEffect } from 'react';
import { Box, IconButton, Tooltip, Snackbar, Alert, Typography, Popover } from '@mui/material';
import { DataGrid, GridLogicOperator } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { updatePaperHoldingsLTP, executePaperOrder } from '../../Store/paperTradeSlice';
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
  Size: 'allocPer',
  Risk: 'riskPercentage',
  BarClosingStrength: 'barClosingStrength',
  'Change %': 'changePercentage',
  'Price Change': 'priceChange',
  'Loss': 'lossInMoney',
  'avgValueVolume21d': 'avgValueVolume21d',
  currentMinuteVolume: 'currentMinuteVolume',
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
  onFlagChange
}) => {
  const [filterModel, setFilterModel] = useState(initialfilterModel);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);

  // Info Popover State
  const [infoAnchorEl, setInfoAnchorEl] = useState(null);
  const [hoveredSymbol, setHoveredSymbol] = useState(null);

  const dispatch = useDispatch();
  const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');
  const token = useSelector((state) => state.auth?.token);

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
        width: 50,
        renderCell: (params) => {
          const symbol = params.row.symbol;
          const currentFlag = flaggedStocks[symbol] || null;

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
                currentFlag={currentFlag}
                onFlagChange={handleFlagChange}
              />
            </Box>
          );
        }
      },
      {
        field: "scriptName",
        headerName: "Script",
        width: 270, // widened for icon
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
                textDecoration: params.row.trendIntensity > 1 ? 'underline' : 'none'
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
      {
        field: 'placeOrder',
        headerName: 'Order',
        width: 100,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const handlePlaceOrder = (event) => {
            event.stopPropagation(); // prevent row selection on click
            setSelectedScript(params.row);
            setOrderPanelOpen(true);
          };

          return (
            <button type="button" onClick={handlePlaceOrder}>
              Buy/Sell
            </button>
          );
        }
      },
      { field: "barClosingStrength", headerName: "Closing Strength %", type: 'number', },
      {
        field: "changePercentage",
        headerName: "Change %",
        width: 60,
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
        width: 60,
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
        field: "placeOrder", // Reusing placeOrder for consistency, or custom actions
        headerName: "Actions",
        width: 160,
        renderCell: (params) => {
          const handleExit = (e) => {
            e.stopPropagation();
            if (window.confirm(`Are you sure you want to exit ${params.row.symbol}?`)) {
              dispatch(executePaperOrder({
                symbol: params.row.symbol,
                quantity: params.row.quantity,
                price: params.row.ltp,
                type: 'SELL',
                timestamp: Date.now()
              }));
            }
          };

          const handleBuy = (e) => {
            e.stopPropagation();
            setSelectedScript(params.row);
            setOrderPanelOpen(true);
          };

          return (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <button type="button" onClick={handleBuy}>Buy</button>
              <button type="button" onClick={handleExit} style={{ color: DOWN_COLOR }}>Exit</button>
            </Box>
          );
        }
      }
    ],
    allocationSuggestions: [
      { field: "allocPer", headerName: "Size" },
      { field: "riskPercentage", headerName: "Risk" },
    ],
  }), [tradingMode, token, dispatch, flaggedStocks, onFlagChange]); // Props dependencies

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
          if (compact) {
            width = 120;
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
                  textDecoration: params.row.trendIntensity > 1 ? 'underline' : 'none'
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
      // Always show 'flag' and 'placeOrder'
      acc[col.field] = visibleColumns.includes(col.field) || col.field === 'placeOrder' || col.field === 'flag';
      return acc;
    }, {})
    : undefined;

  return (
    <div className="geist-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DataGrid
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        initialState={{
          pagination: { paginationModel: { pageSize: 25 } },
        }}
        rows={rows}
        columns={columns}
        getRowId={row => row.id}
        pageSizeOptions={[5, 10, 25, { value: -1, label: 'All' }]}
        columnVisibilityModel={columnVisibilityModel}
        onRowClick={onRowClick ? (params) => onRowClick(params.row) : undefined}
        density={compact ? "compact" : "standard"}
        sx={{
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
  onFlagChange: PropTypes.func
};

export default WatchList;