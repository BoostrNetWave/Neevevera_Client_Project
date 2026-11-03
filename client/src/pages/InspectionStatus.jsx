import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import API from '../services/api';

const STATUS_STEPS = [
  { key: 'hold_placed', label: 'Slot Reserved', icon: 'schedule' },
  { key: 'confirmed', label: 'Payment Confirmed', icon: 'verified' },
  { key: 'assigned', label: 'Engineer Assigned', icon: 'badge' },
  { key: 'visit_in_progress', label: 'Visit in Progress', icon: 'engineering' },
  { key: 'completed', label: 'Report Delivered', icon: 'task_alt' },
];

export default function InspectionStatus() {
  const { bookingRef: routeRef } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  // Lookup state
  const [bookingRefInput, setBookingRefInput] = useState(routeRef || '');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  
  // Data State
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async (ref, tok, phone) => {
    if (!ref) return;
    setLoading(true);
    setError('');

    try {
      let url = `/site-inspections/bookings/${ref}/status?`;
      if (tok) url += `token=${encodeURIComponent(tok)}&`;
      if (phone) url += `customerPhone=${encodeURIComponent(phone.replace(/\s+/g, ''))}`;

      const res = await API.get(url);
      if (res.data?.success) {
        setBooking(res.data.data);
      } else {
        setError(res.data?.error || 'Unable to find booking.');
      }
    } catch (err) {
      console.error('Fetch status error:', err);
      setError(
        err.response?.data?.error ||
          'Could not retrieve booking details. Please verify your reference number and phone number.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeRef) {
      fetchStatus(routeRef, token, null);
    }
  }, [routeRef, token]);

  const handleManualLookup = (e) => {
    e.preventDefault();
    if (!bookingRefInput.trim()) {
      setError('Please enter your Booking Reference (e.g. NV-VIS-20261028-XXXX)');
      return;
    }
    fetchStatus(bookingRefInput.trim(), null, customerPhoneInput.trim());
  };

  // Helper to determine active step in tracker
  const getStepStatus = (stepKey) => {
    if (!booking) return 'pending';
    const status = booking.bookingStatus;

    if (status === 'cancelled') return 'cancelled';

    const order = ['hold_placed', 'confirmed', 'assigned', 'visit_in_progress', 'completed'];
    const currentIndex = order.indexOf(status);
    const stepIndex = order.indexOf(stepKey);

    if (currentIndex >= stepIndex) return 'completed';
    return 'pending';
  };

  return (
    <>
      <Helmet>
        <title>Inspection Visit Status &amp; Receipt | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Track the real-time status of your Neevevera site inspection appointment, engineer assignment, and download receipt."
        />
      </Helmet>

      <div className="bg-surface-white min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-blue/10 text-brand-blue tracking-wide uppercase">
              <span className="material-symbols-outlined text-sm">track_changes</span>
              Site Visit Tracking
            </span>
            <h1 className="mt-3 text-3xl font-display font-bold text-graphite tracking-tight">
              Site Inspection Status &amp; Receipt
            </h1>
            <p className="mt-2 text-sm text-soft-grey">
              Review your appointment confirmation, assigned field engineer, and real-time visit updates.
            </p>
          </div>

          {/* Manual Search Form if no booking loaded or user wants to search another */}
          {(!booking || !routeRef) && (
            <div className="mb-8 p-6 rounded-3xl bg-white border border-border-neutral shadow-sm">
              <h2 className="text-base font-bold text-graphite mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-brand-blue">search</span>
                Look Up an Existing Booking
              </h2>
              <form onSubmit={handleManualLookup} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                    Booking Reference *
                  </label>
                  <input
                    type="text"
                    required
                    value={bookingRefInput}
                    onChange={(e) => setBookingRefInput(e.target.value.toUpperCase())}
                    placeholder="NV-VIS-20261028-XXXX"
                    className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-sm uppercase tracking-wide font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                    Registered Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={customerPhoneInput}
                    onChange={(e) => setCustomerPhoneInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit phone number"
                    className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-6 py-2.5 bg-brand-blue text-white rounded-xl font-semibold text-sm hover:bg-brand-blue-hover transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? 'Searching...' : 'Track Appointment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-12 text-center text-soft-grey">
              <span className="inline-block w-8 h-8 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mb-3"></span>
              <p className="text-sm font-medium">Fetching appointment details...</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-3">
              <span className="material-symbols-outlined text-rose-600">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* Booking Card Details */}
          {booking && (
            <div className="bg-white rounded-3xl border border-border-neutral shadow-sm overflow-hidden animate-fadeIn">
              
              {/* Card Header */}
              <div className="p-6 sm:p-8 border-b border-border-neutral bg-surface-warm/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase font-bold tracking-wider text-soft-grey">
                    Booking Reference
                  </span>
                  <div className="text-2xl font-display font-extrabold text-graphite tracking-tight mt-0.5">
                    {booking.bookingRef}
                  </div>
                  <p className="text-xs text-soft-grey mt-1">
                    Customer: <strong className="text-graphite">{booking.customerName}</strong> &bull; {booking.district}, {booking.state}
                  </p>
                </div>

                {/* Status Badges */}
                <div className="flex flex-col sm:items-end gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                      booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'assigned'
                        ? 'bg-emerald-100 text-emerald-800'
                        : booking.bookingStatus === 'completed'
                        ? 'bg-blue-100 text-brand-blue'
                        : booking.bookingStatus === 'cancelled'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-current"></span>
                    Visit: {booking.bookingStatus.replace(/_/g, ' ')}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                      booking.paymentStatus === 'paid'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : booking.paymentStatus === 'refunded'
                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    Payment: {booking.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Step Progress Tracker */}
              {booking.bookingStatus !== 'cancelled' && (
                <div className="p-6 sm:p-8 border-b border-border-neutral bg-white">
                  <h3 className="text-xs font-bold text-soft-grey uppercase tracking-wider mb-6">
                    Inspection Progress Milestones
                  </h3>
                  <div className="relative flex items-center justify-between">
                    {/* Background Progress Bar */}
                    <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-1 bg-gray-200 -z-0"></div>

                    {STATUS_STEPS.map((step, idx) => {
                      const stepState = getStepStatus(step.key);
                      const isComplete = stepState === 'completed';

                      return (
                        <div key={step.key} className="relative z-10 flex flex-col items-center text-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isComplete
                                ? 'bg-brand-blue text-white ring-4 ring-brand-blue/10 shadow-sm'
                                : 'bg-gray-100 text-gray-400 border border-gray-300'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">{step.icon}</span>
                          </div>
                          <span
                            className={`mt-2 text-[11px] font-semibold max-w-[70px] leading-tight ${
                              isComplete ? 'text-graphite' : 'text-gray-400'
                            }`}
                          >
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Inspection Details Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Appointment Schedule */}
                <div className="p-5 rounded-2xl bg-surface-warm/40 border border-border-neutral">
                  <div className="flex items-center gap-2 text-brand-blue text-sm font-bold uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-base">calendar_month</span>
                    Scheduled Inspection
                  </div>
                  <div className="space-y-1.5 text-sm text-graphite">
                    <p>
                      <strong>Date:</strong>{' '}
                      {new Date(booking.visitStartTime).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                    <p>
                      <strong>Time Window:</strong>{' '}
                      {new Date(booking.visitStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(booking.visitEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p>
                      <strong>Visit Type:</strong> {booking.visitType?.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>

                {/* Location Details */}
                <div className="p-5 rounded-2xl bg-surface-warm/40 border border-border-neutral">
                  <div className="flex items-center gap-2 text-brand-blue text-sm font-bold uppercase tracking-wider mb-3">
                    <span className="material-symbols-outlined text-base">place</span>
                    Site Location
                  </div>
                  <div className="space-y-1.5 text-sm text-graphite">
                    <p className="leading-relaxed">
                      <strong>Address:</strong> {booking.siteAddress}
                    </p>
                    <p>
                      <strong>Region:</strong> {booking.district}, {booking.state} - {booking.pinCode}
                    </p>
                  </div>
                </div>

                {/* Assigned Engineer (if available) */}
                {booking.assignedStaff && (
                  <div className="md:col-span-2 p-5 rounded-2xl bg-blue-50/60 border border-blue-200">
                    <div className="flex items-center gap-2 text-brand-blue text-sm font-bold uppercase tracking-wider mb-2">
                      <span className="material-symbols-outlined text-base">badge</span>
                      Assigned Field Engineer
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-graphite">
                      <div>
                        <p className="font-bold text-base text-brand-blue">{booking.assignedStaff.name}</p>
                        <p className="text-xs text-soft-grey">{booking.assignedStaff.designation || 'Senior Structural Engineer'}</p>
                      </div>
                      {booking.assignedStaff.phone && (
                        <a
                          href={`tel:${booking.assignedStaff.phone}`}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-blue text-white text-xs font-semibold hover:bg-brand-blue-hover transition-colors w-fit"
                        >
                          <span className="material-symbols-outlined text-sm">call</span>
                          Call Engineer: {booking.assignedStaff.phone}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Summary */}
                <div className="md:col-span-2 p-5 rounded-2xl bg-surface-white border border-border-neutral flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-display font-bold text-graphite text-sm">Token Receipt &amp; Credit</h4>
                    <p className="text-xs text-soft-grey mt-0.5">
                      Amount: <strong>₹{(booking.amountPaise / 100).toLocaleString('en-IN')}</strong> &bull; Token is 100% deductible against project contract.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-xl border border-border-neutral text-graphite text-xs font-semibold hover:bg-surface-warm transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                    Print Receipt
                  </button>
                </div>
              </div>

              {/* Site Visit Instructions */}
              <div className="p-6 sm:p-8 bg-surface-muted/30 border-t border-border-neutral text-xs text-soft-grey space-y-2">
                <h4 className="font-bold text-graphite uppercase tracking-wider text-xs">
                  What to Prepare for the Site Visit:
                </h4>
                <ul className="list-disc pl-4 space-y-1 leading-relaxed">
                  <li>Please ensure clear physical access to the plot or building premise during the appointment window.</li>
                  <li>Have boundary demarcation or cadastral survey markings visible if available.</li>
                  <li>Keep any prior architectural blueprints, soil reports, or municipal sanction documents handy for our engineer to review.</li>
                </ul>
              </div>
            </div>
          )}

          {/* Support Banner */}
          <div className="mt-8 p-5 rounded-2xl bg-white border border-border-neutral text-center text-xs text-soft-grey flex flex-col sm:flex-row items-center justify-between gap-3">
            <span>Need to reschedule or speak with the engineering office?</span>
            <div className="flex items-center gap-4 font-semibold text-brand-blue">
              <a href="tel:+917684078877" className="hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">phone</span>
                +91 76840 78877
              </a>
              <a href="mailto:inspections@neevevara.com" className="hover:underline flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">mail</span>
                inspections@neevevara.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
