# Subscription Tracker — Frontend (Plain JavaScript + Redux)

A React + Redux Toolkit frontend for the Express/Mongoose subscription
tracker API. No TypeScript — plain JS/JSX throughout. Same features as
before: sign up, sign in, sign out, and full subscription CRUD — but all
server data now lives in a Redux store instead of component state/Context.

## Setup

```bash
npm install
cp .env.example .env.local   # edit VITE_API_BASE_URL if needed
npm run dev
```

Backend must be running at `http://localhost:4500` with `CLIENT_URL=http://localhost:5173`.

## Structure

```
src/
  app/store.js                       Redux store setup
  features/
    auth/authSlice.js                login state + signUp/signIn/signOut thunks
    subscriptions/subscriptionsSlice.js  list + CRUD thunks
  lib/api.js                         fetch wrapper used inside thunks
  components/                        Navbar, ProtectedRoute, SubscriptionCard, FormError
  pages/                             one component per route
  App.jsx                            route table
  main.jsx                           entry point — wraps app in <Provider store={store}>
```

See the chat response for a full plain-language explanation of how Redux
works and a line-by-line walkthrough of this codebase.
