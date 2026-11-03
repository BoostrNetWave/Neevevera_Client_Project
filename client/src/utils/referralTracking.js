import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

/**
 * Checks current URL for ?ref=NV-XXXX parameter and invokes server-side tracking.
 * Backend sets an HttpOnly, secure 60-day cookie (first-touch wins).
 * Also surfaces referral attribution disclosure in line with privacy standards.
 */
export async function trackIncomingReferral() {
  if (typeof window === 'undefined') return;

  const params = new URLSearchParams(window.location.search);
  const refCode = params.get('ref');

  if (refCode && refCode.trim().startsWith('NV-')) {
    try {
      const res = await axios.post(
        `${API_BASE}/partners/referral/track`,
        { refCode: refCode.trim() },
        { withCredentials: true }
      );
      if (res.data?.valid) {
        // Record session-only disclosure flag for UI privacy badge/notice
        sessionStorage.setItem('neeve_referred_by', res.data.partnerName || 'Certified Partner');
      }
    } catch (_) {
      // Fail silently; invalid or inactive code does not break visitor experience
    }
  }
}
