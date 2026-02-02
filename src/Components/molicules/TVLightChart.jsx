import { useEffect, useRef } from 'react';
import { createChart, HistogramSeries } from 'lightweight-charts';
import PropTypes from 'prop-types';
import moment from 'moment';

const mapping = {
    fourPercentage: ['up4Percent', 'down4Percent'],
    eightPercentage: ['up8Pct5d', 'down8Pct5d'],
    twentyPercentage: ['up20Pct5d', 'down20Pct5d'],
}

export default function BreadthTwoPaneChart({ data, field, visibleStartDate }) {
    const chartRef = useRef();
    const [upSideColumn, downSideColumn] = mapping[field];

    useEffect(() => {
        const chart = createChart(chartRef.current, {
            width: 1000,
            height: 550,
            layout: {
                textColor: 'black',
                background: { type: 'solid', color: 'white' },
                panes: {
                    separatorColor: '#f22c3d',
                    separatorHoverColor: 'rgba(255, 0, 0, 0.1)',
                    enableResize: false,
                },
            },
        });

        const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

        const upSeries = chart.addSeries(HistogramSeries, {
            color: 'green',
            priceFormat: { type: 'volume' },
        }, 0);
        upSeries.setData(
            sortedData.map(item => ({
                time: item.date.split('T')[0],
                value: item[upSideColumn],
            }))
        );

        const downSeries = chart.addSeries(HistogramSeries, {
            color: 'red',
            priceFormat: { type: 'volume' },
        }, 1);
        downSeries.setData(
            sortedData.map(item => ({
                time: item.date.split('T')[0],
                value: item[downSideColumn],
            }))
        );
        chart.panes()[0].setHeight(250);
        chart.panes()[1].setHeight(250);

        // Set visible range if start date is provided, otherwise fit content
        if (visibleStartDate) {
            const endDate = sortedData[sortedData.length - 1]?.date.split('T')[0];
            // Ensure visibleStartDate matches format YYYY-MM-DD calling logic should ensure this
            chart.timeScale().setVisibleRange({
                from: visibleStartDate,
                to: endDate,
            });
        } else {
            chart.timeScale().fitContent();
        }

        return () => chart.remove();
    }, [data, upSideColumn, downSideColumn, visibleStartDate]);

    return (
        <div style={{ width: '1000px', margin: 'auto' }}>
            <div ref={chartRef} />
        </div>
    );
}

BreadthTwoPaneChart.propTypes = {
    data: PropTypes.array,
    field: PropTypes.string,
    visibleStartDate: PropTypes.string,
};
