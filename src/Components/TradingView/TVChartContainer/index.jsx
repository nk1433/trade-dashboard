import React from "react";
import {
    Box, Typography, Divider, IconButton, Menu, MenuItem, Checkbox, FormControlLabel,
    Popover, FormGroup, ListItemIcon
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FlagIcon from '@mui/icons-material/Flag';

import WatchList from "../../Watchlist/Table";
import { useTVChartContainer } from './useTVChartContainer';
import { styles } from './styles';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';

// Colors for the menu items
// Colors for the menu items are now handled via LIST_METADATA in useTVChartContainer

const TVChartContainer = () => {
    const {
        chartContainerRef,
        visibleColumns,
        anchorEl,
        openMenu,
        handleMenuClick,
        handleMenuClose,
        selectedIndex,
        getListName,
        counts,
        scriptsToShow,
        handleStockClick,
        handleSettingsClick,
        handleSettingsClose,
        openSettings,
        settingsAnchorEl,
        handleColumnToggle,
        AVAILABLE_COLUMNS,
        flaggedStocks,
        toggleFlag,
        LIST_METADATA,
        SCAN_KEYS,
        FLAG_KEYS
    } = useTVChartContainer();

    const renderScanLabel = (key, showCount = true) => {
        const metadata = LIST_METADATA[key];
        if (!metadata) return null;

        const count = counts[key] || 0;
        const countElement = showCount ? <span style={{ color: 'black', marginLeft: '4px' }}>{count}</span> : null;
        const labelStyle = { display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 };

        if (metadata.icon === 'up' || metadata.icon === 'down') {
            const Icon = metadata.icon === 'up' ? ArrowUpward : ArrowDownward;
            return (
                <Box sx={{ ...labelStyle, color: metadata.color }}>
                    <Icon fontSize="small" /> {metadata.shortLabel} {countElement}
                </Box>
            );
        } else if (metadata.icon === 'flag') {
            return (
                <Box sx={{ ...labelStyle }}>
                    <FlagIcon sx={{ color: metadata.color, fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {key.replace('List', '')} List
                    </Typography>
                    {countElement}
                </Box>
            );
        }

        return (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight={600}>{metadata.label}</Typography>
                {showCount && key !== 'all' && countElement}
                {showCount && key === 'all' && <span style={{ color: 'black', marginLeft: '4px' }}>({count})</span>}
            </Box>
        );
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.mainRow}>
                {/* Chart Area */}
                <Box sx={styles.chartWrapper}>
                    <div ref={chartContainerRef} style={styles.chartContainer} />
                </Box>

                {/* Side Panel */}
                <Box sx={styles.sidePanel}>
                    {/* Header with Dropdown */}
                    <Box sx={styles.sidePanelHeader}>
                        <Box
                            onClick={handleMenuClick}
                            sx={styles.watchlistDropdown}
                        >
                            <Box sx={styles.watchlistTitle}>
                                {renderScanLabel(selectedIndex, false)}
                            </Box>
                            <KeyboardArrowDownIcon fontSize="small" color="action" />
                        </Box>
                        <Menu
                            anchorEl={anchorEl}
                            open={openMenu}
                            onClose={() => handleMenuClose(null)}
                            MenuListProps={{ dense: true }}
                            PaperProps={{ sx: { maxHeight: 400, width: 250 } }}
                        >
                            <MenuItem onClick={() => handleMenuClose('all')}>All Symbols ({counts.all})</MenuItem>
                            <Divider />
                            {/* Flag Lists */}
                            {FLAG_KEYS.map(listKey => (
                                <MenuItem key={listKey} onClick={() => handleMenuClose(listKey)}>
                                    {renderScanLabel(listKey)}
                                </MenuItem>
                            ))}
                            <Divider />
                            {/* Scan Lists */}
                            {SCAN_KEYS.map(key => (
                                <MenuItem key={key} onClick={() => handleMenuClose(key)}>
                                    {renderScanLabel(key)}
                                </MenuItem>
                            ))}
                        </Menu>

                        <Box>
                            <IconButton size="small" onClick={handleSettingsClick}><SettingsIcon fontSize="small" /></IconButton>
                            <Popover
                                open={openSettings}
                                anchorEl={settingsAnchorEl}
                                onClose={handleSettingsClose}
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            >
                                <Box sx={styles.popoverContent}>
                                    <Typography variant="subtitle2" sx={styles.subtitle}>Columns</Typography>
                                    <FormGroup>
                                        {AVAILABLE_COLUMNS.map((col) => (
                                            <FormControlLabel
                                                key={col.id}
                                                control={
                                                    <Checkbox
                                                        size="small"
                                                        checked={visibleColumns.includes(col.id)}
                                                        onChange={() => handleColumnToggle(col.id)}
                                                    />
                                                }
                                                label={<Typography variant="body2">{col.label}</Typography>}
                                            />
                                        ))}
                                    </FormGroup>
                                </Box>
                            </Popover>
                            <IconButton size="small"><AddIcon fontSize="small" /></IconButton>
                            <IconButton size="small"><MoreHorizIcon fontSize="small" /></IconButton>
                        </Box>
                    </Box>

                    {/* Watchlist Table */}
                    <Box sx={styles.watchlistTableWrapper}>
                        <WatchList
                            scripts={scriptsToShow}
                            visibleColumns={visibleColumns}
                            onRowClick={handleStockClick}
                            compact={true}
                            flaggedStocks={flaggedStocks}
                            onFlagChange={toggleFlag}
                        />
                    </Box>
                </Box>
            </Box>
        </Box>
    );
};

export default TVChartContainer;
