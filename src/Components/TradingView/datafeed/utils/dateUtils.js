export const getISTDate = (timestamp) => {
    const date = new Date(timestamp + (5.5 * 60 * 60 * 1000));
    return date.toISOString().split('T')[0];
};

export const resolveResolution = (resolution) => {
    const resNum = parseInt(resolution);

    if (['1D', 'D'].includes(resolution)) return { category: "days", value: "1" };
    if (['1W', 'W'].includes(resolution)) return { category: "weeks", value: "1" };
    if (['1M', 'M'].includes(resolution)) return { category: "months", value: "1" };

    if (!isNaN(resNum)) {
        if (resNum === 60) return { category: "hours", value: "1" };
        return { category: "minutes", value: resolution };
    }

    return { category: "days", value: "1" };
};

export const adjustDailyBarTime = (originalTime, resolution, dateStr) => {
    const isDaily = ['1D', 'D', '1W', 'W', '1M', 'M'].includes(resolution);
    if (isDaily) {
        // Set to 09:15 IST (03:45 UTC) to ensure consistent TV rendering
        return new Date(`${dateStr}T03:45:00Z`).getTime();
    }
    return originalTime;
};
