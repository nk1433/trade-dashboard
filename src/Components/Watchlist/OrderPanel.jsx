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
    InputAdornment,
    Snackbar,
    Alert,
    ToggleButton,
    ToggleButtonGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch } from 'react-redux';
import { executePaperOrder } from '../../Store/paperTradeSlice';
import { commonInputProps } from '../../utils/themeStyles';

const OrderPanel = ({ open, onClose, script, currentPrice = 0, tradingMode, token }) => {
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
            const effectivePrice = currentPrice || script.ltp || 0;
            setPrice(effectivePrice);
            setTriggerPrice(effectivePrice);
            setQuantity(script.maxShareToBuy || 1);
        }
    }, [open, script, currentPrice]);

    useEffect(() => {
        const effectiveCurrentPrice = currentPrice || 0;
        const entryPrice = orderType === 'MARKET' ? effectiveCurrentPrice : Number(price);
        const qty = Number(quantity);

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


    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    const handlePlaceOrder = async () => {
        if (tradingMode === 'PAPER') {
            const orderData = {
                ...script,
                quantity,
                price: orderType === 'MARKET' ? 0 : price,
                triggerPrice: orderType === 'STOP' ? triggerPrice : 0,
                transactionType: side,
                orderType,
                product: 'I',
                stopLoss: slEnabled ? slPrice : null,
                takeProfit: tpEnabled ? tpPrice : null,
                isPaperTrade: true
            };

            console.log("Placing Paper Order:", orderData);

            dispatch(executePaperOrder({
                symbol: script?.tradingSymbol || script?.symbol,
                quantity: Number(quantity),
                price: orderType === 'MARKET' ? (currentPrice || script?.ltp) : Number(price),
                type: side,
                timestamp: Date.now(),
                sl: slEnabled ? slPrice : 0
            }));

            setSnackbarMessage(`PAPER TRADE EXECUTED: ${side} ${quantity} ${script?.tradingSymbol || 'Stock'}`);
            setSnackbarOpen(true);

            setTimeout(() => {
                onClose();
            }, 1500);
            return;
        }

        // PROD Order Logic
        const accessToken = 'Bearer ' + token;

        const mainOrderPayload = {
            instrument_token: script.instrumentKey,
            quantity: Number(quantity),
            product: 'D',
            validity: 'DAY',
            price: orderType === 'LIMIT' ? Number(price) : 0,
            order_type: orderType,
            transaction_type: side,
            disclosed_quantity: 0,
            trigger_price: orderType === 'STOP' ? Number(triggerPrice) : 0,
            is_amo: false,
            slice: true,
        };

        try {
            const mainResponse = await fetch('http://localhost:3015/place-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    accept: 'application/json',
                    Authorization: accessToken,
                },
                body: JSON.stringify(mainOrderPayload),
            });

            if (!mainResponse.ok) {
                const errorData = await mainResponse.json();
                setSnackbarMessage('Order failed: ' + (errorData.error?.message || JSON.stringify(errorData)));
                setSnackbarOpen(true);
                return;
            }

            const mainData = await mainResponse.json();
            setSnackbarMessage('Order placed successfully! IDs: ' + mainData.data.order_ids.join(', '));
            setSnackbarOpen(true);

            setTimeout(() => {
                onClose();
            }, 1500);

        } catch (error) {
            setSnackbarMessage('Error placing order: ' + error.message);
            setSnackbarOpen(true);
        }
    };



    const themeColor = '#000000'; // Monochrome Black


    return (
        <Drawer
            anchor="right"
            open={open}
            onClose={onClose}
            PaperProps={{
                sx: { width: 320, bgcolor: '#fff', color: '#131722' }
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e3eb' }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{script?.tradingSymbol || 'SYMBOL'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {script?.exchange} • <span style={{ color: themeColor, fontWeight: 600 }}>{Number(currentPrice || script?.ltp || 0).toFixed(2)}</span>
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            <Box sx={{ p: 2, overflowY: 'auto', flex: 1 }}>

                {/* Buy/Sell Toggle */}
                <Box sx={{ display: 'flex', mb: 2, bgcolor: '#f0f3fa', borderRadius: 1, p: 0.5 }}>
                    <Button
                        fullWidth
                        size="small"
                        onClick={() => setSide('BUY')}
                        sx={{
                            bgcolor: side === 'BUY' ? '#000' : 'transparent',
                            color: side === 'BUY' ? '#fff' : '#787b86',
                            fontWeight: 600,
                            borderRadius: 1,
                            '&:hover': { bgcolor: side === 'BUY' ? '#333' : '#e0e3eb' },
                            textTransform: 'none'
                        }}
                    >
                        Buy
                    </Button>
                    <Button
                        fullWidth
                        size="small"
                        onClick={() => setSide('SELL')}
                        sx={{
                            bgcolor: side === 'SELL' ? '#000' : 'transparent',
                            color: side === 'SELL' ? '#fff' : '#787b86',
                            fontWeight: 600,
                            borderRadius: 1,
                            '&:hover': { bgcolor: side === 'SELL' ? '#333' : '#e0e3eb' },
                            textTransform: 'none'
                        }}
                    >
                        Sell
                    </Button>
                </Box>

                {/* Order Type Tabs */}
                <Tabs
                    value={orderType}
                    onChange={(e, v) => setOrderType(v)}
                    variant="fullWidth"
                    sx={{
                        mb: 2,
                        minHeight: 32,
                        borderBottom: '1px solid #e0e3eb',

                        "& .MuiTab-root": {
                            minHeight: 32,
                            textTransform: "none",
                            fontSize: "0.85rem",
                            color: "#787b86",
                            p: 0,

                            // ❌ remove blue browser focus ring
                            "&:focus": { outline: "none" },
                            "&:focus-visible": { outline: "none" },
                        },

                        // selected tab text color
                        "& .Mui-selected": {
                            color: "#000",
                        },

                        // indicator color
                        "& .MuiTabs-indicator": {
                            backgroundColor: "#000",
                        }
                    }}
                >
                    <Tab label="Market" value="MARKET" />
                    <Tab label="Limit" value="LIMIT" />
                    <Tab label="Stop" value="STOP" />
                </Tabs>


                {/* Inputs */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                            <TextField
                                label="Shares"
                                type="number"
                                value={quantity}
                                onChange={(e) => setQuantity(e.target.value)}
                                size="small"
                                fullWidth
                                {...commonInputProps}
                            />

                        </Box>
                        {orderType !== 'MARKET' && (
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    size="small"
                                    fullWidth
                                    {...commonInputProps}
                                />
                            </Box>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                            ₹{((Number(quantity) || 0) * (orderType === 'MARKET' ? (currentPrice || script?.ltp || 0) : (Number(price) || 0))).toFixed(2)}
                        </Typography>
                    </Box>

                    {orderType === 'STOP' && (
                        <TextField
                            label="Trigger Price"
                            type="number"
                            value={triggerPrice?.toFixed(2)}
                            onChange={(e) => setTriggerPrice(e.target.value)}
                            size="small"
                            fullWidth
                            {...commonInputProps}
                        />
                    )}
                </Box>

                {/* Exits Section */}
                <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#787b86', mb: 1, display: 'block' }}>EXITS</Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {/* Stop Loss Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={slEnabled}
                                        onChange={(e) => setSlEnabled(e.target.checked)}
                                        size="small"
                                        sx={{ p: 0.5, color: '#b2b5be', '&.Mui-checked': { color: '#000' } }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Stop Loss</Typography>}
                                sx={{ mr: 0, minWidth: 90 }}
                            />
                            {slEnabled && (
                                <TextField
                                    type="number"
                                    value={slPrice}
                                    onChange={(e) => setSlPrice(e.target.value)}
                                    size="small"
                                    fullWidth
                                    placeholder="Price"
                                    InputProps={{
                                        style: { fontSize: '0.85rem', padding: 0 },
                                        sx: { '& input': { py: 0.5 } }
                                    }}
                                />
                            )}
                        </Box>
                        {slEnabled && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
                                Risk: ₹{riskAmount.toFixed(2)}
                            </Typography>
                        )}

                        {/* Take Profit Row */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={tpEnabled}
                                        onChange={(e) => setTpEnabled(e.target.checked)}
                                        size="small"
                                        sx={{ p: 0.5, color: '#b2b5be', '&.Mui-checked': { color: '#000' } }}
                                    />
                                }
                                label={<Typography variant="body2" sx={{ fontSize: '0.85rem' }}>Take Profit</Typography>}
                                sx={{ mr: 0, minWidth: 90 }}
                            />
                            {tpEnabled && (
                                <TextField
                                    type="number"
                                    value={tpPrice}
                                    onChange={(e) => setTpPrice(e.target.value)}
                                    size="small"
                                    fullWidth
                                    placeholder="Price"
                                    InputProps={{
                                        style: { fontSize: '0.85rem', padding: 0 },
                                        sx: { '& input': { py: 0.5 } }
                                    }}
                                />
                            )}
                        </Box>
                        {tpEnabled && (
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 4, mt: -0.5 }}>
                                Reward: ₹{rewardAmount.toFixed(2)} {slEnabled && `(R:R ${rrRatio})`}
                            </Typography>
                        )}
                    </Box>
                </Box>

            </Box>

            {/* Footer */}
            <Box sx={{ p: 2, borderTop: '1px solid #e0e3eb', bgcolor: '#fff' }}>
                {/* Order Info Summary */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">Margin</Typography>
                        <Typography variant="caption" fontWeight={600}>₹{marginRequired.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Commission</Typography>
                        <Typography variant="caption" fontWeight={600}>--</Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handlePlaceOrder}
                    sx={{
                        bgcolor: themeColor,
                        '&:hover': { bgcolor: '#333' },
                        py: 1,
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        boxShadow: 'none'
                    }}
                >
                    {side === 'BUY' ? 'Buy' : 'Sell'} {script?.tradingSymbol}
                </Button>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={1500}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity="success" sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Drawer >
    );
};

export default OrderPanel;
