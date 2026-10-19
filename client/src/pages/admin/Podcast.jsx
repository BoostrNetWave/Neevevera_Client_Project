import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

const toSlug = (str) => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// ── Inline MediaPicker modal ───────────────────────────────────
const MediaPicker = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 bg-graphite/60 flex items-center justify-center p-6">
    <div className="bg-white rounded-sm w-full max-w-5xl h-[75vh] flex flex-col overflow-hidden border border-border-neutral shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral bg-surface-warm shrink-0">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">Select Cover Image</h3>
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

// ═══════════════════════════════════════════════════════════════
// PODCAST EDITOR
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  title: '', slug: '', episodeNumber: '', description: '',
  guest: '', host: 'Neevevera Editorial', duration: '',
  coverImage: '', audioUrl: '', transcript: '', tags: '',
  isPublished: false, season: 1,
};

const PodcastEditor = ({ podcastId, onBack, onSaved }) => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading,       setLoading]       = useState(!!podcastId);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState('');
  const [conflict,      setConflict]      = useState(null);
  const [slugManual,    setSlugManual]    = useState(false);
  const [pickerOpen,    setPickerOpen]    = useState(false);

  useEffect(() => {
    if (!podcastId) return;
    (async () => {
      try {
        const res = await adminApi.get(`${API}/podcast/admin/${podcastId}`);
        const d = res.data.data;
        setForm({
          title: d.title || '', slug: d.slug || '', episodeNumber: d.episodeNumber || '',
          description: d.description || '', guest: d.guest || '', host: d.host || '',
          duration: d.duration || '', coverImage: d.coverImage || '', audioUrl: d.audioUrl || '',
          transcript: d.transcript || '', tags: d.tags ? d.tags.join(', ') : '',
          isPublished: d.isPublished ?? false, season: d.season || 1,
        });
        setLastUpdatedAt(d.updatedAt);
        setSlugManual(true);
      } catch (err) {
        setApiError('Failed to load episode. Please go back and try again.');
      } finally { setLoading(false); }
    })();
  }, [podcastId]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));
  const handleTitleChange = (val) => { set('title', val); if (!slugManual) set('slug', toSlug(val)); };

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = 'Title is required.';
    if (!form.slug.trim())  e.slug  = 'Slug is required.';
    if (!form.episodeNumber.trim()) e.episodeNumber = 'Episode number is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e, asDraft = false) => {
    e?.preventDefault();
    if (!validate()) return;
    setSaving(true); setApiError(''); setConflict(null);
    
    const tagsArray = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const payload = { ...form, tags: tagsArray, season: Number(form.season) || 1, isPublished: asDraft ? false : form.isPublished };
    if (lastUpdatedAt) payload.lastKnownUpdatedAt = lastUpdatedAt;

    try {
      let res;
      if (podcastId) {
        res = await adminApi.put(`${API}/podcast/${podcastId}`, payload);
      } else {
        res = await adminApi.post(`${API}/podcast`, payload);
      }
      setLastUpdatedAt(res.data.data.updatedAt);
      onSaved(res.data.data, !podcastId);
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
      const res = await adminApi.get(`${API}/podcast/admin/${podcastId}`);
      const d = res.data.data;
      setForm({
        title: d.title || '', slug: d.slug || '', episodeNumber: d.episodeNumber || '',
        description: d.description || '', guest: d.guest || '', host: d.host || '',
        duration: d.duration || '', coverImage: d.coverImage || '', audioUrl: d.audioUrl || '',
        transcript: d.transcript || '', tags: d.tags ? d.tags.join(', ') : '',
        isPublished: d.isPublished ?? false, season: d.season || 1,
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
            {podcastId ? 'Edit Podcast Episode' : 'New Podcast Episode'}
          </h1>
          <p className="text-sm text-soft-grey mt-0.5">{podcastId ? `Editing: ${form.slug}` : 'Add a new episode to the podcast.'}</p>
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

      <form onSubmit={(e) => handleSave(e, false)} className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Episode Details</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Title <span className="text-red-500">*</span></label>
                <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.title ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="e.g. The Future of Sustainable Building" />
                {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Episode Number <span className="text-red-500">*</span></label>
                  <input value={form.episodeNumber} onChange={e => set('episodeNumber', e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.episodeNumber ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="e.g. 42" />
                  {errors.episodeNumber && <p className="text-xs text-red-500">{errors.episodeNumber}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Season</label>
                  <input type="number" value={form.season} onChange={e => set('season', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">URL Slug <span className="text-red-500">*</span></label>
                <input value={form.slug} onChange={e => { setSlugManual(true); set('slug', toSlug(e.target.value)); }}
                  className={`w-full px-3 py-2.5 text-sm font-mono bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue ${errors.slug ? 'border-red-400' : 'border-border-neutral'}`} />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Description <span className="text-red-500">*</span></label>
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue resize-y ${errors.description ? 'border-red-400' : 'border-border-neutral'}`}
                  placeholder="What is this episode about..." />
                {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              </div>
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Media & Links</h2>
            </div>
            <div className="p-5 space-y-5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Audio URL / Embed Link</label>
                <input value={form.audioUrl} onChange={e => set('audioUrl', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                  placeholder="e.g. Spotify embed link or raw mp3 URL" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Transcript</label>
                <textarea value={form.transcript} onChange={e => set('transcript', e.target.value)} rows={6}
                  className="w-full px-3 py-2.5 text-sm font-mono bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue resize-y"
                  placeholder="Paste raw transcript text here (optional)..." />
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Cover Image</h2>
            </div>
            <div className="p-5">
              {form.coverImage ? (
                <div className="space-y-2">
                  <img src={form.coverImage} alt="Cover" className="w-full aspect-square object-cover rounded-sm border border-border-neutral" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setPickerOpen(true)} className="text-xs font-bold text-brand-blue font-display hover:underline">Change</button>
                    <button type="button" onClick={() => set('coverImage', '')} className="text-xs font-bold text-soft-grey font-display hover:text-red-500">Remove</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="w-full aspect-square border-2 border-dashed border-border-neutral rounded-sm flex flex-col items-center justify-center gap-1 hover:border-brand-blue transition-colors group">
                  <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue text-[28px]">add_photo_alternate</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-soft-grey group-hover:text-brand-blue">Select Image</span>
                </button>
              )}
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Settings</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Host</label>
                <input value={form.host} onChange={e => set('host', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Guest(s)</label>
                <input value={form.guest} onChange={e => set('guest', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Duration</label>
                <input value={form.duration} onChange={e => set('duration', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                  placeholder="e.g. 45:00" />
              </div>
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Tags (comma separated)</label>
                <input value={form.tags} onChange={e => set('tags', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue" />
              </div>
              
              <div className="flex items-center justify-between py-2 border-t border-border-neutral mt-2 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Published</label>
                <button type="button" onClick={() => set('isPublished', !form.isPublished)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isPublished ? 'bg-brand-green' : 'bg-border-neutral'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-border-neutral">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-soft-grey hover:text-graphite font-display">Cancel</button>
          {!form.isPublished && (
            <button type="button" onClick={(e) => handleSave(e, true)} disabled={saving} className="px-5 py-2.5 border border-border-neutral bg-surface-white text-graphite text-sm font-bold uppercase tracking-wider rounded-sm hover:border-brand-blue disabled:opacity-60 font-display">
              Save Draft
            </button>
          )}
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover disabled:opacity-60 font-display flex items-center gap-2">
            {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</> : form.isPublished ? 'Update & Publish' : 'Publish'}
          </button>
        </div>
      </form>
      {pickerOpen && <MediaPicker onSelect={(asset) => { set('coverImage', asset.url); setPickerOpen(false); }} onClose={() => setPickerOpen(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PODCAST LIST
// ═══════════════════════════════════════════════════════════════
const PodcastList = ({ onCreate, onEdit }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const searchTimer = useRef(null);

  const fetchItems = useCallback(async (pageNum = 1, q = search) => {
    setLoading(true); setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (q.trim()) params.search = q.trim();
      const res = await adminApi.get(`${API}/podcast/admin`, { params });
      setItems(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load podcasts.');
    } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchItems(1, val), 350);
  };

  const handleDelete = async (ep) => {
    const msg = `Permanently delete episode "${ep.title}"?`;
    if (!window.confirm(msg)) return;
    try {
      await adminApi.delete(`${API}/podcast/${ep._id}`);
      fetchItems(page);
    } catch { setError('Delete failed.'); }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Podcast</h1>
          <p className="text-sm text-soft-grey mt-1">{total} episode{total !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={onCreate} className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">mic</span> Add Episode
        </button>
      </div>

      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
        <input value={search} onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue"
          placeholder="Search episodes..." />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-soft-grey gap-2 text-sm">
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>Loading...
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">podcasts</span>
            <p className="text-sm">No episodes added yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Episode', 'Duration', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {items.map(ep => (
                <tr key={ep._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-graphite block">{ep.title}</span>
                    <span className="text-xs text-soft-grey font-mono">S{ep.season} E{ep.episodeNumber} • {ep.slug}</span>
                  </td>
                  <td className="py-3.5 px-5 text-soft-grey">{ep.duration || 'N/A'}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${ep.isPublished ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-surface-muted text-soft-grey border-border-neutral'}`}>
                      {ep.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEdit(ep._id)} className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleDelete(ep)} className="text-red-500 hover:text-red-600 font-display text-xs font-bold uppercase tracking-wider flex items-center gap-1">
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
const AdminPodcast = () => {
  const [view,      setView]      = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [flashMsg,  setFlashMsg]  = useState('');

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };
  
  const handleCreate = () => { setEditingId(null); setView('editor'); };
  const handleEdit   = (id) => { setEditingId(id);   setView('editor'); };
  const handleBack   = () => { setEditingId(null); setView('list'); };
  
  const handleSaved  = (data, isNew) => {
    showFlash(`Episode "${data.title}" ${data.isPublished ? 'published' : 'saved as draft'}.`);
    setView('list'); setEditingId(null);
  };

  return (
    <div className="w-full">
      {flashMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-brand-green/10 border border-brand-green/20 rounded-sm text-sm text-brand-green font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>{flashMsg}
        </div>
      )}
      {view === 'list'   && <PodcastList onCreate={handleCreate} onEdit={handleEdit} />}
      {view === 'editor' && <PodcastEditor podcastId={editingId} onBack={handleBack} onSaved={handleSaved} />}
    </div>
  );
};

export default AdminPodcast;
