export const calculateStockMetrics = (script, stats, orderMetrics) => {
    const key = script.instrument_key;
    const stockStats = stats[key] || {};
    const metric = orderMetrics[key] || {};

    const currentVolume = metric.dayVolume || metric.volume || stockStats.volume || 0;
    const avgVol21d = stockStats.avgVolume21d || 0;
    const prevDayVol = stockStats.prevDayVolume || 0;
    const minVol3d = stockStats.minVolume3d || 0;
    const ltp = metric.ltp || stockStats.lastPrice || 0;

    if (avgVol21d <= 0) return null;

    return {
        symbol: script.tradingsymbol,
        ltp,
        currentVolume,
        volumeChange: ((currentVolume - avgVol21d) / avgVol21d) * 100,
        volChangePrevDay: prevDayVol > 0 ? ((currentVolume - prevDayVol) / prevDayVol) * 100 : 0,
        volChangeMin3d: minVol3d > 0 ? ((currentVolume - minVol3d) / minVol3d) * 100 : 0,
    };
};

export const prepareIndustryData = (universe, stats, orderMetrics) => {
    const grouped = universe.reduce((acc, script) => {
        const metric = calculateStockMetrics(script, stats, orderMetrics);
        if (!metric) return acc;

        const industry = script.industry || 'Unknown';

        if (!acc[industry]) {
            acc[industry] = {
                industry,
                totalVolume: 0,
                totalVolumeChange: 0,
                count: 0,
                stocks: []
            };
        }

        acc[industry].totalVolume += metric.currentVolume;
        acc[industry].totalVolumeChange += metric.volumeChange;
        acc[industry].count += 1;
        acc[industry].stocks.push(metric);

        return acc;
    }, {});

    return Object.values(grouped).map(group => {
        const avgVolumeChange = group.totalVolumeChange / group.count;
        // Sort stocks by magnitude of volume change (impact)
        const sortedStocks = [...group.stocks].sort((a, b) => Math.abs(b.volumeChange) - Math.abs(a.volumeChange));

        return {
            ...group,
            avgVolumeChange,
            stocks: sortedStocks
        };
    });
};

export const getSortedIndustries = (industries, mode = 'SURGE') => {
    if (mode === 'SURGE') {
        // Exhibit A: Top Gainers (Descending)
        return [...industries]
            .filter(i => i.avgVolumeChange > 0)
            .sort((a, b) => b.avgVolumeChange - a.avgVolumeChange)
            .slice(0, 50);
    } else {
        // Exhibit B: Top Losers (Ascending)
        return [...industries]
            .filter(i => i.avgVolumeChange < 0)
            .sort((a, b) => a.avgVolumeChange - b.avgVolumeChange)
            .slice(0, 50);
    }
};
