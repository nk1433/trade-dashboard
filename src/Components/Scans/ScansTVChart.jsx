import React, { useEffect, useRef, useState } from 'react';
import { createChart, LineSeries, HistogramSeries } from 'lightweight-charts';
import PropTypes from 'prop-types';
import { groupScansByTimeframe } from './chartUtils';
import { Box, Typography } from '@mui/material';

const ScansTVChart = ({ scans, timeframe }) => {
    const chartContainerRef = useRef();
    const chartRef = useRef(null);

    // Extract series extraction helper
    const getSeriesData = (data, key) => {
        return data.map(item => ({
            time: item.time,
            value: item[key] || 0,
        }));
    };

    useEffect(() => {
        if (!scans || scans.length === 0 || !chartContainerRef.current) return;

        const groupedData = groupScansByTimeframe(scans, timeframe);
        
        if (groupedData.length === 0) return;

        // Clean up previous chart instance if it exists
        if (chartRef.current) {
            chartRef.current.remove();
        }

        const chart = createChart(chartContainerRef.current, {
            width: chartContainerRef.current.clientWidth,
            height: 600,
            layout: {
                textColor: 'black',
                background: { type: 'solid', color: 'white' },
                panes: {
                    separatorColor: '#f0f0f0',
                    enableResize: true,
                },
            },
            timeScale: {
                timeVisible: true,
                secondsVisible: false,
                borderColor: '#D1D4DC',
            },
            rightPriceScale: {
                borderColor: '#D1D4DC',
            },
            crosshair: {
                mode: 1, // Normal mode
            },
        });
        chartRef.current = chart;

        // We use addSeries if it supports multi-pane, or fallback to addLineSeries
        const isMultiPane = typeof chart.addSeries === 'function';

        const addLine = (key, color, label, paneIdx) => {
            let series;
            if (isMultiPane) {
                series = chart.addSeries(LineSeries, { color, lineWidth: 2, title: label }, paneIdx);
            } else {
                series = chart.addLineSeries({ color, lineWidth: 2, title: label });
            }
            series.setData(getSeriesData(groupedData, key));
            return series;
        };

        // --- Upside Series (Pane 0) ---
        addLine('up4Percent', '#00e676', '4% BO', 0); // Green
        addLine('upSltb', '#2962FF', 'SLTB BO', 0); // Blue
        addLine('upDollar', '#00BCD4', 'Dollar BO', 0); // Cyan
        addLine('newHigh', '#FFD700', 'New High', 0); // Gold

        // --- Downside Series (Pane 1) ---
        addLine('down4Percent', '#ff5252', '4% BD', 1); // Red
        addLine('downSltb', '#FF9800', 'SLTB BD', 1); // Orange
        addLine('downDollar', '#9C27B0', 'Dollar BD', 1); // Purple

        chart.timeScale().fitContent();

        const handleResize = () => {
            if (chartRef.current && chartContainerRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [scans, timeframe]);

    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, display: 'flex', gap: 3, flexWrap: 'wrap', borderBottom: '1px solid #f0f0f0', bgcolor: '#fafafa' }}>
                <Typography variant="body2"><strong>Legend:</strong></Typography>
                <Typography variant="body2" sx={{ color: '#00e676', fontWeight: 'bold' }}>4% BO</Typography>
                <Typography variant="body2" sx={{ color: '#2962FF', fontWeight: 'bold' }}>SLTB BO</Typography>
                <Typography variant="body2" sx={{ color: '#00BCD4', fontWeight: 'bold' }}>Dollar BO</Typography>
                <Typography variant="body2" sx={{ color: '#FFD700', fontWeight: 'bold' }}>New High</Typography>
                <Typography variant="body2" sx={{ color: '#ff5252', fontWeight: 'bold', ml: 2 }}>4% BD</Typography>
                <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 'bold' }}>SLTB BD</Typography>
                <Typography variant="body2" sx={{ color: '#9C27B0', fontWeight: 'bold' }}>Dollar BD</Typography>
            </Box>
            <div ref={chartContainerRef} style={{ width: '100%', flex: 1, minHeight: '600px' }} />
        </Box>
    );
};

ScansTVChart.propTypes = {
    scans: PropTypes.array.isRequired,
    timeframe: PropTypes.number.isRequired, // in minutes
};

export default ScansTVChart;
