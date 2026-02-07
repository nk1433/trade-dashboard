import React from 'react';
import { Box, Typography, Button, Paper, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Timeline as TimelineIcon,
    KeyboardArrowDown as KeyboardArrowDownIcon,
    Warning as WarningIcon
} from '@mui/icons-material';

import { useHome } from './useHome';
import { styles } from './styles';
import TVChartContainer from '../../TradingView/TVChartContainer';
import Watchlist from '../../Watchlist/index';

const Home = () => {
    const {
        view,
        authStatus,
        anchorEl,
        open,
        handleConnectUpstox,
        handleMenuClick,
        handleMenuClose,
        handleViewChange
    } = useHome();

    return (
        <Box sx={styles.container}>
            {/* Top Toolbar / Controls */}
            <Box sx={styles.topToolbar}>
                <Button
                    onClick={handleMenuClick}
                    endIcon={<KeyboardArrowDownIcon />}
                    variant="outlined"
                    size="small"
                    sx={styles.modeButton}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {view === 'chart'
                            ? <TimelineIcon fontSize="small" sx={{ color: 'action.active' }} />
                            : <DashboardIcon fontSize="small" sx={{ color: 'action.active' }} />
                        }
                        <Typography variant="body2" fontWeight="medium">
                            {view === 'chart' ? 'Advanced' : 'Dashboard'}
                        </Typography>
                    </Box>
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={styles.menuPaperProps}
                >
                    <MenuItem onClick={() => handleViewChange('chart')} selected={view === 'chart'}>
                        <ListItemIcon>
                            <TimelineIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Advanced" />
                    </MenuItem>
                    <MenuItem onClick={() => handleViewChange('watchlist')} selected={view === 'watchlist'}>
                        <ListItemIcon>
                            <DashboardIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Dashboard" />
                    </MenuItem>
                </Menu>
            </Box>

            {/* Auth Warning from Upstox */}
            {(authStatus === 'expired' || authStatus === 'missing') && (
                <Paper elevation={0} sx={styles.authStatusPaper(true)}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <WarningIcon color="warning" />
                        <Typography color="warning.dark" sx={{ fontWeight: 500, fontSize: '0.9rem' }}>
                            {authStatus === 'expired' ? 'Upstox Session Expired' : 'Connect Upstox for Live Data'}
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        color="warning"
                        onClick={handleConnectUpstox}
                        size="small"
                        sx={styles.connectButton}
                    >
                        {authStatus === 'expired' ? 'Reconnect' : 'Connect'}
                    </Button>
                </Paper>
            )}

            {/* No Config Warning */}
            {authStatus === 'no_config' && (
                <Paper elevation={0} sx={styles.authStatusPaper(false)}>
                    <Typography color="primary.dark">
                        Please configure Upstox settings to use the dashboard.
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={() => window.location.href = '/upstox-settings'}
                        size="small"
                        sx={styles.connectButton}
                    >
                        Go to Settings
                    </Button>
                </Paper>
            )}

            {/* Main Content Area */}
            <Box sx={styles.contentArea}>
                {view === 'chart' && <TVChartContainer />}
                {view === 'watchlist' && <Watchlist />}
            </Box>
        </Box>
    );
};

export default Home;
