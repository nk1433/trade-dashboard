import axios from "axios";

const BASE_URL = "https://api.upstox.com/v3/historical-candle";

export const fetchHistoricalData = async (instrumentKey, category, value, fromDate, toDate) => {
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `${BASE_URL}/${encodedKey}/${category}/${value}/${toDate}/${fromDate}`;

    // console.log(`[ApiService] Fetching Historical: ${url}`);

    return axios.get(url, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`
        }
    });
};

export const fetchIntradayData = async (instrumentKey, category, value) => {
    const encodedKey = encodeURIComponent(instrumentKey);
    const url = `${BASE_URL}/intraday/${encodedKey}/${category}/${value}`;

    // console.log(`[ApiService] Fetching Intraday: ${url}`);

    return axios.get(url, {
        headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_UPSTOXS_ACCESS_KEY}`
        }
    });
};
