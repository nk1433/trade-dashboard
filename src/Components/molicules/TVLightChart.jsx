import React, { useEffect, useRef } from 'react';
import { createChart, HistogramSeries } from 'lightweight-charts';
import { CrosshairMode } from 'lightweight-charts';
import { LineStyle } from 'lightweight-charts';

// Example data: array of { date: 'YYYY-MM-DD', up4Percent: n, down4Percent: n }
export default function MarketBreadthChart({ data, seriesKey = 'up4Percent', barColor = 'green', title = '' }) {
    const chartRef = useRef();

    useEffect(() => {
        const chart = createChart(chartRef.current, {
            width: 1000,
            height: 350,
            timeScale: { timeVisible: true, secondsVisible: false }
        });

        // Prepare histogram data
        const histoSeriesData = data
            .slice()
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(item => ({ time: item.date, value: item[seriesKey] }));

        // Add the histogram series
        const histogramSeries = chart.addSeries(HistogramSeries, {
            color: barColor,
            width: 1000,
            height: 350,
            crosshair: {
                mode: CrosshairMode.Normal,
                vertLine: {
                    visible: true,
                    style: LineStyle.Dashed,
                    width: 1,
                    color: 'rgba(197, 203, 206, 0.8)',
                },
                horzLine: {
                    visible: true,
                    style: LineStyle.Dashed,
                    width: 1,
                    color: 'rgba(197, 203, 206, 0.8)',
                },
            },
            handleScroll: {
                mouseWheel: true,
                pressedMouseMove: true,
            },
            handleScale: {
                axisPressedMouseMove: true,
                mouseWheel: true,
                pinch: true,
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
            },
        });
        histogramSeries.setData(histoSeriesData);

        // Clean up
        return () => chart.remove();
    }, [data, seriesKey, barColor]);

    return (
        <div style={{ width: '1000px', margin: 'auto', marginBottom: 32 }}>
            {title && <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 8 }}>{title}</div>}
            <div ref={chartRef} />
        </div>
    );
}
