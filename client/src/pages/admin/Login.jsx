import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

const AdminLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        `${API}/auth/login`,
        { email, password },
        { withCredentials: true }
      );
      // Server sets HttpOnly accessToken cookie.
      // Store a flag + user info locally for ProtectedRoute and UI display.
      const user = res.data.user;
      const accessToken = res.data.accessToken;
      localStorage.setItem('admin_authed', '1');
      localStorage.setItem('admin_token', accessToken || '');
      localStorage.setItem('admin_user', JSON.stringify({
        name: user.name,
        email: user.email,
        role: user.role,
      }));
      navigate('/admin');
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Invalid credentials. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-warm flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/neevevara-logo.png"
            alt="Neevevera"
            className="w-10 h-10 rounded-sm object-cover mb-4"
            onError={e => { e.target.style.display = 'none'; }}
          />
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Neevevera CMS
          </h1>
          <p className="text-sm text-soft-grey mt-1">Sign in to continue</p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-border-neutral rounded-sm p-8 space-y-5"
        >
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
              Email
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@neevevera.com"
              className="w-full px-3 py-2.5 text-sm bg-surface-warm border border-border-neutral rounded-sm text-graphite placeholder:text-soft-grey/60 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
              Password
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2.5 text-sm bg-surface-warm border border-border-neutral rounded-sm text-graphite placeholder:text-soft-grey/60 outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-brand-red border border-brand-red/20 bg-brand-red/5 px-3 py-2 rounded-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors disabled:opacity-60 font-display mt-2"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-soft-grey mt-6">
          Restricted access — authorized personnel only.
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
