import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconButton, Box, Typography, Drawer, List, ListItem, ListItemText } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import NotificationIcon from './NotificationIcon';

const Layout = ({ children, routes }) => {
    const location = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

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

                {/* Right Side Actions */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <NotificationIcon />
                    <IconButton onClick={toggleMenu} edge="end" aria-label="menu" sx={{ color: 'var(--text-secondary)' }}>
                        <MenuIcon />
                    </IconButton>
                </Box>
            </header>

            {/* Navigation Drawer */}
            <Drawer
                anchor="left"
                open={isMenuOpen}
                onClose={toggleMenu}
                sx={{
                    zIndex: 110, // Above the header (100)
                    '& .MuiDrawer-paper': {
                        width: '240px',
                        boxShadow: 'var(--shadow-lg)',
                        borderRight: '1px solid var(--border-color)',
                        backgroundColor: 'var(--bg-primary)',
                        padding: '1.5rem 1rem',
                        height: '100vh'
                    }
                }}
            >
                <div style={{ marginBottom: '2rem', padding: '0 0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
                    <IconButton onClick={toggleMenu} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </div>

                <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {routes.map((route) => {
                        const isActive = location.pathname === route.path;
                        return (
                            <Link
                                key={route.path}
                                to={route.path}
                                onClick={() => setIsMenuOpen(false)}
                                style={{
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '6px',
                                    backgroundColor: isActive ? 'var(--bg-secondary)' : 'transparent',
                                    color: isActive ? 'black' : 'var(--text-secondary)',
                                    fontWeight: isActive ? 600 : 400,
                                    fontSize: '0.875rem', // 14px like Next.js docs
                                    display: 'block',
                                    transition: 'color 0.15s ease, background-color 0.15s ease',
                                    textDecoration: 'none',
                                    letterSpacing: '-0.01em'
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'black';
                                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.color = 'var(--text-secondary)';
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                            >
                                {route.linkText}
                            </Link>
                        );
                    })}
                </nav>
            </Drawer>

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
