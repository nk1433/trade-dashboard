import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { IconButton, Badge, Popover, Typography, Box, List, ListItem, ListItemText, Divider } from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

const NotificationIcon = () => {
    const { bullishBurst, bullishSLTB, bullishAnts } = useSelector((state) => state.orders);
    const [unreadCount, setUnreadCount] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const prevCountRef = useRef(0);

    // Combine all bullish matches into a single list for display
    const getAllMatches = () => {
        const matches = [];
        if (bullishBurst) Object.entries(bullishBurst).forEach(([key, val]) => matches.push({ type: 'Bullish MB', symbol: val.symbol || key, ...val }));
        if (bullishSLTB) Object.entries(bullishSLTB).forEach(([key, val]) => matches.push({ type: 'Bullish SLTB', symbol: val.symbol || key, ...val }));
        if (bullishAnts) Object.entries(bullishAnts).forEach(([key, val]) => matches.push({ type: 'Bullish Ants', symbol: val.symbol || key, ...val }));
        return matches;
    };

    const allMatches = getAllMatches();
    const currentCount = allMatches.length;

    useEffect(() => {
        if (currentCount > prevCountRef.current) {
            // New matches found
            const diff = currentCount - prevCountRef.current;
            setUnreadCount((prev) => prev + diff);
        }
        prevCountRef.current = currentCount;
    }, [currentCount]);

    // TEMP: Simulate notifications for verification
    useEffect(() => {
        const timer = setTimeout(() => {
            setUnreadCount(3);
        }, 1000);
        return () => clearTimeout(timer);
    }, []);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
        setUnreadCount(0); // Clear badge on open
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'notification-popover' : undefined;

    return (
        <>
            <IconButton onClick={handleClick} sx={{ color: 'var(--text-secondary)', marginRight: '0.5rem' }}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                PaperProps={{
                    sx: {
                        width: 300,
                        maxHeight: 400,
                        overflowY: 'auto',
                        borderRadius: '8px',
                        boxShadow: 'var(--shadow-lg)',
                        border: '1px solid var(--border-color)',
                    }
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid var(--border-color)' }}>
                    <Typography variant="subtitle1" fontWeight={600}>Notifications</Typography>
                </Box>
                <List sx={{ p: 0 }}>
                    {allMatches.length === 0 ? (
                        <ListItem>
                            <ListItemText primary="No active bullish signals" sx={{ color: 'var(--text-secondary)', textAlign: 'center' }} />
                        </ListItem>
                    ) : (
                        allMatches.slice().reverse().map((match, index) => (
                            <React.Fragment key={index}>
                                <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', py: 1.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={600}>{match.symbol}</Typography>
                                        <Typography variant="caption" sx={{
                                            bgcolor: 'var(--bg-secondary)',
                                            px: 1,
                                            borderRadius: '4px',
                                            color: 'var(--text-secondary)'
                                        }}>
                                            {match.type}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        LTP: {match.ltp || '-'} | Vol: {match.relativeVolumePercentage ? `${match.relativeVolumePercentage}%` : '-'}
                                    </Typography>
                                </ListItem>
                                {index < allMatches.length - 1 && <Divider component="li" />}
                            </React.Fragment>
                        ))
                    )}
                </List>
            </Popover>
        </>
    );
};

export default NotificationIcon;
