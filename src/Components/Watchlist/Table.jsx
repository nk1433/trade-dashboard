import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import OrderDetailsPortal from './OrderDetails';
import { DataGrid } from '@mui/x-data-grid';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { getStatsForScripts } from '../../Store/upstoxs';

const columnsConfig = {
  dashboard: [
    {
      field: "scriptName",
      headerName: "Script",
      width: 350,
      renderCell: (params) => {
        const isUp = params.row.isUpDay;
        const gapup = params.row.gapPercentage;
        const color = isUp && gapup >=0 ? "green" : "red";

        return (
          <OrderDetailsPortal data={params.row}>
            <span style={{ color }}>{params.value}</span>
          </OrderDetailsPortal>
        );
      },
    },
    {
      field: "ltp",
      headerName: "LTP",
      renderCell: (params) => {
        const isUp = params.row.isUpDay;
        const gapup = params.row.gapPercentage;
        const color = isUp && gapup >= 0 ? "green" : "red";

        return <span style={{ color }}>{params.value}</span>;
      },
    },
    {
      field: "changePercentage",
      headerName: "Change %",
      renderCell: (params) => {
        const val = params.row.isUpDay;
        const gapup = params.row.gapPercentage;
        const color = val && gapup >= 0 ? "green" : "red";

        return <span style={{ color }}>{params.value}%</span>;
      }
    },
    { field: "relativeVolumePercentage", headerName: "R-vol % / 21 D" },
    { field: "gapPercentage", headerName: "Gap %" },
    {
      field: "strongStart",
      headerName: "Strong Start",
      renderCell: (params) => <>{params.row.strongStart ? "Yes" : "-"}</>,
    },
    { field: "sl", headerName: "SL" },
    { field: "maxShareToBuy", headerName: "Shares" },
    { field: "maxAllocationPercentage", headerName: "Max Alloc" },
    { field: "barClosingStrength", headerName: "Closing Strength %" },
    
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