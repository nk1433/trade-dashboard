import React, { useState, useEffect } from 'react';
import { IconButton, Popover, Box, Tooltip, Typography, Divider, MenuItem } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ClearIcon from '@mui/icons-material/Clear';
import CheckIcon from '@mui/icons-material/Check';

import { useFlagMenu } from './useFlagMenu';
import { styles, FLAG_COLORS } from './styles';

const FlagMenu = ({ currentFlag, onFlagChange }) => {
    const {
        anchorEl,
        open,
        handleOpen,
        handleClose,
        handleSelectFlag
    } = useFlagMenu({ onFlagChange });

    const [customLists, setCustomLists] = useState(() => {
        try {
            const stored = localStorage.getItem('customLists');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            return [];
        }
    });

    useEffect(() => {
        const handleCustomListsUpdated = (e) => setCustomLists(e.detail);
        window.addEventListener('CUSTOM_LISTS_UPDATED_EVENT', handleCustomListsUpdated);
        return () => window.removeEventListener('CUSTOM_LISTS_UPDATED_EVENT', handleCustomListsUpdated);
    }, []);

    // Determine icon color
    const iconColor = currentFlag && FLAG_COLORS[currentFlag] ? FLAG_COLORS[currentFlag] : (currentFlag ? 'text.secondary' : 'action');
    const IconComponent = currentFlag ? FlagIcon : FlagOutlinedIcon;

    return (
        <>
            <Tooltip title={currentFlag ? `Flagged: ${currentFlag}` : "Flag this symbol"}>
                <IconButton
                    size="small"
                    onClick={handleOpen}
                    sx={{ ...styles.iconButton, color: currentFlag ? iconColor : 'action.active' }}
                >
                    <IconComponent fontSize="small" />
                </IconButton>
            </Tooltip>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                PaperProps={{ sx: styles.menuPaper }}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: customLists.length > 0 ? 1 : 0 }}>
                        <Box sx={styles.colorContainer}>
                            {Object.entries(FLAG_COLORS).map(([name, color]) => (
                                <Tooltip key={name} title={name.charAt(0).toUpperCase() + name.slice(1)}>
                                    <Box
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSelectFlag(name);
                                        }}
                                        sx={styles.colorCircle(color, currentFlag === name)}
                                    />
                                </Tooltip>
                            ))}
                        </Box>
                        {currentFlag && (
                            <Tooltip title="Remove Flag">
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectFlag(null); // Clear flag
                                    }}
                                    sx={{ ml: 1 }}
                                >
                                    <ClearIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Box>

                    {customLists.length > 0 && (
                        <>
                            <Divider sx={{ my: 0.5 }} />
                            <Typography variant="caption" sx={{ px: 1, py: 0.5, color: 'text.secondary', fontWeight: 'bold' }}>
                                Custom Watchlists
                            </Typography>
                            {customLists.map(listName => (
                                <MenuItem 
                                    key={listName} 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleSelectFlag(listName);
                                    }}
                                    sx={{ 
                                        px: 1, 
                                        py: 0.5, 
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        minHeight: 'auto',
                                        borderRadius: 1
                                    }}
                                >
                                    {listName}
                                    {currentFlag === listName && <CheckIcon fontSize="small" sx={{ ml: 1, color: 'primary.main' }} />}
                                </MenuItem>
                            ))}
                        </>
                    )}
                </Box>
            </Popover>
        </>
    );
};

export default FlagMenu;
