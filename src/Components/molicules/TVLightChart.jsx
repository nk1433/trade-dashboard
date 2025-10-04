import React, { useEffect, useRef } from 'react';
import { createChart, HistogramSeries } from 'lightweight-charts';
export default function BreadthTwoPaneChart({ data }) {
    const chartRef = useRef();

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

        const upSeries = chart.addSeries(HistogramSeries, {
            color: 'green',
            priceFormat: { type: 'volume' },
        }, 0);
        upSeries.setData(
            data.map(item => ({
                time: item.date,
                value: item.up4Percent,
            }))
        );

        const downSeries = chart.addSeries(HistogramSeries, {
            color: 'red',
            priceFormat: { type: 'volume' },
        }, 1);
        downSeries.setData(
            data.map(item => ({
                time: item.date,
                value: item.down4Percent,
            }))
        );
        chart.panes()[0].setHeight(250);
        chart.panes()[1].setHeight(250);
        chart.timeScale().fitContent();

        return () => chart.remove();
    }, [data]);

    return (
        <div style={{ width: '1000px', margin: 'auto' }}>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 12, marginTop: 12 }}>
                Stocks Up ≥ 4% (Daily)
            </div>
            <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: 24, marginTop: 12 }}>
                Stocks Down ≤ -4% (Daily)
            </div>
            <div ref={chartRef} />
        </div>
    );
}
