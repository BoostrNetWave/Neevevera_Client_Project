import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FiSearch, FiArrowRight } from 'react-icons/fi'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState({ services: [], projects: [], careers: [], insights: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setQuery(searchParams.get('q') || '')
  }, [searchParams])

  useEffect(() => {
    const q = (searchParams.get('q') || '').trim()
    if (!q) { setResults({ services: [], projects: [], careers: [], insights: [] }); return }
    const fetchResults = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`${API}/search`, { params: { q } })
        if (res.data.success) {
          setResults({
            services:  res.data.services  || [],
            projects:  res.data.projects  || [],
            careers:   res.data.careers   || [],
            insights:  res.data.insights  || [],
          })
        }
      } catch (err) {
        console.error('Search failed:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchResults()
  }, [searchParams])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearchParams({ q: query })
  }

  const { services: matchedServices, projects: matchedProjects, careers: matchedCareers, insights: matchedInsights } = results

  const totalResults =
    matchedServices.length +
    matchedProjects.length +
    matchedCareers.length +
    matchedInsights.length


  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717] min-h-[70vh]">
      {/* ── Header & Search Box ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            18 // PORTAL SEARCH
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight">
            Universal Site Search
          </h1>

          <form onSubmit={handleSearch} className="mt-6 flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services, projects, technical papers, job openings..."
                className="w-full text-sm font-medium pl-4 pr-10 py-3 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
              />
              <FiSearch className="absolute right-3.5 top-3.5 text-[#6B6B67]" size={16} />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-[#07558F] text-white font-medium text-xs font-bold uppercase tracking-wider"
            >
              Search
            </button>
          </form>

          {q && (
            <div className="mt-3 text-xs font-medium text-[#6B6B67]">
              Found <span className="font-bold text-[#111822]">{totalResults}</span> matches for "{q}"
            </div>
          )}
        </div>
      </section>

      {/* ── Results ── */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-6 space-y-10">
          {loading ? (
            <div className="text-center py-12 text-[#07558F] font-medium text-xs animate-pulse">
              Searching Neevevera database...
            </div>
          ) : !searchParams.get('q') ? (
            <div className="text-center py-12 text-[#6B6B67] font-medium text-xs">
              Enter a search query above to explore the Neevevera engineering directory.
            </div>
          ) : totalResults === 0 ? (
            <div className="text-center py-12 text-[#6B6B67] font-medium text-xs">
              No matching records found for "{searchParams.get('q')}". Try searching for terms like "piling", "PEB", "tower", "viaduct", or "civil".
            </div>
          ) : (
            <>
              {/* Projects */}
              {matchedProjects.length > 0 && (
                <div>
                  <h3 className="font-medium text-xs font-bold uppercase text-[#07558F] pb-2 border-b border-[#D8D8D2] mb-4">
                    PROJECTS ({matchedProjects.length})
                  </h3>
                  <div className="space-y-3">
                    {matchedProjects.map((p) => (
                      <Link
                        key={p.id}
                        to={`/projects/${p.slug}`}
                        className="block p-4 bg-white border border-[#D8D8D2] hover:border-[#07558F] transition-all group"
                      >
                        <div className="flex items-center justify-between text-[10px] font-medium text-[#6B6B67]">
                          <span className="text-[#07558F] font-bold uppercase">{p.category}</span>
                          <span>{p.location}</span>
                        </div>
                        <div className="font-display font-bold text-base text-[#111822] group-hover:text-[#07558F] mt-1">
                          {p.title}
                        </div>
                        <p className="text-xs text-[#444440] mt-1 line-clamp-1">{p.summary}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Services */}
              {matchedServices.length > 0 && (
                <div>
                  <h3 className="font-medium text-xs font-bold uppercase text-[#07558F] pb-2 border-b border-[#D8D8D2] mb-4">
                    SERVICES ({matchedServices.length})
                  </h3>
                  <div className="space-y-3">
                    {matchedServices.map((s) => (
                      <Link
                        key={s.id}
                        to={`/services/${s.slug}`}
                        className="block p-4 bg-white border border-[#D8D8D2] hover:border-[#07558F] transition-all group"
                      >
                        <div className="font-display font-bold text-base text-[#111822] group-hover:text-[#07558F]">
                          {s.title}
                        </div>
                        <p className="text-xs text-[#444440] mt-1 line-clamp-2">{s.shortDescription}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Insights */}
              {matchedInsights.length > 0 && (
                <div>
                  <h3 className="font-medium text-xs font-bold uppercase text-[#07558F] pb-2 border-b border-[#D8D8D2] mb-4">
                    TECHNICAL INSIGHTS ({matchedInsights.length})
                  </h3>
                  <div className="space-y-3">
                    {matchedInsights.map((item) => (
                      <Link
                        key={item.id}
                        to={`/insights/${item.slug}`}
                        className="block p-4 bg-white border border-[#D8D8D2] hover:border-[#07558F] transition-all group"
                      >
                        <div className="text-[10px] font-medium text-[#07558F] uppercase font-bold">
                          {item.category} • {item.date}
                        </div>
                        <div className="font-display font-bold text-base text-[#111822] group-hover:text-[#07558F] mt-1">
                          {item.title}
                        </div>
                        <p className="text-xs text-[#444440] mt-1 line-clamp-2">{item.excerpt}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Careers */}
              {matchedCareers.length > 0 && (
                <div>
                  <h3 className="font-medium text-xs font-bold uppercase text-[#07558F] pb-2 border-b border-[#D8D8D2] mb-4">
                    CAREER VACANCIES ({matchedCareers.length})
                  </h3>
                  <div className="space-y-3">
                    {matchedCareers.map((c) => (
                      <Link
                        key={c.id}
                        to={`/careers/${c.slug}`}
                        className="block p-4 bg-white border border-[#D8D8D2] hover:border-[#07558F] transition-all group"
                      >
                        <div className="text-[10px] font-medium text-[#075638] uppercase font-bold">
                          {c.department} • {c.location}
                        </div>
                        <div className="font-display font-bold text-base text-[#111822] group-hover:text-[#07558F] mt-1">
                          {c.title}
                        </div>
                        <p className="text-xs text-[#444440] mt-1 line-clamp-1">{c.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

export default Search
