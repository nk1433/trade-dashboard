import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from 'axios';
import { BACKEND_URL } from '../utils/config';

// Async Thunks

// Place a paper order (persisted in backend)
export const executePaperOrder = createAsyncThunk(
    'paperTrade/executePaperOrder',
    async (orderData, { rejectWithValue }) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error('User not found');
            const user = JSON.parse(userStr);

            const response = await axios.post(`${BACKEND_URL}/api/paper-trade/place-order`, {
                ...orderData,
                userId: user.id || user._id
            });
            return response.data.data; // Returns { trade, portfolio }
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

// Fetch paper trades and portfolio state
export const fetchPaperTradesAsync = createAsyncThunk(
    'paperTrade/fetchPaperTrades',
    async (_, { rejectWithValue }) => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) throw new Error('User not found');
            const user = JSON.parse(userStr);

            const [tradesResponse, portfolioResponse] = await Promise.all([
                axios.get(`${BACKEND_URL}/api/paper-trade/trades`, { params: { userId: user.id || user._id } }),
                axios.get(`${BACKEND_URL}/api/paper-trade/portfolio`, { params: { userId: user.id || user._id } })
            ]);

            return {
                trades: tradesResponse.data.data,
                portfolio: portfolioResponse.data.data
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.error || error.message);
        }
    }
);

const initialState = {
    capital: 1000000, // Default, will be updated from backend
    holdings: [],
    orders: [],
    loading: false,
    error: null,
};

const paperTradeSlice = createSlice({
    name: "paperTrade",
    initialState,
    reducers: {
        updatePaperHoldingsLTP: (state, action) => {
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
            state.capital = 1000000;
            state.holdings = [];
            state.orders = [];
        },
        setPaperCapital: (state, action) => {
            state.capital = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Execute Order
            .addCase(executePaperOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(executePaperOrder.fulfilled, (state, action) => {
                state.loading = false;
                const { trade, portfolio } = action.payload;

                // Update capital and holdings from backend response
                state.capital = portfolio.capital;
                state.holdings = portfolio.holdings.map(h => {
                    // Preserve existing LTP/PnL calculations if available, or initialize
                    const existing = state.holdings.find(eh => eh.symbol === h.symbol);
                    return {
                        ...h,
                        ltp: existing ? existing.ltp : h.avgPrice,
                        currentValue: existing ? (h.quantity * existing.ltp) : h.invested,
                        pnl: existing ? ((h.quantity * existing.ltp) - h.invested) : 0,
                        pnlPercentage: existing ? (((h.quantity * existing.ltp) - h.invested) / h.invested * 100) : 0
                    };
                });

                // Add new trade to orders list
                state.orders.unshift({
                    id: trade._id,
                    ...trade
                });
            })
            .addCase(executePaperOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // Fetch Trades & Portfolio
            .addCase(fetchPaperTradesAsync.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchPaperTradesAsync.fulfilled, (state, action) => {
                state.loading = false;
                const { trades, portfolio } = action.payload;

                state.capital = portfolio.capital;
                state.orders = trades.map(t => ({ id: t._id, ...t }));

                // Merge fetched holdings with current state (to keep LTP updates if any)
                // But initially, just load them. LTP updates come from socket/polling.
                state.holdings = portfolio.holdings.map(h => ({
                    ...h,
                    ltp: h.avgPrice, // Default to avgPrice until next LTP update
                    currentValue: h.invested,
                    pnl: 0,
                    pnlPercentage: 0
                }));
            })
            .addCase(fetchPaperTradesAsync.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const { updatePaperHoldingsLTP, resetPaperAccount, setPaperCapital } = paperTradeSlice.actions;
export const { savePaperTradeAsync } = paperTradeSlice.actions; // Deprecated but kept for export compatibility if needed
export default paperTradeSlice.reducer;
