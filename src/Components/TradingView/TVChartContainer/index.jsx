import React from "react";
import {
    Box, Typography, Divider, IconButton, Menu, MenuItem, Checkbox, FormControlLabel,
    Popover, FormGroup, ListItemIcon, Button
} from '@mui/material';
import { useSelector } from 'react-redux';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FlagIcon from '@mui/icons-material/Flag';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import WatchList from "../../Watchlist/Table";
import OrderPanel from '../../Watchlist/OrderPanel';
import FlagMenu from '../../Watchlist/FlagMenu';
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
        selectedRowId,
        handleSettingsClick,
        handleSettingsClose,
        openSettings,
        settingsAnchorEl,
        handleColumnToggle,
        AVAILABLE_COLUMNS,
        flaggedStocks,
        toggleFlag,
        clearFlaggedList,
        LIST_METADATA,
        SCAN_KEYS,
        FLAG_KEYS
    } = useTVChartContainer();

    const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');
    const token = useSelector((state) => state.auth?.token);
    const [orderPanelOpen, setOrderPanelOpen] = React.useState(false);

    const activeScript = React.useMemo(() => {
        if (!selectedRowId || !scriptsToShow) return null;
        return Object.values(scriptsToShow).find(s => (s.instrumentKey || s.symbol) === selectedRowId);
    }, [selectedRowId, scriptsToShow]);

    const safeFormat = (val, toFixed = 2) => {
        if (val == null || isNaN(Number(val))) return '-';
        return Number(val).toFixed(toFixed);
    };

    const isFlagList = FLAG_KEYS.includes(selectedIndex);

    const handleAddScript = () => {
        if (isFlagList) {
            const symbol = window.prompt(`Enter script symbol to add to ${selectedIndex.replace('List', '')} list (e.g. RELIANCE):`);
            if (symbol) {
                toggleFlag(symbol.toUpperCase().trim(), selectedIndex.replace('List', ''));
            }
        } else {
            window.alert("Please select a flagged list (Red, Blue, etc.) to add a script manually.");
        }
    };

    const handleClearList = () => {
        if (isFlagList) {
            if (window.confirm(`Are you sure you want to clear all scripts from the ${selectedIndex.replace('List', '')} list?`)) {
                clearFlaggedList(selectedIndex.replace('List', ''));
            }
        }
    };

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
                <Box sx={{ ...styles.chartWrapper, display: 'flex', flexDirection: 'column' }}>
                    {activeScript && (
                        <Box sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 2, py: 1, bgcolor: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-color)',
                            minHeight: '40px'
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <FlagMenu 
                                        currentFlag={flaggedStocks[activeScript.symbol] || flaggedStocks[activeScript.instrumentKey] || null} 
                                        onFlagChange={(flag) => toggleFlag(activeScript.symbol, flag)} 
                                    />
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{activeScript.symbol}</Typography>
                                </Box>
                                <Typography variant="body2" sx={{ color: activeScript.isUpDay ? '#26a69a' : '#ef5350', fontWeight: 500 }}>
                                    ₹{safeFormat(activeScript.ltp)}
                                </Typography>
                                <Typography variant="body2" sx={{ color: activeScript.isUpDay ? '#26a69a' : '#ef5350' }}>
                                    {activeScript.changePercentage > 0 ? '+' : ''}{safeFormat(activeScript.changePercentage)}%
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Vol ROC: <span style={{ color: activeScript.currentMinuteVolume > 0 ? '#26a69a' : '#ef5350', fontWeight: 600 }}>
                                        {safeFormat(activeScript.currentMinuteVolume)}%
                                    </span>
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    R-Vol: <span style={{ fontWeight: 600 }}>{safeFormat(activeScript.relativeVolumePercentage)}%</span>
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Gap: <span style={{ fontWeight: 600 }}>{safeFormat(activeScript.gapPercentage)}%</span>
                                </Typography>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Close Str: <span style={{ fontWeight: 600 }}>{safeFormat(activeScript.barClosingStrength)}%</span>
                                </Typography>
                                {activeScript.sl > 0 && (
                                    <>
                                        <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                            SL: <span style={{ fontWeight: 600 }}>₹{safeFormat(activeScript.sl)}</span>
                                        </Typography>
                                    </>
                                )}
                            </Box>
                            <Button 
                                variant="contained" 
                                size="small" 
                                sx={{ 
                                    height: 28, 
                                    fontSize: '0.75rem', 
                                    textTransform: 'none',
                                    bgcolor: '#000',
                                    color: '#fff',
                                    '&:hover': { bgcolor: '#333' }
                                }}
                                onClick={() => setOrderPanelOpen(true)}
                            >
                                Trade {activeScript.symbol}
                            </Button>
                        </Box>
                    )}
                    <div ref={chartContainerRef} style={{ ...styles.chartContainer, flex: 1 }} />
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
                            <MenuItem onClick={() => handleMenuClose('holdings')}>Holdings ({counts.holdings || 0})</MenuItem>
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
                            {isFlagList && (
                                <IconButton size="small" onClick={handleClearList} title={`Clear ${selectedIndex.replace('List', '')} list`}>
                                    <DeleteOutlineIcon fontSize="small" />
                                </IconButton>
                            )}
                            <IconButton size="small" onClick={handleSettingsClick} title="Settings">
                                <SettingsIcon fontSize="small" />
                            </IconButton>
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
                            <IconButton size="small" onClick={handleAddScript} title="Add script">
                                <AddIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small"><MoreHorizIcon fontSize="small" /></IconButton>
                        </Box>
                    </Box>

                    {/* Watchlist Table */}
                    <Box sx={styles.watchlistTableWrapper}>
                        <WatchList
                            scripts={scriptsToShow}
                            type={selectedIndex === 'holdings' ? 'holdings' : 'dashboard'}
                            visibleColumns={selectedIndex === 'holdings' ? undefined : visibleColumns}
                            onRowClick={handleStockClick}
                            compact={true}
                            flaggedStocks={flaggedStocks}
                            onFlagChange={toggleFlag}
                            selectedRowId={selectedRowId}
                        />
                    </Box>
                </Box>
            </Box>

            {/* Order Panel for the Active Banner */}
            <OrderPanel
                open={orderPanelOpen}
                onClose={() => setOrderPanelOpen(false)}
                script={activeScript}
                currentPrice={activeScript?.ltp}
                tradingMode={tradingMode}
                token={token}
            />
        </Box>
    );
};

export default TVChartContainer;
