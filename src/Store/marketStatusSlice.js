
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import moment from 'moment';

// Constants
const UPSTOX_API_BASE = 'https://api.upstox.com/v2/market';

// Async Thunks
export const fetchMarketTimings = createAsyncThunk(
    'marketStatus/fetchTimings',
    async (_, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            const token = auth.token;

            if (!token) return rejectWithValue('No auth token available');

            const today = moment().format('YYYY-MM-DD');
            const response = await axios.get(`${UPSTOX_API_BASE}/timings/${today}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                return response.data.data.filter(t => t.exchange === 'NSE');
            } else {
                return rejectWithValue('Failed to fetch timings');
            }
        } catch (error) {
            console.error('Error fetching market timings:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

export const fetchHolidays = createAsyncThunk(
    'marketStatus/fetchHolidays',
    async (_, { rejectWithValue, getState }) => {
        try {
            const { auth } = getState();
            const token = auth.token;

            if (!token) return rejectWithValue('No auth token available');

            const response = await axios.get(`${UPSTOX_API_BASE}/holidays`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.data.status === 'success') {
                return response.data.data;
            } else {
                return rejectWithValue('Failed to fetch holidays');
            }
        } catch (error) {
            console.error('Error fetching holidays:', error);
            return rejectWithValue(error.response?.data?.message || error.message);
        }
    }
);

const initialState = {
    timings: [], // Today's exchange timings
    // holidays: [], // REMOVED: List of holidays (optimization)
    isLoading: false,
    error: null,
    marketStatus: 'UNKNOWN', // 'OPEN', 'CLOSED'
    todayHoliday: null, // If today is a holiday, this will contain the holiday object
};

const marketStatusSlice = createSlice({
    name: 'marketStatus',
    initialState,
    reducers: {
        updateMarketStatus: (state) => {
            const now = moment();
            // Default to checking NSE for general market status
            const nseTiming = state.timings.find(t => t.exchange === 'NSE');

            if (state.todayHoliday) {
                // Check if it's a complete holiday for NSE
                const isClosed = state.todayHoliday.closed_exchanges.includes('NSE');
                const isOpenOverride = state.todayHoliday.open_exchanges.find(e => e.exchange === 'NSE');

                if (isClosed && !isOpenOverride) {
                    state.marketStatus = 'CLOSED';
                    return;
                }

                // Handle special trading hours on a holiday (e.g., Mahurat Trading)
                if (isOpenOverride) {
                    const start = moment(isOpenOverride.start_time);
                    const end = moment(isOpenOverride.end_time);
                    state.marketStatus = now.isBetween(start, end) ? 'OPEN' : 'CLOSED';
                    return;
                }
            }

            if (nseTiming) {
                const start = moment(nseTiming.start_time);
                const end = moment(nseTiming.end_time);
                state.marketStatus = now.isBetween(start, end) ? 'OPEN' : 'CLOSED';
            } else {
                // If no timing data and not a known holiday, assume closed or check standard hours (fallback)
                // Standard NSE Input: 9:15 AM - 3:30 PM (approx)
                const todayStart = moment().hour(9).minute(15);
                const todayEnd = moment().hour(15).minute(30);
                if (now.day() === 0 || now.day() === 6) {
                    state.marketStatus = 'CLOSED'; // Weekend
                } else {
                    state.marketStatus = now.isBetween(todayStart, todayEnd) ? 'OPEN' : 'CLOSED';
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // TIMINGS
            .addCase(fetchMarketTimings.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchMarketTimings.fulfilled, (state, action) => {
                state.isLoading = false;
                state.timings = action.payload;
                // Immediate status check
                marketStatusSlice.caseReducers.updateMarketStatus(state);
            })
            .addCase(fetchMarketTimings.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            })
            // HOLIDAYS
            .addCase(fetchHolidays.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchHolidays.fulfilled, (state, action) => {
                state.isLoading = false;
                // We do not store the full list of holidays as per user request
                // state.holidays = action.payload; 

                // Check if today is a holiday
                const todayStr = moment().format('YYYY-MM-DD');
                const holiday = action.payload.find(h => h.date === todayStr);
                console.log('action', action.payload, todayStr)

                if (holiday) {
                    const isNSEClosed = holiday.closed_exchanges.includes('NSE');
                    const isNSEOpenSpecial = holiday.open_exchanges.some(e => e.exchange === 'NSE');

                    if (isNSEClosed && !isNSEOpenSpecial) {
                        state.todayHoliday = holiday;
                    } else if (isNSEOpenSpecial) {
                        // It's a "holiday" but trading happens (Special session)
                        state.todayHoliday = holiday; // Still mark as holiday for banner, but status might be OPEN
                    }
                } else {
                    state.todayHoliday = null;
                }
                marketStatusSlice.caseReducers.updateMarketStatus(state);
            })
            .addCase(fetchHolidays.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload;
            });
    }
});

export const { updateMarketStatus } = marketStatusSlice.actions;
export default marketStatusSlice.reducer;
