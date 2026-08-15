import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Typography, Paper, Chip, Button, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Collapse, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Snackbar, Alert, Drawer, Tabs, Tab } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid } from '@mui/x-data-grid';
import { formatToIndianUnits } from '../../utils/index';
import { executePaperOrder, updatePaperHoldingAsync, fetchSandboxOrdersAsync, modifySandboxOrderAsync, cancelSandboxOrderAsync } from '../../Store/paperTradeSlice';
import OrderPanel from '../Watchlist/OrderPanel';
import { LineChart } from '@mui/x-charts/LineChart';

const PaperHoldings = () => {
    const dispatch = useDispatch();
    const { capital, holdings, sandboxOrders = [] } = useSelector((state) => state.paperTrade);
    const tradingMode = useSelector((state) => state.settings?.tradingMode || 'PAPER');
    const token = useSelector((state) => state.auth?.token);

    const [orderPanelOpen, setOrderPanelOpen] = useState(false);
    const [selectedScript, setSelectedScript] = useState(null);
    const [orderSide, setOrderSide] = useState('BUY');

    // View state
    const [viewMode, setViewMode] = useState('DASHBOARD'); // 'DASHBOARD', 'SUMMARY', or 'SANDBOX_ORDERS'

    // Modify Order state
    const [modifyDialogOpen, setModifyDialogOpen] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [modifyQuantity, setModifyQuantity] = useState('');
    const [modifyPrice, setModifyPrice] = useState('');
    const [modifyTriggerPrice, setModifyTriggerPrice] = useState('');
    const [modifyOrderType, setModifyOrderType] = useState('LIMIT');

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    // Fetch sandbox orders when in sandbox view
    useEffect(() => {
        if (viewMode === 'SANDBOX_ORDERS') {
            dispatch(fetchSandboxOrdersAsync());
        }
    }, [viewMode, dispatch]);

    const handleOpenModify = (order) => {
        setSelectedOrder(order);
        setModifyQuantity(order.quantity);
        setModifyPrice(order.price || 0);
        setModifyTriggerPrice(order.trigger_price || 0);
        setModifyOrderType(order.order_type || 'LIMIT');
        setModifyDialogOpen(true);
    };

    const handleCloseModify = () => {
        setModifyDialogOpen(false);
        setSelectedOrder(null);
    };

    const handleModifySubmit = async () => {
        try {
            const action = await dispatch(modifySandboxOrderAsync({
                order_id: selectedOrder.order_id,
                quantity: Number(modifyQuantity),
                order_type: modifyOrderType,
                price: Number(modifyPrice),
                trigger_price: Number(modifyTriggerPrice)
            }));
            if (modifySandboxOrderAsync.fulfilled.match(action)) {
                setSnackbarMessage("Sandbox order modified successfully!");
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
                handleCloseModify();
                dispatch(fetchSandboxOrdersAsync());
            } else {
                setSnackbarMessage(`Failed to modify order: ${action.payload || "Unknown error"}`);
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } catch (err) {
            setSnackbarMessage(`Error: ${err.message}`);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    const handleCancelOrder = async (orderId) => {
        if (window.confirm(`Are you sure you want to cancel sandbox order ${orderId}?`)) {
            try {
                const action = await dispatch(cancelSandboxOrderAsync(orderId));
                if (cancelSandboxOrderAsync.fulfilled.match(action)) {
                    setSnackbarMessage("Sandbox order cancelled successfully!");
                    setSnackbarSeverity("success");
                    setSnackbarOpen(true);
                    dispatch(fetchSandboxOrdersAsync());
                } else {
                    setSnackbarMessage(`Failed to cancel order: ${action.payload || "Unknown error"}`);
                    setSnackbarSeverity("error");
                    setSnackbarOpen(true);
                }
            } catch (err) {
                setSnackbarMessage(`Error: ${err.message}`);
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        }
    };

    // Manage Position Drawer state
    const [manageDrawerOpen, setManageDrawerOpen] = useState(false);
    const [selectedHolding, setSelectedHolding] = useState(null);
    const [manageTab, setManageTab] = useState(0); // 0: Modify SL, 1: Add (Buy), 2: Sell / Exit

    // Tab 0: SL inputs
    const [newSlPrice, setNewSlPrice] = useState('');

    // Tab 1: Buy inputs
    const [buyQty, setBuyQty] = useState(1);
    const [buyPrice, setBuyPrice] = useState('');
    const [buyOrderType, setBuyOrderType] = useState('MARKET'); // MARKET / LIMIT

    // Tab 2: Sell inputs
    const [sellQty, setSellQty] = useState(1);
    const [sellPrice, setSellPrice] = useState('');
    const [sellOrderType, setSellOrderType] = useState('MARKET'); // MARKET / LIMIT

    const handleOpenManage = (row) => {
        setSelectedHolding(row);
        setNewSlPrice(row.sl || '');
        
        setBuyQty(1);
        setBuyPrice(row.ltp || '');
        setBuyOrderType('MARKET');

        setSellQty(row.quantity || 1);
        setSellPrice(row.ltp || '');
        setSellOrderType('MARKET');

        setManageTab(0); // Start on Modify SL tab by default
        setManageDrawerOpen(true);
    };

    const handleCloseManage = () => {
        setManageDrawerOpen(false);
        setSelectedHolding(null);
    };

    const handleManageSlSubmit = async () => {
        try {
            const action = await dispatch(updatePaperHoldingAsync({
                symbol: selectedHolding.symbol,
                sl: Number(newSlPrice)
            }));
            if (updatePaperHoldingAsync.fulfilled.match(action)) {
                setSnackbarMessage(`Stop Loss updated to ₹${Number(newSlPrice).toFixed(2)} for ${selectedHolding.symbol}`);
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
                handleCloseManage();
            } else {
                setSnackbarMessage(`Failed to update Stop Loss: ${action.payload || "Unknown error"}`);
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } catch (err) {
            setSnackbarMessage(`Error: ${err.message}`);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    const handleManageBuySubmit = async () => {
        try {
            const finalPrice = buyOrderType === 'MARKET' ? (selectedHolding.ltp || 0) : Number(buyPrice);
            const action = await dispatch(executePaperOrder({
                symbol: selectedHolding.symbol,
                quantity: Number(buyQty),
                price: finalPrice,
                type: 'BUY',
                timestamp: Date.now(),
                sl: selectedHolding.sl || 0,
                slPrice: selectedHolding.sl || 0,
                riskAmount: 0,
                riskPercentage: 0,
                slStrategy: 'custom',
                slPercentage: 0,
                risk: 0
            }));
            if (executePaperOrder.fulfilled.match(action)) {
                setSnackbarMessage(`Bought ${buyQty} shares of ${selectedHolding.symbol}`);
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
                handleCloseManage();
            } else {
                setSnackbarMessage(`Buy order failed: ${action.payload || "Unknown error"}`);
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } catch (err) {
            setSnackbarMessage(`Error: ${err.message}`);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    const handleManageSellSubmit = async () => {
        try {
            const finalPrice = sellOrderType === 'MARKET' ? (selectedHolding.ltp || 0) : Number(sellPrice);
            const action = await dispatch(executePaperOrder({
                symbol: selectedHolding.symbol,
                quantity: Number(sellQty),
                price: finalPrice,
                type: 'SELL',
                timestamp: Date.now(),
                sl: selectedHolding.sl || 0,
                slPrice: selectedHolding.sl || 0,
                riskAmount: 0,
                riskPercentage: 0,
                slStrategy: 'custom',
                slPercentage: 0,
                risk: 0
            }));
            if (executePaperOrder.fulfilled.match(action)) {
                setSnackbarMessage(`Sold ${sellQty} shares of ${selectedHolding.symbol}`);
                setSnackbarSeverity("success");
                setSnackbarOpen(true);
                handleCloseManage();
            } else {
                setSnackbarMessage(`Sell order failed: ${action.payload || "Unknown error"}`);
                setSnackbarSeverity("error");
                setSnackbarOpen(true);
            }
        } catch (err) {
            setSnackbarMessage(`Error: ${err.message}`);
            setSnackbarSeverity("error");
            setSnackbarOpen(true);
        }
    };

    // LTP updates are handled globally in App.jsx:
    //  • Market CLOSED/UNKNOWN → fetches fresh LTP from Upstox market-quote/ltp API
    //  • Market OPEN → live WS tickers flow through orderMetrics → updatePaperHoldingsLTP

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

    // Remove unused handlers

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
            flex: 1.2,
            minWidth: 120,
            sortable: false,
            renderCell: (params) => (
                <Button
                    variant="outlined"
                    size="small"
                    color="primary"
                    onClick={(e) => { e.stopPropagation(); handleOpenManage(params.row); }}
                    sx={{
                        fontSize: '0.75rem',
                        py: 0.5,
                        px: 1.5,
                        fontWeight: 600,
                        textTransform: 'none',
                        borderRadius: 1.5,
                        color: '#000',
                        borderColor: '#e2e8f0',
                        '&:hover': {
                            bgcolor: '#f8fafc',
                            borderColor: '#cbd5e1'
                        }
                    }}
                >
                    Manage
                </Button>
            ),
        },
    ];

    const sandboxColumns = [
        { field: 'trading_symbol', headerName: 'Symbol', flex: 1, minWidth: 100 },
        {
            field: 'transaction_type',
            headerName: 'Type',
            flex: 0.8,
            minWidth: 80,
            renderCell: (params) => {
                const isBuy = params.value === 'BUY';
                return (
                    <Chip
                        label={params.value}
                        size="small"
                        sx={{
                            bgcolor: isBuy ? '#ecfdf5' : '#fef2f2',
                            color: isBuy ? '#059669' : '#dc2626',
                            fontWeight: 600,
                            height: 22
                        }}
                    />
                );
            }
        },
        { field: 'order_type', headerName: 'Order Type', flex: 1, minWidth: 100 },
        {
            field: 'price',
            headerName: 'Price',
            flex: 1,
            minWidth: 100,
            type: 'number',
            renderCell: (params) => `₹${params.value?.toFixed(2)}`
        },
        {
            field: 'trigger_price',
            headerName: 'Trigger Price',
            flex: 1,
            minWidth: 110,
            type: 'number',
            renderCell: (params) => params.value > 0 ? `₹${params.value?.toFixed(2)}` : '-'
        },
        { field: 'quantity', headerName: 'Qty', flex: 0.8, minWidth: 80, type: 'number' },
        {
            field: 'status',
            headerName: 'Status',
            flex: 1.2,
            minWidth: 120,
            renderCell: (params) => {
                const status = params.value?.toLowerCase() || '';
                let color = '#64748b'; // grey
                let bgcolor = '#f1f5f9';
                if (status === 'complete' || status === 'filled') {
                    color = '#059669'; // green
                    bgcolor = '#ecfdf5';
                } else if (status === 'rejected' || status === 'cancelled') {
                    color = '#dc2626'; // red
                    bgcolor = '#fef2f2';
                } else if (status.includes('pending') || status === 'open') {
                    color = '#d97706'; // amber
                    bgcolor = '#fffbeb';
                }
                return (
                    <Chip
                        label={params.value}
                        size="small"
                        sx={{ bgcolor, color, fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                    />
                );
            }
        },
        { field: 'status_message', headerName: 'Message', flex: 1.5, minWidth: 180 },
        {
            field: 'actions',
            headerName: 'Actions',
            flex: 1.5,
            minWidth: 160,
            sortable: false,
            renderCell: (params) => {
                const status = params.row.status?.toLowerCase() || '';
                const isFinal = status === 'complete' || status === 'filled' || status === 'rejected' || status === 'cancelled';
                if (isFinal) return null;

                return (
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleOpenModify(params.row); }}
                            sx={{ fontSize: '0.7rem', py: 0.5, minWidth: 'auto' }}
                        >
                            Modify
                        </Button>
                        <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            onClick={(e) => { e.stopPropagation(); handleCancelOrder(params.row.order_id); }}
                            sx={{ fontSize: '0.7rem', py: 0.5, minWidth: 'auto' }}
                        >
                            Cancel
                        </Button>
                    </Box>
                );
            }
        }
    ];

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', color: '#000' }}>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexShrink: 0 }}>
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                    {viewMode === 'DASHBOARD' ? `Holdings (${holdings.length})` :
                        viewMode === 'SANDBOX_ORDERS' ? `Active Sandbox Orders (${sandboxOrders.length})` :
                            'Trading Summary'}
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
                            minWidth: 180,
                            bgcolor: '#f8fafc',
                            '& .MuiSelect-select': { py: 0.5, fontWeight: 600, fontSize: '0.875rem' },
                            '& fieldset': { border: '1px solid #e2e8f0' }
                        }}
                    >
                        <MenuItem value="DASHBOARD">Live Dashboard</MenuItem>
                        <MenuItem value="SANDBOX_ORDERS">Active Sandbox Orders</MenuItem>
                        <MenuItem value="SUMMARY">Trading Summary</MenuItem>
                    </Select>
                </Box>
            </Box>

            {viewMode === 'DASHBOARD' && (
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
            )}

            {viewMode === 'SANDBOX_ORDERS' && (
                <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
                    <DataGrid
                        rows={sandboxOrders.map((o) => ({ id: o.order_id, ...o }))}
                        columns={sandboxColumns}
                        rowHeight={60}
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
                </Box>
            )}

            {viewMode === 'SUMMARY' && (
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

            {/* Modify Order Dialog */}
            <Dialog open={modifyDialogOpen} onClose={handleCloseModify} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Modify Sandbox Order</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        Modify active order for <strong>{selectedOrder?.trading_symbol}</strong> (ID: {selectedOrder?.order_id})
                    </Typography>

                    <TextField
                        label="Quantity"
                        type="number"
                        value={modifyQuantity}
                        onChange={(e) => setModifyQuantity(e.target.value)}
                        fullWidth
                        size="small"
                        margin="dense"
                    />

                    <Select
                        value={modifyOrderType}
                        onChange={(e) => setModifyOrderType(e.target.value)}
                        size="small"
                        fullWidth
                        margin="dense"
                    >
                        <MenuItem value="LIMIT">LIMIT</MenuItem>
                        <MenuItem value="MARKET">MARKET</MenuItem>
                        <MenuItem value="SL">STOP LOSS LIMIT (SL)</MenuItem>
                        <MenuItem value="SL-M">STOP LOSS MARKET (SL-M)</MenuItem>
                    </Select>

                    {modifyOrderType !== 'MARKET' && modifyOrderType !== 'SL-M' && (
                        <TextField
                            label="Limit Price"
                            type="number"
                            value={modifyPrice}
                            onChange={(e) => setModifyPrice(e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                        />
                    )}

                    {(modifyOrderType === 'SL' || modifyOrderType === 'SL-M') && (
                        <TextField
                            label="Trigger Price"
                            type="number"
                            value={modifyTriggerPrice}
                            onChange={(e) => setModifyTriggerPrice(e.target.value)}
                            fullWidth
                            size="small"
                            margin="dense"
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={handleCloseModify} color="inherit" size="small">Cancel</Button>
                    <Button onClick={handleModifySubmit} variant="contained" color="primary" size="small" disabled={Number(modifyQuantity) <= 0}>
                        Submit Modification
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Global Snackbar notifications */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={4000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbarSeverity} sx={{ width: '100%' }} onClose={() => setSnackbarOpen(false)}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>

            {/* Manage Position Drawer */}
            <Drawer
                anchor="right"
                open={manageDrawerOpen}
                onClose={handleCloseManage}
                PaperProps={{ sx: { width: 420, p: 3, display: 'flex', flexDirection: 'column', gap: 3 } }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                            Manage Position
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary">
                            {selectedHolding?.symbol} • Avg: ₹{selectedHolding?.avgPrice?.toFixed(2)}
                        </Typography>
                    </Box>
                    <IconButton onClick={handleCloseManage} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>

                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Current Price (LTP)</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>₹{selectedHolding?.ltp?.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Current Position</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedHolding?.quantity} shares</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Returns</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: (selectedHolding?.pnl >= 0) ? '#059669' : '#dc2626' }}>
                            {selectedHolding?.pnl >= 0 ? '+' : ''}₹{formatToIndianUnits(selectedHolding?.pnl || 0)} ({selectedHolding?.pnlPercentage?.toFixed(2)}%)
                        </Typography>
                    </Box>
                </Box>

                <Tabs
                    value={manageTab}
                    onChange={(e, val) => setManageTab(val)}
                    variant="fullWidth"
                    sx={{
                        borderBottom: '1px solid #e2e8f0',
                        '& .MuiTabs-indicator': { backgroundColor: '#000 !important' },
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: '#64748b',
                            '&.Mui-selected': { color: '#000 !important' }
                        }
                    }}
                >
                    <Tab label="Modify SL" />
                    <Tab label="Buy More" />
                    <Tab label="Sell / Exit" />
                </Tabs>

                {/* Tab 0: Modify SL */}
                {manageTab === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>Stop Loss Price</Typography>
                                <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setNewSlPrice(selectedHolding?.avgPrice?.toFixed(2))}
                                    sx={{
                                        py: 0.25,
                                        fontSize: '0.7rem',
                                        textTransform: 'none',
                                        color: '#000',
                                        borderColor: '#000',
                                        '&:hover': { bgcolor: '#f8fafc', borderColor: '#000' }
                                    }}
                                >
                                    Set to BE (₹{selectedHolding?.avgPrice?.toFixed(2)})
                                </Button>
                            </Box>
                            <TextField
                                type="number"
                                fullWidth
                                size="small"
                                value={newSlPrice}
                                onChange={(e) => setNewSlPrice(e.target.value)}
                                placeholder="Enter Stop Loss Price"
                                InputProps={{
                                    startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                                }}
                            />
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleManageSlSubmit}
                            disabled={!newSlPrice || Number(newSlPrice) <= 0}
                            sx={{
                                mt: 'auto',
                                py: 1.2,
                                fontWeight: 600,
                                textTransform: 'none',
                                bgcolor: '#000 !important',
                                color: '#fff !important',
                                '&:hover': { bgcolor: '#222 !important' },
                                '&.Mui-disabled': { bgcolor: '#f1f5f9 !important', color: '#94a3b8 !important' }
                            }}
                        >
                            Update Stop Loss
                        </Button>
                    </Box>
                )}

                {/* Tab 1: Buy More */}
                {manageTab === 1 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => setBuyOrderType('MARKET')}
                                    sx={{
                                        py: 0.75,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        bgcolor: buyOrderType === 'MARKET' ? '#000 !important' : 'transparent',
                                        color: buyOrderType === 'MARKET' ? '#fff !important' : '#000',
                                        border: '1px solid #000',
                                        '&:hover': { bgcolor: buyOrderType === 'MARKET' ? '#222 !important' : '#f8fafc' }
                                    }}
                                >
                                    Market
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setBuyOrderType('LIMIT')}
                                    sx={{
                                        py: 0.75,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        bgcolor: buyOrderType === 'LIMIT' ? '#000 !important' : 'transparent',
                                        color: buyOrderType === 'LIMIT' ? '#fff !important' : '#000',
                                        border: '1px solid #000',
                                        '&:hover': { bgcolor: buyOrderType === 'LIMIT' ? '#222 !important' : '#f8fafc' }
                                    }}
                                >
                                    Limit
                                </Button>
                            </Box>

                            <TextField
                                label="Quantity"
                                type="number"
                                fullWidth
                                size="small"
                                value={buyQty}
                                onChange={(e) => setBuyQty(e.target.value)}
                            />

                            {buyOrderType === 'LIMIT' && (
                                <TextField
                                    label="Price"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={buyPrice}
                                    onChange={(e) => setBuyPrice(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                                    }}
                                />
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Estimated Cost</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{formatToIndianUnits(Number(buyQty) * (buyOrderType === 'MARKET' ? (selectedHolding?.ltp || 0) : Number(buyPrice || 0)))}
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleManageBuySubmit}
                            disabled={Number(buyQty) <= 0 || (buyOrderType === 'LIMIT' && (!buyPrice || Number(buyPrice) <= 0))}
                            sx={{
                                mt: 'auto',
                                py: 1.2,
                                fontWeight: 600,
                                textTransform: 'none',
                                bgcolor: '#000 !important',
                                color: '#fff !important',
                                '&:hover': { bgcolor: '#222 !important' },
                                '&.Mui-disabled': { bgcolor: '#f1f5f9 !important', color: '#94a3b8 !important' }
                            }}
                        >
                            Place Buy Order
                        </Button>
                    </Box>
                )}

                {/* Tab 2: Sell / Exit */}
                {manageTab === 2 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                    fullWidth
                                    variant="contained"
                                    onClick={() => setSellOrderType('MARKET')}
                                    sx={{
                                        py: 0.75,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        bgcolor: sellOrderType === 'MARKET' ? '#000 !important' : 'transparent',
                                        color: sellOrderType === 'MARKET' ? '#fff !important' : '#000',
                                        border: '1px solid #000',
                                        '&:hover': { bgcolor: sellOrderType === 'MARKET' ? '#222 !important' : '#f8fafc' }
                                    }}
                                >
                                    Market
                                </Button>
                                <Button
                                    fullWidth
                                    variant="outlined"
                                    onClick={() => setSellOrderType('LIMIT')}
                                    sx={{
                                        py: 0.75,
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        bgcolor: sellOrderType === 'LIMIT' ? '#000 !important' : 'transparent',
                                        color: sellOrderType === 'LIMIT' ? '#fff !important' : '#000',
                                        border: '1px solid #000',
                                        '&:hover': { bgcolor: sellOrderType === 'LIMIT' ? '#222 !important' : '#f8fafc' }
                                    }}
                                >
                                    Limit
                                </Button>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {[0.25, 0.50, 0.75, 1.00].map((pct) => (
                                    <Button
                                        key={pct}
                                        variant="outlined"
                                        size="small"
                                        onClick={() => setSellQty(Math.floor((selectedHolding?.quantity || 0) * pct) || 1)}
                                        sx={{
                                            py: 0.25,
                                            flex: 1,
                                            fontSize: '0.75rem',
                                            textTransform: 'none',
                                            color: '#000',
                                            borderColor: '#cbd5e1',
                                            '&:hover': { bgcolor: '#f8fafc', borderColor: '#000' }
                                        }}
                                    >
                                        {pct === 1 ? '100%' : `${pct * 100}%`}
                                    </Button>
                                ))}
                            </Box>

                            <TextField
                                label="Quantity to Sell"
                                type="number"
                                fullWidth
                                size="small"
                                value={sellQty}
                                onChange={(e) => setSellQty(e.target.value)}
                            />

                            {sellOrderType === 'LIMIT' && (
                                <TextField
                                    label="Price"
                                    type="number"
                                    fullWidth
                                    size="small"
                                    value={sellPrice}
                                    onChange={(e) => setSellPrice(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>₹</Typography>
                                    }}
                                />
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, px: 0.5 }}>
                                <Typography variant="body2" color="text.secondary">Estimated Credits</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ₹{formatToIndianUnits(Number(sellQty) * (sellOrderType === 'MARKET' ? (selectedHolding?.ltp || 0) : Number(sellPrice || 0)))}
                                </Typography>
                            </Box>
                        </Box>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={handleManageSellSubmit}
                            disabled={Number(sellQty) <= 0 || Number(sellQty) > (selectedHolding?.quantity || 0) || (sellOrderType === 'LIMIT' && (!sellPrice || Number(sellPrice) <= 0))}
                            sx={{
                                mt: 'auto',
                                py: 1.2,
                                fontWeight: 600,
                                textTransform: 'none',
                                bgcolor: '#000 !important',
                                color: '#fff !important',
                                '&:hover': { bgcolor: '#222 !important' },
                                '&.Mui-disabled': { bgcolor: '#f1f5f9 !important', color: '#94a3b8 !important' }
                            }}
                        >
                            Place Sell Order
                        </Button>
                    </Box>
                )}
            </Drawer>
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
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>PF Impact</TableCell>
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
                                            <TableCell align="right" sx={{ color: trade.pfImpact > 0 ? '#059669' : '#dc2626', fontWeight: 500 }}>
                                                {trade.pfImpact > 0 ? '+' : ''}{trade.pfImpact.toFixed(2)}%
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
    const capital = useSelector((state) => state.paperTrade.capital);

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
                    } else if (timeInMinutes >= 15 * 60 && timeInMinutes <= 15 * 60 + 30) {
                        entryType = 'Edge';
                    } else if (timeInMinutes < 9 * 60 + 15) {
                        entryType = 'Pre-market';
                    } else if (timeInMinutes > 15 * 60 + 30) {
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
                        pfImpact: capital > 0 ? (pnl / capital) * 100 : 0,
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
    }, [orders, capital]);

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
