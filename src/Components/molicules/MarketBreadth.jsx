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

// Helper for Up/Down 4% Coloring
const getUpDown4Color = (params, type) => {
  const row = params.row;
  const up = row.up4Percent || 0;
  const down = row.down4Percent || 0;

  let style = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };

  // Rule 1: Extreme Activity > 300
  if (type === 'up' && up > 300) {
    return { ...style, backgroundColor: '#006400', color: '#fff' }; // Dark Green
  }
  if (type === 'down' && down > 300) {
    return { ...style, backgroundColor: '#8b0000', color: '#fff' }; // Dark Red
  }

  // Rule 2: Compare Up vs Down
  if (up > down) {
    // Both Green
    return { ...style, backgroundColor: '#c6efce', color: '#004d00' };
  } else {
    // Both Pink/Red
    return { ...style, backgroundColor: '#ffc7ce', color: '#800000' };
  }
};

// Generic Helper for Threshold Coloring
const getCellStyle = (value, threshold, type) => {
  let style = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
  if (value === undefined || value === null) return style;

  if (type === 'up' && value >= threshold) {
    // Light Green compatible with other columns
    return { ...style, backgroundColor: '#e8f5e9', color: '#1b5e20' };
  }
  if (type === 'down' && value >= threshold) {
    // Light Red compatible with other columns
    return { ...style, backgroundColor: '#ffebee', color: '#b71c1c' };
  }
  return style;
};

const columns = [
  {
    field: 'date',
    headerName: 'Date',
    // width: 130,
    width: 120,
    pinned: 'left',
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
      <div style={getUpDown4Color(params, 'up')}>{params.value}</div>
    )
  },
  {
    field: 'down4Percent',
    headerName: 'Down ≥4% (Day)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={getUpDown4Color(params, 'down')}>{params.value}</div>
    )
  },
  {
    field: 'ratio5d',
    headerName: '5 Day Ratio',
    width: 100,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      let style = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
      if (params.value >= 2.0) {
        style = { ...style, backgroundColor: '#c6efce', color: '#004d00' };
      } else if (params.value <= 0.5) {
        style = { ...style, backgroundColor: '#ffc7ce', color: '#800000' };
      }
      return (
        <div style={style}>{params.value.toFixed(2)}</div>
      );
    }
  },
  {
    field: 'ratio10d',
    headerName: '10 Day Ratio',
    width: 100,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => {
      let style = { width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' };
      if (params.value >= 2.0) {
        style = { ...style, backgroundColor: '#c6efce', color: '#004d00' };
      } else if (params.value <= 0.5) {
        style = { ...style, backgroundColor: '#ffc7ce', color: '#800000' };
      }
      return (
        <div style={style}>{params.value.toFixed(2)}</div>
      );
    }
  },
  // New Metrics
  {
    field: 'up25PctQuarter',
    headerName: 'Up 25% (Qtr)',
    width: 110,
    align: 'center',
    renderCell: (params) => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#c8e6c9', color: '#1b5e20' }}>{params.value}</div>
  },
  {
    field: 'down25PctQuarter',
    headerName: 'Down 25% (Qtr)',
    width: 110,
    align: 'center',
    renderCell: (params) => <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffcdd2', color: '#b71c1c' }}>{params.value}</div>
  },
  {
    field: 'up25PctMonth',
    headerName: 'Up 25% (M)',
    width: 100,
    align: 'center',
  },
  {
    field: 'down25PctMonth',
    headerName: 'Down 25% (M)',
    width: 100,
    align: 'center',
  },
  {
    field: 'up50PctMonth',
    headerName: 'Up 50% (M)',
    width: 100,
    align: 'center',
  },
  {
    field: 'down50PctMonth',
    headerName: 'Down 50% (M)',
    width: 100,
    align: 'center',
  },
  {
    field: 'up13Pct34d',
    headerName: 'Up 13% (34d)',
    width: 110,
    align: 'center',
  },
  {
    field: 'down13Pct34d',
    headerName: 'Down 13% (34d)',
    width: 110,
    align: 'center',
  },
  {
    field: 'up8Pct5d',
    headerName: 'Up ≥8% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', color: '#1b5e20' }}>{params.value}</div>
    )
  },
  {
    field: 'down8Pct5d',
    headerName: 'Down ≥8% (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffebee', color: '#b71c1c' }}>{params.value}</div>
    )
  },
  {
    field: 'up50RsCount',
    headerName: 'Up ≥ 50Rs',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', color: '#1b5e20' }}>{params.value}</div>
    )
  },
  {
    field: 'up250Rs5dCount',
    headerName: 'Up ≥ 250Rs (5D)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', color: '#1b5e20' }}>{params.value}</div>
    )
  },
  {
    field: 'up80Pct52WL',
    headerName: 'Up ≥80% (52WL)',
    width: 120,
    align: 'center',
    headerAlign: 'center',
    renderCell: (params) => (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', color: '#1b5e20' }}>{params.value}</div>
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
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e8f5e9', color: '#1b5e20' }}>{(params.value * 100).toFixed(2)}%</div>
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
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffebee', color: '#b71c1c' }}>{(params.value * 100).toFixed(2)}%</div>
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
            <Box sx={{ height: 600 }}>
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
        <Paper sx={{ height: 800, mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          <DataGrid
            rows={rows}
            columns={columns.map(c => ({
              ...c,
              headerClassName:
                ['up4Percent', 'down4Percent', 'ratio5d', 'ratio10d', 'up25PctQuarter', 'down25PctQuarter'].includes(c.field) ? 'primary-header' :
                  ['up25PctMonth', 'down25PctMonth', 'up50PctMonth', 'down50PctMonth', 'up13Pct34d', 'down13Pct34d'].includes(c.field) ? 'secondary-header' : ''
            }))}
            columnGroupingModel={[
              {
                groupId: 'primary_group',
                headerName: 'Primary Breadth Indicators',
                headerClassName: 'primary-header-group',
                children: [
                  { field: 'up4Percent' },
                  { field: 'down4Percent' },
                  { field: 'ratio5d' },
                  { field: 'ratio10d' },
                  { field: 'up25PctQuarter' },
                  { field: 'down25PctQuarter' },
                ],
              },
              {
                groupId: 'secondary_group',
                headerName: 'Secondary Breadth Indicators',
                headerClassName: 'secondary-header-group',
                children: [
                  { field: 'up25PctMonth' },
                  { field: 'down25PctMonth' },
                  { field: 'up50PctMonth' },
                  { field: 'down50PctMonth' },
                  { field: 'up13Pct34d' },
                  { field: 'down13Pct34d' },
                ],
              },
            ]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 30 },
              },
            }}
            pageSizeOptions={[10, 30, 60, 100]}
            disableRowSelectionOnClick
            rowHeight={35}
            columnHeaderHeight={100} // Increased for multiline headers
            sx={{
              boxShadow: 2,
              border: 2,
              borderColor: 'primary.light',
              '& .MuiDataGrid-cell:hover': {
                color: 'primary.main',
              },
              '& .primary-header': {
                color: 'black',
                fontWeight: 'bold',
              },
              '& .secondary-header': {
                color: 'black',
                fontWeight: 'bold',
              },
              '& .primary-header-group': {
                color: 'black',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                borderBottom: '1px solid black',
              },
              '& .secondary-header-group': {
                color: 'black',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                borderBottom: '1px solid black',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-columnHeaderTitle': { // Allow multiline text
                whiteSpace: 'normal',
                lineHeight: '1.2',
                textAlign: 'center',
                fontWeight: 'bold',
              },
              '& .MuiDataGrid-columnHeader': { // Center alignment container
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
