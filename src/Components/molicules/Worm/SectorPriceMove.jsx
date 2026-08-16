import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
    Box,
    Typography,
    Paper,
    Collapse,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
} from '@mui/material';

// Icons
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import RouterIcon from '@mui/icons-material/Router';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import BoltIcon from '@mui/icons-material/Bolt';
import DomainIcon from '@mui/icons-material/Domain';
import ConstructionIcon from '@mui/icons-material/Construction';
import TheatersIcon from '@mui/icons-material/Theaters';
import HardwareIcon from '@mui/icons-material/Hardware';
import BusinessIcon from '@mui/icons-material/Business';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import ScienceIcon from '@mui/icons-material/Science';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

import universe from '../../../index/universe.json';
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

const getSectorIcon = (sectorName) => {
    if (!sectorName) return <BusinessIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    const name = sectorName.toLowerCase();
    if (name.includes('bank') || name.includes('finance') || name.includes('nbfc')) return <AccountBalanceIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('pharma') || name.includes('health') || name.includes('hospital')) return <LocalHospitalIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('auto')) return <DirectionsCarIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('telecom')) return <RouterIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('fmcg') || name.includes('consumer')) return <ShoppingCartIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('power') || name.includes('energy')) return <BoltIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('realty') || name.includes('real estate')) return <DomainIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('infra') || name.includes('construction') || name.includes('cement')) return <ConstructionIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('media') || name.includes('entertainment')) return <TheatersIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('metal')) return <HardwareIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('electrical')) return <ElectricalServicesIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('distributor') || name.includes('logistics')) return <LocalShippingIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('waste')) return <DeleteSweepIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('plastic') || name.includes('polymer') || name.includes('chemical') || name.includes('fertilizer')) return <ScienceIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    if (name.includes('capital goods') || name.includes('manufacturing')) return <PrecisionManufacturingIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
    return <BusinessIcon sx={{ color: '#757575', fontSize: '1.2rem' }} />;
};

const SectorRow = ({ sector, data, isExpanded, onToggle, flaggedStocks, onFlagChange, onStockClick }) => {
    const { avgPriceChange, stocks, advancers, decliners } = data;
    const isPositive = avgPriceChange >= 0;
    const total = advancers + decliners;
    const advRatio = total > 0 ? (advancers / total) * 100 : 50;

    return (
        <React.Fragment>
            <TableRow 
                hover
                onClick={onToggle}
                sx={{ 
                    cursor: 'pointer',
                    '& > td': { borderBottom: '1px solid #f9fafb', py: 2 },
                }}
            >
                <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                            width: 36, 
                            height: 36, 
                            borderRadius: 1.5, 
                            bgcolor: '#f3f4f6', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center' 
                        }}>
                            {getSectorIcon(sector)}
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                            {sector}
                        </Typography>
                    </Box>
                </TableCell>
                <TableCell>
                    <Box sx={{ width: '100%', maxWidth: 220, mx: 'auto' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem' }}>{advancers}</Typography>
                            <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem' }}>{decliners}</Typography>
                        </Box>
                        <Box sx={{ display: 'flex', height: 5, borderRadius: 2, overflow: 'hidden' }}>
                            <Box sx={{ width: `${advRatio}%`, bgcolor: '#10b981', borderRight: '1px solid #fff' }} />
                            <Box sx={{ width: `${100 - advRatio}%`, bgcolor: '#ef4444', borderLeft: '1px solid #fff' }} />
                        </Box>
                    </Box>
                </TableCell>
                <TableCell align="right">
                    <Typography 
                        variant="body2" 
                        sx={{ 
                            fontWeight: 700, 
                            color: isPositive ? '#10b981' : '#ef4444' 
                        }}
                    >
                        {fmt2(avgPriceChange)}
                    </Typography>
                </TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={3}>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ mx: 4, my: 2, p: 2, bgcolor: '#f9fafb', borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom component="div">
                                STOCKS IN {sector.toUpperCase()}
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
                                            sx={{ cursor: 'pointer', '& > td': { borderBottom: '1px solid #f3f4f6' } }}
                                            onClick={(e) => { e.stopPropagation(); onStockClick(stock); }}
                                        >
                                            <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                                <FlagMenu
                                                    currentFlags={flaggedStocks[stock.symbol] || []}
                                                    onFlagChange={(color) => onFlagChange(stock.symbol, color)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="caption" fontWeight={700}>{stock.symbol}</Typography>
                                                <Typography variant="caption" color="text.secondary" display="block" noWrap sx={{ maxWidth: 160 }}>
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
                                                    sx={{ color: stock.priceChangePct >= 0 ? '#10b981' : '#ef4444' }}
                                                >
                                                    {fmt2(stock.priceChangePct)}
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
        </React.Fragment>
    );
};

export default function SectorPriceMove() {
    const [expandedSector, setExpandedSector] = useState(null);
    const [flaggedStocks, setFlaggedStocks] = useState({});

    const { orderMetrics } = useSelector((state) => state.orders);

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

        const arrayData = Object.entries(sectorMap).map(([sector, data]) => {
            const sortedStocks = [...data.stocks].sort((a, b) => b.priceChangePct - a.priceChangePct);
            const avgPriceChange = data.count > 0 ? data.totalPriceChange / data.count : 0;
            const advancers = data.stocks.filter(s => s.priceChangePct >= 0).length;
            const decliners = data.stocks.filter(s => s.priceChangePct < 0).length;

            return {
                sector,
                avgPriceChange,
                stocks: sortedStocks,
                advancers,
                decliners,
                stockCount: data.count,
            };
        });

        // Sort descending by avgPriceChange
        return arrayData.filter(s => s.stockCount > 0).sort((a, b) => b.avgPriceChange - a.avgPriceChange);
    }, [orderMetrics]);

    return (
        <Box sx={{ px: { xs: 1, md: 4 }, pb: 4, pt: 2, maxWidth: 1000, mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 3 }}>
                Sectors trending today
            </Typography>

            <Paper elevation={0} sx={{ 
                borderRadius: 3, 
                border: '1px solid #e5e7eb',
                overflow: 'hidden'
            }}>
                <TableContainer>
                    <Table aria-label="sectors trending table" sx={{ minWidth: 600 }}>
                        <TableHead>
                            <TableRow sx={{ '& th': { borderBottom: '1px dashed #e5e7eb', py: 2, color: '#9ca3af', fontWeight: 600, fontSize: '0.8rem' } }}>
                                <TableCell sx={{ pl: 4 }}>Sector</TableCell>
                                <TableCell align="center">Gainers/Losers</TableCell>
                                <TableCell align="right" sx={{ pr: 4 }}>1D price change</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {sectorData.map(row => (
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
                            {sectorData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Waiting for live market data to compute sector moves...
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
    );
}
