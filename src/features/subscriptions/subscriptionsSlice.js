// features/subscriptions/subscriptionsSlice.js
//
// This slice owns the list of the logged-in user's subscriptions, plus
// the loading/error state for fetching, creating, updating, and deleting
// them. Same pattern as authSlice — thunks for the async work, a reducer
// for the synchronous bookkeeping.

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { api } from "../../lib/api";

const initialState = {
  items: [],
  status: "idle", // covers the "fetch the list" request
  error: null,
  // Separate flags for the form (create/update), so submitting a new
  // subscription doesn't make the whole dashboard list flash "loading".
  formStatus: "idle",
  formError: null,
};

export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/subscriptions");
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchSubscriptionById = createAsyncThunk(
  "subscriptions/fetchOne",
  async (id, { rejectWithValue }) => {
    try {
      const res = await api.get(`/subscriptions/${id}`);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createSubscription = createAsyncThunk(
  "subscriptions/create",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await api.post("/subscriptions", payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateSubscription = createAsyncThunk(
  "subscriptions/update",
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const res = await api.put(`/subscriptions/${id}`, payload);
      return res.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteSubscription = createAsyncThunk(
  "subscriptions/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      return id; // we only need the id, to remove it from local state
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const subscriptionsSlice = createSlice({
  name: "subscriptions",
  initialState,
  reducers: {
    // Lets a page clear a stale form error when the user navigates away
    // or starts editing a different field.
    clearFormError(state) {
      state.formError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- fetch all ---
      .addCase(fetchSubscriptions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchSubscriptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(fetchSubscriptions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })

      // --- fetch one (used by the detail/edit pages) ---
      .addCase(fetchSubscriptionById.fulfilled, (state, action) => {
        const incoming = action.payload;
        const existingIndex = state.items.findIndex((s) => s._id === incoming._id);
        if (existingIndex === -1) {
          state.items.push(incoming);
        } else {
          state.items[existingIndex] = incoming;
        }
      })

      // --- create ---
      .addCase(createSubscription.pending, (state) => {
        state.formStatus = "loading";
        state.formError = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.formStatus = "succeeded";
        state.items.push(action.payload);
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.formStatus = "failed";
        state.formError = action.payload;
      })

      // --- update ---
      .addCase(updateSubscription.pending, (state) => {
        state.formStatus = "loading";
        state.formError = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.formStatus = "succeeded";
        const index = state.items.findIndex((s) => s._id === action.payload._id);
        if (index !== -1) state.items[index] = action.payload;
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.formStatus = "failed";
        state.formError = action.payload;
      })

      // --- delete ---
      .addCase(deleteSubscription.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s._id !== action.payload);
      });
  },
});

export const { clearFormError } = subscriptionsSlice.actions;
export default subscriptionsSlice.reducer;

// --- Selectors ---
export const selectAllSubscriptions = (state) => state.subscriptions.items;
export const selectSubscriptionsStatus = (state) => state.subscriptions.status;
export const selectSubscriptionsError = (state) => state.subscriptions.error;
export const selectFormStatus = (state) => state.subscriptions.formStatus;
export const selectFormError = (state) => state.subscriptions.formError;

// A "selector factory" — returns a NEW selector scoped to one id. Used on
// the detail/edit pages: `useSelector(selectSubscriptionById(id))`.
export const selectSubscriptionById = (id) => (state) =>
  state.subscriptions.items.find((s) => s._id === id);
