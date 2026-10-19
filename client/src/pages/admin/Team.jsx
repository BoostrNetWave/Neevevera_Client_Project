import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

const ROLES = ['director', 'project-manager', 'civil-engineer', 'architect', 'site-engineer', 'supervisor', 'other'];

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
        <MediaLibrary mode="select" onSelect={onSelect} imageContext="teamPhoto" />
      </div>
    </div>
  </div>
);

// ── StringListEditor — repeatable plain-string items ───────────
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
            className="flex-1 px-3 py-2 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
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
// TEAM EDITOR
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  name: '', designation: '', role: 'other',
  experience: '', qualifications: [], bio: '', photo: '', email: '',
  order: 0, isActive: true,
};

const TeamEditor = ({ memberId, onBack, onSaved }) => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading,       setLoading]       = useState(!!memberId);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState('');
  const [conflict,      setConflict]      = useState(null);
  const [pickerOpen,    setPickerOpen]    = useState(false);

  useEffect(() => {
    if (!memberId) return;
    (async () => {
      try {
        const res = await adminApi.get(`${API}/team/${memberId}`);
        const d = res.data.data;
        setForm({
          name: d.name || '', designation: d.designation || '', role: d.role || 'other',
          experience: d.experience || '', qualifications: d.qualifications || [],
          bio: d.bio || '', photo: d.photo || '', email: d.email || '',
          order: d.order || 0, isActive: d.isActive ?? true,
        });
        setLastUpdatedAt(d.updatedAt);
      } catch (err) {
        setApiError('Failed to load team member. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [memberId]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  const validate = () => {
    const e = {};
    if (!form.name.trim())        e.name        = 'Name is required.';
    if (!form.designation.trim()) e.designation = 'Designation is required.';
    if (!form.role)               e.role        = 'Role category is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    setConflict(null);

    const payload = { ...form, order: Number(form.order) || 0 };
    if (lastUpdatedAt) payload.lastKnownUpdatedAt = lastUpdatedAt;

    try {
      let res;
      if (memberId) {
        res = await adminApi.put(`${API}/team/${memberId}`, payload);
      } else {
        res = await adminApi.post(`${API}/team`, payload);
      }
      setLastUpdatedAt(res.data.data.updatedAt);
      onSaved(res.data.data, !memberId);
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
      const res = await adminApi.get(`${API}/team/${memberId}`);
      const d = res.data.data;
      setForm({
        name: d.name || '', designation: d.designation || '', role: d.role || 'other',
        experience: d.experience || '', qualifications: d.qualifications || [],
        bio: d.bio || '', photo: d.photo || '', email: d.email || '',
        order: d.order || 0, isActive: d.isActive ?? true,
      });
      setLastUpdatedAt(d.updatedAt);
    } catch { setApiError('Reload failed.'); }
    finally  { setLoading(false); }
  };

  const handleMediaSelect = (asset) => {
    set('photo', asset.url);
    setPickerOpen(false);
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
            {memberId ? 'Edit Team Member' : 'Add Team Member'}
          </h1>
          <p className="text-sm text-soft-grey mt-0.5">
            {memberId ? `Editing: ${form.name}` : 'Create a new team member profile.'}
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Profile Information</h2>
            </div>
            <div className="p-5 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Name <span className="text-red-500">*</span></label>
                  <input value={form.name} onChange={e => set('name', e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors ${errors.name ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="e.g. Jane Doe" />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors"
                    placeholder="e.g. jane@neevevera.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Designation <span className="text-red-500">*</span></label>
                  <input value={form.designation} onChange={e => set('designation', e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors ${errors.designation ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="e.g. Chief Architect" />
                  {errors.designation && <p className="text-xs text-red-500">{errors.designation}</p>}
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Experience</label>
                  <input value={form.experience} onChange={e => set('experience', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors"
                    placeholder="e.g. 15 Years" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Biography</label>
                <textarea value={form.bio} onChange={e => set('bio', e.target.value)} rows={4}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors resize-y"
                  placeholder="Brief background..." />
              </div>
            </div>
          </section>

          <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Qualifications</h2>
            </div>
            <div className="p-5">
              <StringListEditor label="Degrees & Certifications" placeholder="e.g. B.Tech in Civil Engineering"
                items={form.qualifications} onChange={v => set('qualifications', v)} />
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
                  <img src={form.photo} alt="Profile" className="w-full aspect-square object-cover rounded-sm border border-border-neutral" />
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
              <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Settings</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Role Category <span className="text-red-500">*</span></label>
                <select value={form.role} onChange={e => set('role', e.target.value)}
                  className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors ${errors.role ? 'border-red-400' : 'border-border-neutral'}`}>
                  {ROLES.map(r => <option key={r} value={r}>{r.replace('-', ' ').toUpperCase()}</option>)}
                </select>
                {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
              </div>
              
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Display Order</label>
                <input type="number" value={form.order} onChange={e => set('order', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue transition-colors"
                  placeholder="0" />
                <p className="text-[10px] text-soft-grey">Lower numbers appear first.</p>
              </div>

              <div className="flex items-center justify-between py-2 border-t border-border-neutral mt-2 pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Active / Visible</label>
                <button type="button" onClick={() => set('isActive', !form.isActive)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-brand-green' : 'bg-border-neutral'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-3 flex items-center justify-end gap-3 pt-4 border-t border-border-neutral">
          <button type="button" onClick={onBack} className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-soft-grey hover:text-graphite transition-colors font-display">Cancel</button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors disabled:opacity-60 font-display flex items-center gap-2">
            {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</> : memberId ? 'Save Changes' : 'Create Profile'}
          </button>
        </div>
      </form>

      {pickerOpen && <MediaPicker onSelect={handleMediaSelect} onClose={() => setPickerOpen(false)} />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// TEAM LIST
// ═══════════════════════════════════════════════════════════════
const TeamList = ({ onCreate, onEdit }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [total,   setTotal]   = useState(0);
  const [search,  setSearch]  = useState('');
  const searchTimer = useRef(null);

  const fetchMembers = useCallback(async (pageNum = 1, q = search) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (q.trim()) params.search = q.trim();
      const res = await adminApi.get(`${API}/team/admin`, { params });
      setMembers(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load team members.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchMembers(1); }, [fetchMembers]);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchMembers(1, val), 350);
  };

  const handleToggleActive = async (mem) => {
    try {
      if (mem.isActive) {
        await adminApi.delete(`${API}/team/${mem._id}`);
      } else {
        await adminApi.patch(`${API}/team/${mem._id}/activate`, {});
      }
      fetchMembers(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Team Management</h1>
          <p className="text-sm text-soft-grey mt-1">{total} team member{total !== 1 ? 's' : ''} total</p>
        </div>
        <button onClick={onCreate}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add</span> Add Member
        </button>
      </div>

      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
        <input value={search} onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue"
          placeholder="Search by name..." />
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
        ) : members.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">groups</span>
            <p className="text-sm">No team members found.</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Name', 'Role', 'Order', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {members.map(mem => (
                <tr key={mem._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-surface-muted shrink-0 border border-border-neutral">
                        {mem.photo ? <img src={mem.photo} alt="" className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-soft-grey text-[20px] mt-1 ml-1">person</span>}
                      </div>
                      <div>
                        <span className="font-semibold text-graphite block">{mem.name}</span>
                        <span className="text-xs text-soft-grey">{mem.designation}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5 text-soft-grey capitalize">{mem.role.replace(/-/g, ' ')}</td>
                  <td className="py-3.5 px-5">
                    <span className="inline-flex items-center justify-center w-7 h-7 text-xs font-bold font-display bg-surface-warm border border-border-neutral rounded-sm text-graphite">
                      {mem.order ?? 0}
                    </span>
                  </td>
                <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide border ${mem.isActive ? 'bg-brand-green/10 text-brand-green border-brand-green/20' : 'bg-surface-muted text-soft-grey border-border-neutral'}`}>
                      {mem.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEdit(mem._id)}
                        className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">Edit</button>
                      <button onClick={() => handleToggleActive(mem)}
                        className="text-soft-grey hover:text-graphite font-display text-xs font-bold uppercase tracking-wider">
                        {mem.isActive ? 'Deactivate' : 'Activate'}
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
            <button onClick={() => fetchMembers(page - 1)} disabled={page <= 1 || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display">Prev</button>
            <button onClick={() => fetchMembers(page + 1)} disabled={page >= pages || loading}
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
const AdminTeam = () => {
  const [view,      setView]      = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [flashMsg,  setFlashMsg]  = useState('');

  const showFlash = (msg) => { setFlashMsg(msg); setTimeout(() => setFlashMsg(''), 3000); };
  const handleCreate = () => { setEditingId(null); setView('editor'); };
  const handleEdit   = (id) => { setEditingId(id);   setView('editor'); };
  const handleBack   = () => { setEditingId(null);  setView('list'); };
  const handleSaved  = (data, isNew) => {
    showFlash(isNew ? `Profile for "${data.name}" created.` : `Profile for "${data.name}" saved.`);
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
      {view === 'list' && <TeamList onCreate={handleCreate} onEdit={handleEdit} />}
      {view === 'editor' && <TeamEditor memberId={editingId} onBack={handleBack} onSaved={handleSaved} />}
    </div>
  );
};

export default AdminTeam;
