import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Typography, Button } from '@mui/material';
import NotificationIcon from './NotificationIcon';

import './Layout.css';

const Layout = ({ children, routes }) => {
    const location = useLocation();

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
        </div>
    );
};

export default Layout;
