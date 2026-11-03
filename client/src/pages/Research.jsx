import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import {
  FiBook, FiUsers, FiFileText, FiCheck, FiAlertCircle,
  FiLoader, FiChevronRight, FiUpload, FiExternalLink,
} from 'react-icons/fi'
import { useFormSubmit } from '../hooks/useFormSubmit'
import { registerResearcher, getApprovedResearchers } from '../services/researcher.api'
import api from '../services/api'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUALIFICATION_LABELS = {
  phd:       'Ph.D.',
  postdoc:   'Post-Doctoral',
  'mtech-me':'M.Tech / M.E.',
  'btech-be':'B.Tech / B.E.',
  msc:       'M.Sc.',
  other:     'Other',
}

const RESEARCH_DISCIPLINES = [
  'Foundation Engineering',
  'Marine & Coastal Structures',
  'Geotechnical Engineering',
  'Structural Analysis & FEM',
  'Sustainable Construction',
  'Concrete Technology',
  'BIM & Digital Twins',
  'Seismic Engineering',
  'Hydraulics & Hydrology',
  'Environmental Engineering',
  'Remote Sensing & GIS',
  'Construction Management',
]

const FOCUS_AREAS = [
  {
    icon: <FiBook size={22} />,
    title: 'Applied Research',
    desc: 'Collaborative field-level investigation into marine foundation performance, alluvial soil behaviour, and deep coastal RCC durability.',
  },
  {
    icon: <FiUsers size={22} />,
    title: 'Academic Partnerships',
    desc: 'Structured collaboration with IITs, NITs and State Technical Universities for thesis support, industry data and co-publications.',
  },
  {
    icon: <FiFileText size={22} />,
    title: 'Technical Documentation',
    desc: 'Joint production of IS-aligned design notes, project white papers and peer-reviewed research on Andaman & Odisha coastal construction.',
  },
]

const EMPTY_FORM = {
  name: '',
  email: '',
  phone: '',
  institution: '',
  designation: '',
  highestQualification: '',
  researchInterests: [],
  summary: '',
  publications: '',
  proposalUrl: '',
  isPublicListingConsented: false,
}

// ─── Sub-components ────────────────────────────────────────────────────────────

const ResearcherCard = ({ r }) => {
  const qualLabel = QUALIFICATION_LABELS[r.highestQualification] || r.highestQualification
  return (
    <div className="bg-white border border-border-neutral rounded-sm p-5 space-y-3 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-sm bg-brand-blue text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
          {r.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="font-display font-semibold text-graphite text-sm leading-tight">{r.name}</div>
          <div className="text-xs text-soft-grey">{r.designation}</div>
          <div className="text-xs text-brand-blue font-medium mt-0.5">{r.institution}</div>
        </div>
        <div className="ml-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-blue/8 text-brand-blue px-2 py-0.5 rounded-sm border border-brand-blue/20">
            {qualLabel}
          </span>
        </div>
      </div>
      {r.researchInterests?.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {r.researchInterests.slice(0, 4).map(d => (
            <span key={d} className="text-[10px] font-medium bg-surface-warm border border-border-neutral px-2 py-0.5 rounded-sm text-soft-grey">
              {d}
            </span>
          ))}
          {r.researchInterests.length > 4 && (
            <span className="text-[10px] text-soft-grey px-1">+{r.researchInterests.length - 4}</span>
          )}
        </div>
      )}
      {r.summary && (
        <p className="text-xs text-soft-grey leading-relaxed line-clamp-3">{r.summary}</p>
      )}
      {r.publications?.length > 0 && (
        <div className="text-[11px] text-soft-grey border-t border-border-neutral pt-2">
          <span className="font-semibold text-graphite">{r.publications.length}</span> publication{r.publications.length !== 1 ? 's' : ''} listed
        </div>
      )}
    </div>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────────

const Research = () => {
  const [form, setForm] = useState(EMPTY_FORM)
  const [disciplineInput, setDisciplineInput] = useState('')
  const [researchers, setResearchers] = useState([])
  const [dirPage, setDirPage] = useState(1)
  const [dirPages, setDirPages] = useState(1)
  const [dirTotal, setDirTotal] = useState(0)
  const [dirLoading, setDirLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('directory')
  const [uploadStatus, setUploadStatus] = useState('idle')
  const [uploadedUrl, setUploadedUrl] = useState('')

  const { submit: submitForm, status, errorMsg, successMsg, reset } = useFormSubmit(registerResearcher)

  const fetchDirectory = async (page = 1) => {
    setDirLoading(true)
    try {
      const data = await getApprovedResearchers({ page, limit: 12 })
      setResearchers(data.items || [])
      setDirPage(data.page || 1)
      setDirPages(data.pages || 1)
      setDirTotal(data.total || 0)
    } catch (_) {
      // silently fail
    } finally {
      setDirLoading(false)
    }
  }

  useEffect(() => { fetchDirectory(1) }, [])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const toggleDiscipline = (d) => {
    setForm(f => {
      const has = f.researchInterests.includes(d)
      return {
        ...f,
        researchInterests: has
          ? f.researchInterests.filter(x => x !== d)
          : [...f.researchInterests, d],
      }
    })
  }

  const addCustomDiscipline = () => {
    const val = disciplineInput.trim()
    if (val && !form.researchInterests.includes(val)) {
      setForm(f => ({ ...f, researchInterests: [...f.researchInterests, val] }))
    }
    setDisciplineInput('')
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      alert('File must be under 10 MB.')
      return
    }
    setUploadStatus('uploading')
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await api.post('/public-upload/research-proposal', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const url = res.data?.data?.secure_url || res.data?.url || ''
      setUploadedUrl(url)
      setForm(f => ({ ...f, proposalUrl: url }))
      setUploadStatus('done')
    } catch (err) {
      setUploadStatus('error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.researchInterests.length === 0) {
      alert('Please select at least one research discipline.')
      return
    }
    await submitForm({
      ...form,
      publications: form.publications
        ? form.publications.split('\n').map(p => p.trim()).filter(Boolean)
        : [],
    })
  }

  return (
    <>
      <Helmet>
        <title>Research & Development | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Neevevera R&D — collaborate with our civil engineering research division. Browse our approved researcher directory or register as a civil research scholar."
        />
      </Helmet>

      {/* HERO */}
      <section className="bg-[#07558F] text-white py-16 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-3 font-display">
            Neevevera · Research & Development
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4">
            Applied Civil Engineering Research
          </h1>
          <p className="text-sm md:text-base text-white/75 max-w-2xl leading-relaxed">
            We collaborate with scholars, institutions and independent researchers advancing
            marine foundation design, coastal RCC durability, geotechnical profiling, and
            sustainable construction in challenging coastal environments.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <button
              onClick={() => setActiveTab('apply')}
              className="px-5 py-2.5 bg-white text-brand-blue font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-white/90 transition-colors font-display"
            >
              Apply to Collaborate
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className="px-5 py-2.5 bg-white/10 border border-white/30 text-white font-bold text-sm uppercase tracking-wider rounded-sm hover:bg-white/20 transition-colors font-display"
            >
              Browse Directory
            </button>
          </div>
        </div>
      </section>

      {/* FOCUS AREAS */}
      <section className="bg-surface-warm py-12 px-6 lg:px-10 border-b border-border-neutral">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
          {FOCUS_AREAS.map(fa => (
            <div key={fa.title} className="bg-white border border-border-neutral rounded-sm p-5 space-y-2">
              <div className="text-brand-blue">{fa.icon}</div>
              <div className="font-display font-bold text-sm text-graphite uppercase tracking-tight">{fa.title}</div>
              <p className="text-xs text-soft-grey leading-relaxed">{fa.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* TABS */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10 py-10">
        <div className="flex items-center gap-1 border-b border-border-neutral mb-8">
          {[
            { id: 'directory', label: 'Researcher Directory' },
            { id: 'apply', label: 'Apply to Collaborate' },
          ].map(tab => (
            <button
              key={tab.id}
              id={`research-tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider font-display border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? 'border-brand-blue text-brand-blue'
                  : 'border-transparent text-soft-grey hover:text-graphite'
              }`}
            >
              {tab.label}
            </button>
          ))}
          {dirTotal > 0 && (
            <span className="ml-auto text-xs text-soft-grey pb-2">
              {dirTotal} researcher{dirTotal !== 1 ? 's' : ''} listed
            </span>
          )}
        </div>

        {/* DIRECTORY TAB */}
        {activeTab === 'directory' && (
          <div className="space-y-6">
            {dirLoading ? (
              <div className="flex items-center justify-center h-40 text-soft-grey gap-2 text-sm">
                <FiLoader className="animate-spin" size={16} /> Loading directory...
              </div>
            ) : researchers.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <FiUsers size={32} className="text-soft-grey mx-auto" />
                <p className="text-sm text-soft-grey">No approved researchers in the public directory yet.</p>
                <p className="text-xs text-soft-grey">Approved researchers who consent to public listing will appear here.</p>
                <button
                  onClick={() => setActiveTab('apply')}
                  className="mt-2 text-xs font-bold uppercase tracking-wider text-brand-blue hover:underline"
                >
                  Register your profile
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {researchers.map(r => <ResearcherCard key={r._id} r={r} />)}
                </div>
                {dirPages > 1 && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-soft-grey">Page {dirPage} of {dirPages}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => fetchDirectory(dirPage - 1)}
                        disabled={dirPage <= 1 || dirLoading}
                        className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display"
                      >
                        Prev
                      </button>
                      <button
                        onClick={() => fetchDirectory(dirPage + 1)}
                        disabled={dirPage >= dirPages || dirLoading}
                        className="text-xs font-bold uppercase tracking-wider text-soft-grey border border-border-neutral px-3 py-1.5 rounded-sm hover:border-brand-blue disabled:opacity-40 font-display"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* APPLY TAB */}
        {activeTab === 'apply' && (
          <div className="max-w-2xl mx-auto">
            {status === 'success' ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-14 h-14 rounded-full bg-brand-green/10 border border-brand-green/30 flex items-center justify-center mx-auto">
                  <FiCheck size={24} className="text-brand-green" />
                </div>
                <h2 className="font-display font-bold text-xl text-graphite">Application Submitted</h2>
                <p className="text-sm text-soft-grey max-w-sm mx-auto leading-relaxed">
                  {successMsg || 'Your researcher profile has been received. Our R&D technical committee will review it within 3 business days.'}
                </p>
                <button
                  onClick={reset}
                  className="text-xs font-bold uppercase tracking-wider text-brand-blue border border-brand-blue px-4 py-2 rounded-sm hover:bg-brand-blue hover:text-white transition-colors font-display"
                >
                  Submit Another Application
                </button>
              </div>
            ) : (
              <form id="researcher-registration-form" onSubmit={handleSubmit} className="space-y-6">

                <div className="p-4 bg-brand-blue/5 border border-brand-blue/20 rounded-sm text-xs text-soft-grey leading-relaxed">
                  <span className="font-bold text-brand-blue">Research Collaboration Programme</span>{' '}
                  Open to Ph.D. scholars, Post-Docs, M.Tech / M.E. researchers and senior field engineers
                  working in civil, marine, geotechnical or structural domains. All applications are reviewed
                  by our R&D technical committee.
                </div>

                {status === 'error' && (
                  <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-sm text-xs text-red-700">
                    <FiAlertCircle className="shrink-0 mt-0.5" size={14} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Personal */}
                <fieldset className="space-y-4">
                  <legend className="text-[11px] font-bold text-graphite uppercase tracking-wider border-b border-border-neutral pb-1 w-full">
                    Personal Information
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="r-name" className="block text-xs font-semibold text-graphite mb-1">Full Name *</label>
                      <input id="r-name" name="name" value={form.name} onChange={handleChange} required
                        placeholder="Dr. / Er. Full Name"
                        className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue" />
                    </div>
                    <div>
                      <label htmlFor="r-email" className="block text-xs font-semibold text-graphite mb-1">Email Address *</label>
                      <input id="r-email" name="email" type="email" value={form.email} onChange={handleChange} required
                        placeholder="academic or professional email"
                        className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue" />
                    </div>
                    <div>
                      <label htmlFor="r-phone" className="block text-xs font-semibold text-graphite mb-1">Phone Number *</label>
                      <input id="r-phone" name="phone" value={form.phone} onChange={handleChange} required
                        placeholder="+91 9XXXXXXXXX"
                        className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue" />
                    </div>
                    <div>
                      <label htmlFor="r-designation" className="block text-xs font-semibold text-graphite mb-1">Current Designation</label>
                      <input id="r-designation" name="designation" value={form.designation} onChange={handleChange}
                        placeholder="e.g. Research Scholar, Asst. Professor"
                        className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue" />
                    </div>
                  </div>
                </fieldset>

                {/* Academic */}
                <fieldset className="space-y-4">
                  <legend className="text-[11px] font-bold text-graphite uppercase tracking-wider border-b border-border-neutral pb-1 w-full">
                    Academic & Institutional Details
                  </legend>
                  <div>
                    <label htmlFor="r-institution" className="block text-xs font-semibold text-graphite mb-1">Institution / University *</label>
                    <input id="r-institution" name="institution" value={form.institution} onChange={handleChange} required
                      placeholder="e.g. IIT Bhubaneswar, NIT Rourkela, CUSAT"
                      className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue" />
                  </div>
                  <div>
                    <label htmlFor="r-qualification" className="block text-xs font-semibold text-graphite mb-1">Highest Qualification *</label>
                    <select id="r-qualification" name="highestQualification" value={form.highestQualification} onChange={handleChange} required
                      className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue bg-white">
                      <option value="">Select qualification...</option>
                      {Object.entries(QUALIFICATION_LABELS).map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                </fieldset>

                {/* Disciplines */}
                <fieldset className="space-y-3">
                  <legend className="text-[11px] font-bold text-graphite uppercase tracking-wider border-b border-border-neutral pb-1 w-full">
                    Research Disciplines *
                  </legend>
                  <p className="text-xs text-soft-grey">Select all that apply. Add your own if not listed.</p>
                  <div className="flex flex-wrap gap-2">
                    {RESEARCH_DISCIPLINES.map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDiscipline(d)}
                        className={`text-xs px-3 py-1.5 rounded-sm border font-medium transition-colors ${
                          form.researchInterests.includes(d)
                            ? 'bg-brand-blue text-white border-brand-blue'
                            : 'bg-white border-border-neutral text-soft-grey hover:border-brand-blue hover:text-brand-blue'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={disciplineInput}
                      onChange={e => setDisciplineInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomDiscipline())}
                      placeholder="Add custom discipline..."
                      className="flex-1 border border-border-neutral rounded-sm px-3 py-1.5 text-xs text-graphite focus:outline-none focus:border-brand-blue"
                    />
                    <button type="button" onClick={addCustomDiscipline}
                      className="text-xs font-bold px-3 py-1.5 border border-brand-blue text-brand-blue rounded-sm hover:bg-brand-blue hover:text-white transition-colors">
                      Add
                    </button>
                  </div>
                  {form.researchInterests.filter(x => !RESEARCH_DISCIPLINES.includes(x)).length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {form.researchInterests.filter(x => !RESEARCH_DISCIPLINES.includes(x)).map(x => (
                        <span key={x} className="text-xs bg-brand-green/10 border border-brand-green/30 text-brand-green px-2 py-0.5 rounded-sm flex items-center gap-1">
                          {x}
                          <button type="button"
                            onClick={() => setForm(f => ({ ...f, researchInterests: f.researchInterests.filter(d => d !== x) }))}
                            className="ml-1 leading-none hover:text-red-500">x</button>
                        </span>
                      ))}
                    </div>
                  )}
                </fieldset>

                {/* Research Overview */}
                <fieldset className="space-y-4">
                  <legend className="text-[11px] font-bold text-graphite uppercase tracking-wider border-b border-border-neutral pb-1 w-full">
                    Research Overview
                  </legend>
                  <div>
                    <label htmlFor="r-summary" className="block text-xs font-semibold text-graphite mb-1">Research Summary</label>
                    <textarea id="r-summary" name="summary" value={form.summary} onChange={handleChange}
                      rows={4} maxLength={3000}
                      placeholder="Briefly describe your current research, methodology and its relevance to civil / marine engineering..."
                      className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue resize-none" />
                    <div className="text-[10px] text-soft-grey mt-0.5 text-right">{form.summary.length}/3000</div>
                  </div>
                  <div>
                    <label htmlFor="r-publications" className="block text-xs font-semibold text-graphite mb-1">Key Publications (one per line)</label>
                    <textarea id="r-publications" name="publications" value={form.publications} onChange={handleChange}
                      rows={3}
                      placeholder="Authors, Title, Journal/Conference, Year (DOI if available)..."
                      className="w-full border border-border-neutral rounded-sm px-3 py-2 text-sm text-graphite focus:outline-none focus:border-brand-blue resize-none" />
                  </div>
                </fieldset>

                {/* Proposal Upload */}
                <fieldset className="space-y-3">
                  <legend className="text-[11px] font-bold text-graphite uppercase tracking-wider border-b border-border-neutral pb-1 w-full">
                    Research Proposal / CV (Optional)
                  </legend>
                  <p className="text-xs text-soft-grey">Upload a PDF or Word document (max 10 MB). Reviewed only by the R&D committee.</p>
                  {uploadStatus === 'done' && uploadedUrl ? (
                    <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-sm text-xs text-brand-green">
                      <FiCheck size={14} />
                      <span>File uploaded successfully.</span>
                      <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 text-brand-blue hover:underline">
                        <FiExternalLink size={12} /> View
                      </a>
                    </div>
                  ) : (
                    <label htmlFor="r-proposal-upload"
                      className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-sm p-6 cursor-pointer transition-colors ${
                        uploadStatus === 'uploading' ? 'border-brand-blue/50 bg-brand-blue/5' : 'border-border-neutral hover:border-brand-blue bg-surface-warm'
                      }`}>
                      {uploadStatus === 'uploading' ? (
                        <FiLoader className="animate-spin text-brand-blue" size={20} />
                      ) : (
                        <FiUpload size={20} className="text-soft-grey" />
                      )}
                      <span className="text-xs text-soft-grey">
                        {uploadStatus === 'uploading' ? 'Uploading...' : 'Click to upload PDF or DOCX'}
                      </span>
                      {uploadStatus === 'error' && (
                        <span className="text-xs text-red-600">Upload failed. Please try again.</span>
                      )}
                      <input id="r-proposal-upload" type="file" accept=".pdf,.doc,.docx"
                        onChange={handleFileUpload} disabled={uploadStatus === 'uploading'} className="sr-only" />
                    </label>
                  )}
                </fieldset>

                {/* Consent */}
                <fieldset className="space-y-3">
                  <legend className="text-[11px] font-bold text-graphite uppercase tracking-wider border-b border-border-neutral pb-1 w-full">
                    Consent
                  </legend>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input id="r-consent" type="checkbox" name="isPublicListingConsented"
                      checked={form.isPublicListingConsented} onChange={handleChange} className="mt-0.5 accent-brand-blue" />
                    <span className="text-xs text-soft-grey leading-relaxed">
                      I consent to my name, institution, designation, research disciplines and summary being listed
                      in Neevevera's public researcher directory after approval. Contact details will remain masked.
                    </span>
                  </label>
                  <p className="text-[11px] text-soft-grey">
                    Your data is handled under our <Link to="/privacy" className="text-brand-blue hover:underline">Privacy Policy</Link>.
                  </p>
                </fieldset>

                {/* Submit */}
                <button id="researcher-submit-btn" type="submit" disabled={status === 'loading'}
                  className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover disabled:opacity-60 text-white text-sm font-bold uppercase tracking-wider rounded-sm transition-colors font-display flex items-center justify-center gap-2">
                  {status === 'loading' ? (
                    <><FiLoader className="animate-spin" size={16} /> Submitting...</>
                  ) : (
                    <>Submit Research Application <FiChevronRight size={16} /></>
                  )}
                </button>
              </form>
            )}
          </div>
        )}
      </section>

      {/* R&D INSIGHTS CALLOUT */}
      <section className="bg-surface-warm border-t border-border-neutral py-10 px-6 lg:px-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-bold text-graphite uppercase tracking-wider mb-1">Research Articles & Insights</div>
            <p className="text-sm text-soft-grey">Explore technical articles, white papers and R&D publications in our Insights journal.</p>
          </div>
          <Link to="/insights"
            className="shrink-0 px-5 py-2.5 bg-brand-blue text-white font-bold text-xs uppercase tracking-wider rounded-sm hover:bg-brand-blue-hover transition-colors font-display flex items-center gap-2">
            Browse Insights <FiChevronRight size={14} />
          </Link>
        </div>
      </section>
    </>
  )
}

export default Research
