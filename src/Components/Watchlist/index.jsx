import { Box, FormControlLabel, Checkbox } from '@mui/material';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import WatchList from './Table';

const Dashboard = () => {
  const { orderMetrics, bullishBurst } = useSelector((state) => state.orders);
  const [useBmmIndex, setUseBmmIndex] = useState(false);

  const handleCheckboxChange = (event) => {
    setUseBmmIndex(event.target.checked);
  };

  const scriptsToShow = useBmmIndex ? bullishBurst : orderMetrics;

  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox checked={useBmmIndex} onChange={handleCheckboxChange} />
        }
        label="Use BMM Index"
      />
      <WatchList scripts={scriptsToShow} />
    </Box>
  );
};

export default Dashboard;
