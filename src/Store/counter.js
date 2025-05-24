import { configureStore, createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const getAsyncIncrement = createAsyncThunk("counter/asyncIncrement", async (state) => {
    const posts = await fetch("https://jsonplaceholder.typicode.com/posts");
    const res = await posts.json();

    console.log(state, "state")
    return res;
})

const counter = createSlice({
    name: "counter",
    initialState: {
        counter: 0
    },
    reducers: {
        increment: (state, action) => {
            state.counter = state.counter + (action.payload || 1);
        },
        decrement: (state) => {
            state.counter = state.counter - 1;
        }
    },
    extraReducers: (builder) => {
        builder.addCase(getAsyncIncrement.fulfilled, (state, action) => {
            state.counter = action.payload.length;
        })
    }
});

export const { increment, decrement } = counter.actions;
export default counter.reducer;