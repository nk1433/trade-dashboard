import { useEffect } from 'react';
import {
  Box,
} from '@mui/material';
import { useSelector } from 'react-redux';
import { calculateMetricsForScript } from '../../Store/upstoxs';
import Refresh from './Refresh';
import WatchList from './Table';

const Dashboard = () => {
  const {
    portfolioSize,
    riskPercentage: riskPercentageOfPortfolio
  } = useSelector((state) => state.portfolio);
  const { orderMetrics } = useSelector((state) => state.orders);

  const onSubmit = () => {
    return calculateMetricsForScript(localStorage.getItem('scripts') ? JSON.parse(localStorage.getItem('scripts')) : [])
  };

  useEffect(() => {
    onSubmit();
  }, [portfolioSize, riskPercentageOfPortfolio]);

  return (
    <Box>
      <Refresh refreshScripts={onSubmit} />
      <WatchList scripts={orderMetrics} />
    </Box>
  );
};

export default Dashboard;