import React, { useMemo, useState, useEffect } from 'react';
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
    LinearProgress,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import universe from '../../../index/universe.json';
import { styles } from './IndustryVolumeShockers.styles';
import FlagMenu from '../../Watchlist/FlagMenu';

const fmt2 = (n) => (n > 0 ? '+' : '') + n.toFixed(2) + '%';
const fmtPrice = (n) =>
    n?.toLocaleString('en-IN', { maximumFractionDigits: 2 }) ?? '—';
const fmtCrore = (val) => {
    if (!val || val === 0) return '—';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
    return `₹${val.toFixed(0)}`;
};

// ─── Sector Row (collapsible) ────────────────────────────────────────────────
const SectorRow = ({ sector, data, isExpanded, onToggle, flaggedStocks, onFlagChange, onStockClick }) => {
    const { avgPriceChange, stocks, topMover, advancers, decliners } = data;
    const isPositive = avgPriceChange >= 0;
    const total = advancers + decliners;
    const advRatio = total > 0 ? (advancers / total) * 100 : 50;

    return (
        <>
            {/* Sector summary row */}
            <TableRow
                sx={{ '& > *': { borderBottom: 'unset' }, cursor: 'pointer' }}
                onClick={onToggle}
            >
                <TableCell style={{ width: 40, paddingRight: 0 }}>
                    <IconButton size="small">
                        {isExpanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                    </IconButton>
                </TableCell>

                {/* Sector name + adv/dec bar */}
                <TableCell component="th" scope="row" sx={{ minWidth: 160 }}>
                    <Typography variant="subtitle2" fontWeight={700} noWrap>
                        {sector}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                        <Typography variant="caption" sx={{ color: '#000', fontWeight: 600 }}>
                            {advancers}▲
                        </Typography>
                        <Typography variant="caption" color="text.disabled">·</Typography>
                        <Typography variant="caption" sx={{ color: '#9e9e9e', fontWeight: 600 }}>
                            {decliners}▼
                        </Typography>
                        <Typography variant="caption" color="text.disabled">·</Typography>
                        <Typography variant="caption" color="text.secondary">
                            {stocks.length} stocks
                        </Typography>
                    </Box>
                    {/* Adv/Dec ratio bar */}
                    <Box sx={{ mt: 0.5, height: 3, width: '100%', maxWidth: 120, bgcolor: '#e0e0e0', borderRadius: 2, overflow: 'hidden' }}>
                        <Box sx={{ width: `${advRatio}%`, height: '100%', bgcolor: '#000', transition: 'width 0.4s' }} />
                    </Box>
                </TableCell>

                {/* Avg price change */}
                <TableCell align="right" sx={{ minWidth: 100 }}>
                    <Typography
                        variant="body2"
                        fontWeight={800}
                        sx={{ color: isPositive ? '#000' : '#9e9e9e', fontSize: '0.95rem' }}
                    >
                        {fmt2(avgPriceChange)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">avg move</Typography>
                </TableCell>

                {/* Top mover in sector */}
                <TableCell align="right" sx={{ minWidth: 100 }}>
                    {topMover ? (
                        <>
                            <Typography variant="caption" fontWeight={700}>
                                {topMover.symbol}
                            </Typography>
                            <Typography
                                variant="caption"
                                display="block"
                                sx={{ color: topMover.priceChangePct >= 0 ? '#000' : '#9e9e9e', fontWeight: 700 }}
                            >
                                {fmt2(topMover.priceChangePct)}
                            </Typography>
                        </>
                    ) : (
                        <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                </TableCell>
            </TableRow>

            {/* Expanded stocks list */}
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mx: 1, my: 1 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom component="div">
                                ALL STOCKS · sorted by price move
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell align="center" width={40}>Flag</TableCell>
                                        <TableCell>Stock</TableCell>
                                        <TableCell align="right">LTP</TableCell>
                                        <TableCell align="right">Price Move</TableCell>
                                        <TableCell align="right">Traded Value</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stocks.map((stock) => (
                                        <TableRow
                                            key={stock.symbol}
                                            hover
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => onStockClick(stock)}
                                        >
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                <FlagMenu
                                                    currentFlags={flaggedStocks[stock.symbol] || []}
                                                    onFlagChange={(color) => onFlagChange(stock.symbol, color)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight={700}>{stock.symbol}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 140 }}>
                                                    {stock.name}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption" fontWeight={600}>
                                                    ₹{fmtPrice(stock.ltp)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography
                                                    variant="caption"
                                                    fontWeight={700}
                                                    sx={{ color: stock.priceChangePct >= 0 ? '#000' : '#9e9e9e' }}
                                                >
                                                    {fmt2(stock.priceChangePct)}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                    {stock.priceChangePct >= 0 ? '▲' : '▼'} ₹{fmtPrice(Math.abs(stock.ltp - stock.open))}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="caption" fontWeight={700} color="text.primary">
                                                    {fmtCrore(stock.tradedValue)}
                                                </Typography>
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

// ─── Main Component ──────────────────────────────────────────────────────────
export default function SectorPriceMove() {
    const [expandedSector, setExpandedSector] = useState(null);
    const [sortMode, setSortMode] = useState('GAINERS'); // 'GAINERS' | 'LOSERS' | 'ABS'
    const [flaggedStocks, setFlaggedStocks] = useState({});

    const { orderMetrics } = useSelector((state) => state.orders);

    // Load flags from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('flaggedStocks');
            if (stored) setFlaggedStocks(JSON.parse(stored));
        } catch (e) { /* noop */ }

        const handleFlagsUpdated = (e) => setFlaggedStocks(e.detail || {});
        window.addEventListener('FLAGS_UPDATED_EVENT', handleFlagsUpdated);
        return () => window.removeEventListener('FLAGS_UPDATED_EVENT', handleFlagsUpdated);
    }, []);

    const handleFlagChange = (symbol, color) => {
        setFlaggedStocks(prev => {
            const next = { ...prev };
            if (color === null || prev[symbol] === color) delete next[symbol];
            else next[symbol] = color;
            localStorage.setItem('flaggedStocks', JSON.stringify(next));
            return next;
        });
        window.dispatchEvent(new CustomEvent('TOGGLE_FLAG_EVENT', { detail: { symbol, color } }));
    };

    const handleStockClick = (stock) => {
        const found = universe.find(s => s.tradingsymbol === stock.symbol);
        if (found) {
            window.dispatchEvent(new CustomEvent('SEARCH_SYMBOL_CHANGE', {
                detail: { symbol: stock.symbol, instrumentKey: found.instrument_key }
            }));
        }
    };

    // ── Compute sector data ──────────────────────────────────────────────────
    const sectorData = useMemo(() => {
        const sectorMap = {};

        universe.forEach(script => {
            const metric = orderMetrics?.[script.instrument_key];
            if (!metric) return;

            const ltp = metric.ltp || 0;
            const open = metric.currentDayOpen || metric.open || ltp;
            const volume = metric.dayVolume || 0;
            if (ltp === 0) return;

            const priceChangePct = open > 0 ? ((ltp - open) / open) * 100 : 0;
            const tradedValue = volume * ltp;
            const sector = script.sector || 'Unknown';

            if (!sectorMap[sector]) {
                sectorMap[sector] = { stocks: [], totalPriceChange: 0, count: 0 };
            }

            sectorMap[sector].stocks.push({
                symbol: script.tradingsymbol,
                name: script.name || script.tradingsymbol,
                instrumentKey: script.instrument_key,
                industry: script.industry,
                ltp,
                open,
                priceChangePct,
                tradedValue,
            });

            sectorMap[sector].totalPriceChange += priceChangePct;
            sectorMap[sector].count++;
        });

        // Build final array with derived stats
        return Object.entries(sectorMap).map(([sector, data]) => {
            // Sort stocks within sector by price change desc
            const sortedStocks = [...data.stocks].sort((a, b) => b.priceChangePct - a.priceChangePct);
            const avgPriceChange = data.count > 0 ? data.totalPriceChange / data.count : 0;
            const advancers = data.stocks.filter(s => s.priceChangePct >= 0).length;
            const decliners = data.stocks.filter(s => s.priceChangePct < 0).length;

            // Top mover = stock with the highest abs price change
            const topMover = [...data.stocks].sort((a, b) =>
                Math.abs(b.priceChangePct) - Math.abs(a.priceChangePct)
            )[0];

            return {
                sector,
                avgPriceChange,
                stocks: sortedStocks,
                advancers,
                decliners,
                topMover,
                stockCount: data.count,
            };
        });
    }, [orderMetrics]);

    // ── Sort sectors ─────────────────────────────────────────────────────────
    const sortedSectors = useMemo(() => {
        const withData = sectorData.filter(s => s.stockCount > 0);
        if (sortMode === 'GAINERS') return [...withData].sort((a, b) => b.avgPriceChange - a.avgPriceChange);
        if (sortMode === 'LOSERS') return [...withData].sort((a, b) => a.avgPriceChange - b.avgPriceChange);
        // ABS — biggest movers regardless of direction
        return [...withData].sort((a, b) => Math.abs(b.avgPriceChange) - Math.abs(a.avgPriceChange));
    }, [sectorData, sortMode]);

    const renderPill = (mode, label) => {
        const isActive = sortMode === mode;
        return (
            <Box
                onClick={() => { setSortMode(mode); setExpandedSector(null); }}
                sx={styles.pill(isActive, mode, {})}
            >
                <Typography variant="button" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{label}</Typography>
            </Box>
        );
    };

    return (
        <Paper elevation={0} sx={styles.container}>
            {/* Header */}
            <Box sx={styles.header}>
                <Typography variant="overline" sx={styles.title}>
                    PRICE MOVE BY SECTOR
                </Typography>
                <Box sx={styles.pillContainer}>
                    {renderPill('GAINERS', 'Top Gainers')}
                    {renderPill('LOSERS', 'Top Losers')}
                    {renderPill('ABS', 'Biggest Movers')}
                </Box>
            </Box>

            <TableContainer sx={{ ...styles.tableContainer, maxHeight: 520 }}>
                <Table stickyHeader size="small" aria-label="sector price move">
                    <TableHead>
                        <TableRow>
                            <TableCell sx={{ width: 40 }} />
                            <TableCell>Sector</TableCell>
                            <TableCell align="right">Avg Move</TableCell>
                            <TableCell align="right">Top Mover</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sortedSectors.map(row => (
                            <SectorRow
                                key={row.sector}
                                sector={row.sector}
                                data={row}
                                isExpanded={expandedSector === row.sector}
                                onToggle={() => setExpandedSector(expandedSector === row.sector ? null : row.sector)}
                                flaggedStocks={flaggedStocks}
                                onFlagChange={handleFlagChange}
                                onStockClick={handleStockClick}
                            />
                        ))}
                        {sortedSectors.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    <Typography variant="caption" color="text.secondary">
                                        No price data available — waiting for live market data
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Paper>
    );
}
