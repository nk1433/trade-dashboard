import React from 'react';
import { useSelector } from 'react-redux';
import { Box, Typography, Paper, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { formatToIndianUnits } from '../../utils/index';

const PaperHoldings = () => {
    const { capital, holdings } = useSelector((state) => state.paperTrade);

    const totalInvested = holdings.reduce((acc, curr) => acc + curr.invested, 0);
    const totalCurrentValue = holdings.reduce((acc, curr) => acc + curr.currentValue, 0);
    const totalPnL = totalCurrentValue - totalInvested;
    const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
    const isProfit = totalPnL >= 0;

    const rows = holdings.map((item) => ({
        id: item.symbol,
        ...item,
        risk: item.sl ? (item.avgPrice - item.sl) * item.quantity : null,
        alloc: (item.invested / (capital + totalInvested)) * 100
    }));

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
            field: 'ltp',
            headerName: 'Market Price',
            flex: 1,
            minWidth: 100,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ₹{params.value.toFixed(2)}
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
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {formatToIndianUnits(params.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        ({params.row.pnlPercentage.toFixed(2)}%)
                    </Typography>
                </Box>
            ),
        },
        {
            field: 'currentValue',
            headerName: 'Current / Alloc',
            flex: 1.2,
            minWidth: 120,
            type: 'number',
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        ₹{formatToIndianUnits(params.value)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {params.row.alloc.toFixed(1)}% Alloc
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
            align: 'right',
            headerAlign: 'right',
            renderCell: (params) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', height: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {params.value !== null ? `₹${formatToIndianUnits(params.value)}` : '-'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        Risk
                    </Typography>
                </Box>
            ),
        },
    ];

    return (
        <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#fff', color: '#000' }}>

            {/* Header & Capital Pill */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexShrink: 0 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
                    Holdings ({holdings.length})
                </Typography>
                <Chip
                    label={`Available: ₹${formatToIndianUnits(capital)}`}
                    variant="outlined"
                    sx={{ borderColor: '#e0e0e0', fontWeight: 500 }}
                />
            </Box>

            {/* Summary Card */}
            <Paper
                elevation={0}
                sx={{
                    p: 1,
                    mb: 1,
                    border: '1px solid #e0e0e0',
                    borderRadius: 3,
                    bgcolor: '#fafafa',
                    flexShrink: 0
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                            Current value
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 250, letterSpacing: '-0.5px' }}>
                            ₹{formatToIndianUnits(totalCurrentValue)}
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 6, mt: 3 }}>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Invested value
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 400 }}>
                            ₹{formatToIndianUnits(totalInvested)}
                        </Typography>
                    </Box>
                    <Box>
                        <Typography variant="body2" color="text.secondary">
                            Total returns
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="h6" sx={{ fontWeight: 400, color: isProfit ? '#00b386' : '#eb5b3c' }}>
                                {isProfit ? '+' : ''}₹{formatToIndianUnits(totalPnL)} ({totalPnLPercentage.toFixed(2)}%)
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Paper>

            {/* DataGrid */}
            <Box sx={{ flexGrow: 1, width: '100%', overflow: 'hidden' }}>
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
            </Box>
        </Box>
    );
};

export default PaperHoldings;
