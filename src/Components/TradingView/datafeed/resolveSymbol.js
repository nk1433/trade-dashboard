
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
      name = symbolName; // Or try to extract something better if possible
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
