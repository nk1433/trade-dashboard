import { Box } from '@mui/material';
import {  useSelector } from 'react-redux';
import WatchList from './Table';

const Dashboard = () => {
  const { orderMetrics } = useSelector((state) => state.orders);

  return (
    <Box>
      <WatchList scripts={orderMetrics} />
    </Box>
  );
};

export default Dashboard;