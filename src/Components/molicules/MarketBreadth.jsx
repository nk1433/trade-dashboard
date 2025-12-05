import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, Paper } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMarketBreadth } from '../../Store/marketBreadth';
import MarketBreadthBarChart from './MarketBreadthChart';
import BreadthTwoPaneChart from './TVLightChart';

const getCellStyle = (value, positiveThreshold = 0.5) => {
  if (typeof value !== 'number') return {};
  if (value >= positiveThreshold) {
    return { backgroundColor: '#d0f0c0', color: '#004d00' }; // light green bg, dark green text
  } else if (value > 0) {
    return { backgroundColor: '#ffd6d6', color: '#800000' }; // light red bg, dark red text
  }
  return {};
};

const columns = [
  { field: 'date', headerName: 'Date', width: 130 },
  {
    field: 'up4Percent',
    headerName: 'Up ≥4% (Day)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10)}>{params.value}</div>
    )
  },
  {
    field: 'strongCloseUpRatio',
    headerName: 'Strong Close Up',
    width: 140,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 0.6)}>{(params.value * 100).toFixed(2)}%</div>
    )
  },
  {
    field: 'down4Percent',
    headerName: 'Down ≥4% (Day)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10)}>{params.value}</div>
    )
  },
  {
    field: 'strongCloseDownRatio',
    headerName: 'Strong Close Down',
    width: 140,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 0.6)}>{(params.value * 100).toFixed(2)}%</div>
    )
  },
  {
    field: 'up8Pct5d',
    headerName: 'Up ≥8% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10)}>{params.value}</div>
    )
  },
  {
    field: 'down8Pct5d',
    headerName: 'Down ≥8% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10)}>{params.value}</div>
    )
  },
  {
    field: 'up20Pct5d',
    headerName: 'Up ≥20% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10)}>{params.value}</div>
    )
  },
  {
    field: 'down20Pct5d',
    headerName: 'Down ≥20% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10)}>{params.value}</div>
    )
  },
  {
    field: 'intentScoreUp',
    headerName: 'Intent Score Up',
    width: 130,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 5)}>{params.value.toFixed(2)}</div>
    )
  },
  {
    field: 'intentScoreDown',
    headerName: 'Intent Score Down',
    width: 130,
    type: 'number',
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 5)}>{params.value.toFixed(2)}</div>
    )
  },
  {
    field: 'totalStocks',
    headerName: 'Total Stocks',
    width: 120,
    align: 'center',
    headerAlign: 'center',
  },
];

const chartViewColumns = [
  'fourPercentage',
  'eightPercentage',
  'twentyPercentage',
];

const MarketBreadthTable = () => {
  const dispatch = useDispatch();
  const breadthData = useSelector(state => state.marketBreadth.data);
  const [chartType, setChartType] = useState('tv');

  const [percantageChange, setPercentageChange] = useState(chartViewColumns[0]);

  const handlePercentageChange = (event) => {
    setPercentageChange(event.target.value);
  };

  const handleChange = (event) => {
    setChartType(event.target.value);
  };

  useEffect(() => {
    dispatch(fetchMarketBreadth());
  }, [dispatch]);

  const rows = breadthData.map((item, index) => ({
    id: item.date || index,
    ...item,
  }));

  rows.sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <Box sx={{ width: '100%', paddingTop: '20px', pb: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1400, margin: 'auto', p: 3 }}>

        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Market Breadth
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
              <InputLabel>Chart View</InputLabel>
              <Select
                value={chartType}
                label="Chart View"
                onChange={handleChange}
              >
                <MenuItem value="mui">MUI Charts</MenuItem>
                <MenuItem value="tv">TradingView</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'white' }}>
              <InputLabel>Per Change</InputLabel>
              <Select
                value={percantageChange}
                label="Per Change"
                onChange={handlePercentageChange}
              >
                {
                  chartViewColumns.map((field) => {
                    return <MenuItem key={field} value={field}>{field}</MenuItem>
                  })
                }
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Chart Section */}
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {chartType === 'mui' ? (
            <>
              <Box sx={{ mb: 4 }}>
                <MarketBreadthBarChart
                  data={breadthData}
                  seriesKey="up4Percent"
                  chartTitle="Market Breadth: Stocks Up ≥ 4% (Daily)"
                  barColor="green"
                />
              </Box>
              <Box>
                <MarketBreadthBarChart
                  data={breadthData}
                  seriesKey="down4Percent"
                  chartTitle="Market Breadth: Stocks Down ≥ 4% (Daily)"
                  barColor="red"
                />
              </Box>
            </>
          ) : (
            <Box sx={{ height: 500 }}>
              <BreadthTwoPaneChart data={rows} field={percantageChange} />
            </Box>
          )}
        </Paper>

        {/* Table Section */}
        <Paper sx={{ height: 600, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <DataGrid
            rows={[...rows].sort((a, b) => new Date(b.date) - new Date(a.date))}
            columns={columns}
            pageSize={25}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
            density="compact"
            sx={{
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                fontWeight: 600,
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              }
            }}
          />
        </Paper>

        {/* Insights Section */}
        <Paper sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, borderLeft: '4px solid #000', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#000' }}>
            Market Insights (Stockbee)
          </Typography>
          <Box component="ul" sx={{ m: 0, pl: 2, '& li': { mb: 1, color: '#444', lineHeight: 1.6 } }}>
            <li>You can miss few % points. Waiting for green is confirmation but can be late. Dollar cost averaging down may be one way to handle.</li>
            <li>Readings below 20 lead to bottoms.</li>
            <li>Extremely positive/negative breadth is used for market timing.</li>
            <li>If you see major breadth deterioration and series of 700 plus days on 4% plus down then it is likely to develop into larger correction.</li>
            <li>Signs of extreme bearishness in Primary indicator. If I see number of stocks up 25% in Q below 300 I will be bullish. At the moment not enough bearishness.</li>
            <li>Yes. Abnormal strength tends to resolve in consolidation or pullback.</li>
            <li>Excessively positive breadth is not immediately bearish. Unlikely excessively bearish breadth, which gives very good signal on bullish side , excessive positive has no good signalling record.</li>
            <li>Extremely bearish breadth = bullish and start of a bounce or bottom. Short term extremely bullish breadth = pullback. For tops there are no reliable indicators as it is gradual process. I look for extremes in breadth on any time frames to reduce or add risks. Rest of the time breadth is not much useful.</li>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MarketBreadthTable;
