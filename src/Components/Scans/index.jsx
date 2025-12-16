import React, { useState, useEffect } from 'react';
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Button, Typography, Paper, Chip } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { ArrowUpward, ArrowDownward, TrendingUp } from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import { BACKEND_URL } from '../../utils/config';
import { commonInputProps, commonSelectSx, commonInputLabelSx } from '../../utils/themeStyles';

const Scans = () => {
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [scanType, setScanType] = useState('all');
    const [scans, setScans] = useState([]);
    const [scanCount, setScanCount] = useState(0);
    const [loading, setLoading] = useState(false);

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
                // Add unique ID for DataGrid if not present
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

    const columns = [
        { field: 'symbol', headerName: 'Instrument Key', width: 180 },
        { field: 'tradingSymbol', headerName: 'Symbol', width: 150 },
        {
            field: 'scanType',
            headerName: 'Scan Type',
            width: 150,
            renderCell: (params) => {
                switch (params.value) {
                    case 'dollarBO':
                        return (
                            <Box sx={{ color: 'green', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
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
                            <Box sx={{ color: 'green', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> 4%
                            </Box>
                        );
                    case '4PercentBD':
                        return (
                            <Box sx={{ color: 'red', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
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
            valueFormatter: (params) => moment(params.value).format('DD-MM-YYYY')
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
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, alignItems: 'center' }}>
            <Box sx={{ width: '100%', maxWidth: 1200 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>Scans</Typography>
                    <Chip
                        label={`Count: ${scanCount}`}
                        variant="outlined"
                        size="small"
                        sx={{
                            borderColor: 'black',
                            color: 'black',
                            fontWeight: 600
                        }}
                    />
                </Box>

                <Box sx={{ display: 'flex', gap: 3, mb: 3, alignItems: 'center' }}>
                    <TextField
                        label="Date"
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        InputLabelProps={{
                            shrink: true,
                        }}
                        inputProps={{
                            max: moment().format('YYYY-MM-DD')
                        }}
                        size="small"
                        sx={{ width: 250, bgcolor: 'white' }}
                        {...commonInputProps}
                    />

                    <FormControl size="small" sx={{ width: 250, bgcolor: 'white' }}>
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
                        variant="contained"
                        onClick={fetchScans}
                        disabled={loading}
                        size="medium"
                        sx={{
                            bgcolor: 'black',
                            color: 'white',
                            height: 40, // Match default small input height
                            px: 3,
                            minWidth: 120,
                            '&:hover': {
                                bgcolor: '#333',
                            }
                        }}
                    >
                        Refresh
                    </Button>
                </Box>

                <Box sx={{ bgcolor: 'white', width: '100%' }}>
                    <DataGrid
                        rows={scans}
                        columns={columns}
                        loading={loading}
                        pageSizeOptions={[10, 25, 50]}
                        initialState={{
                            pagination: { paginationModel: { pageSize: 25 } },
                        }}
                        density="compact"
                        autoHeight
                        sx={{
                            border: 'none',
                            '& .MuiDataGrid-cell': {
                                borderColor: 'var(--border-color)',
                            },
                            '& .MuiDataGrid-columnHeaders': {
                                backgroundColor: 'var(--bg-secondary)',
                                borderBottom: '1px solid var(--border-color)',
                                fontWeight: 600,
                            }
                        }}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default Scans;
