import React, { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { FiSearch, FiArrowRight, FiMic, FiUser, FiFolder, FiBriefcase, FiSettings, FiBookOpen, FiExternalLink, FiCheckCircle } from 'react-icons/fi'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const EMPTY = { services: [], projects: [], careers: [], insights: [], podcasts: [], team: [] }

const POPULAR_SEARCHES = [
  'Waterproofing',
  'Civil Construction',
  'PEB Warehouses',
  'Bridges & Viaducts',
  'PMC Consultancy',
  'KIIT Campus',
  'Commercial Towers'
]

const ResultCard = ({ to, image, badge, badgeColor = '#07558F', title, meta, description }) => (
  <Link
    to={to}
    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white border border-[#D8D8D2] hover:border-[#07558F] hover:shadow-md transition-all group rounded-xs"
  >
    <div className="flex items-center gap-4 flex-1 min-w-0">
      {image && (
        <img
          src={image}
          alt={title}
          className="w-16 h-16 sm:w-20 sm:h-20 object-cover flex-shrink-0 border border-[#E5E4DE] bg-[#FAF9F6] rounded-xs"
          onError={e => { e.currentTarget.style.display = 'none' }}
        />
      )}
      <div className="flex-1 min-w-0">
        {badge && (
          <div className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: badgeColor }}>
            {badge}{meta ? ` • ${meta}` : ''}
          </div>
        )}
        <div className="font-display font-bold text-base text-[#111822] group-hover:text-[#07558F] transition-colors leading-snug">
          {title}
        </div>
        {description && (
          <p className="text-xs text-[#555550] mt-1.5 line-clamp-2 leading-relaxed">{description}</p>
        )}
      </div>
    </div>
    <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold uppercase text-[#07558F] group-hover:translate-x-1 transition-all pl-2 flex-shrink-0">
      <span>View</span>
      <FiArrowRight size={15} />
    </div>
  </Link>
)

const SectionHeader = ({ icon: Icon, label, count }) => (
  <div className="flex items-center gap-2 pb-2.5 border-b border-[#D8D8D2] mb-4">
    <Icon size={15} className="text-[#07558F]" />
    <h3 className="font-bold text-xs uppercase tracking-widest text-[#07558F]">
      {label} <span className="text-[#6B6B67] font-medium">({count})</span>
    </h3>
  </div>
)

const Search = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const [query, setQuery] = useState(q)
  const [results, setResults] = useState(EMPTY)
  const [loading, setLoading] = useState(false)

  // Keep input in sync if URL param changes externally
  useEffect(() => { setQuery(searchParams.get('q') || '') }, [searchParams])

  useEffect(() => {
    const term = (searchParams.get('q') || '').trim()
    if (!term) { setResults(EMPTY); return }

    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API}/search`, { params: { q: term } })
        if (res.data.success) {
          const r = {
            services:  res.data.services  || [],
            projects:  res.data.projects  || [],
            careers:   res.data.careers   || [],
            insights:  res.data.insights  || [],
            podcasts:  res.data.podcasts  || [],
            team:      res.data.team      || [],
          }
          setResults(r)

          // ── DIRECT SERVICE REDIRECT ──
          // If the search specifically matched exactly 1 service and no other entity
          if (
            r.services.length === 1 &&
            r.projects.length === 0 &&
            r.careers.length === 0 &&
            r.insights.length === 0 &&
            r.podcasts.length === 0 &&
            r.team.length === 0
          ) {
            navigate(`/services/${r.services[0].slug}`, { replace: false })
          }
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchParams, navigate])

  const handleSearch = e => {
    e.preventDefault()
    if (query.trim()) setSearchParams({ q: query.trim() })
  }

  const { services, projects, careers, insights, podcasts, team } = results
  const totalResults = services.length + projects.length + careers.length + insights.length + podcasts.length + team.length
  const primaryService = services.length > 0 ? services[0] : null

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717] min-h-[80vh] flex flex-col justify-between">

      {/* ── Top Header & Search Bar ── */}
      <div>
        <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-white">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-[11px] font-bold tracking-widest uppercase text-[#07558F] mb-2">
              Full-Site Directory Search
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight">
              Search Neevevera
            </h1>
            <p className="mt-2 text-sm text-[#6B6B67]">
              Instantly find civil engineering services, completed project dossiers, technical articles, and careers.
            </p>

            <form onSubmit={handleSearch} className="mt-6 flex gap-2">
              <div className="relative flex-1">
                <input
                  id="global-search-input"
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder='Search by keyword: "waterproofing", "civil", "PEB", "piling", "Bhubaneswar", "KIIT"…'
                  className="w-full text-sm font-medium pl-4 pr-10 py-3.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F] transition-colors rounded-xs shadow-2xs"
                />
                <FiSearch className="absolute right-3.5 top-3.5 text-[#6B6B67]" size={18} />
              </div>
              <button
                id="global-search-submit"
                type="submit"
                className="px-7 py-3.5 bg-[#07558F] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#054a7d] transition-colors rounded-xs shadow-xs"
              >
                Search
              </button>
            </form>

            {/* Quick Suggestion Chips */}
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-[#6B6B67]">
              <span className="font-medium mr-1 text-[11px] uppercase tracking-wider">Suggested:</span>
              {POPULAR_SEARCHES.map(item => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setQuery(item)
                    setSearchParams({ q: item })
                  }}
                  className="px-2.5 py-1 bg-[#F2EFE9] hover:bg-[#E5E3DC] text-[#444440] hover:text-[#111822] transition-colors rounded-xs text-[11px] font-medium"
                >
                  {item}
                </button>
              ))}
            </div>

            {q && !loading && (
              <div className="mt-4 pt-3 border-t border-[#E5E4DE] text-xs font-medium text-[#6B6B67] flex items-center justify-between">
                <div>
                  {totalResults > 0
                    ? <>Found <span className="font-bold text-[#111822]">{totalResults}</span> result{totalResults !== 1 ? 's' : ''} across the site for <span className="font-bold text-[#07558F]">"{q}"</span></>
                    : <>No direct matches found for <span className="font-bold text-[#111822]">"{q}"</span></>
                  }
                </div>
                {totalResults > 0 && (
                  <button
                    onClick={() => { setQuery(''); setSearchParams({}) }}
                    className="text-[#07558F] hover:underline text-[11px] font-bold uppercase tracking-wider"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Results Container ── */}
        <section className="py-10">
          <div className="max-w-4xl mx-auto px-6 space-y-9">

            {loading ? (
              <div className="flex flex-col items-center py-20 gap-3 text-[#07558F]">
                <div className="w-7 h-7 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-semibold uppercase tracking-wider animate-pulse">Searching across Neevevera...</span>
              </div>

            ) : !q ? (
              <div className="text-center py-16 bg-white border border-[#D8D8D2] p-8 rounded-xs shadow-2xs">
                <FiSearch size={36} className="mx-auto text-[#07558F]/40 mb-4" />
                <h3 className="font-display text-lg font-bold text-[#111822] uppercase">Universal Engineering Directory</h3>
                <p className="text-xs sm:text-sm text-[#6B6B67] mt-1.5 max-w-md mx-auto leading-relaxed">
                  Enter any service name, material specification, project code, or territory keyword to access specifications directly.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <Link to="/services" className="px-4 py-2 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054a7d]">
                    Browse All Services →
                  </Link>
                  <Link to="/projects" className="px-4 py-2 bg-[#F2EFE9] text-[#111822] text-xs font-bold uppercase tracking-wider hover:bg-[#E5E3DC]">
                    Browse Project Registry →
                  </Link>
                </div>
              </div>

            ) : totalResults === 0 ? (
              <div className="text-center py-16 bg-white border border-[#D8D8D2] p-8 rounded-xs shadow-2xs">
                <FiSearch size={36} className="mx-auto text-[#D8D8D2] mb-4" />
                <h3 className="font-display text-lg font-bold text-[#111822] uppercase">No Direct Results for "{q}"</h3>
                <p className="text-xs sm:text-sm text-[#6B6B67] mt-1.5 max-w-md mx-auto leading-relaxed">
                  Try searching broader terms like <span className="font-bold text-[#07558F]">civil, piling, waterproofing, PEB, commercial, or Odisha</span>.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => { setQuery('civil'); setSearchParams({ q: 'civil' }) }}
                    className="px-4 py-2 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054a7d]"
                  >
                    Search "Civil" →
                  </button>
                  <Link to="/contact" className="px-4 py-2 bg-[#F2EFE9] text-[#111822] text-xs font-bold uppercase tracking-wider hover:bg-[#E5E3DC]">
                    Consult Engineering Desk
                  </Link>
                </div>
              </div>

            ) : (
              <>

                {/* ── DIRECT SERVICE MATCH HERO (If a service matched the query) ── */}
                {primaryService && (
                  <div className="bg-gradient-to-r from-[#07558F]/10 via-[#FAF9F6] to-white border-2 border-[#07558F] p-6 rounded-xs shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-widest text-[#07558F] mb-1">
                          <FiCheckCircle size={13} className="text-[#07558F]" />
                          <span>Direct Service Match for "{q}"</span>
                        </div>
                        <h2 className="font-display text-xl font-extrabold text-[#111822] uppercase leading-tight">
                          {primaryService.title}
                        </h2>
                        <p className="text-xs text-[#555550] mt-1 max-w-2xl leading-relaxed">
                          {primaryService.shortDescription || primaryService.description}
                        </p>
                      </div>
                      <Link
                        to={`/services/${primaryService.slug}`}
                        className="px-5 py-3 bg-[#07558F] hover:bg-[#054a7d] text-white text-xs font-bold uppercase tracking-wider inline-flex items-center gap-2 shrink-0 rounded-xs shadow-xs transition-colors"
                      >
                        <span>Open Service Dossier</span>
                        <FiExternalLink size={14} />
                      </Link>
                    </div>
                  </div>
                )}

                {/* ── 1. SERVICES (PRIORITY) ── */}
                {services.length > 0 && (
                  <div>
                    <SectionHeader icon={FiSettings} label="Engineering Services" count={services.length} />
                    <div className="space-y-3">
                      {services.map(s => (
                        <ResultCard
                          key={s.id || s.slug}
                          to={`/services/${s.slug}`}
                          image={s.image}
                          badge={s.category || s.badge}
                          badgeColor="#07558F"
                          title={s.title}
                          description={s.shortDescription || s.description}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 2. PROJECTS ── */}
                {projects.length > 0 && (
                  <div>
                    <SectionHeader icon={FiFolder} label="Projects & Undertakings" count={projects.length} />
                    <div className="space-y-3">
                      {projects.map(p => (
                        <ResultCard
                          key={p.id || p.slug}
                          to={`/projects/${p.slug}`}
                          image={p.image}
                          badge={p.category || p.badge}
                          badgeColor="#075638"
                          meta={p.location}
                          title={p.title || p.name}
                          description={p.summary || p.description}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 3. TECHNICAL INSIGHTS ── */}
                {insights.length > 0 && (
                  <div>
                    <SectionHeader icon={FiBookOpen} label="Technical Insights & Articles" count={insights.length} />
                    <div className="space-y-3">
                      {insights.map(item => (
                        <ResultCard
                          key={item.id || item.slug}
                          to={`/insights/${item.slug}`}
                          image={item.image}
                          badge={item.category || item.badge || 'Insight'}
                          meta={item.date}
                          title={item.title}
                          description={item.excerpt || item.description}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 4. CAREERS ── */}
                {careers.length > 0 && (
                  <div>
                    <SectionHeader icon={FiBriefcase} label="Career Vacancies" count={careers.length} />
                    <div className="space-y-3">
                      {careers.map(c => (
                        <ResultCard
                          key={c.id || c.slug}
                          to={`/careers/${c.slug}`}
                          badge={c.department || c.badge}
                          badgeColor="#8C6207"
                          meta={c.location}
                          title={c.title}
                          description={c.description}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 5. PODCASTS ── */}
                {podcasts.length > 0 && (
                  <div>
                    <SectionHeader icon={FiMic} label="Audio Dispatches & Podcasts" count={podcasts.length} />
                    <div className="space-y-3">
                      {podcasts.map(p => (
                        <ResultCard
                          key={p.id || p.slug}
                          to="/podcast"
                          image={p.image}
                          badge={p.badge}
                          badgeColor="#6B21A8"
                          meta={p.guest ? `Guest: ${p.guest}` : p.date}
                          title={p.title}
                          description={p.description}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── 6. TEAM MEMBERS ── */}
                {team.length > 0 && (
                  <div>
                    <SectionHeader icon={FiUser} label="Leadership Team" count={team.length} />
                    <div className="space-y-3">
                      {team.map(t => (
                        <ResultCard
                          key={t.id}
                          to="/team"
                          image={t.image}
                          badge={t.role || t.badge}
                          title={t.name || t.title}
                          description={t.designation + (t.description ? ` — ${t.description}` : '')}
                        />
                      ))}
                    </div>
                  </div>
                )}

              </>
            )}

            {/* ── Quick Exploration Footer when results are sparse ── */}
            {q && totalResults > 0 && totalResults <= 2 && (
              <div className="mt-12 pt-8 border-t border-[#D8D8D2] bg-white p-6 border rounded-xs shadow-2xs">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#07558F] mb-1">
                  Explore More Sectors
                </div>
                <div className="font-display text-sm font-bold text-[#111822] uppercase">
                  Neevevera Core Engineering Verticals
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <Link to="/services/building-civil-construction" className="p-3 bg-[#FAF9F6] border border-[#E5E3DC] hover:border-[#07558F] transition-colors font-semibold text-[#111822] block">
                    Building &amp; Civil Construction →
                  </Link>
                  <Link to="/services/industrial-heavy-facilities" className="p-3 bg-[#FAF9F6] border border-[#E5E3DC] hover:border-[#07558F] transition-colors font-semibold text-[#111822] block">
                    Industrial PEB Facilities →
                  </Link>
                  <Link to="/services/repair-restoration-retrofitting" className="p-3 bg-[#FAF9F6] border border-[#E5E3DC] hover:border-[#07558F] transition-colors font-semibold text-[#111822] block">
                    Waterproofing &amp; Retrofitting →
                  </Link>
                </div>
              </div>
            )}

          </div>
        </section>
      </div>

      {/* Subtle bottom spacing bar */}
      <div className="py-6 text-center text-[11px] text-[#888880] border-t border-[#E5E4DE] bg-white">
        Neevevera Private Limited // Engineering &amp; Construction Directory
      </div>
    </div>
  )
}

export default Search


