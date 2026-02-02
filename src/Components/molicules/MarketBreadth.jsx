import { useEffect, useState } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, Paper } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMarketBreadth } from '../../Store/marketBreadth';
import MarketBreadthBarChart from './MarketBreadthChart';
import CombinedMarketBreadthChart from './CombinedMarketBreadthChart';
import BreadthTwoPaneChart from './TVLightChart';
import { commonSelectSx, commonInputLabelSx } from '../../utils/themeStyles';
import moment from 'moment';

const getCellStyle = (value, threshold = 0.5, type = 'up') => {
  const colors = {
    red: '#800000',
    green: '#004d00',
    lightGreen: '#c6efce',
    lightRed: '#ffc7ce',
  }
  if (typeof value !== 'number') return {};
  if (value >= threshold && type === 'up') {
    return { backgroundColor: colors.lightGreen, color: colors.green }; // light green bg, dark green text
  } else if (value >= threshold && type === 'down') {
    return { backgroundColor: colors.lightRed, color: colors.red }; // light red bg, dark red text
  }
  return {};
};

const columns = [
  {
    field: 'date',
    headerName: 'Date',
    width: 130,
    valueFormatter: (value) => {
      if (!value) return '';
      if (typeof value === 'string') {
        const datePart = value.split('T')[0];
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
      }
      return moment(value).format('DD/MM/YYYY');
    }
  },
  {
    field: 'up4Percent',
    headerName: 'Up ≥4% (Day)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'up')}>{params.value}</div>
    )
  },
  {
    field: 'down4Percent',
    headerName: 'Down ≥4% (Day)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 8, 'down')}>{params.value}</div>
    )
  },
  {
    field: 'ratio5d',
    headerName: '5 Day Ratio',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 8, 'down')}>{params.value.toFixed(2)}</div>
    )
  },
  {
    field: 'ratio10d',
    headerName: '10 Day Ratio',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 8, 'down')}>{params.value.toFixed(2)}</div>
    )
  },
  {
    field: 'up8Pct5d',
    headerName: 'Up ≥8% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'up')}>{params.value}</div>
    )
  },
  {
    field: 'down8Pct5d',
    headerName: 'Down ≥8% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'down')}>{params.value}</div>
    )
  },
  {
    field: 'up50RsCount',
    headerName: 'Up ≥ 50Rs',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'up')}>{params.value}</div>
    )
  },
  {
    field: 'up250Rs5dCount',
    headerName: 'Up ≥ 250Rs (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'up')}>{params.value}</div>
    )
  },
  {
    field: 'up80Pct52WL',
    headerName: 'Up ≥80% (52WL)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 8, 'up')}>{params.value}</div>
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
      <div style={getCellStyle(params.value, 0.6, 'up')}>{(params.value * 100).toFixed(2)}%</div>
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
      <div style={getCellStyle(params.value, 0.6, 'down')}>{(params.value * 100).toFixed(2)}%</div>
    )
  },
  {
    field: 'up20Pct5d',
    headerName: 'Up ≥20% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'up')}>{params.value}</div>
    )
  },
  {
    field: 'down20Pct5d',
    headerName: 'Down ≥20% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getCellStyle(params.value, 10, 'down')}>{params.value}</div>
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
      <div style={getCellStyle(params.value, 5, 'up')}>{params.value.toFixed(2)}</div>
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
      <div style={getCellStyle(params.value, 5, 'down')}>{params.value.toFixed(2)}</div>
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
  { value: 'fourPercentage', label: '4%' },
  { value: 'eightPercentage', label: '8%' },
  { value: 'twentyPercentage', label: '20%' },
];

const MarketBreadthTable = () => {
  const dispatch = useDispatch();
  const breadthData = useSelector(state => state.marketBreadth.data);
  const [chartType, setChartType] = useState('tv');

  const [percantageChange, setPercentageChange] = useState(chartViewColumns[0].value);

  const handlePercentageChange = (event) => {
    setPercentageChange(event.target.value);
  };

  const handleChange = (event) => {
    setChartType(event.target.value);
  };

  const [timeRange, setTimeRange] = useState('1Y'); // Default to 1 Year

  const handleTimeRangeChange = (event) => {
    setTimeRange(event.target.value);
  };

  useEffect(() => {
    dispatch(fetchMarketBreadth());
  }, [dispatch]);


  // Helper to filter data based on time range
  const filterDataByRange = (data, range) => {
    if (!data || data.length === 0) return { filtered: [], startDate: null };
    if (range === 'All') return { filtered: data, startDate: data[0].date };

    const now = moment();
    let subtractAmount = 0;
    let subtractUnit = 'months';

    switch (range) {
      case '1M': subtractAmount = 1; break;
      case '3M': subtractAmount = 3; break;
      case '6M': subtractAmount = 6; break;
      case '1Y': subtractAmount = 1; subtractUnit = 'years'; break;
      case '2Y': subtractAmount = 2; subtractUnit = 'years'; break;
      default: return { filtered: data, startDate: data[0].date };
    }

    const cutoffDate = now.clone().subtract(subtractAmount, subtractUnit);
    const filtered = data.filter(item => moment(item.date).isSameOrAfter(cutoffDate));
    // For TV chart, we want the visible start date to be the cutoff date formatted YYYY-MM-DD
    const startDate = cutoffDate.format('YYYY-MM-DD');
    return { filtered, startDate };
  };

  const { filtered: filteredBreadthData, startDate: visibleStartDate } = filterDataByRange(breadthData, timeRange);

  // Rows for DataGrid (Table) - Use FILTERED data to match the "view"
  const rows = filteredBreadthData.map((item, index) => ({
    id: item.date || index,
    ...item,
  }));

  return (
    <Box sx={{ width: '100%', paddingTop: '20px', pb: 4, bgcolor: '#f8f9fa', minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1400, margin: 'auto', p: 3 }}>

        {/* Header Section */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#1a1a1a' }}>
            Market Breadth
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            {/* Time Range Selector */}
            <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'white' }}>
              <InputLabel sx={commonInputLabelSx}>Time Range</InputLabel>
              <Select
                value={timeRange}
                label="Time Range"
                onChange={handleTimeRangeChange}
                sx={commonSelectSx}
              >
                <MenuItem value="1M">1 Month</MenuItem>
                <MenuItem value="3M">3 Months</MenuItem>
                <MenuItem value="6M">6 Months</MenuItem>
                <MenuItem value="1Y">1 Year</MenuItem>
                <MenuItem value="2Y">2 Years</MenuItem>
                <MenuItem value="All">All Time</MenuItem>
              </Select>
            </FormControl>


            <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'white' }}>
              <InputLabel sx={commonInputLabelSx}>Chart View</InputLabel>
              <Select
                value={chartType}
                label="Chart View"
                onChange={handleChange}
                sx={commonSelectSx}
              >
                <MenuItem value="mui">MUI Charts</MenuItem>
                <MenuItem value="tv">TradingView</MenuItem>
                <MenuItem value="combined">Combined</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 180, bgcolor: 'white' }}>
              <InputLabel sx={commonInputLabelSx}>Per Change</InputLabel>
              <Select
                value={percantageChange}
                label="Per Change"
                onChange={handlePercentageChange}
                sx={commonSelectSx}
              >
                {
                  chartViewColumns.map((option) => {
                    return (
                      <MenuItem key={option.value} value={option.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ArrowUpward fontSize="small" sx={{ color: 'green' }} />
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{option.label}</Typography>
                        </Box>
                      </MenuItem>
                    )
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
                  data={filteredBreadthData}
                  seriesKey="up4Percent"
                  chartTitle="Market Breadth: Stocks Up ≥ 4% (Daily)"
                  barColor="green"
                />
              </Box>
              <Box>
                <MarketBreadthBarChart
                  data={filteredBreadthData}
                  seriesKey="down4Percent"
                  chartTitle="Market Breadth: Stocks Down ≥ 4% (Daily)"
                  barColor="red"
                />
              </Box>
            </>
          ) : chartType === 'combined' ? (
            <Box sx={{ height: 550 }}>
              <CombinedMarketBreadthChart data={filteredBreadthData} field={percantageChange} />
            </Box>
          ) : (
            <Box sx={{ height: 550 }}>
              {/* Pass FULL breadthData to TV chart so all data is loaded, 
                 but pass visibleStartDate to set the initial zoom */}
              <BreadthTwoPaneChart
                data={breadthData}
                field={percantageChange}
                visibleStartDate={visibleStartDate}
              />
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
