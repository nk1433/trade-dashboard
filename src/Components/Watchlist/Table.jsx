import * as React from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import OrderDetailsPortal from './OrderDetails';
import { DataGrid } from '@mui/x-data-grid';

const columnsConfig = {
  dashboard: [
    {
      field: "scriptName",
      headerName: "Script",
      width: 200,
      renderCell: (params) => (
        <OrderDetailsPortal data={params.row}>
          {params.value}
        </OrderDetailsPortal>
      ),
    },
    { field: "ltp", headerName: "LTP", width: 100 },
    { field: "sl", headerName: "SL", width: 100 },
    { field: "maxShareToBuy", headerName: "Shares", width: 100 },
    { field: "maxAllocationPercentage", headerName: "Max Alloc", width: 150 },
    { field: "relativeVolumePercentage", headerName: "R-vol % / 21 D", width: 150 },
    { field: "gapPercentage", headerName: "Gap %", width: 100 },
    { field: "strongStart", headerName: "Strong Start", width: 120 },
  ],
  allocationSuggestions: [
    { field: "allocPer", headerName: "Size", width: 100 },
    { field: "riskPercentage", headerName: "Risk", width: 100 },
  ],
};

const WatchList = ({ scripts, type = 'dashboard' }) => {
  const columns = columnsConfig[type].map(col => {
    const gridColDef = { field: '', headerName: '', width: 100 };
    if (col.name) {
      gridColDef.field = Object.keys(scripts[0] || {}).find(key => {
        // Find the field name in the scripts data that corresponds to the column name
        if (col.name === "Script" && key === "scriptName") return true;
        if (col.name === "LTP" && key === "ltp") return true;
        if (col.name === "SL" && key === "sl") return true;
        if (col.name === "Shares" && key === "maxShareToBuy") return true;
        if (col.name === "Max Alloc" && key === "maxAllocationPercentage") return true;
        if (col.name === "R-vol % / 21 D" && key === "relativeVolumePercentage") return true;
        if (col.name === "Gap %" && key === "gapPercentage") return true;
        if (col.name === "Strong Start" && key === "strongStart") return true;
        if (col.name === "Size" && key === "allocPer") return true;
        if (col.name === "Risk" && key === "riskPercentage") return true;
        return false;
      }) || col.name.toLowerCase().replace(' ', ''); // Fallback to lowercase and remove spaces
      gridColDef.headerName = col.name;
      if (col.width) {
        gridColDef.width = col.width;
      }
      if (col.value && col.name === "Script") {
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

  const rows = scripts.map((script, index) => ({ id: index, ...script }));

  return (
    <Box sx={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} autoHeight />
    </Box>
  );
};

WatchList.propTypes = {
  scripts: PropTypes.array.isRequired,
  type: PropTypes.string,
};

export default WatchList;