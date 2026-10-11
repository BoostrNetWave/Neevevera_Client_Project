import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiClock, FiCalendar, FiSearch, FiBookmark, FiExternalLink, FiSend } from 'react-icons/fi'
import { insights as mockInsights } from '../data/mockData'
import NewsletterCTA from '../components/NewsletterCTA'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const FALLBACK_IMAGE =
  'https://images.pexels.com/photos/1078884/pexels-photo-1078884.jpeg?auto=compress&cs=tinysrgb&w=1200'

const CATEGORIES = [
  { key: 'ALL',               label: '01 // All Articles' },
  { key: 'Geotechnical',      label: '02 // Geotechnical & Foundation' },
  { key: 'Structural',        label: '03 // Structural Analysis' },
  { key: 'Materials',         label: '04 // Materials & Mix Design' },
  { key: 'Coastal',           label: '05 // Coastal & Marine Works' },
  { key: 'Industry Analysis', label: '06 // Industry & Statutory Codes' },
]

// Maps the admin panel's category values to this page's filter keys.
// Adjust the right-hand side if you want different groupings.
const CATEGORY_MAP = {
  'company-update':    'Industry Analysis',
  'project-update':    'Industry Analysis',
  'industry-news':     'Industry Analysis',
  'construction-tips': 'Materials',
  'engineering':       'Structural',
  'maintenance':       'Structural',
}

const externalNews = [
  {
    source: 'PUBLIC CIRCULAR // MoRTH',
    title: 'Ministry of Road Transport & Highways Releases 5th Revision of Bridge Construction Specifications',
    desc: 'Updated mandates on high-performance concrete durability indicators, pre-stressing tendon corrosion mitigation, and mandatory elastomeric bearing testing.',
  },
  {
    source: 'TECHNICAL DRAFT // BIS IS-1893',
    title: 'Bureau of Indian Standards Updates Seismic Hazard Map Draft for Eastern Seaboard',
    desc: 'Proposed micro-zonation adjustments impacting foundation shear modulus standards for coastal structures along the Odisha and Andhra coastlines.',
  },
  {
    source: 'GAZETTE NOTIFICATION // CPWD',
    title: 'Central Public Works Department Notifies Updated Schedule of Rates (DSR)',
    desc: 'Standardized baseline cost adjustments reflecting market fluctuations in cementitious stabilizers, high-tensile TMT rebar, and specialized heavy formwork.',
  },
]

const stripHtml = (html = '') =>
  html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()

const estimateReadTime = (html = '') => {
  const words = stripHtml(html).split(' ').filter(Boolean).length
  return `${Math.max(1, Math.round(words / 200))} min read`
}

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''

const Insights = () => {
  const [selectedCat, setSelectedCat] = useState('ALL')
  const [search, setSearch] = useState('')
  const [liveInsights, setLiveInsights] = useState([])

  useEffect(() => {
    let mounted = true

    const fetchInsights = async () => {
      try {
        const res = await axios.get(`${API}/blog`, { params: { limit: 100, isPublished: true } })
        const list = res.data?.items || res.data?.data || []

        const formatted = list.map((a) => ({
          id: a._id,
          slug: a.slug,
          title: a.title || '',
          excerpt: a.excerpt || (stripHtml(a.content) ? stripHtml(a.content).substring(0, 150) + '...' : ''),
          category: CATEGORY_MAP[a.category] || a.category || 'Industry Analysis',
          coverImage: a.coverImage || '',
          date: formatDate(a.publishedAt || a.createdAt),
          readTime: a.readTime || estimateReadTime(a.content),
          author: a.author || 'Neevevera Technical Cell',
        }))

        if (mounted) setLiveInsights(formatted)
      } catch (err) {
        console.error('Failed to fetch insights:', err)
      }
    }

    fetchInsights()
    return () => {
      mounted = false
    }
  }, [])

  // Live articles first, then mock data
  const allInsights = useMemo(
    () => {
      const mockArray = Array.isArray(mockInsights) ? mockInsights : []
      return [
        ...liveInsights,
        ...mockArray.filter(mock => !liveInsights.some(live => live.slug === mock.slug))
      ]
    },
    [liveInsights]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allInsights.filter((item) => {
      if (selectedCat !== 'ALL' && item.category !== selectedCat) return false
      if (q) {
        const inTitle = (item.title || '').toLowerCase().includes(q)
        const inExcerpt = (item.excerpt || '').toLowerCase().includes(q)
        if (!inTitle && !inExcerpt) return false
      }
      return true
    })
  }, [allInsights, selectedCat, search])

  const featured = filtered[0]
  const gridItems = filtered.slice(1)

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">

      {/* ── MASTHEAD HEADER ── */}
      <section className="border-b border-[#D8D8D2] pt-14 pb-12 bg-gradient-to-b from-[#F2EFE9]/60 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Volume strip */}
          <div className="flex items-center justify-between mb-6 text-[11px] font-bold uppercase tracking-widest">
            <nav className="flex items-center gap-2 text-[#6B6B67]">
              <Link to="/" className="hover:text-[#07558F] transition-colors">Home</Link>
              <span className="text-[#D8D8D2]">/</span>
              <span className="text-[#07558F]">Technical Journal & Newsroom</span>
            </nav>
            <div className="hidden sm:flex items-center gap-4 text-[#6B6B67]">
              <span className="flex items-center gap-1.5 text-[#07558F]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#07558F] animate-pulse" />
                VOLUME VI // ISSUE 01-2025
              </span>
              <span className="hidden md:inline">ISSN: 2710-8910</span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#07558F]">
                <span className="material-symbols-outlined text-[16px]">menu_book</span>
                Engineering Journal & Field Intelligence
              </div>
              <h1 className="font-display font-extrabold text-4xl sm:text-5xl text-[#111822] tracking-tight">
                Insights & Technical Perspectives
              </h1>
              <p className="text-base text-[#444440] leading-relaxed max-w-2xl">
                Civil engineering methodology, regional infrastructure analyses, building diagnostic protocols, and statutory compliance directives curated by Neevevera's Technical Directorate.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <a href="#newsletter-digest" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#111822] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#07558F] transition-colors rounded-sm shadow-sm">
                <FiSend size={14} />Subscribe to Digest
              </a>
              <a href="#category-filter" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-[#D8D8D2] text-[#111822] text-xs font-bold uppercase tracking-wider hover:border-[#07558F] transition-colors rounded-sm">
                Browse by Topic
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY FILTER RIBBON ── */}
      <section className="border-b border-[#D8D8D2] bg-white sticky top-20 z-30 shadow-sm" id="category-filter">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3">
          <div className="flex items-center gap-2 overflow-x-auto">
            {CATEGORIES.map(({ key: catKey, label: catLabel }) => (
              <button
                key={catKey}
                onClick={() => setSelectedCat(catKey)}
                className={`whitespace-nowrap px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors rounded-sm ${
                  selectedCat === catKey
                    ? 'bg-[#111822] text-white shadow-sm'
                    : 'bg-[#F2EFE9] text-[#6B6B67] hover:text-[#111822] hover:bg-[#E8E5DF]'
                }`}
              >
                {catLabel}
              </button>
            ))}
            <div className="relative ml-auto shrink-0">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-48 text-xs pl-3 pr-8 py-1.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
              />
              <FiSearch className="absolute right-2.5 top-2 text-[#6B6B67]" size={13} />
            </div>
          </div>
        </div>
      </section>

      {/* ── HERO FEATURE ARTICLE (first filtered item) ── */}
      {featured && (
        <section className="py-14 border-b border-[#D8D8D2]">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="flex items-center justify-between mb-5 text-[11px] font-bold uppercase tracking-widest">
              <span className="text-[#07558F]">Feature Article // Technical Deep-Dive</span>
              <span className="text-[#6B6B67]">REF: NVV-TECH-2025-0819</span>
            </div>
            <article className="bg-white border border-[#D8D8D2] overflow-hidden grid grid-cols-1 lg:grid-cols-12 group transition-shadow hover:shadow-lg rounded-sm">
              <div className="lg:col-span-7 relative min-h-[340px] lg:min-h-[460px] overflow-hidden bg-[#D8D8D2]">
                <img
                  src={featured.coverImage || FALLBACK_IMAGE}
                  alt={featured.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#111822]/80 via-[#111822]/40 to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 text-white space-y-1">
                  <span className="text-[11px] uppercase tracking-widest text-[#B9923B] font-bold block">
                    <span className="material-symbols-outlined text-[14px] align-middle mr-1">location_on</span>
                    Field Study // {featured.category}
                  </span>
                  <p className="text-sm text-white/80 leading-snug line-clamp-2">{featured.excerpt}</p>
                </div>
                <div className="absolute top-4 left-4 bg-[#111822]/90 backdrop-blur-sm text-[#B9923B] text-[10px] font-bold px-3 py-1 uppercase tracking-widest rounded-sm">
                  Whitepaper // Feature Monograph
                </div>
              </div>
              <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-1 bg-[#07558F]/10 text-[#07558F] text-[10px] font-bold uppercase rounded-sm">{featured.category}</span>
                    <span className="px-2.5 py-1 bg-[#B9923B]/10 text-[#B9923B] text-[10px] font-bold uppercase rounded-sm">Deep Dive Research</span>
                  </div>
                  <h2 className="font-display text-xl lg:text-2xl font-bold text-[#111822] leading-snug group-hover:text-[#07558F] transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-[#6B6B67] leading-relaxed line-clamp-4">{featured.excerpt}</p>
                  <div className="grid grid-cols-2 gap-3 p-4 bg-[#F4F2EC] border border-[#D8D8D2] rounded-sm">
                    <div>
                      <span className="block text-[10px] text-[#6B6B67] uppercase font-bold tracking-wider">Read Time</span>
                      <span className="text-base font-bold text-[#07558F]">{featured.readTime}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-[#6B6B67] uppercase font-bold tracking-wider">Published</span>
                      <span className="text-base font-bold text-[#111822]">{featured.date}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-5 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-[#6B6B67]">
                    <span className="font-bold text-[#111822]">By: {featured.author}</span>
                    <span>{featured.date} • {featured.readTime}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/insights/${featured.slug}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#111822] hover:bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm"
                    >
                      Read Full Technical Monograph
                      <FiArrowRight size={14} />
                    </Link>
                    <button
                      type="button"
                      className="p-2.5 border border-[#D8D8D2] text-[#6B6B67] hover:text-[#111822] hover:border-[#111822] transition-colors rounded-sm"
                    >
                      <FiBookmark size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>
      )}

      {/* ── ARTICLES GRID ── */}
      <section className="py-14 border-b border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-10">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#07558F] mb-1">
                <span className="w-2 h-2 rounded-full bg-[#07558F]" />Peer-Reviewed Field Monographs
              </div>
              <h2 className="font-display text-2xl font-bold text-[#111822] tracking-tight">Curated Technical Publications</h2>
            </div>
            <div className="text-[11px] font-bold text-[#6B6B67] uppercase tracking-wider">
              Showing {filtered.length} Article{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-[#6B6B67] text-sm">No articles match your filter.</div>
          ) : gridItems.length === 0 ? (
            <div className="py-10 text-center text-[#6B6B67] text-sm">
              That's the only article in this view.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {gridItems.map((item, idx) => (
                <article
                  key={item.id || item.slug || idx}
                  className="bg-white border border-[#D8D8D2] hover:border-[#111822] hover:shadow-md transition-all flex flex-col justify-between group rounded-sm overflow-hidden"
                >
                  <div>
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-[#D8D8D2]">
                      <img
                        src={item.coverImage || FALLBACK_IMAGE}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 bg-[#111822]/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                        {item.category}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex items-center gap-3 text-[11px] font-bold text-[#6B6B67] mb-2">
                        <span className="flex items-center gap-1"><FiCalendar size={11} />{item.date}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><FiClock size={11} />{item.readTime}</span>
                      </div>
                      <h3 className="font-display text-base font-bold text-[#111822] group-hover:text-[#07558F] transition-colors leading-snug line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[#6B6B67] mt-2 line-clamp-3 leading-relaxed">{item.excerpt}</p>
                      {/* Technical detail tag */}
                      <div className="mt-3 p-2.5 bg-[#F4F2EC] border border-[#D8D8D2] flex items-center justify-between text-[10px] font-bold text-[#6B6B67] uppercase tracking-wide rounded-sm">
                        <span>Standard: IS 456:2000</span>
                        <span className="text-[#07558F]">{item.readTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-0 flex items-center justify-between">
                    <div className="text-[11px] text-[#6B6B67]">
                      By: <span className="font-bold text-[#111822]">{item.author}</span>
                    </div>
                    <Link
                      to={`/insights/${item.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold uppercase text-[#07558F] hover:text-[#054373]"
                    >
                      Read Paper <FiArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── EXTERNAL INDUSTRY NEWS ── */}
      <section className="py-14 border-b border-[#D8D8D2] bg-[#F4F2EC]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#07558F] mb-2">
                <span className="material-symbols-outlined text-[16px]">sensors</span>Aggregated Industry Feeds
              </div>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-[#111822] tracking-tight">Industry News & Regulatory Updates</h2>
              <p className="text-sm text-[#6B6B67] mt-2">
                Monitored public tenders, statutory circulars, and standard code amendments from governmental engineering bodies.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-[#D8D8D2] text-[#6B6B67] text-[11px] font-bold uppercase rounded-sm shrink-0">
              <FiExternalLink size={12} />External Sources
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {externalNews.map(({ source, title, desc }) => (
              <div key={source} className="bg-white border border-[#D8D8D2] p-5 flex flex-col justify-between rounded-sm shadow-sm">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#07558F] uppercase">
                    <FiExternalLink size={11} />External Source
                  </div>
                  <h4 className="font-display font-bold text-sm text-[#111822] leading-snug">{title}</h4>
                  <p className="text-xs text-[#6B6B67] leading-relaxed">{desc}</p>
                </div>
                <div className="pt-4 mt-2 border-t border-[#D8D8D2] flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                  <span className="text-[#6B6B67]">{source}</span>
                  <span className="text-[#07558F] hover:underline cursor-pointer">View Directive ↗</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── NEWSLETTER SUBSCRIPTION ── */}
      <div id="newsletter-digest">
        <NewsletterCTA />
      </div>

    </div>
  )
}

export default Insights
