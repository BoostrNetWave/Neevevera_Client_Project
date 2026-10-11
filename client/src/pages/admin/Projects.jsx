import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = 'http://localhost:5000/api';

const CATEGORIES = ['residential', 'commercial', 'industrial', 'infrastructure', 'government'];
const REGIONS    = ['odisha', 'andaman', 'bengal', 'corridor', 'other'];
const STATUSES   = ['ongoing', 'commissioned', 'planning'];

// ── Slug generator ─────────────────────────────────────────────
const toSlug = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Inline MediaPicker modal ───────────────────────────────────
const MediaPicker = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 bg-graphite/60 flex items-center justify-center p-6">
    <div className="bg-white rounded-sm w-full max-w-5xl h-[75vh] flex flex-col overflow-hidden border border-border-neutral shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral bg-surface-warm shrink-0">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">Select Image</h3>
        <button type="button" onClick={onClose} className="text-soft-grey hover:text-graphite transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <MediaLibrary mode="select" onSelect={onSelect} imageContext="projectImage" />
      </div>
    </div>
  </div>
);

// ── KeyValueListEditor — repeatable specs ──────────────────────
const KeyValueListEditor = ({ label, items, onChange }) => {
  const add    = () => onChange([...items, { label: '', value: '' }]);
  const update = (i, field, v) => { const n = [...items]; n[i] = { ...n[i], [field]: v }; onChange(n); };
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
      {items.length === 0 && <p className="text-xs text-soft-grey italic">No specs added.</p>}
      {items.map((spec, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={spec.label} onChange={e => update(i, 'label', e.target.value)}
            className="w-1/3 px-3 py-2 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
            placeholder="Label (e.g. Area)" />
          <input value={spec.value} onChange={e => update(i, 'value', e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
            placeholder="Value (e.g. 50,000 sq ft)" />
          <button type="button" onClick={() => remove(i)} className="text-soft-grey hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
          </button>
        </div>
      ))}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROJECT EDITOR
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  name: '', slug: '', category: 'residential',
  location: '', region: 'odisha', clientName: '',
  description: '', shortDescription: '',
  completionDate: '', status: 'ongoing',
  coverImage: '', gallery: [], specs: [],
  isActive: true, isFeatured: false,
};

const ProjectEditor = ({ projectId, onBack, onSaved }) => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading,       setLoading]       = useState(!!projectId);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState('');
  const [conflict,      setConflict]      = useState(null);
  const [pickerTarget,  setPickerTarget]  = useState(null);
  const [slugManual,    setSlugManual]    = useState(false);

  // Load existing project
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const res = await adminApi.get(`${API}/projects/admin/${projectId}`);
        const d = res.data.data;
        setForm({
          name: d.name || '', slug: d.slug || '', category: d.category || 'residential',
          location: d.location || '', region: d.region || 'odisha', clientName: d.clientName || '',
          description: d.description || '', shortDescription: d.shortDescription || '',
          completionDate: d.completionDate ? d.completionDate.split('T')[0] : '', status: d.status || 'ongoing',
          coverImage: d.coverImage || '', gallery: d.gallery || [], specs: d.specs || [],
          isActive: d.isActive ?? true, isFeatured: d.isFeatured ?? false,
        });
        setLastUpdatedAt(d.updatedAt);
        setSlugManual(true);
      } catch (err) {
        setApiError('Failed to load project. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const handleNameChange = (val) => {
    set('name', val);
    if (!slugManual) set('slug', toSlug(val));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Name is required.';
    if (!form.slug.trim())        e.slug        = 'Slug is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.location.trim())    e.location    = 'Location is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    setConflict(null);

    const payload = { ...form };
    if (!payload.completionDate) delete payload.completionDate;
    if (lastUpdatedAt) payload.lastKnownUpdatedAt = lastUpdatedAt;

    try {
      let res;
      if (projectId) {
        res = await adminApi.put(`${API}/projects/${projectId}`, payload);
      } else {
        res = await adminApi.post(`${API}/projects`, payload);
      }
      setLastUpdatedAt(res.data.data.updatedAt);
      onSaved(res.data.data, !projectId);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict({
          message: err.response.data.error || 'This record was modified by another user.',
          serverUpdatedAt: err.response.data.updatedAt,
        });
      } else {
        setApiError(err.response?.data?.message || err.response?.data?.error || 'Save failed. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReloadAfterConflict = async () => {
    setConflict(null);
    setLoading(true);
    try {
      const res = await adminApi.get(`${API}/projects/admin/${projectId}`);
      const d = res.data.data;
      setForm({
        name: d.name || '', slug: d.slug || '', category: d.category || 'residential',
        location: d.location || '', region: d.region || 'odisha', clientName: d.clientName || '',
        description: d.description || '', shortDescription: d.shortDescription || '',
        completionDate: d.completionDate ? d.completionDate.split('T')[0] : '', status: d.status || 'ongoing',
        coverImage: d.coverImage || '', gallery: d.gallery || [], specs: d.specs || [],
        isActive: d.isActive ?? true, isFeatured: d.isFeatured ?? false,
      });
      setLastUpdatedAt(d.updatedAt);
    } catch { setApiError('Reload failed.'); }
    finally  { setLoading(false); }
  };

  const handleMediaSelect = (asset) => {
    if (pickerTarget === 'cover') set('coverImage', asset.url);
    else if (pickerTarget === 'gallery') set('gallery', [...(form.gallery || []), asset.url]);
    setPickerTarget(null);
  };

  const removeGalleryImage = (idx) => set('gallery', form.gallery.filter((_, i) => i !== idx));

  if (loading) return (
    <div className="flex items-center justify-center h-48 text-soft-grey gap-2 text-sm">
      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
    </div>
  );

  return (
    <div className="space-y-6 w-full pb-24">
      <div className="flex items-center gap-4 border-b border-border-neutral pb-5">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-sm border border-border-neutral text-soft-grey hover:border-graphite hover:text-graphite transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            {projectId ? 'Edit Project' : 'Create Project'}
          </h1>
          <p className="text-sm text-soft-grey mt-0.5">
            {projectId ? `Editing slug: ${form.slug}` : 'Add a new project to the portfolio.'}
          </p>
        </div>
      </div>

      {conflict && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-sm text-sm text-amber-800">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
          <div>
            <p className="font-semibold">{conflict.message}</p>
            <p className="text-xs mt-1">Last modified: {new Date(conflict.serverUpdatedAt).toLocaleString()}</p>
            <button onClick={handleReloadAfterConflict} className="mt-2 text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-300 px-3 py-1.5 rounded-sm hover:bg-amber-100 transition-colors font-display">
              Reload Latest Version
            </button>
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Basic Information</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Name <span className="text-red-500">*</span></label>
                <input value={form.name} onChange={e => handleNameChange(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors ${errors.name ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="e.g. Kalinga Stadium Expansion" />
                {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">URL Slug <span className="text-red-500">*</span></label>
                <input value={form.slug} onChange={e => { setSlugManual(true); set('slug', toSlug(e.target.value)); }}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite font-mono outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors ${errors.slug ? 'border-red-400' : 'border-border-neutral'}`} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Location <span className="text-red-500">*</span></label>
                  <input value={form.location} onChange={e => set('location', e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.location ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="e.g. Bhubaneswar" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Client Name</label>
                  <input value={form.clientName} onChange={e => set('clientName', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                    placeholder="e.g. Govt of Odisha" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Short Description</label>
                <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Full Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue resize-y ${errors.description ? 'border-red-400' : 'border-border-neutral'}`} />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Specifications</h2>
            </div>
            <div className="p-5">
              <KeyValueListEditor label="Project Specs" items={form.specs} onChange={v => set('specs', v)} />
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
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Category</label>
                <select value={form.category} onChange={e => set('category', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Region</label>
                <select value={form.region} onChange={e => set('region', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue">
                  {REGIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Status</label>
                <select value={form.status} onChange={e => set('status', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue">
                  {STATUSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Completion Date</label>
                <input type="date" value={form.completionDate} onChange={e => set('completionDate', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-neutral mt-2 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Is Featured</label>
                <button type="button" onClick={() => set('isFeatured', !form.isFeatured)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isFeatured ? 'bg-brand-gold' : 'bg-border-neutral'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Cover Image</h2>
            </div>
            <div className="p-5">
              {form.coverImage ? (
                <div className="space-y-2">
                  <img src={form.coverImage} alt="Cover" className="w-full aspect-video object-cover rounded-sm border border-border-neutral" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPickerTarget('cover')} className="text-xs font-bold text-brand-blue font-display hover:underline">Change</button>
                    <button type="button" onClick={() => set('coverImage', '')} className="text-xs font-bold text-soft-grey font-display hover:text-red-500">Remove</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setPickerTarget('cover')}
                  className="w-full aspect-video border-2 border-dashed border-border-neutral rounded-sm flex flex-col items-center justify-center gap-1 hover:border-brand-blue transition-colors group">
                  <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue text-[28px]">add_photo_alternate</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-soft-grey group-hover:text-brand-blue">Select Cover</span>
                </button>
              )}
            </div>
          </section>
          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Gallery</h2>
              <button type="button" onClick={() => setPickerTarget('gallery')}
                className="text-[10px] font-bold uppercase tracking-wider text-brand-blue border border-brand-blue/30 px-2 py-1 rounded-sm hover:bg-brand-blue/5 transition-colors font-display flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">add</span> Add
              </button>
            </div>
            <div className="p-4">
              {(form.gallery || []).length === 0 ? (
                <p className="text-xs text-soft-grey italic text-center py-4">No gallery images added.</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {form.gallery.map((url, i) => (
                    <div key={i} className="relative aspect-square group">
                      <img src={url} alt="" className="w-full h-full object-cover rounded-sm border border-border-neutral" />
                      <button type="button" onClick={() => removeGalleryImage(i)}
                        className="absolute top-1 right-1 bg-graphite/80 text-white rounded-sm p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="material-symbols-outlined text-[14px]">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-border-neutral">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-soft-grey hover:text-graphite transition-colors font-display">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors disabled:opacity-60 font-display flex items-center gap-2">
            {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</> : projectId ? 'Save Changes' : 'Create Project'}
          </button>
        </div>
      </form>

      {pickerTarget && <MediaPicker onSelect={handleMediaSelect} onClose={() => setPickerTarget(null)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROJECTS LIST
// ═══════════════════════════════════════════════════════════════
const ProjectsList = ({ onCreate, onEdit }) => {
  const [projects, setProjects] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState('');
  const [category, setCategory] = useState('');
  const searchTimer = useRef(null);

  const fetchProjects = useCallback(async (pageNum = 1, q = search, cat = category) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (q.trim()) params.search = q.trim();
      if (cat) params.category = cat;
      const res = await adminApi.get(`${API}/projects`, { params });
      setProjects(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [search, category]);

  useEffect(() => { fetchProjects(1); }, [category]); // run on category change

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchProjects(1, val, category), 350);
  };

  const handleCategoryChange = (e) => {
    setCategory(e.target.value);
  };

  const handleDelete = async (proj) => {
    if (!window.confirm(`Delete project "${proj.name}"? This will soft-delete the record.`)) return;
    try {
      await adminApi.delete(`${API}/projects/${proj._id}`);
      fetchProjects(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Projects</h1>
          <p className="text-sm text-soft-grey mt-1">{total} project{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={onCreate}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add</span> New Project
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-xs flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
          <input value={search} onChange={e => handleSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue"
            placeholder="Search projects..." />
        </div>
        <select value={category} onChange={handleCategoryChange}
          className="px-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue w-48">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">domain</span>
            <p className="text-sm">No projects found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Project Name', 'Category', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {projects.map(proj => (
                <tr key={proj._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-graphite">{proj.name}</span>
                      {proj.isFeatured && <span className="material-symbols-outlined text-[14px] text-brand-gold" title="Featured">star</span>}
                    </div>
                    <span className="text-xs text-soft-grey font-mono">{proj.slug}</span>
                  </td>
                  <td className="py-3.5 px-5 text-soft-grey capitalize">{proj.category}</td>
                  <td className="py-3.5 px-5 text-soft-grey">{proj.location}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${
                      proj.status === 'ongoing' ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/20' :
                      proj.status === 'commissioned' ? 'bg-brand-green/10 text-brand-green border-brand-green/20' :
                      'bg-surface-muted text-soft-grey border-border-neutral'
                    }`}>
                      {proj.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEdit(proj._id)}
                        className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleDelete(proj)}
                        className="text-red-500 hover:text-red-600 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">delete</span> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-soft-grey">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchProjects(page - 1)} disabled={page <= 1 || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Prev</button>
            <button onClick={() => fetchProjects(page + 1)} disabled={page >= pages || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════
const AdminProjects = () => {
  const [view,      setView]      = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [flashMsg,  setFlashMsg]  = useState('');

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };
  const handleCreate = () => { setEditingId(null); setView('editor'); };
  const handleEdit   = (id) => { setEditingId(id);   setView('editor'); };
  const handleBack   = () => { setEditingId(null);  setView('list'); };
  const handleSaved  = (data, isNew) => {
    showFlash(isNew ? `Project "${data.name}" created.` : `Project "${data.name}" saved.`);
    setView('list');
    setEditingId(null);
  };

  return (
    <div className="w-full">
      {flashMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-brand-green/10 border border-brand-green/20 rounded-sm text-sm text-brand-green font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>{flashMsg}
        </div>
      )}
      {view === 'list' && <ProjectsList onCreate={handleCreate} onEdit={handleEdit} />}
      {view === 'editor' && <ProjectEditor projectId={editingId} onBack={handleBack} onSaved={handleSaved} />}
    </div>
  );
};

export default AdminProjects;
