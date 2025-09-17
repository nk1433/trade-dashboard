import { useEffect, useRef, useState } from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import niftymidsmall400 from "../../index/niftymidsmall400-float.json";
import axios from "axios";

function getInstrumentKeyParam(list) {
    return list.map(item => item.instrument_key).join(",");
}

async function fetchMarketOHLC(instrumentKeys) {
    const url = `https://api.upstox.com/v3/market-quote/ohlc?instrument_key=${encodeURIComponent(instrumentKeys)}&interval=1d`;
    const headers = {
        Accept: "application/json",
        Authorization: "Bearer " + import.meta.env.VITE_UPSTOXS_ACCESS_KEY,
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
    //TODO: Got reset on navbar switch
    const [seriesData, setSeriesData] = useState([]);
    const instrumentKeys = useRef(getInstrumentKeyParam(niftymidsmall400));

    useEffect(() => {
        let isMounted = true;

        const pollData = async () => {
            const ohlcData = await fetchMarketOHLC(instrumentKeys.current);
            let newHighCount = 0;
            let newLowCount = 0;

            Object.values(ohlcData).forEach(item => {
                if (item?.live_ohlc?.close === item?.live_ohlc?.high) newHighCount++;
                if (item?.live_ohlc?.close === item?.live_ohlc?.low) newLowCount++;
            });


            // Use a precise timestamp to avoid duplicate labels
            const now = new Date();
            const timeLabel = now.toLocaleTimeString() + ":" + now.getMilliseconds();

            if (!isMounted) return;
            setSeriesData(prev => {
                const updated = [
                    ...prev,
                    { time: timeLabel, newHighs: newHighCount, newLows: newLowCount }
                ];
                return updated;
            });
        };

        pollData();
        const interval = setInterval(pollData, 4000);

        return () => {
            isMounted = false;
            clearInterval(interval);
        };
    }, []);

    const timePoints = seriesData.map(pt => pt.time);
    const newHighSeries = seriesData.map(pt => pt.newHighs);
    const newLowSeries = seriesData.map(pt => pt.newLows);

    return (
        <div style={{ width: "95vw", maxWidth: 800, margin: "0 auto" }}>
            <LineChart
                width={800}
                height={380}
                margin={{ left: 60, right: 30, top: 30, bottom: 40 }}
                series={[
                    {
                        label: "New Highs",
                        data: newHighSeries,
                        curve: "natural",
                        color: "green",
                        area: true,
                    },
                    {
                        label: "New Lows",
                        data: newLowSeries,
                        curve: "natural",
                        color: "red",
                        area: true,
                    },
                ]}
                xAxis={[
                    {
                        data: timePoints,
                        label: "Time",
                        scaleType: "band",
                    },
                ]}
                yAxis={[
                    {
                        label: "Count",
                    },
                ]}
            />
        </div>
    );
}
