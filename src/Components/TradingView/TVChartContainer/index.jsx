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
import moment from "moment";

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
        customLists,
        createCustomList,
        deleteCustomList,
        LIST_METADATA,
        SCAN_KEYS,
        FLAG_KEYS,
        newsItems
    } = useTVChartContainer();

    const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');
    const token = useSelector((state) => state.auth?.token);
    const [orderPanelOpen, setOrderPanelOpen] = React.useState(false);
    const [moreAnchorEl, setMoreAnchorEl] = React.useState(null);

    const activeScript = React.useMemo(() => {
        if (!selectedRowId || !scriptsToShow) return null;
        return Object.values(scriptsToShow).find(s => (s.instrumentKey || s.symbol) === selectedRowId);
    }, [selectedRowId, scriptsToShow]);

    const safeFormat = (val, toFixed = 2) => {
        if (val == null || isNaN(Number(val))) return '-';
        return Number(val).toFixed(toFixed);
    };

    const isFlagList = FLAG_KEYS.includes(selectedIndex) || customLists.includes(selectedIndex);

    const handleAddScript = () => {
        if (isFlagList) {
            const listName = customLists.includes(selectedIndex) ? selectedIndex : selectedIndex.replace('List', '');
            const symbol = window.prompt(`Enter script symbol to add to ${listName} list (e.g. RELIANCE):`);
            if (symbol) {
                toggleFlag(symbol.toUpperCase().trim(), listName);
            }
        } else {
            window.alert("Please select a flagged or custom list to add a script manually.");
        }
    };

    const handleClearList = () => {
        if (isFlagList) {
            const listName = customLists.includes(selectedIndex) ? selectedIndex : selectedIndex.replace('List', '');
            if (window.confirm(`Are you sure you want to clear all scripts from the ${listName} list?`)) {
                clearFlaggedList(listName);
            }
        }
    };

    const handleMoreClick = (event) => {
        setMoreAnchorEl(event.currentTarget);
    };

    const handleMoreClose = () => {
        setMoreAnchorEl(null);
    };

    const handleCreateCustomList = () => {
        const name = window.prompt("Enter new watchlist name:");
        if (name) {
            createCustomList(name);
        }
        handleMoreClose();
    };

    const handleDeleteCustomList = () => {
        if (customLists.includes(selectedIndex)) {
            if (window.confirm(`Are you sure you want to delete the watchlist "${selectedIndex}"?`)) {
                deleteCustomList(selectedIndex);
            }
        }
        handleMoreClose();
    };

    const renderScanLabel = (key, showCount = true) => {
        const count = counts[key] || 0;
        const countElement = showCount ? <span style={{ color: 'black', marginLeft: '4px' }}>{count}</span> : null;
        const labelStyle = { display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 };

        if (customLists.includes(key)) {
            return (
                <Box sx={{ ...labelStyle }}>
                    <FlagIcon sx={{ color: 'gray', fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {key}
                    </Typography>
                    {countElement}
                </Box>
            );
        }

        const metadata = LIST_METADATA[key];
        if (!metadata) return null;

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

    const sortedNewsItems = React.useMemo(() => {
        if (!newsItems || !Array.isArray(newsItems)) return [];
        return [...newsItems].sort((a, b) => b.published_time - a.published_time);
    }, [newsItems]);

    return (
        <Box sx={styles.container}>
            {sortedNewsItems && sortedNewsItems.length > 0 && (
                <Box sx={{
                    // bgcolor: '#000000',

                    py: 0.5,
                    px: 2,
                    // borderBottom: '1px solid #333333',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center'
                }}>
                    <strong style={{ marginRight: '15px', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '1px' }}>LATEST NEWS:</strong>
                    <marquee behavior="scroll" direction="left" scrollamount="5" style={{ display: 'flex', alignItems: 'center' }}>
                        {sortedNewsItems.map((news, idx) => (
                            <span key={idx} style={{ marginRight: '30px' }}>
                                <a href={news.article_link} target="_blank" rel="noreferrer" style={{ color: '#000000', textDecoration: 'none' }}>
                                    {moment(news.published_time).format('D MMMM YYYY H:mm')} - {news.heading}
                                </a>
                                {idx < sortedNewsItems.length - 1 && (
                                    <span style={{ marginLeft: '30px', color: '#888888' }}>{' • '}</span>
                                )}
                            </span>
                        ))}
                    </marquee>
                </Box>
            )}
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
                            {/* Scan Lists */}
                            {SCAN_KEYS.map(key => (
                                <MenuItem key={key} onClick={() => handleMenuClose(key)}>
                                    {renderScanLabel(key)}
                                </MenuItem>
                            ))}
                            <Divider />

                            {/* Flag Lists */}
                            {FLAG_KEYS.map(listKey => (
                                <MenuItem key={listKey} onClick={() => handleMenuClose(listKey)}>
                                    {renderScanLabel(listKey)}
                                </MenuItem>
                            ))}
                            {/* Custom Lists */}
                            {customLists.map(listKey => (
                                <MenuItem key={listKey} onClick={() => handleMenuClose(listKey)}>
                                    {renderScanLabel(listKey)}
                                </MenuItem>
                            ))}
                        </Menu>

                        <Box>
                            {isFlagList && (
                                <IconButton size="small" onClick={handleClearList} title={`Clear ${customLists.includes(selectedIndex) ? selectedIndex : selectedIndex.replace('List', '')} list`}>
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

                            <IconButton size="small" onClick={handleMoreClick} title="More Options">
                                <MoreHorizIcon fontSize="small" />
                            </IconButton>
                            <Menu
                                anchorEl={moreAnchorEl}
                                open={Boolean(moreAnchorEl)}
                                onClose={handleMoreClose}
                            >
                                <MenuItem onClick={handleCreateCustomList}>Create New Watchlist</MenuItem>
                                {customLists.includes(selectedIndex) && (
                                    <MenuItem onClick={handleDeleteCustomList}>Delete Current Watchlist</MenuItem>
                                )}
                            </Menu>
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
