/**
 * adminApi.js — Shared Axios instance for all Admin CMS API calls.
 *
 * Auth strategy (dual-mode):
 *   Primary:   Authorization: Bearer <token> stored in localStorage.
 *              Works reliably in dev (cross-port: 5173 → 5000) and production.
 *   Secondary: HttpOnly cookie (set by server on login).
 *              The backend accepts either; cookie acts as a safety net in production.
 *
 * On 401:
 *   → Calls POST /api/auth/refresh to get a new accessToken.
 *   → Retries the original request once with the new token.
 *   → On double-failure: clears localStorage auth state and redirects to login.
 */
import axios from 'axios';

const BASE = 'http://localhost:5000/api';

const adminApi = axios.create({
  baseURL: BASE,
  withCredentials: true,    // also send HttpOnly cookie if available
});

// ── Request interceptor: inject Bearer token ──────────────────
adminApi.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: refresh on 401 ─────────────────────
let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, newToken = null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(newToken);
  });
  refreshQueue = [];
}

adminApi.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    // Only handle 401s that haven't been retried yet
    if (err.response?.status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    if (isRefreshing) {
      // Queue this request until the refresh resolves
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then(newToken => {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
        return adminApi(original);
      }).catch(e => Promise.reject(e));
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post(
        `${BASE}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      // If the server returns a new token in the body, store it
      const newToken = res.data?.accessToken;
      if (newToken) {
        localStorage.setItem('admin_token', newToken);
      }

      processQueue(null, newToken);

      // Retry original request with new token
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
      }
      return adminApi(original);
    } catch (refreshErr) {
      processQueue(refreshErr);
      // Refresh truly failed — session expired, force re-login
      localStorage.removeItem('admin_authed');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      // Use replace so the user can't go "back" to the broken state
      if (window.location.pathname !== '/admin/login') {
        window.location.replace('/admin/login');
      }
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default adminApi;
