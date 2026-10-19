import React, { useState, useEffect, useCallback, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

const CATEGORIES = [
  'construction',
  'building-repair-maintenance',
  'design-planning',
  'interior-exterior-solutions',
  'project-management-consultancy',
  'additional-services-platform-features',
];

const CATEGORY_LABELS = {
  'construction': 'Construction',
  'building-repair-maintenance': 'Building Repair and Maintenance',
  'design-planning': 'Design and Planning',
  'interior-exterior-solutions': 'Interior and Exterior Solutions',
  'project-management-consultancy': 'Project Management Consultancy (PMC)',
  'additional-services-platform-features': 'Additional Services and Platform Features',
};

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
        <MediaLibrary mode="select" onSelect={onSelect} imageContext="serviceImage" />
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

// ── Sections & Sub-Services Editor ─────────────────────────────
const SectionsEditor = ({ sections = [], onChange, onPickImage }) => {
  const addSection = () => {
    onChange([
      ...sections,
      {
        title: '',
        description: '',
        order: sections.length + 1,
        services: [
          {
            title: '',
            description: '',
            image: '/images/client_hero.webp',
            isActive: true,
            order: 1,
          },
        ],
      },
    ]);
  };

  const removeSection = (sIdx) => {
    onChange(sections.filter((_, idx) => idx !== sIdx));
  };

  const updateSection = (sIdx, field, val) => {
    const updated = [...sections];
    updated[sIdx] = { ...updated[sIdx], [field]: val };
    onChange(updated);
  };

  const moveSection = (sIdx, direction) => {
    if (
      (direction === -1 && sIdx === 0) ||
      (direction === 1 && sIdx === sections.length - 1)
    ) return;
    const updated = [...sections];
    const targetIdx = sIdx + direction;
    const temp = updated[sIdx];
    updated[sIdx] = updated[targetIdx];
    updated[targetIdx] = temp;
    // Sync order to array index so DB stays consistent
    onChange(updated.map((s, i) => ({ ...s, order: i + 1 })));
  };

  const addSubService = (sIdx) => {
    const updated = [...sections];
    const currServices = updated[sIdx]?.services || [];
    updated[sIdx] = {
      ...updated[sIdx],
      services: [
        ...currServices,
        {
          title: '',
          description: '',
          image: '/images/client_commercial.webp',
          isActive: true,
          order: currServices.length + 1,
        },
      ],
    };
    onChange(updated);
  };

  const removeSubService = (sIdx, subIdx) => {
    const updated = [...sections];
    const currServices = updated[sIdx]?.services || [];
    updated[sIdx] = {
      ...updated[sIdx],
      services: currServices.filter((_, idx) => idx !== subIdx),
    };
    onChange(updated);
  };

  const updateSubService = (sIdx, subIdx, field, val) => {
    const updated = [...sections];
    const currServices = [...(updated[sIdx]?.services || [])];
    currServices[subIdx] = { ...currServices[subIdx], [field]: val };
    updated[sIdx] = { ...updated[sIdx], services: currServices };
    onChange(updated);
  };

  const moveSubService = (sIdx, subIdx, direction) => {
    const updated = [...sections];
    const currServices = [...(updated[sIdx]?.services || [])];
    if (
      (direction === -1 && subIdx === 0) ||
      (direction === 1 && subIdx === currServices.length - 1)
    ) return;
    const targetIdx = subIdx + direction;
    const temp = currServices[subIdx];
    currServices[subIdx] = currServices[targetIdx];
    currServices[targetIdx] = temp;
    // Sync order to array index so DB stays consistent
    updated[sIdx] = { ...updated[sIdx], services: currServices.map((s, i) => ({ ...s, order: i + 1 })) };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {sections.length === 0 && (
        <div className="p-6 text-center border-2 border-dashed border-border-neutral rounded-sm bg-surface-warm/40">
          <span className="material-symbols-outlined text-soft-grey text-3xl mb-1">dashboard_customize</span>
          <p className="text-sm font-medium text-graphite">No sections or sub-services added yet.</p>
          <p className="text-xs text-soft-grey mt-0.5">
            Add subheadings like "Residential Construction" and sub-services like "Villas", "Apartments" with images.
          </p>
          <button
            type="button"
            onClick={addSection}
            className="mt-3 px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-brand-blue text-white rounded-sm hover:bg-brand-blue-hover transition-colors font-display inline-flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[16px]">add</span> Add First Section
          </button>
        </div>
      )}

      {sections.map((section, sIdx) => (
        <div key={sIdx} className="border border-border-neutral rounded-sm bg-white overflow-hidden shadow-2xs">
          {/* Section Bar */}
          <div className="px-4 py-3 bg-surface-warm border-b border-border-neutral flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-graphite text-white rounded-xs font-mono">
                SECTION {String(sIdx + 1).padStart(2, '0')}
              </span>
              <span className="font-display font-bold text-xs uppercase tracking-wider text-graphite">
                {section.title || `Untitled Section ${sIdx + 1}`}
              </span>
              <span className="text-[11px] text-soft-grey">
                ({(section.services || []).length} sub-service{(section.services || []).length !== 1 ? 's' : ''})
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => moveSection(sIdx, -1)}
                disabled={sIdx === 0}
                className="p-1 text-soft-grey hover:text-graphite disabled:opacity-30 transition-colors"
                title="Move section up"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_upward</span>
              </button>
              <button
                type="button"
                onClick={() => moveSection(sIdx, 1)}
                disabled={sIdx === sections.length - 1}
                className="p-1 text-soft-grey hover:text-graphite disabled:opacity-30 transition-colors"
                title="Move section down"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_downward</span>
              </button>
              <button
                type="button"
                onClick={() => removeSection(sIdx)}
                className="p-1 text-soft-grey hover:text-red-500 transition-colors ml-2"
                title="Delete section"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Section Heading & Description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-graphite font-display">
                  Subheading / Section Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={section.title || ''}
                  onChange={(e) => updateSection(sIdx, 'title', e.target.value)}
                  placeholder="e.g. A. Residential Construction"
                  className="w-full px-3 py-2 text-xs bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-graphite font-display">
                  Section Scope / Short Description
                </label>
                <input
                  value={section.description || ''}
                  onChange={(e) => updateSection(sIdx, 'description', e.target.value)}
                  placeholder="e.g. End-to-end residential civil execution..."
                  className="w-full px-3 py-2 text-xs bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue"
                />
              </div>
            </div>

            {/* Sub-Services List */}
            <div className="pt-3 border-t border-[#F0EFEA] space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-brand-blue font-display flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">list_alt</span>
                  Sub-Services &amp; Modules
                </label>
                <button
                  type="button"
                  onClick={() => addSubService(sIdx)}
                  className="text-[10px] font-bold uppercase tracking-wider text-brand-blue border border-brand-blue/30 px-2.5 py-1 rounded-sm hover:bg-brand-blue/5 transition-colors font-display flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[13px]">add</span> Add Sub-Service
                </button>
              </div>

              {(section.services || []).length === 0 ? (
                <p className="text-xs text-soft-grey italic py-2">No sub-services in this section yet.</p>
              ) : (
                <div className="space-y-3">
                  {(section.services || []).map((sub, subIdx) => (
                    <div
                      key={subIdx}
                      className="p-3 border border-border-neutral rounded-sm bg-[#FAF9F6] space-y-3 relative group"
                    >
                      <div className="flex items-center justify-between border-b border-[#E5E3DC] pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-soft-grey font-mono">
                            SUB-SERVICE {sIdx + 1}.{subIdx + 1}
                          </span>
                          {/* isActive toggle — deactivates without deleting */}
                          <button
                            type="button"
                            onClick={() => updateSubService(sIdx, subIdx, 'isActive', !sub.isActive)}
                            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-xs border transition-colors font-mono ${
                              sub.isActive !== false
                                ? 'bg-brand-green/10 text-brand-green border-brand-green/25 hover:bg-brand-green/20'
                                : 'bg-surface-muted text-soft-grey border-border-neutral hover:bg-border-neutral'
                            }`}
                            title={sub.isActive !== false ? 'Click to hide this sub-service from the public page' : 'Click to show this sub-service on the public page'}
                          >
                            {sub.isActive !== false ? '● Active' : '○ Hidden'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSubService(sIdx, subIdx, -1)}
                            disabled={subIdx === 0}
                            className="p-0.5 text-soft-grey hover:text-graphite disabled:opacity-20"
                            title="Move up"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSubService(sIdx, subIdx, 1)}
                            disabled={subIdx === (section.services || []).length - 1}
                            className="p-0.5 text-soft-grey hover:text-graphite disabled:opacity-20"
                            title="Move down"
                          >
                            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeSubService(sIdx, subIdx)}
                            className="p-0.5 text-soft-grey hover:text-red-500 transition-colors ml-2"
                            title="Remove sub-service"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                        {/* Title & Description */}
                        <div className="sm:col-span-8 space-y-2">
                          <input
                            value={sub.title || ''}
                            onChange={(e) => updateSubService(sIdx, subIdx, 'title', e.target.value)}
                            placeholder="Sub-service title (e.g. Villas, Annual Maintenance Contract)"
                            className="w-full px-3 py-1.5 text-xs bg-white border border-border-neutral rounded-sm text-graphite font-bold outline-none focus:border-brand-blue"
                          />
                          <textarea
                            value={sub.description || ''}
                            onChange={(e) => updateSubService(sIdx, subIdx, 'description', e.target.value)}
                            rows={2}
                            placeholder="Short description of this sub-service..."
                            className="w-full px-3 py-1.5 text-xs bg-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue resize-y"
                          />
                        </div>

                        {/* Image preview & selector */}
                        <div className="sm:col-span-4 space-y-1.5">
                          <div className="relative aspect-video w-full rounded-sm overflow-hidden border border-border-neutral bg-neutral-100 flex items-center justify-center">
                            {sub.image ? (
                              <img src={sub.image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] text-soft-grey font-mono">No Image</span>
                            )}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              value={sub.image || ''}
                              onChange={(e) => updateSubService(sIdx, subIdx, 'image', e.target.value)}
                              placeholder="Image URL or choose..."
                              className="w-full px-2 py-1 text-[11px] bg-white border border-border-neutral rounded-sm text-graphite font-mono outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => onPickImage(sIdx, subIdx)}
                              className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-brand-blue text-white rounded-sm hover:bg-brand-blue-hover transition-colors shrink-0 font-display"
                            >
                              Browse
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {sections.length > 0 && (
        <button
          type="button"
          onClick={addSection}
          className="w-full py-2.5 border-2 border-dashed border-border-neutral hover:border-brand-blue rounded-sm text-xs font-bold uppercase tracking-wider text-graphite hover:text-brand-blue transition-colors font-display flex items-center justify-center gap-1.5 bg-white"
        >
          <span className="material-symbols-outlined text-[16px]">add</span> Add Another Section / Subheading
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SERVICE EDITOR
// ═══════════════════════════════════════════════════════════════
const EMPTY_FORM = {
  title: '',
  slug: '',
  order: 0,
  category: 'construction',

  description: '',
  shortDescription: '',

  image: '',
  gallery: [],
  benefits: [],
  features: [],

  
  sections: [],

  priceNote: '',
  legalNote: '',
  isActive: true,
};

const ServiceEditor = ({ serviceId, onBack, onSaved }) => {
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);
  const [loading,       setLoading]       = useState(!!serviceId);
  const [saving,        setSaving]        = useState(false);
  const [errors,        setErrors]        = useState({});
  const [apiError,      setApiError]      = useState('');
  const [conflict,      setConflict]      = useState(null); // 409 data
  const [pickerTarget,  setPickerTarget]  = useState(null); // 'cover' | 'gallery' | {type:'subservice', sIdx, subIdx}
  const [slugManual,    setSlugManual]    = useState(false);

  // ── Load existing service ────────────────────────────────────
  useEffect(() => {
    if (!serviceId) return;
    (async () => {
      try {
        const res = await adminApi.get(`${API}/services/id/${serviceId}`);
        const d = res.data.data;
        setForm({
          title: d.title || '', slug: d.slug || '',
          category: d.category || 'construction',
          description: d.description || '', shortDescription: d.shortDescription || '',
          benefits: d.benefits || [], features: d.features || [],
          image: d.image || '', gallery: d.gallery || [],
          priceNote: d.priceNote || '', legalNote: d.legalNote || '',
          isActive: d.isActive ?? true,
          sections: d.sections || [],

        });
        setLastUpdatedAt(d.updatedAt);
        setSlugManual(true); // existing slug — don't auto-generate
      } catch (err) {
        setApiError('Failed to load service. Please go back and try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [serviceId]);

  const set = (field, val) => setForm(prev => ({ ...prev, [field]: val }));

  // Auto-generate slug from title (only for new services, until user edits slug manually)
  const handleTitleChange = (val) => {
    set('title', val);
    if (!slugManual) set('slug', toSlug(val));
  };

  // ── Validate ─────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.title.trim())       e.title       = 'Title is required.';
    if (!form.slug.trim())        e.slug        = 'Slug is required.';
    if (!form.description.trim()) e.description = 'Description is required.';
    if (!form.category)           e.category    = 'Category is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    setApiError('');
    setConflict(null);

    const payload = { ...form };
    if (lastUpdatedAt) payload.lastKnownUpdatedAt = lastUpdatedAt;

    try {
      let res;
      if (serviceId) {
        res = await adminApi.put(`${API}/services/${serviceId}`, payload);
      } else {
        res = await adminApi.post(`${API}/services`, payload);
      }
      setLastUpdatedAt(res.data.data.updatedAt);
      onSaved(res.data.data, !serviceId);
    } catch (err) {
      if (err.response?.status === 409) {
        // Concurrent-edit conflict — show clear message, never silently overwrite
        setConflict({
          message: err.response.data.error || 'This record was modified by another user.',
          serverUpdatedAt: err.response.data.updatedAt,
        });
      } else {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Save failed. Please try again.';
        setApiError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  // Force-reload fresh data after 409
  const handleReloadAfterConflict = async () => {
    setConflict(null);
    setLoading(true);
    try {
      const res = await adminApi.get(`${API}/services/id/${serviceId}`);
      const d = res.data.data;
      setForm({
        title: d.title || '', slug: d.slug || '', category: d.category || 'construction',
        description: d.description || '', shortDescription: d.shortDescription || '',
        benefits: d.benefits || [], features: d.features || [],
        image: d.image || '', gallery: d.gallery || [],
        priceNote: d.priceNote || '', legalNote: d.legalNote || '',
        sections: d.sections || [],
        isActive: d.isActive ?? true,

      });
      setLastUpdatedAt(d.updatedAt);
    } catch { setApiError('Reload failed.'); }
    finally  { setLoading(false); }
  };

  // ── Media picker callbacks ────────────────────────────────────
  const handleMediaSelect = (asset) => {
    if (pickerTarget === 'cover') {
      set('image', asset.url);
    } else if (pickerTarget === 'gallery') {
      set('gallery', [...(form.gallery || []), asset.url]);
    } else if (pickerTarget && pickerTarget.type === 'subservice') {
      // Update a specific sub-service image
      const { sIdx, subIdx } = pickerTarget;
      const updatedSections = [...(form.sections || [])];
      const currServices = [...(updatedSections[sIdx]?.services || [])];
      currServices[subIdx] = { ...currServices[subIdx], image: asset.url };
      updatedSections[sIdx] = { ...updatedSections[sIdx], services: currServices };
      set('sections', updatedSections);
    }
    setPickerTarget(null);
  };

  const removeGalleryImage = (idx) =>
    set('gallery', form.gallery.filter((_, i) => i !== idx));

  const handlePickSubServiceImage = (sIdx, subIdx) => {
    setPickerTarget({ type: 'subservice', sIdx, subIdx });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-soft-grey gap-2 text-sm">
        <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
        Loading service...
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-24">

      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border-neutral pb-5">
        <button onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-sm border border-border-neutral text-soft-grey hover:border-graphite hover:text-graphite transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        </button>
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">
            {serviceId ? 'Edit Service' : 'Create Service'}
          </h1>
          <p className="text-sm text-soft-grey mt-0.5">
            {serviceId ? `Editing slug: ${form.slug}` : 'New service — fill in the required fields below.'}
          </p>
        </div>
      </div>

      {/* 409 Conflict banner */}
      {conflict && (
        <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-sm text-sm text-amber-800">
          <span className="material-symbols-outlined text-[20px] shrink-0 mt-0.5">warning</span>
          <div>
            <p className="font-semibold">{conflict.message}</p>
            <p className="text-xs mt-1">Last modified: {new Date(conflict.serverUpdatedAt).toLocaleString()}</p>
            <div className="flex gap-3 mt-2">
              <button onClick={handleReloadAfterConflict}
                className="text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-300 px-3 py-1.5 rounded-sm hover:bg-amber-100 transition-colors font-display">
                Reload Latest Version
              </button>
              <span className="text-xs text-amber-600 self-center">(Your changes have not been saved)</span>
            </div>
          </div>
        </div>
      )}

      {/* General API error */}
      {apiError && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {apiError}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6 max-w-5xl">

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column: main fields ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Basic Information */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Basic Information</h2>
              </div>
              <div className="p-5 space-y-5">

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input value={form.title} onChange={e => handleTitleChange(e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors ${errors.title ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="e.g. Civil Construction" />
                  {errors.title && <p className="text-xs text-red-500">{errors.title}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input value={form.slug}
                    onChange={e => { setSlugManual(true); set('slug', toSlug(e.target.value)); }}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite font-mono outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors ${errors.slug ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="auto-generated-from-title" />
                  {errors.slug && <p className="text-xs text-red-500">{errors.slug}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Short Description</label>
                  <input value={form.shortDescription} onChange={e => set('shortDescription', e.target.value)}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
                    placeholder="One-line summary for cards and previews" />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
                    Full Description <span className="text-red-500">*</span>
                  </label>
                  <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={5}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors resize-y ${errors.description ? 'border-red-400' : 'border-border-neutral'}`}
                    placeholder="Detailed service description..." />
                  {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                </div>

              </div>
            </section>

            {/* ── Service Sections & Sub-Services ── */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm flex items-center justify-between">
                <div>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Service Sections &amp; Sub-Services</h2>
                  <p className="text-[11px] text-soft-grey mt-0.5">Add subheadings (e.g. "A. Residential Construction") and their child modules (e.g. "Villas", "Apartments").</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-bold text-brand-blue border border-brand-blue/30 rounded-xs font-mono">
                  {(form.sections || []).length} SECTION{(form.sections || []).length !== 1 ? 'S' : ''}
                </span>
              </div>
              <div className="p-5">
                <SectionsEditor
                  sections={form.sections || []}
                  onChange={v => set('sections', v)}
                  onPickImage={handlePickSubServiceImage}
                />
              </div>
            </section>

            {/* Benefits */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Key Benefits</h2>
              </div>
              <div className="p-5">
                <StringListEditor label="Benefits" placeholder="e.g. ISO-certified processes"
                  items={form.benefits} onChange={v => set('benefits', v)} />
              </div>
            </section>

            {/* Features */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Features</h2>
              </div>
              <div className="p-5">
                <StringListEditor label="Features" placeholder="e.g. 24/7 site supervision"
                  items={form.features} onChange={v => set('features', v)} />
              </div>
            </section>

            {/* Pricing & Legal */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Pricing &amp; Legal</h2>
              </div>
              <div className="p-5 space-y-5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Price Note</label>
                  <textarea value={form.priceNote} onChange={e => set('priceNote', e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors resize-y"
                    placeholder="e.g. Pricing based on project scope. Contact for estimate." />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">Legal Terms</label>
                  <textarea value={form.legalNote} onChange={e => set('legalNote', e.target.value)} rows={2}
                    className="w-full px-3 py-2.5 text-sm bg-surface-white border border-border-neutral rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors resize-y"
                    placeholder="e.g. Subject to site assessment. T&amp;C apply." />
                </div>
              </div>
            </section>

          </div>

          {/* ── Right column: sidebar settings + images ── */}
          <div className="space-y-6">

            {/* Settings */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Settings</h2>
              </div>
              <div className="p-5 space-y-4">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select value={form.category} onChange={e => set('category', e.target.value)}
                    className={`w-full px-3 py-2.5 text-sm bg-surface-white border rounded-sm text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors appearance-none cursor-pointer ${errors.category ? 'border-red-400' : 'border-border-neutral'}`}>
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>{CATEGORY_LABELS[c] || c}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Active / Visible</label>
                  <button type="button" onClick={() => set('isActive', !form.isActive)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${form.isActive ? 'bg-brand-green' : 'bg-border-neutral'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              </div>
            </section>

            {/* Cover Image */}
            <section className="bg-white border border-border-neutral rounded-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm">
                <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">Cover Image</h2>
              </div>
              <div className="p-5">
                {form.image ? (
                  <div className="space-y-2">
                    <img src={form.image} alt="Cover" className="w-full aspect-video object-cover rounded-sm border border-border-neutral" />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPickerTarget('cover')}
                        className="text-xs font-bold text-brand-blue font-display hover:underline">Change</button>
                      <button type="button" onClick={() => set('image', '')}
                        className="text-xs font-bold text-soft-grey font-display hover:text-red-500 transition-colors">Remove</button>
                    </div>
                  </div>
                ) : (
                  <button type="button" onClick={() => setPickerTarget('cover')}
                    className="w-full aspect-video border-2 border-dashed border-border-neutral rounded-sm flex flex-col items-center justify-center gap-1 hover:border-brand-blue transition-colors group">
                    <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue transition-colors text-[28px]">add_photo_alternate</span>
                    <span className="text-xs text-soft-grey group-hover:text-brand-blue transition-colors font-display font-bold uppercase tracking-wider">Select Cover</span>
                  </button>
                )}
              </div>
            </section>

            {/* Gallery */}
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
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-neutral">
          <button type="button" onClick={onBack}
            className="px-5 py-2.5 text-sm font-bold uppercase tracking-wider text-soft-grey hover:text-graphite transition-colors font-display">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="px-6 py-2.5 bg-brand-blue text-white text-sm font-bold uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors disabled:opacity-60 font-display flex items-center gap-2">
            {saving
              ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving...</>
              : serviceId ? 'Save Changes' : 'Create Service'}
          </button>
        </div>

      </form>

      {/* Media Picker modal */}
      {pickerTarget && (
        <MediaPicker onSelect={handleMediaSelect} onClose={() => setPickerTarget(null)} />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// SERVICES LIST
// ═══════════════════════════════════════════════════════════════
const ServicesList = ({ onCreate, onEdit }) => {
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [search,   setSearch]   = useState('');
  const searchTimer = useRef(null);

  const fetchServices = useCallback(async (pageNum = 1, q = search) => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pageNum, limit: 20 };
      if (q.trim()) params.search = q.trim();
      const res = await adminApi.get(`${API}/services/admin`, { params });
      // Envelope: { items, total, page, pages }
      setServices(res.data.items);
      setTotal(res.data.total);
      setPage(res.data.page);
      setPages(res.data.pages);
    } catch (err) {
      setError('Failed to load services. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { fetchServices(1); }, []);

  const handleSearchChange = (val) => {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => fetchServices(1, val), 350);
  };

  const handleToggleActive = async (svc) => {
    try {
      if (svc.isActive) {
        await adminApi.delete(`${API}/services/${svc._id}`);
      } else {
        await adminApi.patch(`${API}/services/${svc._id}/activate`, {});
      }
      fetchServices(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed.');
    }
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Services</h1>
          <p className="text-sm text-soft-grey mt-1">
            {total} service{total !== 1 ? 's' : ''} total
          </p>
        </div>
        <button onClick={onCreate}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-4 py-2 rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px]">add</span>
          New Service
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-[16px] text-soft-grey">search</span>
        <input value={search} onChange={e => handleSearchChange(e.target.value)}
          className="w-full pl-9 pr-3 py-2 text-sm border border-border-neutral rounded-sm bg-white text-graphite outline-none focus:border-brand-blue focus:ring-1 focus:ring-brand-blue transition-colors"
          placeholder="Search services..." />
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
            <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            Loading...
          </div>
        ) : services.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-soft-grey gap-1">
            <span className="material-symbols-outlined text-[28px]">category</span>
            <p className="text-sm">No services found.{search && ' Try clearing the search.'}</p>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="border-b border-border-neutral bg-surface-warm">
              <tr>
                {['Service Title', 'Category', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`py-3 px-5 text-xs font-bold uppercase tracking-wider text-soft-grey font-display ${h === 'Actions' ? 'text-right' : ''}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-neutral">
              {services.map(svc => (
                <tr key={svc._id} className="hover:bg-surface-warm transition-colors">
                  <td className="py-3.5 px-5">
                    <span className="font-semibold text-graphite block">{svc.title}</span>
                    <span className="text-xs text-soft-grey font-mono">{svc.slug}</span>
                  </td>
                  <td className="py-3.5 px-5 text-soft-grey capitalize">{svc.category}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wide ${svc.isActive ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-surface-muted text-soft-grey border border-border-neutral'}`}>
                      {svc.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button onClick={() => onEdit(svc._id)}
                        className="text-brand-blue hover:text-brand-blue-hover font-display text-xs font-bold uppercase tracking-wider">
                        Edit
                      </button>
                      <button onClick={() => handleToggleActive(svc)}
                        className="text-soft-grey hover:text-graphite font-display text-xs font-bold uppercase tracking-wider">
                        {svc.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-soft-grey">Page {page} of {pages}</span>
          <div className="flex gap-2">
            <button onClick={() => fetchServices(page - 1)} disabled={page <= 1 || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display disabled:opacity-40">
              Prev
            </button>
            <button onClick={() => fetchServices(page + 1)} disabled={page >= pages || loading}
              className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue hover:text-brand-blue transition-colors font-display disabled:opacity-40">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ROOT — manages list ↔ editor navigation
// ═══════════════════════════════════════════════════════════════
const AdminServices = () => {
  const [view,      setView]      = useState('list'); // 'list' | 'editor'
  const [editingId, setEditingId] = useState(null);
  const [flashMsg,  setFlashMsg]  = useState('');

  const showFlash = (msg) => {
    setFlashMsg(msg);
    setTimeout(() => setFlashMsg(''), 3000);
  };

  const handleCreate = () => { setEditingId(null); setView('editor'); };
  const handleEdit   = (id) => { setEditingId(id);   setView('editor'); };
  const handleBack   = () => { setEditingId(null);  setView('list'); };

  const handleSaved  = (data, isNew) => {
    showFlash(isNew ? `Service "${data.title}" created.` : `Service "${data.title}" saved.`);
    setView('list');
    setEditingId(null);
  };

  return (
    <div className="w-full">
      {flashMsg && (
        <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-brand-green/10 border border-brand-green/20 rounded-sm text-sm text-brand-green font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>
          {flashMsg}
        </div>
      )}

      {view === 'list' && (
        <ServicesList onCreate={handleCreate} onEdit={handleEdit} />
      )}
      {view === 'editor' && (
        <ServiceEditor serviceId={editingId} onBack={handleBack} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default AdminServices;
