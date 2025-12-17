import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';

// import { loginSuccess } from '../../Store/authSlice';
import { Box, Typography, CircularProgress } from '@mui/material';

const Redirect = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const code = searchParams.get('code');

    useEffect(() => {
        const handleAuth = async () => {
            if (code) {
                try {
                    // Option A: Send code to backend (Preferred)
                    // const response = await fetch('http://localhost:3015/auth/callback', {
                    //     method: 'POST',
                    //     headers: { 'Content-Type': 'application/json' },
                    //     body: JSON.stringify({ code }),
                    // });
                    // const data = await response.json();
                    // const token = data.access_token;

                    // Option B: Temporary Frontend Exchange (For testing/if backend not ready)
                    // WARNING: This exposes client_secret if done on client. 
                    // Ideally, you should use the backend endpoint above.
                    // For now, we will simulate a successful login if we get a code, 
                    // BUT in reality, you need the access token from the exchange.

                    // placeholder logic to prompt user or simulate
                    console.log('Authorization Code received:', code);

                    // Since we can't exchange without backend or exposing secret, 
                    // we will assume the user might manually set the token or we wait for backend.
                    // However, to make the flow "work" visually:

                    // alert("Code received! Check console. Implement backend exchange to get token.");

                    // If you have a temporary token generation endpoint or logic:
                    // dispatch(loginSuccess({ token: 'temp_token_from_exchange' }));

                } catch (error) {
                    console.error('Auth error:', error);
                }
            }
            // Redirect to home regardless for now
            navigate('/');
        };

        handleAuth();
    }, [code, navigate, dispatch]);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <CircularProgress />
            <Typography variant="h6" sx={{ mt: 2 }}>Authenticating...</Typography>
        </Box>
    );
};

export default Redirect;
