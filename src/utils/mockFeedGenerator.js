// Helper to generate a random number between min and max
const random = (min, max) => Math.random() * (max - min) + min;

// Helper to generate a random walk price update
const getNextPrice = (currentPrice, volatility = 0.002) => {
    const change = currentPrice * volatility * random(-1, 1);
    return currentPrice + change;
};

// Mimics the Upstox Feed Response Structure
export const generateMockFeed = (currentPrices, scriptMap) => {
    const feeds = {};

    Object.keys(currentPrices).forEach(instrumentKey => {
        const prevPrice = currentPrices[instrumentKey];
        const newPrice = getNextPrice(prevPrice);

        // Update the current price map for next iteration (mutation is intended here for state persistence in hook)
        currentPrices[instrumentKey] = newPrice;

        const script = scriptMap[instrumentKey];
        // Mock OHLC data
        // For simplicity, we'll just use the new price for close, and slightly varied values for others
        const open = prevPrice;
        const high = Math.max(open, newPrice) * (1 + random(0, 0.001));
        const low = Math.min(open, newPrice) * (1 - random(0, 0.001));
        const close = newPrice;
        const vol = Math.floor(random(10000, 500000)); // Random volume

        feeds[instrumentKey] = {
            fullFeed: {
                marketFF: {
                    marketOHLC: {
                        ohlc: [
                            {
                                interval: '1d',
                                open,
                                high,
                                low,
                                close,
                                vol,
                                ts: Date.now()
                            },
                            {
                                interval: 'I1', // 1 Minute candle
                                open,
                                high,
                                low,
                                close,
                                vol: Math.floor(vol / 100), // Approx 1% of daily volume
                                ts: Date.now()
                            }
                        ]
                    },
                    ltpc: {
                        ltp: close,
                        cp: close // Close price
                    }
                }
            }
        };
    });

    return {
        feeds,
        type: 1 // Mimic the 'type' used in useMarketDataSocket
    };
};
