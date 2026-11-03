import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import API from '../services/api';
import { loadRazorpayScript } from '../utils/razorpay';

const VISIT_TYPES = [
  { id: 'residential', label: 'Residential Construction / Villa', desc: 'New house, duplex, structural renovation' },
  { id: 'commercial', label: 'Commercial Building / Office', desc: 'Commercial complex, retail, showroom' },
  { id: 'industrial', label: 'Industrial & Marine Infrastructure', desc: 'Warehouses, sheds, coastal structures' },
  { id: 'structural_audit', label: 'Structural Inspection & Safety Audit', desc: 'Cracks, foundation distress, load audit' },
  { id: 'layout_planning', label: 'Plot Demarcation & Layout Planning', desc: 'Site survey, boundary, contour analysis' },
];

export default function BookInspection() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Settings & System Availability
  const [config, setConfig] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form State
  const [pinCode, setPinCode] = useState(searchParams.get('pincode') || '');
  const [checkingCoverage, setCheckingCoverage] = useState(false);
  const [coverageInfo, setCoverageInfo] = useState(null);
  const [coverageError, setCoverageError] = useState('');

  // Slots State
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  // Customer & Project Info — pre-fill from URL params if coming from Contact page
  const [formData, setFormData] = useState({
    customerName: searchParams.get('name') || '',
    customerPhone: searchParams.get('phone') || '',
    customerEmail: searchParams.get('email') || '',
    siteAddress: '',
    visitType: 'residential',
    projectNote: '',
    policyAccepted: false,
  });

  // Submission / Payment State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Fetch Public Config on Mount
  useEffect(() => {
    async function fetchConfig() {
      try {
        setLoadingConfig(true);
        const res = await API.get('/site-inspections/config');
        if (res.data?.success) {
          setConfig(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load inspection config:', err);
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, []);

  // Auto-verify if pinCode is passed via query params
  useEffect(() => {
    if (searchParams.get('pincode') && /^[1-9][0-9]{5}$/.test(searchParams.get('pincode'))) {
      handleCheckCoverage(searchParams.get('pincode'));
    }
  }, [searchParams]);

  // Check Coverage
  const handleCheckCoverage = async (overridePin) => {
    const pin = (overridePin || pinCode).trim();
    if (!/^[1-9][0-9]{5}$/.test(pin)) {
      setCoverageError('Please enter a valid 6-digit Indian PIN code.');
      setCoverageInfo(null);
      return;
    }

    setCheckingCoverage(true);
    setCoverageError('');
    setCoverageInfo(null);
    setSelectedSlotId(null);

    try {
      const res = await API.get(`/site-inspections/check-coverage?pinCode=${pin}`);
      if (res.data?.success && res.data.covered) {
        setCoverageInfo(res.data);
        // Load available slots
        loadAvailableSlots(pin);
      } else {
        setCoverageError(res.data?.message || 'We currently do not offer site inspections in this area.');
      }
    } catch (err) {
      setCoverageError(err.response?.data?.error || 'Unable to check PIN code coverage. Please try again.');
    } finally {
      setCheckingCoverage(false);
    }
  };

  // Load Slots for Covered PIN
  const loadAvailableSlots = async (pin) => {
    setLoadingSlots(true);
    try {
      const res = await API.get(`/site-inspections/slots?pinCode=${pin}`);
      if (res.data?.success) {
        const availableSlots = res.data.data || [];
        setSlots(availableSlots);
        if (availableSlots.length > 0) {
          // Default to the first date available
          const firstDate = new Date(availableSlots[0].startTime).toISOString().split('T')[0];
          setSelectedDate(firstDate);
        }
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // Group slots by Date (YYYY-MM-DD)
  const slotsByDate = slots.reduce((acc, slot) => {
    const d = new Date(slot.startTime).toISOString().split('T')[0];
    if (!acc[d]) acc[d] = [];
    acc[d].push(slot);
    return acc;
  }, {});

  const datesList = Object.keys(slotsByDate).sort();

  // Handle Form Change
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Submit & Launch Razorpay Checkout
  const handleBookNow = async (e) => {
    e.preventDefault();
    setSubmitError('');

    if (!coverageInfo || !coverageInfo.covered) {
      setSubmitError('Please verify your PIN code service coverage first.');
      return;
    }

    if (!selectedSlotId) {
      setSubmitError('Please select a visit date and time slot.');
      return;
    }

    if (!formData.customerName.trim()) {
      setSubmitError('Please enter your full name.');
      return;
    }

    if (!/^[6-9]\d{9}$/.test(formData.customerPhone.replace(/\s+/g, ''))) {
      setSubmitError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!formData.siteAddress.trim()) {
      setSubmitError('Please provide the full site location / street address.');
      return;
    }

    if (!formData.policyAccepted) {
      setSubmitError('Please accept the booking terms and refund policy.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Ensure Razorpay checkout script is loaded
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Could not load payment gateway SDK. Please check your internet connection and try again.');
      }

      // 2. Call backend to create booking and reserve slot
      const payload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.replace(/\s+/g, '').trim(),
        customerEmail: formData.customerEmail?.trim() || undefined,
        siteAddress: formData.siteAddress.trim(),
        pinCode: coverageInfo.pinCode || pinCode.trim(),
        district: coverageInfo.district,
        state: coverageInfo.state,
        visitType: formData.visitType,
        projectNote: formData.projectNote.trim(),
        slotId: selectedSlotId,
        policyAccepted: true,
      };

      const bookingRes = await API.post('/site-inspections/bookings', payload);

      if (!bookingRes.data?.success) {
        throw new Error(bookingRes.data?.error || 'Failed to initialize booking.');
      }

      const { booking, razorpayOrderId, razorpayKeyId, accessToken } = bookingRes.data;

      // If payments are disabled on the server (e.g. Free Inspection mode)
      if (!razorpayOrderId || !razorpayKeyId) {
        navigate(`/book-inspection/status/${booking.bookingRef}?token=${accessToken}`);
        return;
      }

      // 3. Configure Razorpay Standard Modal
      const options = {
        key: razorpayKeyId,
        amount: booking.amountPaise,
        currency: booking.currency || 'INR',
        name: 'Neevevera Private Limited',
        description: `Site Inspection Token — Ref: ${booking.bookingRef}`,
        image: '/neevevara-logo.png',
        order_id: razorpayOrderId,
        prefill: {
          name: formData.customerName,
          email: formData.customerEmail,
          contact: formData.customerPhone,
        },
        theme: {
          color: '#07558F',
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false);
            setSubmitError('Payment was not completed. Your slot reservation will expire in a few minutes. You can retry payment below.');
          },
        },
        handler: async function (response) {
          try {
            // 4. Verify payment on server
            const verifyRes = await API.post(
              `/site-inspections/bookings/${booking.bookingRef}/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                accessToken,
              }
            );

            if (verifyRes.data?.success) {
              navigate(`/book-inspection/status/${booking.bookingRef}?token=${accessToken}`);
            } else {
              setSubmitError(verifyRes.data?.error || 'Payment verification failed. Please contact our support team.');
              setSubmitting(false);
            }
          } catch (verifyErr) {
            console.error('Payment verification error:', verifyErr);
            setSubmitError(
              verifyErr.response?.data?.error ||
                'Payment verification encountered an issue. If amount was deducted, please note your reference: ' +
                  booking.bookingRef
            );
            setSubmitting(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed:', resp.error);
        setSubmitError(`Payment failed: ${resp.error.description || 'Transaction declined'}. Please try another payment method.`);
        setSubmitting(false);
      });

      rzp.open();
    } catch (err) {
      console.error('Booking error:', err);
      setSubmitError(err.response?.data?.error || err.message || 'Failed to place booking. Please try again.');
      setSubmitting(false);
    }
  };

  const selectedSlot = slots.find((s) => s.id === selectedSlotId || s._id === selectedSlotId);
  const tokenInr = config?.tokenAmountPaise ? (config.tokenAmountPaise / 100).toLocaleString('en-IN') : '999';

  return (
    <>
      <Helmet>
        <title>Book Expert Site Inspection | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Schedule a professional civil engineering site inspection for your residential, commercial, or marine infrastructure project. Certified structural engineers, precise layout evaluation, and soil assessment."
        />
      </Helmet>

      <div className="bg-surface-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/10 text-brand-blue tracking-wide uppercase">
              <span className="material-symbols-outlined text-sm">engineering</span>
              Direct Field Assessment
            </span>
            <h1 className="mt-3 text-3xl sm:text-4xl font-display font-bold text-graphite tracking-tight">
              {t('bookInspection.title')}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-soft-grey max-w-2xl mx-auto">
              {t('bookInspection.subtitle')}
            </p>
          </div>

          {/* System Disabled Warning */}
          {config && !config.bookingEnabled && (
            <div className="mb-8 p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-4">
              <span className="material-symbols-outlined text-amber-600 text-3xl shrink-0">info</span>
              <div>
                <h3 className="font-semibold text-lg">Online Booking Currently Paused</h3>
                <p className="mt-1 text-sm text-amber-800">
                  Online slot reservations are temporarily closed for scheduled maintenance or peak field capacity.
                  You can reach our engineering desk directly at{' '}
                  <a href="tel:+917684078877" className="underline font-bold">
                    +91 76840 78877
                  </a>{' '}
                  or submit a general enquiry.
                </p>
                <div className="mt-3">
                  <Link to="/contact" className="inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">
                    Contact Engineering Support &rarr;
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Main Booking Container */}
          <div className="bg-white rounded-3xl border border-border-neutral shadow-sm overflow-hidden">
            
            {/* Step 1: PIN Code & Service Coverage */}
            <div className="p-6 sm:p-8 border-b border-border-neutral bg-surface-warm/40">
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                  1
                </span>
                <h2 className="text-xl font-display font-bold text-graphite">
                  {t('bookInspection.step1')}
                </h2>
              </div>
              <p className="text-sm text-soft-grey mb-4">
                We currently deploy inspection teams across approved districts in Odisha, the Andaman &amp; Nicobar Islands, and West Bengal.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-soft-grey text-xl">
                    location_on
                  </span>
                  <input
                    type="text"
                    maxLength={6}
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit site PIN code (e.g. 751001)"
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-border-neutral bg-white text-graphite focus:outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-base font-medium tracking-wide"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCheckCoverage();
                      }
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleCheckCoverage()}
                  disabled={checkingCoverage || !pinCode || pinCode.length !== 6}
                  className="px-6 py-3 rounded-xl bg-brand-blue text-white font-semibold hover:bg-brand-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                >
                  {checkingCoverage ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Checking...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">verified</span>
                      Verify Coverage
                    </>
                  )}
                </button>
              </div>

              {/* Coverage Feedback */}
              {coverageInfo && coverageInfo.covered && (
                <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between flex-wrap gap-2 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600">check_circle</span>
                    <span className="text-sm font-semibold">
                      Service Available: {coverageInfo.district}, {coverageInfo.state} (PIN {coverageInfo.pinCode})
                    </span>
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-200 text-emerald-800 font-medium rounded-full">
                    Active Inspection Zone
                  </span>
                </div>
              )}

              {coverageError && (
                <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 text-sm animate-fadeIn">
                  <span className="material-symbols-outlined text-rose-600">error</span>
                  <span>{coverageError}</span>
                </div>
              )}
            </div>

            {/* Step 2: Slot Selection */}
            {coverageInfo && coverageInfo.covered && (
              <div className="p-6 sm:p-8 border-b border-border-neutral">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                    2
                  </span>
                  <h2 className="text-xl font-display font-bold text-graphite">
                    Select Appointment Date &amp; Time Window
                  </h2>
                </div>

                {loadingSlots ? (
                  <div className="py-12 text-center text-soft-grey">
                    <span className="inline-block w-6 h-6 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-2"></span>
                    <p className="text-sm">Loading available engineer inspection slots...</p>
                  </div>
                ) : datesList.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-surface-muted text-center text-soft-grey">
                    <span className="material-symbols-outlined text-4xl text-soft-grey mb-2">event_busy</span>
                    <p className="font-medium text-graphite">No open inspection slots currently listed for this area.</p>
                    <p className="text-sm mt-1">Our engineering desk adds new slots every morning. Please check back shortly or call us.</p>
                  </div>
                ) : (
                  <div>
                    {/* Date Selector Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-thin">
                      {datesList.map((d) => {
                        const dateObj = new Date(d);
                        const isSelected = selectedDate === d;
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDate(d)}
                            className={`px-4 py-3 rounded-2xl border text-center shrink-0 transition-all ${
                              isSelected
                                ? 'bg-brand-blue text-white border-brand-blue shadow-md'
                                : 'bg-surface-warm/40 text-graphite border-border-neutral hover:border-brand-blue/40'
                            }`}
                          >
                            <span className="block text-xs uppercase tracking-wider font-semibold opacity-80">
                              {dayName}
                            </span>
                            <span className="block text-base font-bold mt-0.5">{monthName}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Slots for Selected Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {(slotsByDate[selectedDate] || []).map((slot) => {
                        const slotId = slot.id || slot._id;
                        const isSelected = selectedSlotId === slotId;
                        // API returns availableCount directly
                        const remaining = slot.availableCount ?? 0;
                        const isFull = remaining <= 0;

                        return (
                          <button
                            key={slotId}
                            type="button"
                            disabled={isFull}
                            onClick={() => setSelectedSlotId(slotId)}
                            className={`p-4 rounded-2xl border text-left transition-all relative ${
                              isSelected
                                ? 'border-brand-blue ring-2 ring-brand-blue/20 bg-brand-blue/5'
                                : isFull
                                ? 'opacity-40 border-dashed border-border-neutral bg-gray-50 cursor-not-allowed'
                                : 'border-border-neutral hover:border-brand-blue/50 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-bold text-graphite text-base">{slot.label}</span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-brand-blue text-lg">check_circle</span>
                              )}
                            </div>
                            <div className="flex items-center justify-between text-xs text-soft-grey mt-2">
                              <span>
                                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                                {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full font-medium ${
                                  remaining <= 1 ? 'bg-amber-100 text-amber-800' : 'bg-blue-50 text-brand-blue'
                                }`}
                              >
                                {remaining} spot{remaining !== 1 ? 's' : ''} left
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Customer & Site Details Form */}
            {coverageInfo && coverageInfo.covered && selectedSlotId && (
              <form onSubmit={handleBookNow} className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="w-8 h-8 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-sm">
                    3
                  </span>
                  <h2 className="text-xl font-display font-bold text-graphite">
                    Project Details &amp; Contact Information
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      required
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="e.g. Ramesh Chandra Das"
                      className="w-full px-4 py-3 rounded-xl border border-border-neutral focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                      Mobile Number (10 digits) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-soft-grey">
                        +91
                      </span>
                      <input
                        type="tel"
                        name="customerPhone"
                        required
                        maxLength={10}
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData((p) => ({ ...p, customerPhone: e.target.value.replace(/\D/g, '') }))
                        }
                        placeholder="9876543210"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-border-neutral focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      name="customerEmail"
                      value={formData.customerEmail}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className="w-full px-4 py-3 rounded-xl border border-border-neutral focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm"
                    />
                  </div>

                  {/* Visit / Project Type */}
                  <div>
                    <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                      Inspection Type *
                    </label>
                    <select
                      name="visitType"
                      value={formData.visitType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-border-neutral focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm bg-white"
                    >
                      {VISIT_TYPES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Site Address */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                      Exact Site / Property Address *
                    </label>
                    <textarea
                      rows={3}
                      name="siteAddress"
                      required
                      value={formData.siteAddress}
                      onChange={handleChange}
                      placeholder="Plot No., Landmark, Sector/Village, Road name..."
                      className="w-full px-4 py-3 rounded-xl border border-border-neutral focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm"
                    />
                  </div>

                  {/* Project Scope / Notes */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1.5">
                      Project Notes / Specific Observations Needed (Optional)
                    </label>
                    <input
                      type="text"
                      name="projectNote"
                      value={formData.projectNote}
                      onChange={handleChange}
                      placeholder="e.g. Need foundation stability check for 3-story residential construction"
                      className="w-full px-4 py-3 rounded-xl border border-border-neutral focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue text-sm"
                    />
                  </div>
                </div>

                {/* Token Amount & Policy Card */}
                <div className="mt-8 p-6 rounded-2xl bg-surface-warm border border-border-neutral">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-neutral/60 pb-5">
                    <div>
                      <h4 className="font-display font-bold text-graphite text-base">
                        Site Inspection Booking Token
                      </h4>
                      <p className="text-xs text-soft-grey mt-0.5">
                        100% adjustable against your final construction / design contract quotation with Neevevera.
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-display font-extrabold text-brand-blue">
                        ₹{tokenInr}
                      </span>
                      <span className="block text-xs text-soft-grey">All taxes included</span>
                    </div>
                  </div>

                  {/* Selected Window Summary */}
                  {selectedSlot && (
                    <div className="py-4 flex items-center gap-3 text-sm text-graphite border-b border-border-neutral/60">
                      <span className="material-symbols-outlined text-brand-blue">schedule</span>
                      <span>
                        <strong>Reserved Window:</strong> {selectedSlot.label} on{' '}
                        {new Date(selectedSlot.startTime).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}

                  {/* Policy Checkbox */}
                  <div className="mt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="policyAccepted"
                        checked={formData.policyAccepted}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 rounded border-border-neutral text-brand-blue focus:ring-brand-blue"
                      />
                      <span className="text-xs text-soft-grey leading-relaxed">
                        I agree to the{' '}
                        <Link to="/refund-policy" target="_blank" rel="noopener noreferrer" className="text-brand-blue font-semibold underline hover:text-brand-blue-hover">
                          Booking &amp; Refund Policy
                        </Link>{' '}
                        and{' '}
                        <Link to="/terms" target="_blank" rel="noopener noreferrer" className="text-brand-blue font-semibold underline hover:text-brand-blue-hover">
                          Terms of Service
                        </Link>
                        . I understand that the ₹{tokenInr} booking token reserves the engineering team’s field visit and
                        is fully deductible against my project contract. Free rescheduling is permitted up to 24 hours
                        prior to the slot window.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Error Banner */}
                {submitError && (
                  <div className="mt-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-2.5 animate-fadeIn">
                    <span className="material-symbols-outlined text-rose-600 shrink-0">error</span>
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Submit / Pay Button */}
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-soft-grey">
                    <span className="material-symbols-outlined text-emerald-600 text-base">lock</span>
                    <span>Secured with 256-bit Razorpay Checkout &bull; UPI, Cards, Netbanking</span>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || (config && !config.bookingEnabled)}
                    className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-brand-blue hover:bg-brand-blue-hover text-white font-bold text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        {config?.paymentsEnabled ? 'Opening Secure Checkout...' : 'Confirming Booking...'}
                      </>
                    ) : (
                      <>
                        {config?.paymentsEnabled ? (
                          <span>Pay ₹{tokenInr} &amp; Confirm Booking</span>
                        ) : (
                          <span>Confirm Inspection Booking</span>
                        )}
                        <span className="material-symbols-outlined text-xl">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Value Highlights */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-border-neutral">
              <span className="material-symbols-outlined text-brand-blue text-3xl mb-3">badge</span>
              <h4 className="font-display font-bold text-graphite text-base">Licensed Senior Engineers</h4>
              <p className="text-xs text-soft-grey mt-1 leading-relaxed">
                Inspections are executed only by certified structural engineers, not commercial sales reps.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-border-neutral">
              <span className="material-symbols-outlined text-brand-blue text-3xl mb-3">description</span>
              <h4 className="font-display font-bold text-graphite text-base">Comprehensive Site Report</h4>
              <p className="text-xs text-soft-grey mt-1 leading-relaxed">
                Receive an engineering report detailing soil profile, elevation contours, structural recommendations, and estimate.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-white border border-border-neutral">
              <span className="material-symbols-outlined text-brand-blue text-3xl mb-3">price_check</span>
              <h4 className="font-display font-bold text-graphite text-base">100% Token Credit</h4>
              <p className="text-xs text-soft-grey mt-1 leading-relaxed">
                The entire inspection token is credited against your billing when you initiate construction with Neevevera.
              </p>
            </div>
          </div>

          {/* Already have a booking link */}
          <div className="mt-8 text-center text-sm text-soft-grey">
            Already have an active inspection booking?{' '}
            <Link to="/book-inspection/status" className="font-semibold text-brand-blue hover:underline">
              Track Visit Status &amp; Receipt &rarr;
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
