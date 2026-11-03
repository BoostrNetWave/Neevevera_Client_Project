import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiMapPin, FiAlertCircle, FiSend, FiX } from 'react-icons/fi';
import axios from 'axios';

const API = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function PinCoverageChecker() {
  const { t } = useTranslation('common');
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // Lead capture form for uncovered areas
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadScope, setLeadScope] = useState('');
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState('');

  const checkPin = async () => {
    const pin = pincode.trim();
    setError('');
    setResult(null);
    setShowLeadForm(false);
    setLeadSuccess(false);
    setLeadError('');

    if (!pin) {
      setError('Please enter a 6-digit PIN code.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setError('Please enter a valid 6-digit Indian PIN code.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get(`${API}/service-areas/check`, {
        params: { pincode: pin },
      });
      if (res.data && res.data.success) {
        setResult(res.data);
      } else {
        setResult({ pincode: pin, serviceable: false, status: 'not_covered' });
      }
    } catch {
      setResult({ pincode: pin, serviceable: false, status: 'not_covered' });
    } finally {
      setLoading(false);
    }
  };

  const submitLeadCapture = async (e) => {
    e.preventDefault();
    if (!leadName.trim() || !leadPhone.trim()) {
      setLeadError('Please provide your name and phone number.');
      return;
    }
    setLeadSubmitting(true);
    setLeadError('');
    try {
      await axios.post(`${API}/enquiries`, {
        name: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || 'lead-capture@neevevera.com',
        pinCode: result?.pincode || pincode,
        type: 'coverage_request',
        projectScope: `Coverage request for PIN ${result?.pincode || pincode}. ${leadScope.trim() || ''}`,
      });
      setLeadSuccess(true);
      setShowLeadForm(false);
    } catch (err) {
      setLeadError(err.response?.data?.message || 'Failed to submit. Please call +91 8596911655.');
    } finally {
      setLeadSubmitting(false);
    }
  };

  const isCovered = result?.status === 'covered' || result?.serviceable === true;
  const locationLabel = result?.district && result?.state
    ? `${result.district}, ${result.state}`
    : result?.district || result?.state || null;

  return (
    <div className="w-full bg-white border border-[#E3E2DA] rounded-lg p-5 shadow-2xs">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 mb-1">
        <FiMapPin className="w-4 h-4 text-[#07558F] shrink-0" />
        <h2 className="font-display text-sm font-bold text-[#111822] tracking-tight">
          {t('services.checkAvailability')}
        </h2>
      </div>
      <p className="text-xs text-[#6B7280] mb-4">
        {t('services.checkAvailabilityDesc')}
      </p>

      {/* ── Input Row ── */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1 max-w-[200px]">
          <FiMapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9CA3AF]" />
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={pincode}
            onChange={(e) => {
              setPincode(e.target.value.replace(/\D/g, ''));
              if (error) setError('');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') checkPin(); }}
            placeholder={t('services.enterPin')}
            aria-label="Enter 6-digit PIN code"
            className="w-full bg-[#FAF9F6] font-mono text-sm pl-9 pr-3 py-2.5 border border-[#D5D3C8] rounded focus:outline-none focus:ring-2 focus:ring-[#07558F] transition-all"
          />
        </div>
        <button
          type="button"
          onClick={checkPin}
          disabled={loading}
          className="px-5 py-2.5 bg-[#07558F] text-white font-semibold text-xs rounded hover:bg-[#064472] active:bg-[#043355] transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-60 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t('services.checking')}</span>
            </>
          ) : (
            <span>{t('services.check')}</span>
          )}
        </button>
      </div>

      {/* ── Inline error ── */}
      {error && (
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-red-600">
          <FiAlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Result ── */}
      {result && !error && (
        <div className="mt-3 pt-3 border-t border-[#EAE8DF]">
          {isCovered ? (
            /* Available state */
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-sm font-semibold text-[#111822]">
                  {t('services.serviceAvailable')}
                  {locationLabel && (
                    <span className="text-[#6B7280] font-normal ml-1.5">
                      {locationLabel}
                    </span>
                  )}
                </span>
              </div>
              <Link
                to={`/book-inspection?pincode=${result?.pincode || pincode}`}
                className="text-xs font-semibold text-[#07558F] hover:underline whitespace-nowrap shrink-0"
              >
                {t('services.requestVisit')}
              </Link>
            </div>
          ) : (
            /* Unavailable state */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D1D5DB] shrink-0" />
                <span className="text-sm text-[#374151]">
                  {t('services.serviceUnavailable')}
                </span>
              </div>

              {leadSuccess ? (
                <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded">
                  ✓ Request received. Our team will be in touch.
                </div>
              ) : (
                <>
                  {!showLeadForm && (
                    <button
                      type="button"
                      onClick={() => setShowLeadForm(true)}
                      className="self-start text-xs font-semibold text-[#07558F] hover:underline cursor-pointer"
                    >
                      Request coverage →
                    </button>
                  )}

                  {showLeadForm && (
                    <form
                      onSubmit={submitLeadCapture}
                      className="mt-1 p-4 bg-[#FAF9F6] border border-[#E3E2DA] rounded space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#374151] uppercase tracking-wider">
                          Request coverage for PIN {result?.pincode}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowLeadForm(false)}
                          className="text-[#9CA3AF] hover:text-[#374151] cursor-pointer"
                          aria-label="Close"
                        >
                          <FiX className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            value={leadName}
                            onChange={(e) => setLeadName(e.target.value)}
                            placeholder="Your name"
                            className="w-full text-xs px-3 py-2 bg-white border border-[#D1D5DB] rounded focus:outline-none focus:ring-1 focus:ring-[#07558F]"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                            Phone <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            required
                            value={leadPhone}
                            onChange={(e) => setLeadPhone(e.target.value)}
                            placeholder="+91 98765 43210"
                            className="w-full text-xs px-3 py-2 bg-white border border-[#D1D5DB] rounded focus:outline-none focus:ring-1 focus:ring-[#07558F]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-[#374151] mb-1">
                          Project brief (optional)
                        </label>
                        <input
                          type="text"
                          value={leadScope}
                          onChange={(e) => setLeadScope(e.target.value)}
                          placeholder="e.g. Commercial complex, warehouse, residential block"
                          className="w-full text-xs px-3 py-2 bg-white border border-[#D1D5DB] rounded focus:outline-none focus:ring-1 focus:ring-[#07558F]"
                        />
                      </div>

                      {leadError && (
                        <p className="text-[11px] text-red-600 font-medium">{leadError}</p>
                      )}

                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLeadForm(false)}
                          className="text-xs text-[#6B7280] hover:text-[#374151] cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={leadSubmitting}
                          className="px-4 py-1.5 bg-[#07558F] text-white text-xs font-semibold rounded hover:bg-[#064472] transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {leadSubmitting ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Sending…</span>
                            </>
                          ) : (
                            <>
                              <FiSend className="w-3 h-3" />
                              <span>Send Request</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
