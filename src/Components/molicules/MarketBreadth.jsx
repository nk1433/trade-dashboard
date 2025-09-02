import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMarketBreadth } from '../../Store/marketBreadth';

const columns = [
  { field: 'date', headerName: 'Date', width: 150 },
  { field: 'up4Percent', headerName: 'Up ≥ 4% (Daily)', width: 150 },
  { field: 'down4Percent', headerName: 'Down ≥ 4% (Daily)', width: 150 },
  { field: 'up20Pct5d', headerName: 'Up ≥ 20% (5 Days)', width: 170 },
  { field: 'down20Pct5d', headerName: 'Down ≥ 20% (5 Days)', width: 170 },
  { field: 'totalStocks', headerName: 'Total Stocks', width: 130 },
];

const MarketBreadthTable = () => {
  const dispatch = useDispatch();
  const breadthData = useSelector(state => state.marketBreadth.data);

  useEffect(() => {
    dispatch(fetchMarketBreadth());
  }, [dispatch]);

  const rows = breadthData.map((item, index) => ({
    id: item.date || index,
    ...item,
  }));

  return (
    <Box sx={{ width: '100%', height: '600px' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        disableSelectionOnClick
      />
    </Box>
  );
};

export default MarketBreadthTable;
