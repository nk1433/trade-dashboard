import React from 'react';
import { Box } from '@mui/material';
import WatchlistFilterForm from '../molicules/WatchlistFilterForm';
import { useWatchlistFilter } from '../../hooks/useWatchlistFilter';
import WatchList from './Table';

const Dashboard = () => {
  const {
    selectedIndex,
    handleSelectionChange,
    scriptsToShow,
    counts,
  } = useWatchlistFilter();

  return (
    <Box sx={{ p: 2 }}>
      <WatchlistFilterForm
        selectedIndex={selectedIndex}
        handleSelectionChange={handleSelectionChange}
        counts={counts}
      />
      <WatchList scripts={scriptsToShow} />
    </Box>
  );
};

export default Dashboard;
