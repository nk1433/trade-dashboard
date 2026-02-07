import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../../utils/config';

export const useHome = () => {
    const [view, setView] = useState('chart');
    const [authStatus, setAuthStatus] = useState('checking'); // checking, valid, expired, missing, no_config
    const [authConfig, setAuthConfig] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    const open = Boolean(anchorEl);

    // Fetch Upstox auth status
    const checkAuthStatus = useCallback(async () => {
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
            // Fallback or handle error logic here in future
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    // Handlers
    const handleConnectUpstox = useCallback(() => {
        if (authConfig) {
            const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${authConfig.clientId}&redirect_uri=${encodeURIComponent(authConfig.redirectUri)}&state=${authConfig.name}`;
            window.location.href = authUrl;
        } else {
            // Redirect to settings if no config
            window.location.href = '/upstox-settings';
        }
    }, [authConfig]);

    const handleMenuClick = useCallback((event) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const handleViewChange = useCallback((newView) => {
        setView(newView);
        handleMenuClose();
    }, [handleMenuClose]);

    return {
        view,
        authStatus,
        authConfig,
        open,
        anchorEl,
        handleConnectUpstox,
        handleMenuClick,
        handleMenuClose,
        handleViewChange
    };
};
