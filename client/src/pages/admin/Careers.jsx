import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';

const API = '';

const TYPES    = ['full-time', 'part-time', 'contract', 'freelance'];
const APP_STAT = ['received', 'reviewed', 'shortlisted', 'rejected'];

const toSlug = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const StringListEditor = ({ label, placeholder, items, onChange }) => {
  const add    = () => onChange([...items, '']);
  const update = (i, v) => { const n = [...items]; n[i] = v; onChange(n); };
  const remove = (i)    => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">{label}</label>
        <button type="button" onClick={add}
          className="text-[10px] font-bold uppercase tracking-wider text-brand-blue border border-brand-blue/30 px-2 py-1 rounded-sm hover:bg-brand-blue/5 transition-colors font-display flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">add</span> Add
        </button>
      </div>
      {items.length === 0 && <p className="text-xs text-soft-grey italic">None added yet.</p>}
      {items.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={val} onChange={e => update(i, e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors"
            placeholder={placeholder} />
          <button type="button" onClick={() => remove(i)} className="text-soft-grey hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
          </button>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CAREER EDITOR
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  title: '', slug: '', department: '', location: '', type: 'full-time',
  experience: '', description: '', responsibilities: [], requirements: [],
  isActive: true, closingDate: '',
};

const CareerEditor = ({ careerId, onBack, onSaved }) => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading,       setLoading]       = useState(!!careerId);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState('');
  const [conflict,      setConflict]      = useState(null);
  const [slugManual,    setSlugManual]    = useState(false);

  useEffect(() => {
    if (!careerId) return;
    (async () => {
      try {
        const res = await adminApi.get(`${API}/careers/admin/${careerId}`);
        const d = res.data.data;
        setForm({
          title: d.title || '', slug: d.slug || '', department: d.department || '',
          location: d.location || '', type: d.type || 'full-time', experience: d.experience || '',
          description: d.description || '', responsibilities: d.responsibilities || [], requirements: d.requirements || [],
          isActive: d.isActive ?? true, closingDate: d.closingDate ? d.closingDate.split('T')[0] : '',
        });
        setLastUpdatedAt(d.updatedAt);
        setSlugManual(true);
      } catch (err) {
        setApiError('Failed to load job. Please go back and try again.');
      } finally { setLoading(false); }
    })();
  }, [careerId]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const handleTitleChange = (val) => { set('title', val); if (!slugManual) set('slug', toSlug(val)); };

  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required.';
    if (!form.slug.trim())        e.slug        = 'Slug is required.';
    if (!form.location.trim())    e.location    = 'Location is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true); setApiError(''); setConflict(null);
    const payload = { ...form };
    if (!payload.closingDate) delete payload.closingDate;
    if (lastUpdatedAt) payload.lastKnownUpdatedAt = lastUpdatedAt;

    try {
      let res;
      if (careerId) {
        res = await adminApi.put(`${API}/careers/${careerId}`, payload);
      } else {
        res = await adminApi.post(`${API}/careers`, payload);
      }
      setLastUpdatedAt(res.data.data.updatedAt);
      onSaved(res.data.data, !careerId);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict({ message: err.response.data.error || 'Conflict', serverUpdatedAt: err.response.data.updatedAt });
      } else {
        setApiError(err.response?.data?.message || err.response?.data?.error || 'Save failed.');
      }
    } finally { setSaving(false); }
  };

  const handleReload = async () => {
    setConflict(null); setLoading(true);
    try {
      const res = await adminApi.get(`${API}/careers/admin/${careerId}`);
      const d = res.data.data;
      setForm({
        title: d.title || '', slug: d.slug || '', department: d.department || '',
        location: d.location || '', type: d.type || 'full-time', experience: d.experience || '',
        description: d.description || '', responsibilities: d.responsibilities || [], requirements: d.requirements || [],
        isActive: d.isActive ?? true, closingDate: d.closingDate ? d.closingDate.split('T')[0] : '',
      });
      setLastUpdatedAt(d.updatedAt);
    } catch { setApiError('Reload failed.'); }
    finally { setLoading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-soft-grey gap-2 text-sm">
      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
    </div>
  );

  return (
    <div className="space-y-6 w-full pb-24">
      <div className="flex items-center gap-4 border-b border-border-neutral pb-5">
        <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-sm border border-border-neutral text-soft-grey hover:border-graphite transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            {careerId ? 'Edit Job Opening' : 'Post Job Opening'}
          </h1>
          <p className="text-sm text-soft-grey mt-0.5">{careerId ? `Editing: ${form.slug}` : 'Create a new career listing.'}</p>
        </div>
      </div>

      {conflict && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-sm text-sm text-amber-800">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
          <div>
            <p className="font-semibold">{conflict.message}</p>
            <p className="text-xs mt-1">Last modified: {new Date(conflict.serverUpdatedAt).toLocaleString()}</p>
            <button onClick={handleReload} className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-300 px-3 py-1.5 rounded-sm hover:bg-amber-100 transition-colors font-display">Reload Latest Version</button>
          </div>
        </div>
      )}

      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="material-symbols-outlined text-[18px]">error</span>{apiError}
        </div>
      )}

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Job Details</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Job Title <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.title ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="e.g. Senior Civil Engineer" />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">URL Slug <span className="text-red-500">*</span></label>
                <input value={form.slug} onChange={e => { setSlugManual(true); set('slug', toSlug(e.target.value)); }}
                  className={`w-full px-3 py-2.5 text-sm font-mono bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.slug ? 'border-red-400' : 'border-border-neutral'}`} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Department</label>
                  <input value={form.department} onChange={e => set('department', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                    placeholder="e.g. Engineering" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Location <span className="text-red-500">*</span></label>
                  <input value={form.location} onChange={e => set('location', e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.location ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="e.g. Bhubaneswar" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue resize-y ${errors.description ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="Overview of the role..." />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Role specifics</h2>
            </div>
            <div className="p-5 space-y-6">
              <StringListEditor label="Responsibilities" placeholder="e.g. Oversee daily site operations" items={form.responsibilities} onChange={v => set('responsibilities', v)} />
              <div className="border-t border-border-neutral pt-6">
                <StringListEditor label="Requirements" placeholder="e.g. 5+ years experience in commercial builds" items={form.requirements} onChange={v => set('requirements', v)} />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Settings</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Employment Type</label>
                <select value={form.type} onChange={e => set('type', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue">
                  {TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ').toUpperCase()}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Experience Required</label>
                <input value={form.experience} onChange={e => set('experience', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                  placeholder="e.g. 3-5 Years" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Closing Date</label>
                <input type="date" value={form.closingDate} onChange={e => set('closingDate', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-neutral mt-2 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Active / Open</label>
                <button type="button" onClick={() => set('isActive', !form.isActive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-brand-green' : 'bg-border-neutral'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-border-neutral">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-soft-grey hover:text-graphite font-display">Cancel</button>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover disabled:opacity-60 font-display flex items-center gap-2">
            {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</> : careerId ? 'Save Changes' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// APPLICATIONS VIEW
// ═══════════════════════════════════════════════════════════════
const ApplicationsView = ({ job, onBack }) => {
  const [apps, setApps] = useState(job.applications || []);
  const [loading, setLoading] = useState(!job.applications || job.applications.length === 0);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.get(`/careers/${job.slug}/applications`)
      .then(res => {
        if (res.data?.data) setApps(res.data.data);
      })
      .catch(() => {
        if (!job.applications || job.applications.length === 0) {
          setError('Failed to load applications.');
        }
      })
      .finally(() => setLoading(false));
  }, [job.slug, job.applications]);

  const updateStatus = async (appId, newStatus) => {
    try {
      await adminApi.patch(`${API}/careers/${job.slug}/applications/${appId}`, { status: newStatus });
      setApps(prev => prev.map(a => a._id === appId ? { ...a, status: newStatus } : a));
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-center justify-between border-b border-border-neutral pb-5">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-sm border border-border-neutral text-soft-grey hover:border-graphite hover:bg-surface-warm transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          </button>
          <div>
            <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Applications</h1>
            <p className="text-sm text-soft-grey mt-0.5">Showing candidates for <strong>{job.title}</strong></p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Total Applicants</span>
          <p className="text-lg font-bold text-graphite font-display">{apps.length}</p>
        </div>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : apps.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">inbox</span>
            <p className="text-sm">No applications received yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Candidate</th>
                <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Applied On</th>
                <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Resume / Cover</th>
                <th className="py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {apps.map(app => (
                <tr key={app._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-graphite block">{app.name}</span>
                    <div className="text-xs text-soft-grey flex flex-col gap-0.5 mt-1">
                      <a href={`mailto:${app.email}`} className="hover:text-brand-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">mail</span>{app.email}</a>
                      {app.phone && <a href={`tel:${app.phone}`} className="hover:text-brand-blue flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">call</span>{app.phone}</a>}
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-soft-grey">{new Date(app.appliedAt).toLocaleDateString()}</td>
                  <td className="py-3.5 px-5">
                    <div className="flex flex-col gap-1.5">
                      {app.resumeUrl ? (
                        <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="text-brand-blue hover:underline text-xs font-bold font-display uppercase tracking-wider flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">description</span> View Resume
                        </a>
                      ) : <span className="text-xs text-soft-grey italic">No Resume</span>}
                      {app.coverLetter && (
                        <div className="relative group cursor-help text-xs text-soft-grey flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">notes</span> Cover Letter
                          <div className="absolute left-0 top-full mt-1 w-64 bg-graphite text-white p-3 rounded-sm text-xs invisible group-hover:visible shadow-lg z-10 break-words whitespace-pre-wrap">
                            {app.coverLetter}
                          </div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <select value={app.status} onChange={e => updateStatus(app._id, e.target.value)}
                      className={`text-xs font-bold uppercase tracking-wider rounded-sm px-2 py-1 outline-none border transition-colors cursor-pointer font-display ${
                        app.status === 'received' ? 'bg-surface-muted text-soft-grey border-border-neutral' :
                        app.status === 'reviewed' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                        app.status === 'shortlisted' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                        'bg-red-50 text-red-600 border-red-200'
                      }`}>
                      {APP_STAT.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// CAREERS LIST
// ═══════════════════════════════════════════════════════════════
const CareersList = ({ onCreate, onEdit, onViewApps }) => {
  const [jobs, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);

  const fetchItems = useCallback(async (q = search) => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (q.trim()) params.search = q.trim();
      const res = await adminApi.get(`${API}/careers/admin/list`, { params });
      setItems(res.data.items);
    } catch (err) {
      setError('Failed to load careers.');
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleSearchChange = (val) => {
    setSearch(val); clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchItems(val), 350);
  };

  const handleToggleActive = async (job) => {
    try {
      if (job.isActive) await adminApi.delete(`${API}/careers/${job._id}`);
      else await adminApi.patch(`${API}/careers/${job._id}/activate`, {});
      fetchItems();
    } catch { setError('Action failed.'); }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Careers</h1>
          <p className="text-sm text-soft-grey mt-1">{jobs.length} job opening{jobs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onCreate} className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add</span> Post Job
        </button>
      </div>

      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
        <input value={search} onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue"
          placeholder="Search roles..." />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">work</span>
            <p className="text-sm">No job openings found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Role', 'Location / Type', 'Status', 'Applicants', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {jobs.map(job => (
                <tr key={job._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-graphite block">{job.title}</span>
                    <span className="text-xs text-soft-grey font-mono">{job.slug}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="block text-graphite">{job.location}</span>
                    <span className="text-xs text-soft-grey uppercase">{job.type.replace('-', ' ')}</span>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${job.isActive ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-surface-muted text-soft-grey border-border-neutral'}`}>
                      {job.isActive ? 'Active' : 'Closed'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5">
                    <button onClick={() => onViewApps(job)} className="flex items-center gap-2 group">
                      <span className="bg-brand-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-sm group-hover:bg-brand-blue-hover transition-colors">
                        {job.applications ? job.applications.length : 0}
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-blue group-hover:underline font-display">View</span>
                    </button>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEdit(job._id)} className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleToggleActive(job)} className="text-soft-grey hover:text-graphite font-display text-xs font-bold uppercase tracking-wider">
                        {job.isActive ? 'Close' : 'Reopen'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const AdminCareers = () => {
  const [view,      setView]      = useState('list'); // list | editor | apps
  const [editingId, setEditingId] = useState(null);
  const [viewJob,   setViewJob]   = useState(null);
  const [flashMsg,  setFlashMsg]  = useState('');

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };
  
  const handleCreate = () => { setEditingId(null); setView('editor'); };
  const handleEdit   = (id) => { setEditingId(id);   setView('editor'); };
  const handleViewApps = (job) => { setViewJob(job); setView('apps'); };
  const handleBack   = () => { setEditingId(null); setViewJob(null); setView('list'); };
  
  const handleSaved  = (data, isNew) => {
    showFlash(isNew ? `Job "${data.title}" posted.` : `Job "${data.title}" saved.`);
    setView('list'); setEditingId(null);
  };

  return (
    <div className="w-full">
      {flashMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-brand-green/10 border border-brand-green/20 rounded-sm text-sm text-brand-green font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>{flashMsg}
        </div>
      )}
      {view === 'list'   && <CareersList onCreate={handleCreate} onEdit={handleEdit} onViewApps={handleViewApps} />}
      {view === 'editor' && <CareerEditor careerId={editingId} onBack={handleBack} onSaved={handleSaved} />}
      {view === 'apps'   && <ApplicationsView job={viewJob} onBack={handleBack} />}
    </div>
  );
};

export default AdminCareers;
