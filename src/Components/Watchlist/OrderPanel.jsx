import React, { useState, useEffect } from 'react';
import {
    Box,
    Drawer,
    Typography,
    Tabs,
    Tab,
    TextField,
    Button,
    Checkbox,
    FormControlLabel,
    Divider,
    IconButton,
    InputAdornment
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { placeSLMOrder } from '../../Store/upstoxs'; // We might need a more generic action later

const OrderPanel = ({ open, onClose, script, currentPrice = 0 }) => {
    const dispatch = useDispatch();
    const [side, setSide] = useState('BUY'); // BUY or SELL
    const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT, STOP
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(currentPrice);
    const [triggerPrice, setTriggerPrice] = useState(currentPrice);

    // Risk Management
    const [slEnabled, setSlEnabled] = useState(false);
    const [slPrice, setSlPrice] = useState(0);
    const [tpEnabled, setTpEnabled] = useState(false);
    const [tpPrice, setTpPrice] = useState(0);

    // Calculated Values
    const [riskAmount, setRiskAmount] = useState(0);
    const [rewardAmount, setRewardAmount] = useState(0);
    const [rrRatio, setRrRatio] = useState(0);
    const [marginRequired, setMarginRequired] = useState(0);

    useEffect(() => {
        if (open && script) {
            // Reset/Init values when panel opens
            // SIMULATION: If currentPrice is 0 or missing, use a mock price (e.g., 2500)
            const effectivePrice = currentPrice || script.ltp || 2500;
            setPrice(effectivePrice);
            setTriggerPrice(effectivePrice);
        }
    }, [open, script, currentPrice]);

    useEffect(() => {
        // Calculations
        // SIMULATION: Use mock price if needed
        const effectiveCurrentPrice = currentPrice || 2500;
        const entryPrice = orderType === 'MARKET' ? effectiveCurrentPrice : Number(price);
        const qty = Number(quantity);

        // Margin (Simple approximation, ideally fetch from API)
        setMarginRequired(entryPrice * qty);

        if (slEnabled) {
            const riskPerShare = side === 'BUY' ? entryPrice - slPrice : slPrice - entryPrice;
            const totalRisk = riskPerShare * qty;
            setRiskAmount(totalRisk > 0 ? totalRisk : 0);
        } else {
            setRiskAmount(0);
        }

        if (tpEnabled) {
            const rewardPerShare = side === 'BUY' ? tpPrice - entryPrice : entryPrice - tpPrice;
            const totalReward = rewardPerShare * qty;
            setRewardAmount(totalReward > 0 ? totalReward : 0);
        } else {
            setRewardAmount(0);
        }

    }, [side, orderType, quantity, price, slEnabled, slPrice, tpEnabled, tpPrice, currentPrice]);

    useEffect(() => {
        if (riskAmount > 0 && rewardAmount > 0) {
            setRrRatio((rewardAmount / riskAmount).toFixed(2));
        } else {
            setRrRatio(0);
        }
    }, [riskAmount, rewardAmount]);


    const handlePlaceOrder = () => {
        const orderData = {
            ...script,
            quantity,
            price: orderType === 'MARKET' ? 0 : price,
            triggerPrice: orderType === 'STOP' ? triggerPrice : 0,
            transactionType: side,
            orderType,
            product: 'I', // Intraday by default?
            stopLoss: slEnabled ? slPrice : null,
            takeProfit: tpEnabled ? tpPrice : null,
            isPaperTrade: true // Flag for simulation
        };

        console.log("Placing Paper Order:", orderData);
        alert(`PAPER TRADE EXECUTED\n\n${side} ${quantity} ${script?.tradingSymbol || 'Stock'}\nType: ${orderType}\nPrice: ${orderType === 'MARKET' ? 'MKT' : price}\n\nRisk: ₹${riskAmount.toFixed(2)}\nReward: ₹${rewardAmount.toFixed(2)}`);

        onClose();
    };

    const themeColor = side === 'BUY' ? '#2962ff' : '#f23645'; // TradingView Blue / Red

    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: 360, bgcolor: '#fff' }
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid #e0e3eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{script?.tradingSymbol || 'SYMBOL'}</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {script?.exchange} • {currentPrice || script?.ltp}
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>
                {/* Buy/Sell Tabs */}
                <Box sx={{ bgcolor: '#f0f3fa', borderRadius: 1, p: 0.5, mb: 2, display: 'flex' }}>
                    <Button
                        fullWidth
                        variant={side === 'BUY' ? 'contained' : 'text'}
                        onClick={() => setSide('BUY')}
                        sx={{
                            bgcolor: side === 'BUY' ? '#2962ff' : 'transparent',
                            color: side === 'BUY' ? '#fff' : '#000',
                            '&:hover': { bgcolor: side === 'BUY' ? '#1e54e6' : '#e0e3eb' },
                            boxShadow: 'none',
                            borderRadius: 1
                        }}
                    >
                        Buy
                    </Button>
                    <Button
                        fullWidth
                        variant={side === 'SELL' ? 'contained' : 'text'}
                        onClick={() => setSide('SELL')}
                        sx={{
                            bgcolor: side === 'SELL' ? '#f23645' : 'transparent',
                            color: side === 'SELL' ? '#fff' : '#000',
                            '&:hover': { bgcolor: side === 'SELL' ? '#d62f3c' : '#e0e3eb' },
                            boxShadow: 'none',
                            borderRadius: 1
                        }}
                    >
                        Sell
                    </Button>
                </Box>

                {/* Order Type */}
                <Tabs
                    value={orderType}
                    onChange={(e, v) => setOrderType(v)}
                    variant="fullWidth"
                    sx={{ mb: 2, minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}
                    TabIndicatorProps={{ style: { backgroundColor: themeColor } }}
                >
                    <Tab label="Market" value="MARKET" sx={{ '&.Mui-selected': { color: themeColor } }} />
                    <Tab label="Limit" value="LIMIT" sx={{ '&.Mui-selected': { color: themeColor } }} />
                    <Tab label="Stop" value="STOP" sx={{ '&.Mui-selected': { color: themeColor } }} />
                </Tabs>

                {/* Inputs */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <TextField
                        label="Shares"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        size="small"
                        fullWidth
                        InputProps={{
                            endAdornment: <InputAdornment position="end">Qty</InputAdornment>,
                        }}
                    />

                    {orderType !== 'MARKET' && (
                        <TextField
                            label="Price"
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    )}

                    {orderType === 'STOP' && (
                        <TextField
                            label="Trigger Price"
                            type="number"
                            value={triggerPrice}
                            onChange={(e) => setTriggerPrice(e.target.value)}
                            size="small"
                            fullWidth
                        />
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Risk Management */}
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <FormControlLabel
                            control={<Checkbox checked={slEnabled} onChange={(e) => setSlEnabled(e.target.checked)} size="small" sx={{ color: themeColor, '&.Mui-checked': { color: themeColor } }} />}
                            label={<Typography variant="body2" fontWeight={600}>Stop Loss</Typography>}
                        />
                        {slEnabled && (
                            <TextField
                                type="number"
                                value={slPrice}
                                onChange={(e) => setSlPrice(e.target.value)}
                                size="small"
                                sx={{ width: 120 }}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                        )}
                    </Box>
                    {slEnabled && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1, mb: 1 }}>
                            <Typography variant="caption" color="text.secondary">Risk: ₹{riskAmount.toFixed(2)}</Typography>
                        </Box>
                    )}

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <FormControlLabel
                            control={<Checkbox checked={tpEnabled} onChange={(e) => setTpEnabled(e.target.checked)} size="small" sx={{ color: themeColor, '&.Mui-checked': { color: themeColor } }} />}
                            label={<Typography variant="body2" fontWeight={600}>Take Profit</Typography>}
                        />
                        {tpEnabled && (
                            <TextField
                                type="number"
                                value={tpPrice}
                                onChange={(e) => setTpPrice(e.target.value)}
                                size="small"
                                sx={{ width: 120 }}
                                InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                            />
                        )}
                    </Box>
                    {tpEnabled && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', px: 1 }}>
                            <Typography variant="caption" color="text.secondary">Reward: ₹{rewardAmount.toFixed(2)}</Typography>
                            {slEnabled && <Typography variant="caption" color="text.secondary">R:R: {rrRatio}</Typography>}
                        </Box>
                    )}
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Stats */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">Margin Required</Typography>
                    <Typography variant="body2" fontWeight={600}>₹{marginRequired.toFixed(2)}</Typography>
                </Box>

            </Box>

            {/* Footer / Action Button */}
            <Box sx={{ p: 2, borderTop: '1px solid #e0e3eb' }}>
                <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handlePlaceOrder}
                    sx={{
                        bgcolor: themeColor,
                        '&:hover': { bgcolor: side === 'BUY' ? '#1e54e6' : '#d62f3c' },
                        fontWeight: 700,
                        py: 1.5
                    }}
                >
                    {side} {script?.tradingSymbol}
                </Button>
            </Box>
        </Drawer>
    );
};

export default OrderPanel;
