import React, { useEffect, useRef, useState } from 'react';
import { CandlestickSeries, createChart, HistogramSeries, createTextWatermark } from 'lightweight-charts';
import moment from 'moment';
import { useWatchlistFilter } from '../../hooks/useWatchlistFilter';
import WatchlistFilterForm from './WatchlistFilterForm';

const ChartDashboard = () => {
    const chartRef = useRef();
    const seriesRef = useRef();
    const volumeSeriesRef = useRef();
    const watermarkRef = useRef();
    const { selectedIndex, handleSelectionChange, scriptsToShow, counts } = useWatchlistFilter();

    const [loading, setLoading] = useState(false);
    const [selectedStockKey, setSelectedStockKey] = useState(null);
    const [selectedStockName, setSelectedStockName] = useState(null);

    // Convert filtered scripts object into array for stock list
    const dynamicStockList = Object.values(scriptsToShow);

    // Set initial selected stock on scripts change
    useEffect(() => {
        if (dynamicStockList.length > 0) {
            setSelectedStockKey(dynamicStockList[0].key);
        }
    }, [dynamicStockList]);

    // Fetch OHLC data for selected stock
    const fetchOHLC = async (stockKey) => {
        setLoading(true);
        const endDate = moment().format('YYYY-MM-DD');
        const startDate = moment().subtract(2, 'years').format('YYYY-MM-DD');
        const url = `https://api.upstox.com/v3/historical-candle/${stockKey}/days/1/${endDate}/${startDate}`;
        const res = await fetch(url);
        const json = await res.json();

        const convertTimestampToTimeObj = (ts) => {
            const d = new Date(ts);
            return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
        };

        const candles = json.data.candles
            .map(c => ({
                time: convertTimestampToTimeObj(c[0]),
                open: c[1],
                high: c[2],
                low: c[3],
                close: c[4],
                volume: c[5],
            }))
            .sort((a, b) => {
                const dateA = new Date(a.time.year, a.time.month - 1, a.time.day);
                const dateB = new Date(b.time.year, b.time.month - 1, b.time.day);
                return dateA - dateB;
            });

        // Prepare volume data with color indicating up/down candle
        const volumeData = candles.map(c => ({
            time: c.time,
            value: c.volume,
            color: c.close > c.open ? '#26a69a' : '#ef5350',
        }));

        if (volumeSeriesRef.current) {
            volumeSeriesRef.current.setData(volumeData);
        }

        setLoading(false);
        return candles;
    };

    // Initialize chart on mount
    useEffect(() => {
        const chart = createChart(chartRef.current, {
            layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },
            rightPriceScale: {
                borderVisible: false,
            },
        });
        const watermark = createTextWatermark(chart.panes()[0], {
            horzAlign: 'left',
            vertAlign: 'top',
        });
        watermarkRef.current = watermark;

        const series = chart.addSeries(CandlestickSeries, {
            upColor: '#ffffff',
            downColor: '#000000',
            borderVisible: true,
            wickUpColor: '#000000',
            wickDownColor: '#000000',
            borderColor: '#000000',
        });
        seriesRef.current = series;

        const volumeSeries = chart.addSeries(HistogramSeries, {
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '', // set as an overlay by setting a blank priceScaleId
        });
        volumeSeries.priceScale().applyOptions({
            // set the positioning of the volume series
            scaleMargins: {
                top: 0.7, // highest point of the series will be 70% away from the top
                bottom: 0,
            },
        });
        volumeSeriesRef.current = volumeSeries;

        chart.timeScale().fitContent();

        return () => chart.remove();
    }, []);

    // Update chart data on selectedStockKey change
    useEffect(() => {
        if (!selectedStockKey) return;
        fetchOHLC(selectedStockKey).then(candles => {
            if (seriesRef.current) {
                watermarkRef.current.applyOptions({
                    lines: [
                        {
                            text: selectedStockName,
                            color: 'rgba(0, 0, 0, 0.5)',
                            fontSize: 24,
                        },
                    ]
                });
                seriesRef.current.setData(candles);
            }
        });
    }, [selectedStockKey, selectedStockName]);

    return (
        <>
            <WatchlistFilterForm
                selectedIndex={selectedIndex}
                handleSelectionChange={handleSelectionChange}
                counts={counts}
            />
            <div style={{ display: 'flex', height: '100vh' }}>
                <div style={{ flex: 1, padding: 24 }}>
                    <div ref={chartRef} style={{ width: '100%', height: 450 }} />
                    {loading && <p>Loading chart data...</p>}
                </div>
                <div
                    style={{
                        width: 280,
                        borderLeft: '1px solid #eee',
                        background: '#f7f7f7',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: 20,
                        overflowY: 'auto',
                    }}
                >
                    <h3>Stocks</h3>
                    {dynamicStockList.map(stock => (
                        <button
                            key={stock.key}
                            onClick={() => {
                                setSelectedStockKey(stock.instrumentKey);
                                setSelectedStockName(stock.symbol);
                            }}
                        >
                            {stock.symbol}
                        </button>
                    ))}
                </div>
            </div>
        </>

    );
};

export default ChartDashboard;
