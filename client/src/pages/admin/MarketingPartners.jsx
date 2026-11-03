import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';
import {
  FiCheck,
  FiX,
  FiSlash,
  FiDownload,
  FiShare2,
  FiSearch,
  FiFilter,
  FiRefreshCw,
  FiDollarSign,
  FiUsers,
  FiInbox,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiCopy,
} from 'react-icons/fi';

export default function MarketingPartners() {
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'partners' | 'enquiries' | 'incentives'
  
  // Data states
  const [partners, setPartners] = useState([]);
  const [enquiries, setEnquiries] = useState([]);
  const [incentives, setIncentives] = useState([]);
  const [counts, setCounts] = useState({ pendingApproval: 0, approved: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [copiedCode, setCopiedCode] = useState('');

  // Modals
  const [actionModal, setActionModal] = useState({ open: false, type: '', partner: null, reason: '' });
  const [convertModal, setConvertModal] = useState({ open: false, enquiry: null, contractValueInr: '', notes: '' });
  const [payoutModal, setPayoutModal] = useState({ open: false, incentive: null, paymentRef: '', notes: '' });
  const [actionLoading, setActionLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Settings tab
  const [settings, setSettings] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsError, setSettingsError] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    attributionWindowDays: 60,
    termsNotice: '',
  });

  // Fetch partners
  const fetchPartners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/partners/admin', {
        params: { search: search.trim() },
      });
      if (res.data?.success) {
        setPartners(res.data.partners || []);
        setCounts(res.data.counts || { pendingApproval: 0, approved: 0 });
      }
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  // Fetch referred enquiries
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/enquiries', {
        params: { attributionStatus: 'attributed' },
      });
      if (res.data?.success) {
        setEnquiries(res.data.data || res.data.enquiries || []);
      }
    } catch (err) {
      console.error('Failed to load enquiries:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch incentives
  const fetchIncentives = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.get('/partners/admin/settings');
      // For list of all incentives, we can query partners detail or export
      // Let's load active partners to assemble ledgers
      const pRes = await adminApi.get('/partners/admin');
      if (pRes.data?.success) {
        // Collect from details
        const list = [];
        for (const p of pRes.data.partners.slice(0, 10)) {
          try {
            const det = await adminApi.get(`/partners/admin/${p._id}`);
            if (det.data?.incentives) list.push(...det.data.incentives);
          } catch (_) {}
        }
        setIncentives(list);
      }
    } catch (err) {
      console.error('Failed to load incentives:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch programme settings
  const fetchSettings = useCallback(async () => {
    setSettingsLoading(true);
    setSettingsError('');
    try {
      const res = await adminApi.get('/partners/admin/settings');
      if (res.data?.success) {
        setSettings(res.data.settings);
        setSettingsForm({
          attributionWindowDays: res.data.settings.attributionWindowDays || 60,
          termsNotice: res.data.settings.termsNotice || '',
        });
      }
    } catch (err) {
      setSettingsError('Failed to load programme settings.');
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'applications' || activeTab === 'partners') {
      fetchPartners();
    } else if (activeTab === 'enquiries') {
      fetchEnquiries();
    } else if (activeTab === 'incentives') {
      fetchIncentives();
    } else if (activeTab === 'settings') {
      fetchSettings();
    }
  }, [activeTab, fetchPartners, fetchEnquiries, fetchIncentives, fetchSettings]);

  // Handle partner status change
  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!actionModal.partner) return;
    setActionLoading(true);
    setModalError('');

    try {
      const res = await adminApi.patch(`/partners/admin/${actionModal.partner._id}/status`, {
        action: actionModal.type,
        reason: actionModal.reason,
      });
      if (res.data?.success) {
        setActionModal({ open: false, type: '', partner: null, reason: '' });
        fetchPartners();
      } else {
        setModalError(res.data?.error || 'Action failed.');
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle mark conversion
  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    if (!convertModal.enquiry) return;
    setActionLoading(true);
    setModalError('');

    const contractPaise = convertModal.contractValueInr
      ? Math.round(parseFloat(convertModal.contractValueInr) * 100)
      : 0;

    try {
      const res = await adminApi.patch(
        `/partners/admin/enquiries/${convertModal.enquiry._id}/conversion`,
        {
          contractValuePaise: contractPaise,
          notes: convertModal.notes,
        }
      );
      if (res.data?.success) {
        setConvertModal({ open: false, enquiry: null, contractValueInr: '', notes: '' });
        fetchEnquiries();
      } else {
        setModalError(res.data?.error || 'Conversion update failed.');
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to record conversion.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle mark paid
  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    if (!payoutModal.incentive) return;
    setActionLoading(true);
    setModalError('');

    try {
      const res = await adminApi.post(
        `/partners/admin/incentives/${payoutModal.incentive._id}/mark-paid`,
        {
          paymentReference: payoutModal.paymentRef,
          notes: payoutModal.notes,
        }
      );
      if (res.data?.success) {
        setPayoutModal({ open: false, incentive: null, paymentRef: '', notes: '' });
        fetchIncentives();
      } else {
        setModalError(res.data?.error || 'Payout update failed.');
      }
    } catch (err) {
      setModalError(err.response?.data?.error || 'Failed to update payout record.');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle settings save
  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSettingsLoading(true);
    setSettingsError('');
    setSettingsSaved(false);
    try {
      const res = await adminApi.put('/partners/admin/settings', {
        attributionWindowDays: parseInt(settingsForm.attributionWindowDays, 10),
        termsNotice: settingsForm.termsNotice,
      });
      if (res.data?.success) {
        setSettings(res.data.settings);
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 3000);
      } else {
        setSettingsError(res.data?.error || 'Failed to save settings.');
      }
    } catch (err) {
      setSettingsError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const copyReferralLink = (code) => {
    const baseUrl = window.location.origin;
    const url = `${baseUrl}/?ref=${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const applicationsList = partners.filter((p) => p.status === 'pending_approval' || p.status === 'pending_email');
  const activePartnersList = partners.filter((p) => p.status === 'approved' || p.status === 'suspended');

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-neutral">
        <div>
          <div className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-brand-blue mb-1">
            <span>Interactions / Referral Programme</span>
          </div>
          <h1 className="font-display text-2xl font-bold text-graphite tracking-tight">
            Marketing Partners &amp; Referrals
          </h1>
          <p className="text-xs text-soft-grey mt-0.5">
            Manage partner onboarding, high-entropy referral codes, enquiry attributions, and financial ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="/api/partners/admin/incentives/export"
            download
            className="px-3.5 py-2 bg-white border border-border-neutral rounded-xl text-xs font-semibold text-graphite hover:bg-neutral-50 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <FiDownload className="text-brand-blue" />
            <span>Export Ledgers (CSV)</span>
          </a>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-border-neutral pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'applications'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'text-soft-grey hover:text-graphite bg-surface-warm'
          }`}
        >
          <FiUsers />
          <span>Applications</span>
          {counts.pendingApproval > 0 && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-mono">
              {counts.pendingApproval}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('partners')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'partners'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'text-soft-grey hover:text-graphite bg-surface-warm'
          }`}
        >
          <FiCheckCircle />
          <span>Active Partners ({counts.approved})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('enquiries')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'enquiries'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'text-soft-grey hover:text-graphite bg-surface-warm'
          }`}
        >
          <FiInbox />
          <span>Referred Enquiries</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('incentives')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'incentives'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'text-soft-grey hover:text-graphite bg-surface-warm'
          }`}
        >
          <FiDollarSign />
          <span>Incentive Ledgers</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-brand-blue text-white shadow-xs'
              : 'text-soft-grey hover:text-graphite bg-surface-warm'
          }`}
        >
          <FiFilter />
          <span>Programme Settings</span>
        </button>
      </div>

      {/* ── Search Bar (for partner views) ── */}
      {(activeTab === 'applications' || activeTab === 'partners') && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search partner by name, email, phone, code..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-border-neutral rounded-xl text-xs focus:outline-none focus:border-brand-blue"
            />
          </div>
          <button
            type="button"
            onClick={fetchPartners}
            className="p-2 bg-white border border-border-neutral rounded-xl text-gray-600 hover:text-graphite text-xs cursor-pointer"
            title="Refresh list"
          >
            <FiRefreshCw className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: APPLICATIONS QUEUE
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-border-neutral overflow-hidden shadow-xs">
          <div className="p-4 bg-surface-warm border-b border-border-neutral flex items-center justify-between">
            <span className="font-display font-bold text-xs uppercase text-graphite tracking-wide">
              Pending Partner Applications ({applicationsList.length})
            </span>
          </div>

          {applicationsList.length === 0 ? (
            <div className="p-12 text-center text-xs text-soft-grey space-y-2">
              <FiCheckCircle className="text-3xl text-emerald-600 mx-auto" />
              <p className="font-semibold text-graphite">All partner applications have been reviewed.</p>
              <p>New partner applications will appear here once email verification is completed.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[10px] font-mono uppercase text-soft-grey border-b border-border-neutral">
                  <tr>
                    <th className="p-3.5">Applicant Name</th>
                    <th className="p-3.5">Contact Details</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Email Status</th>
                    <th className="p-3.5 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {applicationsList.map((p) => (
                    <tr key={p._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3.5 font-bold text-graphite">{p.name}</td>
                      <td className="p-3.5 space-y-0.5">
                        <div className="font-mono text-gray-800">{p.phone}</div>
                        <div className="text-soft-grey">{p.email}</div>
                      </td>
                      <td className="p-3.5 text-gray-700">
                        {p.city} ({p.pin})
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-100 text-gray-700">
                          {p.partnerType}
                        </span>
                      </td>
                      <td className="p-3.5">
                        {p.status === 'pending_email' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Awaiting Email
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            ✓ Verified
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => setActionModal({ open: true, type: 'approve', partner: p, reason: '' })}
                          className="px-3 py-1.5 bg-brand-blue text-white rounded-lg text-xs font-semibold hover:bg-brand-blue-hover cursor-pointer"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => setActionModal({ open: true, type: 'reject', partner: p, reason: '' })}
                          className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 cursor-pointer"
                        >
                          Reject
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: ACTIVE PARTNERS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'partners' && (
        <div className="bg-white rounded-2xl border border-border-neutral overflow-hidden shadow-xs">
          <div className="p-4 bg-surface-warm border-b border-border-neutral flex items-center justify-between">
            <span className="font-display font-bold text-xs uppercase text-graphite tracking-wide">
              Approved Referral Partners ({activePartnersList.length})
            </span>
          </div>

          {activePartnersList.length === 0 ? (
            <div className="p-12 text-center text-xs text-soft-grey">
              No active marketing partners found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[10px] font-mono uppercase text-soft-grey border-b border-border-neutral">
                  <tr>
                    <th className="p-3.5">Partner</th>
                    <th className="p-3.5">Unique Referral Code</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Referral Metrics</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {activePartnersList.map((p) => (
                    <tr key={p._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-graphite">{p.name}</div>
                        <div className="text-[11px] text-soft-grey font-mono">{p.phone}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-[#07558F]/10 text-brand-blue px-2.5 py-1 rounded border border-[#07558F]/20">
                            {p.referralCode}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyReferralLink(p.referralCode)}
                            className="p-1.5 text-gray-500 hover:text-brand-blue rounded bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
                            title="Copy 60-day shareable referral URL"
                          >
                            {copiedCode === p.referralCode ? (
                              <span className="text-[10px] text-emerald-700 font-bold">Copied!</span>
                            ) : (
                              <FiCopy className="text-xs" />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 text-gray-700">
                        {p.city} ({p.pin})
                      </td>
                      <td className="p-3.5">
                        <div className="text-xs font-mono font-bold text-graphite">
                          {p.metrics?.total || 0} Referred
                        </div>
                        <div className="text-[11px] text-emerald-700 font-mono">
                          {p.metrics?.converted || 0} Converted
                        </div>
                      </td>
                      <td className="p-3.5">
                        {p.status === 'approved' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Suspended
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {p.status === 'approved' ? (
                          <button
                            type="button"
                            onClick={() => setActionModal({ open: true, type: 'suspend', partner: p, reason: '' })}
                            className="px-3 py-1 bg-white border border-amber-200 text-amber-700 rounded text-xs font-semibold hover:bg-amber-50 cursor-pointer"
                          >
                            Suspend
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setActionModal({ open: true, type: 'approve', partner: p, reason: '' })}
                            className="px-3 py-1 bg-brand-blue text-white rounded text-xs font-semibold hover:bg-brand-blue-hover cursor-pointer"
                          >
                            Reactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: REFERRED ENQUIRIES & CONVERSIONS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'enquiries' && (
        <div className="bg-white rounded-2xl border border-border-neutral overflow-hidden shadow-xs">
          <div className="p-4 bg-surface-warm border-b border-border-neutral flex items-center justify-between">
            <span className="font-display font-bold text-xs uppercase text-graphite tracking-wide">
              Attributed Customer Inquiries ({enquiries.length})
            </span>
          </div>

          {enquiries.length === 0 ? (
            <div className="p-12 text-center text-xs text-soft-grey">
              No referred enquiries found. Inquiries with valid ?ref=NV-XXXX cookies will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[10px] font-mono uppercase text-soft-grey border-b border-border-neutral">
                  <tr>
                    <th className="p-3.5">Customer Lead</th>
                    <th className="p-3.5">Referring Partner</th>
                    <th className="p-3.5">Enquiry Type</th>
                    <th className="p-3.5">Date</th>
                    <th className="p-3.5">Conversion Status</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {enquiries.map((enq) => (
                    <tr key={enq._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-graphite">{enq.name}</div>
                        <div className="text-[11px] text-soft-grey font-mono">{enq.phone} • {enq.email}</div>
                      </td>
                      <td className="p-3.5">
                        <div className="font-semibold text-brand-blue">{enq.partnerId?.name || 'Partner'}</div>
                        <div className="font-mono text-[10px] text-gray-500">{enq.refCode}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-neutral-100 text-gray-700">
                          {enq.type}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-500 font-mono text-[11px]">
                        {enq.createdAt ? new Date(enq.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3.5">
                        {enq.conversionStatus === 'converted' ? (
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ Converted
                            </span>
                            {enq.conversionValuePaise > 0 && (
                              <div className="text-[10px] font-mono text-gray-500">
                                ₹{(enq.conversionValuePaise / 100).toLocaleString('en-IN')}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-gray-600">
                            Pending Conversion
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        {enq.conversionStatus !== 'converted' ? (
                          <button
                            type="button"
                            onClick={() => setConvertModal({ open: true, enquiry: enq, contractValueInr: '', notes: '' })}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
                          >
                            Mark Converted
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic font-medium">Recorded</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: INCENTIVE LEDGERS (APPEND-ONLY)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'incentives' && (
        <div className="bg-white rounded-2xl border border-border-neutral overflow-hidden shadow-xs">
          <div className="p-4 bg-surface-warm border-b border-border-neutral flex items-center justify-between">
            <span className="font-display font-bold text-xs uppercase text-graphite tracking-wide">
              Append-Only Incentive Financial Ledgers
            </span>
          </div>

          {incentives.length === 0 ? (
            <div className="p-12 text-center text-xs text-soft-grey space-y-2">
              <FiDollarSign className="text-3xl text-gray-300 mx-auto" />
              <p className="font-semibold text-graphite">No financial ledger entries recorded yet.</p>
              <p>Per client specification, commercial incentive calculations remain disabled until written approval.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF9F6] text-[10px] font-mono uppercase text-soft-grey border-b border-border-neutral">
                  <tr>
                    <th className="p-3.5">Idempotency Key</th>
                    <th className="p-3.5">Event Type</th>
                    <th className="p-3.5">Amount (INR)</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Payment Reference</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {incentives.map((i) => (
                    <tr key={i._id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="p-3.5 font-mono text-gray-700">{i.idempotencyKey}</td>
                      <td className="p-3.5 font-mono uppercase text-[10px] font-bold text-brand-blue">
                        {i.eventType}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-graphite">
                        ₹{((i.amountPaise || 0) / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-3.5">
                        {i.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Pending Payout
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 font-mono text-gray-600">
                        {i.paymentReference || '—'}
                      </td>
                      <td className="p-3.5 text-right">
                        {i.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => setPayoutModal({ open: true, incentive: i, paymentRef: '', notes: '' })}
                            className="px-3 py-1 bg-brand-blue text-white rounded text-xs font-semibold hover:bg-brand-blue-hover cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: PROGRAMME SETTINGS
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Incentive calculation status banner */}
          <div className={`p-4 rounded-2xl border flex items-start gap-3 ${
            settings?.isIncentiveCalculationActive
              ? 'bg-emerald-50 border-emerald-200'
              : 'bg-amber-50 border-amber-200'
          }`}>
            <FiAlertCircle className={`mt-0.5 flex-shrink-0 ${settings?.isIncentiveCalculationActive ? 'text-emerald-600' : 'text-amber-600'}`} />
            <div>
              <p className={`text-xs font-bold uppercase tracking-wide ${settings?.isIncentiveCalculationActive ? 'text-emerald-700' : 'text-amber-700'}`}>
                Incentive Calculations: {settings?.isIncentiveCalculationActive ? 'ENABLED' : 'DISABLED'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">
                {settings?.isIncentiveCalculationActive
                  ? 'Financial incentive calculations are active. Conversions will generate accrual ledger entries.'
                  : 'Incentive financial calculations are disabled pending written client approval. Conversions are recorded for audit only. Contact the Neevevera directorate to enable.'}
              </p>
            </div>
          </div>

          {/* Active rule snapshot (read-only) */}
          {settings?.activeRule && (
            <div className="bg-white rounded-2xl border border-border-neutral p-5 space-y-3">
              <h3 className="font-display font-bold text-xs uppercase tracking-wide text-graphite">
                Active Incentive Rule — Read Only
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  ['Basis',              settings.activeRule.basis || '—'],
                  ['Value',              settings.activeRule.value ? `₹${(settings.activeRule.value / 100).toLocaleString('en-IN')}` : '—'],
                  ['Qualifying Trigger', settings.activeRule.qualifyingTrigger || '—'],
                  ['Rule Version',       settings.activeRule.version || 'v1.0'],
                ].map(([label, value]) => (
                  <div key={label} className="space-y-0.5">
                    <p className="text-[10px] text-soft-grey uppercase font-mono tracking-wide">{label}</p>
                    <p className="text-xs font-semibold text-graphite">{value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-soft-grey">
                Rule changes require written client approval and must be applied via server configuration.
              </p>
            </div>
          )}

          {/* Editable settings form */}
          <form onSubmit={handleSettingsSave} className="bg-white rounded-2xl border border-border-neutral p-5 space-y-5">
            <h3 className="font-display font-bold text-xs uppercase tracking-wide text-graphite">
              Programme Configuration
            </h3>

            {settingsError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{settingsError}</div>
            )}
            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                <FiCheck /> Settings saved successfully.
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">
                  Attribution Window (days)
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={settingsForm.attributionWindowDays}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, attributionWindowDays: e.target.value }))}
                  className="w-full p-2.5 text-xs font-mono border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
                />
                <p className="text-[10px] text-soft-grey mt-0.5">
                  First-touch cookie lifetime. Currently {settings?.attributionWindowDays || 60} days. Range: 1–365.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">
                  Programme Terms Notice
                </label>
                <textarea
                  rows="3"
                  value={settingsForm.termsNotice}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, termsNotice: e.target.value }))}
                  placeholder="Optional internal notice for admin team..."
                  className="w-full p-2.5 text-xs border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={settingsLoading}
                className="px-5 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider hover:bg-brand-blue-hover disabled:opacity-50 cursor-pointer"
              >
                {settingsLoading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>

          {/* V1 amendment constraints note */}
          <div className="text-[11px] text-soft-grey bg-surface-warm rounded-xl p-4 border border-border-neutral space-y-1.5">
            <p className="font-semibold text-graphite text-xs">V1 Amendment Constraints</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>First-touch attribution wins — later referral codes cannot overwrite an existing cookie</li>
              <li>Incentive calculation toggle requires written client approval before enabling</li>
              <li>All referral codes use 64-bit entropy (NV- + 16 hex chars)</li>
              <li>Financial ledger is append-only — use reversal events, never edit history</li>
            </ul>
          </div>
        </div>
      )}

      {/* ── Status Change Modal (Approve / Reject / Suspend) ── */}
      {actionModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-base text-graphite uppercase tracking-wide">
              {actionModal.type === 'approve'
                ? 'Approve Marketing Partner'
                : actionModal.type === 'reject'
                ? 'Reject Partner Application'
                : 'Suspend Partner Account'}
            </h3>

            {modalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                {modalError}
              </div>
            )}

            <p className="text-xs text-soft-grey leading-relaxed">
              {actionModal.type === 'approve'
                ? `Approving ${actionModal.partner?.name} will generate a unique 64-bit referral code (NV-XXXX) and send an automated welcome email with their referral link.`
                : `Please provide an internal reason for this administrative decision on ${actionModal.partner?.name}.`}
            </p>

            {actionModal.type !== 'approve' && (
              <div>
                <label className="block text-xs font-semibold text-graphite mb-1">Internal Reason *</label>
                <textarea
                  required
                  rows="3"
                  value={actionModal.reason}
                  onChange={(e) => setActionModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Record justification for audit trail..."
                  className="w-full p-2.5 text-xs border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionModal({ open: false, type: '', partner: null, reason: '' })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleStatusSubmit}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider hover:bg-brand-blue-hover cursor-pointer"
              >
                {actionLoading ? 'Saving...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Conversion Modal ── */}
      {convertModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-base text-graphite uppercase tracking-wide">
              Record Qualifying Customer Conversion
            </h3>

            {modalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                {modalError}
              </div>
            )}

            <div className="p-3 bg-surface-warm rounded-xl border border-border-neutral text-xs space-y-1">
              <div><strong>Lead:</strong> {convertModal.enquiry?.name}</div>
              <div><strong>Partner:</strong> {convertModal.enquiry?.partnerId?.name || 'Referred'} ({convertModal.enquiry?.refCode})</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite mb-1">
                Verified Contract Value (INR)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={convertModal.contractValueInr}
                onChange={(e) => setConvertModal((prev) => ({ ...prev, contractValueInr: e.target.value }))}
                placeholder="e.g. 2500000"
                className="w-full p-2.5 text-xs font-mono border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
              />
              <span className="text-[10px] text-soft-grey mt-0.5 block">
                Recorded for audit. Commercial payout calculations remain disabled pending client approval.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite mb-1">Audit Notes</label>
              <textarea
                rows="2"
                value={convertModal.notes}
                onChange={(e) => setConvertModal((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g. Civil tender work order signed on site"
                className="w-full p-2.5 text-xs border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConvertModal({ open: false, enquiry: null, contractValueInr: '', notes: '' })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConversionSubmit}
                className="px-4 py-2 bg-emerald-700 text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider hover:bg-emerald-800 cursor-pointer"
              >
                {actionLoading ? 'Recording...' : 'Mark Converted'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payout Modal ── */}
      {payoutModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-display font-bold text-base text-graphite uppercase tracking-wide">
              Record Manual Incentive Payout
            </h3>

            {modalError && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded text-red-600 text-xs">
                {modalError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-graphite mb-1">
                Bank UTR / Transaction Reference *
              </label>
              <input
                type="text"
                required
                value={payoutModal.paymentRef}
                onChange={(e) => setPayoutModal((prev) => ({ ...prev, paymentRef: e.target.value }))}
                placeholder="e.g. UTR1234567890 / NEFT"
                className="w-full p-2.5 text-xs font-mono border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-graphite mb-1">Disbursement Notes</label>
              <textarea
                rows="2"
                value={payoutModal.notes}
                onChange={(e) => setPayoutModal((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Processed via corporate net banking"
                className="w-full p-2.5 text-xs border border-border-neutral rounded-xl bg-surface-warm focus:outline-none focus:border-brand-blue"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPayoutModal({ open: false, incentive: null, paymentRef: '', notes: '' })}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-black cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePayoutSubmit}
                className="px-4 py-2 bg-brand-blue text-white rounded-xl text-xs font-bold font-display uppercase tracking-wider hover:bg-brand-blue-hover cursor-pointer"
              >
                {actionLoading ? 'Updating...' : 'Record Paid'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

