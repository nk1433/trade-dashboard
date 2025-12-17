import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { formatToIndianUnits } from '../../utils/index';

const PaperHoldings = () => {
    const { capital, holdings } = useSelector((state) => state.paperTrade);

    const totalInvested = holdings.reduce((acc, curr) => acc + curr.invested, 0);
    const totalCurrentValue = holdings.reduce((acc, curr) => acc + curr.currentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

    return (
        <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
            <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 4, bgcolor: 'var(--bg-secondary)' }}>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">Availableeee Capital</Typography>
                    <Typography variant="h6">₹{formatToIndianUnits(capital)}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">Invested</Typography>
                    <Typography variant="h6">₹{formatToIndianUnits(totalInvested)}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">Current Value</Typography>
                    <Typography variant="h6">₹{formatToIndianUnits(totalCurrentValue)}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="text.secondary">Total P&L</Typography>
                    <Typography variant="h6" color={totalPnL >= 0 ? 'success.main' : 'error.main'}>
                        ₹{formatToIndianUnits(totalPnL)} ({totalPnLPercentage.toFixed(2)}%)
                    </Typography>
                </Box>
            </Paper>

            <TableContainer component={Paper} sx={{ bgcolor: 'var(--bg-secondary)' }}>
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Symbol</TableCell>
                            <TableCell align="right">Qty</TableCell>
                            <TableCell align="right">Avg Price</TableCell>
                            <TableCell align="right">LTP</TableCell>
                            <TableCell align="right">Invested</TableCell>
                            <TableCell align="right">Current</TableCell>
                            <TableCell align="right">P&L</TableCell>
                            <TableCell align="right">Net Chg %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {holdings.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} align="center">No holdings yet</TableCell>
                            </TableRow>
                        ) : (
                            holdings.map((row) => (
                                <TableRow key={row.symbol}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                                        {row.symbol}
                                    </TableCell>
                                    <TableCell align="right">{row.quantity}</TableCell>
                                    <TableCell align="right">{row.avgPrice.toFixed(2)}</TableCell>
                                    <TableCell align="right">{row.ltp.toFixed(2)}</TableCell>
                                    <TableCell align="right">{formatToIndianUnits(row.invested)}</TableCell>
                                    <TableCell align="right">{formatToIndianUnits(row.currentValue)}</TableCell>
                                    <TableCell align="right" sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}>
                                        {formatToIndianUnits(row.pnl)}
                                    </TableCell>
                                    <TableCell align="right" sx={{ color: row.pnl >= 0 ? 'success.main' : 'error.main' }}>
                                        {row.pnlPercentage.toFixed(2)}%
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default PaperHoldings;
