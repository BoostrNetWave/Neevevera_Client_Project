import React, { useState, useMemo, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiSearch, FiSliders, FiCheckCircle } from 'react-icons/fi'
import axios from 'axios'
import { projects as mockProjects } from '../data/mockData'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Projects = () => {
  const [selectedClassification, setSelectedClassification] = useState('ALL')
  const [selectedTerritory, setSelectedTerritory] = useState('ALL')
  const [selectedState, setSelectedState] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(9)

  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axios.get(`${API}/projects?limit=100`)
        if (res.data.success && res.data.items) {
          const liveData = res.data.items.map(p => ({
            id: p._id,
            slug: p.slug,
            name: p.name || p.title,
            category: p.category,
            region: p.region,
            location: p.location,
            client: p.clientName,
            status: p.status,
            completionDate: p.completionDate,
            coverImage: p.coverImage || '/placeholder.jpg',
            shortDescription: p.shortDescription || (p.description ? p.description.substring(0, 100) + '...' : ''),
            description: p.description,
            specs: p.specs || [],
            isFeatured: p.isFeatured,
            projectCode: p.slug.split('-')[0].toUpperCase(),
            gallery: p.gallery || []
          }))
          
          setProjects(liveData)
        }
      } catch (err) {
        console.error('Failed to load projects', err)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [])

  const classifications = ['ALL', 'RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'INFRASTRUCTURE', 'GOVERNMENT']

  const allProjects = [
    ...projects,
    ...mockProjects.filter(mock => !projects.some(live => live.slug === mock.slug))
  ]

  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      // Classification filter
      if (selectedClassification !== 'ALL' && p.category.toUpperCase() !== selectedClassification) {
        return false
      }
      // Territory filter
      if (selectedTerritory !== 'ALL' && !p.location.toLowerCase().includes(selectedTerritory.toLowerCase())) {
        return false
      }
      // State/Status filter
      if (selectedState !== 'ALL') {
        if (selectedState === 'HANDOVER' && !p.status.toLowerCase().includes('handover')) return false
        if (selectedState === 'ONGOING' && !p.status.toLowerCase().includes('ongoing')) return false
        if (selectedState === 'COMMISSIONED' && !p.status.toLowerCase().includes('commissioned')) return false
      }
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase()
        const matchTitle = p.name.toLowerCase().includes(q)
        const matchSpec = (p.specs?.[0]?.value || '').toLowerCase().includes(q)
        const matchLoc = p.location.toLowerCase().includes(q)
        const matchCode = p.projectCode.toLowerCase().includes(q)
        if (!matchTitle && !matchSpec && !matchLoc && !matchCode) return false
      }
      return true
    })
  }, [selectedClassification, selectedTerritory, selectedState, searchQuery, allProjects])

  const visibleList = filteredProjects.slice(0, visibleCount)

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#171717]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium uppercase tracking-widest text-[#07558F]">Loading Registry...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ─────────────────────────────────────────────────────────────
          PAGE HEADER (Matching exact reference screenshot)
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-[#D8D8D2] pt-8 pb-10 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
                CIVIL INDEX // PORTFOLIO DIRECTORY
              </div>
              <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
                Our Project Portfolio
              </h1>
              <p className="text-sm sm:text-base text-[#444440] mt-2 max-w-2xl font-light">
                Explore Neevevera's executed and ongoing civil undertakings, industrial hubs, commercial cores, and infrastructure corridors.
              </p>
            </div>
            <div className="text-right font-medium text-[11px] text-[#6B6B67] space-y-1">
              <div>PROJECT REGISTRY 2025</div>
              <div>ORDER REF: <span className="font-bold text-[#111822]">NV-PRJ-09/24</span></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CONTROL / FILTER BAR (Matching reference screenshot exactly)
          ───────────────────────────────────────────────────────────── */}
      <section className="border-b border-[#D8D8D2] bg-white sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-4 space-y-4">

          {/* Classification Pills & Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-medium uppercase text-[#6B6B67] mr-2 font-bold">
                CLASSIFICATION:
              </span>
              {classifications.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedClassification(cat)}
                  className={`px-3 py-1 text-xs font-medium font-bold tracking-wider uppercase transition-colors rounded-sm ${
                    selectedClassification === cat
                      ? 'bg-[#111822] text-white shadow-xs'
                      : 'bg-[#F2EFE9] text-[#6B6B67] hover:text-[#111822]'
                  }`}
                >
                  {cat === 'ALL' ? 'ALL SECTORS' : cat}
                </button>
              ))}
            </div>

            <div className="text-[11px] font-medium text-[#6B6B67]">
              SHOWING <span className="font-bold text-[#111822]">{visibleList.length}</span> OF{' '}
              <span className="font-bold text-[#111822]">{filteredProjects.length}</span> INDEXED
            </div>
          </div>

          {/* Filter Dropdowns & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#F0EFEA]">
            <div>
              <label className="block text-[10px] font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                REGIONAL TERRITORY
              </label>
              <select
                value={selectedTerritory}
                onChange={(e) => setSelectedTerritory(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
              >
                <option value="ALL">All Regional Territories</option>
                <option value="Odisha">Odisha Corridor</option>
                <option value="Andaman">Port Blair &amp; Andaman Islands</option>
                <option value="Kolkata">Kolkata &amp; Bengal Zone</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                COMMISSIONING STATE
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full text-xs font-medium px-3 py-2 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
              >
                <option value="ALL">All Execution States</option>
                <option value="HANDOVER">Handover Ready</option>
                <option value="ONGOING">Ongoing / Active Site</option>
                <option value="COMMISSIONED">Commissioned</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                STRUCTURAL METRIC QUERY
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search spec: PEB, Box Girder, Post-Tension..."
                  className="w-full text-xs font-medium pl-3 pr-8 py-2 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                />
                <FiSearch className="absolute right-2.5 top-2.5 text-[#6B6B67]" size={14} />
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          PROJECTS DIRECTORY GRID (Matching reference screenshot exactly)
          ───────────────────────────────────────────────────────────── */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {visibleList.length === 0 ? (
            <div className="p-16 text-center border border-dashed border-[#D8D8D2] bg-white rounded-xs">
              <p className="font-medium text-sm text-[#6B6B67]">
                No projects matched your active filters or query.
              </p>
              <button
                onClick={() => {
                  setSelectedClassification('ALL')
                  setSelectedTerritory('ALL')
                  setSelectedState('ALL')
                  setSearchQuery('')
                }}
                className="mt-4 px-4 py-2 bg-[#07558F] text-white text-xs font-medium uppercase font-bold"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visibleList.map((p) => (
                <div
                  key={p.id}
                  className="border border-[#D8D8D2] bg-white hover:border-[#111822] transition-all flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md"
                >
                  <div>
                    {/* Visual with Code & Badge */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-900">
                      <img
                        src={p.coverImage}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white font-medium text-[10px] px-2.5 py-0.5 uppercase tracking-wider">
                        {p.projectCode || p.slug.split('-')[0].toUpperCase()}
                      </div>

                      {/* Status badge with appropriate color */}
                      <div className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-sm text-[#111822] font-medium text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider border border-[#D8D8D2] flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            p.status.includes('ONGOING')
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-emerald-500'
                          }`}
                        ></span>
                        <span>{p.status}</span>
                      </div>
                    </div>

                    {/* Card Meta & Title */}
                    <div className="p-6">
                      <div className="flex items-center justify-between text-[11px] font-medium text-[#07558F] font-bold uppercase mb-1">
                        <span>{p.category}</span>
                        <span className="text-[#6B6B67]">{p.location}</span>
                      </div>

                      <h3 className="font-display text-lg font-bold text-[#111822] group-hover:text-[#07558F] transition-colors leading-snug">
                        {p.name}
                      </h3>

                      <p className="text-xs text-[#444440] mt-2 line-clamp-2 leading-relaxed">
                        {p.shortDescription || p.summary}
                      </p>

                      {/* Technical Specs 2-Column Table */}
                      <div className="grid grid-cols-2 gap-2 mt-5 pt-4 border-t border-[#E5E3DC] text-[11px] font-medium">
                        <div className="p-2 bg-[#FAF9F6] border border-[#F0EFEA]">
                          <span className="text-[#6B6B67] block text-[9px] uppercase">
                            BUILT SPEC
                          </span>
                          <span className="font-bold text-[#111822] truncate block">
                            {p.specs?.[1]?.value || 'N/A'}
                          </span>
                        </div>
                        <div className="p-2 bg-[#FAF9F6] border border-[#F0EFEA]">
                          <span className="text-[#6B6B67] block text-[9px] uppercase">
                            ENGINEERING
                          </span>
                          <span className="font-bold text-[#07558F] truncate block">
                            {p.specs?.[0]?.value || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action */}
                  <div className="p-6 pt-0">
                    <Link
                      to={`/projects/${p.slug}`}
                      className="inline-flex items-center gap-2 text-xs font-medium font-bold uppercase text-[#07558F] group-hover:text-[#054373]"
                    >
                      <span>Inspect Engineering Dossier</span>
                      <FiArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {filteredProjects.length > 9 && (
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#D8D8D2] font-medium text-xs">
              <div className="text-[#6B6B67]">
                SHOWING 1-{Math.min(visibleCount, filteredProjects.length)} OF {filteredProjects.length} ACTIVE PROJECTS
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setVisibleCount(9)}
                  className="px-3 py-1.5 bg-[#111822] text-white font-bold"
                >
                  01
                </button>
                <button
                  onClick={() => setVisibleCount(18)}
                  className="px-3 py-1.5 bg-white border border-[#D8D8D2] text-[#171717] hover:bg-[#F2EFE9]"
                >
                  02
                </button>
                <button
                  onClick={() => setVisibleCount(filteredProjects.length)}
                  className="px-3 py-1.5 bg-white border border-[#D8D8D2] text-[#171717] hover:bg-[#F2EFE9]"
                >
                  ALL
                </button>

                {visibleCount < filteredProjects.length && (
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 9)}
                    className="ml-3 px-4 py-1.5 bg-white border border-[#C8C7C0] hover:bg-[#EAE8E0] text-[#111822] font-bold uppercase tracking-wider transition-colors"
                  >
                    LOAD MORE PROJECTS ↓
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          CUMULATIVE EXECUTION METRICS STRIP (From reference screenshot)
          ───────────────────────────────────────────────────────────── */}
      <section className="border-t border-[#D8D8D2] bg-[#F2EFE9] py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4">
              <div className="text-[10px] font-medium uppercase tracking-widest text-[#07558F] font-bold mb-1">
                AGGREGATE REGISTRY
              </div>
              <h3 className="font-display text-2xl font-extrabold text-[#111822] tracking-tight">
                Cumulative Execution Metrics
              </h3>
              <p className="text-xs text-[#6B6B67] mt-1 font-medium">
                Cross-territory structural deliverables audited under stringent QMS protocols.
              </p>
            </div>

            <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 border border-[#D8D8D2]">
                <div className="text-[10px] font-medium uppercase text-[#6B6B67]">TOTAL BUILT UP AREA</div>
                <div className="font-medium text-2xl font-extrabold text-[#111822] mt-1">3.8M+</div>
                <div className="text-[10px] text-[#6B6B67] font-medium">Sq.Ft. Industrial &amp; Core</div>
              </div>

              <div className="bg-white p-4 border border-[#D8D8D2]">
                <div className="text-[10px] font-medium uppercase text-[#6B6B67]">MARITIME PILING</div>
                <div className="font-medium text-2xl font-extrabold text-[#111822] mt-1">420+</div>
                <div className="text-[10px] text-[#6B6B67] font-medium">Offshore Driven Piles</div>
              </div>

              <div className="bg-white p-4 border border-[#D8D8D2]">
                <div className="text-[10px] font-medium uppercase text-[#6B6B67]">STRUCTURAL STEEL</div>
                <div className="font-medium text-2xl font-extrabold text-[#111822] mt-1">14,200</div>
                <div className="text-[10px] text-[#6B6B67] font-medium">Metric Tons Erected</div>
              </div>

              <div className="bg-white p-4 border border-[#D8D8D2]">
                <div className="text-[10px] font-medium uppercase text-[#6B6B67]">ZERO INCIDENT HOURS</div>
                <div className="font-medium text-2xl font-extrabold text-[#075638] mt-1">2.4M</div>
                <div className="text-[10px] text-[#6B6B67] font-medium">OHSE Safety Audited</div>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Projects
