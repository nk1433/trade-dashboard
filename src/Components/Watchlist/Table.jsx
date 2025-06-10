import * as React from 'react';
import { Box } from '@mui/material';
import PropTypes from 'prop-types';
import OrderDetailsPortal from './OrderDetails';
import { DataGrid } from '@mui/x-data-grid';

const columnsConfig = {
  dashboard: [
    { field: "scriptName", headerName: "Script", width: 350, renderCell: (params) => <OrderDetailsPortal data={params.row}>{params.value}</OrderDetailsPortal> },
    { field: "ltp", headerName: "LTP",  },
    { field: "sl", headerName: "SL",  },
    { field: "maxShareToBuy", headerName: "Shares",  },
    { field: "maxAllocationPercentage", headerName: "Max Alloc" },
    { field: "relativeVolumePercentage", headerName: "R-vol % / 21 D" },
    { field: "gapPercentage", headerName: "Gap %",  },
    //TODO: Create a fallback(-), percentage(%) components.
    { field: "strongStart", headerName: "Strong Start", renderCell: (params) => <>{params.row.strongStart ? "Yes" : "-" }</> },
  ],
  allocationSuggestions: [
    { field: "allocPer", headerName: "Size" },
    { field: "riskPercentage", headerName: "Risk" },
  ],
};

const WatchList = ({ scripts, type = 'dashboard' }) => {
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
  };

  const columns = columnsConfig[type].map(col => {
    const gridColDef = { field: '', headerName: '',  };
    if (col.name) {
      gridColDef.field = columnMapping[col.name] || col.name.toLowerCase().replace(' ', '');
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