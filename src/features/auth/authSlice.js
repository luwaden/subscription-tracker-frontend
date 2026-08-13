// features/auth/authSlice.js
//
// A "slice" is Redux Toolkit's word for one self-contained piece of the
// global store: its data, plus the only functions allowed to change that
// data. This slice owns everything about "who is logged in."

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

// Restore a saved session from localStorage so a page refresh doesn't log
// the user out. This runs once, synchronously, the moment this file is
// first imported (when the app boots).
const storedToken = localStorage.getItem("token");
const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// --- Thunks ---
//
// A "thunk" is just a function that does something asynchronous (like an
// API call) and dispatches plain actions before/after it finishes.
// createAsyncThunk is a Redux Toolkit helper that builds three action
// types for you automatically — pending, fulfilled, rejected — so you
// don't have to hand-write "start loading" / "loading succeeded" /
// "loading failed" actions yourself every time.
//
// The first argument ("auth/signUp") is the action type prefix used
// internally — it shows up in Redux DevTools, which is handy for debugging.

export const signUp = createAsyncThunk(
  "auth/signUp",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/sign-up", { name, email, password });
      return res.data; // becomes action.payload in the "fulfilled" case
    } catch (error) {
      // rejectWithValue lets us control exactly what ends up in
      // action.payload when the thunk fails, instead of Redux Toolkit's
      // default (which would just be the raw Error object). error.message
      // is already a readable string — see the response interceptor in
      // lib/api.js.
      return rejectWithValue(error.message);
    }
  }
);

export const signIn = createAsyncThunk(
  "auth/signIn",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await api.post("/auth/sign-in", { email, password });
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const signOut = createAsyncThunk("auth/signOut", async () => {
  try {
    await api.post("/auth/sign-out");
  } catch {
    // Even if the server call fails (token already expired, network
    // hiccup), we still want to clear the local session in the reducer
    // below — there's nothing useful the user can do with this error.
  }
});

const authSlice = createSlice({
  name: "auth",
  initialState,
  // "Regular" reducers — for state changes that don't involve waiting on
  // anything async. We don't need any here; everything goes through the
  // thunks above, handled in extraReducers below.
  reducers: {},
  // extraReducers responds to actions that were NOT defined by this slice's
  // own `reducers` — specifically, the pending/fulfilled/rejected actions
  // that createAsyncThunk generates for us.
  extraReducers: (builder) => {
    builder
      // --- signUp ---
      .addCase(signUp.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(signUp.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // --- signIn (same pattern as signUp) ---
      .addCase(signIn.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(signIn.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      // --- signOut ---
      .addCase(signOut.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.status = "idle";
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  },
});

export default authSlice.reducer;

// --- Selectors ---
// Small functions that pull a specific piece out of the store. Components
// use these with useSelector instead of writing `state.auth.user` inline
// everywhere — if the shape of auth state ever changes, you only fix it
// here, not in every component that reads it.
export const selectCurrentUser = (state) => state.auth.user;
export const selectAuthStatus = (state) => state.auth.status;
export const selectAuthError = (state) => state.auth.error;
