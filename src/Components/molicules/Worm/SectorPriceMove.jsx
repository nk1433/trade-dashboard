import React, { useMemo, useState, useEffect } from 'react';
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
    Chip,
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

export default function SectorPriceMove() {
    const [selectedSector, setSelectedSector] = useState(null);
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

        return arrayData.filter(s => s.stockCount > 0).sort((a, b) => b.avgPriceChange - a.avgPriceChange);
    }, [orderMetrics]);

    // Select first sector initially
    useEffect(() => {
        if (sectorData.length > 0 && !selectedSector) {
            setSelectedSector(sectorData[0].sector);
        } else if (sectorData.length > 0 && selectedSector) {
            // Verify if selectedSector still exists
            const exists = sectorData.find(s => s.sector === selectedSector);
            if (!exists) setSelectedSector(sectorData[0].sector);
        }
    }, [sectorData, selectedSector]);

    const activeSectorData = useMemo(() => {
        if (!selectedSector || !sectorData.length) return null;
        return sectorData.find(s => s.sector === selectedSector);
    }, [selectedSector, sectorData]);

    return (
        <Box sx={{ px: { xs: 1, md: 4 }, pb: 4, pt: 2, maxWidth: 1200, mx: 'auto' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, color: '#374151', mb: 3 }}>
                Sectors trending today
            </Typography>

            <Box sx={{ display: 'flex', gap: 3, height: 650, flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                {/* Left Sidebar - Sectors */}
                <Paper elevation={0} sx={{ 
                    width: { xs: '100%', md: 380 }, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    borderRadius: 3, 
                    border: '1px solid #e5e7eb',
                    flexShrink: 0,
                    overflow: 'hidden',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                }}>
                    <Box sx={{ p: 1.5, borderBottom: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#6b7280' }}>SECTORS</Typography>
                        <Chip size="small" label={sectorData.length} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                    </Box>
                    <Box sx={{ flex: 1, overflowY: 'auto' }}>
                        {sectorData.length === 0 ? (
                            <Box sx={{ p: 4, textAlign: 'center' }}>
                                <Typography variant="body2" color="text.secondary">
                                    Waiting for live market data to compute sector moves...
                                </Typography>
                            </Box>
                        ) : (
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                {sectorData.map((row) => {
                                    const { sector, avgPriceChange, advancers, decliners } = row;
                                    const isSelected = selectedSector === sector;
                                    const isPositive = avgPriceChange >= 0;
                                    const total = advancers + decliners;
                                    const advRatio = total > 0 ? (advancers / total) * 100 : 50;

                                    return (
                                        <Box
                                            key={sector}
                                            onClick={() => setSelectedSector(sector)}
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                p: '12px 16px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #e5e7eb',
                                                bgcolor: isSelected ? 'rgba(59, 130, 246, 0.05)' : 'transparent',
                                                '&:hover': { bgcolor: isSelected ? 'rgba(59, 130, 246, 0.08)' : '#f9fafb' },
                                                transition: 'all 0.15s ease',
                                                borderLeft: isSelected ? '4px solid #3b82f6' : '4px solid transparent'
                                            }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                                                <Box sx={{ 
                                                    width: 32, 
                                                    height: 32, 
                                                    borderRadius: 1.5, 
                                                    bgcolor: isSelected ? '#fff' : '#f3f4f6', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    boxShadow: isSelected ? '0 1px 2px rgba(0,0,0,0.05)' : 'none'
                                                }}>
                                                    {getSectorIcon(sector)}
                                                </Box>
                                                <Box sx={{ flex: 1 }}>
                                                    <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: isSelected ? 700 : 600, color: isSelected ? '#111827' : '#374151' }}>
                                                        {sector}
                                                    </Typography>
                                                    <Box sx={{ width: '100%', mt: 0.5 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.25 }}>
                                                            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700, fontSize: '0.65rem' }}>{advancers}</Typography>
                                                            <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700, fontSize: '0.65rem' }}>{decliners}</Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                                                            <Box sx={{ width: `${advRatio}%`, bgcolor: '#10b981', borderRight: '1px solid #fff' }} />
                                                            <Box sx={{ width: `${100 - advRatio}%`, bgcolor: '#ef4444', borderLeft: '1px solid #fff' }} />
                                                        </Box>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Box sx={{ ml: 2, textAlign: 'right' }}>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        fontWeight: 700, 
                                                        fontSize: '0.85rem',
                                                        color: isPositive ? '#10b981' : '#ef4444' 
                                                    }}
                                                >
                                                    {fmt2(avgPriceChange)}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        )}
                    </Box>
                </Paper>

                {/* Right Side - Stocks Table */}
                <Paper elevation={0} sx={{ 
                    flex: 1, 
                    display: 'flex', 
                    flexDirection: 'column', 
                    minHeight: { xs: 400, md: 0 },
                    bgcolor: '#fff', 
                    borderRadius: 3, 
                    overflow: 'hidden', 
                    border: '1px solid #e5e7eb', 
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)' 
                }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #e5e7eb', bgcolor: '#f9fafb', display: 'flex', alignItems: 'center', gap: 2 }}>
                        {activeSectorData ? (
                            <>
                                <Box sx={{ 
                                    width: 40, 
                                    height: 40, 
                                    borderRadius: 2, 
                                    bgcolor: '#fff', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    {getSectorIcon(activeSectorData.sector)}
                                </Box>
                                <Box>
                                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                                        {activeSectorData.sector}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 500 }}>
                                        {activeSectorData.stocks.length} Stocks
                                    </Typography>
                                </Box>
                            </>
                        ) : (
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#111827' }}>
                                No Sector Selected
                            </Typography>
                        )}
                    </Box>

                    <TableContainer sx={{ flex: 1, overflowY: 'auto' }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ bgcolor: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }} align="center" width={40}></TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }}>Stock</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">LTP</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Price Move</TableCell>
                                    <TableCell sx={{ bgcolor: '#f9fafb', color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Traded Value</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activeSectorData?.stocks.map((stock) => (
                                    <TableRow
                                        key={stock.symbol}
                                        hover
                                        sx={{ cursor: 'pointer', '& > td': { borderBottom: '1px solid #f3f4f6', py: 1.5 } }}
                                        onClick={(e) => { e.stopPropagation(); handleStockClick(stock); }}
                                    >
                                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                                            <FlagMenu
                                                currentFlags={flaggedStocks[stock.symbol] || []}
                                                onFlagChange={(color) => handleFlagChange(stock.symbol, color)}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1f2937' }}>{stock.symbol}</Typography>
                                            <Typography variant="caption" sx={{ color: '#6b7280', display: 'block', noWrap: true, maxWidth: 200 }}>
                                                {stock.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                                ₹{fmtPrice(stock.ltp)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography
                                                variant="body2"
                                                sx={{ 
                                                    fontWeight: 700, 
                                                    color: stock.priceChangePct >= 0 ? '#10b981' : '#ef4444' 
                                                }}
                                            >
                                                {fmt2(stock.priceChangePct)}
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#374151' }}>
                                                {fmtCrore(stock.tradedValue)}
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {(!activeSectorData || activeSectorData.stocks.length === 0) && sectorData.length > 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                No stocks to display.
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            </Box>
        </Box>
    );
}
