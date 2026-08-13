// lib/api.js
//
// One axios instance, used everywhere in the app. Every network call goes
// through `api` (the object exported below) instead of calling axios
// directly, so the base URL, the auth token, and error handling are only
// set up once, in one place.
//
// Full write-up of how this file works: docs/API_CONSUMPTION_GUIDE.md

import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Runs before every request leaves the app. If we have a saved token,
// attach it so the backend knows which user is asking.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Runs on every response. On success we only ever want the JSON body
// (response.data), so we unwrap it here — every caller gets the body
// directly instead of a big axios response object. On failure, we turn
// axios's error into a plain Error with a readable .message.
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message || "Something went wrong. Please try again.";
    return Promise.reject(new Error(message));
  }
);
