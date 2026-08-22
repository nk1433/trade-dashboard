import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Box, TextField, MenuItem, Select, FormControl, InputLabel, Button, Typography, Paper, Chip, Snackbar, Alert, Popover, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import dayjs from 'dayjs';
import { DataGrid } from '@mui/x-data-grid';
import { ArrowUpward, ArrowDownward, TrendingUp, ContentCopy, Autorenew } from '@mui/icons-material';
import axios from 'axios';
import moment from 'moment';
import { BACKEND_URL } from '../../utils/config';
import { commonInputProps, commonSelectSx, commonInputLabelSx } from '../../utils/themeStyles';
import FlagMenu from '../Watchlist/FlagMenu';
import { useWatchlistFilter } from '../../hooks/useWatchlistFilter';
import ScansTVChart from './ScansTVChart';
import PerformanceDashboard from './PerformanceDashboard';
import universe from '../../index/universe.json';

const Scans = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [selectedDate, setSelectedDate] = useState(moment().format('YYYY-MM-DD'));
    const [anchorEl, setAnchorEl] = useState(null);
    const [startTime, setStartTime] = useState(null);
    const [endTime, setEndTime] = useState(null);
    const [scanType, setScanType] = useState('all');
    const [viewType, setViewType] = useState('table');
    const [timeframe, setTimeframe] = useState(15);
    const [scans, setScans] = useState([]);
    const [scanCount, setScanCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    // Import watchlist filter to manage flags
    const { flaggedStocks, toggleFlag, customLists, createCustomList, addSymbolsToWatchlist } = useWatchlistFilter();

    // Dialog state for adding symbols to watchlist
    const [wlDialogOpen, setWlDialogOpen] = useState(false);
    const [wlSelectedList, setWlSelectedList] = useState('red');
    const [wlNewListName, setWlNewListName] = useState('');
    const [wlSymbolsToAdd, setWlSymbolsToAdd] = useState([]);

    const handleOpenAddWl = (symbols) => {
        const uniqueSyms = [...new Set(symbols)];
        setWlSymbolsToAdd(uniqueSyms);
        setWlNewListName('');
        setWlSelectedList('red');
        setWlDialogOpen(true);
    };

    const handleAddWlSubmit = () => {
        let targetList = wlSelectedList;
        if (wlSelectedList === '__NEW__') {
            const trimmed = wlNewListName.trim();
            if (!trimmed) {
                setSnackbarMessage('Please enter a valid watchlist name.');
                setSnackbarOpen(true);
                return;
            }
            createCustomList(trimmed);
            targetList = trimmed;
        }

        addSymbolsToWatchlist(wlSymbolsToAdd, targetList);
        setSnackbarMessage(`Added ${wlSymbolsToAdd.length} symbols to "${targetList}" watchlist!`);
        setSnackbarOpen(true);
        setWlDialogOpen(false);
    };

    const holidays = useSelector((state) => state.marketStatus.holidays);

    const scanTypes = [
        { value: 'all', label: 'All Scans' },
        { value: 'newHigh', label: 'New High' },
        { value: 'dollarBO', label: 'Dollar BO' },
        { value: 'dollarBD', label: 'Dollar BD' },
        { value: '4PercentBO', label: '4% Breakout' },
        { value: '4PercentBD', label: '4% Breakdown' },
        { value: 'sltbBO', label: 'SLTB Breakout' },
        { value: 'sltbBD', label: 'SLTB Breakdown' },
        { value: 'bullishReversal', label: 'Bullish Reversal' },
        { value: 'up8Pct5d', label: '5d 8% Up' },
        { value: 'down8Pct5d', label: '5d 8% Down' },
        { value: 'up20Pct5d', label: '5d 20% Up' },
        { value: 'down20Pct5d', label: '5d 20% Down' }
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

    const fetchScans = async (forceRefresh = false) => {
        const validDate = getLastWorkingDay(selectedDate, holidays);

        if (validDate !== selectedDate) {
            console.log(`Date ${selectedDate} is a weekend/holiday. Falling back to ${validDate}`);
            setSelectedDate(validDate); // Update UI state; useEffect will handle re-fetching
            return;
        }

        setLoading(true);
        let dbRows = [];
        const token = localStorage.getItem('token');

        try {
            const response = await axios.get(`${BACKEND_URL}/api/scans`, {
                params: {
                    date: selectedDate
                },
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (response.data && response.data.data) {
                dbRows = response.data.data.map((item, index) => ({
                    id: item._id || index,
                    ...item
                }));
            }

            setScans(dbRows);
            setScanCount(dbRows.length);
        } catch (error) {
            console.error("Error fetching database scans:", error);
            setScans([]);
            setScanCount(0);
        } finally {
            setLoading(false);
        }

        // Asynchronously fetch 5-day moves in the background (non-blocking)
        const fetchBackground5dMoves = async () => {
            let computedScans = [];
            const storageKey = `fiveDayMoves_${selectedDate}`;
            if (forceRefresh) {
                localStorage.removeItem(storageKey);
            }
            const cachedData = localStorage.getItem(storageKey);

            if (cachedData) {
                computedScans = JSON.parse(cachedData);
            } else {
                try {
                    const compRes = await axios.get(`${BACKEND_URL}/api/scans/compute-five-day-moves`, {
                        params: {
                            date: selectedDate
                        },
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });
                    if (compRes.data && compRes.data.data) {
                        const moves = compRes.data.data;
                        const virtualScans = [];
                        const addVirtual = (list, type) => {
                            list.forEach(item => {
                                virtualScans.push({
                                    symbol: item.symbol,
                                    scanType: type,
                                    date: selectedDate,
                                    tradingSymbol: item.tradingSymbol,
                                    createdAt: `${selectedDate}T09:00:00.000Z`,
                                    extraData: {
                                        currentPrice: item.price,
                                        pctChange: item.pctChange
                                    }
                                });
                            });
                        };
                        addVirtual(moves.up8Pct5d || [], 'up8Pct5d');
                        addVirtual(moves.down8Pct5d || [], 'down8Pct5d');
                        addVirtual(moves.up20Pct5d || [], 'up20Pct5d');
                        addVirtual(moves.down20Pct5d || [], 'down20Pct5d');

                        computedScans = virtualScans;
                        localStorage.setItem(storageKey, JSON.stringify(virtualScans));
                        if (moves.historicalHighs) {
                            localStorage.setItem(`historicalHighs_${selectedDate}`, JSON.stringify(moves.historicalHighs));
                        }
                    }
                } catch (compErr) {
                    console.error("Failed to compute 5-day moves in background:", compErr);
                }
            }

            if (computedScans.length > 0) {
                setScans(prevScans => {
                    const cleanedPrev = prevScans.filter(s => !s.id.toString().startsWith('computed_'));
                    const mappedVirtual = computedScans.map((item, index) => ({
                        id: `computed_${item.scanType}_${item.tradingSymbol}_${index}`,
                        ...item
                    }));
                    const combined = [...cleanedPrev, ...mappedVirtual];
                    setScanCount(combined.length);
                    return combined;
                });
            }
        };

        fetchBackground5dMoves();
    };

    useEffect(() => {
        fetchScans();
    }, [selectedDate, holidays]);

    const handleOpenTimeFilter = (event) => setAnchorEl(event.currentTarget);
    const handleCloseTimeFilter = () => setAnchorEl(null);
    const openTimeFilter = Boolean(anchorEl);

    const handleClearTimeFilter = () => {
        setStartTime(null);
        setEndTime(null);
    };

    const baseFilteredScans = React.useMemo(() => {
        const dailyScanTypes = new Set(['up8Pct5d', 'down8Pct5d', 'up20Pct5d', 'down20Pct5d']);
        return scans.filter(scan => {
            if (dailyScanTypes.has(scan.scanType)) return true;

            if (!startTime && !endTime) return true;
            const scanTime = moment(scan.createdAt || scan.currentTs);
            const scanTotalMins = scanTime.hours() * 60 + scanTime.minutes();

            let match = true;
            if (startTime) {
                const sTotal = startTime.hour() * 60 + startTime.minute();
                if (scanTotalMins < sTotal) match = false;
            }
            if (endTime) {
                const eTotal = endTime.hour() * 60 + endTime.minute();
                if (scanTotalMins > eTotal) match = false;
            }
            return match;
        });
    }, [scans, startTime, endTime]);

    const bullishScansSet = new Set(['newHigh', 'dollarBO', '4PercentBO', 'sltbBO', 'bullishReversal', 'bullishAnts', 'up8Pct5d', 'up20Pct5d']);
    const bearishScansSet = new Set(['dollarBD', '4PercentBD', 'sltbBD', 'down8Pct5d', 'down20Pct5d']);

    const getShortLabel = (val) => {
        switch (val) {
            case 'newHigh': return 'New High';
            case 'dollarBO': return '$ BO';
            case 'dollarBD': return '$ BD';
            case '4PercentBO': return '4% BO';
            case '4PercentBD': return '4% BD';
            case 'sltbBO': return 'SLTB BO';
            case 'sltbBD': return 'SLTB BD';
            case 'bullishReversal': return 'Rev Bull';
            case 'bullishAnts': return 'Ants';
            case 'up8Pct5d': return '5d 8% Up';
            case 'down8Pct5d': return '5d 8% Dn';
            case 'up20Pct5d': return '5d 20% Up';
            case 'down20Pct5d': return '5d 20% Dn';
            default: return val;
        }
    };

    const transitionData = React.useMemo(() => {
        const symbolMap = {};
        baseFilteredScans.forEach(scan => {
            if (!symbolMap[scan.tradingSymbol]) {
                symbolMap[scan.tradingSymbol] = [];
            }
            symbolMap[scan.tradingSymbol].push(scan);
        });

        const transitions = {};
        Object.entries(symbolMap).forEach(([symbol, symbolScans]) => {
            if (symbolScans.length < 2) return;

            const sorted = [...symbolScans].sort((a, b) => moment(a.createdAt || a.currentTs).valueOf() - moment(b.createdAt || b.currentTs).valueOf());

            // Build chronological sequence of scan types collapsing consecutive duplicates
            const sequence = [];
            sorted.forEach(scan => {
                if (sequence.length === 0 || sequence[sequence.length - 1] !== scan.scanType) {
                    sequence.push(scan.scanType);
                }
            });

            // If the sequence has at least 2 distinct types, it's a transition!
            if (sequence.length >= 2) {
                const id = `transition_${sequence.join('_')}`;
                const details = sequence.map(getShortLabel).join(' → ');

                // The overall direction is determined by the last scan in the sequence
                const lastScanType = sequence[sequence.length - 1];
                const isBullish = bullishScansSet.has(lastScanType);
                const isBearish = bearishScansSet.has(lastScanType);
                let direction = 'neutral';
                if (isBullish) direction = 'bullish';
                else if (isBearish) direction = 'bearish';

                transitions[symbol] = { id, details, direction, first: sequence[0], last: lastScanType };
            }
        });
        return transitions;
    }, [baseFilteredScans]);

    const availableTransitions = React.useMemo(() => {
        const counts = {};
        const detailsMap = {};
        const directionMap = {};

        Object.values(transitionData).forEach(t => {
            counts[t.id] = (counts[t.id] || 0) + 1;
            detailsMap[t.id] = t.details;
            directionMap[t.id] = t.direction;
        });

        return Object.entries(counts)
            .map(([id, count]) => ({ id, count, details: detailsMap[id], direction: directionMap[id] }))
            .sort((a, b) => b.count - a.count);
    }, [transitionData]);

    const transitionRows = React.useMemo(() => {
        return availableTransitions.map(t => {
            const symbols = Object.keys(transitionData).filter(sym => transitionData[sym].id === t.id);
            return {
                id: t.id,
                details: t.details,
                count: t.count,
                direction: t.direction,
                symbols: symbols
            };
        });
    }, [availableTransitions, transitionData]);

    const displayedScans = React.useMemo(() => {
        let filtered = baseFilteredScans;
        if (scanType.startsWith('transition_')) {
            filtered = baseFilteredScans.filter(scan => transitionData[scan.tradingSymbol]?.id === scanType);
        } else if (scanType !== 'all') {
            filtered = baseFilteredScans.filter(scan => scan.scanType === scanType);
        }
        return filtered;
    }, [baseFilteredScans, scanType, transitionData]);

    const currentDisplayedSymbols = React.useMemo(() => {
        return [...new Set(displayedScans.map(scan => scan.tradingSymbol))];
    }, [displayedScans]);

    const handleCopySymbols = () => {
        if (displayedScans.length === 0) return;
        const uniqueSymbols = [...new Set(displayedScans.map(scan => scan.tradingSymbol))];
        const symbols = uniqueSymbols.join(',');
        navigator?.clipboard?.writeText(symbols)
            .then(() => {
                setSnackbarMessage(`Copied ${uniqueSymbols.length} symbols to clipboard!`);
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
                const currentFlags = flaggedStocks[symbol] || [];

                const handleFlagChange = (color) => {
                    toggleFlag(symbol, color);
                };

                return (
                    <Box onClick={(e) => e.stopPropagation()}>
                        <FlagMenu
                            currentFlags={currentFlags}
                            onFlagChange={handleFlagChange}
                        />
                    </Box>
                );
            }
        },
        {
            field: 'tradingSymbol',
            headerName: 'Symbol',
            flex: 1,
            minWidth: 220,
            renderCell: (params) => {
                const turnData = transitionData[params.value];
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {params.value}
                        </Typography>
                        {turnData && (
                            <Chip
                                size="small"
                                label={turnData.details}
                                sx={{
                                    height: 20,
                                    fontSize: '0.65rem',
                                    fontWeight: 700,
                                    bgcolor: turnData.direction === 'bullish' ? 'rgba(38, 166, 154, 0.1)' : turnData.direction === 'bearish' ? 'rgba(239, 83, 80, 0.1)' : 'rgba(158, 158, 158, 0.1)',
                                    color: turnData.direction === 'bullish' ? '#26a69a' : turnData.direction === 'bearish' ? '#ef5350' : '#757575',
                                    border: `1px solid ${turnData.direction === 'bullish' ? 'rgba(38, 166, 154, 0.3)' : turnData.direction === 'bearish' ? 'rgba(239, 83, 80, 0.3)' : 'rgba(158, 158, 158, 0.3)'}`
                                }}
                            />
                        )}
                    </Box>
                );
            }
        },
        {
            field: 'sector',
            headerName: 'Sector/Industry',
            flex: 1.2,
            minWidth: 150,
            renderCell: (params) => {
                const symbol = params.row.tradingSymbol;
                const scriptInfo = universe.find(s => s.tradingsymbol === symbol);
                const sector = scriptInfo?.sector || '-';
                const industry = scriptInfo?.industry || '-';
                return (
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
                            {sector}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {industry}
                        </Typography>
                    </Box>
                );
            }
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
                    case 'bullishReversal':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> Rev Bull
                            </Box>
                        );
                    case 'bullishAnts':
                        return (
                            <Box sx={{ color: '#1976d2', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <TrendingUp fontSize="small" /> Ants
                            </Box>
                        );
                    case 'up8Pct5d':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> 5d 8%
                            </Box>
                        );
                    case 'down8Pct5d':
                        return (
                            <Box sx={{ color: '#ef5350', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowDownward fontSize="small" /> 5d 8%
                            </Box>
                        );
                    case 'up20Pct5d':
                        return (
                            <Box sx={{ color: '#26a69a', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowUpward fontSize="small" /> 5d 20%
                            </Box>
                        );
                    case 'down20Pct5d':
                        return (
                            <Box sx={{ color: '#ef5350', display: 'flex', alignItems: 'center', fontWeight: 'bold', gap: 0.5 }}>
                                <ArrowDownward fontSize="small" /> 5d 20%
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

    const transitionColumns = [
        {
            field: 'direction',
            headerName: 'Trend',
            width: 120,
            renderCell: (params) => {
                const isBull = params.value === 'bullish';
                const isBear = params.value === 'bearish';
                return (
                    <Chip
                        size="small"
                        icon={isBull ? <ArrowUpward style={{ color: '#059669', fontSize: '0.9rem' }} /> : isBear ? <ArrowDownward style={{ color: '#dc2626', fontSize: '0.9rem' }} /> : undefined}
                        label={isBull ? 'Bullish' : isBear ? 'Bearish' : 'Neutral'}
                        sx={{
                            bgcolor: isBull ? '#ecfdf5' : isBear ? '#fef2f2' : '#f1f5f9',
                            color: isBull ? '#047857' : isBear ? '#b91c1c' : '#475569',
                            borderColor: isBull ? '#a7f3d0' : isBear ? '#fecaca' : '#cbd5e1',
                            borderWidth: 1,
                            borderStyle: 'solid',
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 24,
                            '& .MuiChip-icon': { color: 'inherit !important' }
                        }}
                    />
                );
            }
        },
        {
            field: 'details',
            headerName: 'Transition Path',
            flex: 1.5,
            minWidth: 280,
            renderCell: (params) => {
                const parts = params.value.split(' → ');
                return (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, height: '100%' }}>
                        {parts.map((p, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <span style={{ color: '#94a3b8', margin: '0 2px' }}>→</span>}
                                <Box component="span" sx={{
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    fontWeight: 600,
                                    bgcolor: '#f1f5f9',
                                    color: '#334155'
                                }}>
                                    {p}
                                </Box>
                            </React.Fragment>
                        ))}
                    </Box>
                );
            }
        },
        { field: 'count', headerName: 'Count', width: 90 },
        {
            field: 'symbols',
            headerName: 'Symbols',
            flex: 2,
            minWidth: 300,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', py: 1, alignItems: 'center', height: '100%' }}>
                    {params.value.map(sym => (
                        <Chip
                            key={sym}
                            label={sym}
                            size="small"
                            clickable
                            onClick={() => { setScanType(params.row.id); setViewType('table'); }}
                            sx={{ fontWeight: 600, fontSize: '0.75rem', height: 22 }}
                        />
                    ))}
                </Box>
            )
        },
        {
            field: 'action',
            headerName: '',
            width: 240,
            renderCell: (params) => (
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', height: '100%' }}>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => { setScanType(params.row.id); setViewType('table'); }}
                        sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600, color: '#000', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f8fafc', borderColor: '#000' } }}
                    >
                        View Scans
                    </Button>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleOpenAddWl(params.row.symbols)}
                        sx={{ textTransform: 'none', borderRadius: 1.5, fontWeight: 600, color: '#000', borderColor: '#cbd5e1', '&:hover': { bgcolor: '#f8fafc', borderColor: '#000' } }}
                    >
                        + Add to WL
                    </Button>
                </Box>
            )
        }
    ];

    const scanTypeCounts = baseFilteredScans.reduce((acc, scan) => {
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

                {/* Tier 1: Title and Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, width: '100%', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Market Scans
                        </Typography>
                        <Tabs
                            value={activeTab}
                            onChange={(e, newValue) => setActiveTab(newValue)}
                            textColor="inherit"
                            indicatorColor="primary"
                            sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, textTransform: 'none', fontWeight: 600 } }}
                        >
                            <Tab label="Live Daily Scans" />
                            <Tab label="Historical Performance" />
                        </Tabs>
                    </Box>

                    {activeTab === 0 && (
                        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                            <Button
                                variant="outlined"
                                onClick={() => handleOpenAddWl(currentDisplayedSymbols)}
                                disabled={loading || currentDisplayedSymbols.length === 0}
                                sx={{
                                    height: 36,
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
                                + Add View to WL
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={handleCopySymbols}
                                disabled={loading || displayedScans.length === 0}
                                startIcon={<ContentCopy />}
                                sx={{
                                    height: 36,
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
                                onClick={() => fetchScans(true)}
                                disabled={loading}
                                sx={{
                                    bgcolor: '#000',
                                    color: '#fff',
                                    height: 36,
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
                    )}
                </Box>

                {activeTab === 0 && (
                <>
                {/* Tier 2: Scan Filters Pills */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 3, width: '100%' }}>
                    {renderFilterButton('all', 'All', baseFilteredScans.length)}
                    {Object.entries(scanTypeCounts).map(([type, count]) => (
                        renderFilterButton(type, getScanLabel(type), count)
                    ))}
                </Box>

                {/* Tier 3: Configurations and Secondary Actions */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, width: '100%', flexWrap: 'wrap', gap: 2, p: 2, bgcolor: 'var(--bg-primary)', borderRadius: 2, border: '1px solid var(--border-color)' }}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>

                        {/* Transitions Dropdown with proper notched outline fix */}
                        <FormControl size="small" sx={{ minWidth: 160, bgcolor: 'var(--bg-primary)' }}>
                            <InputLabel id="transitions-select-label" sx={commonInputLabelSx}>Transitions</InputLabel>
                            <Select
                                labelId="transitions-select-label"
                                value={scanType.startsWith('transition_') ? scanType : ''}
                                label="Transitions"
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val) {
                                        setScanType(val);
                                        if (viewType === 'transitions') setViewType('table');
                                    } else {
                                        setScanType('all');
                                    }
                                }}
                                sx={commonSelectSx}
                            >
                                <MenuItem value="">None</MenuItem>
                                {availableTransitions.map(t => (
                                    <MenuItem key={t.id} value={t.id}>
                                        {t.details} ({t.count})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* View Dropdown with proper notched outline fix */}
                        <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'var(--bg-primary)' }}>
                            <InputLabel id="view-select-label" sx={commonInputLabelSx}>View</InputLabel>
                            <Select
                                labelId="view-select-label"
                                value={viewType}
                                label="View"
                                onChange={(e) => setViewType(e.target.value)}
                                sx={commonSelectSx}
                            >
                                <MenuItem value="table">Table</MenuItem>
                                <MenuItem value="chart">Chart</MenuItem>
                                <MenuItem value="transitions">Transitions</MenuItem>
                            </Select>
                        </FormControl>

                        {viewType === 'chart' && (
                            <FormControl size="small" sx={{ minWidth: 120, bgcolor: 'var(--bg-primary)' }}>
                                <InputLabel id="timeframe-select-label" sx={commonInputLabelSx}>Timeframe</InputLabel>
                                <Select
                                    labelId="timeframe-select-label"
                                    value={timeframe}
                                    label="Timeframe"
                                    onChange={(e) => setTimeframe(e.target.value)}
                                    sx={commonSelectSx}
                                >
                                    <MenuItem value={5}>5 Mins</MenuItem>
                                    <MenuItem value={15}>15 Mins</MenuItem>
                                    <MenuItem value={30}>30 Mins</MenuItem>
                                    <MenuItem value={60}>60 Mins</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        <TextField
                            label="Date"
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ max: moment().format('YYYY-MM-DD') }}
                            size="small"
                            sx={{ width: 160, bgcolor: 'var(--bg-primary)', ...commonInputProps }}
                        />
                    </Box>

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            variant="outlined"
                            onClick={handleOpenTimeFilter}
                            sx={{ height: 40, borderColor: 'var(--border-color)', color: 'text.primary', '&:hover': { borderColor: 'primary.main' }, textTransform: 'none', borderRadius: 1.5 }}
                        >
                            {startTime || endTime ?
                                `Time: ${startTime ? startTime.format('HH:mm') : 'Start'} - ${endTime ? endTime.format('HH:mm') : 'End'}`
                                : 'Filter Time'
                            }
                        </Button>

                        <Popover
                            open={openTimeFilter}
                            anchorEl={anchorEl}
                            onClose={handleCloseTimeFilter}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        >
                            <LocalizationProvider dateAdapter={AdapterDayjs}>
                                <Box sx={{ display: 'flex', gap: 2, p: 2, bgcolor: 'var(--bg-primary)' }}>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>From</Typography>
                                        <StaticTimePicker
                                            displayStaticWrapperAs="desktop"
                                            value={startTime}
                                            onChange={(newValue) => setStartTime(newValue)}
                                            slotProps={{ actionBar: { actions: [] } }}
                                        />
                                    </Box>
                                    <Box>
                                        <Typography variant="subtitle2" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>To</Typography>
                                        <StaticTimePicker
                                            displayStaticWrapperAs="desktop"
                                            value={endTime}
                                            onChange={(newValue) => setEndTime(newValue)}
                                            slotProps={{ actionBar: { actions: [] } }}
                                        />
                                    </Box>
                                </Box>
                                <Box sx={{ p: 2, pt: 0, display: 'flex', justifyContent: 'flex-end', gap: 2, bgcolor: 'var(--bg-primary)' }}>
                                    <Button onClick={handleClearTimeFilter} color="inherit">Clear</Button>
                                    <Button variant="contained" onClick={handleCloseTimeFilter} sx={{ bgcolor: 'black', color: 'white', '&:hover': { bgcolor: '#333' }, textTransform: 'none' }}>Apply</Button>
                                </Box>
                            </LocalizationProvider>
                        </Popover>
                    </Box>
                </Box>

                {/* Main Body */}
                <Box sx={{ flex: 1, display: 'flex', gap: 2, minHeight: 0, width: '100%' }}>
                    {/* Transitions Sidebar Summary */}
                    {availableTransitions.length > 0 && (
                        <Paper elevation={0} sx={{ width: 280, display: 'flex', flexDirection: 'column', bgcolor: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', flexShrink: 0 }}>
                            <Box sx={{ p: 1.5, borderBottom: '1px solid var(--border-color)', bgcolor: 'var(--bg-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--text-secondary)' }}>TRANSITIONS TODAY</Typography>
                                <Chip size="small" label={availableTransitions.reduce((sum, t) => sum + t.count, 0)} sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }} />
                            </Box>
                            <Box sx={{ flex: 1, overflowY: 'auto' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    {availableTransitions.map(t => {
                                        const isActive = scanType === t.id;
                                        return (
                                            <Box
                                                key={t.id}
                                                onClick={() => {
                                                    setScanType(isActive ? 'all' : t.id);
                                                    if (viewType === 'transitions') setViewType('table');
                                                }}
                                                sx={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                    p: '12px 16px',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    bgcolor: isActive ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                                                    '&:hover': { bgcolor: isActive ? 'rgba(25, 118, 210, 0.12)' : 'rgba(0,0,0,0.02)' },
                                                    transition: 'all 0.15s ease'
                                                }}
                                            >
                                                <Typography variant="body2" sx={{ fontSize: '0.8rem', fontWeight: isActive ? 600 : 500, color: isActive ? 'primary.main' : 'var(--text-primary)' }}>
                                                    {t.details}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={t.count}
                                                    sx={{
                                                        height: 20,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        bgcolor: isActive ? 'primary.main' : 'var(--bg-secondary)',
                                                        color: isActive ? 'white' : 'inherit'
                                                    }}
                                                />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Paper>
                    )}

                    {/* Content Area */}
                    <Paper elevation={0} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, bgcolor: 'var(--bg-primary)', borderRadius: 2, overflow: 'hidden', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        {viewType === 'table' ? (
                            <DataGrid
                                rows={displayedScans}
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
                        ) : viewType === 'chart' ? (
                            <ScansTVChart scans={displayedScans} timeframe={timeframe} />
                        ) : (
                            <DataGrid
                                rows={transitionRows}
                                columns={transitionColumns}
                                loading={loading}
                                pageSizeOptions={[10, 25, 50]}
                                initialState={{
                                    pagination: { paginationModel: { pageSize: 25 } },
                                }}
                                getRowHeight={() => 'auto'}
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
                                    }
                                }}
                            />
                        )}
                    </Paper>
                </Box>
            </>
                )}
            {activeTab === 1 && <PerformanceDashboard selectedDate={selectedDate} />}
        </Box>

            {/* Add to Watchlist Dialog */ }
            <Dialog open={wlDialogOpen} onClose={() => setWlDialogOpen(false)} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 700 }}>Add Symbols to Watchlist</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                        Add <strong>{wlSymbolsToAdd.length}</strong> unique symbol(s) to a watchlist list.
                    </Typography>

                    <FormControl size="small" fullWidth sx={{ mt: 1 }}>
                        <InputLabel id="wl-list-select-label">Select Watchlist</InputLabel>
                        <Select
                            labelId="wl-list-select-label"
                            value={wlSelectedList}
                            label="Select Watchlist"
                            onChange={(e) => setWlSelectedList(e.target.value)}
                        >
                            <MenuItem value="red">Red List</MenuItem>
                            <MenuItem value="blue">Blue List</MenuItem>
                            <MenuItem value="green">Green List</MenuItem>
                            <MenuItem value="orange">Orange List</MenuItem>
                            <MenuItem value="purple">Purple List</MenuItem>
                            {customLists.map(list => (
                                <MenuItem key={list} value={list}>{list}</MenuItem>
                            ))}
                            <MenuItem value="__NEW__" sx={{ fontWeight: 600, borderTop: '1px solid #e2e8f0', mt: 1 }}>+ Create New Watchlist</MenuItem>
                        </Select>
                    </FormControl>

                    {wlSelectedList === '__NEW__' && (
                        <TextField
                            label="New Watchlist Name"
                            size="small"
                            fullWidth
                            value={wlNewListName}
                            onChange={(e) => setWlNewListName(e.target.value)}
                            placeholder="e.g. Transitions Today"
                            autoFocus
                        />
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setWlDialogOpen(false)} color="inherit" size="small">Cancel</Button>
                    <Button
                        onClick={handleAddWlSubmit}
                        variant="contained"
                        size="small"
                        sx={{ bgcolor: '#000', color: '#fff', '&:hover': { bgcolor: '#222' } }}
                        disabled={wlSelectedList === '__NEW__' && !wlNewListName.trim()}
                    >
                        Add to Watchlist
                    </Button>
                </DialogActions>
            </Dialog>

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
        </Box >
    );
};

export default Scans;
