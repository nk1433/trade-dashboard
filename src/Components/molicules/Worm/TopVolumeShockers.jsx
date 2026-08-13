import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    useTheme
} from '@mui/material';
import universe from '../../../index/universe.json';
import { styles } from './IndustryVolumeShockers.styles';
import FlagMenu from '../../Watchlist/FlagMenu';

// Helper to format large numbers
const formatNumber = (num) => {
    if (num >= 10000000) return `${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `${(num / 100000).toFixed(2)} L`;
    return num.toLocaleString();
};

// Format value in Crores
const formatCrore = (val) => {
    if (!val || val === 0) return '—';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toFixed(0)}`;
};

export default function TopVolumeShockers() {
    const [flaggedStocks, setFlaggedStocks] = useState({});
    const theme = useTheme();

    // Access live metrics and DB stats from Redux
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
        setFlaggedStocks(prev => {
            const next = { ...prev };
            if (color === null || prev[symbol] === color) {
                delete next[symbol];
            } else {
                next[symbol] = color;
            }
            localStorage.setItem('flaggedStocks', JSON.stringify(next));
            return next;
        });
        window.dispatchEvent(new CustomEvent('TOGGLE_FLAG_EVENT', { detail: { symbol, color } }));
    };

    const handleStockClick = (stock) => {
        if (stock.symbol && stock.instrumentKey) {
            window.dispatchEvent(new CustomEvent('SEARCH_SYMBOL_CHANGE', {
                detail: {
                    symbol: stock.symbol,
                    instrumentKey: stock.instrumentKey
                }
            }));
        }
    };

    const sortedStocks = useMemo(() => {
        const data = universe.map(script => {
            const metric = orderMetrics[script.instrument_key] || {};
            const stat = stats[script.instrument_key] || {};

            const currentVolume = metric.dayVolume || 0;
            const ltp = metric.ltp || 0;
            const avgVolume1w = stat.avgVolume1w || 0;
            // tradedValue = volume × price (in raw rupees), display in Crores
            const tradedValue = currentVolume > 0 && ltp > 0 ? currentVolume * ltp : 0;

            let volChangePct = 0;
            if (avgVolume1w > 0) {
                volChangePct = ((currentVolume - avgVolume1w) / avgVolume1w) * 100;
            } else if (currentVolume > 0) {
                volChangePct = 100;
            }

            return {
                symbol: script.tradingsymbol,
                name: script.name || script.tradingsymbol,
                instrumentKey: script.instrument_key,
                sector: script.sector,
                industry: script.industry,
                currentVolume,
                avgVolume1w,
                volChangePct,
                ltp,
                tradedValue,
            };
        });

        const filtered = data.filter(s => s.currentVolume > 0 && s.volChangePct > 0);

        return filtered.sort((a, b) => {
            if (b.volChangePct !== a.volChangePct) return b.volChangePct - a.volChangePct;
            return b.tradedValue - a.tradedValue; // high-value shockers break ties
        }).slice(0, 15);
    }, [orderMetrics, stats]);

    return (
        <Paper elevation={0} sx={{ ...styles.container, mt: 4, mb: 4 }}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="overline" sx={styles.title}>
                    TOP VOLUME SHOCKERS (VS 1W AVG)
                </Typography>
            </Box>

            <TableContainer sx={styles.tableContainer}>
                <Table stickyHeader aria-label="top volume shockers">
                    <TableHead>
                        <TableRow>
                            <TableCell align="center" width={50}>Flag</TableCell>
                            <TableCell>Company</TableCell>
                            <TableCell align="right">Vol weekly change (1D)</TableCell>
                            <TableCell align="right">Traded Value</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedStocks.map((stock) => (
                            <TableRow
                                key={stock.symbol}
                                hover
                                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                                onClick={() => handleStockClick(stock)}
                            >
                                <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                    <FlagMenu
                                        currentFlags={flaggedStocks[stock.symbol] || []}
                                        onFlagChange={(color) => handleFlagChange(stock.symbol, color)}
                                    />
                                </TableCell>
                                <TableCell component="th" scope="row">
                                    <Typography variant="subtitle2" fontWeight={700}>{stock.symbol}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">{stock.name}</Typography>
                                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                        {stock.sector} • {stock.industry}
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        fontWeight={700}
                                        sx={stock.volChangePct >= 0 ? styles.positiveText : styles.negativeText}
                                    >
                                        {stock.volChangePct > 0 ? '+' : ''}{stock.volChangePct.toLocaleString(undefined, { maximumFractionDigits: 2 })}%
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {formatNumber(stock.currentVolume)} shares
                                    </Typography>
                                </TableCell>
                                <TableCell align="right">
                                    <Typography
                                        variant="body2"
                                        fontWeight={800}
                                        sx={{
                                            color: '#1a1a1a',
                                            fontSize: '0.85rem',
                                            letterSpacing: '-0.3px',
                                        }}
                                    >
                                        {formatCrore(stock.tradedValue)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        ₹{stock.ltp?.toLocaleString('en-IN', { maximumFractionDigits: 2 })} × {formatNumber(stock.currentVolume)}
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        ))}
                        {sortedStocks.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="caption" color="text.secondary">No Volume Surge Data Available</Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
