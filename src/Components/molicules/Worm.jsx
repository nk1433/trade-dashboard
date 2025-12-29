import { useEffect, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import CommonLineChart from "./CommonLineChart";
import {
    Typography,
    Container,
    Box,
    Paper,
    useTheme,
} from "@mui/material";
import niftymidsmall400 from "../../index/niftymidsmall400-float.json";

export default function MarketHighLowWormChart() {
    const [seriesData, setSeriesData] = useState([]);
    const theme = useTheme();

    // Access live metrics from Redux
    const { orderMetrics } = useSelector((state) => state.orders);

    useEffect(() => {
        let isMounted = true;

        const calculateLiveStats = () => {
            let newHighCount = 0;
            let newLowCount = 0;
            let totalTurnover = 0;

            // Iterate through the monitored list
            niftymidsmall400.forEach(script => {
                const metric = orderMetrics[script.instrument_key];

                if (metric) {
                    const ltp = metric.ltp || 0;
                    const high = metric.dayHigh || 0;
                    const low = metric.dayLow || 0;
                    const vol = metric.dayVolume || 0;

                    if (ltp > 0) {
                        if (ltp === high) newHighCount++;
                        if (ltp === low) newLowCount++;

                        // Calculate Turnover: LTP * Volume
                        totalTurnover += (ltp * vol);
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
                        turnover: totalTurnover
                    }
                ];
                // Keep last 60 points (~1 min if 1s interval, or adjust as needed)
                return updated.slice(-60);
            });
        };

        // Run calculation every second for "live" feel
        calculateLiveStats();
        const interval = setInterval(calculateLiveStats, 1000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [orderMetrics]); // Dependency on orderMetrics ensures updates when Redux changes

    const timePoints = useMemo(() => seriesData.map(pt => pt.time), [seriesData]);
    const newHighSeries = useMemo(() => seriesData.map(pt => pt.newHighs), [seriesData]);
    const newLowSeries = useMemo(() => seriesData.map(pt => pt.newLows), [seriesData]);
    const turnoverSeries = useMemo(() => seriesData.map(pt => (pt.turnover / 10000000).toFixed(2)), [seriesData]); // In Crores (10^7)

    const latestHighs = seriesData.length > 0 ? seriesData[seriesData.length - 1].newHighs : 0;
    const latestLows = seriesData.length > 0 ? seriesData[seriesData.length - 1].newLows : 0;
    const latestTurnover = seriesData.length > 0 ? seriesData[seriesData.length - 1].turnover : 0;

    // Calculate Ratio for Progress Bar
    const total = latestHighs + latestLows;
    const highRatio = total > 0 ? (latestHighs / total) * 100 : 50;

    // Format Turnover
    const formatTurnover = (val) => {
        if (!val) return '₹ 0.00';
        if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(2)} Cr`;
        if (val >= 100000) return `₹ ${(val / 100000).toFixed(2)} L`;
        return `₹ ${val.toFixed(2)}`;
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Minimal Header Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: '#9e9e9e', fontWeight: 600 }}>
                    NIFTY MIDSMALL 400 • MARKET BREADTH
                </Typography>

                {/* Comparison Block */}
                <Box sx={{
                    mt: 2,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'baseline',
                    gap: 4
                }}>
                    <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1, color: '#000' }}>
                            {latestHighs}
                        </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 600, color: '#000' }}>NEW HIGHS</Typography>
                    </Box>

                    <Typography variant="h6" sx={{ color: '#bdbdbd', fontWeight: 300, alignSelf: 'center' }}>
                        VS
                    </Typography>

                    <Box sx={{ textAlign: 'left' }}>
                        <Typography variant="h2" sx={{ fontWeight: 800, lineHeight: 1, color: '#000' }}>
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

            {/* High/Low Chart Section */}
            <Paper elevation={0} sx={{
                p: 2,
                borderRadius: 0,
                border: '1px solid #eee',
                height: 450,
                width: '100%',
                overflow: 'hidden'
            }}>
                <Box sx={{ width: '100%', height: '100%' }}>
                    {seriesData.length > 0 ? (
                        <CommonLineChart
                            height={400}
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
                                },
                            ]}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography variant="overline" color="text.secondary">Loading Live Data...</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

            {/* Turnover Chart Section */}
            <Box sx={{ mt: 6, mb: 2, textAlign: 'center' }}>
                <Typography variant="overline" sx={{ letterSpacing: 2, color: '#9e9e9e', fontWeight: 600 }}>
                    TOTAL MARKET TURNOVER
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 800, color: '#000', mt: 1 }}>
                    {formatTurnover(latestTurnover)}
                </Typography>
            </Box>

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
                                    label: "Turnover (Cr)",
                                    data: turnoverSeries,
                                    curve: "monotoneX",
                                    color: "#212121", // Dark Grey/Black
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
                                },
                            ]}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography variant="overline" color="text.secondary">Loading Live Turnover Data...</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>

        </Container>
    );
}
