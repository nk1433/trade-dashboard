import { useEffect, useRef, useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { LineChart } from "@mui/x-charts/LineChart";
import {
    Typography,
    Container,
    Box,
    Paper,
    useTheme,
    Stack,
    Divider,
    LinearProgress
} from "@mui/material";
import niftymidsmall400 from "../../index/niftymidsmall400-float.json";
import axios from "axios";

function getInstrumentKeyParam(list) {
    return list.map(item => encodeURIComponent(item.instrument_key)).join(",");
}

async function fetchMarketOHLC(instrumentKeys, token) {
    const url = `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${instrumentKeys}&interval=1d`;
    // Fallback to env if token not provided (though Redux should have it)
    const effectiveToken = token || import.meta.env.VITE_UPSTOXS_ACCESS_KEY;

    const headers = {
        Accept: "application/json",
        Authorization: "Bearer " + effectiveToken,
    };

    try {
        const response = await axios.get(url, { headers });
        return response.data?.data || {};
    } catch (error) {
        console.error("Failed to fetch market OHLC data:", error.message);
        return {};
    }
}

export default function MarketHighLowWormChart() {
    const [seriesData, setSeriesData] = useState([]);
    const instrumentKeys = useRef(getInstrumentKeyParam(niftymidsmall400));
    const theme = useTheme();
    const { token } = useSelector((state) => state.auth);

    useEffect(() => {
        let isMounted = true;
        if (!token) return; // Wait for token

        const pollData = async () => {
            const ohlcData = await fetchMarketOHLC(instrumentKeys.current, token);
            let newHighCount = 0;
            let newLowCount = 0;

            Object.values(ohlcData).forEach(item => {
                if (item?.live_ohlc?.close === item?.live_ohlc?.high) newHighCount++;
                if (item?.live_ohlc?.close === item?.live_ohlc?.low) newLowCount++;
            });

            const now = new Date();
            const timeLabel = now.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

            if (!isMounted) return;

            // Keep only last 60 data points
            setSeriesData(prev => {
                const updated = [
                    ...prev,
                    { time: timeLabel, newHighs: newHighCount, newLows: newLowCount }
                ];
                return updated.slice(-60);
            });
        };

        pollData();
        const interval = setInterval(pollData, 4000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, [token]);

    const timePoints = useMemo(() => seriesData.map(pt => pt.time), [seriesData]);
    const newHighSeries = useMemo(() => seriesData.map(pt => pt.newHighs), [seriesData]);
    const newLowSeries = useMemo(() => seriesData.map(pt => pt.newLows), [seriesData]);

    const latestHighs = seriesData.length > 0 ? seriesData[seriesData.length - 1].newHighs : 0;
    const latestLows = seriesData.length > 0 ? seriesData[seriesData.length - 1].newLows : 0;

    // Calculate Ratio for Progress Bar
    const total = latestHighs + latestLows;
    const highRatio = total > 0 ? (latestHighs / total) * 100 : 50;


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

            {/* Chart Section */}
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
                        <LineChart
                            height={400}
                            margin={{ left: 50, right: 20, top: 20, bottom: 30 }}
                            grid={{ horizontal: true }}
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
                            slotProps={{
                                legend: {
                                    hidden: false,
                                    direction: 'row',
                                    position: { vertical: 'top', horizontal: 'right' },
                                    padding: 0,
                                    labelStyle: {
                                        fontWeight: 600,
                                        fontSize: 12
                                    }
                                },
                            }}
                            sx={{
                                // Custom chart overrides for monochrome logic if needed
                                '.MuiAreaElement-root': {
                                    fillOpacity: 0.1 // Lighter fill
                                }
                            }}
                        />
                    ) : (
                        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                            <Typography variant="overline" color="text.secondary">Waiting for Market Data...</Typography>
                        </Box>
                    )}
                </Box>
            </Paper>
        </Container>
    );
}
