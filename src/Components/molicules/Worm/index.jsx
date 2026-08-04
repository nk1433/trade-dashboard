import { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import CommonLineChart from "../CommonLineChart";
import {
    Typography,
    Container,
    Box,
    Paper,
    useTheme,
    Grid,
} from "@mui/material";
import universe from '../../../index/universe.json';
import IndustryVolumeShockers from './IndustryVolumeShockers';
import TopVolumeShockers from './TopVolumeShockers';

export default function MarketHighLowWormChart() {
    const [seriesData, setSeriesData] = useState([]);
    const [turnoverMode, setTurnoverMode] = useState('TOTAL'); // 'TOTAL' | 'UP' | 'DOWN'
    const [shockerTab, setShockerTab] = useState('TOP'); // 'TOP' | 'INDUSTRY'
    const [showCharts, setShowCharts] = useState(false);
    const theme = useTheme();

    // Access live metrics from Redux
    const { orderMetrics } = useSelector((state) => state.orders);

    const orderMetricsRef = useRef(orderMetrics);
    useEffect(() => {
        orderMetricsRef.current = orderMetrics;
    }, [orderMetrics]);

    useEffect(() => {
        let isMounted = true;

        const calculateLiveStats = () => {
            let newHighCount = 0;
            let newLowCount = 0;
            let totalTurnover = 0;
            let upTurnover = 0;
            let downTurnover = 0;
            const currentMetrics = orderMetricsRef.current || {};

            // Iterate through the monitored list
            universe.forEach(script => {
                const metric = currentMetrics[script.instrument_key];

                if (metric) {
                    const ltp = metric.ltp || 0;
                    const high = metric.dayHigh || 0;
                    const low = metric.dayLow || 0;
                    const vol = metric.dayVolume || 0;
                    // Use open from metric or fallback if needed
                    const open = metric.currentDayOpen || metric.open || ltp;

                    if (ltp > 0 && vol > 0) {
                        if (ltp === high) newHighCount++;
                        if (ltp === low) newLowCount++;

                        const turnover = (ltp * vol);

                        // Total Turnover (Absolute Sum)
                        totalTurnover += turnover;

                        // Segregate Turnover based on price action relative to Open
                        if (ltp >= open) {
                            upTurnover += turnover;
                        } else {
                            downTurnover += turnover;
                        }
                    }
                }
            });

            const now = new Date();
            const timeLabel = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

            if (!isMounted) return;

            // Update series data with sliding window
            setSeriesData(prev => {
                const updated = [
                    ...prev,
                    {
                        time: timeLabel,
                        newHighs: newHighCount,
                        newLows: newLowCount,
                        turnover: totalTurnover,
                        upTurnover: upTurnover,
                        downTurnover: downTurnover
                    }
                ];
                // Keep last 60 points (~5 min with 5s interval)
                return updated.slice(-60);
            });
        };

        // Run calculation every 5 seconds for consolidated data
        calculateLiveStats();
        const interval = setInterval(calculateLiveStats, 5000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []); // Empty dependency array ensures it only runs on mount

    const timePoints = useMemo(() => seriesData.map(pt => pt.time), [seriesData]);
    const newHighSeries = useMemo(() => seriesData.map(pt => pt.newHighs), [seriesData]);
    const newLowSeries = useMemo(() => seriesData.map(pt => pt.newLows), [seriesData]);

    // Memoize series for charts
    const turnoverSeries = useMemo(() => seriesData.map(pt => (pt.turnover / 10000000).toFixed(2)), [seriesData]);
    const upTurnoverSeries = useMemo(() => seriesData.map(pt => (pt.upTurnover / 10000000).toFixed(2)), [seriesData]);
    const downTurnoverSeries = useMemo(() => seriesData.map(pt => (pt.downTurnover / 10000000).toFixed(2)), [seriesData]);

    const latestHighs = seriesData.length > 0 ? seriesData[seriesData.length - 1].newHighs : 0;
    const latestLows = seriesData.length > 0 ? seriesData[seriesData.length - 1].newLows : 0;

    const latestTotal = seriesData.length > 0 ? seriesData[seriesData.length - 1].turnover : 0;
    const latestUp = seriesData.length > 0 ? seriesData[seriesData.length - 1].upTurnover : 0;
    const latestDown = seriesData.length > 0 ? seriesData[seriesData.length - 1].downTurnover : 0;

    // Calculate Ratio for Progress Bar
    const total = latestHighs + latestLows;
    const highRatio = total > 0 ? (latestHighs / total) * 100 : 50;

    // Format Turnover
    const formatTurnover = (val) => {
        const absVal = Math.abs(val);
        let formatted = '';
        if (!val) return '₹ 0.00';

        if (absVal >= 10000000) formatted = `₹ ${(absVal / 10000000).toFixed(2)} Cr`;
        else if (absVal >= 100000) formatted = `₹ ${(absVal / 100000).toFixed(2)} L`;
        else formatted = `₹ ${absVal.toFixed(2)}`;

        return formatted;
    };

    // Determine current values based on mode
    let currentTurnoverValue = latestTotal;
    let currentSeries = turnoverSeries;
    let currentColor = "#212121";
    let currentLabel = "Turnover (Cr)";

    if (turnoverMode === 'UP') {
        currentTurnoverValue = latestUp;
        currentSeries = upTurnoverSeries;
        currentColor = "#4caf50"; // Green
        currentLabel = "Buying Turnover (Cr)";
    } else if (turnoverMode === 'DOWN') {
        currentTurnoverValue = latestDown;
        currentSeries = downTurnoverSeries;
        currentColor = "#ef5350"; // Red
        currentLabel = "Selling Turnover (Cr)";
    }

    const renderPill = (mode, label) => {
        const isActive = turnoverMode === mode;
        return (
            <Box
                onClick={() => setTurnoverMode(mode)}
                sx={{
                    px: 3,
                    py: 0.5,
                    borderRadius: 10,
                    cursor: 'pointer',
                    bgcolor: isActive ? '#000' : 'transparent',
                    color: isActive ? '#fff' : '#9e9e9e',
                    border: '1px solid',
                    borderColor: isActive ? '#000' : '#e0e0e0',
                    transition: 'all 0.2s',
                    '&:hover': {
                        borderColor: '#000',
                        color: isActive ? '#fff' : '#000'
                    }
                }}
            >
                <Typography variant="button" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{label}</Typography>
            </Box>
        );
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} lg={6}>
                    {/* Minimal Header Section */}
                    <Box sx={{ mb: 4, textAlign: 'center', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <Typography variant="overline" sx={{ letterSpacing: 2, color: '#9e9e9e', fontWeight: 600 }}>
                            UNIVERSE • MARKET BREADTH
                        </Typography>

                        {/* Comparison Block */}
                        <Box sx={{
                            mt: 2,
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: 4
                        }}>
                            <Box sx={{ textAlign: 'right', }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1, color: '#000' }}>
                                    {latestHighs}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#000' }}>NEW HIGHS</Typography>
                            </Box>

                            <Typography variant="h6" sx={{ color: '#bdbdbd', fontWeight: 300, alignSelf: 'center' }}>
                                VS
                            </Typography>

                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1, color: '#000' }}>
                                    {latestLows}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#000' }}>NEW LOWS</Typography>
                            </Box>
                        </Box>

                        {/* Ratio Bar */}
                        <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mt: 2 }}>
                            <Box sx={{ height: 6, width: '100%', bgcolor: '#eee', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                                <Box sx={{ width: `${highRatio}%`, bgcolor: '#000', transition: 'width 0.5s ease' }} />
                            </Box>
                        </Box>
                    </Box>

                </Grid>

                <Grid item xs={12} lg={6}>
                    {/* Turnover Chart Section */}
                    <Box sx={{ textAlign: 'center', minHeight: 180, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                        <Typography variant="overline" sx={{ letterSpacing: 2, color: '#9e9e9e', fontWeight: 600, display: 'block', mb: 2 }}>
                            MARKET TURNOVER
                        </Typography>

                        {/* Comparison Block */}
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'baseline',
                            gap: 4
                        }}>
                            <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                                    {formatTurnover(latestUp)}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#4caf50' }}>BUYING</Typography>
                            </Box>

                            <Typography variant="h6" sx={{ color: '#e0e0e0', fontWeight: 300, alignSelf: 'center' }}>
                                VS
                            </Typography>

                            <Box sx={{ textAlign: 'left' }}>
                                <Typography variant="h4" sx={{ fontWeight: 800, lineHeight: 1 }}>
                                    {formatTurnover(latestDown)}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#ef5350' }}>SELLING</Typography>
                            </Box>
                        </Box>

                        {/* Ratio Bar */}
                        <Box sx={{ width: '100%', maxWidth: 400, mx: 'auto', mt: 2, mb: 4 }}>
                            <Box sx={{ height: 6, width: '100%', bgcolor: '#e0e0e0', borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                                <Box sx={{ width: `${(latestUp + latestDown) > 0 ? (latestUp / (latestUp + latestDown)) * 100 : 50}%`, bgcolor: '#000000', transition: 'width 0.5s ease' }} />
                            </Box>
                        </Box>

                        {/* Toggle Pills */}
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mb: 1 }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {renderPill('TOTAL', 'Total')}
                                {renderPill('UP', 'Up')}
                                {renderPill('DOWN', 'Down')}
                            </Box>
                            <Typography variant="h6" sx={{ fontWeight: 800, color: currentColor, transition: 'color 0.3s' }}>
                                {formatTurnover(currentTurnoverValue)}
                            </Typography>
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                <Box
                    onClick={() => setShowCharts(!showCharts)}
                    sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: 1,
                        cursor: 'pointer',
                        color: showCharts ? '#000' : '#9e9e9e',
                        border: '1px solid',
                        borderColor: showCharts ? '#000' : '#e0e0e0',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        transition: 'all 0.2s',
                        '&:hover': {
                            borderColor: '#000',
                            color: '#000'
                        }
                    }}
                >
                    {showCharts ? 'HIDE CHARTS' : 'SHOW CHARTS'}
                </Box>
            </Box>

            {showCharts && (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, mt: 2 }}>
                    {/* High/Low Chart Section */}
                    <Paper elevation={0} sx={{
                        p: 2,
                        borderRadius: 0,
                        border: '1px solid #eee',
                        height: 350,
                        width: '100%',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ width: '100%', height: '100%' }}>
                            {seriesData.length > 0 ? (
                                <CommonLineChart
                                    height={300}
                                    margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
                                    series={[
                                        {
                                            label: "New Highs",
                                            data: newHighSeries,
                                            curve: "monotoneX",
                                            color: "#000000", // Solid Black
                                            area: true,
                                            showMark: false,
                                            width: 2,
                                        },
                                        {
                                            label: "New Lows",
                                            data: newLowSeries,
                                            curve: "monotoneX",
                                            color: "#e0e0e0", // Light Gray for contrast
                                            area: true,
                                            showMark: false,
                                            width: 2,
                                        },
                                    ]}
                                    xAxis={[
                                        {
                                            data: timePoints,
                                            label: "Time",
                                            scaleType: "point",
                                            tickLabelStyle: {
                                                angle: -45,
                                                textAnchor: 'end',
                                                fontSize: 10,
                                                fontFamily: 'Roboto Mono'
                                            }
                                        }
                                    ]}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Typography variant="overline" color="text.secondary">Loading Live Data...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>

                    <Paper elevation={0} sx={{
                        p: 2,
                        borderRadius: 0,
                        border: '1px solid #eee',
                        height: 350,
                        width: '100%',
                        overflow: 'hidden'
                    }}>
                        <Box sx={{ width: '100%', height: '100%' }}>
                            {seriesData.length > 0 ? (
                                <CommonLineChart
                                    height={300}
                                    margin={{ left: 60, right: 20, top: 20, bottom: 30 }}
                                    series={[
                                        {
                                            label: currentLabel,
                                            data: currentSeries,
                                            curve: "monotoneX",
                                            color: currentColor,
                                            area: true,
                                            showMark: false,
                                            width: 2,
                                        },
                                    ]}
                                    xAxis={[
                                        {
                                            data: timePoints,
                                            label: "Time",
                                            scaleType: "point",
                                            tickLabelStyle: {
                                                angle: -45,
                                                textAnchor: 'end',
                                                fontSize: 10,
                                                fontFamily: 'Roboto Mono'
                                            }
                                        }
                                    ]}
                                />
                            ) : (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                                    <Typography variant="overline" color="text.secondary">Loading Live Turnover Data...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Box>
            )}

            <Box sx={{ mt: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
                    <Box
                        onClick={() => setShockerTab('TOP')}
                        sx={{
                            px: 4,
                            py: 1,
                            borderRadius: 10,
                            cursor: 'pointer',
                            bgcolor: shockerTab === 'TOP' ? '#000' : 'transparent',
                            color: shockerTab === 'TOP' ? '#fff' : '#9e9e9e',
                            border: '1px solid',
                            borderColor: shockerTab === 'TOP' ? '#000' : '#e0e0e0',
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: '#000',
                                color: shockerTab === 'TOP' ? '#fff' : '#000'
                            }
                        }}
                    >
                        <Typography variant="button" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>TOP VOLUME</Typography>
                    </Box>
                    <Box
                        onClick={() => setShockerTab('INDUSTRY')}
                        sx={{
                            px: 4,
                            py: 1,
                            borderRadius: 10,
                            cursor: 'pointer',
                            bgcolor: shockerTab === 'INDUSTRY' ? '#000' : 'transparent',
                            color: shockerTab === 'INDUSTRY' ? '#fff' : '#9e9e9e',
                            border: '1px solid',
                            borderColor: shockerTab === 'INDUSTRY' ? '#000' : '#e0e0e0',
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: '#000',
                                color: shockerTab === 'INDUSTRY' ? '#fff' : '#000'
                            }
                        }}
                    >
                        <Typography variant="button" sx={{ fontWeight: 700, fontSize: '0.75rem' }}>INDUSTRY</Typography>
                    </Box>
                </Box>

                {shockerTab === 'TOP' ? <TopVolumeShockers /> : <IndustryVolumeShockers />}
            </Box>

        </Container >
    );
}
