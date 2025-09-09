import { Box, FormControl, FormControlLabel, FormLabel, Radio, RadioGroup } from '@mui/material';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import WatchList from './Table';

const Dashboard = () => {
  const { orderMetrics, bullishBurst, bearishBurst } = useSelector(state => state.orders);
  const [selectedIndex, setSelectedIndex] = useState('all');

  const handleSelectionChange = (event) => {
    setSelectedIndex(event.target.value);
  };

  // Determine scripts to show based on selection
  const scriptsToShow = (() => {
    switch (selectedIndex) {
      case 'bullishMB':
        return bullishBurst || {};
      case 'bearishMB':
        return bearishBurst || {};
      case 'all':
      default:
        return orderMetrics || {};
    }
  })();

  return (
    <Box sx={{ p: 2 }}>
      <FormControl component="fieldset" sx={{ mb: 2 }}>
        <FormLabel component="legend">Select Market Breadth</FormLabel>
        <RadioGroup row value={selectedIndex} onChange={handleSelectionChange}>
          <FormControlLabel value="all" control={<Radio />} label={`All - ${Object.keys(orderMetrics).length}`} />
          <FormControlLabel value="bullishMB" control={<Radio />} label={`Bullish MB - ${Object.keys(bullishBurst).length}`} />
          <FormControlLabel value="bearishMB" control={<Radio />} label={`Bearish MB - ${Object.keys(bearishBurst).length}`} />
        </RadioGroup>
      </FormControl>

      <WatchList scripts={scriptsToShow} />
    </Box>
  );
};

export default Dashboard;
