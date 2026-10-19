import React, { useState, useEffect, useCallback, useMemo } from 'react';
import adminApi from '../../utils/adminApi';

const STATUSES = ['received', 'reviewed', 'shortlisted', 'rejected'];

const STATUS_BADGE = {
  'received':    'bg-brand-blue/10 text-brand-blue border-brand-blue/20',
  'reviewed':    'bg-amber-100 text-amber-800 border-amber-200',
  'shortlisted': 'bg-brand-green/10 text-brand-green border-brand-green/20',
  'rejected':    'bg-red-50 text-red-600 border-red-200',
};

const AdminApplications = () => {
  const [jobs, setJobs]                   = useState([]);
  const [allApplications, setAllApplications] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');
  const [viewMode, setViewMode]           = useState('all'); // 'all' | 'jobs'
  const [selectedJob, setSelectedJob]     = useState(null); // specific job if drilling down
  const [statusFilter, setStatusFilter]   = useState('All');
  const [searchQuery, setSearchQuery]     = useState('');
  const [updatingId, setUpdatingId]       = useState(null);
  const [expandedNotesId, setExpandedNotesId] = useState(null);

  // ── Fetch Jobs and All Applications ──────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch both endpoints
      const [jobsRes, appsRes] = await Promise.allSettled([
        adminApi.get('/careers/admin/list'),
        adminApi.get('/careers/applications/all'),
      ]);

      let loadedJobs = [];
      if (jobsRes.status === 'fulfilled') {
        loadedJobs = jobsRes.value.data?.items || jobsRes.value.data?.data || [];
        setJobs(loadedJobs);
      }

      let loadedApps = [];
      if (appsRes.status === 'fulfilled' && appsRes.value.data?.data) {
        loadedApps = appsRes.value.data.data;
      } else if (loadedJobs.length > 0) {
        // Fallback: extract applications embedded in job listings
        for (const job of loadedJobs) {
          if (Array.isArray(job.applications)) {
            for (const app of job.applications) {
              loadedApps.push({
                ...app,
                jobId: job._id,
                jobTitle: job.title,
                jobSlug: job.slug,
                jobDepartment: job.department,
                jobLocation: job.location,
              });
            }
          }
        }
      }

      setAllApplications(loadedApps);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load applications. Check server connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Update Application Status ────────────────────────────────
  const handleStatusChange = async (appId, newStatus, jobSlug) => {
    setUpdatingId(appId);
    try {
      const url = jobSlug
        ? `/careers/${jobSlug}/applications/${appId}`
        : `/careers/applications/${appId}`;
      await adminApi.patch(url, { status: newStatus });

      setAllApplications(prev =>
        prev.map(app => (app._id === appId ? { ...app, status: newStatus } : app))
      );

      // Also update job list state if embedded
      setJobs(prevJobs =>
        prevJobs.map(job => {
          if (!job.applications) return job;
          return {
            ...job,
            applications: job.applications.map(a =>
              a._id === appId ? { ...a, status: newStatus } : a
            ),
          };
        })
      );
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update application status.');
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Computed Stats ──────────────────────────────────────────
  const stats = useMemo(() => {
    const total = allApplications.length;
    const received = allApplications.filter(a => (a.status || 'received') === 'received').length;
    const reviewed = allApplications.filter(a => a.status === 'reviewed').length;
    const shortlisted = allApplications.filter(a => a.status === 'shortlisted').length;
    const rejected = allApplications.filter(a => a.status === 'rejected').length;
    return { total, received, reviewed, shortlisted, rejected };
  }, [allApplications]);

  // ── Filtered Applications ───────────────────────────────────
  const filteredApplications = useMemo(() => {
    return allApplications.filter(app => {
      // Job selection filter
      if (selectedJob && app.jobSlug !== selectedJob.slug && app.jobId !== selectedJob._id) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'All' && (app.status || 'received').toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = app.name?.toLowerCase().includes(q);
        const emailMatch = app.email?.toLowerCase().includes(q);
        const jobMatch = app.jobTitle?.toLowerCase().includes(q);
        const phoneMatch = app.phone?.toLowerCase().includes(q);
        if (!nameMatch && !emailMatch && !jobMatch && !phoneMatch) return false;
      }
      return true;
    });
  }, [allApplications, selectedJob, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 w-full">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-border-neutral pb-5 gap-4">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Job Applications
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Review candidate profiles, track submissions, and manage hiring pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedJob && (
            <button
              onClick={() => { setSelectedJob(null); setViewMode('jobs'); }}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-2 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              All Jobs
            </button>
          )}

          <button
            onClick={fetchData}
            title="Refresh application data"
            className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-2 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      {/* ── Error Banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
            <span>{error}</span>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-bold uppercase tracking-wider underline hover:no-underline text-red-800"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Summary Metrics Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white border border-border-neutral p-4 rounded-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-soft-grey font-display block">Total Applications</span>
          <span className="text-2xl font-black text-graphite font-display mt-1 block">{stats.total}</span>
        </div>
        <div className="bg-white border border-border-neutral p-4 rounded-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-blue font-display block">New / Received</span>
          <span className="text-2xl font-black text-brand-blue font-display mt-1 block">{stats.received}</span>
        </div>
        <div className="bg-white border border-border-neutral p-4 rounded-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 font-display block">Reviewed</span>
          <span className="text-2xl font-black text-amber-700 font-display mt-1 block">{stats.reviewed}</span>
        </div>
        <div className="bg-white border border-border-neutral p-4 rounded-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green font-display block">Shortlisted</span>
          <span className="text-2xl font-black text-brand-green font-display mt-1 block">{stats.shortlisted}</span>
        </div>
        <div className="bg-white border border-border-neutral p-4 rounded-sm col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 font-display block">Rejected</span>
          <span className="text-2xl font-black text-red-600 font-display mt-1 block">{stats.rejected}</span>
        </div>
      </div>

      {/* ── View Mode Switcher (All Applications vs By Job) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-neutral pb-3">
        <div className="flex items-center gap-1 bg-surface-warm p-1 rounded-sm border border-border-neutral">
          <button
            onClick={() => { setViewMode('all'); setSelectedJob(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors font-display flex items-center gap-1.5 ${
              viewMode === 'all' && !selectedJob
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-soft-grey hover:text-graphite'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">list_alt</span>
            All Candidates ({allApplications.length})
          </button>
          <button
            onClick={() => { setViewMode('jobs'); setSelectedJob(null); }}
            className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors font-display flex items-center gap-1.5 ${
              viewMode === 'jobs' || selectedJob
                ? 'bg-brand-blue text-white shadow-xs'
                : 'text-soft-grey hover:text-graphite'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">work</span>
            By Job Posting ({jobs.length})
          </button>
        </div>

        {/* Selected job breadcrumb */}
        {selectedJob && (
          <div className="text-xs text-graphite flex items-center gap-2 bg-brand-blue/5 border border-brand-blue/20 px-3 py-1.5 rounded-sm">
            <span className="font-bold text-brand-blue font-display">Filtering by:</span>
            <span className="font-semibold">{selectedJob.title}</span>
            <button
              onClick={() => setSelectedJob(null)}
              className="text-soft-grey hover:text-red-500 ml-1"
              title="Clear job filter"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Job Cards View (when viewMode === 'jobs' and no specific job selected) ── */}
      {viewMode === 'jobs' && !selectedJob && (
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">
            Select a job to view its applicants
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-soft-grey text-sm py-12 justify-center bg-white border border-border-neutral rounded-sm">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Loading job postings…
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-16 text-soft-grey text-sm bg-white border border-border-neutral rounded-sm">
              No job postings created yet. Create a job in Careers first.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map(job => {
                const count = Array.isArray(job.applications) ? job.applications.length : 0;
                return (
                  <button
                    key={job._id}
                    onClick={() => { setSelectedJob(job); setViewMode('all'); }}
                    className="bg-white border border-border-neutral rounded-sm p-5 text-left hover:border-brand-blue hover:shadow-sm transition-all group flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${
                          job.isActive ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-surface-muted text-soft-grey border-border-neutral'
                        }`}>
                          {job.isActive ? 'Active' : 'Closed'}
                        </span>
                        <span className="text-[11px] font-mono text-soft-grey">
                          {job.department || 'General'}
                        </span>
                      </div>
                      <h3 className="font-display font-bold text-sm text-graphite group-hover:text-brand-blue transition-colors leading-snug mt-2">
                        {job.title}
                      </h3>
                      <p className="text-xs text-soft-grey mt-0.5">{job.location} · {job.type || 'full-time'}</p>
                    </div>

                    <div className="pt-3 border-t border-border-neutral flex items-center justify-between">
                      <span className={`text-xs font-bold font-display px-2.5 py-1 rounded-sm border ${
                        count > 0
                          ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20'
                          : 'bg-surface-warm text-soft-grey border-border-neutral'
                      }`}>
                        {count} {count === 1 ? 'Application' : 'Applications'}
                      </span>
                      <span className="text-xs font-bold text-brand-blue font-display flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        View List
                        <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Applications Table & Filters (when viewMode === 'all' or selectedJob) ── */}
      {(viewMode === 'all' || selectedJob) && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white border border-border-neutral p-4 rounded-sm">
            {/* Status tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
              {['All', 'Received', 'Reviewed', 'Shortlisted', 'Rejected'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-sm text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors font-display ${
                    statusFilter === tab
                      ? 'bg-brand-blue text-white'
                      : 'bg-surface-warm border border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative min-w-[260px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-soft-grey text-[16px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search candidate, job, phone…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-soft-grey hover:text-graphite"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex items-center gap-2 text-soft-grey text-sm py-16 justify-center bg-white border border-border-neutral rounded-sm">
              <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
              Loading candidate applications…
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-16 text-soft-grey text-sm bg-white border border-border-neutral rounded-sm">
              <span className="material-symbols-outlined text-soft-grey text-3xl mb-2 block">person_search</span>
              No applications match your current filters.
              {statusFilter !== 'All' && (
                <button
                  onClick={() => setStatusFilter('All')}
                  className="block mx-auto mt-2 text-xs font-bold uppercase tracking-wider text-brand-blue underline"
                >
                  Clear Status Filter
                </button>
              )}
            </div>
          ) : (
            <div className="bg-white border border-border-neutral rounded-sm overflow-x-auto shadow-2xs">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-border-neutral bg-surface-warm">
                  <tr>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Candidate</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Role Applied For</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Contact</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Applied Date</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Status</th>
                    <th className="py-3 px-4 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-neutral">
                  {filteredApplications.map(app => {
                    const isExpanded = expandedNotesId === app._id;
                    const isUpdating = updatingId === app._id;

                    return (
                      <React.Fragment key={app._id}>
                        <tr className="hover:bg-surface-warm/50 transition-colors">
                          {/* Candidate info */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-bold text-graphite block text-sm">{app.name || 'Anonymous Applicant'}</span>
                            <div className="flex items-center gap-2 mt-1">
                              {app.resumeUrl ? (
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-blue hover:underline bg-brand-blue/5 border border-brand-blue/20 px-2 py-0.5 rounded-xs"
                                >
                                  <span className="material-symbols-outlined text-[13px]">description</span>
                                  Resume
                                </a>
                              ) : (
                                <span className="text-[10px] text-soft-grey italic">No resume</span>
                              )}

                              {app.coverLetter && (
                                <button
                                  type="button"
                                  onClick={() => setExpandedNotesId(isExpanded ? null : app._id)}
                                  className="text-[11px] text-soft-grey hover:text-brand-blue flex items-center gap-0.5 underline font-medium"
                                >
                                  {isExpanded ? 'Hide Notes' : 'View Notes'}
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Role Applied For */}
                          <td className="py-3.5 px-4 align-top">
                            <span className="font-semibold text-graphite text-xs block">{app.jobTitle || 'General Opening'}</span>
                            {app.jobDepartment && (
                              <span className="text-[10px] text-soft-grey uppercase tracking-wider font-mono">
                                {app.jobDepartment}
                              </span>
                            )}
                          </td>

                          {/* Contact Details */}
                          <td className="py-3.5 px-4 align-top text-xs text-soft-grey font-mono">
                            <div className="text-graphite">{app.email || '—'}</div>
                            <div className="mt-0.5">{app.phone || '—'}</div>
                          </td>

                          {/* Applied Date */}
                          <td className="py-3.5 px-4 align-top text-xs text-soft-grey whitespace-nowrap">
                            {app.appliedAt
                              ? new Date(app.appliedAt).toLocaleDateString('en-IN', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })
                              : '—'}
                          </td>

                          {/* Status Badge */}
                          <td className="py-3.5 px-4 align-top">
                            <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border inline-block ${
                              STATUS_BADGE[app.status] || STATUS_BADGE.received
                            }`}>
                              {app.status || 'received'}
                            </span>
                          </td>

                          {/* Status Action Dropdown */}
                          <td className="py-3.5 px-4 align-top">
                            <div className="flex items-center gap-2">
                              <select
                                value={app.status || 'received'}
                                disabled={isUpdating}
                                onChange={e => handleStatusChange(app._id, e.target.value, app.jobSlug)}
                                className="text-xs border border-border-neutral rounded-sm px-2 py-1 bg-white text-graphite outline-none focus:border-brand-blue cursor-pointer disabled:opacity-50"
                              >
                                {STATUSES.map(s => (
                                  <option key={s} value={s}>
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                  </option>
                                ))}
                              </select>
                              {isUpdating && (
                                <span className="material-symbols-outlined animate-spin text-[14px] text-brand-blue">
                                  progress_activity
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Cover Letter / Notes Row */}
                        {isExpanded && app.coverLetter && (
                          <tr className="bg-surface-warm/70">
                            <td colSpan={6} className="px-4 py-3 border-t border-border-neutral/60">
                              <div className="text-xs">
                                <span className="font-bold text-graphite uppercase tracking-wider block mb-1 font-display">
                                  Cover Letter / Application Notes:
                                </span>
                                <p className="text-soft-grey whitespace-pre-wrap leading-relaxed font-sans bg-white p-3 rounded-xs border border-border-neutral">
                                  {app.coverLetter}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminApplications;
