import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Button, Typography, Paper, Chip, Snackbar, Alert } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ArrowUpward, ArrowDownward, TrendingUp, ContentCopy } from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import { BACKEND_URL } from '../../utils/config';
import { commonInputProps, commonSelectSx, commonInputLabelSx } from '../../utils/themeStyles';
import FlagMenu from '../Watchlist/FlagMenu';
import { useWatchlistFilter } from '../../hooks/useWatchlistFilter';

const Scans = () => {
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [scanType, setScanType] = useState('all');
    const [scans, setScans] = useState([]);
    const [scanCount, setScanCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Import watchlist filter to manage flags
    const { flaggedStocks, toggleFlag } = useWatchlistFilter();

    const scanTypes = [
        { value: 'all', label: 'All Scans' },
        { value: 'newHigh', label: 'New High' },
        { value: 'dollarBO', label: 'Dollar BO' },
        { value: '4PercentBO', label: '4% Breakout' },
        { value: '4PercentBD', label: '4% Breakdown' }
    ];

    const fetchScans = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${BACKEND_URL}/api/scans`, {
                params: {
                    date: selectedDate,
                    scanType: scanType === 'all' ? undefined : scanType
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                const rows = response.data.data.map((item, index) => ({
                    id: item._id || index,
                    ...item
                }));
                setScans(rows);
                setScanCount(response.data.meta?.count || 0);
            } else {
                setScans([]);
                setScanCount(0);
            }
        } catch (error) {
            console.error("Error fetching scans:", error);
            setScans([]);
            setScanCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScans();
    }, [selectedDate, scanType]);

    const handleCopySymbols = () => {
        if (scans.length === 0) return;
        const symbols = scans.map(scan => scan.tradingSymbol).join(',');
        navigator?.clipboard?.writeText(symbols)
            .then(() => {
                setSnackbarMessage(`Copied ${scans.length} symbols to clipboard!`);
                setSnackbarOpen(true);
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                setSnackbarMessage('Failed to copy symbols.');
                setSnackbarOpen(true);
            });
    };

    const columns = [
        {
            field: "flag",
            headerName: "",
            width: 50,
            renderCell: (params) => {
                const symbol = params.row.tradingSymbol; // Use tradingSymbol for flag mapping
                const currentFlag = flaggedStocks[symbol] || null;

                const handleFlagChange = (color) => {
                    toggleFlag(symbol, color);
                };

                return (
                    <Box onClick={(e) => e.stopPropagation()}>
                        <FlagMenu
                            currentFlag={currentFlag}
                            onFlagChange={handleFlagChange}
                        />
                    </Box>
                );
            }
        },
        { field: 'symbol', headerName: 'Instrument Key', width: 180 },
        {
            field: 'tradingSymbol',
            headerName: 'Symbol',
            width: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'scanType',
            headerName: 'Scan Type',
            width: 150,
            renderCell: (params) => {
                switch (params.value) {
                    case 'dollarBO':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> $
                            </Box>
                        );
                    case 'newHigh':
                        return (
                            <Box sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <TrendingUp fontSize="small" /> New High
                            </Box>
                        );
                    case '4PercentBO':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> 4%
                            </Box>
                        );
                    case '4PercentBD':
                        return (
                            <Box sx={{ color: '#ef5350', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowDownward fontSize="small" /> 4%
                            </Box>
                        );
                    default:
                        return params.value;
                }
            }
        },
        {
            field: 'date',
            headerName: 'Date',
            width: 120,
            valueFormatter: (params) => params.value
        },
        {
            field: 'createdAt',
            headerName: 'Time',
            width: 120,
            valueFormatter: (value) => {
                if (!value) return '';
                return moment(value).format('h:mm a');
            }
        },
    ];

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 }, alignItems: 'center', bgcolor: 'var(--bg-secondary)' }}>
            <Box sx={{ width: '100%', maxWidth: 1200, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Header Controls Area */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>Market Scans</Typography>
                        <Chip
                            label={`Count: ${scanCount}`}
                            size="small"
                            sx={{
                                bgcolor: 'rgba(0,0,0,0.05)',
                                color: 'text.primary',
                                fontWeight: 600,
                                borderRadius: 1.5
                            }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <TextField
                            label="Date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ max: moment().format('YYYY-MM-DD') }}
                            size="small"
                            sx={{ width: 180, bgcolor: 'var(--bg-primary)', ...commonInputProps }}
                        />

                        <FormControl size="small" sx={{ width: 180, bgcolor: 'var(--bg-primary)' }}>
                            <InputLabel sx={commonInputLabelSx}>Scan Type</InputLabel>
                            <Select
                                value={scanType}
                                label="Scan Type"
                                onChange={(e) => setScanType(e.target.value)}
                                sx={commonSelectSx}
                            >
                                {scanTypes.map((type) => (
                                    <MenuItem key={type.value} value={type.value}>
                                        {type.label}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            onClick={handleCopySymbols}
                            disabled={loading || scans.length === 0}
                            startIcon={<ContentCopy />}
                            sx={{
                                height: 40,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                borderColor: 'var(--border-color)',
                                color: 'text.primary',
                                '&:hover': {
                                    borderColor: 'primary.main',
                                    bgcolor: 'rgba(25, 118, 210, 0.04)'
                                }
                            }}
                        >
                            Copy
                        </Button>

                        <Button
                            variant="contained"
                            onClick={fetchScans}
                            disabled={loading}
                            sx={{
                                bgcolor: '#000',
                                color: '#fff',
                                height: 40,
                                px: 3,
                                textTransform: 'none',
                                fontWeight: 600,
                                borderRadius: 1.5,
                                '&:hover': { bgcolor: '#333' },
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            Refresh
                        </Button>
                    </Box>
                </Box>

                {/* Table Area */}
                <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <DataGrid
                        rows={scans}
                        columns={columns}
                        loading={loading}
                        pageSizeOptions={[10, 25, 50, 100]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        density="standard"
                        sx={{
                            flex: 1,
                            border: 'none',
                            fontSize: '0.85rem',
                            '& .MuiDataGrid-cell': {
                                borderColor: 'var(--border-color)',
                                py: 1,
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border-color)',
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                fontSize: '0.75rem',
                                letterSpacing: '0.05em',
                                color: 'var(--text-secondary)'
                            },
                            '& .MuiDataGrid-row:hover': {
                                backgroundColor: 'rgba(0,0,0,0.02)',
                            }
                        }}
                    />
                </Paper>
            </Box>

            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default Scans;
