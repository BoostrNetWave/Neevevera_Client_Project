import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiDownload, FiMapPin, FiCalendar, FiShield, FiLayers } from 'react-icons/fi'
import axios from 'axios'
import { projects as mockProjects } from '../data/mockData'

const ProjectDetail = () => {
  const { slug } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/projects/${slug}`)
        if (res.data.success && res.data.data) {
          const p = res.data.data
          setProject({
            id: p._id,
            slug: p.slug,
            title: p.name || p.title,
            category: p.category,
            region: p.region,
            location: p.location,
            client: p.clientName,
            status: p.status,
            completionYear: p.completionDate ? new Date(p.completionDate).getFullYear() : 'Ongoing',
            coverImage: p.coverImage || '/placeholder.jpg',
            summary: p.shortDescription || (p.description ? p.description.substring(0, 100) + '...' : ''),
            description: p.description,
            builtArea: p.specs?.find(s => s.label.toLowerCase().includes('area'))?.value || 'N/A',
            structuralSpec: p.specs?.find(s => s.label.toLowerCase().includes('scope') || s.label.toLowerCase().includes('structural'))?.value || 'N/A',
            code: p.slug.split('-')[0].toUpperCase(),
            gallery: p.gallery || []
          })
        }
      } catch (err) {
        // Fallback to mock data if API fails (e.g. 404 Not Found)
        const mockMatch = mockProjects.find(p => p.slug === slug)
        if (mockMatch) {
          setProject({
            ...mockMatch,
            title: mockMatch.name,
            code: mockMatch.projectCode,
            summary: mockMatch.shortDescription,
            completionYear: mockMatch.completionDate,
            builtArea: mockMatch.specs?.find(s => s.label.toLowerCase().includes('area'))?.value || 'N/A',
            structuralSpec: mockMatch.specs?.find(s => s.label.toLowerCase().includes('scope') || s.label.toLowerCase().includes('structural'))?.value || 'N/A',
          })
        } else {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [slug])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#171717]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium uppercase tracking-widest text-[#07558F]">Loading Dossier...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-[#171717] px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-[#111822] mb-2">Dossier Not Found</h1>
        <p className="text-[#6B6B67] mb-6">The project record you are looking for is unavailable or has been archived.</p>
        <Link to="/projects" className="px-6 py-3 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054373]">
          Return to Registry
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>{project.name || project.title} | Neevevera Project Portfolio</title>
        <meta name="description" content={project.scopeSummary || project.description || `Engineering dossier for ${project.name || project.title}, located in ${project.location}.`} />
        <meta property="og:title" content={`${project.name || project.title} | Neevevera`} />
        <meta property="og:description" content={project.scopeSummary || project.description || `Engineering dossier for ${project.name || project.title}, located in ${project.location}.`} />
      </Helmet>
      {/* ── Top Bar / Breadcrumb ── */}
      <div className="border-b border-[#D8D8D2] bg-[#F2EFE9] py-3">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between text-xs font-medium">
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-[#07558F] hover:underline font-bold uppercase"
          >
            <FiArrowLeft size={13} />
            <span>Return to Project Registry</span>
          </Link>
          <div className="text-[#6B6B67]">
            DOSSIER ID: <span className="font-bold text-[#111822]">{project.code}</span>
          </div>
        </div>
      </div>

      {/* ── Dossier Header ── */}
      <section className="border-b border-[#D8D8D2] py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 text-xs font-medium uppercase mb-2">
                <span className="bg-[#07558F] text-white px-2 py-0.5 font-bold">
                  {project.category}
                </span>
                <span className="text-[#6B6B67] flex items-center gap-1">
                  <FiMapPin size={12} /> {project.location}
                </span>
                <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 border border-emerald-200 font-bold">
                  {project.status}
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
                {project.title}
              </h1>
              <div className="text-sm sm:text-base text-[#444440] mt-3 max-w-3xl leading-relaxed whitespace-pre-line">
                {project.description || project.summary}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link
                to="/contact"
                className="px-6 py-3 bg-[#07558F] hover:bg-[#054373] text-white font-medium text-xs font-bold uppercase tracking-wider"
              >
                Inquire Similar Scope
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero Media Showcase ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="relative aspect-[21/9] w-full overflow-hidden border border-[#D8D8D2] bg-neutral-900 shadow-sm">
          <img
            src={project.coverImage || project.image}
            alt={project.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 font-medium text-xs">
            FIELD AUDIT PHOTOGRAPH // OFFICIAL AS-BUILT RECORD
          </div>
        </div>
      </section>

      {/* ── Technical Dossier Details ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Left 8 cols: Detailed Engineering Scope */}
          <div className="lg:col-span-8 space-y-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#111822] pb-3 border-b border-[#D8D8D2]">
                Engineering &amp; Structural Architecture
              </h2>
              <div className="mt-4 text-sm text-[#444440] leading-relaxed space-y-4">
                <p>
                  The {project.title} project represents a benchmark execution within the {project.location} region. Neevevera was contracted to carry out full-spectrum civil and structural engineering under direct adherence to Indian Standards and rigorous Quality Management System (QMS) protocols.
                </p>
                <p>
                  Execution encompassed precision geotechnical soil profiling, deep continuous foundation piling, high-tolerance post-tensioned beam casting, and monolithic shear wall erection. High-grade Fe550D TMT reinforcement and M40/M50 grade design-mix concrete were sourced with strict mill-test batch traceability.
                </p>
              </div>
            </div>

            {/* Scope Deliverables */}
            <div>
              <h3 className="font-display text-lg font-bold text-[#111822] mb-4">
                Key Technical Deliverables
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  'Bored cast-in-situ piling up to specified geotechnical refusal',
                  'Seismic ductile detailing adhering to IS 13920:2016',
                  'Ultrasonic pulse velocity & non-destructive concrete tests',
                  'High-performance waterproof membrane & elastomeric coatings',
                  'Full statutory fire and life safety compliance certification',
                  'Milestone-based stage inspection signed by Chartered Engineer',
                ].map((del, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-white border border-[#D8D8D2] text-xs font-medium">
                    <FiCheckCircle className="text-[#075638] shrink-0 mt-0.5" size={14} />
                    <span>{del}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gallery of Project Views */}
            {project.gallery && project.gallery.length > 0 && (
              <div>
                <h3 className="font-display text-lg font-bold text-[#111822] mb-4">
                  Site Progress &amp; Detail Imagery
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {project.gallery.map((imgUrl, idx) => (
                    <div key={idx} className="border border-[#D8D8D2] bg-neutral-900 aspect-[4/3] overflow-hidden">
                      <img
                        src={typeof imgUrl === 'string' ? imgUrl : imgUrl.url}
                        alt={`Site Progress ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right 4 cols: Specifications Sheet Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-[#D8D8D2] bg-white p-6 shadow-xs">
              <div className="font-medium text-xs font-bold uppercase tracking-wider text-[#07558F] pb-3 border-b border-[#E5E3DC]">
                SPECIFICATION MATRIX
              </div>

              <div className="mt-4 space-y-3 font-medium text-xs">
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">PROJECT CODE</span>
                  <span className="font-bold text-[#111822]">{project.code}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">CATEGORY</span>
                  <span className="font-bold text-[#111822]">{project.category}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">LOCATION</span>
                  <span className="font-bold text-[#111822]">{project.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">BUILT-UP AREA</span>
                  <span className="font-bold text-[#111822]">{project.builtArea}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">ENGINEERING</span>
                  <span className="font-bold text-[#07558F]">{project.structuralSpec}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">CLIENT / OWNER</span>
                  <span className="font-bold text-[#111822]">{project.client}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">COMPLETION</span>
                  <span className="font-bold text-[#111822]">{project.completionYear}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">SAFETY RECORD</span>
                  <span className="font-bold text-[#075638]">Zero Incidents (LTI-Free)</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E3DC]">
                <button
                  onClick={() => alert(`Downloading structural summary dossier for ${project.title}`)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] hover:bg-[#F2EFE9] text-xs font-medium font-bold uppercase transition-colors"
                >
                  <FiDownload size={13} />
                  <span>Download Spec Sheet (PDF)</span>
                </button>
              </div>
            </div>

            {/* Quality Standard */}
            <div className="p-4 bg-[#F2EFE9] border border-[#D8D8D2] text-xs font-medium space-y-2">
              <div className="font-bold text-[#111822] flex items-center gap-2">
                <FiShield className="text-[#07558F]" />
                <span>Quality Management Audited</span>
              </div>
              <p className="text-[#6B6B67]">
                Executed under strict ISO 9001:2015 quality processes with dual-layer testing reports available on record.
              </p>
            </div>
          </div>

        </div>
      </section>
    </div>
  )
}

export default ProjectDetail
