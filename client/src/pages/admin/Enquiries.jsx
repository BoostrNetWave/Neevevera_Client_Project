import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const API = '';

const STATUSES = ['new', 'read', 'contacted', 'boq-sent', 'won', 'lost', 'closed'];

const STATUS_BADGE = {
  'new':       'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  'read':      'bg-surface-muted text-graphite border-border-neutral',
  'contacted': 'bg-amber-100 text-amber-800 border-amber-200',
  'boq-sent':  'bg-purple-100 text-purple-800 border-purple-200',
  'won':       'bg-brand-green/10 text-brand-green border-brand-green/20',
  'lost':      'bg-red-50 text-red-600 border-red-200',
  'closed':    'bg-surface-muted text-soft-grey border-border-neutral line-through',
};

const ATTRIBUTION_BADGE = {
  attributed:            'bg-emerald-50 text-emerald-700 border-emerald-200',
  self_referral_blocked: 'bg-neutral-100 text-neutral-500 border-neutral-200',
  duplicate_blocked:     'bg-neutral-100 text-neutral-500 border-neutral-200',
  not_attributed:        '',
};

const AdminEnquiries = () => {
  const [items, setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [page, setPage]     = useState(1);
  const [pages, setPages]   = useState(1);
  const [total, setTotal]   = useState(0);
  const [filter, setFilter] = useState('All');

  // Drawer
  const [drawer, setDrawer] = useState({ open: false, row: null });

  // Conversion sub-modal (inside drawer)
  const [convModal, setConvModal] = useState({
    open: false,
    contractValueInr: '',
    notes: '',
    loading: false,
    error: '',
    success: false,
  });

  // ── Fetch list ──────────────────────────────────────────────────
  const fetchItems = useCallback(async (pageNum = 1, currentFilter = filter) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (currentFilter !== 'All') {
        if (currentFilter === 'New')           params.status = 'new';
        if (currentFilter === 'Under Review')  params.status = 'read';
        if (currentFilter === 'Proposal Sent') params.status = 'boq-sent';
        if (currentFilter === 'Won')           params.status = 'won';
        if (currentFilter === 'Closed')        params.status = 'closed';
      }
      const res = await adminApi.get(`${API}/enquiries`, { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load enquiries.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchItems(1, filter); }, [fetchItems, filter]);

  // ── Status update ───────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    try {
      await adminApi.patch(`${API}/enquiries/${id}`, { status: newStatus });
      setItems(prev => prev.map(item => item._id === id ? { ...item, status: newStatus } : item));
      if (drawer.open && drawer.row?._id === id) {
        setDrawer(prev => ({ ...prev, row: { ...prev.row, status: newStatus } }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  // ── Mark converted (from drawer) ────────────────────────────────
  const handleConversionSubmit = async (e) => {
    e.preventDefault();
    if (!drawer.row) return;
    setConvModal(prev => ({ ...prev, loading: true, error: '', success: false }));
    const contractValuePaise = convModal.contractValueInr
      ? Math.round(parseFloat(convModal.contractValueInr) * 100)
      : 0;
    try {
      const res = await adminApi.patch(
        `/partners/admin/enquiries/${drawer.row._id}/conversion`,
        { contractValuePaise, notes: convModal.notes }
      );
      if (res.data?.success) {
        setConvModal({ open: false, contractValueInr: '', notes: '', loading: false, error: '', success: false });
        // Refresh list and update drawer
        await fetchItems(page, filter);
        setDrawer(prev => ({
          ...prev,
          row: { ...prev.row, conversionStatus: 'converted' },
        }));
      } else {
        setConvModal(prev => ({ ...prev, loading: false, error: res.data?.error || 'Conversion failed.' }));
      }
    } catch (err) {
      setConvModal(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.error || 'Failed to record conversion.',
      }));
    }
  };

  // ── Open drawer ─────────────────────────────────────────────────
  const openDrawer = (row) => {
    setDrawer({ open: true, row });
    setConvModal({ open: false, contractValueInr: '', notes: '', loading: false, error: '', success: false });
  };

  const closeDrawer = () => {
    setDrawer({ open: false, row: null });
    setConvModal({ open: false, contractValueInr: '', notes: '', loading: false, error: '', success: false });
  };

  // ── Attribution label ───────────────────────────────────────────
  const renderAttributionBadge = (row, compact = false) => {
    if (!row.attributionStatus || row.attributionStatus === 'not_attributed') return null;
    if (row.attributionStatus === 'attributed') {
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono ${ATTRIBUTION_BADGE.attributed}`}>
          🤝 Referred · {row.refCode || '—'}
        </span>
      );
    }
    if (!compact) {
      const label = row.attributionStatus === 'self_referral_blocked'
        ? 'Self-referral blocked'
        : row.attributionStatus === 'duplicate_blocked'
        ? 'Duplicate blocked'
        : row.attributionStatus;
      return (
        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono ${ATTRIBUTION_BADGE[row.attributionStatus] || ''}`}>
          ⊘ {label}
        </span>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* ── Page header ── */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Enquiries
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Incoming project requests and RFQs — {total} record{total !== 1 ? 's' : ''} found.
          </p>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto">
        {['All', 'New', 'Under Review', 'Proposal Sent', 'Won', 'Closed'].map((tab) => (
          <button
            key={tab}
            onClick={() => { setFilter(tab); fetchItems(1, tab); }}
            className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
              filter === tab
                ? 'bg-brand-blue text-white'
                : 'bg-white border border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">inbox</span>
            <p className="text-sm">No enquiries found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Client / Ref', 'Scope', 'Contact', 'Type', 'Status', 'Date'].map(h => (
                  <th key={h} className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {items.map(row => (
                <tr
                  key={row._id}
                  onClick={() => openDrawer(row)}
                  className="hover:bg-surface-warm transition-colors cursor-pointer"
                >
                  {/* Client / Ref */}
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-graphite block">{row.name}</span>
                    <span className="text-xs text-soft-grey">{row.organization || 'Individual'}</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {renderAttributionBadge(row, true)}
                      {row.attributionStatus === 'attributed' && row.conversionStatus === 'converted' && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-mono bg-brand-blue/10 text-brand-blue border-brand-blue/20">
                          ✓ Converted
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Scope */}
                  <td className="py-3.5 px-5">
                    <span className="text-graphite block truncate max-w-xs" title={row.projectScope}>
                      {row.projectScope}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-soft-grey">{row.serviceCategory || 'General'}</span>
                      {row.module && (
                        <span className="px-1.5 py-0.5 bg-brand-blue/10 text-brand-blue border border-brand-blue/20 rounded text-[10px] font-bold font-mono">
                          Module: {row.module}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Contact */}
                  <td className="py-3.5 px-5">
                    <div className="text-xs text-soft-grey flex flex-col gap-0.5">
                      <a
                        href={`mailto:${row.email}`}
                        onClick={e => e.stopPropagation()}
                        className="hover:text-brand-blue flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">mail</span>{row.email}
                      </a>
                      {row.phone && (
                        <a
                          href={`tel:${row.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="hover:text-brand-blue flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[12px]">call</span>{row.phone}
                        </a>
                      )}
                    </div>
                  </td>

                  {/* Type */}
                  <td className="py-3.5 px-5">
                    <span className="text-xs text-soft-grey uppercase">
                      {(row.type || 'contact').replace(/[-_]/g, ' ')}
                    </span>
                  </td>

                  {/* Status — stop propagation so row click doesn't fire */}
                  <td className="py-3.5 px-5" onClick={e => e.stopPropagation()}>
                    <select
                      value={row.status}
                      onChange={e => updateStatus(row._id, e.target.value)}
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-sm px-2 py-1 outline-none border transition-colors cursor-pointer font-display ${STATUS_BADGE[row.status] || STATUS_BADGE['new']}`}
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s.replace('-', ' ')}</option>)}
                    </select>
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-5 text-xs text-soft-grey whitespace-nowrap">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-soft-grey">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchItems(page - 1)}
              disabled={page <= 1 || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display"
            >
              Prev
            </button>
            <button
              onClick={() => fetchItems(page + 1)}
              disabled={page >= pages || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          DRAWER — Enquiry Detail Panel
         ══════════════════════════════════════════════════════════ */}
      {drawer.open && drawer.row && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
            onClick={closeDrawer}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:max-w-lg bg-white shadow-2xl flex flex-col overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border-neutral bg-surface-warm flex-shrink-0">
              <div>
                <h2 className="font-display font-bold text-base text-graphite tracking-tight">
                  Enquiry Detail
                </h2>
                <p className="text-xs text-soft-grey mt-0.5">{drawer.row.name}</p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-1.5 rounded hover:bg-border-neutral text-soft-grey hover:text-graphite transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Drawer body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* ── Basic Info ── */}
              <section className="space-y-3">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-soft-grey border-b border-border-neutral pb-1">
                  Client Information
                </h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                  {[
                    ['Name',           drawer.row.name],
                    ['Organisation',   drawer.row.organization || 'Individual'],
                    ['Email',          drawer.row.email],
                    ['Phone',          drawer.row.phone || '—'],
                    ['Type',           (drawer.row.type || 'contact').replace(/[-_]/g, ' ')],
                    ['Service',        drawer.row.serviceCategory || 'General'],
                    ['Date',           new Date(drawer.row.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-soft-grey uppercase font-mono text-[10px] tracking-wide">{label}</dt>
                      <dd className="text-graphite font-semibold mt-0.5 break-all">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              {/* ── Project Scope ── */}
              <section className="space-y-2">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-soft-grey border-b border-border-neutral pb-1">
                  Project Scope
                </h3>
                <p className="text-xs text-graphite leading-relaxed">
                  {drawer.row.projectScope || '—'}
                </p>
                {drawer.row.message && (
                  <p className="text-xs text-soft-grey leading-relaxed">{drawer.row.message}</p>
                )}
              </section>

              {/* ── Referral Attribution ── */}
              {drawer.row.attributionStatus && drawer.row.attributionStatus !== 'not_attributed' && (
                <section className="space-y-3">
                  <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-soft-grey border-b border-border-neutral pb-1">
                    Referral Attribution
                  </h3>

                  <div className="bg-surface-warm rounded-lg border border-border-neutral p-4 space-y-3">
                    {/* Attribution row */}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="text-xs text-graphite">
                        <span className="text-soft-grey">Referred by </span>
                        <span className="font-mono font-bold">{drawer.row.refCode || '—'}</span>
                      </div>
                      {renderAttributionBadge(drawer.row)}
                    </div>

                    {/* Conversion status */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-soft-grey">Conversion:</span>
                      {drawer.row.conversionStatus === 'converted' ? (
                        <span className="px-2 py-0.5 rounded border text-[10px] font-mono bg-brand-blue/10 text-brand-blue border-brand-blue/20">
                          ✓ Converted
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded border text-[10px] font-mono bg-neutral-100 text-neutral-500 border-neutral-200">
                          Pending
                        </span>
                      )}
                    </div>

                    {/* Link to marketing partners */}
                    <a
                      href="/admin/marketing-partners"
                      className="text-[11px] text-brand-blue hover:underline flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                      View partner record
                    </a>

                    {/* Mark Converted button */}
                    {drawer.row.attributionStatus === 'attributed' &&
                     drawer.row.conversionStatus !== 'converted' && (
                      <>
                        {!convModal.open ? (
                          <button
                            type="button"
                            onClick={() => setConvModal(prev => ({ ...prev, open: true }))}
                            className="w-full py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold font-display uppercase tracking-wider hover:bg-emerald-800 cursor-pointer"
                          >
                            Mark as Converted
                          </button>
                        ) : (
                          /* Conversion sub-form */
                          <form onSubmit={handleConversionSubmit} className="space-y-3 pt-1">
                            {convModal.error && (
                              <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                                {convModal.error}
                              </div>
                            )}
                            <div>
                              <label className="block text-xs font-semibold text-graphite mb-1">
                                Contract Value (₹) — Optional
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="1000"
                                value={convModal.contractValueInr}
                                onChange={e => setConvModal(prev => ({ ...prev, contractValueInr: e.target.value }))}
                                placeholder="e.g. 2500000"
                                className="w-full p-2 text-xs font-mono border border-border-neutral rounded-lg bg-white focus:outline-none focus:border-brand-blue"
                              />
                              <p className="text-[10px] text-soft-grey mt-0.5">
                                Recorded for audit. Payout calculations remain disabled pending client approval.
                              </p>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-graphite mb-1">
                                Audit Notes
                              </label>
                              <textarea
                                rows="2"
                                value={convModal.notes}
                                onChange={e => setConvModal(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="e.g. Work order signed on site"
                                className="w-full p-2 text-xs border border-border-neutral rounded-lg bg-white focus:outline-none focus:border-brand-blue"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setConvModal(prev => ({ ...prev, open: false, error: '' }))}
                                className="flex-1 py-2 text-xs font-semibold text-soft-grey border border-border-neutral rounded-lg hover:text-graphite cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={convModal.loading}
                                className="flex-1 py-2 bg-emerald-700 text-white rounded-lg text-xs font-bold font-display uppercase tracking-wider hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                              >
                                {convModal.loading ? 'Recording…' : 'Confirm Conversion'}
                              </button>
                            </div>
                          </form>
                        )}
                      </>
                    )}
                  </div>
                </section>
              )}

              {/* ── Status Change ── */}
              <section className="space-y-2">
                <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-soft-grey border-b border-border-neutral pb-1">
                  Status
                </h3>
                <select
                  value={drawer.row.status}
                  onChange={e => updateStatus(drawer.row._id, e.target.value)}
                  className={`text-xs font-bold uppercase tracking-wider rounded px-3 py-2 outline-none border transition-colors cursor-pointer font-display ${STATUS_BADGE[drawer.row.status] || STATUS_BADGE['new']}`}
                >
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('-', ' ')}</option>
                  ))}
                </select>
              </section>

            </div>{/* /body */}
          </div>{/* /panel */}
        </>
      )}
    </div>
  );
};

export default AdminEnquiries;
