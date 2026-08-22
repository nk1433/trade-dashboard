import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Accordion, AccordionSummary, AccordionDetails, CircularProgress, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { BACKEND_URL } from '../../utils/config';

const PerformanceDashboard = ({ selectedDate }) => {
    const [performanceData, setPerformanceData] = useState({ 3: [], 5: [] });
    const [loading, setLoading] = useState(false);
    const [metaInfo, setMetaInfo] = useState({ 3: null, 5: null });

    const fetchPerformance = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const [res3, res5] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/scans/performance`, { params: { days: 3 }, headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${BACKEND_URL}/api/scans/performance`, { params: { days: 5 }, headers: { Authorization: `Bearer ${token}` } })
            ]);
            
            const cachedHighsStr = localStorage.getItem(`historicalHighs_${selectedDate}`);
            let historicalHighs = {};
            if (cachedHighsStr) {
                try {
                    historicalHighs = JSON.parse(cachedHighsStr);
                } catch (e) {}
            }

            const injectHighs = (data, daysCount) => {
                if (!data) return [];
                return data.map(strategy => ({
                    ...strategy,
                    signals: strategy.signals.map(signal => {
                        const maxHighPx = historicalHighs[signal.symbol]?.[`max${daysCount}d`];
                        let maxPctReturn = null;
                        if (maxHighPx && signal.scanPrice) {
                            maxPctReturn = parseFloat((((maxHighPx - signal.scanPrice) / signal.scanPrice) * 100).toFixed(2));
                        }
                        return {
                            ...signal,
                            maxHighPx,
                            maxPctReturn
                        };
                    })
                }));
            };
            
            setPerformanceData({
                3: injectHighs(res3.data?.status === 'success' ? res3.data.data : [], 3),
                5: injectHighs(res5.data?.status === 'success' ? res5.data.data : [], 5)
            });
            
            setMetaInfo({
                3: res3.data?.meta || null,
                5: res5.data?.meta || null
            });
        } catch (error) {
            console.error("Failed to fetch performance data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPerformance();
    }, []);

    const renderPerformanceColumn = (days, data, meta) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>{days} Days Lookback</Typography>
                {meta?.targetDate && (
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                        Signals triggered on: <span style={{ color: 'var(--text-primary)' }}>{meta.targetDate}</span>
                    </Typography>
                )}
            </Box>

            {data.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center', border: '1px solid var(--border-color)', boxShadow: 'none' }}>
                    <Typography sx={{ color: 'text.secondary', fontWeight: 500 }}>No historical scan data available for this period.</Typography>
                </Paper>
            ) : (
                data.map((strategy) => (
                    <Accordion 
                        key={strategy.scanType} 
                        sx={{ 
                            borderRadius: '8px !important', 
                            '&:before': { display: 'none' }, 
                            boxShadow: 'none', 
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)', 
                            mb: 1.5 
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />} sx={{ px: 2, minHeight: '48px !important', '& .MuiAccordionSummary-content': { my: '12px !important' } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: 1 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.primary', letterSpacing: '-0.01em' }}>
                                    {strategy.scanType.toUpperCase()} <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>({strategy.totalSignals})</span>
                                </Typography>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="caption" sx={{ mr: 0.5, color: 'text.secondary', fontWeight: 600 }}>Win:</Typography>
                                        <Chip 
                                            size="small" 
                                            label={`${strategy.winRate}%`} 
                                            variant="outlined" 
                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, borderColor: 'var(--border-color)', color: 'text.primary', borderRadius: '4px' }}
                                        />
                                    </Box>
                                    <Box display="flex" alignItems="center">
                                        <Typography variant="caption" sx={{ mr: 0.5, color: 'text.secondary', fontWeight: 600 }}>Avg:</Typography>
                                        <Chip 
                                            size="small" 
                                            label={`${strategy.avgReturn > 0 ? '+' : ''}${strategy.avgReturn}%`} 
                                            variant="outlined" 
                                            sx={{ height: 22, fontSize: '0.7rem', fontWeight: 700, borderColor: 'var(--border-color)', color: 'text.primary', borderRadius: '4px' }}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'var(--border-color)', p: 0 }}>
                            <TableContainer sx={{ maxHeight: 350 }}>
                                <Table size="small" stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: '0.7rem', py: 1, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'var(--bg-secondary)' }}>Symbol</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem', py: 1, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'var(--bg-secondary)' }}>Scan Px</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem', py: 1, fontWeight: 700, textTransform: 'uppercase', color: 'text.primary', bgcolor: 'var(--bg-secondary)' }}>Peak Px</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem', py: 1, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'var(--bg-secondary)' }}>Cur Px</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem', py: 1, fontWeight: 700, textTransform: 'uppercase', color: 'text.primary', bgcolor: 'var(--bg-secondary)' }}>Peak %</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.7rem', py: 1, fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', bgcolor: 'var(--bg-secondary)' }}>Cur %</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {strategy.signals.map((signal) => (
                                            <TableRow key={signal.symbol} hover sx={{ '& td': { borderColor: 'var(--border-color)' } }}>
                                                <TableCell component="th" scope="row" sx={{ fontSize: '0.75rem', py: 0.75, fontWeight: 600, color: 'text.primary' }}>
                                                    {signal.tradingSymbol}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75, color: 'text.secondary', fontFamily: 'monospace' }}>
                                                    {signal.scanPrice?.toFixed(1)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75, color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
                                                    {signal.maxHighPx ? `${signal.maxHighPx.toFixed(1)}` : '-'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75, color: 'text.secondary', fontFamily: 'monospace' }}>
                                                    {signal.currentPrice?.toFixed(1)}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75, color: 'text.primary', fontWeight: 700, fontFamily: 'monospace' }}>
                                                    {signal.maxPctReturn ? `${signal.maxPctReturn > 0 ? '+' : ''}${signal.maxPctReturn}%` : '-'}
                                                </TableCell>
                                                <TableCell align="right" sx={{ fontSize: '0.75rem', py: 0.75, color: 'text.secondary', fontWeight: 600, fontFamily: 'monospace' }}>
                                                    {signal.pctReturn > 0 ? '+' : ''}{signal.pctReturn}%
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                            {strategy.signals.length > 8 && (
                                <Box sx={{ textAlign: 'center', py: 1, borderTop: '1px solid', borderColor: 'var(--border-color)', bgcolor: 'var(--bg-secondary)' }}>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500, letterSpacing: '0.02em' }}>
                                        Scroll down to see all {strategy.signals.length} signals
                                    </Typography>
                                </Box>
                            )}
                        </AccordionDetails>
                    </Accordion>
                ))
            )}
        </Box>
    );

    return (
        <Box sx={{ mt: 2, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em', color: 'text.primary' }}>Signal Performance Tracker</Typography>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4, flex: 1, alignItems: 'center' }}>
                    <CircularProgress sx={{ color: 'text.primary' }} />
                </Box>
            ) : (
                <Box sx={{ display: 'flex', gap: 3, flex: 1, overflowY: 'auto', pb: 4, px: 1, flexDirection: { xs: 'column', md: 'row' } }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {renderPerformanceColumn(3, performanceData[3], metaInfo[3])}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        {renderPerformanceColumn(5, performanceData[5], metaInfo[5])}
                    </Box>
                </Box>
            )}
        </Box>
    );
};

export default PerformanceDashboard;
