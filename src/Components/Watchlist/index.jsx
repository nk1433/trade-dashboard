import { useEffect } from 'react';
import {
  Box,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { calculateMetricsForScript } from '../../Store/upstoxs';
import Refresh from './Refresh';
import WatchList from './Table';

const Dashboard = () => {
  const dispatch = useDispatch();
  const scripts = localStorage.getItem('scripts') ? JSON.parse(localStorage.getItem('scripts')) : [];
  const {
    portfolioSize,
    riskPercentage: riskPercentageOfPortfolio
  } = useSelector((state) => state.portfolio);
  const { orderMetrics } = useSelector((state) => state.orders);

  const onSubmit = () => {
    return calculateMetricsForScript(scripts)
  };

  useEffect(() => {
    dispatch(onSubmit());
  }, [portfolioSize, riskPercentageOfPortfolio]);

  return (
    <Box>
      <Refresh refreshScripts={onSubmit} />
      <WatchList scripts={orderMetrics} />
    </Box>
  );
};

export default Dashboard;