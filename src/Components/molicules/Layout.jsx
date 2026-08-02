import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Tooltip } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import NotificationIcon from './NotificationIcon';
import NewWindow from './NewWindow';
import MarketHighLowWormChart from './Worm/index';

import './Layout.css';

const Layout = ({ children, routes }) => {
    const location = useLocation();
    const [isWormPoppedOut, setIsWormPoppedOut] = useState(false);

    return (
        <div className="layout-container">
            {/* Top Navbar */}
            <header className="layout-header">
                {/* Logo */}

                <div className="layout-logo">
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="logo-circle"></span>
                        <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'black', fontSize: '1rem' }}>
                            TradeDash
                        </Typography>
                    </Link>
                </div>

                {/* Horizontal Navigation */}
                <nav className="layout-nav">
                    {routes.filter(route => route.linkText).map((route) => {
                        const isActive = location.pathname === route.path;
                        return (
                            <Link
                                key={route.path}
                                to={route.path}
                                className={`nav-link ${isActive ? 'active' : 'inactive'}`}
                            >
                                {route.linkText}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Tooltip title="Pop out Worm Chart">
                        <IconButton 
                            onClick={() => setIsWormPoppedOut(true)}
                            size="small"
                            sx={{ color: 'black' }}
                        >
                            <OpenInNewIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Button
                        onClick={() => {
                            localStorage.removeItem('token');
                            localStorage.removeItem('user');
                            window.location.href = '/login';
                        }}
                        variant="outlined"
                        size="small"
                        sx={{
                            color: 'black',
                            borderColor: 'var(--border-color)',
                            textTransform: 'none',
                            fontSize: '0.875rem',
                            '&:hover': {
                                borderColor: 'black',
                                bgcolor: 'rgba(0,0,0,0.05)'
                            }
                        }}
                    >
                        Logout
                    </Button>
                    <NotificationIcon />
                </Box>
            </header>

            {/* Main Content */}
            <main className="layout-main">
                {children}
            </main>

            {isWormPoppedOut && (
                <NewWindow title="Worm Chart" onClose={() => setIsWormPoppedOut(false)}>
                    <MarketHighLowWormChart />
                </NewWindow>
            )}
        </div>
    );
};

export default Layout;
