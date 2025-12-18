import React from 'react';
import { Box, Typography } from '@mui/material';
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
    <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{
        textAlign: "left",
        fontWeight: 700,
        letterSpacing: '-0.03em',
        marginBottom: 3,
        paddingLeft: 1
      }}>
        Watchlist
      </Typography>
      <WatchlistFilterForm
        selectedIndex={selectedIndex}
        handleSelectionChange={handleSelectionChange}
        counts={counts}
      />
      <WatchList
        scripts={scriptsToShow}
        type={selectedIndex === 'holdings' ? 'holdings' : 'dashboard'}
      />
    </div>
  );
};

export default Dashboard;
