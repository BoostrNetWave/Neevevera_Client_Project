import React, { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

// ── Helpers ────────────────────────────────────────────────────

// Repeatable plain-string list (Values)
const StringListEditor = ({ label, items, onChange }) => {
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
      {items.length === 0 && (
        <p className="text-xs text-soft-grey italic">No entries yet. Click Add to begin.</p>
      )}
      {items.map((val, i) => (
        <div key={i} className="flex items-center gap-2">
          <input value={val} onChange={e => update(i, e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
            placeholder={`${label} item`} />
          <button type="button" onClick={() => remove(i)}
            className="text-soft-grey hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
          </button>
        </div>
      ))}
    </div>
  );
};

// Repeatable object list (Certifications, Awards) with optional image via MediaPicker
const ObjectListEditor = ({ label, items, fields, onChange }) => {
  const [pickerOpen, setPickerOpen] = useState(null); // index whose image is being picked

  const add    = () => onChange([...items, Object.fromEntries(fields.map(f => [f.key, '']))]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, key, val) => {
    const next = [...items];
    next[i] = { ...next[i], [key]: val };
    onChange(next);
  };
  const pickImage = (i, asset) => {
    update(i, 'imageUrl', asset.url);
    setPickerOpen(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">{label}</label>
        <button type="button" onClick={add}
          className="text-[10px] font-bold uppercase tracking-wider text-brand-blue border border-brand-blue/30 px-2 py-1 rounded-sm hover:bg-brand-blue/5 transition-colors font-display flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">add</span> Add
        </button>
      </div>
      {items.length === 0 && (
        <p className="text-xs text-soft-grey italic">No entries yet.</p>
      )}
      {items.map((item, i) => (
        <div key={i} className="border border-border-neutral rounded-sm p-4 space-y-3 bg-surface-white relative">
          <button type="button" onClick={() => remove(i)}
            className="absolute top-3 right-3 text-soft-grey hover:text-red-500 transition-colors">
            <span className="material-symbols-outlined text-[18px]">remove_circle</span>
          </button>
          {fields.map(f => f.key !== 'imageUrl' && (
            <div key={f.key} className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-soft-grey font-display">{f.label}</label>
              <input value={item[f.key] || ''} onChange={e => update(i, f.key, e.target.value)}
                type={f.type || 'text'}
                className="w-full px-3 py-2 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                placeholder={f.placeholder || ''} />
            </div>
          ))}
          {/* Image field via MediaPicker */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-soft-grey font-display">Image (optional)</label>
            {item.imageUrl ? (
              <div className="flex items-center gap-3">
                <img src={item.imageUrl} alt="Selected" className="w-12 h-12 object-cover rounded-sm border border-border-neutral" />
                <button type="button" onClick={() => setPickerOpen(i)}
                  className="text-xs text-brand-blue hover:underline font-display font-bold">Change</button>
                <button type="button" onClick={() => update(i, 'imageUrl', '')}
                  className="text-xs text-soft-grey hover:text-red-500 transition-colors font-display">Remove</button>
              </div>
            ) : (
              <button type="button" onClick={() => setPickerOpen(i)}
                className="text-[10px] font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display flex items-center gap-1">
                <span className="material-symbols-outlined text-[13px]">add_photo_alternate</span> Select Image
              </button>
            )}
          </div>

          {/* Inline MediaPicker overlay */}
          {pickerOpen === i && (
            <div className="fixed inset-0 z-50 bg-graphite/60 flex items-center justify-center p-6">
              <div className="bg-white rounded-sm w-full max-w-4xl h-[70vh] flex flex-col overflow-hidden border border-border-neutral">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral">
                  <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">Select Image</h3>
                  <button type="button" onClick={() => setPickerOpen(null)}
                    className="text-soft-grey hover:text-graphite transition-colors">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <MediaLibrary mode="select" onSelect={asset => pickImage(i, asset)} imageContext="serviceImage" />
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
const AdminCompany = () => {
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [apiError,    setApiError]    = useState('');

  const EMPTY = {
    overview: '', mission: '', vision: '', history: '',
    values: [], certifications: [], awards: [],
  };
  const [form, setForm] = useState(EMPTY);

  // ── Load ───────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await adminApi.get(`${API}/company`);
      const d = res.data.data;
      setForm({
        overview:       d.overview       || '',
        mission:        d.mission        || '',
        vision:         d.vision         || '',
        history:        d.history        || '',
        // values in DB are {title, description} objects — extract just the title string for the simple editor
        values:         (d.values || []).map(v => typeof v === 'string' ? v : (v.title || '')),
        certifications: d.certifications || [],
        awards:         d.awards         || [],
      });
    } catch (err) {
      if (err.response?.status === 404) {
        // 404 = singleton not seeded yet — treat as empty form, not an error
        setForm(EMPTY);
      } else {
        setApiError('Failed to load company information. Please refresh.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setApiError('');
    try {
      // Convert plain string values back into the {title} object shape the model expects
      const payload = {
        ...form,
        values: form.values.filter(v => v.trim()).map(v =>
          typeof v === 'string' ? { title: v, description: '' } : v
        ),
      };
      await adminApi.put(`${API}/company`, payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Save failed. Please try again.';
      setApiError(msg);
    } finally {
      setSaving(false);
    }
  };

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-soft-grey gap-2 text-sm">
        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
        Loading company information...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-24">

      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            Company Information
          </h1>
          <p className="text-sm text-soft-grey mt-1">
            Corporate identity displayed across the public website.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-8 max-w-4xl">

        {/* Core Identity */}
        <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Core Identity</h2>
          </div>
          <div className="p-5 space-y-5">
            {[
              { key: 'overview', label: 'Company Overview', rows: 4 },
              { key: 'mission',  label: 'Mission Statement', rows: 3 },
              { key: 'vision',   label: 'Vision Statement',  rows: 3 },
              { key: 'history',  label: 'Corporate History', rows: 5 },
            ].map(({ key, label, rows }) => (
              <div key={key} className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">{label}</label>
                <textarea
                  value={form[key]}
                  onChange={e => set(key, e.target.value)}
                  rows={rows}
                  className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors resize-y"
                  placeholder={`Enter ${label.toLowerCase()}...`}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Values */}
        <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Core Values</h2>
          </div>
          <div className="p-5">
            <StringListEditor label="Values" items={form.values} onChange={v => set('values', v)} />
          </div>
        </section>

        {/* Certifications */}
        <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Certifications</h2>
          </div>
          <div className="p-5">
            <ObjectListEditor
              label="Certifications"
              items={form.certifications}
              fields={[
                { key: 'name',     label: 'Certification Name', placeholder: 'e.g. ISO 9001:2015' },
                { key: 'issuedBy', label: 'Issued By',          placeholder: 'e.g. Bureau Veritas' },
                { key: 'year',     label: 'Year',               type: 'number', placeholder: '2024' },
              ]}
              onChange={v => set('certifications', v)}
            />
          </div>
        </section>

        {/* Awards */}
        <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
            <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Awards & Recognition</h2>
          </div>
          <div className="p-5">
            <ObjectListEditor
              label="Awards"
              items={form.awards}
              fields={[
                { key: 'title',       label: 'Award Title',  placeholder: 'e.g. Best Emerging Contractor' },
                { key: 'issuedBy',    label: 'Issued By',    placeholder: 'e.g. CREDAI Odisha' },
                { key: 'year',        label: 'Year',         type: 'number', placeholder: '2024' },
                { key: 'description', label: 'Description',  placeholder: 'Brief note (optional)' },
              ]}
              onChange={v => set('awards', v)}
            />
          </div>
        </section>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-4 sticky bottom-0 bg-surface-body py-4 border-t border-border-neutral -mx-1 px-1">
          <div>
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-green font-display">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Changes saved successfully
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors disabled:opacity-60 font-display flex items-center gap-2"
          >
            {saving ? (
              <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</>
            ) : 'Save Changes'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AdminCompany;
