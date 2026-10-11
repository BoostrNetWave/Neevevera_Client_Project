import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const STATUSES = ['received', 'reviewed', 'shortlisted', 'rejected'];

const STATUS_BADGE = {
  'received':   'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  'reviewed':   'bg-amber-100 text-amber-800 border-amber-200',
  'shortlisted':'bg-brand-green/10 text-brand-green border-brand-green/20',
  'rejected':   'bg-red-50 text-red-600 border-red-200',
};

const AdminApplications = () => {
  const [jobs, setJobs]           = useState([]);   // list of career jobs
  const [selected, setSelected]   = useState(null); // { job, applications[] }
  const [loading, setLoading]     = useState(true);
  const [loadingApps, setLoadingApps] = useState(false);
  const [error, setError]         = useState('');
  const [filter, setFilter]       = useState('All');
  const [updating, setUpdating]   = useState(null); // appId being updated

  // ── Load all job listings ──────────────────────────────────
  const fetchJobs = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await adminApi.get('/careers/admin/list');
      setJobs(res.data?.items || res.data?.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  // ── Load applications for a specific job ──────────────────
  const loadApplications = async (job) => {
    setLoadingApps(true); setSelected({ job, applications: [] }); setFilter('All');
    try {
      const res = await adminApi.get(`/careers/${job.slug}/applications`);
      setSelected({ job, applications: res.data?.data || [] });
    } catch (err) {
      setSelected({ job, applications: [] });
    } finally {
      setLoadingApps(false);
    }
  };

  // ── Update application status ──────────────────────────────
  const updateStatus = async (appId, newStatus) => {
    if (!selected) return;
    setUpdating(appId);
    try {
      await adminApi.patch(`/careers/${selected.job.slug}/applications/${appId}`, { status: newStatus });
      setSelected(prev => ({
        ...prev,
        applications: prev.applications.map(a =>
          a._id === appId ? { ...a, status: newStatus } : a
        ),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  const visibleApps = selected
    ? (filter === 'All'
        ? selected.applications
        : selected.applications.filter(a => a.status === filter.toLowerCase()))
    : [];

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Job Applications
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Review candidates and manage hiring pipeline.
          </p>
        </div>
        {selected && (
          <button
            onClick={() => setSelected(null)}
            className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-4 py-2 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            All Jobs
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm">
          {error}
        </div>
      )}

      {/* ── Job List (no selection yet) ─────────────────────── */}
      {!selected && (
        <>
          {loading ? (
            <div className="flex items-center gap-2 text-soft-grey text-sm py-10 justify-center">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Loading jobs…
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-soft-grey text-sm">
              No job listings found. Create jobs first in the Careers section.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map(job => (
                <button
                  key={job._id}
                  onClick={() => loadApplications(job)}
                  className="bg-white border border-border-neutral rounded-sm p-5 text-left hover:border-brand-blue hover:shadow-sm transition-all group flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display font-bold text-sm text-graphite group-hover:text-brand-blue transition-colors leading-snug">
                        {job.title}
                      </h2>
                      <p className="text-xs text-soft-grey mt-0.5">{job.department || 'General'} · {job.location}</p>
                    </div>
                    <span className={`shrink-0 px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${job.isActive ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-surface-muted text-soft-grey border-border-neutral'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-soft-grey">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      View Applications
                    </span>
                    <span className="ml-auto text-brand-blue font-bold">
                      <span className="material-symbols-outlined text-[16px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Applications for selected job ───────────────────── */}
      {selected && (
        <>
          {/* Job info bar */}
          <div className="bg-white border border-border-neutral rounded-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="font-display font-bold text-sm text-graphite">{selected.job.title}</h2>
              <p className="text-xs text-soft-grey mt-0.5">{selected.job.department || 'General'} · {selected.job.location}</p>
            </div>
            <div className="text-xs font-bold text-soft-grey uppercase tracking-wider font-display">
              {selected.applications.length} Application{selected.applications.length !== 1 ? 's' : ''}
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {['All', 'Received', 'Reviewed', 'Shortlisted', 'Rejected'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors font-display ${
                  filter === tab
                    ? 'bg-brand-blue text-white'
                    : 'bg-white border border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
                }`}
              >
                {tab}
                {tab !== 'All' && (
                  <span className="ml-1.5 opacity-70">
                    ({selected.applications.filter(a => a.status === tab.toLowerCase()).length})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Applications table */}
          {loadingApps ? (
            <div className="flex items-center gap-2 text-soft-grey text-sm py-10 justify-center">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Loading applications…
            </div>
          ) : visibleApps.length === 0 ? (
            <div className="text-center py-16 text-soft-grey text-sm bg-white border border-border-neutral rounded-sm">
              No applications {filter !== 'All' ? `with status "${filter}"` : 'yet'}.
            </div>
          ) : (
            <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-border-neutral bg-surface-warm">
                  <tr>
                    {['Candidate', 'Contact', 'Applied', 'Status', 'Actions'].map(h => (
                      <th key={h} className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {visibleApps.map(app => (
                    <tr key={app._id} className="hover:bg-surface-warm transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-semibold text-graphite block">{app.name || '—'}</span>
                        {app.resumeUrl && (
                          <a
                            href={app.resumeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-brand-blue hover:underline flex items-center gap-1 mt-0.5"
                          >
                            <span className="material-symbols-outlined text-[13px]">description</span>
                            Resume
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-xs text-soft-grey">
                        <div>{app.email || '—'}</div>
                        <div>{app.phone || ''}</div>
                      </td>
                      <td className="py-3.5 px-5 text-xs text-soft-grey whitespace-nowrap">
                        {app.appliedAt
                          ? new Date(app.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${STATUS_BADGE[app.status] || 'bg-surface-muted text-soft-grey border-border-neutral'}`}>
                          {app.status || 'received'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <select
                          value={app.status || 'received'}
                          disabled={updating === app._id}
                          onChange={(e) => updateStatus(app._id, e.target.value)}
                          className="text-xs border border-border-neutral rounded-sm px-2 py-1.5 bg-white text-graphite outline-none focus:border-brand-blue cursor-pointer disabled:opacity-50"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        {updating === app._id && (
                          <span className="ml-2 text-soft-grey text-[10px]">Saving…</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Cover letters panel */}
          {visibleApps.some(a => a.coverLetter) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Cover Letters</h3>
              {visibleApps.filter(a => a.coverLetter).map(app => (
                <div key={app._id} className="bg-white border border-border-neutral rounded-sm p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-graphite">{app.name}</span>
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${STATUS_BADGE[app.status] || ''}`}>
                      {app.status}
                    </span>
                  </div>
                  <p className="text-xs text-soft-grey leading-relaxed whitespace-pre-wrap">{app.coverLetter}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminApplications;
