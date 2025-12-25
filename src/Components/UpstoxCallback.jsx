import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import axios from 'axios';

import { BACKEND_URL } from '../utils/config';
import CandleSpinner from './molicules/CandleSpinner';

const UpstoxCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('Processing...');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (code && state) {
            handleCallback(code, state);
        } else {
            setStatus('Invalid callback parameters.');
        }
    }, [searchParams]);

    const handleCallback = async (code, state) => {
        try {
            const response = await axios.get(`${BACKEND_URL}/upstoxs/callback?code=${code}&state=${state}`);
            if (response.data.success) {
                setStatus('Authentication successful! Redirecting...');
                setTimeout(() => navigate('/'), 2000);
            } else {
                setStatus(`Authentication failed: ${response.data.error}`);
            }
        } catch (error) {
            console.error('Callback error:', error);
            setStatus('Authentication failed. Check console for details.');
        }
    };

    return (
        <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CandleSpinner isSmall={false} />
            <Box sx={{ mb: 2 }} />
            <Typography variant="h6">{status}</Typography>
        </Box>
    );
};

export default UpstoxCallback;
