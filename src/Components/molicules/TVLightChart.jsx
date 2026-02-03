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

        // --- Pane 0 (Formerly 1): 25/65 Lines (Quarter) --- 
        // Add series to Pane 0
        const p1_Up25Q = chart.addSeries(LineSeries, { color: 'green', lineWidth: 1 }, 0);
        const p1_Down25Q = chart.addSeries(LineSeries, { color: 'red', lineWidth: 1 }, 0);
        p1_Up25Q.setData(getSeriesData(sortedData, 'up25PctQuarter'));
        p1_Down25Q.setData(getSeriesData(sortedData, 'down25PctQuarter'));

        // --- Pane 1 (Formerly 2): 13/34 Lines (Yellow/Aqua) ---
        const p2_Up13_34 = chart.addSeries(LineSeries, { color: '#FFD700', lineWidth: 1 }, 1); // Gold/Yellow
        const p2_Down13_34 = chart.addSeries(LineSeries, { color: '#00FFFF', lineWidth: 1 }, 1); // Aqua
        p2_Up13_34.setData(getSeriesData(sortedData, 'up13Pct34d'));
        p2_Down13_34.setData(getSeriesData(sortedData, 'down13Pct34d'));

        // --- Pane 2 (Formerly 3): Breadth Thrust (Ratio 10d) ---
        const p3_Ratio = chart.addSeries(HistogramSeries, { color: 'gray' }, 2);
        p3_Ratio.setData(sortedData.map(item => {
            const val = item.ratio10d || 0;
            let color = 'gray';
            if (val > 2.0) color = '#c6efce'; // Light Green
            else if (val < 0.5) color = '#ffc7ce'; // Light Red
            return { time: item.date.split('T')[0], value: val, color };
        }));

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
    }, [data, visibleStartDate]);

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
