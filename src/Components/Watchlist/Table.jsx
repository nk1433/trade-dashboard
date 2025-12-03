import { Box, IconButton, Tooltip, Snackbar, Alert } from '@mui/material';
import PropTypes from 'prop-types';
import OrderDetailsPortal from './OrderDetails';
import { DataGrid, GridLogicOperator } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { getStatsForScripts } from '../../Store/upstoxs';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatToIndianUnits } from '../../utils/index';

const token = import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

const columnsConfig = {
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
            <span style={{ color }}>{params.row.symbol}</span>
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
        const handlePlaceOrder = async (event) => {
          event.stopPropagation(); // prevent row selection on click

          const accessToken = 'Bearer ' + token; // replace with your token retrieval logic

          // Prepare main market order payload
          const mainOrderPayload = {
            instrument_token: params.row.instrumentKey,
            quantity: params.row.maxShareToBuy,
            product: 'D', // delivery or as applicable
            validity: 'DAY',
            price: 0, // market order price
            order_type: 'MARKET',
            transaction_type: 'BUY',
            disclosed_quantity: 0,
            trigger_price: params.row.sl,
            is_amo: false,
            slice: true,
          };

          console.log(mainOrderPayload)

          try {
            // Place main order
            const mainResponse = await fetch('http://localhost:3015/place-order', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                accept: 'application/json',
                Authorization: accessToken,
              },
              body: JSON.stringify(mainOrderPayload),
            });

            if (!mainResponse.ok) {
              const errorData = await mainResponse.json();
              alert('Main order failed: ' + (errorData.error?.message || JSON.stringify(errorData)));
              return;
            }

            const mainData = await mainResponse.json();
            alert('Main order placed successfully! Order IDs: ' + mainData.data.order_ids.join(', '));

          } catch (error) {
            alert('Error placing order: ' + error.message);
          }
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

        return <span style={{ color }}>{params.value}%</span>;
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

        return <span style={{ color }}>{params.value}</span>;
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
};

const columnMapping = {
  Script: 'scriptName',
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
  items: [
    { id: 1, field: 'barClosingStrength', operator: '>=', value: '70' }
  ],
  logicOperator: GridLogicOperator.And,
};

const WatchList = ({ scripts, type = 'dashboard', visibleColumns, onRowClick, compact = false }) => {
  const [filterModel, setFilterModel] = useState(initialfilterModel);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

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
      acc[col.field] = visibleColumns.includes(col.field);
      return acc;
    }, {})
    : undefined;

  return (
    <div className="geist-card" style={{ padding: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {!compact && (
        <Box sx={{
          p: 2,
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-secondary)'
        }}>
          <Tooltip title="Copy all Script names">
            <IconButton
              onClick={() => handleCopyColumn('symbol')}
              size="small"
              sx={{
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                fontSize: '0.85rem',
                padding: '4px 8px',
                gap: 1
              }}
            >
              Copy to TradingView
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
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