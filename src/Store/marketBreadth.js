import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch market breadth data
export const fetchMarketBreadth = createAsyncThunk(
  'marketBreadth/fetchMarketBreadth',
  async () => {
    // TODO: Use environment variable for base URL
    const env = import.meta.env.VITE_ENV;
    const baseUrl = env === 'DEV' ? 'http://localhost:3015' : import.meta.env.VITE_PROD_HOST;
    const response = await axios.get(`${baseUrl}/market-breadth`);
    return response.data.data || [];
  }
);

export const syncMarketBreadthData = createAsyncThunk(
  'marketBreadth/syncMarketBreadthData',
  async (fullSync = false, { dispatch }) => {
    const env = import.meta.env.VITE_ENV;
    const baseUrl = env === 'DEV' ? 'http://localhost:3015' : import.meta.env.VITE_PROD_HOST;
    const response = await axios.post(`${baseUrl}/sync-52week-marketbreath?fullSync=${fullSync}`);
    dispatch(fetchMarketBreadth()); // Refresh data after sync
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
