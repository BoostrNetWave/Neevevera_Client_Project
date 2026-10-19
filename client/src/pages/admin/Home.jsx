import React, { useState, useEffect, useRef } from 'react';
import adminApi from '../../utils/adminApi';
import MediaLibrary from '../../components/admin/MediaLibrary';

const API = '';

// ── Inline MediaPicker ─────────────────────────────────────────
const MediaPicker = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 z-50 bg-graphite/60 flex items-center justify-center p-6">
    <div className="bg-white rounded-sm w-full max-w-5xl h-[75vh] flex flex-col overflow-hidden border border-border-neutral shadow-xl">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-neutral bg-surface-warm shrink-0">
        <h3 className="font-display font-bold text-sm uppercase tracking-wider text-graphite">Select Image</h3>
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

// ── Helper: Section Wrapper ────────────────────────────────────
const Section = ({ title, icon, children }) => (
  <div className="bg-white border border-border-neutral rounded-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-border-neutral bg-surface-warm flex items-center gap-2">
      <span className="material-symbols-outlined text-[18px] text-soft-grey">{icon}</span>
      <h2 className="text-xs font-bold uppercase tracking-wider text-graphite font-display">{title}</h2>
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, required, children }) => (
  <div className="space-y-1">
    <label className="block text-xs font-bold uppercase tracking-wider text-graphite font-display">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

const Input = (props) => (
  <input {...props} className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue bg-white" />
);

const Textarea = (props) => (
  <textarea {...props} className="w-full px-3 py-2.5 text-sm border border-border-neutral rounded-sm outline-none focus:border-brand-blue resize-y bg-white" />
);

// ── Main Component ─────────────────────────────────────────────
const AdminHome = () => {
  const [form, setForm] = useState(null);
  const [allServices, setAllServices] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState('');
  const [error, setError] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);

  const DEFAULT = {
    heroTitle: '', heroSubtitle: '', heroImage: '', heroCtaLabel: 'Explore Projects', heroCtaLink: '/projects',
    introHeadline: '', introBody: '',
    featuredServiceIds: [], featuredProjectIds: [],
    stats: [{ label: 'Projects Completed', value: '150', suffix: '+' }],
    whyChooseUsTitle: 'Why Choose Neevevera?',
    whyChooseUsPoints: [{ title: '', body: '', icon: '' }],
    ctaTitle: 'Ready to Build?', ctaBody: '', ctaButtonLabel: 'Contact Us', ctaButtonLink: '/contact',
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [homeRes, svcRes, projRes] = await Promise.all([
          adminApi.get(`${API}/home`).catch(() => ({ data: { data: null } })),
          adminApi.get(`${API}/services/admin`, { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
          adminApi.get(`${API}/projects`, { params: { limit: 100 } }).catch(() => ({ data: { items: [] } })),
        ]);
        const d = homeRes.data.data;
        setForm(d ? {
          heroTitle: d.heroTitle || '', heroSubtitle: d.heroSubtitle || '',
          heroImage: d.heroImage || '', heroCtaLabel: d.heroCtaLabel || 'Explore Projects',
          heroCtaLink: d.heroCtaLink || '/projects',
          introHeadline: d.introHeadline || '', introBody: d.introBody || '',
          featuredServiceIds: (d.featuredServiceIds || []).map(s => s._id || s),
          featuredProjectIds: (d.featuredProjectIds || []).map(p => p._id || p),
          stats: d.stats?.length ? d.stats : DEFAULT.stats,
          whyChooseUsTitle: d.whyChooseUsTitle || '',
          whyChooseUsPoints: d.whyChooseUsPoints?.length ? d.whyChooseUsPoints : DEFAULT.whyChooseUsPoints,
          ctaTitle: d.ctaTitle || '', ctaBody: d.ctaBody || '',
          ctaButtonLabel: d.ctaButtonLabel || 'Contact Us', ctaButtonLink: d.ctaButtonLink || '/contact',
        } : { ...DEFAULT });
        setAllServices(svcRes.data.items || []);
        setAllProjects(projRes.data.items || []);
      } catch (err) {
        setError('Failed to load home content.');
        setForm({ ...DEFAULT });
      } finally { setLoading(false); }
    };
    load();
  }, []);

  const set = (key, val) => setForm(p => ({ ...p, [key]: val }));

  // Stats helpers
  const setStat = (i, k, v) => {
    const next = [...form.stats];
    next[i] = { ...next[i], [k]: v };
    set('stats', next);
  };
  const addStat = () => set('stats', [...form.stats, { label: '', value: '', suffix: '' }]);
  const removeStat = (i) => set('stats', form.stats.filter((_, idx) => idx !== i));

  // Why-choose-us helpers
  const setPoint = (i, k, v) => {
    const next = [...form.whyChooseUsPoints];
    next[i] = { ...next[i], [k]: v };
    set('whyChooseUsPoints', next);
  };
  const addPoint = () => set('whyChooseUsPoints', [...form.whyChooseUsPoints, { title: '', body: '', icon: '' }]);
  const removePoint = (i) => set('whyChooseUsPoints', form.whyChooseUsPoints.filter((_, idx) => idx !== i));

  // Featured selections
  const toggleService = (id) => {
    const ids = form.featuredServiceIds;
    set('featuredServiceIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };
  const toggleProject = (id) => {
    const ids = form.featuredProjectIds;
    set('featuredProjectIds', ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await adminApi.put(`${API}/home`, form);
      setFlash('Home content saved successfully!');
      setTimeout(() => setFlash(''), 3500);
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed. Please try again.');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-soft-grey gap-2">
      <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
      <span className="text-sm">Loading home content...</span>
    </div>
  );

  return (
    <div className="w-full space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border-neutral pb-5">
        <div>
          <h1 className="font-display text-xl font-bold text-graphite uppercase tracking-tight">Home Content</h1>
          <p className="text-sm text-soft-grey mt-1">Manage the public homepage — hero, intro, featured items, stats, and CTA</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-5 py-2.5 rounded-sm hover:bg-brand-blue-hover disabled:opacity-60 font-display flex items-center gap-2">
          {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving…</> : <><span className="material-symbols-outlined text-[16px]">save</span>Save Changes</>}
        </button>
      </div>

      {flash && (
        <div className="flex items-center gap-2 px-4 py-3 bg-brand-green/10 border border-brand-green/20 rounded-sm text-sm text-brand-green font-semibold">
          <span className="material-symbols-outlined text-[18px]">check_circle</span>{flash}
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-sm text-sm text-red-700">
          <span className="material-symbols-outlined text-[18px]">error</span>{error}
        </div>
      )}

      {/* ── Hero Section ── */}
      <Section title="Hero Banner" icon="view_carousel">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Field label="Hero Title">
            <Input value={form.heroTitle} onChange={e => set('heroTitle', e.target.value)} placeholder="e.g. Building Tomorrow's India" />
          </Field>
          <Field label="Hero Subtitle">
            <Input value={form.heroSubtitle} onChange={e => set('heroSubtitle', e.target.value)} placeholder="e.g. Engineering excellence since 2010" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="CTA Button Label">
            <Input value={form.heroCtaLabel} onChange={e => set('heroCtaLabel', e.target.value)} placeholder="Explore Projects" />
          </Field>
          <Field label="CTA Button Link">
            <Input value={form.heroCtaLink} onChange={e => set('heroCtaLink', e.target.value)} placeholder="/projects" />
          </Field>
        </div>
        <Field label="Hero Background Image">
          {form.heroImage ? (
            <div className="relative group rounded-sm overflow-hidden border border-border-neutral">
              <img src={form.heroImage} alt="Hero" className="w-full h-40 object-cover" />
              <button type="button" onClick={() => setPickerOpen(true)}
                className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold uppercase transition-opacity">
                Change Image
              </button>
              <button type="button" onClick={() => set('heroImage', '')}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-red-600">
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setPickerOpen(true)}
              className="w-full h-32 border-2 border-dashed border-border-neutral rounded-sm flex flex-col items-center justify-center gap-2 hover:border-brand-blue transition-colors group">
              <span className="material-symbols-outlined text-soft-grey group-hover:text-brand-blue text-[28px]">add_photo_alternate</span>
              <span className="text-xs font-bold text-soft-grey group-hover:text-brand-blue uppercase">Select Hero Image</span>
            </button>
          )}
        </Field>
      </Section>

      {/* ── Company Intro ── */}
      <Section title="Company Introduction Strip" icon="info">
        <Field label="Headline">
          <Input value={form.introHeadline} onChange={e => set('introHeadline', e.target.value)} placeholder="e.g. Trusted Civil Engineering Since 2010" />
        </Field>
        <Field label="Body Text">
          <Textarea value={form.introBody} onChange={e => set('introBody', e.target.value)} rows={4} placeholder="Brief company introduction paragraph..." />
        </Field>
      </Section>

      {/* ── Company Stats ── */}
      <Section title="Company Statistics" icon="bar_chart">
        <div className="space-y-3">
          {form.stats.map((stat, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <Input value={stat.value} onChange={e => setStat(i, 'value', e.target.value)} placeholder="150" />
                <Input value={stat.suffix} onChange={e => setStat(i, 'suffix', e.target.value)} placeholder="+" />
                <Input value={stat.label} onChange={e => setStat(i, 'label', e.target.value)} placeholder="Projects Completed" />
              </div>
              <button onClick={() => removeStat(i)} className="text-red-400 hover:text-red-600">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
          <div className="text-[10px] text-soft-grey grid grid-cols-3 gap-3 pr-9">
            <span className="text-center">Value</span>
            <span className="text-center">Suffix (e.g. +, %)</span>
            <span className="text-center">Label</span>
          </div>
        </div>
        <button onClick={addStat} className="text-xs font-bold text-brand-blue hover:underline font-display flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Stat
        </button>
      </Section>

      {/* ── Why Choose Us ── */}
      <Section title="Why Choose Us" icon="verified">
        <Field label="Section Title">
          <Input value={form.whyChooseUsTitle} onChange={e => set('whyChooseUsTitle', e.target.value)} placeholder="Why Choose Neevevera?" />
        </Field>
        <div className="space-y-4 pt-1">
          {form.whyChooseUsPoints.map((pt, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-surface-warm rounded-sm border border-border-neutral">
              <div className="flex-1 grid grid-cols-3 gap-3">
                <Input value={pt.title} onChange={e => setPoint(i, 'title', e.target.value)} placeholder="Title" />
                <div className="col-span-2">
                  <Input value={pt.body} onChange={e => setPoint(i, 'body', e.target.value)} placeholder="Short description..." />
                </div>
              </div>
              <button onClick={() => removePoint(i)} className="text-red-400 hover:text-red-600 mt-2.5">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>
          ))}
        </div>
        <button onClick={addPoint} className="text-xs font-bold text-brand-blue hover:underline font-display flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">add_circle</span> Add Point
        </button>
      </Section>

      {/* ── Featured Services ── */}
      <Section title="Featured Services (select up to 6)" icon="home_repair_service">
        {allServices.length === 0 ? (
          <p className="text-sm text-soft-grey">No active services found. Add services first.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allServices.map(svc => {
              const selected = form.featuredServiceIds.includes(svc._id);
              return (
                <button key={svc._id} type="button" onClick={() => toggleService(svc._id)}
                  className={`text-left px-3 py-2.5 rounded-sm border text-sm transition-colors ${selected ? 'bg-brand-blue/10 border-brand-blue text-brand-blue font-semibold' : 'border-border-neutral text-graphite hover:border-brand-blue'}`}>
                  <span className="flex items-center gap-2">
                    {selected && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                    <span className="truncate">{svc.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── Featured Projects ── */}
      <Section title="Featured Projects (select up to 6)" icon="architecture">
        {allProjects.length === 0 ? (
          <p className="text-sm text-soft-grey">No projects found. Add projects first.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allProjects.map(proj => {
              const selected = form.featuredProjectIds.includes(proj._id);
              return (
                <button key={proj._id} type="button" onClick={() => toggleProject(proj._id)}
                  className={`text-left px-3 py-2.5 rounded-sm border text-sm transition-colors ${selected ? 'bg-brand-blue/10 border-brand-blue text-brand-blue font-semibold' : 'border-border-neutral text-graphite hover:border-brand-blue'}`}>
                  <span className="flex items-center gap-2">
                    {selected && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                    <span className="truncate">{proj.title}</span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Section>

      {/* ── CTA Section ── */}
      <Section title="Call-to-Action Section" icon="campaign">
        <div className="grid grid-cols-2 gap-4">
          <Field label="CTA Title">
            <Input value={form.ctaTitle} onChange={e => set('ctaTitle', e.target.value)} placeholder="Ready to Build?" />
          </Field>
          <Field label="Button Label">
            <Input value={form.ctaButtonLabel} onChange={e => set('ctaButtonLabel', e.target.value)} placeholder="Contact Us" />
          </Field>
        </div>
        <Field label="CTA Body Text">
          <Textarea value={form.ctaBody} onChange={e => set('ctaBody', e.target.value)} rows={3} placeholder="Compelling text encouraging visitors to get in touch..." />
        </Field>
        <Field label="Button Link">
          <Input value={form.ctaButtonLink} onChange={e => set('ctaButtonLink', e.target.value)} placeholder="/contact" />
        </Field>
      </Section>

      {/* Sticky save bar */}
      <div className="fixed bottom-0 left-60 right-0 bg-white border-t border-border-neutral px-8 py-4 flex items-center justify-between z-30">
        <p className="text-xs text-soft-grey">Changes are saved immediately to the live site.</p>
        <button onClick={handleSave} disabled={saving}
          className="text-xs font-bold uppercase tracking-wider bg-brand-blue text-white px-6 py-2.5 rounded-sm hover:bg-brand-blue-hover disabled:opacity-60 font-display flex items-center gap-2">
          {saving ? <><span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>Saving…</> : 'Save All Changes'}
        </button>
      </div>

      {pickerOpen && (
        <MediaPicker
          onSelect={asset => { set('heroImage', asset.url); setPickerOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminHome;
