import { useEffect } from 'react';
import { Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import Refresh from './Refresh';
import WatchList from './Table';
import { calculateMetricsForScript } from '../../Store/upstoxs';

const onSubmit = (scripts) => {
  return calculateMetricsForScript(scripts)
};

const Dashboard = () => {
  const dispatch = useDispatch();
  const scripts = localStorage.getItem('scripts') ? JSON.parse(localStorage.getItem('scripts')) : [];
  const {
    portfolioSize,
    riskPercentage: riskPercentageOfPortfolio
  } = useSelector((state) => state.portfolio);
  const { orderMetrics } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(onSubmit(scripts));
  }, [portfolioSize, riskPercentageOfPortfolio]);

  return (
    <Box>
      <Refresh refreshScripts={() => onSubmit(scripts)} />
      <WatchList scripts={orderMetrics} />
    </Box>
  );
};

export default Dashboard;