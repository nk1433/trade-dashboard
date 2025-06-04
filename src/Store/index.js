import { configureStore } from "@reduxjs/toolkit";
import counter from "./counter";
import portfolioReducer from "./portfolio";
import orders from "./upstoxs";

const store = configureStore({
    reducer: {
        counter: counter,
        portfolio: portfolioReducer,
        orders: orders
    },
});

export default store;