import { adjustDailyBarTime } from './dateUtils';

export const transformCandle = (candle, resolution) => {
    if (!Array.isArray(candle) || candle.length < 6) return null;

    const [timestampStr, open, high, low, close, volume] = candle;
    const dateStr = timestampStr.split('T')[0];
    const rawTime = new Date(timestampStr).getTime();

    return {
        time: adjustDailyBarTime(rawTime, resolution, dateStr),
        open,
        high,
        low,
        close,
        volume
    };
};

export const isValidResponse = (response) => {
    return response?.data?.status === "success" && Array.isArray(response?.data?.data?.candles);
};
