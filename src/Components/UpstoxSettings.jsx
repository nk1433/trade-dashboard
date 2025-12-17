import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Container } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { BACKEND_URL } from '../utils/config';

const UpstoxSettings = () => {
    const [configs, setConfigs] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        clientId: '',
        clientSecret: '',
        redirectUri: ''
    });
    const navigate = useNavigate();

    useEffect(() => {
        fetchConfigs();
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.name) {
            setFormData(prev => ({ ...prev, name: user.name }));
        }
    }, []);

    const fetchConfigs = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BACKEND_URL}/upstoxs/config`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                setConfigs(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
            if (error.response && error.response.status === 401) {
                // Token expired or invalid
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(`${BACKEND_URL}/upstoxs/config`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) {
                fetchConfigs();
                setFormData({ name: '', clientId: '', clientSecret: '', redirectUri: '' });
                navigate('/');
            }
        } catch (error) {
            console.error('Error saving config:', error);
        }
    };

    const handleLogin = (config) => {
        const authUrl = `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&state=${config.name}`;
        window.location.href = authUrl;
    };

    const textFieldStyle = {
        '& .MuiOutlinedInput-root': {
            '&.Mui-focused fieldset': { borderColor: 'black' },
        },
        '& .MuiInputLabel-root.Mui-focused': { color: 'black' },
    };

    return (
        <Container component="main" maxWidth="md" sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 0 }}>
            <Paper elevation={3} sx={{ p: 4, width: '100%', mb: 2 }}>
                <Typography component="h1" variant="h5" align="center" gutterBottom>
                    Upstox Configuration
                </Typography>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        sx={textFieldStyle}
                    />
                    <TextField
                        label="Client ID"
                        name="clientId"
                        value={formData.clientId}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        sx={textFieldStyle}
                    />
                    <TextField
                        label="Client Secret"
                        name="clientSecret"
                        value={formData.clientSecret}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        sx={textFieldStyle}
                    />
                    <TextField
                        label="Redirect URI"
                        name="redirectUri"
                        value={formData.redirectUri}
                        onChange={handleInputChange}
                        required
                        fullWidth
                        sx={textFieldStyle}
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        sx={{
                            mt: 2,
                            bgcolor: 'black',
                            color: 'white',
                            '&:hover': { bgcolor: 'grey.900' }
                        }}
                    >
                        Add Config
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default UpstoxSettings;
