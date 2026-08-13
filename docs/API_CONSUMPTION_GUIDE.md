# How This App Talks to the Backend: A Complete Guide to API Consumption

This guide explains, from zero, how the Subscription Tracker frontend gets data from and sends data to its backend server — using **axios**. It assumes you know basic JavaScript and a little React, but nothing about networking. Every claim here is tied to real code in this project, so you can read a section and then go open the actual file.

---

## 1. What does "consuming an API" even mean?

Your React app runs entirely in the user's browser. It has no database, no user accounts table, nothing permanent. All of that lives on a separate program — the **backend server** — running somewhere else (in this project, at `http://localhost:4500` while developing).

"Consuming an API" just means: **the frontend asks the backend for something, over the network, and the backend answers.**

Think of it like ordering at a counter:

- You (the frontend) walk up and say what you want, in a format the counter understands ("one GET to `/subscriptions`, please, and here's my ID badge").
- The person behind the counter (the backend) goes and gets it, then hands you back a result.
- You didn't need to know *how* they got it (which database, which shelf) — you just needed to ask correctly and know how to read what they handed back.

Every single interaction in this app — signing in, seeing your subscriptions, adding a new one, deleting one — is one of these "ask, then get an answer" exchanges. The technical name for one exchange is an **HTTP request/response cycle**.

---

## 2. The cast of characters in this codebase

Before diving into code, know the four layers a piece of data passes through, and who's allowed to talk to whom:

```
React component (a page, e.g. Dashboard.jsx)
        │  dispatch(fetchSubscriptions())
        ▼
Redux thunk (in subscriptionsSlice.js)
        │  api.get("/subscriptions")
        ▼
axios instance (lib/api.js)
        │  actual network request
        ▼
Backend server (not in this repo)
```

**Rule followed throughout this project: components never call `axios` directly.** A component only ever calls `dispatch(someThunk())`. The thunk is the only thing that calls `api.get / api.post / api.put / api.delete`. This means if you ever need to change *how* requests are made (add a new header, change the base URL, log every request), you change it in exactly one file: `src/lib/api.js`.

---

## 3. Anatomy of an HTTP request

Every request this app sends has four parts. Here's what each one is, and where it shows up in this project:

| Part | What it is | Example in this app |
|---|---|---|
| **Method** | The *type* of action you're asking for | `GET`, `POST`, `PUT`, `DELETE` |
| **URL** | *Where* on the server you're asking | `http://localhost:4500/api/v1/subscriptions` |
| **Headers** | Metadata *about* the request — not the data itself | `Content-Type: application/json`, `Authorization: Bearer eyJ...` |
| **Body** | The actual data you're sending (only for `POST`/`PUT`) | `{ "name": "Netflix", "price": 15.99, ... }` |

The URL is built from two pieces glued together: a **base URL** (same for every request — `http://localhost:4500/api/v1`, read from `.env`) and a **path** (different per request — `/subscriptions`, `/auth/sign-in`, `/subscriptions/64f...`). You'll see this split directly in the code in Section 6.

---

## 4. Anatomy of an HTTP response

The backend answers every request with:

| Part | What it is | Example |
|---|---|---|
| **Status code** | A 3-digit number saying how it went | `200` OK, `201` Created, `401` Unauthorized, `404` Not Found, `500` Server Error |
| **Headers** | Metadata about the response | `Content-Type: application/json` |
| **Body** | The actual JSON data (or an error message) | `{ "success": true, "data": { ... } }` |

A status code starting with **2** means success. Starting with **4** means *you* (the client) did something wrong (bad password, missing field, no permission). Starting with **5** means the *server* broke. Axios uses this number to automatically decide whether to treat the response as a success or a failure — more on that in Section 7.

This backend wraps every JSON body in a small **envelope**, regardless of success or failure:

```json
// success
{ "success": true, "message": "Signed in successfully", "data": { "user": {...}, "token": "eyJ..." } }

// failure
{ "success": false, "message": "Invalid email or password" }
```

That `data` field is why you'll see `res.data` (not just `res`) throughout the slices — `data` is where the *useful* part of the envelope lives.

---

## 5. What is axios, and why use it instead of `fetch()`?

The browser already has a built-in way to make requests, called `fetch()`. Axios is a small library that does the same job but removes a lot of repetitive busywork:

| | `fetch()` | axios |
|---|---|---|
| Parses JSON for you | ❌ you call `.json()` yourself | ✅ automatic, on `response.data` |
| Treats 4xx/5xx as an error | ❌ you must check `response.ok` yourself | ✅ automatically throws |
| Reusable "pre-configured" client | ❌ not built in | ✅ `axios.create({...})` |
| Run code before every request/after every response | ❌ not built in | ✅ **interceptors** (Section 7) |

Install it with:

```bash
npm install axios
```

(already listed in this project's `package.json`).

---

## 6. Setting up the axios instance — `src/lib/api.js`, line by line

Open `src/lib/api.js`. Here is the whole file, in the order it runs:

```js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});
```

Walking through it:

1. **`import axios from "axios"`** — pulls in the library you installed with npm.
2. **`API_BASE_URL`** — read from the `.env` file (`VITE_API_BASE_URL=http://localhost:4500/api/v1`). Vite (the build tool this project uses) exposes anything prefixed `VITE_` on `import.meta.env`. Keeping this in `.env` instead of hardcoding it means you can point the same code at a different backend (e.g. a deployed one) just by changing one line, with no code edits.
3. **`axios.create({...})`** — this is the important part. Instead of calling the *global* `axios.get(...)` everywhere (and having to repeat the base URL and headers on every single call), you create one **configured instance**, once, and export it. Every file that needs to talk to the backend imports this same `api` object and calls `api.get(...)`, `api.post(...)`, etc. on it. The base URL and the `Content-Type` header are baked in — you never type them again.

At this point, `api` is already a fully working, ordinary axios client. `api.get("/subscriptions")` would already send a real request. Everything below (interceptors) is *automation* layered on top — none of it is required for axios to work, it just saves you from repeating yourself in every single thunk.

---

## 7. Interceptors — code that runs automatically on *every* request or response

An **interceptor** is a function you register once that axios calls automatically, either right before a request goes out, or right after a response comes back — for *every single call* made through that instance, without you having to remember to do it each time.

### 7a. The request interceptor — attaching the login token

```js
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

- Axios calls this function right before *any* request leaves the app, and hands it `config` — an object describing that request (its URL, method, headers, body, etc.).
- We read the saved login token out of `localStorage` (the browser's built-in persistent key-value storage — it survives page refreshes).
- If a token exists, we add an `Authorization: Bearer <token>` header to the request. This is how the backend knows *which logged-in user* is making the request, on every request after login, without you manually adding this header in every thunk.
- If there's no token yet (nobody's logged in — e.g. during sign-up or sign-in itself), the `if` simply skips, and the request goes out with no `Authorization` header. That's exactly correct: you don't have a token to send until *after* you sign in.
- **You must `return config`** — if you forget this, axios has nothing to send and the request silently breaks. This one line is the most common beginner mistake with interceptors.

### 7b. The response interceptor — unwrapping success, and normalizing errors

```js
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);
```

`interceptors.response.use` takes **two** functions: one for success, one for failure.

**On success** (`(response) => response.data`): Axios normally hands you back a big object shaped like `{ data, status, headers, config, ... }`. In this app we only ever care about `data` (the JSON body the backend sent). So the interceptor reaches in and returns *just* `response.data`. The practical effect: **every `await api.get(...)` in this codebase already gives you the parsed JSON body directly** — you never see or deal with the outer axios wrapper. Compare:

```js
// without this interceptor, every call site would need:
const response = await api.get("/subscriptions");
const body = response.data;

// with it, every call site just does:
const body = await api.get("/subscriptions");
```

**On failure** (the second function): Axios treats any response with a 4xx or 5xx status code as a failure and routes it here instead of to the success function. `error.response?.data?.message` reaches into the failed response and pulls out the human-readable message the backend sent (e.g. `"Invalid email or password"`). The `?.` (optional chaining) protects against the case where there's no `response` at all — e.g. the backend is offline, or there's no internet connection — in which case `error.response` is `undefined`, and we fall back to a generic message instead of crashing. Either way, we build a plain `Error` with a clean `.message` and reject with it — so that anywhere this call is awaited, a normal `try/catch` with `error.message` is all you ever need. You never have to dig through axios's internal error shape yourself.

### Why bother with interceptors at all?

Without them, *every single thunk* in this app would need to repeat: "attach the token if there is one," "unwrap `.data`," and "figure out a readable error message" — by hand, every time. Interceptors let you write that logic exactly once, and it silently applies to all ~9 API calls this app makes.

---

## 8. Where axios fits into the Redux flow

This app uses Redux Toolkit, and specifically `createAsyncThunk`, to manage the "loading → success/error" dance around each API call. You don't need to master Redux to understand API consumption, but you do need to recognize this shape — every single API call in the app follows it:

```js
export const fetchSubscriptions = createAsyncThunk(
  "subscriptions/fetchAll",           // ① a label for this action
  async (_, { rejectWithValue }) => {  // ② the actual async work
    try {
      const res = await api.get("/subscriptions"); // ③ call the backend
      return res.data;                              // ④ success → this becomes action.payload
    } catch (error) {
      return rejectWithValue(error.message);         // ⑤ failure → this becomes action.payload instead
    }
  }
);
```

1. A string Redux uses internally to name this action (shows up in Redux DevTools).
2. The function that actually runs when you `dispatch(fetchSubscriptions())`.
3. **This is the API consumption step** — everything in Sections 6–7 runs here, automatically, the moment `api.get(...)` is called.
4. If the `await` succeeds, whatever you `return` becomes `action.payload` on the `fulfilled` action — which a `.addCase(fetchSubscriptions.fulfilled, ...)` in the slice picks up to update the Redux store.
5. If the `await` throws (which — thanks to the response interceptor — happens for any non-2xx response, or a network failure), the `catch` block runs, and `rejectWithValue(...)` makes *that* the payload of a `rejected` action instead, which a separate `.addCase(fetchSubscriptions.rejected, ...)` handles (usually by saving an error message to show the user).

Every thunk in `authSlice.js` and `subscriptionsSlice.js` is a variation of this exact five-step shape.

---

## 9. Full walkthrough #1 — Signing in (unauthenticated `POST`, receiving a token)

This traces a real click, end to end. Open `src/pages/SignIn.jsx` and `src/features/auth/authSlice.js` alongside this.

1. **User types their email/password** into the form in `SignIn.jsx` — these are just kept in local component state (`useState`), not sent anywhere yet.
2. **User clicks "Sign in."** This fires `handleSubmit`, which calls:
   ```js
   dispatch(signIn({ email, password }))
   ```
3. Redux runs the `signIn` thunk (in `authSlice.js`). Its body calls:
   ```js
   const res = await api.post("/auth/sign-in", { email, password });
   ```
4. **The request interceptor runs first** (Section 7a). It checks `localStorage` for a token — there isn't one yet, since the user isn't logged in — so no `Authorization` header is added. The request goes out as:
   ```
   POST http://localhost:4500/api/v1/auth/sign-in
   Content-Type: application/json

   { "email": "user@example.com", "password": "••••••" }
   ```
5. **The request travels over the network** to the backend, which checks the email/password against the database, and — assuming they're correct — sends back:
   ```
   200 OK
   { "success": true, "message": "Signed in successfully",
     "data": { "user": { "_id": "...", "name": "...", "email": "..." }, "token": "eyJhbGciOi..." } }
   ```
6. **The response interceptor runs** (Section 7b, success branch). It unwraps `response.data`, so what `api.post(...)` actually resolves to — back in the thunk — is:
   ```js
   { success: true, message: "Signed in successfully", data: { user: {...}, token: "eyJ..." } }
   ```
7. Back in the thunk: `res` is that object. `return res.data;` pulls out the inner `{ user, token }` — this becomes `action.payload`.
8. In `authSlice.js`, `.addCase(signIn.fulfilled, (state, action) => {...})` runs:
   - `state.user = action.payload.user` and `state.token = action.payload.token` — saved into the Redux store, so any component can now read "who's logged in" via `useSelector(selectCurrentUser)`.
   - `localStorage.setItem("token", action.payload.token)` — saved to disk, so a page refresh doesn't lose the login. **This is exactly the value the request interceptor reads back out in step 4, on every request from now on.**
9. Back in `SignIn.jsx`, `signIn.fulfilled.match(result)` is true, so `navigate("/dashboard")` runs, and the user sees their subscriptions.

From here on, **every request this app makes will automatically include that token**, because of the interceptor set up once in `lib/api.js` — no page needs to think about it again.

---

## 10. Full walkthrough #2 — Loading the dashboard (authenticated `GET`)

Open `src/pages/Dashboard.jsx` and `src/features/subscriptions/subscriptionsSlice.js`.

1. **`Dashboard` mounts.** Its `useEffect` runs once and calls `dispatch(fetchSubscriptions())`.
2. The `fetchSubscriptions` thunk calls `api.get("/subscriptions")`.
3. **The request interceptor runs.** This time, `localStorage.getItem("token")` *does* find the token saved back in walkthrough #1, step 8. It attaches `Authorization: Bearer eyJhbGciOi...` to the request. The outgoing request looks like:
   ```
   GET http://localhost:4500/api/v1/subscriptions
   Content-Type: application/json
   Authorization: Bearer eyJhbGciOi...
   ```
4. The backend reads that header, decodes the token to figure out *which user* is asking, looks up only *their* subscriptions, and responds:
   ```
   200 OK
   { "success": true, "data": [ { "_id": "...", "name": "Netflix", "price": 15.99, ... }, ... ] }
   ```
5. The response interceptor unwraps `response.data`, so the thunk's `res` is `{ success: true, data: [...] }`, and `return res.data;` returns just the array of subscriptions.
6. `.addCase(fetchSubscriptions.fulfilled, (state, action) => { state.items = action.payload; })` stores that array in the Redux store.
7. Because `Dashboard.jsx` did `useSelector(selectAllSubscriptions)`, React-Redux automatically re-renders the component with the new data, and `subscriptions.map((sub) => <SubscriptionCard ... />)` renders one card per item.

Notice: **nothing in `Dashboard.jsx` or the thunk had to manually attach the token.** That's the entire point of the request interceptor from Section 7a.

---

## 11. Full walkthrough #3 — Creating a subscription (`POST` with a body)

Open `src/pages/SubscriptionForm.jsx`.

1. The user fills the form; values live in local `useState` (`form`).
2. On submit: `dispatch(createSubscription(payload))`, where `payload` is `{ name, price, currency, frequency, category, paymentMethod, startDate }`.
3. The thunk calls:
   ```js
   const res = await api.post("/subscriptions", payload);
   ```
   The request interceptor attaches the auth token (same as walkthrough #2). The request body is the `payload` object, automatically converted to a JSON string by axios and sent as:
   ```
   POST http://localhost:4500/api/v1/subscriptions
   Authorization: Bearer eyJ...
   Content-Type: application/json

   { "name": "Netflix", "price": 15.99, "currency": "USD", "frequency": "monthly", ... }
   ```
4. The backend creates a new record, and responds `201 Created` with `{ "success": true, "data": { "_id": "...", "name": "Netflix", ... } }` — the newly created subscription, now with a database-assigned `_id`.
5. The response interceptor unwraps it; `res.data` is the new subscription object; `.addCase(createSubscription.fulfilled, ...)` pushes it into `state.items`.
6. `SubscriptionForm.jsx` navigates to `/subscriptions/:id` using `result.payload._id` — the id the *backend* generated, not one the frontend made up.

`updateSubscription` (`PUT`) and `deleteSubscription` (`DELETE`) follow the identical pattern — only the HTTP method and whether a body is sent differ.

---

## 12. Full walkthrough #4 — When something goes wrong

Say the user types the wrong password on the sign-in form.

1. `dispatch(signIn({ email, password }))` → thunk calls `api.post("/auth/sign-in", {...})`.
2. The backend checks the credentials, they don't match, and it responds:
   ```
   401 Unauthorized
   { "success": false, "message": "Invalid email or password" }
   ```
3. Because `401` is outside the 2xx range, **axios treats this as a failure**, not a success — even though a valid JSON body came back. It routes to the response interceptor's *error* function.
4. `error.response.data.message` is `"Invalid email or password"` — the interceptor builds `new Error("Invalid email or password")` and rejects with it.
5. Back in the `signIn` thunk, the `await api.post(...)` throws, so the `catch` block runs: `return rejectWithValue(error.message)` — `"Invalid email or password"` becomes the payload of a `rejected` action.
6. `.addCase(signIn.rejected, (state, action) => { state.error = action.payload; })` stores that string in the Redux store.
7. `SignIn.jsx` reads it with `useSelector(selectAuthError)` and passes it to `<FormError message={error} />`, which renders it on screen.

If the backend were completely unreachable (wrong URL, no internet, server crashed), `error.response` would be `undefined` — the `error.response?.data?.message` optional-chain protects against that, and the fallback `"Something went wrong. Please try again."` is shown instead of the app crashing.

---

## 13. The four HTTP methods this app uses

| Method | Meaning | Used in this app for | Sends a body? |
|---|---|---|---|
| `GET` | "Give me data" | Loading the subscriptions list, loading one subscription | No |
| `POST` | "Create something new" (or, for auth, "process this action") | Sign up, sign in, sign out, create a subscription | Yes |
| `PUT` | "Replace/update an existing thing" | Editing a subscription | Yes |
| `DELETE` | "Remove this thing" | Deleting a subscription | No |

You can see all of these called on `api` (e.g. `api.get(...)`, `api.post(...)`) across `authSlice.js` and `subscriptionsSlice.js` — `api` already has one method per HTTP verb, because that's simply how every axios instance is shaped.

---

## 14. Where does the login token actually live?

It's kept in **two places at once**, on purpose:

- **`localStorage`** — a plain string, survives page refreshes and browser restarts. This is the copy the **request interceptor** reads (Section 7a) — interceptors live in `lib/api.js`, completely outside of Redux, so they can't reach into the Redux store even if they wanted to. `localStorage` is the one thing both "worlds" (Redux and plain axios code) can both see.
- **Redux state (`state.auth.token`)** — lets React components reactively know "is someone logged in right now" via `useSelector`, and re-render immediately when that changes (e.g. `ProtectedRoute.jsx` uses this to redirect signed-out users to `/sign-in`).

Every sign-in/sign-up writes to *both* (see walkthrough #1, step 8). Sign-out clears *both*.

---

## 15. Common beginner mistakes (and how to spot them)

- **"Network Error" / nothing happens, no useful message.** Usually the backend isn't running, or `VITE_API_BASE_URL` in `.env` is wrong. Check the **Network tab** in browser DevTools — if the request shows as "failed" (red, no status code), the server was never reached at all.
- **Changed `.env` but nothing changed.** Vite only reads `.env` when the dev server *starts*. Stop it (`Ctrl+C`) and run `npm run dev` again.
- **CORS error in the console** (`has been blocked by CORS policy`). This means the browser successfully reached the backend, but the *backend* hasn't been configured to allow requests from your frontend's origin (e.g. `http://localhost:5173`). This is fixed on the backend, not in this file.
- **`401 Unauthorized` on a page that should be logged in.** Check `localStorage` (Application tab → Local Storage, in DevTools) — is `token` actually there? If sign-in never completed successfully, there's nothing for the interceptor to attach.
- **Forgetting `await`.** `api.get(...)` returns a Promise. `const res = api.get(...)` (no `await`) gives you the *Promise object*, not the data — `res.data` would be `undefined`. Every call site in this project uses `await` inside an `async` function for exactly this reason.
- **Sending the wrong shape of body.** For `POST`/`PUT`, the second argument to `api.post(url, body)` / `api.put(url, body)` must be a plain object — axios turns it into a JSON string for you. Don't `JSON.stringify()` it yourself first, or it'll be double-encoded.

---

## 16. Glossary

- **API (Application Programming Interface):** the agreed-upon set of URLs, methods, and data shapes a backend exposes for other programs to use.
- **Endpoint:** one specific URL path on the API, e.g. `/subscriptions/:id`.
- **HTTP:** the protocol (set of rules) browsers and servers use to exchange requests/responses over the network.
- **JSON (JavaScript Object Notation):** the text format almost all APIs use to send structured data — looks like a JavaScript object, but is actually just a string until it's parsed.
- **Payload / body:** the actual data sent with a request (for `POST`/`PUT`) or received in a response.
- **Header:** a small piece of metadata attached to a request or response (not the main data) — e.g. what format the body is in, or who's authenticated.
- **Status code:** the 3-digit number a response starts with, summarizing what happened (`200`, `401`, `404`, `500`, etc.).
- **Async / await:** JavaScript's way of writing code that waits for something slow (like a network request) to finish, without freezing the rest of the app.
- **Promise:** the object JavaScript gives you immediately when you start an async operation, which later "resolves" (succeeds) or "rejects" (fails).
- **Instance (`axios.create()`):** a pre-configured, reusable copy of axios with its own base URL, headers, and interceptors, separate from plain global `axios`.
- **Interceptor:** a function that runs automatically before every request or after every response made through an axios instance.
- **Thunk:** (in Redux Toolkit) a function that performs async work (like an API call) and dispatches the appropriate Redux actions before/after — the bridge between "a component wants data" and "actually go get it."

---

## 17. The whole picture, one more time

```
┌─────────────┐   dispatch(thunk())   ┌──────────────┐   api.get/post/put/delete   ┌───────────────┐
│  Component   │ ───────────────────► │  Redux thunk  │ ───────────────────────────►│ axios instance │
│ (e.g. Dashboard)                    │ (in a slice)  │                              │ (lib/api.js)   │
└─────────────┘                       └──────────────┘                              └───────┬────────┘
       ▲                                      ▲                                             │
       │        useSelector reads              │        return res.data /                    │ request interceptor:
       │        updated Redux state             │        rejectWithValue(error.message)       │ attach token
       │                                      │                                             ▼
       │                               ┌──────────────┐                              ┌───────────────┐
       └───────────────────────────────┤ extraReducers │◄─────────────────────────────┤ Backend server │
                                        │ update state  │   response interceptor:      │  (HTTP + JSON)  │
                                        └──────────────┘   unwrap .data / build Error   └───────────────┘
```

Every feature in this app — sign in, view subscriptions, add one, edit one, delete one — is just this loop, run once per action, with a different method, path, and body each time.
