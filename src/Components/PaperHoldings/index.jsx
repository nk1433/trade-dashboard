import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Paper, Chip, Button, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { DataGrid } from '@mui/x-data-grid';
import { formatToIndianUnits } from '../../utils/index';
import { executePaperOrder, updatePaperHoldingAsync } from '../../Store/paperTradeSlice';
import OrderPanel from '../Watchlist/OrderPanel';
import { LineChart } from '@mui/x-charts/LineChart';

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
            reqMovePercentage: risk !== null && item.currentValue > 0 ? (risk / item.currentValue) * 100 : null,
            rrRatio: risk !== null && risk > 0 ? (item.pnl / risk) : null,
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
            headerName: 'Risk / SL',
            flex: 1.2,
            minWidth: 110,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => {
                const hasRisk = params.value > 0;
                const color = hasRisk ? '#dc2626' : 'text.primary';
                const chipColor = hasRisk ? '#dc2626' : 'text.primary';
                const chipBg = hasRisk ? '#fef2f2' : '#f5f5f5';
                const slPercentage = params.row.sl && params.row.avgPrice ? ((params.row.avgPrice - params.row.sl) / params.row.avgPrice) * 100 : null;

                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', height: '100%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ color: color, fontWeight: 400 }}>
                                {params.value !== null ? `₹${formatToIndianUnits(params.value)}` : '-'}
                            </Typography>
                            {params.row.riskPercentage !== null && (
                                <Chip
                                    label={`${params.row.riskPercentage.toFixed(2)}%`}
                                    size="small"
                                    sx={{ height: 18, fontSize: '0.65rem', color: chipColor, bgcolor: chipBg, fontWeight: 600 }}
                                />
                            )}
                        </Box>
                        {params.row.sl > 0 && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
                                SL: ₹{params.row.sl.toFixed(2)} {slPercentage !== null && `(${slPercentage.toFixed(2)}%)`}
                            </Typography>
                        )}
                    </Box>
                );
            },
        },
        {
            field: 'reqMovePercentage',
            headerName: 'Req. Move %',
            flex: 1,
            minWidth: 100,
            type: 'number',
            align: 'left',
            headerAlign: 'left',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
                        {params.value !== null ? `${params.value.toFixed(2)}%` : '-'}
                        {params.row.rrRatio !== null && (
                            <Typography component="span" sx={{ ml: 1, fontSize: '0.75rem', color: params.row.rrRatio >= 0 ? '#059669' : '#dc2626' }}>
                                (1:{params.row.rrRatio.toFixed(1)})
                            </Typography>
                        )}
                    </Typography>
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

    const [viewMode, setViewMode] = useState('DASHBOARD'); // 'DASHBOARD' or 'SUMMARY'

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', color: '#000' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {viewMode === 'DASHBOARD' ? `Holdings (${holdings.length})` : 'Trading Summary'}
                </Typography>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value)}
                        size="small"
                        MenuProps={{
                            PaperProps: {
                                sx: {
                                    '& .MuiMenuItem-root:hover': {
                                        bgcolor: '#f5f5f5'
                                    }
                                }
                            }
                        }}
                        sx={{
                            minWidth: 150,
                            bgcolor: '#f8fafc',
                            '& .MuiSelect-select': { py: 0.5, fontWeight: 600, fontSize: '0.875rem' },
                            '& fieldset': { border: '1px solid #e2e8f0' }
                        }}
                    >
                        <MenuItem value="DASHBOARD">Live Dashboard</MenuItem>
                        <MenuItem value="SUMMARY">Trading Summary</MenuItem>
                    </Select>
                </Box>
            </Box>

            {viewMode === 'DASHBOARD' ? (
                <>
                    {/* Summary Card - Improved UI */}
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
                                        {`₹${isProfit ? formatToIndianUnits(totalPnL) : 0}`}
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
                                    bgcolor: '#f8fafc',
                                    color: '#64748b',
                                    fontWeight: 600,
                                    borderBottom: '1px solid #f1f5f9'
                                },
                                '& .MuiDataGrid-cell': {
                                    borderBottom: '1px solid #f1f5f9'
                                },
                                '& .MuiDataGrid-row:hover': {
                                    bgcolor: '#f8fafc'
                                }
                            }}
                        />
                    </Box >
                </>
            ) : (
                <MonthlyTracker />
            )}

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

const MonthlyRow = ({ row }) => {
    const [open, setOpen] = useState(false);

    return (
        <React.Fragment>
            <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
                <TableCell>
                    <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
                        {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>{row.month}</TableCell>
                <TableCell align="right">{row.avgGain > 0 ? row.avgGain.toFixed(2) + '%' : '-'}</TableCell>
                <TableCell align="right">{row.avgLoss > 0 ? row.avgLoss.toFixed(2) + '%' : '-'}</TableCell>
                <TableCell align="right">{row.winPercentage.toFixed(2)}%</TableCell>
                <TableCell align="right">{row.totalTrades}</TableCell>
                <TableCell align="right">{row.lgGain > 0 ? row.lgGain.toFixed(2) + '%' : '-'}</TableCell>
                <TableCell align="right">{row.lgLoss > 0 ? row.lgLoss.toFixed(2) + '%' : '-'}</TableCell>
                <TableCell align="right">{Math.round(row.avgDaysGain)}</TableCell>
                <TableCell align="right">{Math.round(row.avgDaysLoss)}</TableCell>
            </TableRow>
            <TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={10}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: 1, bgcolor: '#fdfdfd', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
                            <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 600 }}>
                                Trade Details - {row.month}
                            </Typography>
                            <Table size="small" aria-label="trades">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Buy Time</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Sell Time</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Entry Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Intraday</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Symbol</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Qty</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Buy Avg</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Sell Price</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Profit/Loss</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Returns %</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Days Held</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {row.trades.map((trade) => (
                                        <TableRow key={trade.id}>
                                            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {new Date(trade.buyDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </TableCell>
                                            <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8rem' }}>
                                                {new Date(trade.sellDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}
                                            </TableCell>
                                            <TableCell>
                                                <Box component="span" sx={{ 
                                                    px: 1, py: 0.5, borderRadius: 1, fontSize: '0.7rem', fontWeight: 'bold', 
                                                    bgcolor: trade.entryType === 'Peak' ? '#fff7ed' : trade.entryType === 'Edge' ? '#f3e8ff' : trade.entryType === 'Subtile' ? '#f0fdf4' : '#f1f5f9', 
                                                    color: trade.entryType === 'Peak' ? '#ea580c' : trade.entryType === 'Edge' ? '#9333ea' : trade.entryType === 'Subtile' ? '#16a34a' : '#64748b'
                                                }}>
                                                    {trade.entryType}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Box component="span" sx={{ px: 1, py: 0.5, borderRadius: 1, fontSize: '0.75rem', fontWeight: 'bold', bgcolor: trade.isIntraday ? '#e0f2fe' : '#f1f5f9', color: trade.isIntraday ? '#0284c7' : '#64748b' }}>
                                                    {trade.isIntraday ? 'Yes' : 'No'}
                                                </Box>
                                            </TableCell>
                                            <TableCell>{trade.symbol}</TableCell>
                                            <TableCell align="right">{trade.quantity}</TableCell>
                                            <TableCell align="right">₹{trade.avgPrice.toFixed(2)}</TableCell>
                                            <TableCell align="right">₹{trade.ltp.toFixed(2)}</TableCell>
                                            <TableCell align="right" sx={{ color: trade.pnl > 0 ? '#059669' : '#dc2626', fontWeight: 500 }}>
                                                {trade.pnl > 0 ? '+' : ''}₹{formatToIndianUnits(trade.pnl)}
                                            </TableCell>
                                            <TableCell align="right" sx={{ color: trade.pnlPercentage > 0 ? '#059669' : '#dc2626', fontWeight: 500 }}>
                                                {trade.pnlPercentage > 0 ? '+' : ''}{trade.pnlPercentage.toFixed(2)}%
                                            </TableCell>
                                            <TableCell align="right">{trade.daysHeld}</TableCell>
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

const MonthlyTracker = () => {
    const orders = useSelector((state) => state.paperTrade.orders);

    const completedTrades = React.useMemo(() => {
        const trades = [];
        const activePositions = {};
        const chronologicalOrders = [...orders].reverse();

        chronologicalOrders.forEach(order => {
            if (order.type === 'BUY') {
                if (!activePositions[order.symbol]) {
                    activePositions[order.symbol] = { quantity: 0, cost: 0, buyDates: [] };
                }
                activePositions[order.symbol].quantity += order.quantity;
                activePositions[order.symbol].cost += order.quantity * order.price;
                activePositions[order.symbol].buyDates.push(new Date(order.timestamp));
            } else if (order.type === 'SELL') {
                if (activePositions[order.symbol] && activePositions[order.symbol].quantity > 0) {
                    const avgBuyPrice = activePositions[order.symbol].cost / activePositions[order.symbol].quantity;
                    const pnl = (order.price - avgBuyPrice) * order.quantity;
                    const invested = avgBuyPrice * order.quantity;
                    const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;

                    const earliestBuyDate = activePositions[order.symbol].buyDates[0] || new Date();
                    const sellDate = new Date(order.timestamp);
                    const daysHeld = Math.max(1, Math.ceil((sellDate - earliestBuyDate) / (1000 * 60 * 60 * 24)));
                    const isIntraday = earliestBuyDate.toDateString() === sellDate.toDateString();

                    // Calculate Entry Type
                    const hours = earliestBuyDate.getHours();
                    const minutes = earliestBuyDate.getMinutes();
                    const timeInMinutes = hours * 60 + minutes;
                    
                    let entryType = 'Unknown';
                    if (timeInMinutes >= 9 * 60 + 15 && timeInMinutes < 9 * 60 + 45) {
                        entryType = 'Peak';
                    } else if (timeInMinutes >= 9 * 60 + 45 && timeInMinutes < 15 * 60) {
                        entryType = 'Subtile';
                    } else if (timeInMinutes >= 15 * 60 && timeInMinutes <= 15 * 60 + 15) {
                        entryType = 'Edge';
                    } else if (timeInMinutes < 9 * 60 + 15) {
                        entryType = 'Pre-market';
                    } else if (timeInMinutes > 15 * 60 + 15) {
                        entryType = 'Post-market';
                    }

                    trades.push({
                        id: order.id || order._id,
                        symbol: order.symbol,
                        quantity: order.quantity,
                        avgPrice: avgBuyPrice,
                        ltp: order.price,
                        pnl,
                        pnlPercentage,
                        invested,
                        currentValue: order.price * order.quantity,
                        daysHeld,
                        status: pnl > 0 ? 'WIN' : 'LOSS',
                        timestamp: order.timestamp,
                        buyDate: earliestBuyDate,
                        sellDate: sellDate,
                        isIntraday,
                        entryType
                    });

                    activePositions[order.symbol].quantity -= order.quantity;
                    activePositions[order.symbol].cost -= avgBuyPrice * order.quantity;
                    if (activePositions[order.symbol].quantity <= 0) {
                        delete activePositions[order.symbol];
                    }
                }
            }
        });
        return trades;
    }, [orders]);

    const tradesByMonth = React.useMemo(() => {
        return completedTrades.reduce((acc, trade) => {
            const month = new Date(trade.timestamp).toLocaleString('default', { month: 'short', year: 'numeric' }).toUpperCase();
            if (!acc[month]) acc[month] = [];
            acc[month].push(trade);
            return acc;
        }, {});
    }, [completedTrades]);

    const monthlyStats = React.useMemo(() => {
        return Object.keys(tradesByMonth).map(monthStr => {
            const trades = tradesByMonth[monthStr];
            const winningTrades = trades.filter(t => t.pnl > 0);
            const losingTrades = trades.filter(t => t.pnl <= 0);

            const totalTrades = trades.length;
            const winPercentage = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

            const avgGain = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b.pnlPercentage, 0) / winningTrades.length : 0;
            const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b.pnlPercentage, 0)) / losingTrades.length : 0;

            const lgGain = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnlPercentage)) : 0;
            const lgLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnlPercentage)) : 0;

            const avgDaysGain = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b.daysHeld, 0) / winningTrades.length : 0;
            const avgDaysLoss = losingTrades.length > 0 ? losingTrades.reduce((a, b) => a + b.daysHeld, 0) / losingTrades.length : 0;

            return {
                month: monthStr,
                trades,
                avgGain,
                avgLoss,
                winPercentage,
                totalTrades,
                lgGain,
                lgLoss: Math.abs(lgLoss),
                avgDaysGain,
                avgDaysLoss
            };
        });
    }, [tradesByMonth]);

    const totalStats = React.useMemo(() => {
        const winningTrades = completedTrades.filter(t => t.pnl > 0);
        const losingTrades = completedTrades.filter(t => t.pnl <= 0);

        const totalTrades = completedTrades.length;
        const winPercentage = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;

        const avgGain = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b.pnlPercentage, 0) / winningTrades.length : 0;
        const avgLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((a, b) => a + b.pnlPercentage, 0)) / losingTrades.length : 0;

        const lgGain = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnlPercentage)) : 0;
        const lgLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnlPercentage)) : 0;

        const avgDaysGain = winningTrades.length > 0 ? winningTrades.reduce((a, b) => a + b.daysHeld, 0) / winningTrades.length : 0;
        const avgDaysLoss = losingTrades.length > 0 ? losingTrades.reduce((a, b) => a + b.daysHeld, 0) / losingTrades.length : 0;

        const totalGainVal = winningTrades.reduce((acc, curr) => acc + curr.pnl, 0);
        const totalLossVal = Math.abs(losingTrades.reduce((acc, curr) => acc + curr.pnl, 0));

        const avgGainVal = winningTrades.length > 0 ? totalGainVal / winningTrades.length : 0;
        const avgLossVal = losingTrades.length > 0 ? totalLossVal / losingTrades.length : 0;

        const winLossRatio = avgLossVal > 0 ? avgGainVal / avgLossVal : 0;
        const adjustedWinLossRatio = totalLossVal > 0 ? totalGainVal / totalLossVal : 0;

        return {
            winPercentage,
            avgGain,
            avgLoss,
            totalTrades,
            lgGain,
            lgLoss: Math.abs(lgLoss),
            avgDaysGain,
            avgDaysLoss,
            winLossRatio,
            adjustedWinLossRatio
        };
    }, [completedTrades]);

    const equityCurveData = React.useMemo(() => {
        let cumulative = 0;
        return completedTrades.map((t, index) => {
            cumulative += t.pnl;
            return {
                id: index,
                label: new Date(t.timestamp).toLocaleDateString(),
                equity: cumulative,
            };
        });
    }, [completedTrades]);

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Monthly Tracker
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 4, borderRadius: 2 }}>
                <Table aria-label="monthly tracker">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell />
                            <TableCell sx={{ fontWeight: 'bold' }}>MONTH</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>AVG GAIN</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>AVG LOSS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>WIN %</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>TOTAL TRADES</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>LG GAIN</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>LG LOSS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>AVG DAYS GAINS</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 'bold' }}>AVG DAYS LOSS</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {monthlyStats.map((row) => (
                            <MonthlyRow key={row.month} row={row} />
                        ))}
                        {monthlyStats.length > 0 && (
                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                <TableCell />
                                <TableCell sx={{ fontWeight: 'bold' }}>AVG.</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalStats.avgGain.toFixed(2)}%</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalStats.avgLoss.toFixed(2)}%</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalStats.winPercentage.toFixed(2)}%</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalStats.totalTrades}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalStats.lgGain > 0 ? totalStats.lgGain.toFixed(2) + '%' : '-'}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{totalStats.lgLoss > 0 ? totalStats.lgLoss.toFixed(2) + '%' : '-'}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Math.round(totalStats.avgDaysGain)}</TableCell>
                                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{Math.round(totalStats.avgDaysLoss)}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                Trading Summary
            </Typography>

            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', mb: 4, borderRadius: 2, width: { xs: '100%', md: '50%' } }}>
                <Table size="small">
                    <TableBody>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Winning Percentage</TableCell>
                            <TableCell align="right">{totalStats.winPercentage.toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Average Gain</TableCell>
                            <TableCell align="right">{totalStats.avgGain.toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Average Loss</TableCell>
                            <TableCell align="right">{totalStats.avgLoss.toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Win / Loss Ratio</TableCell>
                            <TableCell align="right">{totalStats.winLossRatio.toFixed(2)}</TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', borderRight: '1px solid #e0e0e0' }}>Adjusted Win / Loss Ratio</TableCell>
                            <TableCell align="right">{totalStats.adjustedWinLossRatio.toFixed(2)}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            </TableContainer>

            {/* {equityCurveData.length > 0 && (
                <Box sx={{ mt: 4, p: 2, border: '1px solid #e0e0e0', borderRadius: 2, bgcolor: '#fff' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
                        Equity Curve
                    </Typography>
                    <Box sx={{ height: 350, width: '100%' }}>
                        <LineChart
                            dataset={equityCurveData}
                            xAxis={[{ 
                                dataKey: 'id',
                                valueFormatter: (val) => equityCurveData.find(d => d.id === val)?.label || val
                            }]}
                            series={[{
                                dataKey: 'equity',
                                area: true,
                                color: '#059669',
                                showMark: false
                            }]}
                            margin={{ left: 60, right: 20, top: 20, bottom: 30 }}
                        />
                    </Box>
                </Box>
            )} */}
        </Box>
    );
};

export default PaperHoldings;
