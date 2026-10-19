import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiArrowLeft, FiArrowRight, FiFileText } from 'react-icons/fi'
import axios from 'axios'
import { services as mockServices } from '../data/mockData'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const CATEGORY_LABELS = {
  'construction': 'Construction',
  'building-repair-maintenance': 'Building Repair & Maintenance',
  'design-planning': 'Design and Planning',
  'interior-exterior-solutions': 'Interior & Exterior Solutions',
  'project-management-consultancy': 'Project Management Consultancy',
  'additional-services-platform-features': 'Additional Services',
}

// Static metric strips per category
const CATEGORY_METRICS = {
  'construction': [
    { label: 'Code Compliance', value: 'IS 456 / IS 800', sub: 'NBC 2016 & IS Codes' },
    { label: 'QA Protocol', value: 'Director-Led', sub: 'Chartered Engineer Oversight' },
    { label: 'Cube Testing', value: '7 & 28 Days', sub: 'NABL-Accredited Lab' },
    { label: 'Warranty', value: 'Structural', sub: 'Full Turnkey Handover' },
  ],
  'building-repair-maintenance': [
    { label: 'Standard Code', value: 'CPWD / IS 15988', sub: 'Seismic & Structural Retrofitting' },
    { label: 'Response SLA', value: '< 24 Hours', sub: 'Critical Structural Interventions' },
    { label: 'Warranty Backing', value: 'Up to 10 Yrs', sub: 'Elastomeric & Injection Grouting' },
    { label: 'Safety Record', value: 'Zero LTI', sub: 'Continuous HSE Compliance' },
  ],
  'design-planning': [
    { label: 'BIM Level', value: 'LOD 400', sub: 'Revit & AutoCAD Coordination' },
    { label: 'Structural Tool', value: 'STAAD Pro', sub: 'ETABS Seismic Modeling' },
    { label: 'Clash Detection', value: 'Pre-Ground', sub: 'Zero-Conflict Execution' },
    { label: 'Sanction', value: 'Municipal', sub: 'Statutory Drawing Packages' },
  ],
  'interior-exterior-solutions': [
    { label: 'Material Grade', value: 'Class A', sub: 'Fire-Retardant Certified' },
    { label: 'Cladding', value: 'HPL / ACP', sub: 'Coastal Salinity Resistant' },
    { label: 'Delivery', value: 'Turnkey', sub: 'MEP & Acoustic Integrated' },
    { label: 'Warranty', value: 'Long-Term', sub: 'Custom Furniture Manufacturing' },
  ],
  'project-management-consultancy': [
    { label: 'Framework', value: 'FIDIC / CPWD', sub: 'Contract Governance' },
    { label: 'Scheduling', value: 'CPM / PERT', sub: 'Critical Path Method' },
    { label: 'Billing Audit', value: 'Independent', sub: 'BOQ Reconciliation' },
    { label: 'Certification', value: 'Chartered Eng.', sub: 'Milestone Sign-Off' },
  ],
  'additional-services-platform-features': [
    { label: 'Prefab Savings', value: 'Up to 35%', sub: 'Build Timeline Reduction' },
    { label: 'Dashboard', value: 'Real-Time', sub: 'Cloud Progress Tracking' },
    { label: 'Testing', value: 'NABL Labs', sub: 'Accredited Diagnostics' },
    { label: 'Integrations', value: 'Enterprise', sub: 'Scalable API Platform' },
  ],
}

// Four-stage process per category
const EXECUTION_STAGES = {
  'construction': [
    { code: '01 // SURVEY', title: 'Geotechnical Investigation', desc: 'Soil bearing tests, borehole logs, topographic survey, and subgrade assessment prior to foundation design.' },
    { code: '02 // DESIGN', title: 'Structural Engineering', desc: 'STAAD Pro / ETABS modeling, ductile detailing per IS 13920, and statutory sanction drawings.' },
    { code: '03 // EXECUTE', title: 'Turnkey Construction', desc: 'Piling, formwork, RMC pour with NABL cube testing, structural shell, MEP rough-in, and finishing.' },
    { code: '04 // CERTIFY', title: 'Handover & Warranty', desc: 'Structural load certification, occupancy clearance, and multi-year warranty deed issuance.' },
  ],
  'building-repair-maintenance': [
    { code: '01 // AUDIT', title: 'Diagnostic Survey', desc: 'Rebound hammer, moisture profiling, ultrasonic pulse velocity, and crack pattern telemetry.' },
    { code: '02 // SPECIFY', title: 'BOQ & Material Select', desc: 'Detailed itemized schedule adhering to CPWD specifications and ASTM chemical standards.' },
    { code: '03 // EXECUTE', title: 'Calibrated Application', desc: 'Pressure grouting, micro-concreting, surface priming, and line laying under resident site engineers.' },
    { code: '04 // VALIDATE', title: 'Sign-off & Warranty', desc: 'Core shear testing, ponding leak tests, thermal scans, and formal multi-year warranty deeds.' },
  ],
  'design-planning': [
    { code: '01 // BRIEF', title: 'Client Programming', desc: 'Space requirements, regulatory constraints, site orientation, and functional zone mapping.' },
    { code: '02 // CONCEPT', title: 'Schematic Design', desc: 'Architectural massing, structural grid, MEP routes, and preliminary BOQ estimate.' },
    { code: '03 // DEVELOP', title: 'Detailed Drawings', desc: 'GFC structural details, sanction drawings, 3D renders, and clash-free BIM models.' },
    { code: '04 // DELIVER', title: 'Tender Package', desc: 'Complete bid document set, specifications, BOQ, and contractor pre-qualification criteria.' },
  ],
  'interior-exterior-solutions': [
    { code: '01 // CONCEPT', title: 'Design Brief', desc: 'Client mood board, spatial programming, material palette shortlisting, and budget framework.' },
    { code: '02 // SPECIFY', title: 'Technical Drawing', desc: 'Interior layout GFCs, facade elevation drawings, and MEP coordination sheets.' },
    { code: '03 // EXECUTE', title: 'Fit-Out Construction', desc: 'Ceilings, cladding, flooring, furniture installation, and MEP finish integration.' },
    { code: '04 // HANDOVER', title: 'Snag & Commission', desc: 'Punch-list snag clearance, lighting commissioning, and turnkey handover with material warranty.' },
  ],
  'project-management-consultancy': [
    { code: '01 // MOBILIZE', title: 'PMC Setup', desc: 'Site office establishment, documentation framework, contractor kick-off, and baseline schedule.' },
    { code: '02 // CONTROL', title: 'Ongoing Monitoring', desc: 'Weekly progress reviews, BOQ billing verification, RFI management, and variance reporting.' },
    { code: '03 // QA/QC', title: 'Quality Surveillance', desc: 'Third-party lab testing, non-conformance reports, and corrective action tracking.' },
    { code: '04 // CLOSE', title: 'Completion & Audit', desc: 'Final bill reconciliation, punch-list, statutory clearance, and project closure report.' },
  ],
}

const DEFAULT_STAGES = [
  { code: '01 // ASSESS', title: 'Initial Assessment', desc: 'Site survey, requirements analysis, and feasibility study.' },
  { code: '02 // PLAN', title: 'Planning & BOQ', desc: 'Detailed scope, bill of quantities, and project schedule.' },
  { code: '03 // EXECUTE', title: 'Execution', desc: 'Supervised deployment with quality checkpoints at every stage.' },
  { code: '04 // DELIVER', title: 'Handover', desc: 'Sign-off, documentation, and warranty issuance.' },
]

const ServiceDetail = () => {
  const { slug } = useParams()
  const [service, setService] = useState(null)
  const [otherServices, setOtherServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resService, resAll] = await Promise.all([
          axios.get(`${API}/services/${slug}`),
          axios.get(`${API}/services?limit=10`)
        ])
        if (resService.data.success && resService.data.data) {
          setService(resService.data.data)
        }
        if (resAll.data.success && resAll.data.items) {
          setOtherServices(resAll.data.items)
        }
      } catch (err) {
        const mockMatch = mockServices.find(s => s.slug === slug)
        if (mockMatch) {
          setService(mockMatch)
          setOtherServices(mockServices)
        } else {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [slug])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-[#07558F]">Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-center px-6 gap-4">
        <h1 className="font-display text-2xl font-bold text-[#111822]">Service Not Found</h1>
        <Link to="/services" className="px-6 py-3 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054373]">
          Return to Services
        </Link>
      </div>
    )
  }

  const categoryLabel = CATEGORY_LABELS[service.category] || service.category
  const metrics = CATEGORY_METRICS[service.category] || []
  const stages = EXECUTION_STAGES[service.category] || DEFAULT_STAGES
  const hasSections = service.sections && service.sections.length > 0

  // Count active sub-services
  const totalSubServices = hasSections
    ? service.sections.reduce((acc, sec) => acc + (sec.services || []).filter(s => s.isActive !== false).length, 0)
    : 0

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>{service.title} | Neevevera Engineering</title>
        <meta name="description" content={service.shortDescription || service.description?.slice(0, 160)} />
        <meta property="og:title" content={`${service.title} | Neevevera Private Limited`} />
        <meta property="og:description" content={service.shortDescription || service.description?.slice(0, 160)} />
      </Helmet>

      {/* ── Breadcrumb ── */}
      <div className="border-b border-[#D8D8D2] bg-[#F2EFE9] py-3">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between text-xs">
          <Link to="/services" className="inline-flex items-center gap-2 text-[#07558F] hover:underline font-bold uppercase tracking-wider">
            <FiArrowLeft size={13} />
            Return to Services Directory
          </Link>
          <span className="text-[#6B6B67] font-mono text-[10px] uppercase tracking-wider hidden sm:block">
            Service Vertical // {categoryLabel}
          </span>
        </div>
      </div>

      {/* ── Hero Header Block ── */}
      <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-12">

        {/* Category badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#F2EFE9] border border-[#D8D8D2] mb-6">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#07558F]">
            SERVICE VERTICAL // {categoryLabel.toUpperCase()}
          </span>
        </div>

        {/* Title + description - full width, no CTA button here */}
        <div className="mb-10">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight leading-tight">
            {service.title}
          </h1>
          <p className="text-base text-[#444440] mt-4 leading-relaxed max-w-2xl">
            {service.description || service.shortDescription}
          </p>
        </div>

        {/* Hero Image */}
        {service.image && (
          <div className="relative w-full h-[340px] md:h-[440px] lg:h-[500px] overflow-hidden bg-neutral-900">
            <img
              src={service.image}
              alt={service.title}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#111822]/85 via-[#111822]/25 to-transparent" />

            {/* Bottom caption */}
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="max-w-2xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#C9A84C]">
                    ✓ Quality Assurance &amp; Execution Protocol
                  </span>
                </div>
                <p className="text-sm text-white font-medium leading-relaxed">
                  {service.shortDescription || `${service.title} delivered under direct chartered engineer supervision across Odisha, Andaman, and Kolkata regions.`}
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2.5 self-start md:self-end shrink-0">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-white/60">Compliance</span>
                  <span className="text-xs font-bold text-white font-mono">IS 456 / IS 800 / NBC</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Technical Metrics Strip ── */}
      {metrics.length > 0 && (
        <section className="w-full bg-[#F2EFE9] border-y border-[#D8D8D2] py-8 mb-14">
          <div className="max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m, i) => (
              <div key={i} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B67]">{m.label}</span>
                <span className="font-display text-xl font-extrabold text-[#111822]">{m.value}</span>
                <span className="text-xs text-[#6B6B67]">{m.sub}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Sub-Service Sections Grid ── */}
      {hasSections && (
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-16">
          {service.sections.map((section, sIdx) => {
            const activeSubServices = (section.services || []).filter(s => s.isActive !== false && s.title && s.title.trim())
            if (activeSubServices.length === 0) return null

            return (
              <div key={sIdx} className="mb-16">
                {/* Section header - clean stacked layout matching design hierarchy */}
                <div className="mb-8 max-w-3xl">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[#07558F]">
                    Operational Scope
                  </span>
                  <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#111822] mt-1">
                    {section.title}
                  </h2>
                  {section.description && (
                    <p className="text-sm text-[#6B6B67] mt-2 leading-relaxed">
                      {section.description}
                    </p>
                  )}
                </div>

                {/* Sub-service cards */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${
                  activeSubServices.length === 3 ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
                } gap-6`}>
                  {activeSubServices.map((sub, subIdx) => (
                    <div
                      key={subIdx}
                      className="group flex flex-col bg-white border border-[#D8D8D2] hover:border-[#07558F] hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Card Image */}
                      {sub.image && (
                        <div className="relative w-full h-44 bg-neutral-200 overflow-hidden">
                          <img
                            src={sub.image}
                            alt={sub.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-3 left-3 px-2.5 py-1 bg-[#111822] text-white text-[10px] font-bold font-mono tracking-wider">
                            {String(sIdx + 1).padStart(2, '0')}.{String(subIdx + 1).padStart(2, '0')}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col flex-1 p-5">
                        <h3 className="font-display text-base font-bold text-[#111822] group-hover:text-[#07558F] transition-colors mb-2 leading-snug">
                          {sub.title}
                        </h3>
                        {sub.description && (
                          <p className="text-xs text-[#444440] leading-relaxed flex-1 mb-4">
                            {sub.description}
                          </p>
                        )}
                        <Link
                          to={`/contact?service=${encodeURIComponent(service.slug)}&module=${encodeURIComponent(sub.title)}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#07558F] hover:text-[#054373] transition-colors mt-auto"
                        >
                          Enquire
                          <FiArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </section>
      )}

      {/* ── Key Benefits, Pricing & Legal Terms (PRD §4.3.1) ── */}
      {((service.benefits && service.benefits.length > 0) || service.priceNote || service.legalNote) && (
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 md:p-8 bg-white border border-[#D8D8D2]">
            {service.benefits && service.benefits.length > 0 && (
              <div className={service.priceNote || service.legalNote ? "lg:col-span-7 space-y-4" : "lg:col-span-12 space-y-4"}>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#07558F]">Client Value Guarantee</span>
                <h3 className="font-display text-lg font-bold text-[#111822]">Core Service Benefits</h3>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {service.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-[#444440] leading-relaxed">
                      <span className="text-[#07558F] font-bold mt-0.5">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {(service.priceNote || service.legalNote) && (
              <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#D8D8D2] pt-6 lg:pt-0 lg:pl-8 space-y-4">
                {service.priceNote && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B67] block mb-1">Pricing Framework</span>
                    <p className="text-xs text-[#444440] leading-relaxed">{service.priceNote}</p>
                  </div>
                )}
                {service.legalNote && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B6B67] block mb-1">Statutory &amp; Regulatory Note</span>
                    <p className="text-[11px] text-[#6B6B67] leading-relaxed italic">{service.legalNote}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Fallback: features list if no sections */}
      {!hasSections && service.features && service.features.length > 0 && (
        <section className="w-full max-w-7xl mx-auto px-6 lg:px-12 pb-16">
          <h2 className="font-display text-2xl font-bold text-[#111822] pb-4 border-b border-[#D8D8D2] mb-6">
            Service Scope &amp; Capabilities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {service.features.map((feat, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-white border border-[#D8D8D2] text-xs font-medium">
                <span className="w-6 h-6 bg-[#07558F]/10 text-[#07558F] font-bold text-[10px] flex items-center justify-center shrink-0 font-mono">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="text-[#444440] leading-relaxed pt-0.5">{feat}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Execution Methodology Strip ── */}
      <section className="w-full bg-[#F2EFE9] border-y border-[#D8D8D2] py-12 mb-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#07558F]">Neevevera Standard Procedure</span>
              <h3 className="font-display text-xl font-bold text-[#111822] mt-1">Four-Stage Execution Cycle</h3>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-[#D8D8D2] bg-white text-xs font-bold text-[#444440]">
              ✓ Standard Execution Protocol
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {stages.map((stage, i) => (
              <div key={i} className="p-5 bg-white border border-[#D8D8D2] flex flex-col gap-2">
                <span className="text-[10px] font-bold text-[#07558F] font-mono tracking-widest">{stage.code}</span>
                <h4 className="font-display text-sm font-bold text-[#111822]">{stage.title}</h4>
                <p className="text-xs text-[#6B6B67] leading-relaxed">{stage.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


    </div>
  )
}

export default ServiceDetail
