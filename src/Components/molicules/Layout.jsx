import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import NotificationIcon from './NotificationIcon';

const Layout = ({ children, routes }) => {
    const location = useLocation();

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            {/* Top Navbar */}
            <header style={{
                height: '60px',
                width: '100%',
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 1.5rem',
                position: 'fixed',
                top: 0,
                zIndex: 100,
                backdropFilter: 'blur(8px)',
                background: 'rgba(255, 255, 255, 0.8)'
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{
                        width: '20px',
                        height: '20px',
                        background: 'black',
                        borderRadius: '50%',
                        display: 'inline-block'
                    }}></span>
                    <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.03em', color: 'black', fontSize: '1rem' }}>
                        TradeDash
                    </Typography>
                </div>

                {/* Horizontal Navigation */}
                <nav style={{ display: 'flex', gap: '1.5rem', marginLeft: '2rem', marginRight: 'auto' }}>
                    {routes.map((route) => {
                        const isActive = location.pathname === route.path;
                        return (
                            <Link
                                key={route.path}
                                to={route.path}
                                style={{
                                    color: isActive ? 'black' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: '0.875rem',
                                    textDecoration: 'none',
                                    letterSpacing: '-0.01em',
                                    transition: 'color 0.15s ease'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) e.currentTarget.style.color = 'black';
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) e.currentTarget.style.color = 'var(--text-secondary)';
                                }}
                            >
                                {route.linkText}
                            </Link>
                        );
                    })}
                </nav>

                {/* Right Side Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationIcon />
                </Box>
            </header>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginTop: '60px', // Height of top bar
                padding: '2rem',
                backgroundColor: 'var(--bg-primary)',
                width: '100%',
                maxWidth: '100%'
            }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
