import { Box, IconButton, Tooltip } from '@mui/material';
import PropTypes from 'prop-types';
import OrderDetailsPortal from './OrderDetails';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getStatsForScripts } from '../../Store/upstoxs';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { formatToIndianUnits } from '../../utils/index';

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
          navigator.clipboard.writeText(params.value)
            .then(() => { /* optionally show a success message */ })
            .catch(() => { /* optionally handle errors */ });
        };

        return (
          <OrderDetailsPortal data={params.row}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <span style={{ color }}>{params.value}</span>
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
          </OrderDetailsPortal>
        );
      },
    },
    { field: "barClosingStrength", headerName: "Closing Strength %" },
    {
      field: "changePercentage",
      headerName: "Change %",
      renderCell: (params) => {
        const isUp = params.row.isUpDay;
        const color = isUp  ? "green" : "red";

        return <span style={{ color }}>{params.value}%</span>;
      }
    },
    { field: "relativeVolumePercentage", headerName: "R-vol % / 21 D" },
    { field: "gapPercentage", 
      headerName: "Gap %",
      renderCell: (params) => {
        const gapupPer = params.row.gapPercentage;
        const color = gapupPer > 0 ? "green" : "red";

        return <span style={{ color }}>{params.value}%</span>;
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

const WatchList = ({ scripts, type = 'dashboard' }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getStatsForScripts());
  }, []);

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
    'avgValueVolume21d': 'avgValueVolume21d'
  };

  const columns = columnsConfig[type].map(col => {
    const gridColDef = { field: '', headerName: '', };
    if (col.name) {
      gridColDef.field = columnMapping[col.name] || '';
      gridColDef.headerName = col.name;
      if (col.width) {
        gridColDef.width = col.width;
      }
      if (col.renderCell) {
        gridColDef.renderCell = col.renderCell;
      } else if (col.value && col.name === "Script") {
        gridColDef.renderCell = (params) => col.value(params.row);
      }
    } else if (col.field && col.headerName) {
      gridColDef.field = col.field;
      gridColDef.headerName = col.headerName;
      if (col.width) {
        gridColDef.width = col.width;
      }
      if (col.renderCell) {
        gridColDef.renderCell = col.renderCell;
      }
    }
    return gridColDef;
  });

  const rows = Object.values(scripts).map(metric => ({
    id: metric.instrumentKey,
    ...metric,
  }));
  rows.sort((a, b) => {
    return b.relativeVolumePercentage - a.relativeVolumePercentage
  });

  return (
    <Box sx={{ width: '100%', }}>
      <DataGrid
        initialState={{
          pagination: { paginationModel: { pageSize: 10 } },
        }}
        rows={rows}
        columns={columns}
        getRowId={row => row.id}
        pageSizeOptions={[5, 10, 25, { value: -1, label: 'All' }]}
      />
    </Box>
  );
};

WatchList.propTypes = {
  scripts: PropTypes.object,
  type: PropTypes.string,
};

export default WatchList;