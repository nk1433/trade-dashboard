import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Collapse,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import universe from '../../../index/universe.json';
import { prepareIndustryData, getSortedIndustries } from '../../../utils/industryVolumeLogic';
import { styles } from './IndustryVolumeShockers.styles';
import FlagMenu from '../../Watchlist/FlagMenu';

// Helper to format large numbers
const formatNumber = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString();
};

const IndustryRow = ({ industry, data, isExpanded, onToggle, flaggedStocks, onFlagChange, onStockClick }) => {
    const { avgVolumeChange, totalVolume, stocks } = data;
    const isSurge = avgVolumeChange >= 0;

    return (
        <>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }} onClick={onToggle}>
                <TableCell style={{ width: 50 }}>
                    <IconButton aria-label="expand row" size="small">
                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row">
                    <Typography variant="subtitle2" fontWeight={700}>{industry}</Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={isSurge ? styles.positiveText : styles.negativeText}
                    >
                        {avgVolumeChange > 0 ? '+' : ''}{avgVolumeChange.toFixed(2)}%
                    </Typography>
                </TableCell>
                <TableCell align="right">
                    <Typography variant="caption" color="text.secondary">
                        {formatNumber(totalVolume)}
                    </Typography>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1 }}>
                            <Typography variant="caption" gutterBottom component="div" fontWeight={600}>
                                Contributing Stocks
                            </Typography>
                            <Table size="small" aria-label="stocks">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" width={50}>Flag</TableCell>
                                        <TableCell>Stock</TableCell>
                                        <TableCell align="right">LTP</TableCell>
                                        <TableCell align="right">Vs Prev Day</TableCell>
                                        <TableCell align="right">Vs Min 3D</TableCell>
                                        <TableCell align="right">Vs Avg 21D</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stocks.slice(0, 5).map((stock) => (
                                        <TableRow
                                            key={stock.symbol}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => onStockClick(stock)}
                                        >
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                <FlagMenu
                                                    currentFlag={flaggedStocks[stock.symbol]}
                                                    onFlagChange={(color) => onFlagChange(stock.symbol, color)}
                                                />
                                            </TableCell>
                                            <TableCell component="th" scope="row">
                                                {stock.symbol}
                                            </TableCell>
                                            <TableCell align="right">{stock.ltp}</TableCell>
                                            <TableCell align="right" sx={stock.volChangePrevDay >= 0 ? styles.positiveText : styles.negativeText}>
                                                {stock.volChangePrevDay > 0 ? '+' : ''}{stock.volChangePrevDay.toFixed(2)}%
                                            </TableCell>
                                            <TableCell align="right" sx={stock.volChangeMin3d >= 0 ? styles.positiveText : styles.negativeText}>
                                                {stock.volChangeMin3d > 0 ? '+' : ''}{stock.volChangeMin3d.toFixed(2)}%
                                            </TableCell>
                                            <TableCell align="right" sx={stock.volumeChange >= 0 ? styles.positiveText : styles.negativeText}>
                                                {stock.volumeChange > 0 ? '+' : ''}{stock.volumeChange.toFixed(2)}%
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Box>
                    </Collapse>
                </TableCell>
            </TableRow>
        </>
    );
};

export default function IndustryVolumeShockers() {
    const [tabMode, setTabMode] = useState('SURGE'); // 'SURGE' | 'DRY_UP'
    const [expandedIndustry, setExpandedIndustry] = useState(null);
    const [flaggedStocks, setFlaggedStocks] = useState({});
    const theme = useTheme();

    // Access stats and metrics from Redux
    const { orderMetrics, stats } = useSelector((state) => state.orders);

    // Initialize flags from local storage and listen for updates
    useEffect(() => {
        const loadFlags = () => {
            try {
                const stored = localStorage.getItem('flaggedStocks');
                if (stored) setFlaggedStocks(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to load flags", e);
            }
        };

        loadFlags(); // Initial load

        const handleFlagsUpdated = (event) => {
            setFlaggedStocks(event.detail || {});
        };

        window.addEventListener('FLAGS_UPDATED_EVENT', handleFlagsUpdated);
        return () => window.removeEventListener('FLAGS_UPDATED_EVENT', handleFlagsUpdated);
    }, []);

    // Handlers
    const handleFlagChange = (symbol, color) => {
        // Optimistic update locally
        setFlaggedStocks(prev => {
            const next = { ...prev };
            if (color === null || prev[symbol] === color) {
                delete next[symbol]; // Remove flag
            } else {
                next[symbol] = color; // Set/Update flag
            }
            // Side effect: Update LocalStorage immediately
            localStorage.setItem('flaggedStocks', JSON.stringify(next));
            return next;
        });

        // Dispatch event for global sync (if other components are mounted)
        window.dispatchEvent(new CustomEvent('TOGGLE_FLAG_EVENT', { detail: { symbol, color } }));
    };

    const handleStockClick = (stock) => {
        // Find instrument key (should be available in stock data or look it up)
        const allScripts = universe;
        const found = allScripts.find(s => s.tradingsymbol === stock.symbol);
        const instrumentKey = found ? found.instrument_key : null;

        if (stock.symbol && instrumentKey) {
            window.dispatchEvent(new CustomEvent('SEARCH_SYMBOL_CHANGE', {
                detail: {
                    symbol: stock.symbol,
                    instrumentKey: instrumentKey
                }
            }));
        }
    };

    const industryData = useMemo(() => {
        return prepareIndustryData(universe, stats, orderMetrics);
    }, [orderMetrics, stats]);

    const sortedIndustries = useMemo(() => {
        return getSortedIndustries(industryData, tabMode);
    }, [industryData, tabMode]);

    const renderPill = (mode, label) => {
        const isActive = tabMode === mode;
        return (
            <Box
                onClick={() => { setTabMode(mode); setExpandedIndustry(null); }}
                sx={styles.pill(isActive, mode, theme)}
            >
                <Typography variant="button" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{label}</Typography>
            </Box>
        );
    };

    return (
        <Paper elevation={0} sx={styles.container}>
            <Box sx={styles.header}>
                <Typography variant="overline" sx={styles.title}>
                    INDUSTRY VOLUME SHOCKERS
                </Typography>
                <Box sx={styles.pillContainer}>
                    {renderPill('SURGE', 'Volume Surgers')}
                    {renderPill('DRY_UP', 'Volume Dry Up')}
                </Box>
            </Box>

            <TableContainer sx={styles.tableContainer}>
                <Table stickyHeader aria-label="industry table">
                    <TableHead>
                        <TableRow>
                            <TableCell />
                            <TableCell>Industry</TableCell>
                            <TableCell align="right">Avg Vol Chg</TableCell>
                            <TableCell align="right">Total Vol</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedIndustries.map((row) => (
                            <IndustryRow
                                key={row.industry}
                                industry={row.industry}
                                data={row}
                                isExpanded={expandedIndustry === row.industry}
                                onToggle={() => setExpandedIndustry(expandedIndustry === row.industry ? null : row.industry)}
                                flaggedStocks={flaggedStocks}
                                onFlagChange={handleFlagChange}
                                onStockClick={handleStockClick}
                            />
                        ))}
                        {sortedIndustries.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">
                                    <Typography variant="caption" color="text.secondary">No Data Available</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
