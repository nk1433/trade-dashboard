// src/redux/portfolioSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

import { BACKEND_URL } from '../utils/config';

// Async thunk to fetch portfolio funds from API
export const fetchPortfolioSize = createAsyncThunk(
  'portfolio/fetchPortfolioSize',
  async (_, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      const upstoxToken = auth.token;

      if (!upstoxToken) {
        return rejectWithValue('No valid Upstox token found in store');
      }

      // 2. Fetch funds using dynamic token
      const response = await axios.get('https://api.upstox.com/v2/user/get-funds-and-margin', {
        headers: {
          Authorization: `Bearer ${upstoxToken}`,
          Accept: 'application/json',
        },
      });
      if (response.data.status !== 'success') {
        return rejectWithValue('API returned error status');
      }
      // Use equity available_margin as portfolio size
      const portfolioSize = response.data.data.equity.available_margin;
      return portfolioSize;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  portfolioSize: 0,
  exitPercentage: 10,
  riskPercentage: 0.25,
  loading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    updatePortfolioSize: (state, action) => {
      state.portfolioSize = action.payload;
    },
    updateExitPercentage: (state, action) => {
      state.exitPercentage = action.payload;
    },
    updateRiskPercentage: (state, action) => {
      state.riskPercentage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPortfolioSize.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioSize.fulfilled, (state, action) => {
        state.loading = false;
        state.portfolioSize = action.payload;
      })
      .addCase(fetchPortfolioSize.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch portfolio size';
      });
  },
});

export const { updatePortfolioSize, updateExitPercentage, updateRiskPercentage } = portfolioSlice.actions;

export default portfolioSlice.reducer;
