import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

const CATEGORIES = [
  { value: 'construction-site', label: 'Construction Site' },
  { value: 'completed-project', label: 'Completed Project' },
  { value: 'work-progress',     label: 'Work in Progress' },
  { value: 'equipment',         label: 'Equipment' },
  { value: 'team',              label: 'Team Activities' },
  { value: 'project-video',     label: 'Project Video' },
  { value: 'other',             label: 'Other' },
];

const MediaPicker = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 bg-graphite/60 flex items-center justify-center p-6">
    <div className="bg-white rounded-sm w-full max-w-5xl h-[75vh] flex flex-col overflow-hidden border border-border-neutral shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral bg-surface-warm shrink-0">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">Select Media</h3>
        <button type="button" onClick={onClose} className="text-soft-grey hover:text-graphite">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="flex-1 min-h-0">
        <MediaLibrary mode="select" onSelect={onSelect} imageContext="galleryMedia" />
      </div>
    </div>
  </div>
);

const EMPTY = {
  title: '', caption: '', imageUrl: '', publicId: '',
  category: 'other', mediaType: 'image', isVisible: true, order: 0,
};

// ── Item Editor Modal ──────────────────────────────────────────
const ItemEditor = ({ item, onSave, onClose }) => {
  const [form, setForm] = useState(item ? {
    title: item.title || '', caption: item.caption || '', imageUrl: item.imageUrl || '',
    publicId: item.publicId || '', category: item.category || 'other',
    mediaType: item.mediaType || 'image', isVisible: item.isVisible ?? true,
    order: item.order ?? 0,
  } : { ...EMPTY });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.imageUrl.trim()) { setError('Please select an image.'); return; }
    setSaving(true); setError('');
    try {
      if (item?._id) {
        await adminApi.put(`${API}/gallery/${item._id}`, form);
      } else {
        await adminApi.post(`${API}/gallery`, form);
      }
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-40 bg-graphite/50 flex items-center justify-center p-6">
      <div className="bg-white rounded-sm w-full max-w-2xl border border-border-neutral shadow-xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border-neutral bg-surface-warm">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">
            {item ? 'Edit Gallery Item' : 'Add Gallery Item'}
          </h3>
          <button onClick={onClose} className="text-soft-grey hover:text-graphite">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Image selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display mb-2">
              Image / Media <span className="text-red-500">*</span>
            </label>
            {form.imageUrl ? (
              <div className="relative group">
                <img src={form.imageUrl} alt="preview" className="w-full h-48 object-cover rounded-sm border border-border-neutral" />
                <button type="button" onClick={() => setPickerOpen(true)}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold uppercase transition-opacity rounded-sm">
                  Change Image
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => setPickerOpen(true)}
                className="w-full h-40 border-2 border-dashed border-border-neutral rounded-sm flex flex-col items-center justify-center gap-2 hover:border-brand-blue transition-colors group">
                <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue text-[32px]">add_photo_alternate</span>
                <span className="text-xs font-bold text-soft-grey group-hover:text-brand-blue uppercase tracking-wider">Select Image</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input value={form.title} onChange={e => set('title', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue"
                placeholder="e.g. High-Bay Warehouse Piling" />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display mb-1">Category</label>
              <select value={form.category} onChange={e => set('category', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue bg-white">
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display mb-1">Caption</label>
            <textarea value={form.caption} onChange={e => set('caption', e.target.value)} rows={2}
              className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue resize-none"
              placeholder="Short description for this image..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display mb-1">Media Type</label>
              <select value={form.mediaType} onChange={e => set('mediaType', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue bg-white">
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display mb-1">Display Order</label>
              <input type="number" value={form.order} onChange={e => set('order', Number(e.target.value))}
                className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue"
                placeholder="0" />
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-t border-border-neutral">
            <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Visible on Site</label>
            <button type="button" onClick={() => set('isVisible', !form.isVisible)}
              className={`relative w-10 h-5 rounded-full transition-colors ${form.isVisible ? 'bg-brand-green' : 'bg-border-neutral'}`}>
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isVisible ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">{error}</p>}

          <div className="flex gap-3 justify-end pt-2 border-t border-border-neutral">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-soft-grey hover:text-graphite font-display">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover disabled:opacity-60 font-display flex items-center gap-2">
              {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving…</> : 'Save Item'}
            </button>
          </div>
        </form>

        {pickerOpen && (
          <MediaPicker
            onSelect={asset => { set('imageUrl', asset.url); set('publicId', asset.publicId || ''); setPickerOpen(false); }}
            onClose={() => setPickerOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

// ── Main Gallery Admin Page ────────────────────────────────────
const AdminGallery = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [catFilter, setCatFilter] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);   // item obj or {} for new
  const [flash, setFlash] = useState('');
  const searchTimer = useRef(null);

  const fetchItems = useCallback(async (p = 1, q = search, cat = catFilter) => {
    setLoading(true); setError('');
    try {
      const params = { page: p, limit: 20 };
      if (q.trim()) params.search = q.trim();
      if (cat) params.category = cat;
      const res = await adminApi.get(`${API}/gallery/admin`, { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setPage(res.data.page || 1);
      setPages(res.data.pages || 1);
    } catch { setError('Failed to load gallery items.'); }
    finally { setLoading(false); }
  }, [search, catFilter]);

  useEffect(() => { fetchItems(1); }, [fetchItems]);

  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchItems(1, val, catFilter), 350);
  };

  const handleToggleVisibility = async (item) => {
    try {
      await adminApi.patch(`${API}/gallery/${item._id}/visibility`);
      showFlash(`"${item.title}" ${item.isVisible ? 'hidden' : 'made visible'}.`);
      fetchItems(page);
    } catch { setError('Update failed.'); }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}" from gallery?`)) return;
    try {
      await adminApi.delete(`${API}/gallery/${item._id}`);
      showFlash(`"${item.title}" deleted.`);
      fetchItems(page);
    } catch { setError('Delete failed.'); }
  };

  const showFlash = (msg) => { setFlash(msg); setTimeout(() => setFlash(''), 3000); };

  const handleSaved = () => {
    showFlash(editing?._id ? 'Gallery item updated.' : 'Gallery item added.');
    setEditing(null);
    fetchItems(page);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Gallery</h1>
          <p className="text-sm text-soft-grey mt-1">{total} item{total !== 1 ? 's' : ''} • Manage construction site photos, project images, and videos</p>
        </div>
        <button onClick={() => setEditing({})}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span> Add Item
        </button>
      </div>

      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-brand-green/10 border border-brand-green/20 rounded-sm text-sm text-brand-green font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>{flash}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
          <input value={search} onChange={e => handleSearch(e.target.value)}
            className="pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white outline-none focus:border-brand-blue"
            placeholder="Search..." />
        </div>
        <select value={catFilter} onChange={e => { setCatFilter(e.target.value); fetchItems(1, search, e.target.value); }}
          className="px-3 py-2 text-sm border border-border-neutral rounded-sm bg-white outline-none focus:border-brand-blue">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-sm border border-red-200">{error}</div>}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-soft-grey gap-2">
          <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          <span className="text-sm">Loading...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-soft-grey gap-2 border border-dashed border-border-neutral rounded-sm">
          <span className="material-symbols-outlined text-[36px]">photo_library</span>
          <p className="text-sm">No gallery items yet. Add the first one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map(item => (
            <div key={item._id} className={`relative group bg-white border rounded-sm overflow-hidden shadow-sm transition-all ${item.isVisible ? 'border-border-neutral' : 'border-border-neutral opacity-60'}`}>
              <div className="aspect-square overflow-hidden bg-surface-warm">
                <img src={item.imageUrl} alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              </div>

              {/* Visibility badge */}
              <div className={`absolute top-2 left-2 px-2 py-0.5 text-[10px] font-bold uppercase rounded-sm ${item.isVisible ? 'bg-brand-green text-white' : 'bg-graphite/70 text-white'}`}>
                {item.isVisible ? 'Visible' : 'Hidden'}
              </div>

              {/* Category badge */}
              <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm">
                {CATEGORIES.find(c => c.value === item.category)?.label || item.category}
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-xs font-semibold text-graphite truncate">{item.title}</p>
                {item.caption && <p className="text-[11px] text-soft-grey mt-0.5 line-clamp-2">{item.caption}</p>}
              </div>

              {/* Actions */}
              <div className="flex items-center border-t border-border-neutral divide-x divide-border-neutral">
                <button onClick={() => setEditing(item)}
                  className="flex-1 py-2 text-[11px] font-bold text-brand-blue hover:bg-surface-warm transition-colors font-display uppercase">
                  Edit
                </button>
                <button onClick={() => handleToggleVisibility(item)}
                  className="flex-1 py-2 text-[11px] font-bold text-soft-grey hover:bg-surface-warm transition-colors font-display uppercase">
                  {item.isVisible ? 'Hide' : 'Show'}
                </button>
                <button onClick={() => handleDelete(item)}
                  className="py-2 px-3 text-red-500 hover:bg-red-50 transition-colors">
                  <span className="material-symbols-outlined text-[14px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-soft-grey">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchItems(page - 1)} disabled={page <= 1 || loading}
              className="text-xs font-bold text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Prev</button>
            <button onClick={() => fetchItems(page + 1)} disabled={page >= pages || loading}
              className="text-xs font-bold text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Next</button>
          </div>
        </div>
      )}

      {/* Editor Modal */}
      {editing !== null && (
        <ItemEditor
          item={editing?._id ? editing : null}
          onSave={handleSaved}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
};

export default AdminGallery;
