import React, { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheck, FiAnchor, FiFileText, FiShield, FiUsers, FiTruck, FiTool, FiAlertCircle, FiLoader } from 'react-icons/fi'
import { useFormSubmit } from '../hooks/useFormSubmit'
import { registerVendor } from '../services/vendor.api'


const disciplines = [
  {
    num: '01',
    title: 'Civil & Marine Contractors',
    desc: 'Deep foundation piling, coastal breakwaters, riverine culverts, and monolithic RCC superstructures across tidal and alluvial zone conditions.',
    tags: ['IS 456 Compliant', 'Marine Grade', 'PWD Registered'],
    icon: <FiAnchor size={18} />,
  },
  {
    num: '02',
    title: 'Chartered Specialists & Surveyors',
    desc: 'Geodetic bathymetry, sub-surface geotechnical profiling, littoral sonar contouring, and BIM LOD 400 structural detailing services.',
    tags: ['FIE Chartered', 'NABL Traceable', 'GPS Geodetic'],
    icon: <FiFileText size={18} />,
  },
  {
    num: '03',
    title: 'Specialized Trade Cadres',
    desc: 'Precision Mivan/Doka formwork carpentry, heavy BBS rebar fabrication master crews, and industrial plant alignment mistries.',
    tags: ['Formwork Certified', 'Rebar BBS', 'Mivan Specialists'],
    icon: <FiTool size={18} />,
  },
  {
    num: '04',
    title: 'Approved Material Stockists',
    desc: 'Fe 550D primary TMT rebar, high-grade RMC batches, sulfate-resisting marine cement, and structural ISMC/ISMB channels.',
    tags: ['GSTIN Verified', 'IS 1786 Certified', 'Batch Records'],
    icon: <FiShield size={18} />,
  },
  {
    num: '05',
    title: 'Skilled Labour & Manpower',
    desc: 'ESIC/EPFO enrolled skilled artisans, mason supervisors, bar benders, and EHS-inducted general construction labour.',
    tags: ['WC Policy', 'ESIC Enrolled', 'EHS Inducted'],
    icon: <FiUsers size={18} />,
  },
  {
    num: '06',
    title: 'Plant & Logistics Fleet',
    desc: 'High-reach concrete boom pumps, transit mixers, 32T tipper mobilization, hydraulic breakers, and island barge transit.',
    tags: ['Pollution NOC', 'RC Verified', 'Island Capable'],
    icon: <FiTruck size={18} />,
  },
]

const testimonials = [
  {
    quote: "Neevevera's procurement desk enabled consistent material supply without delays across our 4.2 km viaduct corridor. Their rebar sourcing and QC audit trails set a new benchmark for institutional contractors.",
    name: 'Er. Suresh Mohanty',
    role: 'Project Director — State Highway Authority, Odisha',
    initial: 'SM',
    accent: '#07558F',
  },
  {
    quote: 'Joining the empanelment network gave our firm priority access to continuous BOQs and prompt RTGS settlements. The 72-hour invoice reconciliation is genuinely delivered — not just promised.',
    name: 'Rajendra Contractors Pvt. Ltd.',
    role: 'Civil & Marine Subcontractor — Port Blair',
    initial: 'RC',
    accent: '#075638',
  },
  {
    quote: 'The statutory KYC process was thorough but efficient. Our Workmen Compensation and labour licensing was verified in under 48 hours, and we received our first indent within a week.',
    name: 'V.K. Rebar Fabricators',
    role: 'Approved Material Stockist — Bhubaneswar',
    initial: 'VK',
    accent: '#B9923B',
  },
]



// ... existing code down to Vendors component ...
const Vendors = () => {
  const { submit, status, errorMsg, reset } = useFormSubmit(registerVendor)
  const [formData, setFormData] = useState({
    companyName: '', gstin: '', pan: '', tradeType: '', region: '', contactPerson: '', phone: '', email: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Map dropdown strings to backend enums
    const tradeMap = {
      'Civil & Marine Contractor': 'civil-construction',
      'Chartered Specialist / Surveyor': 'survey-testing',
      'Specialized Trade Cadre': 'other',
      'Approved Material Stockist': 'other',
      'Skilled Labour & Manpower': 'other',
      'Plant & Logistics Fleet': 'transport-logistics'
    }
    
    const regionMap = {
      'Odisha Corridor (Primary)': 'odisha',
      'Andaman & Nicobar Islands': 'andaman',
      'Kolkata & West Bengal Zone': 'bengal',
      'Pan-India / Multi-Region': 'pan-india'
    }

    const payload = {
      companyName: formData.companyName,
      contactPerson: formData.contactPerson,
      email: formData.email,
      phone: formData.phone,
      gstNumber: formData.gstin,
      panNumber: formData.pan,
      tradeCategory: tradeMap[formData.tradeType] || 'other',
      tradeSubCategory: formData.tradeType,
      regionsServed: regionMap[formData.region] ? [regionMap[formData.region]] : ['other'],
      // Defaults for fields not present in the current UI design
      pinCode: 'N/A',
      city: 'N/A',
      state: 'N/A',
      message: `Registered via portal. Trade: ${formData.tradeType}, Region: ${formData.region}`,
    }
    
    await submit(payload)
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>Vendor Enrolment & Empanelment | Neevevera</title>
        <meta name="description" content="Register your enterprise with Neevevera's regional procurement directory. Open to civil contractors, material stockists, and specialized trade cadres." />
      </Helmet>

      {/* ── PAGE HEADER ── */}
      <section className="border-b border-[#D8D8D2] pt-14 pb-14 bg-gradient-to-b from-[#F2EFE9]/60 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <nav className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#6B6B67] mb-6">
            <Link to="/" className="hover:text-[#07558F] transition-colors">Home</Link>
            <span className="text-[#D8D8D2]">/</span>
            <span className="text-[#07558F]">Resource & Vendor Network</span>
          </nav>
          <div className="max-w-4xl">
            <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-3">Procurement & Specialized Trade Architecture</span>
            <h1 className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[52px] text-[#111822] tracking-tight leading-[1.1] mb-5">
              Resource & Vendor Network
            </h1>
            <p className="text-lg text-[#444440] leading-relaxed max-w-3xl">
              A curated empanelment of skilled trade cadres, engineering specialists, and certified material stockists across Eastern India and coastal island corridors.
            </p>
          </div>
        </div>
      </section>

      {/* ── MANIFESTO / HERO SPLIT ── */}
      <section className="py-20 border-b border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">

            {/* Left Image */}
            <div className="lg:col-span-7">
              <div className="relative w-full aspect-[4/3] overflow-hidden rounded-sm bg-[#D8D8D2] shadow-sm">
                <img
                  alt="Precision structural rebar inspection and deep foundation works"
                  src="https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=1200"
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111822]/80 via-[#111822]/30 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-6 text-white">
                  <span className="text-[11px] uppercase tracking-widest text-[#B9923B] font-bold block mb-1">On-Site Rigor // Quality Verification</span>
                  <p className="text-sm text-white/90">Saline-grade pile cap shuttering & geodetic baseline calibration at coastal marine jobsites.</p>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-[#6B6B67] font-bold uppercase tracking-wider">
                <span>FIG 01.1 — Structural Frame Cadre Verification</span>
                <span className="text-[#075638]">ISO 9001:2015 Audited</span>
              </div>
            </div>

            {/* Right Editorial */}
            <div className="lg:col-span-5 flex flex-col justify-center space-y-8 lg:pt-2">
              <div>
                <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-2">Institutional Charter</span>
                <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#111822] tracking-tight mb-4">
                  Institutional Operating Standards
                </h2>
                <p className="text-base text-[#444440] leading-relaxed">
                  We bridge regional trade capability with institutional contract discipline, eliminating payment bottlenecks, safety compromises, and fragmented island logistics.
                </p>
              </div>

              <div className="space-y-6 pt-2 border-t border-[#D8D8D2]">
                {[
                  { num: '01', title: 'Prompt 72-Hour Audit & Escrow Settlement', desc: 'Strict milestone invoice reconciliation with transparent RA bill tracking and direct RTGS disbursals.' },
                  { num: '02', title: 'Multi-Project Regional Allocation', desc: 'Continuous deployment opportunities across marine jetties, highway structures, and PEB industrial facilities.' },
                  { num: '03', title: 'Zero-Compromise Safety & Quality Baselines', desc: 'Pre-site EHS induction, statutory Workmen Compensation coverage, and uncompromised personal protective gear.' },
                ].map(({ num, title, desc }) => (
                  <div key={num} className="flex items-start gap-4">
                    <span className="text-sm font-bold text-[#B9923B] tracking-tight pt-0.5 shrink-0">{num}</span>
                    <div>
                      <h3 className="font-display font-bold text-base text-[#111822]">{title}</h3>
                      <p className="text-sm text-[#6B6B67] mt-1 leading-normal">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CORE DISCIPLINES ── */}
      <section className="py-20 border-b border-[#D8D8D2] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-2">Trade Spectrum</span>
              <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#111822] tracking-tight">Core Empanelment Disciplines</h2>
            </div>
            <p className="text-xs font-bold text-[#6B6B67] uppercase tracking-wider">Active Regional Procurement Directory</p>
          </div>

          <div className="border-t border-[#D8D8D2] divide-y divide-[#D8D8D2]">
            {disciplines.map(({ num, title, desc, tags, icon }) => (
              <div key={num} className="group py-8 lg:py-10 hover:bg-[#F4F2EC]/50 px-4 -mx-4 rounded transition-colors">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 items-start">
                  <div className="lg:col-span-1 text-sm font-bold text-[#B9923B]">{num}</div>
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 mb-1 text-[#07558F]">{icon}</div>
                    <h3 className="font-display font-bold text-xl sm:text-2xl text-[#111822] group-hover:text-[#07558F] transition-colors">{title}</h3>
                  </div>
                  <div className="lg:col-span-5">
                    <p className="text-sm text-[#444440] leading-relaxed">{desc}</p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {tags.map(t => (
                        <span key={t} className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[#F2EFE9] text-[#07558F] border border-[#D8D8D2] rounded-sm">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div className="lg:col-span-3 flex lg:justify-end items-start">
                    <a href="#empanelment-form" className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#111822] group-hover:text-[#07558F] transition-colors">
                      <span>Register for This Discipline</span>
                      <FiArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMPANELMENT LIFECYCLE ── */}
      <section className="py-20 border-b border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-2">Workflow Protocol</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#111822] tracking-tight">Empanelment Lifecycle</h2>
            <p className="text-base text-[#444440] mt-3">An audited, transparent onboarding path designed for immediate site mobilization.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { stage: 'Stage 01', title: 'Intake Dossier', desc: 'Online submission of enterprise credentials, past project registries, machinery schedules, and primary trade classification.', meta: 'Form Duration: 15 Mins', status: 'Stage Active', statusColor: '#07558F' },
              { stage: 'Stage 02', title: 'Statutory KYC & Audit', desc: 'Direct authentication of GSTIN, PAN, Labour Licenses, ESIC/EPFO establishments, and valid Workmen Compensation policies.', meta: 'SLA: 48–72 Hours', status: 'Automated Check', statusColor: '#075638' },
              { stage: 'Stage 03', title: 'Regional Indent Allocation', desc: 'MoU execution on verified Schedule of Rates (SoR), digital work orders, and privileged routing of local site BOQs.', meta: 'Output: Active Indent Access', status: 'Ready', statusColor: '#111822' },
            ].map(({ stage, title, desc, meta, status, statusColor }) => (
              <div key={stage} className="bg-white p-7 border border-[#D8D8D2] flex flex-col justify-between shadow-sm rounded-sm">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#B9923B] block mb-4">{stage}</span>
                  <h3 className="font-display font-bold text-xl text-[#111822] mb-3">{title}</h3>
                  <p className="text-sm text-[#6B6B67] leading-relaxed">{desc}</p>
                </div>
                <div className="pt-5 mt-5 border-t border-[#D8D8D2] flex items-center justify-between text-[11px] font-bold uppercase tracking-wide">
                  <span className="text-[#6B6B67]">{meta}</span>
                  <span style={{ color: statusColor }}>{status}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Island Protocol Note */}
          <div className="mt-10 p-5 bg-[#F4F2EC] border border-[#D8D8D2] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-sm">
            <div className="flex items-center gap-3">
              <FiAnchor size={22} className="text-[#07558F] shrink-0" />
              <p className="text-sm text-[#444440]">
                <strong className="text-[#111822]">Specialized Maritime Protocol:</strong> Vendors supplying to Port Blair, Havelock, and Neil Island sites receive port staging assistance at Kolkata and priority customs transit support.
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#6B6B67] uppercase tracking-wider shrink-0 bg-white px-3 py-1.5 border border-[#D8D8D2] rounded-sm whitespace-nowrap">
              Andaman Protocol NV-744
            </span>
          </div>
        </div>
      </section>

      {/* ── VENDOR TESTIMONIALS ── */}
      <section className="py-20 border-b border-[#D8D8D2] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-2">Partner Feedback</span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#111822] tracking-tight">What Our Vendors Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ quote, name, role, initial, accent }) => (
              <div key={name} className="bg-[#FAF9F6] border border-[#D8D8D2] p-6 flex flex-col justify-between rounded-sm shadow-sm">
                <div>
                  <div className="text-3xl font-bold mb-4" style={{ color: accent }}>"</div>
                  <p className="text-sm text-[#444440] leading-relaxed italic">{quote}</p>
                </div>
                <div className="pt-5 mt-5 border-t border-[#D8D8D2] flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ backgroundColor: accent }}>
                    {initial}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#111822]">{name}</div>
                    <div className="text-[11px] text-[#6B6B67]">{role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EMPANELMENT REGISTRATION FORM ── */}
      <section className="py-20 border-b border-[#D8D8D2]" id="empanelment-form">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-4 space-y-6">
              <div>
                <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-2">Open Trade Empanelment</span>
                <h2 className="font-display font-bold text-3xl text-[#111822] tracking-tight">Register for Empanelment</h2>
                <p className="text-sm text-[#6B6B67] mt-3 leading-relaxed">
                  Partner with an institutional contractor committed to prompt statutory settlements, safe environments, and lasting structural execution.
                </p>
              </div>
              <div className="space-y-3">
                {['GSTIN Verification within 24 Hours', 'Dedicated Procurement Desk Contact', 'Priority BOQ Access Post-Approval', 'Statutory Dispute Resolution Framework', 'Island Logistics Coordination'].map(pt => (
                  <div key={pt} className="flex items-center gap-2.5 text-sm text-[#444440]">
                    <FiCheck size={14} className="text-[#075638] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-[#F4F2EC] border border-[#D8D8D2] rounded-sm text-xs text-[#6B6B67]">
                <div className="font-bold text-[#111822] text-sm mb-1">Procurement Desk</div>
                <div>Ph: +91 8596911655</div>
                <div>vendors@neevevara.com</div>
              </div>
            </div>

            <div className="lg:col-span-8 bg-white border border-[#D8D8D2] p-6 lg:p-8 rounded-sm shadow-sm">
              {status === 'success' ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                  <div className="w-14 h-14 rounded-full bg-[#075638]/10 flex items-center justify-center">
                    <FiCheck size={26} className="text-[#075638]" />
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#111822]">Application Received</h3>
                  <p className="text-sm text-[#6B6B67] max-w-sm">Our procurement desk will verify your GSTIN and contact details within 48–72 business hours with an empanelment reference ID.</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-[#D8D8D2] pb-3 mb-5">
                    <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-0.5">Empanelment Intake Dossier</span>
                    <h3 className="font-display text-lg font-bold text-[#111822] uppercase">Stage 01 — Enterprise Registration</h3>
                  </div>
                  <form className="space-y-3.5" onSubmit={handleSubmit}>
                    {status === 'error' && (
                      <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-xs font-medium text-red-800 mb-4">
                        <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                        <span>{errorMsg}</span>
                      </div>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">Company / Firm Name *</label>
                        <input required type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} disabled={status === 'loading'} placeholder="e.g. Apex Civil Contractors Pvt. Ltd." className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">GSTIN *</label>
                        <input required type="text" value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} disabled={status === 'loading'} placeholder="e.g. 21AADCB2230M1ZP" className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">PAN *</label>
                        <input required type="text" value={formData.pan} onChange={e => setFormData({...formData, pan: e.target.value})} disabled={status === 'loading'} placeholder="e.g. AADCB2230M" className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">Primary Trade Discipline *</label>
                        <select required value={formData.tradeType} onChange={e => setFormData({...formData, tradeType: e.target.value})} disabled={status === 'loading'} className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]">
                          <option value="">Select Discipline</option>
                          <option value="Civil & Marine Contractor">Civil & Marine Contractor</option>
                          <option value="Chartered Specialist / Surveyor">Chartered Specialist / Surveyor</option>
                          <option value="Specialized Trade Cadre">Specialized Trade Cadre</option>
                          <option value="Approved Material Stockist">Approved Material Stockist</option>
                          <option value="Skilled Labour & Manpower">Skilled Labour & Manpower</option>
                          <option value="Plant & Logistics Fleet">Plant & Logistics Fleet</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">Preferred Regional Corridor *</label>
                        <select required value={formData.region} onChange={e => setFormData({...formData, region: e.target.value})} disabled={status === 'loading'} className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]">
                          <option value="">Select Region</option>
                          <option value="Odisha Corridor (Primary)">Odisha Corridor (Primary)</option>
                          <option value="Andaman & Nicobar Islands">Andaman & Nicobar Islands</option>
                          <option value="Kolkata & West Bengal Zone">Kolkata & West Bengal Zone</option>
                          <option value="Pan-India / Multi-Region">Pan-India / Multi-Region</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">Contact Person *</label>
                        <input required type="text" value={formData.contactPerson} onChange={e => setFormData({...formData, contactPerson: e.target.value})} disabled={status === 'loading'} placeholder="Name of authorized signatory" className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">Phone *</label>
                        <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={status === 'loading'} placeholder="+91 XXXXX XXXXX" className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-[#111822] uppercase font-bold tracking-wide block">Official Email *</label>
                        <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={status === 'loading'} placeholder="official@company.com" className="w-full bg-[#FAF9F6] border border-[#D8D8D2] px-3 py-2 text-[#111822] text-xs focus:outline-none focus:border-[#07558F]" />
                      </div>
                    </div>
                    <button type="submit" disabled={status === 'loading'} className="w-full py-3 bg-[#07558F] hover:bg-[#054373] disabled:opacity-60 text-white text-xs uppercase tracking-widest font-bold transition-colors shadow-sm flex items-center justify-center gap-2 rounded-sm">
                      {status === 'loading' ? 'Submitting Registration...' : 'Register for Empanelment →'}
                    </button>
                    <p className="text-[10px] text-[#6B6B67] text-center leading-relaxed">
                      By submitting, you consent to statutory KYC verification per Neevevera's vendor compliance charter. Reference ID will be issued within 48 hours.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── DARK CTA ── */}
      <section className="py-20 bg-[#111822] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center flex flex-col items-center">
          <span className="text-[11px] text-[#B9923B] uppercase font-bold tracking-widest block mb-4">Open Trade Empanelment</span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight text-white max-w-3xl mb-4">
            Ready to join our verified trade network?
          </h2>
          <p className="text-base text-white/70 max-w-2xl mb-10 leading-relaxed">
            Partner with an institutional contractor committed to prompt statutory settlements, safe environments, and lasting structural execution.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#empanelment-form" className="px-8 py-3.5 bg-[#B9923B] hover:bg-[#A6812F] text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-lg rounded-sm">
              Register for Empanelment →
            </a>
            <a href="mailto:vendors@neevevara.com" className="px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors border border-white/20 rounded-sm">
              Download Empanelment Charter
            </a>
          </div>
          <div className="mt-14 pt-7 border-t border-white/10 flex flex-wrap items-center justify-center gap-6 text-xs font-bold text-white/50 uppercase tracking-wider">
            <span>DESK: +91 8596911655</span>
            <span>•</span>
            <span>VENDORS@NEEVEVARA.COM</span>
            <span>•</span>
            <span>HQ: BHUBANESWAR, ODISHA</span>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Vendors
