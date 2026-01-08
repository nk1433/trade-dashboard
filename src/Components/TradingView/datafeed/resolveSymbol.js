import universe from '../../../index/universe.json';

export const resolveSymbol = (
  symbolName,
  onSymbolResolvedCallback,
  onResolveErrorCallback,
  extension
) => {
  // Check for custom format: InstrumentKey|TradingSymbol (e.g., NSE_EQ|INE...|RELIANCE)
  // or just InstrumentKey (e.g., NSE_EQ|INE...)

  let ticker = symbolName;
  let name = symbolName;
  let description = symbolName;

  if (symbolName.includes('|')) {
    const parts = symbolName.split('|');
    if (parts.length >= 3) {
      // Format: Exchange|Token|Name
      ticker = `${parts[0]}|${parts[1]}`; // Instrument Key for API
      name = parts[2]; // Display Name
      description = parts[2];
    } else {
      // Format: Exchange|Token (fallback if no name provided)
      ticker = symbolName;

      // Try to resolve name from our indices if possible
      const allScripts = universe;
      const found = allScripts.find(s => s.instrument_key === symbolName);

      if (found) {
        name = found.tradingsymbol;
        description = found.name;
      } else {
        name = symbolName;
      }
    }
  } else {
    // Try to find the symbol in our local indices to get the correct Instrument Key
    const allScripts = universe;
    const found = allScripts.find(s => s.tradingsymbol === symbolName || s.name === symbolName);
    if (found) {
      ticker = found.instrument_key;
      name = found.tradingsymbol;
      description = found.name || found.tradingsymbol;
    }
  }

  const symbolInfo = {
    ticker: ticker,
    name: name,
    description: description,
    type: 'stock',
    session: "24x7", // Upstox market hours are different, but for now keep it open
    timezone: "Asia/Kolkata",
    minmov: 1,
    pricescale: 100,
    has_intraday: true,
    has_no_volume: false,
    has_weekly_and_monthly: true,
    supported_intervals: ["1D"],
    volume_precision: 2,
    data_status: "streaming",
  };

  onSymbolResolvedCallback(symbolInfo);
};
