import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FiCheckCircle,
  FiAlertCircle,
  FiLoader,
  FiUserCheck,
  FiShare2,
  FiAward,
  FiArrowRight,
  FiShield,
  FiInfo,
} from 'react-icons/fi';

const API_BASE = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api');

export default function Partners() {
  const [searchParams] = useSearchParams();
  const verifyToken = searchParams.get('token');

  // Verification state
  const [verifying, setVerifying] = useState(Boolean(verifyToken));
  const [verifySuccess, setVerifySuccess] = useState(false);
  const [verifyError, setVerifyError] = useState('');

  // Form state
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    city: '',
    pin: '',
    partnerType: 'individual',
    agreementAccepted: false,
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle token verification if present in URL
  useEffect(() => {
    if (!verifyToken) return;

    let isMounted = true;
    const executeVerification = async () => {
      try {
        const res = await axios.get(`${API_BASE}/partners/verify/${verifyToken.trim()}`);
        if (isMounted) {
          if (res.data?.success) {
            setVerifySuccess(true);
          } else {
            setVerifyError(res.data?.error || 'Verification failed.');
          }
        }
      } catch (err) {
        if (isMounted) {
          setVerifyError(err.response?.data?.error || 'Invalid or expired verification link.');
        }
      } finally {
        if (isMounted) setVerifying(false);
      }
    };

    executeVerification();
    return () => { isMounted = false; };
  }, [verifyToken]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (errorMsg) setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!form.agreementAccepted) {
      setErrorMsg('You must accept the Partner Terms and Agreement to continue.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/partners/register`, form);
      if (res.data?.success) {
        setSubmitted(true);
      } else {
        setErrorMsg(res.data?.error || 'Registration failed. Please check your inputs.');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-[#FAF9F6] min-h-screen text-[#171717] pb-16">
      <Helmet>
        <title>Marketing Partner Programme | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Register as a verified marketing partner with Neevevera. Introduce civil construction and structural clients and earn approved incentives."
        />
      </Helmet>

      {/* ── Breadcrumb Bar ── */}
      <div className="border-b border-[#DDDAD1]/70 bg-[#F2EFE9] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6B6B67]">
            <Link to="/" className="text-[#07558F] hover:underline font-semibold">Home</Link>
            <span>/</span>
            <span className="text-[#111822] font-semibold">Marketing Partners</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#07558F] bg-[#07558F]/10 px-2.5 py-0.5 rounded-full font-bold">
              VERIFIED REFERRAL PROGRAMME
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <section className="pt-10 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E3E2DA]">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#07558F]/10 text-[#07558F] rounded-full text-[11px] font-bold font-mono uppercase tracking-wider mb-3">
            <FiShield className="text-[13px]" />
            <span>INSTITUTIONAL REFERRAL PARTNERSHIP</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight">
            Neevevera Marketing Partner Programme
          </h1>
          <p className="text-sm sm:text-base text-[#4B5563] mt-3 leading-relaxed">
            Collaborate with Neevevera as an authorized marketing partner. Introduce institutional, industrial, and residential construction projects to our engineering directorate and receive verified incentives upon contract execution.
          </p>
        </div>
      </section>

      {/* ── Main Container ── */}
      <section className="pt-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">

          {/* Left Column: 3-Step Walkthrough & Terms (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-6">
              <h2 className="font-display text-base font-bold text-[#111822] uppercase tracking-wide">
                How The Programme Works
              </h2>

              <div className="space-y-5">
                {/* Step 1 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#07558F]/10 text-[#07558F] flex items-center justify-center font-mono font-bold text-sm shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#111822]">
                      Register &amp; Verify Email
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                      Submit your contact details and select your partner classification. Confirm your email address to submit your profile for directorate review.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#07558F]/10 text-[#07558F] flex items-center justify-center font-mono font-bold text-sm shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#111822]">
                      Receive Referral Code &amp; Share
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                      Upon admin approval, you receive a unique high-entropy referral code (e.g. <span className="font-mono text-[#07558F] font-semibold">NV-XXXXXXXX</span>) and a 60-day shareable attribution link.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex items-start gap-3.5">
                  <div className="w-8 h-8 rounded-xl bg-[#07558F]/10 text-[#07558F] flex items-center justify-center font-mono font-bold text-sm shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#111822]">
                      Earn Approved Incentives
                    </h3>
                    <p className="text-xs text-[#4B5563] mt-1 leading-relaxed">
                      When your referred client executes an approved construction contract, the referral is verified by admin and recorded in the financial ledger.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Transparency Box */}
            <div className="bg-[#FAF9F6] p-5 rounded-2xl border border-[#DDDAD1]/80 text-xs text-[#4B5563] space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-[#07558F] font-display uppercase tracking-wider text-[11px]">
                <FiInfo className="text-sm shrink-0" />
                <span>Single-Level Compliance Standard</span>
              </div>
              <p className="leading-relaxed">
                Neevevera’s referral programme is strictly single-level and performance-based. There are zero joining fees, downline recruitments, or speculative earning schemes. Payouts are reconciled manually and disbursed directly upon verified project milestone achievements.
              </p>
              <div className="pt-2">
                <Link
                  to="/partner-terms"
                  className="text-xs font-semibold text-[#07558F] hover:underline flex items-center gap-1"
                >
                  <span>Review Complete Partner Terms &amp; Conditions</span>
                  <FiArrowRight className="text-[11px]" />
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column: Registration Form / Verification State (7 Cols) */}
          <div className="lg:col-span-7">
            
            {/* If verifying token */}
            {verifyToken && (
              <div className="bg-white p-8 rounded-2xl border border-[#DDDAD1]/80 shadow-xs text-center space-y-4 mb-6">
                {verifying ? (
                  <div className="py-6 space-y-3">
                    <FiLoader className="w-8 h-8 animate-spin text-[#07558F] mx-auto" />
                    <h3 className="font-display font-bold text-base text-[#111822]">
                      Verifying Partner Token...
                    </h3>
                  </div>
                ) : verifySuccess ? (
                  <div className="py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                      <FiCheckCircle />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#111822]">
                      Email Address Verified
                    </h3>
                    <p className="text-xs text-[#4B5563] max-w-md mx-auto leading-relaxed">
                      Thank you. Your marketing partner application has been validated and queued for review by the Neevevera Directorate. You will receive your unique referral code upon approval.
                    </p>
                    <Link
                      to="/"
                      className="inline-block mt-3 px-5 py-2.5 bg-[#07558F] text-white rounded-xl text-xs font-bold uppercase tracking-wider font-display shadow-xs"
                    >
                      Return to Home
                    </Link>
                  </div>
                ) : (
                  <div className="py-6 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-2xl">
                      <FiAlertCircle />
                    </div>
                    <h3 className="font-display font-bold text-lg text-[#111822]">
                      Verification Unsuccessful
                    </h3>
                    <p className="text-xs text-red-600 max-w-md mx-auto">
                      {verifyError || 'This verification link is invalid or has expired.'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Registration Form Card */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-6">
              <div>
                <h2 className="font-display text-xl font-bold text-[#111822] tracking-tight">
                  Partner Registration Form
                </h2>
                <p className="text-xs text-[#4B5563] mt-1">
                  Complete all required fields below to register.
                </p>
              </div>

              {submitted ? (
                <div className="p-8 text-center space-y-3 bg-[#FAF9F6] rounded-xl border border-[#DDDAD1]/60">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
                    <FiCheckCircle />
                  </div>
                  <h3 className="font-display font-bold text-base text-[#111822] uppercase tracking-wide">
                    Application Submitted
                  </h3>
                  <p className="text-xs text-[#4B5563] leading-relaxed max-w-md mx-auto">
                    We have dispatched a verification email to <strong className="text-[#111822]">{form.email}</strong>. Please click the link inside within 24 hours to verify your application.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setForm({
                        name: '',
                        phone: '',
                        email: '',
                        city: '',
                        pin: '',
                        partnerType: 'individual',
                        agreementAccepted: false,
                      });
                    }}
                    className="mt-2 text-xs font-semibold text-[#07558F] hover:underline"
                  >
                    Submit another application →
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                  {errorMsg && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 flex items-center gap-2">
                      <FiAlertCircle className="shrink-0 text-sm" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div>
                    <label className="block font-semibold text-[#111822] mb-1">
                      Full Legal Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      placeholder="e.g. Bijayananda Rout"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-[#DDDAD1] rounded-xl bg-[#FAF9F6] focus:outline-none focus:border-[#07558F] text-xs font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-[#111822] mb-1">
                        Mobile Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        required
                        placeholder="10-digit mobile"
                        value={form.phone}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 border border-[#DDDAD1] rounded-xl bg-[#FAF9F6] focus:outline-none focus:border-[#07558F] text-xs font-medium font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#111822] mb-1">
                        Corporate / Primary Email *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        placeholder="name@example.com"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 border border-[#DDDAD1] rounded-xl bg-[#FAF9F6] focus:outline-none focus:border-[#07558F] text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-[#111822] mb-1">
                        City / Base Region *
                      </label>
                      <input
                        type="text"
                        name="city"
                        required
                        placeholder="e.g. Bhubaneswar / Cuttack"
                        value={form.city}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 border border-[#DDDAD1] rounded-xl bg-[#FAF9F6] focus:outline-none focus:border-[#07558F] text-xs font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#111822] mb-1">
                        Postal PIN Code *
                      </label>
                      <input
                        type="text"
                        name="pin"
                        required
                        maxLength={6}
                        placeholder="6-digit PIN (e.g. 751024)"
                        value={form.pin}
                        onChange={handleChange}
                        className="w-full px-3.5 py-2.5 border border-[#DDDAD1] rounded-xl bg-[#FAF9F6] focus:outline-none focus:border-[#07558F] text-xs font-medium font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#111822] mb-1">
                      Partner Classification *
                    </label>
                    <select
                      name="partnerType"
                      value={form.partnerType}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-[#DDDAD1] rounded-xl bg-[#FAF9F6] focus:outline-none focus:border-[#07558F] text-xs font-medium"
                    >
                      <option value="individual">Individual Business Associate</option>
                      <option value="professional">Architect / Civil Engineer / Consultant</option>
                      <option value="agency">Real Estate / Commercial Agency</option>
                      <option value="other">Institutional / Other Enterprise</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#4B5563]">
                      <input
                        type="checkbox"
                        name="agreementAccepted"
                        checked={form.agreementAccepted}
                        onChange={handleChange}
                        className="mt-0.5 rounded text-[#07558F] focus:ring-[#07558F] cursor-pointer"
                      />
                      <span>
                        I accept the <Link to="/partner-terms" target="_blank" className="text-[#07558F] font-semibold underline">Neevevera Marketing Partner Agreement</Link> and agree to conduct referrals ethically without unauthorized claims.
                      </span>
                    </label>
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-[#07558F] text-white hover:bg-[#054370] rounded-xl font-display font-bold uppercase tracking-wider text-xs transition-all shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <FiLoader className="animate-spin" />
                          <span>Submitting Registration...</span>
                        </>
                      ) : (
                        <span>Submit Partner Application →</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>
    </div>
  );
}

