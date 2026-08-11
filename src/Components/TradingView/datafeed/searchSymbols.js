// Debounce map: pending timers per query
let _searchTimer = null;

const UPSTOX_SEARCH_URL = 'https://api.upstox.com/v2/instruments/search';

/**
 * Map Upstox segment to TradingView exchange label
 */
const segmentToExchange = (segment = '') => {
    if (segment.startsWith('BSE')) return 'BSE';
    if (segment.startsWith('NSE_FO') || segment.startsWith('NFO')) return 'NFO';
    return 'NSE';
};

/**
 * Map Upstox instrument_type to TradingView type
 */
const instrumentTypeToTVType = (type = '') => {
    switch (type.toUpperCase()) {
        case 'EQ':
        case 'A':
        case 'B':
        case 'SM':
            return 'stock';
        case 'FUTSTK':
        case 'FUTIDX':
            return 'futures';
        case 'OPTSTK':
        case 'OPTIDX':
            return 'option';
        case 'IDX':
            return 'index';
        default:
            return 'stock';
    }
};

export const searchSymbols = (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback
) => {
    // Clear any pending search
    if (_searchTimer) clearTimeout(_searchTimer);

    // Minimum 2 characters to search
    if (!userInput || userInput.trim().length < 2) {
        onResultReadyCallback([]);
        return;
    }

    _searchTimer = setTimeout(async () => {
        try {
            const token = import.meta.env.VITE_UPSTOXS_ANALYTICS_TOKEN;
            console.log('analytics token', token)
            const params = new URLSearchParams({
                query: userInput.trim(),
                page_number: 1,
                records: 30,
            });

            const response = await fetch(`${UPSTOX_SEARCH_URL}?${params}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                console.warn('[SearchSymbols] Upstox search failed, falling back to local', response.status);
                onResultReadyCallback([]);
                return;
            }

            const data = await response.json();

            if (data.status !== 'success' || !Array.isArray(data.data)) {
                onResultReadyCallback([]);
                return;
            }

            const results = data.data.map(item => ({
                // 'symbol' is what TradingView passes back to resolveSymbol — use instrument_key so we can chart it
                symbol: item.instrument_key,
                full_name: `${item.instrument_key}|${item.trading_symbol}`,
                description: item.name || item.trading_symbol,
                exchange: segmentToExchange(item.segment),
                ticker: item.instrument_key,
                type: instrumentTypeToTVType(item.instrument_type),
            }));

            onResultReadyCallback(results);
        } catch (err) {
            console.error('[SearchSymbols] Error fetching from Upstox:', err);
            onResultReadyCallback([]);
        }
    }, 350); // 350ms debounce
};
