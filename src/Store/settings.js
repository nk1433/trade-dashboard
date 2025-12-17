import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    tradingMode: 'PAPER', // 'PAPER' or 'PROD'
};

const settingsSlice = createSlice({
    name: "settings",
    initialState,
    reducers: {
        setTradingMode: (state, action) => {
            state.tradingMode = action.payload;
        },
    },
});

export const { setTradingMode } = settingsSlice.actions;
export default settingsSlice.reducer;
