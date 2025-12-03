import { configureStore } from "@reduxjs/toolkit";
import counter from "./counter";
import portfolioReducer from "./portfolio";
import orders from "./upstoxs";
import market from "./marketBreadth";

import authReducer from "./authSlice";
import settingsReducer from "./settings";
import paperTradeReducer from "./paperTradeSlice";

const store = configureStore({
    middleware: (getDefaultMiddleware) => getDefaultMiddleware({
        serializableCheck: false,
    }),
    reducer: {
        counter: counter,
        portfolio: portfolioReducer,
        orders: orders,
        marketBreadth: market,
        auth: authReducer,
        settings: settingsReducer,
        paperTrade: paperTradeReducer,
    },
});

export default store;