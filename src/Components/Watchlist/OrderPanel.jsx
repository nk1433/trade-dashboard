import React, { useState, useEffect, useMemo } from 'react';
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
    ToggleButtonGroup,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useDispatch, useSelector } from 'react-redux';
import { executePaperOrder } from '../../Store/paperTradeSlice';
import { commonInputProps } from '../../utils/themeStyles';
import { calculateAllocationIntent } from '../../utils/calculateMetrics';
import { fetchHistoricalData } from '../TradingView/datafeed/services/upstoxApiService';

const formatShortAmount = (value) => {
    if (!value || isNaN(value)) return '0';
    const num = Number(value);
    if (num >= 10000000) return (num / 10000000).toFixed(2).replace(/\.?0+$/, '') + 'Cr';
    if (num >= 1000) return (num / 100000).toFixed(2).replace(/\.?0+$/, '') + 'L'; // e.g. 150000 -> 1.5L, 50000 -> 0.5L
    return num.toFixed(2).replace(/\.00$/, '');
};

const OrderPanel = ({ open, onClose, script, currentPrice = 0, tradingMode, token, initialSide = 'BUY' }) => {
    const dispatch = useDispatch();
    const capital = useSelector((state) => state.paperTrade.capital); // Get Paper Capital
    const [side, setSide] = useState(initialSide); // BUY or SELL
    const [orderType, setOrderType] = useState('MARKET'); // MARKET, LIMIT, STOP
    const [quantity, setQuantity] = useState(1);
    const [price, setPrice] = useState(currentPrice);
    const [triggerPrice, setTriggerPrice] = useState(currentPrice);
    const [tactic, setTactic] = useState('custom'); // 'custom', '2pct_open', 'open_price', 'fixed_qty_risk'

    // Risk Management
    const [slEnabled, setSlEnabled] = useState(false);
    const [slPrice, setSlPrice] = useState(0);
    const [tpEnabled, setTpEnabled] = useState(false);
    const [tpPrice, setTpPrice] = useState(0);
    const [maxAlloc, setMaxAlloc] = useState(15);
    const [forceMaxAlloc, setForceMaxAlloc] = useState(false);

    // Calculated Values
    const [rewardAmount, setRewardAmount] = useState(0);
    const [rrRatio, setRrRatio] = useState(0);

    // Dynamic Metrics State
    const settings = useSelector((state) => state.settings); // Get Settings
    const portfolio = useSelector((state) => state.orders); // Access orders slice which contains 'holdings' but seemingly not portfolio config?
    // Wait, upstoxs.js accessed 'portfolio' from state. Let's assume there is a portfolio slice or we use paperTrade/settings. 
    // Checking upstoxs.js again: const { portfolio, settings, orders: { stats } } = state.getState();
    // It seems 'portfolio' is a slice. Let me check Store/index.js output. 
    // Validating from Store/index.js in next step if needed, but for now I will rely on standard access.
    // Actually, I will use a safe fallback for riskPercentage.

    // Assuming portfolio slice exists or we derive risk from settings/paperTrade. 
    // For now, I'll stick to what I see in `OrderPanel`: paperTrade.capital

    const [calcMetrics, setCalcMetrics] = useState({
        quantity: 1,
        riskAmount: 0,
        riskPercentage: 0,
        allocation: 0,
        allocPercent: 0,
    });

    const [lastCandle, setLastCandle] = useState(null);

    // Fetch the latest daily OHLC when the panel opens
    useEffect(() => {
        if (open && script?.instrumentKey) {
            const toDate = new Date().toISOString().split('T')[0];
            const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // past week

            fetchHistoricalData(script.instrumentKey, 'days', '1', fromDate, toDate)
                .then(res => {
                    if (res.data?.data?.candles?.length > 0) {
                        const c = res.data.data.candles[0];
                        setLastCandle({
                            open: c[1],
                            high: c[2],
                            low: c[3],
                            close: c[4]
                        });
                    }
                })
                .catch(err => console.error("Failed to fetch OHLC", err));
        } else {
            setLastCandle(null);
        }
    }, [open, script?.instrumentKey]);

    useEffect(() => {
        if (lastCandle && (!price || price === 0)) {
            setPrice(lastCandle.close);
            setTriggerPrice(lastCandle.close);
        }
    }, [lastCandle, price]);

    // Initial Load when Panel Opens
    useEffect(() => {
        if (open && script) {
            setMaxAlloc(settings?.maxAllowedAllocation || 15);
            const effectivePrice = currentPrice || script.ltp || 0;
            // Only set price on open
            setPrice(effectivePrice);
            setTriggerPrice(effectivePrice);
            // Default to 'sharesToBuy' (Calculated trade quantity) instead of 'maxShareToBuy' (Limit)
            setQuantity(script.sharesToBuy || script.maxShareToBuy || 1);

            setSlEnabled(true);
            setTactic('open_price'); // Set the default tactic to Open Price SL

            // Set side from initialSide if provided (re-sync on open)
            setSide(initialSide);

            // Initial Calculation
            const initialRisk = script.lossInMoney || (capital * 0.0025); // Default to script risk or 0.25% of capital
            setCalcMetrics(prev => ({ ...prev, riskAmount: initialRisk }));
        }
    }, [open, initialSide, script, settings, currentPrice, capital]); // Run when panel opens

    // Live Quantity Updates (Sync with System Metrics)
    useEffect(() => {
        if (open && script?.sharesToBuy) {
            setQuantity(script.sharesToBuy);
        }
    }, [script?.sharesToBuy, open]);

    // Live Price Updates
    useEffect(() => {
        if (open && orderType === 'MARKET') {
            const effectivePrice = currentPrice || script?.ltp || 0;
            if (effectivePrice > 0) {
                setPrice(effectivePrice);
                // Trigger price usually follows LTP for STOP orders? Or fixed?
                // If Market, trigger doesn't matter much unless switching to STOP.
            }
        }
    }, [currentPrice, orderType, open, script]);

    // Update Metrics whenever Quantity, Price, or SL changes
    useEffect(() => {
        if (!price) return;

        const qty = Number(quantity) || 0;
        const ltp = Number(price) || 0;
        const sl = Number(slPrice) || 0;

        const investment = qty * ltp;
        const riskAmount = slEnabled && sl > 0 ? Math.abs(ltp - sl) * qty : 0;

        const effectiveCapital = capital || 100000;

        setCalcMetrics({
            quantity: qty,
            riskAmount: riskAmount.toFixed(2),
            riskPercentage: ((riskAmount / effectiveCapital) * 100).toFixed(2),
            allocation: investment.toFixed(2),
            allocPercent: ((investment / effectiveCapital) * 100).toFixed(2)
        });

    }, [quantity, price, slPrice, slEnabled, capital]);

    // Pre-calculate projections for UI
    const tacticProjections = useMemo(() => {
        const entry = Number(price) || 0;
        const openPrice = Number(lastCandle?.open || script?.currentDayOpen || script?.open || (entry * 0.99));
        const effectiveCapital = capital || 100000;
        const riskPct = settings?.riskOfPortfolio || 0.25;

        // 2% Open
        const sl2Pct = side === 'BUY' ? openPrice * 0.98 : openPrice * 1.02;
        const intent2Pct = calculateAllocationIntent(maxAlloc, effectiveCapital, entry, sl2Pct, riskPct);
        const qty2Pct = forceMaxAlloc ? intent2Pct.sharesAllowedByInvestment : intent2Pct.sharesToBuy;

        // Open Price
        const intentOpen = calculateAllocationIntent(maxAlloc, effectiveCapital, entry, openPrice, riskPct);
        const qtyOpen = forceMaxAlloc ? intentOpen.sharesAllowedByInvestment : intentOpen.sharesToBuy;

        // Fixed Qty (uses current input quantity)
        const currentQty = Number(quantity) || 1;
        const targetRiskAmount = (riskPct / 100) * effectiveCapital;
        const riskPerShare = targetRiskAmount / currentQty;
        const slFixedQty = side === 'BUY' ? entry - riskPerShare : entry + riskPerShare;

        return {
            '2pct_open': { sl: sl2Pct.toFixed(2), qty: qty2Pct },
            'open_price': { sl: openPrice.toFixed(2), qty: qtyOpen },
            'fixed_qty_risk': { sl: slFixedQty.toFixed(2), qty: currentQty }
        };
    }, [price, side, script, capital, settings, quantity, maxAlloc, lastCandle, forceMaxAlloc]);

    // Apply Tactic Logic
    const applyTactic = (selectedTactic, currentQty, currentPriceVal) => {
        const entry = Number(currentPriceVal) || 0;
        const openPrice = Number(lastCandle?.open || script?.currentDayOpen || script?.open || (entry * 0.99)); // Fallback if open price missing
        const effectiveCapital = capital || 100000;
        const riskPct = settings?.riskOfPortfolio || 0.25;

        let newSl = slPrice;
        let newQty = currentQty;

        if (selectedTactic === '2pct_open') {
            setSlEnabled(true);
            newSl = side === 'BUY' ? openPrice * 0.98 : openPrice * 1.02;
            setSlPrice(newSl.toFixed(2));

            const intent = calculateAllocationIntent(maxAlloc, effectiveCapital, entry, newSl, riskPct);
            if (intent.sharesToBuy > 0 || forceMaxAlloc) {
                newQty = forceMaxAlloc ? intent.sharesAllowedByInvestment : intent.sharesToBuy;
            } else {
                newQty = 0; // Explicitly clear if invalid
            }
            setQuantity(newQty);
        } else if (selectedTactic === 'open_price') {
            setSlEnabled(true);
            newSl = openPrice;
            setSlPrice(newSl.toFixed(2));

            const intent = calculateAllocationIntent(maxAlloc, effectiveCapital, entry, newSl, riskPct);
            if (intent.sharesToBuy > 0 || forceMaxAlloc) {
                newQty = forceMaxAlloc ? intent.sharesAllowedByInvestment : intent.sharesToBuy;
            } else {
                newQty = 0; // Explicitly clear if invalid
            }
            setQuantity(newQty);
        } else if (selectedTactic === 'fixed_qty_risk') {
            setSlEnabled(true);
            const qty = Number(currentQty) || 1;
            const targetRiskAmount = (riskPct / 100) * effectiveCapital;
            const riskPerShare = targetRiskAmount / qty;
            newSl = side === 'BUY' ? entry - riskPerShare : entry + riskPerShare;
            if (newSl > 0) setSlPrice(newSl.toFixed(2));
        }

        return { newSl, newQty };
    };

    // React to Tactic Change
    const handleTacticChange = (e) => {
        const newTactic = e.target.value;
        setTactic(newTactic);
        applyTactic(newTactic, quantity, price);
    };

    // NEW HANDLER for SL Change
    const handleSlChange = (newSl) => {
        setSlPrice(newSl);
        setTactic('custom'); // User manually overrode SL
        if (!newSl || !price) return;

        const entry = Number(price);
        const sl = Number(newSl);
        const effectiveCapital = capital || 100000;
        const riskPct = settings?.riskOfPortfolio || 0.25;

        const intent = calculateAllocationIntent(
            maxAlloc,
            effectiveCapital,
            entry,
            sl,
            riskPct
        );

        if (intent.sharesToBuy > 0 || forceMaxAlloc) {
            setQuantity(forceMaxAlloc ? intent.sharesAllowedByInvestment : intent.sharesToBuy);
        }
    };

    // NEW HANDLER for Quantity Change
    const handleQuantityChange = (newQty) => {
        setQuantity(newQty);

        // If not fixed_qty_risk, switch to custom.
        if (tactic !== 'fixed_qty_risk') {
            setTactic('custom');
        }

        const qty = Number(newQty);
        if (qty > 0 && price) {
            const entry = Number(price);
            const effectiveCapital = capital || 100000;
            const riskPct = settings?.riskOfPortfolio || 0.25;

            // Auto-update SL ONLY if we want static risk (fixed_qty_risk)
            if (tactic === 'fixed_qty_risk' || tactic === 'custom') { // Wait, if custom, do they want auto-SL on Qty change? No. The user said 'Another one is for high priced stocks where i will buy static quantities... it will automatically adjust the sl price'. So ONLY fixed_qty_risk should do this.
                if (tactic === 'fixed_qty_risk') {
                    const targetRiskAmount = (riskPct / 100) * effectiveCapital;
                    const riskPerShare = targetRiskAmount / qty;
                    const calculatedSl = side === 'BUY' ? entry - riskPerShare : entry + riskPerShare;
                    if (calculatedSl > 0) {
                        setSlPrice(calculatedSl.toFixed(2));
                    }
                }
            }
        }
    };

    // Re-apply tactic if side or price changes (for auto-tactics)
    useEffect(() => {
        if (!open) return;
        if (tactic === 'fixed_qty_risk') {
            applyTactic('fixed_qty_risk', quantity, price);
        } else if (tactic === '2pct_open' || tactic === 'open_price') {
            applyTactic(tactic, quantity, price);
        } else if (tactic === 'custom' && slPrice) {
            const entry = Number(price) || 0;
            const sl = Number(slPrice);
            const effectiveCapital = capital || 100000;
            const riskPct = settings?.riskOfPortfolio || 0.25;

            const intent = calculateAllocationIntent(maxAlloc, effectiveCapital, entry, sl, riskPct);
            if (intent.sharesToBuy > 0 || forceMaxAlloc) {
                setQuantity(forceMaxAlloc ? intent.sharesAllowedByInvestment : intent.sharesToBuy);
            }
        }
    }, [side, price, tactic, maxAlloc, lastCandle, forceMaxAlloc, slPrice]);

    // Replaces the direct setSlPrice in render

    // NOTE: Removed local calculation of Risk/Allocation to rely on central metrics (script prop)
    // The Footer now displays the System Calculated metrics (based on sharesToBuy/lossInMoney)
    // This ensures consistency with the Redux/Watchlist data.

    useEffect(() => {
        if (tpEnabled) {
            const effectiveCurrentPrice = currentPrice || 0;
            const entryPrice = orderType === 'MARKET' ? effectiveCurrentPrice : Number(price);
            const qty = Number(quantity);
            const rewardPerShare = side === 'BUY' ? tpPrice - entryPrice : entryPrice - tpPrice;
            const totalReward = rewardPerShare * qty;
            setRewardAmount(totalReward > 0 ? totalReward : 0);
        } else {
            setRewardAmount(0);
        }

    }, [side, orderType, quantity, price, tpEnabled, tpPrice, currentPrice]);

    // Calculate RR Ratio based on System Risk (lossInMoney) vs Calculated Reward
    useEffect(() => {
        const sysRisk = script?.lossInMoney || 0;
        if (sysRisk > 0 && rewardAmount > 0) {
            setRrRatio((rewardAmount / sysRisk).toFixed(2));
        } else {
            setRrRatio(0);
        }
    }, [script?.lossInMoney, rewardAmount]);


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
                sl: slEnabled ? slPrice : 0,
                risk: script?.lossInMoney || 0 // Use System Risk for consistency
            }));

            setSnackbarMessage(`PAPER TRADE EXECUTED: ${side} ${quantity} ${script?.tradingSymbol || 'Stock'}`);
            setSnackbarOpen(true);

            setTimeout(() => {
                onClose();
            }, 1500);
            return;
        }

        // PROD Order Logic
        const upstoxToken = 'Bearer ' + token;
        const appToken = localStorage.getItem('token');

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
                    Authorization: `Bearer ${appToken}`,
                    'Upstox-Token': upstoxToken,
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
                sx: { width: 500, bgcolor: '#fff', color: '#131722' }
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e0e3eb' }}>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>{script?.scriptName || 'SYMBOL'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                        {script?.symbol} • <span style={{ color: themeColor, fontWeight: 600 }}>{Number(currentPrice || script?.ltp || lastCandle?.close || 0).toFixed(2)}</span>
                    </Typography>
                    {lastCandle && (
                        <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: '#787b86', fontWeight: 500 }}>
                            O: {lastCandle.open} H: {lastCandle.high} L: {lastCandle.low} C: {lastCandle.close}
                        </Typography>
                    )}
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
                            color: "#000 !important",
                        },

                        // indicator color
                        "& .MuiTabs-indicator": {
                            backgroundColor: "#000 !important",
                        }
                    }}
                >
                    <Tab label="Market" value="MARKET" />
                    <Tab label="Limit" value="LIMIT" />
                    <Tab label="Stop" value="STOP" />
                </Tabs>

                {/* Entry Tactics */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#787b86' }}>ENTRY TACTIC</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                <Typography variant="caption" sx={{ color: '#787b86', lineHeight: 1.2 }}>Max Alloc %</Typography>
                                <Typography sx={{ color: '#b2b5be', fontSize: '0.65rem', lineHeight: 1 }}>
                                    (₹{formatShortAmount((maxAlloc / 100) * (capital || 100000))})
                                </Typography>
                            </Box>
                            <TextField
                                type="number"
                                value={maxAlloc}
                                onChange={(e) => setMaxAlloc(Number(e.target.value) || 0)}
                                size="small"
                                sx={{ width: 60 }}
                                InputProps={{
                                    style: { fontSize: '0.75rem', padding: 0, height: 24 },
                                    sx: { '& input': { py: 0, px: 1, textAlign: 'center' } }
                                }}
                            />
                            <Tooltip title="Ignore risk limit and force maximum allocation">
                                <Checkbox 
                                    size="small" 
                                    checked={forceMaxAlloc} 
                                    onChange={(e) => setForceMaxAlloc(e.target.checked)} 
                                    sx={{ p: 0, '& .MuiSvgIcon-root': { fontSize: 18 } }} 
                                />
                            </Tooltip>
                        </Box>
                    </Box>
                    <ToggleButtonGroup
                        value={tactic}
                        exclusive
                        onChange={(e, val) => { if (val) handleTacticChange({ target: { value: val } }) }}
                        fullWidth
                        size="small"
                        sx={{
                            display: 'flex',
                            gap: 0.5,
                            "& .MuiToggleButtonGroup-grouped": {
                                border: '1px solid #e0e3eb !important',
                                borderRadius: '4px !important',
                                textTransform: 'none',
                                flex: 1,
                                py: 0.75,
                                px: 0.5,
                                fontSize: '0.75rem',
                                lineHeight: 1.2,
                                color: '#787b86',
                                "&.Mui-selected": {
                                    bgcolor: '#f0f3fa',
                                    color: '#1976d2',
                                    borderColor: '#1976d2 !important',
                                    fontWeight: 600,
                                    zIndex: 1
                                },
                                "&:hover": {
                                    bgcolor: '#f9fafb'
                                }
                            }
                        }}
                    >
                        <ToggleButton value="custom" sx={{ flexDirection: 'column', gap: 0.25, justifyContent: 'center' }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'inherit', textTransform: 'none' }}>Manual Custom</Typography>
                        </ToggleButton>
                        <ToggleButton value="2pct_open" sx={{ flexDirection: 'column', gap: 0.25 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'inherit', textTransform: 'none' }}>2% Open Risk</Typography>
                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'none' }}>SL: {tacticProjections['2pct_open'].sl}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'none' }}>Qty: {tacticProjections['2pct_open'].qty}</Typography>
                        </ToggleButton>
                        <ToggleButton value="open_price" sx={{ flexDirection: 'column', gap: 0.25 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'inherit', textTransform: 'none' }}>Open Price SL</Typography>
                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'none' }}>SL: {tacticProjections['open_price'].sl}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'none' }}>Qty: {tacticProjections['open_price'].qty}</Typography>
                        </ToggleButton>
                        <ToggleButton value="fixed_qty_risk" sx={{ flexDirection: 'column', gap: 0.25 }}>
                            <Typography sx={{ fontSize: '0.75rem', fontWeight: 'inherit', textTransform: 'none' }}>Fixed Qty Risk</Typography>
                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'none' }}>SL: {tacticProjections['fixed_qty_risk'].sl}</Typography>
                            <Typography sx={{ fontSize: '0.65rem', opacity: 0.8, textTransform: 'none' }}>Qty: {tacticProjections['fixed_qty_risk'].qty}</Typography>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>

                {/* Inputs */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <TextField
                                label="Shares"
                                type="number"
                                value={quantity}
                                onChange={(e) => handleQuantityChange(e.target.value)}
                                size="small"
                                fullWidth
                                {...commonInputProps}
                            />
                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                {[25, 50, 75, 100, 200].map(qty => (
                                    <Typography
                                        key={qty}
                                        variant="caption"
                                        sx={{ cursor: 'pointer', color: '#1976d2', '&:hover': { textDecoration: 'underline' } }}
                                        onClick={() => handleQuantityChange(qty)}
                                    >
                                        {qty}
                                    </Typography>
                                ))}
                            </Box>
                        </Box>
                        {orderType !== 'MARKET' && (
                            <Box sx={{ flex: 1 }}>
                                <TextField
                                    label="Price"
                                    type="number"
                                    value={Number(currentPrice || script?.ltp || 0).toFixed(2)}
                                    onChange={(e) => setPrice(e.target.value)}
                                    size="small"
                                    fullWidth
                                    {...commonInputProps}
                                />
                            </Box>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: '80px', textAlign: 'right' }}>
                            ₹{((Number(quantity) || 0) * (orderType === 'MARKET' ? (currentPrice || script?.ltp || lastCandle?.close || 0) : (Number(price) || 0))).toFixed(2)}
                        </Typography>
                    </Box>

                    {orderType === 'STOP' && (
                        <TextField
                            label="Trigger Price"
                            type="number"
                            value={triggerPrice}
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
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                                <TextField
                                    size="small"
                                    fullWidth
                                    type="number"
                                    value={slPrice}
                                    onChange={(e) => handleSlChange(e.target.value)}
                                    disabled={!slEnabled}
                                    error={slEnabled && Number(slPrice) >= Number(price)}
                                    {...commonInputProps}
                                    sx={{
                                        ...commonInputProps.sx,
                                        opacity: slEnabled ? 1 : 0.5,
                                    }}
                                />
                            </Box>
                            {slEnabled && Number(slPrice) >= Number(price) && (
                                <Typography variant="caption" color="error" sx={{ ml: '100px', lineHeight: 1.2 }}>
                                    Stop Loss must be below the Entry Price.
                                </Typography>
                            )}
                        </Box>


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
                <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Quantity</Typography>
                        <Typography variant="caption" fontWeight={600}>{quantity}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Allocation</Typography>
                        <Typography variant="caption" fontWeight={600}>₹{formatShortAmount(calcMetrics.allocation)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Alloc %</Typography>
                        <Typography variant="caption" fontWeight={600}>{calcMetrics.allocPercent}%</Typography>
                    </Box>
                    {slEnabled && (
                        <>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Typography variant="caption" color="text.secondary">SL Price</Typography>
                                <Typography variant="caption" fontWeight={600}>₹{Number(slPrice).toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}>
                                <Typography variant="caption" color="inherit">Risk Amount</Typography>
                                <Typography variant="caption" fontWeight={600}>₹{calcMetrics.riskAmount}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', color: '#d32f2f' }}>
                                <Typography variant="caption" color="inherit">Risk %</Typography>
                                <Typography variant="caption" fontWeight={600}>{calcMetrics.riskPercentage}%</Typography>
                            </Box>
                        </>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="caption" color="text.secondary">Total Capital</Typography>
                        <Typography variant="caption" fontWeight={600}>₹{formatShortAmount(capital || 100000)}</Typography>
                    </Box>
                </Box>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={handlePlaceOrder}
                    disabled={Number(quantity) <= 0 || (slEnabled && Number(slPrice) >= Number(price))}
                    sx={{
                        bgcolor: themeColor,
                        '&:hover': { bgcolor: '#333' },
                        color: '#fff',
                        fontWeight: 600,
                        py: 1.2,
                        textTransform: 'none',
                        fontSize: '1rem',
                        '&.Mui-disabled': {
                            bgcolor: '#e0e0e0',
                            color: '#9e9e9e'
                        }
                    }}
                >
                    {Number(quantity) <= 0 ? 'Invalid Quantity' :
                        (slEnabled && Number(slPrice) >= Number(price)) ? 'Invalid Stop Loss' :
                            `${side === 'BUY' ? 'Buy' : 'Sell'} ${script?.symbol || ''}`}
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
