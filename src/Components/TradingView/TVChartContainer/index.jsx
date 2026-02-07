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

// Colors for the menu items
const FLAG_MENU_COLORS = {
    redList: '#ff5252',
    blueList: '#448aff',
    greenList: '#69f0ae',
    orangeList: '#ffab40',
    purpleList: '#e040fb',
};

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
        toggleFlag
    } = useTVChartContainer();

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
                            <Typography variant="subtitle2" fontWeight={600} sx={styles.watchlistTitle}>
                                {getListName(selectedIndex)}
                            </Typography>
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
                            {Object.keys(FLAG_MENU_COLORS).map(listKey => (
                                <MenuItem key={listKey} onClick={() => handleMenuClose(listKey)}>
                                    <ListItemIcon sx={{ minWidth: 32 }}>
                                        <FlagIcon sx={{ color: FLAG_MENU_COLORS[listKey], fontSize: 18 }} />
                                    </ListItemIcon>
                                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                        {listKey.replace('List', '')} List ({counts[listKey] || 0})
                                    </Typography>
                                </MenuItem>
                            ))}
                            <Divider />
                            <MenuItem onClick={() => handleMenuClose('bullishMB')}>Bullish MB ({counts.bullishMB})</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('bearishMB')}>Bearish MB ({counts.bearishMB})</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('bullishSLTB')}>Bullish SLTB ({counts.bullishSLTB})</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('bearishSLTB')}>Bearish SLTB ({counts.bearishSLTB})</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('bullishAnts')}>Bullish Ants ({counts.bullishAnts})</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('dollar')}>Dollar BO ({counts.dollar})</MenuItem>
                            <MenuItem onClick={() => handleMenuClose('bearishDollar')}>Bearish Dollar ({counts.bearishDollar})</MenuItem>
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
