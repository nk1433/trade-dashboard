import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
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

    const holidays = useSelector((state) => state.marketStatus.holidays);

    const scanTypes = [
        { value: 'all', label: 'All Scans' },
        { value: 'newHigh', label: 'New High' },
        { value: 'dollarBO', label: 'Dollar BO' },
        { value: 'dollarBD', label: 'Dollar BD' },
        { value: '4PercentBO', label: '4% Breakout' },
        { value: '4PercentBD', label: '4% Breakdown' },
        { value: 'sltbBO', label: 'SLTB Breakout' },
        { value: 'sltbBD', label: 'SLTB Breakdown' }
    ];

    const getLastWorkingDay = (dateStr, holidaysData) => {
        let currentDate = moment(dateStr);
        
        const isHoliday = (dStr) => holidaysData?.some(h => {
            if (h.date === dStr) {
                const isNSEClosed = h.closed_exchanges.includes('NSE');
                const isNSEOpenSpecial = h.open_exchanges.some(e => e.exchange === 'NSE');
                return isNSEClosed && !isNSEOpenSpecial;
            }
            return false;
        });

        let attempts = 0;
        while (attempts < 15) { // Check up to 15 days back
            const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
            const currentStr = currentDate.format('YYYY-MM-DD');
            if (!isWeekend && !isHoliday(currentStr)) {
                return currentStr;
            }
            currentDate.subtract(1, 'days');
            attempts++;
        }
        return currentDate.format('YYYY-MM-DD');
    };

    const fetchScans = async () => {
        const validDate = getLastWorkingDay(selectedDate, holidays);
        
        if (validDate !== selectedDate) {
            console.log(`Date ${selectedDate} is a weekend/holiday. Falling back to ${validDate}`);
            setSelectedDate(validDate); // Update UI state; useEffect will handle re-fetching
            return;
        }

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
    }, [selectedDate, scanType, holidays]);

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
        { field: 'symbol', headerName: 'Instrument Key', flex: 1, minWidth: 150 },
        {
            field: 'tradingSymbol',
            headerName: 'Symbol',
            flex: 1,
            minWidth: 150,
            renderCell: (params) => (
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {params.value}
                </Typography>
            )
        },
        {
            field: 'scanType',
            headerName: 'Scan Type',
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                switch (params.value) {
                    case 'dollarBO':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> $
                            </Box>
                        );
                    case 'dollarBD':
                        return (
                            <Box sx={{ color: '#ef5350', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowDownward fontSize="small" /> $
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
                    case 'sltbBO':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> SLTB
                            </Box>
                        );
                    case 'sltbBD':
                        return (
                            <Box sx={{ color: '#ef5350', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowDownward fontSize="small" /> SLTB
                            </Box>
                        );
                    default:
                        return params.value;
                }
            }
        },
        {
            field: 'currentPrice',
            headerName: 'Price',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => {
                const ed = params.row?.extraData;
                const val = ed?.currentPrice || ed?.close || ed?.currentClose || ed?.newHigh;
                if (!val) return '-';
                return `₹${Number(val).toFixed(2)}`;
            }
        },
        {
            field: 'pctChange',
            headerName: '% Change',
            flex: 1,
            minWidth: 100,
            renderCell: (params) => {
                const val = params.row?.extraData?.pctChange;
                if (val === undefined || val === null) return '-';
                const isPositive = val >= 0;
                return (
                    <Box sx={{ color: isPositive ? '#26a69a' : '#ef5350', fontWeight: 'bold' }}>
                        {isPositive ? '+' : ''}{Number(val).toFixed(2)}%
                    </Box>
                );
            }
        },
        {
            field: 'date',
            headerName: 'Date',
            flex: 1,
            minWidth: 100,
            valueFormatter: (params) => params?.value || params
        },
        {
            field: 'createdAt',
            headerName: 'Time',
            flex: 1,
            minWidth: 100,
            valueFormatter: (value) => {
                const actualValue = value?.value !== undefined ? value.value : value;
                if (!actualValue) return '';
                return moment(actualValue).format('h:mm a');
            }
        },
    ];

    const scanTypeCounts = scans.reduce((acc, scan) => {
        acc[scan.scanType] = (acc[scan.scanType] || 0) + 1;
        return acc;
    }, {});

    const getScanLabel = (val) => scanTypes.find(t => t.value === val)?.label || val;

    const renderFilterButton = (value, label, count) => {
        const isActive = scanType === value;
        return (
            <button
                key={value}
                onClick={() => setScanType(value)}
                style={{
                    appearance: 'none',
                    background: isActive ? 'black' : 'transparent',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    border: isActive ? '1px solid black' : '1px solid transparent',
                    borderRadius: '9999px',
                    padding: '0.25rem 0.75rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem'
                }}
                onMouseEnter={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                }}
            >
                {label}
                {count !== undefined && (
                    <span style={{
                        fontSize: '0.75rem',
                        opacity: isActive ? 0.8 : 0.6,
                        backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--bg-secondary)',
                        padding: '0 4px',
                        borderRadius: '4px',
                        minWidth: '16px',
                        textAlign: 'center'
                    }}>
                        {count}
                    </span>
                )}
            </button>
        );
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: { xs: 2, md: 3 }, alignItems: 'center', bgcolor: 'var(--bg-secondary)' }}>
            <Box sx={{ width: '100%', maxWidth: 1200, display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                {/* Header Controls Area */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mr: 1 }}>Market Scans</Typography>
                        
                        {renderFilterButton('all', 'All', scanCount)}
                        
                        {Object.entries(scanTypeCounts).map(([type, count]) => (
                            renderFilterButton(type, getScanLabel(type), count)
                        ))}
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
