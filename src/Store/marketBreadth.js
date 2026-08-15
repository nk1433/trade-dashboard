import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch market breadth data
export const fetchMarketBreadth = createAsyncThunk(
  'marketBreadth/fetchMarketBreadth',
  async () => {
    // TODO: Use environment variable for base URL
    const env = import.meta.env.VITE_ENV;
    const baseUrl = env === 'DEV' ? 'http://localhost:3015' : import.meta.env.VITE_PROD_HOST;
    const token = localStorage.getItem('token');
    const response = await axios.get(`${baseUrl}/market-breadth`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data || [];
  }
);

export const syncMarketBreadthData = createAsyncThunk(
  'marketBreadth/syncMarketBreadthData',
  async (fullSync = false, { dispatch }) => {
    const env = import.meta.env.VITE_ENV;
    const baseUrl = env === 'DEV' ? 'http://localhost:3015' : import.meta.env.VITE_PROD_HOST;
    const token = localStorage.getItem('token');
    const response = await axios.post(`${baseUrl}/sync-52week-marketbreath?fullSync=${fullSync}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    dispatch(fetchMarketBreadth()); // Refresh data after sync
    return response.data;
  }
);

// Intraday sync — calls the public 30-min intraday API, no upstream auth needed
export const syncIntradayMarketBreadthData = createAsyncThunk(
  'marketBreadth/syncIntradayMarketBreadthData',
  async (_, { dispatch }) => {
    const env = import.meta.env.VITE_ENV;
    const baseUrl = env === 'DEV' ? 'http://localhost:3015' : import.meta.env.VITE_PROD_HOST;
    const token = localStorage.getItem('token');
    const response = await axios.post(`${baseUrl}/sync-intraday-market-breadth`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    dispatch(fetchMarketBreadth()); // Refresh table after intraday sync
    return response.data;
  }
);

const marketBreadthSlice = createSlice({
  name: 'marketBreadth',
  initialState: {
    data: []
  },
  reducers: {
    clearMarketBreadth: (state) => {
      state.data = [];
    }
  },
  extraReducers: (builder) => {
    builder.addCase(fetchMarketBreadth.fulfilled, (state, action) => {
      state.data = action.payload;
    });
  },
});

export const { clearMarketBreadth } = marketBreadthSlice.actions;

export default marketBreadthSlice.reducer;
