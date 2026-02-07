import React from 'react';
import { IconButton, Popover, Box, Tooltip } from '@mui/material';
import FlagIcon from '@mui/icons-material/Flag';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import ClearIcon from '@mui/icons-material/Clear';

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

    // Determine icon color
    const iconColor = currentFlag && FLAG_COLORS[currentFlag] ? FLAG_COLORS[currentFlag] : 'action';
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
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
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
            </Popover>
        </>
    );
};

export default FlagMenu;
