import React, { useState } from 'react';
import { Box, Select, MenuItem, Typography } from '@mui/material';
import TVChartContainer from '../TradingView/TVChartContainer';
import Watchlist from '../Watchlist/index';

const Home = () => {
    const [view, setView] = useState('chart');

    return (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                {view === 'chart' && (
                    <Typography variant="h4" sx={{
                        textAlign: "left",
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                    }}>
                        TV Advanced
                    </Typography>
                )}
                {view === 'watchlist' && <Box />} {/* Spacer to keep dropdown on right if needed, or just let it flow */}

                <Select
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    size="small"
                    sx={{ height: 32, fontSize: '0.875rem', minWidth: 150, bgcolor: 'white', ml: 'auto' }}
                >
                    <MenuItem value="chart">TV Advanced</MenuItem>
                    <MenuItem value="watchlist">Watchlist Table</MenuItem>
                </Select>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {view === 'chart' ? (
                    <TVChartContainer />
                ) : (
                    <Watchlist />
                )}
            </Box>
        </Box>
    );
};

export default Home;
