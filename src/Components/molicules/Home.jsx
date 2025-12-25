import { useState, useEffect } from 'react';
import { Box, Select, MenuItem, Typography, Button, Modal, Paper } from '@mui/material';
import TVChartContainer from '../TradingView/TVChartContainer';
import Watchlist from '../Watchlist/index';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/config';
import { commonSelectSx } from '../../utils/themeStyles';

const Home = () => {
    const [view, setView] = useState('chart');
    const [authStatus, setAuthStatus] = useState('checking'); // checking, valid, expired, missing, no_config
    const [authConfig, setAuthConfig] = useState(null);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BACKEND_URL}/upstoxs/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status) {
                setAuthStatus(response.data.status);
                if (response.data.config) {
                    setAuthConfig(response.data.config);
                }
            }
        } catch (error) {
            console.error("Error checking auth status:", error);
            // Fallback or handle error
        }
    };

    const handleConnectUpstox = () => {
        if (authConfig) {
            const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${authConfig.clientId}&redirect_uri=${encodeURIComponent(authConfig.redirectUri)}&state=${authConfig.name}`;
            window.location.href = authUrl;
        } else {
            // Redirect to settings if no config
            window.location.href = '/upstox-settings';
        }
    };

    return (
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
            {/* Auth Warning Modal/Banner */}
            {(authStatus === 'expired' || authStatus === 'missing') && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#fff3e0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="warning.dark">
                        {authStatus === 'expired' ? 'Upstox Session Expired' : 'Connect Upstox to TradingView'}
                    </Typography>
                    <Button variant="contained" color="warning" onClick={handleConnectUpstox} size="small">
                        {authStatus === 'expired' ? 'Reconnect' : 'Connect'}
                    </Button>
                </Paper>
            )}

            {authStatus === 'no_config' && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: '#e3f2fd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography color="primary.dark">
                        Please configure Upstox settings to use the dashboard.
                    </Typography>
                    <Button variant="contained" onClick={() => window.location.href = '/upstox-settings'} size="small">
                        Go to Settings
                    </Button>
                </Paper>
            )}

            <Box sx={{ position: 'absolute', top: 2, right: 10, zIndex: 99 }}>
                <Select
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    size="small"
                    sx={{ height: 32, fontSize: '0.875rem', minWidth: 150, bgcolor: 'white', ...commonSelectSx }}
                >
                    <MenuItem value="chart">Advanced</MenuItem>
                    <MenuItem value="watchlist">Dashboard</MenuItem>
                </Select>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {view === 'chart' && <TVChartContainer />}
                {view === 'watchlist' && <Watchlist />}
            </Box>
        </Box>
    );
};

export default Home;
