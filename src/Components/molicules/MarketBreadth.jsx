import { useEffect } from 'react';
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
    <Box sx={{ width: '100%', height: '600px', paddingTop: '50px' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={25}
        rowsPerPageOptions={[25, 50, 100]}
        disableSelectionOnClick
      />
      <div style={{ textAlign: 'left'}}>
        <div>
          <b>Things/Insight&lsquo;s from Stockbee, Magic number&lsquo;s as associated to US markets:</b>
        </div>
        <ul>
          <li>you can miss few % point . Waiting for green is confirmation but can be late . dollar cost averaging down may be one way to handle.</li>
          <li>Readings below 20 lead to botoms</li>
          <li>Extremely positive/negative breadth is used for market timing.</li>
          <li>If you see major breadth deterioration and series of 700 plus days on 4% plus down then it is likely to develop in to larger correction.</li>
          <li>Signs of extreme bearishness in Primary indicator. If I see number of stocks up 25% in Q below 300 I will be bullish. At the moment not enough bearishness.</li>
          <li>Yes. Abnormal strength tend to resolve in consolidation or pullback</li>
          <li>Excessively positive breadth is not immediately bearish. Unlikely excessively bearish breadth, which gives very good signal on bullish side , excessive positive has no good signalling record.</li>
          <li>Extremely bearish breadth= bullish and start of a bounce or bottom.Short term extremely bullish breadth= pullback.For tops there are no reliable indicators as it is gradual process.I look for extremes in breadth on any time frames to reduce or add risks.Rest of the time breadth is not much useful</li>
        </ul>
      </div>
    </Box>
  );
};

export default MarketBreadthTable;
