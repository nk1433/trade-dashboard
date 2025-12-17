import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    capital: 100000, // 1 Lakh initial capital
    holdings: [], // Array of { symbol, quantity, avgPrice, ltp, pnl, invested, currentValue }
    orders: [], // Array of { id, symbol, type, quantity, price, timestamp, status }
};

const paperTradeSlice = createSlice({
    name: "paperTrade",
    initialState,
    reducers: {
        executePaperOrder: (state, action) => {
            const { symbol, quantity, price, type, timestamp } = action.payload;
            const totalCost = quantity * price;

            if (type === 'BUY') {
                if (state.capital >= totalCost) {
                    state.capital -= totalCost;

                    // Add to orders
                    state.orders.push({
                        id: Date.now(),
                        symbol,
                        type,
                        quantity,
                        price,
                        timestamp,
                        status: 'EXECUTED'
                    });

                    // Update holdings
                    const existingHolding = state.holdings.find(h => h.symbol === symbol);
                    if (existingHolding) {
                        const totalQuantity = existingHolding.quantity + quantity;
                        const totalInvested = (existingHolding.quantity * existingHolding.avgPrice) + totalCost;
                        existingHolding.quantity = totalQuantity;
                        existingHolding.avgPrice = totalInvested / totalQuantity;
                        existingHolding.invested = totalInvested;
                    } else {
                        state.holdings.push({
                            symbol,
                            quantity,
                            avgPrice: price,
                            invested: totalCost,
                            ltp: price, // Initial LTP is buy price
                            currentValue: totalCost,
                            pnl: 0,
                            pnlPercentage: 0
                        });
                    }
                } else {
                    // Insufficient funds logic (could be handled in UI or here)
                    console.warn("Insufficient funds for paper trade");
                }
            }
            // Implement SELL logic later if needed
        },
        updatePaperHoldingsLTP: (state, action) => {
            // action.payload is a map of symbol -> ltp
            const ltpMap = action.payload;

            state.holdings.forEach(holding => {
                if (ltpMap[holding.symbol]) {
                    holding.ltp = ltpMap[holding.symbol];
                    holding.currentValue = holding.quantity * holding.ltp;
                    holding.pnl = holding.currentValue - holding.invested;
                    holding.pnlPercentage = (holding.pnl / holding.invested) * 100;
                }
            });
        },
        resetPaperAccount: (state) => {
            state.capital = 100000;
            state.holdings = [];
            state.orders = [];
        },
        setPaperCapital: (state, action) => {
            state.capital = action.payload;
        }
    },
});

export const { executePaperOrder, updatePaperHoldingsLTP, resetPaperAccount, setPaperCapital } = paperTradeSlice.actions;
export default paperTradeSlice.reducer;
