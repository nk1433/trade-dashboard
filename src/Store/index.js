import { configureStore } from "@reduxjs/toolkit";
import counter from "./counter";
import portfolioReducer from "./portfolio";

const store = configureStore({
    reducer: {
        counter: counter,
        portfolio: portfolioReducer,
    },
});

export default store;