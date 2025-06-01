// src/redux/portfolioSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  portfolioSize: 630000,
  exitPercentage: 10,
  riskPercentage: 0.25,
};

const portfolioSlice = createSlice({
  name: "portfolio",
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
});

export const { updatePortfolioSize, updateExitPercentage, updateRiskPercentage} = portfolioSlice.actions;

export default portfolioSlice.reducer;
