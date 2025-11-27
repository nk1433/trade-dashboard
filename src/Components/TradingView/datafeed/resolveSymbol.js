
export const resolveSymbol = (
  symbolName,
  onSymbolResolvedCallback,
  onResolveErrorCallback,
  extension
) => {
  // For now, we accept the symbol name as is.
  // In a real app, we should validate if the symbol exists in our map.
  // The symbolName passed here comes from the widget configuration or search.

  // If the symbol is "USDT" (default from our previous code), let's switch to a valid Upstox instrument key for testing
  // Example: NSE_EQ|INE002A01018 (Reliance) or similar.
  // But better to just use what is passed if it looks like an instrument key.

  const symbolInfo = {
    ticker: symbolName,
    name: symbolName,
    description: symbolName,
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
