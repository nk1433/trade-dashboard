import { useEffect, useRef } from 'react';
import { createChart, HistogramSeries, LineSeries } from 'lightweight-charts';
import PropTypes from 'prop-types';
import moment from 'moment';

// Helper to get series data
const getSeriesData = (data, key) => {
    return data.map(item => ({
        time: item.date.split('T')[0],
        value: item[key] || 0,
    }));
};

export default function BreadthTwoPaneChart({ data, field, visibleStartDate }) {
    const chartRef = useRef();

    useEffect(() => {
        if (!data || data.length === 0) return;

        const chart = createChart(chartRef.current, {
            width: chartRef.current.clientWidth || 1000,
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
                borderColor: '#D1D4DC',
            },
            rightPriceScale: {
                borderColor: '#D1D4DC',
            },
        });

        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        if (field === 'fourPercentAndStrongClose') {
            // --- Pane 0: 4% Up Line + Faded Histogram ---
            const p1_Up4Line = chart.addSeries(LineSeries, { color: '#00e676', lineWidth: 2 }, 0); // Green Line for Total
            const p1_FadeHist = chart.addSeries(HistogramSeries, { color: '#ffb74d' }, 0); // Orange Histogram for Fade
            
            p1_Up4Line.setData(getSeriesData(sortedData, 'up4Percent'));
            p1_FadeHist.setData(sortedData.map(item => ({
                time: item.date.split('T')[0],
                value: Math.max(0, (item.up4Percent || 0) - (item.strongCloseUpCount || 0))
            })));

            // --- Pane 1: 4% Down Line + Faded Histogram ---
            const p2_Down4Line = chart.addSeries(LineSeries, { color: '#ff5252', lineWidth: 2 }, 1); // Red Line for Total
            const p2_FadeDownHist = chart.addSeries(HistogramSeries, { color: '#64b5f6' }, 1); // Light Blue Histogram for Fade (Recovered)
            
            p2_Down4Line.setData(getSeriesData(sortedData, 'down4Percent'));
            p2_FadeDownHist.setData(sortedData.map(item => ({
                time: item.date.split('T')[0],
                value: Math.max(0, (item.down4Percent || 0) - (item.strongCloseDownCount || 0))
            })));

            // --- Pane 2: Breadth Thrust (Ratio 5d or Intent) ---
            const p3_Ratio = chart.addSeries(HistogramSeries, { color: 'gray' }, 2);
            p3_Ratio.setData(sortedData.map(item => {
                const val = item.ratio5d || 0;
                let color = 'gray';
                if (val > 2.0) color = '#c6efce'; // Light Green
                else if (val < 0.5) color = '#ffc7ce'; // Light Red
                return { time: item.date.split('T')[0], value: val, color };
            }));
        } else {
            // --- DEFAULT VIEW (25% Qtr / 13% 34d / Ratio 10d) ---
            // --- Pane 0 (Formerly 1): 25/65 Lines (Quarter) --- 
            const p1_Up25Q = chart.addSeries(LineSeries, { color: 'green', lineWidth: 1 }, 0);
            const p1_Down25Q = chart.addSeries(LineSeries, { color: 'red', lineWidth: 1 }, 0);
            p1_Up25Q.setData(getSeriesData(sortedData, 'up25PctQuarter'));
            p1_Down25Q.setData(getSeriesData(sortedData, 'down25PctQuarter'));

            // --- Pane 1: 13/34 Lines (Yellow/Aqua) ---
            const p2_Up13_34 = chart.addSeries(LineSeries, { color: '#FFD700', lineWidth: 1 }, 1); // Gold/Yellow
            const p2_Down13_34 = chart.addSeries(LineSeries, { color: '#00FFFF', lineWidth: 1 }, 1); // Aqua
            p2_Up13_34.setData(getSeriesData(sortedData, 'up13Pct34d'));
            p2_Down13_34.setData(getSeriesData(sortedData, 'down13Pct34d'));

            // --- Pane 2: Breadth Thrust (Ratio 10d) ---
            const p3_Ratio = chart.addSeries(HistogramSeries, { color: 'gray' }, 2);
            p3_Ratio.setData(sortedData.map(item => {
                const val = item.ratio10d || 0;
                let color = 'gray';
                if (val > 2.0) color = '#c6efce'; // Light Green
                else if (val < 0.5) color = '#ffc7ce'; // Light Red
                return { time: item.date.split('T')[0], value: val, color };
            }));
        }

        // Set visible range if start date is provided, otherwise fit content
        if (visibleStartDate) {
            const endDate = sortedData[sortedData.length - 1]?.date.split('T')[0];
            chart.timeScale().setVisibleRange({
                from: visibleStartDate,
                to: endDate,
            });
        } else {
            chart.timeScale().fitContent();
        }

        return () => chart.remove();
    }, [data, visibleStartDate, field]);

    return (
        <div style={{ width: '100%', height: '100%', margin: 'auto' }}>
            <div ref={chartRef} style={{ width: '100%', height: '100%' }} />
        </div>
    );
}

BreadthTwoPaneChart.propTypes = {
    data: PropTypes.array,
    field: PropTypes.string,
    visibleStartDate: PropTypes.string,
};
