import universe from '../../../index/universe.json';

const allScripts = universe;

export const searchSymbols = (
    userInput,
    exchange,
    symbolType,
    onResultReadyCallback
) => {
    const query = userInput.toLowerCase();

    const results = allScripts.filter(script => {
        return (
            script.tradingsymbol.toLowerCase().includes(query) ||
            (script.name && script.name.toLowerCase().includes(query))
        );
    }).map(script => ({
        symbol: script.instrument_key,
        full_name: script.instrument_key, // or script.tradingsymbol if preferred
        description: script.name || script.tradingsymbol,
        exchange: 'NSE', // Assuming NSE based on file names, adjust if needed
        ticker: script.instrument_key,
        type: 'stock'
    }));

    onResultReadyCallback(results);
};
