import { configureStore } from "@reduxjs/toolkit";
import counter from "./counter";
import portfolioReducer from "./portfolio";
import orders from "./upstoxs";
import market from "./marketBreadth";

import authReducer from "./authSlice";

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
    },
});

export default store;