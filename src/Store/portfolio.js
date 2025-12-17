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

// Async thunk to fetch user settings from backend
export const fetchUserSettings = createAsyncThunk(
  'portfolio/fetchUserSettings',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('No valid token found');
      }

      const response = await axios.get(`${BACKEND_URL}/settings`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        return rejectWithValue('Failed to fetch settings');
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk to save user settings to backend
export const saveUserSettings = createAsyncThunk(
  'portfolio/saveUserSettings',
  async (settings, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return rejectWithValue('No valid token found');
      }

      const response = await axios.post(`${BACKEND_URL}/settings`, settings, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data.status !== 'success') {
        return rejectWithValue('Failed to save settings');
      }

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  prod: {
    portfolioSize: 0,
    exitPercentage: 10,
    riskPercentage: 0.25,
  },
  paper: {
    portfolioSize: 100000,
    exitPercentage: 10,
    riskPercentage: 0.25,
  },
  loading: false,
  error: null,
};

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    updatePortfolioSize: (state, action) => {
      const { mode, value } = action.payload;
      if (state[mode]) {
        state[mode].portfolioSize = value;
      }
    },
    updateExitPercentage: (state, action) => {
      const { mode, value } = action.payload;
      if (state[mode]) {
        state[mode].exitPercentage = value;
      }
    },
    updateRiskPercentage: (state, action) => {
      const { mode, value } = action.payload;
      if (state[mode]) {
        state[mode].riskPercentage = value;
      }
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
        // API fetch always updates PROD portfolio size
        state.prod.portfolioSize = action.payload;
      })
      .addCase(fetchPortfolioSize.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch portfolio size';
      })
      .addCase(fetchUserSettings.fulfilled, (state, action) => {
        const settings = action.payload;
        if (settings) {
          if (settings.prod) state.prod = { ...state.prod, ...settings.prod };
          if (settings.paper) state.paper = { ...state.paper, ...settings.paper };
        }
      })
      .addCase(saveUserSettings.fulfilled, (state, action) => {
        // Optionally update state if backend returns updated settings
        const settings = action.payload;
        if (settings) {
          if (settings.prod) state.prod = { ...state.prod, ...settings.prod };
          if (settings.paper) state.paper = { ...state.paper, ...settings.paper };
        }
      });
  },
});

export const { updatePortfolioSize, updateExitPercentage, updateRiskPercentage } = portfolioSlice.actions;

export default portfolioSlice.reducer;
