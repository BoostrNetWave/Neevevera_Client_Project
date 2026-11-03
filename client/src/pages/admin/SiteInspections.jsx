import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import adminApi from '../../utils/adminApi';

export default function AdminSiteInspections() {
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'slots' | 'settings'

  // Current admin user role
  const adminUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('admin_user') || '{}');
    } catch {
      return {};
    }
  })();
  const isSuperadmin = adminUser.role === 'superadmin';

  // ─────────────────────────────────────────────────────────────
  // TAB 1: BOOKINGS STATE
  // ─────────────────────────────────────────────────────────────
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Booking Actions State
  const [assignName, setAssignName] = useState('');
  const [assignPhone, setAssignPhone] = useState('');
  const [adminNoteText, setAdminNoteText] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // ─────────────────────────────────────────────────────────────
  // TAB 2: SLOTS STATE
  // ─────────────────────────────────────────────────────────────
  const [slots, setSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [newSlot, setNewSlot] = useState({
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '13:00',
    capacity: 2,
    label: 'Morning Window',
  });

  // ─────────────────────────────────────────────────────────────
  // TAB 3: SETTINGS STATE
  // ─────────────────────────────────────────────────────────────
  const [settings, setSettings] = useState({
    bookingEnabled: false,
    paymentsEnabled: false,
    tokenAmountInr: 999,
    holdDurationMinutes: 15,
    advanceBookingDays: 30,
    cancellationWindowHours: 24,
    refundPolicy: '',
  });
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // ── Fetch Bookings ──────────────────────────────────────────
  const fetchBookings = async () => {
    setLoadingBookings(true);
    try {
      let url = '/site-inspections/admin/bookings?';
      if (statusFilter) url += `bookingStatus=${statusFilter}&`;
      if (paymentFilter) url += `paymentStatus=${paymentFilter}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`;

      const res = await adminApi.get(url);
      if (res.data?.success) {
        setBookings(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // ── Fetch Slots ─────────────────────────────────────────────
  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await adminApi.get('/site-inspections/admin/slots');
      if (res.data?.success) {
        setSlots(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load slots:', err);
    } finally {
      setLoadingSlots(false);
    }
  };

  // ── Fetch Settings ──────────────────────────────────────────
  const fetchSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await adminApi.get('/site-inspections/admin/settings');
      if (res.data?.success) {
        const s = res.data.data;
        setSettings({
          bookingEnabled: Boolean(s.bookingEnabled),
          paymentsEnabled: Boolean(s.paymentsEnabled),
          tokenAmountInr: (s.tokenAmountPaise || 99900) / 100,
          holdDurationMinutes: Math.round((s.holdDurationSeconds || 900) / 60),
          advanceBookingDays: s.advanceBookingDays || 30,
          cancellationWindowHours: s.cancellationWindowHours || 24,
          refundPolicy: s.refundPolicy || '',
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bookings') fetchBookings();
    if (activeTab === 'slots') fetchSlots();
    if (activeTab === 'settings') fetchSettings();
  }, [activeTab, statusFilter, paymentFilter]);

  // Open Booking Details
  const handleOpenDetail = (booking) => {
    setSelectedBooking(booking);
    setAssignName(booking.assignedStaff?.name || '');
    setAssignPhone(booking.assignedStaff?.phone || '');
    setAdminNoteText('');
    setActionError('');
    setActionSuccess('');
    setDetailModalOpen(true);
  };

  // Assign Staff
  const handleAssignStaff = async () => {
    if (!assignName.trim()) {
      setActionError('Staff name is required.');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      const res = await adminApi.patch(
        `/site-inspections/admin/bookings/${selectedBooking._id}/assign`,
        { name: assignName.trim(), phone: assignPhone.trim() }
      );
      if (res.data?.success) {
        setActionSuccess('Field engineer assigned successfully.');
        setSelectedBooking(res.data.data);
        fetchBookings();
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to assign engineer.');
    } finally {
      setActionLoading(false);
    }
  };

  // Add Internal Admin Note
  const handleAddNote = async () => {
    if (!adminNoteText.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      const res = await adminApi.patch(
        `/site-inspections/admin/bookings/${selectedBooking._id}/note`,
        { note: adminNoteText.trim() }
      );
      if (res.data?.success) {
        setActionSuccess('Note added to audit trail.');
        setSelectedBooking(res.data.data);
        setAdminNoteText('');
        fetchBookings();
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to add note.');
    } finally {
      setActionLoading(false);
    }
  };

  // Mark Complete
  const handleMarkComplete = async () => {
    if (!window.confirm('Mark this site inspection visit as completed?')) return;
    setActionLoading(true);
    try {
      const res = await adminApi.patch(
        `/site-inspections/admin/bookings/${selectedBooking._id}/complete`
      );
      if (res.data?.success) {
        setActionSuccess('Visit marked as completed.');
        fetchBookings();
        setDetailModalOpen(false);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to mark visit complete.');
    } finally {
      setActionLoading(false);
    }
  };

  // Cancel Booking
  const handleCancelBooking = async () => {
    const reason = window.prompt('Enter cancellation reason (will be logged in audit trail):');
    if (!reason) return;
    setActionLoading(true);
    try {
      const res = await adminApi.post(
        `/site-inspections/admin/bookings/${selectedBooking._id}/cancel`,
        { reason }
      );
      if (res.data?.success) {
        setActionSuccess('Booking cancelled.');
        fetchBookings();
        setDetailModalOpen(false);
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to cancel booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Refund (Superadmin Only)
  const handleRefund = async () => {
    if (!window.confirm('Initiate full refund via Razorpay for this booking?')) return;
    const reason = window.prompt('Enter reason for refund:');
    if (!reason) return;

    setActionLoading(true);
    try {
      const res = await adminApi.post(
        `/site-inspections/admin/bookings/${selectedBooking._id}/refund`,
        { reason }
      );
      if (res.data?.success) {
        setActionSuccess(`Refund initiated successfully. Refund ID: ${res.data.refundId}`);
        fetchBookings();
      }
    } catch (err) {
      setActionError(err.response?.data?.error || 'Refund request failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Slots Actions ───────────────────────────────────────────
  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      const startDateTime = new Date(`${newSlot.date}T${newSlot.startTime}:00`);
      const endDateTime = new Date(`${newSlot.date}T${newSlot.endTime}:00`);

      const res = await adminApi.post('/site-inspections/admin/slots', {
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        capacity: Number(newSlot.capacity),
        label: newSlot.label,
      });

      if (res.data?.success) {
        setShowAddSlotModal(false);
        fetchSlots();
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create slot.');
    }
  };

  const handleToggleBlockSlot = async (slot) => {
    try {
      const res = await adminApi.put(`/site-inspections/admin/slots/${slot._id}`, {
        isBlocked: !slot.isBlocked,
      });
      if (res.data?.success) fetchSlots();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update slot.');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Delete this inspection slot?')) return;
    try {
      const res = await adminApi.delete(`/site-inspections/admin/slots/${slotId}`);
      if (res.data?.success) fetchSlots();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete slot.');
    }
  };

  // ── Save Settings ───────────────────────────────────────────
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsMsg('');
    try {
      const payload = {
        bookingEnabled: settings.bookingEnabled,
        paymentsEnabled: settings.paymentsEnabled,
        tokenAmountPaise: Math.round(Number(settings.tokenAmountInr) * 100),
        holdDurationSeconds: Number(settings.holdDurationMinutes) * 60,
        advanceBookingDays: Number(settings.advanceBookingDays),
        cancellationWindowHours: Number(settings.cancellationWindowHours),
        refundPolicy: settings.refundPolicy,
      };

      const res = await adminApi.put('/site-inspections/admin/settings', payload);
      if (res.data?.success) {
        setSettingsMsg('Settings updated successfully.');
      }
    } catch (err) {
      setSettingsMsg(err.response?.data?.error || 'Failed to update settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  // Stats computation
  const totalBookings = bookings.length;
  const confirmedCount = bookings.filter((b) => ['confirmed', 'assigned'].includes(b.bookingStatus)).length;
  const completedCount = bookings.filter((b) => b.bookingStatus === 'completed').length;
  const totalRevenue = bookings
    .filter((b) => b.paymentStatus === 'paid')
    .reduce((sum, b) => sum + (b.amountPaise || 0), 0) / 100;

  return (
    <>
      <Helmet>
        <title>Site Inspections &amp; Bookings | Neevevera CMS</title>
      </Helmet>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        
        {/* Page Title & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-neutral pb-5">
          <div>
            <h1 className="text-2xl font-display font-bold text-graphite flex items-center gap-2">
              <span className="material-symbols-outlined text-brand-blue text-2xl">event_available</span>
              Site Inspections &amp; Booking System
            </h1>
            <p className="text-xs text-soft-grey mt-0.5">
              Manage field appointments, customer reservations, engineer assignments, and payment tokens.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1 bg-surface-muted/60 p-1 rounded-xl border border-border-neutral">
            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'bookings'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-soft-grey hover:text-graphite'
              }`}
            >
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              Bookings ({totalBookings})
            </button>
            <button
              onClick={() => setActiveTab('slots')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'slots'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-soft-grey hover:text-graphite'
              }`}
            >
              <span className="material-symbols-outlined text-sm">schedule</span>
              Slots Management
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'settings'
                  ? 'bg-white text-brand-blue shadow-sm'
                  : 'text-soft-grey hover:text-graphite'
              }`}
            >
              <span className="material-symbols-outlined text-sm">settings</span>
              Settings &amp; Policy
            </button>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────── */}
        {/* TAB 1: BOOKINGS MANAGEMENT */}
        {/* ────────────────────────────────────────────────────── */}
        {activeTab === 'bookings' && (
          <div className="space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-border-neutral">
                <span className="text-xs text-soft-grey font-semibold uppercase tracking-wider">Total Bookings</span>
                <p className="text-2xl font-display font-bold text-graphite mt-1">{totalBookings}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-border-neutral">
                <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">Active / Confirmed</span>
                <p className="text-2xl font-display font-bold text-emerald-600 mt-1">{confirmedCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-border-neutral">
                <span className="text-xs text-brand-blue font-semibold uppercase tracking-wider">Completed Visits</span>
                <p className="text-2xl font-display font-bold text-brand-blue mt-1">{completedCount}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-border-neutral">
                <span className="text-xs text-purple-700 font-semibold uppercase tracking-wider">Token Revenue</span>
                <p className="text-2xl font-display font-bold text-purple-900 mt-1">₹{totalRevenue.toLocaleString('en-IN')}</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="p-4 rounded-2xl bg-white border border-border-neutral flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-soft-grey text-lg">
                  search
                </span>
                <input
                  type="text"
                  placeholder="Search by Booking Ref, Name, Phone, or PIN..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchBookings()}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-border-neutral text-xs focus:ring-2 focus:ring-brand-blue/20"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-44 px-3 py-2 rounded-xl border border-border-neutral text-xs bg-white"
              >
                <option value="">All Visit Statuses</option>
                <option value="hold_placed">Hold Placed</option>
                <option value="confirmed">Confirmed</option>
                <option value="assigned">Engineer Assigned</option>
                <option value="visit_in_progress">Visit in Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="expired">Expired Hold</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full sm:w-40 px-3 py-2 rounded-xl border border-border-neutral text-xs bg-white"
              >
                <option value="">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="refunded">Refunded</option>
              </select>

              <button
                onClick={fetchBookings}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-hover shrink-0"
              >
                Filter
              </button>
            </div>

            {/* Bookings Table */}
            <div className="bg-white rounded-2xl border border-border-neutral overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-surface-warm/60 border-b border-border-neutral text-soft-grey uppercase tracking-wider font-bold">
                      <th className="p-3.5">Ref &amp; Customer</th>
                      <th className="p-3.5">Site Location</th>
                      <th className="p-3.5">Appointment Window</th>
                      <th className="p-3.5">Visit Status</th>
                      <th className="p-3.5">Payment</th>
                      <th className="p-3.5">Assigned Engineer</th>
                      <th className="p-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-neutral/60">
                    {loadingBookings ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-soft-grey">
                          Loading bookings...
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-soft-grey">
                          No site inspection bookings match your criteria.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b._id} className="hover:bg-surface-warm/30 transition-colors">
                          <td className="p-3.5">
                            <span className="font-bold text-graphite block">{b.bookingRef}</span>
                            <span className="text-soft-grey">{b.customerName} &bull; {b.customerPhone}</span>
                          </td>
                          <td className="p-3.5 max-w-[200px]">
                            <span className="truncate block font-medium text-graphite">{b.siteAddress}</span>
                            <span className="text-soft-grey">{b.district}, {b.pinCode}</span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-semibold text-graphite block">
                              {new Date(b.visitStartTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            <span className="text-soft-grey">
                              {new Date(b.visitStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {new Date(b.visitEndTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${
                                b.bookingStatus === 'confirmed' || b.bookingStatus === 'assigned'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.bookingStatus === 'completed'
                                  ? 'bg-blue-100 text-brand-blue'
                                  : b.bookingStatus === 'cancelled'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {b.bookingStatus.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.paymentStatus === 'paid'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : b.paymentStatus === 'refunded'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              ₹{((b.amountPaise || 0) / 100).toLocaleString('en-IN')} &bull; {b.paymentStatus.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3.5">
                            {b.assignedStaff?.name ? (
                              <span className="font-medium text-graphite block">{b.assignedStaff.name}</span>
                            ) : (
                              <span className="text-soft-grey italic">Unassigned</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => handleOpenDetail(b)}
                              className="px-3 py-1.5 rounded-lg border border-border-neutral text-brand-blue font-semibold hover:bg-surface-warm"
                            >
                              Manage
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────── */}
        {/* TAB 2: SLOTS MANAGEMENT */}
        {/* ────────────────────────────────────────────────────── */}
        {activeTab === 'slots' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-graphite">Engineer Inspection Windows</h2>
                <p className="text-xs text-soft-grey">Configure appointment windows, capacity limits, and blocked dates.</p>
              </div>
              <button
                onClick={() => setShowAddSlotModal(true)}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-hover flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Create Inspection Slot
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loadingSlots ? (
                <div className="col-span-full py-12 text-center text-soft-grey">Loading inspection slots...</div>
              ) : slots.length === 0 ? (
                <div className="col-span-full py-12 text-center text-soft-grey">No inspection slots created yet. Click above to add slots.</div>
              ) : (
                slots.map((slot) => {
                  const booked = slot.bookedCount || 0;
                  const reserved = slot.reservedCount || 0;
                  const capacity = slot.capacity || 1;
                  const utilization = Math.min(100, Math.round(((booked + reserved) / capacity) * 100));

                  return (
                    <div
                      key={slot._id}
                      className={`p-4 rounded-2xl border transition-all ${
                        slot.isBlocked
                          ? 'bg-gray-50 border-gray-300 opacity-60'
                          : 'bg-white border-border-neutral shadow-sm'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-graphite text-sm">{slot.label}</span>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            slot.isBlocked
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {slot.isBlocked ? 'Blocked' : 'Active'}
                        </span>
                      </div>

                      <div className="text-xs text-soft-grey space-y-1 mb-3">
                        <p>
                          <strong>Date:</strong>{' '}
                          {new Date(slot.startTime).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                        <p>
                          <strong>Time:</strong>{' '}
                          {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {/* Capacity Bar */}
                      <div className="mb-4">
                        <div className="flex justify-between text-[11px] text-soft-grey mb-1">
                          <span>Capacity Usage</span>
                          <span>
                            {booked} confirmed {reserved > 0 ? `(${reserved} hold)` : ''} / {capacity}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              utilization >= 100 ? 'bg-rose-500' : 'bg-brand-blue'
                            }`}
                            style={{ width: `${utilization}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between border-t border-border-neutral/60 pt-3">
                        <button
                          type="button"
                          onClick={() => handleToggleBlockSlot(slot)}
                          className="text-xs font-semibold text-soft-grey hover:text-graphite"
                        >
                          {slot.isBlocked ? 'Unblock Slot' : 'Block Slot'}
                        </button>
                        {booked === 0 && reserved === 0 && (
                          <button
                            type="button"
                            onClick={() => handleDeleteSlot(slot._id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────── */}
        {/* TAB 3: SETTINGS & POLICY */}
        {/* ────────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-white p-6 rounded-3xl border border-border-neutral shadow-sm">
            <h2 className="text-lg font-bold text-graphite mb-1">Inspection Engine Settings</h2>
            <p className="text-xs text-soft-grey mb-6">
              Fail-closed control switches, Razorpay token amounts, hold windows, and cancellation rules.
            </p>

            <form onSubmit={handleSaveSettings} className="space-y-5">
              
              {/* Feature Flags */}
              <div className="p-4 rounded-2xl bg-surface-warm border border-border-neutral space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sm text-graphite block">Enable Online Site Inspection Booking</span>
                    <span className="text-xs text-soft-grey">If disabled, public users see maintenance/call-desk notice.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.bookingEnabled}
                    onChange={(e) => setSettings((p) => ({ ...p, bookingEnabled: e.target.checked }))}
                    className="h-5 w-5 text-brand-blue rounded border-border-neutral focus:ring-brand-blue"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-border-neutral/60 pt-3">
                  <div>
                    <span className="font-bold text-sm text-graphite block">Require Razorpay Token Payment</span>
                    <span className="text-xs text-soft-grey">If disabled, bookings are confirmed immediately without online gateway checkout.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.paymentsEnabled}
                    onChange={(e) => setSettings((p) => ({ ...p, paymentsEnabled: e.target.checked }))}
                    className="h-5 w-5 text-brand-blue rounded border-border-neutral focus:ring-brand-blue"
                  />
                </div>
              </div>

              {/* Token & Window Rules */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                    Booking Token (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.tokenAmountInr}
                    onChange={(e) => setSettings((p) => ({ ...p, tokenAmountInr: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                    Slot Hold Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={60}
                    value={settings.holdDurationMinutes}
                    onChange={(e) => setSettings((p) => ({ ...p, holdDurationMinutes: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                    Max Advance Booking (Days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={settings.advanceBookingDays}
                    onChange={(e) => setSettings((p) => ({ ...p, advanceBookingDays: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                    Free Cancellation Window (Hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={settings.cancellationWindowHours}
                    onChange={(e) => setSettings((p) => ({ ...p, cancellationWindowHours: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-sm"
                  />
                </div>
              </div>

              {/* Policy Text */}
              <div>
                <label className="block text-xs font-bold text-graphite uppercase tracking-wider mb-1">
                  Terms &amp; Refund Policy (Customer Disclosure)
                </label>
                <textarea
                  rows={4}
                  value={settings.refundPolicy}
                  onChange={(e) => setSettings((p) => ({ ...p, refundPolicy: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border-neutral text-xs"
                />
              </div>

              {settingsMsg && (
                <div className="p-3 rounded-xl bg-blue-50 text-brand-blue text-xs font-medium">
                  {settingsMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={savingSettings}
                className="px-6 py-2.5 bg-brand-blue text-white rounded-xl text-xs font-bold hover:bg-brand-blue-hover transition-colors"
              >
                {savingSettings ? 'Saving...' : 'Save System Settings'}
              </button>
            </form>
          </div>
        )}

        {/* ────────────────────────────────────────────────────── */}
        {/* BOOKING DETAILS MODAL */}
        {/* ────────────────────────────────────────────────────── */}
        {detailModalOpen && selectedBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border-neutral pb-3">
                <div>
                  <h3 className="text-lg font-bold text-graphite">{selectedBooking.bookingRef}</h3>
                  <span className="text-xs text-soft-grey">Placed on {new Date(selectedBooking.createdAt).toLocaleString()}</span>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200"
                >
                  &times;
                </button>
              </div>

              {actionSuccess && (
                <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl font-medium">
                  {actionSuccess}
                </div>
              )}
              {actionError && (
                <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-xl font-medium">
                  {actionError}
                </div>
              )}

              {/* Customer & Location */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-surface-warm/40 p-4 rounded-2xl">
                <div>
                  <span className="text-soft-grey block">Customer</span>
                  <strong className="text-graphite">{selectedBooking.customerName}</strong>
                </div>
                <div>
                  <span className="text-soft-grey block">Phone</span>
                  <strong className="text-graphite">{selectedBooking.customerPhone}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-soft-grey block">Site Address</span>
                  <p className="text-graphite">{selectedBooking.siteAddress}, {selectedBooking.district}, {selectedBooking.state} - {selectedBooking.pinCode}</p>
                </div>
              </div>

              {/* Assign Field Engineer */}
              <div className="p-4 rounded-2xl border border-border-neutral space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-graphite">Assign Senior Field Engineer</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Engineer Name"
                    value={assignName}
                    onChange={(e) => setAssignName(e.target.value)}
                    className="px-3 py-2 border border-border-neutral rounded-xl text-xs"
                  />
                  <input
                    type="tel"
                    placeholder="Engineer Mobile Phone"
                    value={assignPhone}
                    onChange={(e) => setAssignPhone(e.target.value)}
                    className="px-3 py-2 border border-border-neutral rounded-xl text-xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAssignStaff}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-hover"
                >
                  Save Assignment
                </button>
              </div>

              {/* Add Internal Audit Note */}
              <div className="p-4 rounded-2xl border border-border-neutral space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-graphite">Add Internal Note / Follow-up</h4>
                <textarea
                  rows={2}
                  placeholder="Type note for audit log..."
                  value={adminNoteText}
                  onChange={(e) => setAdminNoteText(e.target.value)}
                  className="w-full px-3 py-2 border border-border-neutral rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddNote}
                  disabled={actionLoading || !adminNoteText.trim()}
                  className="px-4 py-2 bg-surface-muted text-graphite border border-border-neutral rounded-xl text-xs font-semibold hover:bg-surface-warm"
                >
                  Add Audit Note
                </button>
              </div>

              {/* State Transitions */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-neutral pt-4">
                <div className="flex items-center gap-2">
                  {selectedBooking.bookingStatus !== 'completed' && (
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700"
                    >
                      Mark Visit Completed
                    </button>
                  )}
                  {selectedBooking.bookingStatus !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={handleCancelBooking}
                      disabled={actionLoading}
                      className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold hover:bg-rose-100"
                    >
                      Cancel Booking
                    </button>
                  )}
                </div>

                {/* Refund Button for Superadmin */}
                {isSuperadmin && selectedBooking.paymentStatus === 'paid' && (
                  <button
                    type="button"
                    onClick={handleRefund}
                    disabled={actionLoading}
                    className="px-3 py-2 bg-purple-50 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold hover:bg-purple-100"
                  >
                    Initiate Razorpay Refund
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────── */}
        {/* ADD SLOT MODAL */}
        {/* ────────────────────────────────────────────────────── */}
        {showAddSlotModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border-neutral pb-3">
                <h3 className="font-bold text-graphite text-base">New Inspection Slot</h3>
                <button
                  onClick={() => setShowAddSlotModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleCreateSlot} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-graphite mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newSlot.date}
                    onChange={(e) => setNewSlot((p) => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-neutral"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-graphite mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot((p) => ({ ...p, startTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border-neutral"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-graphite mb-1">End Time</label>
                    <input
                      type="time"
                      required
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot((p) => ({ ...p, endTime: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-border-neutral"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-bold text-graphite mb-1">Window Label</label>
                  <input
                    type="text"
                    required
                    value={newSlot.label}
                    onChange={(e) => setNewSlot((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Morning Window (10 AM - 1 PM)"
                    className="w-full px-3 py-2 rounded-xl border border-border-neutral"
                  />
                </div>
                <div>
                  <label className="block font-bold text-graphite mb-1">Capacity (Max Bookings)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={newSlot.capacity}
                    onChange={(e) => setNewSlot((p) => ({ ...p, capacity: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-border-neutral"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddSlotModal(false)}
                    className="px-4 py-2 border border-border-neutral rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-blue text-white rounded-xl font-bold hover:bg-brand-blue-hover"
                  >
                    Create Slot
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
