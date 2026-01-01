import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Paper, Chip, Button } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatToIndianUnits } from '../../utils/index';
import { executePaperOrder, updatePaperHoldingAsync } from '../../Store/paperTradeSlice';
import OrderPanel from '../Watchlist/OrderPanel';

const PaperHoldings = () => {
    const dispatch = useDispatch();
    const { capital, holdings } = useSelector((state) => state.paperTrade);
    const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');
    const token = useSelector((state) => state.auth?.token);

    const [orderPanelOpen, setOrderPanelOpen] = useState(false);
    const [selectedScript, setSelectedScript] = useState(null);
    const [orderSide, setOrderSide] = useState('BUY');

    const totalInvested = holdings.reduce((acc, curr) => acc + curr.invested, 0);
    const totalCurrentValue = holdings.reduce((acc, curr) => acc + curr.currentValue, 0);
    const totalInvestedPercentage = (totalInvested / (capital + totalInvested)) * 100;
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const totalProfitPercentage = Math.abs(totalPnLPercentage);
    const isProfit = totalPnL >= 0;

    // Calculate Total Portfolio Risk
    const totalRiskAmount = holdings.reduce((acc, curr) => {
        if (curr.sl && curr.sl > 0) {
            const risk = (curr.avgPrice - curr.sl) * curr.quantity;
            return acc + (risk > 0 ? risk : 0);
        }
        return acc;
    }, 0);

    const totalPortfolioValue = capital + totalCurrentValue;
    const totalRiskPercentage = totalPortfolioValue > 0 ? (totalRiskAmount / totalPortfolioValue) * 100 : 0;

    const calculateBarRatio = (returnPerc, riskPerc) => {
        const total = returnPerc + riskPerc;
        if (total === 0) return 50; // Default center
        return (returnPerc / total) * 100;
    };

    const rows = holdings.map((item) => {
        const risk = item.sl ? (item.avgPrice - item.sl) * item.quantity : null;
        return {
            id: item.symbol,
            ...item,
            risk,
            riskPercentage: risk !== null && totalPortfolioValue > 0 ? (risk / totalPortfolioValue) * 100 : null,
            alloc: (item.invested / (capital + totalInvested)) * 100
        };
    });

    const handleBuy = (row) => {
        setSelectedScript({
            symbol: row.symbol,
            tradingSymbol: row.symbol,
            ltp: row.ltp,
            exchange: 'NSE', // Assuming NSE for now, or add to holding data
            instrumentKey: row.instrumentKey, // Ensure this is saved in holdings
            // For existing holdings, we might want to default quantity to 1 or matching allocation, but 1 is safe
        });
        setOrderSide('BUY');
        setOrderPanelOpen(true);
    };

    const handleBreakeven = (row) => {
        const confirmMsg = `Set SL for ${row.symbol} to Breakeven (Avg: ₹${row.avgPrice.toFixed(2)})?`;
        if (window.confirm(confirmMsg)) {
            dispatch(updatePaperHoldingAsync({
                symbol: row.symbol,
                sl: row.avgPrice
            }));
        }
    };

    const handleSell = (row) => {
        setSelectedScript({
            symbol: row.symbol,
            tradingSymbol: row.symbol,
            ltp: row.ltp,
            exchange: 'NSE',
            instrumentKey: row.instrumentKey,
            sharesToBuy: row.quantity // Pre-fill with holding quantity for Sell
        });
        setOrderSide('SELL');
        setOrderPanelOpen(true);
    };

    const columns = [
        {
            field: 'symbol',
            headerName: 'Company',
            flex: 1.5,
            minWidth: 150,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {params.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {params.row.quantity} • Avg. ₹{params.row.avgPrice.toFixed(2)}
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'pnl',
            headerName: 'Returns (%)',
            flex: 1.2,
            minWidth: 120,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                const isProfit = params.value >= 0;
                const textColor = isProfit ? '#059669' : '#dc2626'; // success green or error red
                const bgcolor = isProfit ? '#ecfdf5' : '#fef2f2';

                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
                        <Typography variant="body2" sx={{ color: textColor }}>
                            {params.value > 0 ? '+' : ''}{formatToIndianUnits(params.value)}
                        </Typography>
                        <Chip
                            label={`${params.row.pnlPercentage.toFixed(2)}%`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                color: textColor,
                                bgcolor: bgcolor,
                                fontWeight: 600,
                                mt: 0.5
                            }}
                        />
                    </Box>
                );
            },
        },
        {
            field: 'currentValue',
            headerName: 'Current / Alloc',
            flex: 1.2,
            minWidth: 120,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ₹{formatToIndianUnits(params.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        ({params.row.alloc.toFixed(1)}%)
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'risk',
            headerName: 'Risk',
            flex: 1,
            minWidth: 100,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#dc2626' }}>
                        {params.value !== null ? `₹${formatToIndianUnits(params.value)}` : '-'}
                    </Typography>
                    {params.row.riskPercentage !== null && (
                        <Chip
                            label={`${params.row.riskPercentage.toFixed(2)}%`}
                            size="small"
                            sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                color: '#dc2626',
                                bgcolor: '#fef2f2',
                                fontWeight: 600,
                                mt: 0.5
                            }}
                        />
                    )}
                </Box>
            ),
        },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1.5,
            minWidth: 160,
            sortable: false,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                    <Button
                        variant="outlined"
                        size="small"
                        color="warning"
                        onClick={(e) => { e.stopPropagation(); handleBreakeven(params.row); }}
                        sx={{ fontSize: '0.7rem', py: 0.5, minWidth: 'auto' }}
                        title="Set Stop Loss to Average Price"
                    >
                        BE
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        color="primary"
                        onClick={(e) => { e.stopPropagation(); handleBuy(params.row); }}
                        sx={{ fontSize: '0.7rem', py: 0.5, minWidth: 'auto' }}
                    >
                        Buy
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        color="error"
                        onClick={(e) => { e.stopPropagation(); handleSell(params.row); }}
                        sx={{ fontSize: '0.7rem', py: 0.5, minWidth: 'auto' }}
                    >
                        Sell
                    </Button>
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', color: '#000' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    Holdings ({holdings.length})
                </Typography>
            </Box>

            {/* Summary Card */}
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    mb: 3,
                    border: '1px solid #edf2f7',
                    borderRadius: 4,
                    bgcolor: '#fff',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                    flexShrink: 0
                }}
            >
                {/* Top Row: Metrics */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 6, rowGap: 3, mb: 4, alignItems: 'center' }}>
                    <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontWeight: 500 }}>
                            Available Funds
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 550, color: '#1e293b' }}>
                            ₹{formatToIndianUnits(capital)}
                        </Typography>
                    </Box>

                    <Box sx={{ width: '1px', height: 40, bgcolor: '#e2e8f0', display: { xs: 'none', md: 'block' } }} />

                    <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontWeight: 500 }}>
                            Total Risk %
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 550, color: '#1e293b' }}>
                            {totalRiskPercentage.toFixed(2)}
                        </Typography>
                    </Box>

                    <Box sx={{ width: '1px', height: 40, bgcolor: '#e2e8f0', display: { xs: 'none', md: 'block' } }} />

                    <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontWeight: 500 }}>
                            Invested Value
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 550, color: '#1e293b' }}>
                            ₹{formatToIndianUnits(totalInvested)}
                            <Typography component="span" variant="body2" sx={{ color: '#94a3b8', ml: 1 }}>
                                ({(!isNaN(totalInvestedPercentage) ? totalInvestedPercentage.toFixed(2) : "0.00")}%)
                            </Typography>
                        </Typography>
                    </Box>




                    <Box sx={{ width: '1px', height: 40, bgcolor: '#e2e8f0', display: { xs: 'none', md: 'block' } }} />


                    <Box>
                        <Typography variant="body2" sx={{ color: '#64748b', mb: 0.5, fontWeight: 500 }}>
                            Current Value
                        </Typography>
                        <Typography variant="h5" sx={{ fontWeight: 550, color: '#1e293b' }}>
                            ₹{formatToIndianUnits(totalCurrentValue)}
                        </Typography>
                    </Box>
                </Box>

                {/* Bottom Row: Portfolio Health */}
                <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
                    <Typography variant="overline" sx={{ letterSpacing: 2, color: '#9e9e9e', fontWeight: 600 }}>
                        PORTFOLIO HEALTH
                    </Typography>

                    <Box sx={{
                        mt: 2,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'baseline',
                        gap: 4
                    }}>
                        {/* P&L Message */}
                        <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#000' }}>
                                ₹{formatToIndianUnits(Math.abs(totalPnL))}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#000' }}>
                                {isProfit ? "GAINED" : "LOSS"}
                            </Typography>
                        </Box>

                        <Typography variant="h6" sx={{ color: '#bdbdbd', fontWeight: 500, alignSelf: 'center' }}>
                            VS
                        </Typography>

                        {/* Risk Message */}
                        <Box sx={{ textAlign: 'left' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1, color: '#000' }}>
                                ₹{formatToIndianUnits(totalRiskAmount)}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600, color: '#000' }}>RISK</Typography>
                        </Box>
                    </Box>

                    {/* Ratio Bar */}
                    <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mt: 2 }}>
                        <Box sx={{ height: 6, width: '100%', bgcolor: '#eee', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                            <Box sx={{
                                width: `${calculateBarRatio(Math.abs(totalPnL), totalRiskAmount)}%`,
                                bgcolor: '#000',
                                transition: 'width 0.5s ease'
                            }} />
                        </Box>
                    </Box>
                </Box>
            </Paper >

            {/* DataGrid */}
            < Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
                <DataGrid
                    rows={rows}
                    columns={columns}
                    rowHeight={72}
                    disableRowSelectionOnClick
                    hideFooter
                    sx={{
                        border: 'none',
                        '& .MuiDataGrid-columnHeaders': {
                            bgcolor: 'transparent',
                            color: '#666',
                            fontWeight: 600,
                            fontSize: '0.875rem',
                            borderBottom: '1px solid #e0e0e0',
                        },
                        '& .MuiDataGrid-cell': {
                            borderBottom: '1px solid #f0f0f0',
                            fontSize: '1rem',
                            py: 1
                        },
                        '& .MuiDataGrid-row:hover': {
                            bgcolor: '#fafafa',
                        },
                        '& .MuiDataGrid-columnHeaderTitle': {
                            fontWeight: 600
                        }
                    }}
                />
            </Box >
            <OrderPanel
                open={orderPanelOpen}
                onClose={() => setOrderPanelOpen(false)}
                script={selectedScript}
                currentPrice={selectedScript?.ltp}
                tradingMode={tradingMode}
                token={token}
                initialSide={orderSide}
            />
        </Box >
    );
};

export default PaperHoldings;
