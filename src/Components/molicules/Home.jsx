import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, Select, MenuItem, Typography, Button, Modal, Paper, Tabs, Tab } from '@mui/material';
import TVChartContainer from '../TradingView/TVChartContainer';
import Watchlist from '../Watchlist/index';
import PaperHoldings from '../PaperHoldings';
import ProdHoldings from '../ProdHoldings';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/config';

const Home = () => {
    const { tradingMode } = useSelector((state) => state.settings);
    const [view, setView] = useState('chart');
    const [holdingsTab, setHoldingsTab] = useState(tradingMode === 'PROD' ? 'prod' : 'paper');
    const [authStatus, setAuthStatus] = useState('checking'); // checking, valid, expired, missing, no_config
    const [authConfig, setAuthConfig] = useState(null);

    useEffect(() => {
        setHoldingsTab(tradingMode === 'PROD' ? 'prod' : 'paper');
    }, [tradingMode]);

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
        <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
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

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                {view === 'chart' && (
                    <Typography variant="h4" sx={{
                        textAlign: "left",
                        fontWeight: 700,
                        letterSpacing: '-0.03em',
                    }}>
                        Advanced
                    </Typography>
                )}
                {view === 'watchlist' && <Box />} {/* Spacer to keep dropdown on right if needed, or just let it flow */}

                <Select
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    size="small"
                    sx={{ height: 32, fontSize: '0.875rem', minWidth: 150, bgcolor: 'white', ml: 'auto' }}
                >
                    <MenuItem value="chart">Advanced</MenuItem>
                    <MenuItem value="watchlist">Dashboard</MenuItem>
                    <MenuItem value="holdings">Holdings</MenuItem>
                </Select>
            </Box>

            <Box sx={{ flex: 1, overflow: 'hidden' }}>
                {view === 'chart' && <TVChartContainer />}
                {view === 'watchlist' && <Watchlist />}
                {view === 'holdings' && (
                    <Box sx={{ width: '100%', height: '100%', overflow: 'auto' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                            <Tabs value={holdingsTab} onChange={(e, val) => setHoldingsTab(val)} aria-label="holdings tabs">
                                <Tab label="Paper Holdings" value="paper" />
                                <Tab label="Production Holdings" value="prod" />
                            </Tabs>
                        </Box>
                        {/* {holdingsTab === 'paper' ? <PaperHoldings /> : <ProdHoldings />} */}
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default Home;
