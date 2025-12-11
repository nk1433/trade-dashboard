import React, { useState, useMemo, useEffect } from 'react';
import { Box, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import { DataGrid, GridLogicOperator } from '@mui/x-data-grid';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { updatePaperHoldingsLTP, executePaperOrder } from '../../Store/paperTradeSlice';
import { formatToIndianUnits } from '../../utils';
import OrderPanel from './OrderPanel';

const columnMapping = {
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
  'Loss': 'lossInMoney',
  'avgValueVolume21d': 'avgValueVolume21d',
  currentMinuteVolume: 'currentMinuteVolume',
};

const initialfilterModel = {
  items: [],
  logicOperator: GridLogicOperator.And,
};

const WatchList = ({ scripts, type = 'dashboard', visibleColumns, onRowClick, compact = false }) => {
  const [filterModel, setFilterModel] = useState(initialfilterModel);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [orderPanelOpen, setOrderPanelOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState(null);

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
        field: "scriptName",
        headerName: "Script",
        width: 300, // widened for icon
        renderCell: (params) => {
          const isUp = params.row.isUpDay;
          const color = isUp ? "green" : "red";

          // Copy to clipboard handler
          const handleCopy = (e) => {
            e.stopPropagation(); // prevent row select on click
            navigator.clipboard.writeText(params.row.symbol)
              .then(() => { /* optionally show a success message */ })
              .catch(() => { /* optionally handle errors */ });
          };

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span>{params.row.symbol}</span>
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
        headerName: 'Place Order',
        width: 130,
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
              Place Order
            </button>
          );
        }
      },
      { field: "barClosingStrength", headerName: "Closing Strength %", type: 'number', },
      {
        field: "changePercentage",
        headerName: "Change %",
        renderCell: (params) => {
          const isUp = params.row.isUpDay;
          const color = isUp ? "green" : "red";
          const value = params.value != null ? Number(params.value).toFixed(2) : '-';

          return <span style={{ color }}>{value}%</span>;
        }
      },
      { field: "relativeVolumePercentage", headerName: "R-vol % / 21 D" },
      {
        field: "gapPercentage",
        headerName: "Gap %",
        renderCell: (params) => {
          const gapupPer = params.row.gapPercentage;
          const color = gapupPer > 0 ? "green" : "red";

          return <span style={{ color }}>{params.value}%</span>;
        }
      },
      {
        field: "currentMinuteVolume",
        headerName: "Volume ROC %",
        width: 130,
        renderCell: (params) => {
          const color = params.value > 0 ? "green" : "red";
          return <span style={{ color }}>{params.value?.toFixed(2)}%</span>;
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
          const color = isUp ? "green" : "red";
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

      //TODO: Create a fallback(-), percentage(%) components.
    ],
    allocationSuggestions: [
      { field: "allocPer", headerName: "Size" },
      { field: "riskPercentage", headerName: "Risk" },
    ],
  }), [tradingMode, token]);

  const columns = columnsConfig[type]
    .map(col => {
      let field = '';
      let headerName = '';
      let width, renderCell, filterable;

      if (col.name) {
        field = columnMapping[col.name] || '';
        headerName = col.name;
        width = col.width;
        renderCell = col.renderCell ?? (col.value && col.name === "Script" ? (params) => col.value(params.row) : undefined);
        filterable = col.filterable;
      } else if (col.field && col.headerName) {
        ({ field, headerName, width, renderCell, filterable } = col);
      }

      // Override renderCell for scriptName to handle compact mode
      if (field === 'scriptName') {
        if (compact) {
          width = 120;
        }
        renderCell = (params) => {
          const isUp = params.row.isUpDay;
          const color = isUp ? "green" : "red";

          const handleCopy = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(params.row.symbol)
              .then(() => { /* optionally show a success message */ })
              .catch(() => { /* optionally handle errors */ });
          };

          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ fontSize: compact ? '0.75rem' : 'inherit', fontWeight: compact ? 600 : 'inherit' }}>{params.row.symbol}</span>
              {!compact && (
                <Tooltip title="Copy script name">
                  <IconButton
                    size="small"
                    onClick={handleCopy}
                    aria-label="copy script name"
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          );
        };
      }

      if (!field || !headerName) return null;  // Discard invalid columns

      return {
        field,
        headerName,
        ...(width && { width }),
        ...(renderCell && { renderCell }),
        ...(filterable !== undefined && { filterable }),
        ...(col.type && { type: col.type }),
      };
    })
    .filter(Boolean);  // Remove nulls

  const rows = Object.values(scripts).map(metric => ({
    id: metric.instrumentKey,
    ...metric,
  }));

  function handleCopyColumn(field) {
    const values = rows.map(row => row[field]);
    const textToCopy = values.join(','); // comma, no space

    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setSnackbarMessage('Copied to clipboard!');
        setSnackbarOpen(true);
      })
      .catch(() => {
        setSnackbarMessage('Copy failed.');
        setSnackbarOpen(true);
      });
  }

  // Handle column visibility
  const columnVisibilityModel = visibleColumns
    ? columns.reduce((acc, col) => {
      acc[col.field] = visibleColumns.includes(col.field) || col.field === 'placeOrder'; // Force placeOrder to be visible
      return acc;
    }, {})
    : undefined;

  return (
    <div className="geist-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <DataGrid
        filterModel={filterModel}
        onFilterModelChange={setFilterModel}
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
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
          '& .MuiDataGrid-cell': {
            borderColor: 'var(--border-color)',
          },
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: 'var(--bg-secondary)',
            borderBottom: '1px solid var(--border-color)',
            fontWeight: 600,
            textTransform: 'uppercase',
            fontSize: '0.75rem',
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
        script={selectedScript}
        currentPrice={selectedScript?.ltp}
        tradingMode={tradingMode}
        token={token}
      />
    </div>
  );
};

WatchList.propTypes = {
  scripts: PropTypes.object,
  type: PropTypes.string,
  visibleColumns: PropTypes.arrayOf(PropTypes.string),
  onRowClick: PropTypes.func,
  compact: PropTypes.bool,
};

export default WatchList;