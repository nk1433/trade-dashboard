import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { BACKEND_URL } from '../utils/config';

export const fetchUpstoxToken = createAsyncThunk(
    'auth/fetchUpstoxToken',
    async (_, { rejectWithValue }) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return rejectWithValue('No app token');

            const response = await axios.get(`${BACKEND_URL}/upstoxs/status`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (response.data.status === 'valid' && response.data.accessToken) {
                return response.data.accessToken;
            } else {
                return rejectWithValue('No valid Upstox token');
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const initialState = {
    isAuthenticated: false,
    token: null, // This is the Upstox access token
    loading: false,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.isAuthenticated = false;
            state.token = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUpstoxToken.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUpstoxToken.fulfilled, (state, action) => {
                state.loading = false;
                state.isAuthenticated = true;
                state.token = action.payload;
            })
            .addCase(fetchUpstoxToken.rejected, (state, action) => {
                state.loading = false;
                state.isAuthenticated = false;
                state.token = null;
                state.error = action.payload;
            });
    },
});

export const logoutUser = createAsyncThunk(
    'auth/logoutUser',
    async (_, { dispatch }) => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('upstox_access_token'); // Clear Upstox token too if needed for full reset
        dispatch(authSlice.actions.logout());
        // meaningful delay or immediately redirect handled by UI state change
    }
);

export const { logout } = authSlice.actions;
export default authSlice.reducer;
