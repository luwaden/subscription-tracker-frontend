// app/store.js
//
// The store is the single object that holds ALL of your app's state.
// configureStore (from Redux Toolkit) builds it from a map of "slice name
// -> reducer function". Each slice only ever manages its own little
// corner of this object — authSlice never touches subscriptions data,
// and vice versa.

import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import subscriptionsReducer from "../features/subscriptions/subscriptionsSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    subscriptions: subscriptionsReducer,
  },
});

// After this runs, the shape of the whole store looks like:
// {
//   auth: { user, token, status, error },
//   subscriptions: { items, status, error, formStatus, formError }
// }
