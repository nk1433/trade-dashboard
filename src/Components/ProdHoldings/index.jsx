import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Typography,
    Box,
    CircularProgress
} from '@mui/material';
import { fetchHoldings } from '../../Store/upstoxs';

const ProdHoldings = () => {
    const dispatch = useDispatch();
    const { holdings = [], loading, error } = useSelector((state) => state.orders);

    useEffect(() => {
        dispatch(fetchHoldings());
    }, [dispatch]);

    // Calculate totals
    const totalInvestment = holdings.reduce((acc, curr) => acc + (curr.average_price * curr.quantity), 0);
    const currentValue = holdings.reduce((acc, curr) => acc + (curr.last_price * curr.quantity), 0);
    const totalPL = currentValue - totalInvestment;
    const totalPLPercentage = totalInvestment > 0 ? (totalPL / totalInvestment) * 100 : 0;

    if (loading) {
        return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
    }

    if (error) {
        return <Typography color="error">Error fetching holdings: {error}</Typography>;
    }

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <Box sx={{ p: 2, display: 'flex', gap: 4, bgcolor: '#f5f5f5', borderRadius: 1, mb: 2 }}>
                <Box>
                    <Typography variant="caption" color="textSecondary">Invested</Typography>
                    <Typography variant="h6">₹{totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="textSecondary">Current Value</Typography>
                    <Typography variant="h6">₹{currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</Typography>
                </Box>
                <Box>
                    <Typography variant="caption" color="textSecondary">P&L</Typography>
                    <Typography variant="h6" color={totalPL >= 0 ? 'success.main' : 'error.main'}>
                        ₹{totalPL.toLocaleString('en-IN', { maximumFractionDigits: 2 })} ({totalPLPercentage.toFixed(2)}%)
                    </Typography>
                </Box>
            </Box>

            <TableContainer component={Paper} sx={{ maxHeight: 440 }}>
                <Table stickyHeader aria-label="holdings table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Instrument</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Avg. Price</TableCell>
                            <TableCell align="right">LTP</TableCell>
                            <TableCell align="right">Cur. Val</TableCell>
                            <TableCell align="right">P&L</TableCell>
                            <TableCell align="right">Net Chg %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.map((holding) => {
                            const investment = holding.average_price * holding.quantity;
                            const currentVal = holding.last_price * holding.quantity;
                            const pl = currentVal - investment;
                            const plPercentage = (pl / investment) * 100;

                            return (
                                <TableRow key={holding.instrument_token} hover>
                                    <TableCell component="th" scope="row">
                                        {holding.trading_symbol}
                                        <Typography variant="caption" display="block" color="textSecondary">
                                            {holding.exchange}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">{holding.quantity}</TableCell>
                                    <TableCell align="right">₹{holding.average_price.toFixed(2)}</TableCell>
                                    <TableCell align="right">₹{holding.last_price.toFixed(2)}</TableCell>
                                    <TableCell align="right">₹{currentVal.toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ color: pl >= 0 ? 'success.main' : 'error.main' }}>
                                        ₹{pl.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: pl >= 0 ? 'success.main' : 'error.main' }}>
                                        {plPercentage.toFixed(2)}%
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default ProdHoldings;
