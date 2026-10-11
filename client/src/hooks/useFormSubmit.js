/**
 * useFormSubmit.js — Reusable form submission hook.
 *
 * Used by: Contact, Newsletter, Application, Vendors
 *
 * States: 'idle' | 'loading' | 'success' | 'error'
 *
 * Design decisions:
 * - Error state keeps form data intact (not cleared) so the user
 *   doesn't lose what they typed if the network fails.
 * - errorMsg is the server's message when available, falling back
 *   to a generic. Never a bare JS error object shown to the user.
 * - No auto-retry — user explicitly retries via the same submit button.
 * - reset() allows the parent to let the user submit another entry
 *   after a success (e.g., "Send Another Inquiry" button).
 */
import { useState } from 'react';

export function useFormSubmit(apiFunction) {
  const [status, setStatus]   = useState('idle'); // idle | loading | success | error
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function submit(data) {
    setStatus('loading');
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const response = await apiFunction(data);
      setSuccessMsg(response?.message || '');
      setStatus('success');
    } catch (err) {
      setStatus('error');
      // Prefer the server's human-readable message; fall back gracefully.
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        (err.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your connection and try again.'
          : 'Something went wrong. Please try again.');
      setErrorMsg(msg);
    }
  }

  function reset() {
    setStatus('idle');
    setErrorMsg('');
    setSuccessMsg('');
  }

  return { submit, status, errorMsg, successMsg, reset };
}
