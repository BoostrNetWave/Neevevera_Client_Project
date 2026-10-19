import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

// ── Inline MediaPicker modal ───────────────────────────────────
const MediaPicker = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 bg-graphite/60 flex items-center justify-center p-6">
    <div className="bg-white rounded-sm w-full max-w-5xl h-[75vh] flex flex-col overflow-hidden border border-border-neutral shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral bg-surface-warm shrink-0">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">Select Photo</h3>
        <button type="button" onClick={onClose} className="text-soft-grey hover:text-graphite transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <MediaLibrary mode="select" onSelect={onSelect} imageContext="testimonialPhoto" />
      </div>
    </div>
  </div>
);

// ═══════════════════════════════════════════════════════════════
// TESTIMONIAL EDITOR
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  clientName: '', clientDesignation: '', clientOrganization: '',
  review: '', rating: 5, photo: '', projectRef: '',
  isApproved: false, isFeatured: false,
};

const TestimonialEditor = ({ testimonialId, onBack, onSaved }) => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [projects,      setProjects]      = useState([]);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading,       setLoading]       = useState(!!testimonialId);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState('');
  const [conflict,      setConflict]      = useState(null);
  const [pickerOpen,    setPickerOpen]    = useState(false);

  // Fetch projects for dropdown
  useEffect(() => {
    adminApi.get(`${API}/projects?limit=100`)
      .then(res => setProjects(res.data.items || []))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!testimonialId) return;
    (async () => {
      try {
        const res = await adminApi.get(`${API}/testimonials/admin/${testimonialId}`);
        const d = res.data.data;
        setForm({
          clientName: d.clientName || '',
          clientDesignation: d.clientDesignation || '',
          clientOrganization: d.clientOrganization || '',
          review: d.review || '',
          rating: d.rating || 5,
          photo: d.photo || '',
          projectRef: d.projectRef || '',
          isApproved: d.isApproved ?? false,
          isFeatured: d.isFeatured ?? false,
        });
        setLastUpdatedAt(d.updatedAt);
      } catch (err) {
        setApiError('Failed to load testimonial. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [testimonialId]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.clientName.trim()) e.clientName = 'Client name is required.';
    if (!form.review.trim())     e.review     = 'Review content is required.';
    if (form.rating < 1 || form.rating > 5) e.rating = 'Rating must be between 1 and 5.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    setConflict(null);

    const payload = { ...form, rating: Number(form.rating) || 5 };
    if (!payload.projectRef) delete payload.projectRef;
    if (lastUpdatedAt) payload.lastKnownUpdatedAt = lastUpdatedAt;

    try {
      let res;
      if (testimonialId) {
        res = await adminApi.put(`${API}/testimonials/${testimonialId}`, payload);
      } else {
        res = await adminApi.post(`${API}/testimonials`, payload);
      }
      setLastUpdatedAt(res.data.data.updatedAt);
      onSaved(res.data.data, !testimonialId);
    } catch (err) {
      if (err.response?.status === 409) {
        setConflict({
          message: err.response.data.error || 'This record was modified by another user.',
          serverUpdatedAt: err.response.data.updatedAt,
        });
      } else {
        setApiError(err.response?.data?.message || err.response?.data?.error || 'Save failed.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReloadAfterConflict = async () => {
    setConflict(null);
    setLoading(true);
    try {
      const res = await adminApi.get(`${API}/testimonials/admin/${testimonialId}`);
      const d = res.data.data;
      setForm({
        clientName: d.clientName || '', clientDesignation: d.clientDesignation || '', clientOrganization: d.clientOrganization || '',
        review: d.review || '', rating: d.rating || 5, photo: d.photo || '', projectRef: d.projectRef || '',
        isApproved: d.isApproved ?? false, isFeatured: d.isFeatured ?? false,
      });
      setLastUpdatedAt(d.updatedAt);
    } catch { setApiError('Reload failed.'); }
    finally  { setLoading(false); }
  };

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
            {testimonialId ? 'Edit Testimonial' : 'Add Testimonial'}
          </h1>
          <p className="text-sm text-soft-grey mt-0.5">
            {testimonialId ? `Editing: ${form.clientName}` : 'Add a new client review.'}
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Client Information</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Client Name <span className="text-red-500">*</span></label>
                <input value={form.clientName} onChange={e => set('clientName', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors ${errors.clientName ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="e.g. John Smith" />
                {errors.clientName && <p className="text-xs text-red-500">{errors.clientName}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Designation</label>
                  <input value={form.clientDesignation} onChange={e => set('clientDesignation', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors"
                    placeholder="e.g. CEO" />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Organization</label>
                  <input value={form.clientOrganization} onChange={e => set('clientOrganization', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors"
                    placeholder="e.g. Acme Corp" />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Review Content</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Review <span className="text-red-500">*</span></label>
                <textarea value={form.review} onChange={e => set('review', e.target.value)} rows={5}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors resize-y ${errors.review ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="The testimonial text..." />
                {errors.review && <p className="text-xs text-red-500">{errors.review}</p>}
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Photo</h2>
            </div>
            <div className="p-5">
              {form.photo ? (
                <div className="space-y-2">
                  <img src={form.photo} alt="Client" className="w-full aspect-square object-cover rounded-sm border border-border-neutral" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPickerOpen(true)} className="text-xs font-bold text-brand-blue font-display hover:underline">Change</button>
                    <button type="button" onClick={() => set('photo', '')} className="text-xs font-bold text-soft-grey font-display hover:text-red-500">Remove</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="w-full aspect-square border-2 border-dashed border-border-neutral rounded-sm flex flex-col items-center justify-center gap-1 hover:border-brand-blue transition-colors group">
                  <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue text-[28px]">add_photo_alternate</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-soft-grey group-hover:text-brand-blue">Select Photo</span>
                </button>
              )}
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Rating (1-5) <span className="text-red-500">*</span></label>
                <input type="number" min="1" max="5" value={form.rating} onChange={e => set('rating', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors ${errors.rating ? 'border-red-400' : 'border-border-neutral'}`} />
                {errors.rating && <p className="text-xs text-red-500">{errors.rating}</p>}
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Related Project</label>
                <select value={form.projectRef} onChange={e => set('projectRef', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors">
                  <option value="">-- None --</option>
                  {projects.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border-neutral mt-2 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Approved</label>
                <button type="button" onClick={() => set('isApproved', !form.isApproved)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isApproved ? 'bg-brand-green' : 'bg-border-neutral'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isApproved ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-border-neutral mt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Is Featured</label>
                <button type="button" onClick={() => set('isFeatured', !form.isFeatured)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isFeatured ? 'bg-brand-gold' : 'bg-border-neutral'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFeatured ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-border-neutral">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-soft-grey hover:text-graphite transition-colors font-display">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors disabled:opacity-60 font-display flex items-center gap-2">
            {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</> : testimonialId ? 'Save Changes' : 'Add Testimonial'}
          </button>
        </div>
      </form>

      {pickerOpen && <MediaPicker onSelect={(asset) => { set('photo', asset.url); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TESTIMONIALS LIST
// ═══════════════════════════════════════════════════════════════
const TestimonialsList = ({ onCreate, onEdit }) => {
  const [items,    setItems]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [page,     setPage]    = useState(1);
  const [pages,    setPages]   = useState(1);
  const [total,    setTotal]   = useState(0);
  const [search,   setSearch]  = useState('');
  const searchTimer = useRef(null);

  const fetchItems = useCallback(async (pageNum = 1, q = search) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (q.trim()) params.search = q.trim();
      const res = await adminApi.get(`${API}/testimonials/admin`, { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load testimonials.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchItems(1, val), 350);
  };

  const handleToggleApprove = async (t) => {
    try {
      // Toggle approval via PUT
      await adminApi.put(`${API}/testimonials/${t._id}`, { ...t, isApproved: !t.isApproved });
      fetchItems(page);
    } catch (err) {
      setError('Action failed.');
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete review from "${t.clientName}"?`)) return;
    try {
      await adminApi.delete(`${API}/testimonials/${t._id}`);
      fetchItems(page);
    } catch (err) {
      setError('Delete failed.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Testimonials</h1>
          <p className="text-sm text-soft-grey mt-1">{total} review{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={onCreate}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add</span> Add Testimonial
        </button>
      </div>

      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
        <input value={search} onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue"
          placeholder="Search by client name..." />
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}

      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">chat</span>
            <p className="text-sm">No testimonials found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Client', 'Rating', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {items.map(t => (
                <tr key={t._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-border-neutral">
                        {t.photo ? <img src={t.photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-soft-grey text-[20px] mt-1 ml-1">person</span>}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-graphite block">{t.clientName}</span>
                          {t.isFeatured && <span className="material-symbols-outlined text-[14px] text-brand-gold" title="Featured">star</span>}
                        </div>
                        <span className="text-xs text-soft-grey">{t.clientDesignation}{t.clientDesignation && t.clientOrganization ? ' • ' : ''}{t.clientOrganization}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center text-brand-gold">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="material-symbols-outlined text-[14px]">{i < t.rating ? 'star' : 'star_rate_half'}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${t.isApproved ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                      {t.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEdit(t._id)}
                        className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleToggleApprove(t)}
                        className="text-soft-grey hover:text-graphite font-display text-xs font-bold uppercase tracking-wider">
                        {t.isApproved ? 'Unapprove' : 'Approve'}
                      </button>
                      <button onClick={() => handleDelete(t)}
                        className="text-red-500 hover:text-red-600 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">delete</span>
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
            <button onClick={() => fetchItems(page - 1)} disabled={page <= 1 || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Prev</button>
            <button onClick={() => fetchItems(page + 1)} disabled={page >= pages || loading}
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
const AdminTestimonials = () => {
  const [view,      setView]      = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [flashMsg,  setFlashMsg]  = useState('');

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };
  const handleCreate = () => { setEditingId(null); setView('editor'); };
  const handleEdit   = (id) => { setEditingId(id);   setView('editor'); };
  const handleBack   = () => { setEditingId(null);  setView('list'); };
  const handleSaved  = (data, isNew) => {
    showFlash(isNew ? `Testimonial from "${data.clientName}" added.` : `Testimonial from "${data.clientName}" saved.`);
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
      {view === 'list' && <TestimonialsList onCreate={handleCreate} onEdit={handleEdit} />}
      {view === 'editor' && <TestimonialEditor testimonialId={editingId} onBack={handleBack} onSaved={handleSaved} />}
    </div>
  );
};

export default AdminTestimonials;
