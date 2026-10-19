/**
 * api.js — Shared Axios instance for all frontend → backend calls.
 *
 * withCredentials: true is required so that HttpOnly cookies
 * (set by the server in Phase 2 auth) are sent on every request.
 */
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api'),
  withCredentials: true,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default API;
