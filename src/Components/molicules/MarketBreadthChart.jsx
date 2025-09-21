import { BarChart } from '@mui/x-charts/BarChart';
import { Typography, Box } from '@mui/material';
import PropTypes from 'prop-types';

export default function MarketBreadthBarChart({ data, seriesKey, chartTitle, barColor }) {
  const categories = data.map(d => d.date);
  const seriesData = data.map(d => d[seriesKey]);

  return (
    <Box sx={{ maxWidth: 900, margin: 'auto', p: 2 }}>
      <Typography variant="h6" textAlign="center" gutterBottom>
        {chartTitle}
      </Typography>

      <BarChart
        width={900}
        height={300}
        series={[
          { label: chartTitle, data: seriesData, color: barColor },
        ]}
        xAxis={[
          {
            data: categories,
            label: 'Date',
            scaleType: 'band',
            tickRotation: 45,
          },
        ]}
        yAxis={[
          {
            label: 'Number of Stocks',
            min: 0,
          },
        ]}
      />
    </Box>
  );
}

MarketBreadthBarChart.propTypes = {
  data: PropTypes.array,
  seriesKey: PropTypes.string,
  chartTitle: PropTypes.string,
  barColor: PropTypes.string,
};
