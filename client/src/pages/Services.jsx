import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight } from 'react-icons/fi'
import { services as mockServices } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const CATEGORY_LABELS = {
  'construction': 'Construction',
  'building-repair-maintenance': 'Building Repair & Maintenance',
  'design-planning': 'Design and Planning',
  'interior-exterior-solutions': 'Interior & Exterior Solutions',
  'project-management-consultancy': 'Project Management Consultancy',
  'additional-services-platform-features': 'Additional Services',
}

const Services = () => {
  const [liveServices, setLiveServices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API}/services`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          setLiveServices(res.data.items)
        }
      } catch (err) {
        console.error('Failed to fetch services:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchServices()
  }, [])

  // Smart merge: live DB first, then fallback to mock only if no live data
  const allServices = liveServices.length > 0
    ? liveServices
    : mockServices

  // Collect all sub-service tags across all sections for a given service
  const getSubTags = (svc) => {
    const tags = []
    if (svc.sections && svc.sections.length > 0) {
      svc.sections.forEach(sec => {
        if (sec.services && sec.services.length > 0) {
          sec.services.forEach(sub => {
            if (sub.title && sub.isActive !== false) tags.push(sub.title)
          })
        }
      })
    } else if (svc.features && svc.features.length > 0) {
      return svc.features
    }
    return tags
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-14 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-bold tracking-widest uppercase text-[#07558F] mb-2">
            02 // OUR SERVICES
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Engineering &amp; Construction Verticals
          </h1>
          <p className="text-base sm:text-lg text-[#444440] mt-3 max-w-3xl leading-relaxed font-light">
            Six integrated service disciplines — from full structural construction and specialist maintenance, to interior fit-outs and project management — all under one expert team.
          </p>
        </div>
      </section>

      {/* ── Services Grid ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-[#6B6B67]">
              <div className="w-5 h-5 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium uppercase tracking-widest">Loading services...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {allServices.map((service, idx) => {
                const subTags = getSubTags(service)
                const displayNum = service.order ? String(service.order).padStart(2, '0') : String(idx + 1).padStart(2, '0')
                const coverImage = service.image || '/images/client_hero.webp'
                const slug = service.slug
                const title = service.title
                const shortDesc = service.shortDescription || (service.description ? service.description.substring(0, 120) + '...' : '')

                return (
                  <div
                    key={service._id || service.id || slug}
                    className="border border-[#D8D8D2] bg-white hover:border-[#111822] transition-all flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md"
                  >
                    {/* Card Image */}
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900">
                      <img
                        src={coverImage}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white font-bold text-[10px] px-2.5 py-1 uppercase tracking-wider font-mono">
                        {displayNum} // {CATEGORY_LABELS[service.category] || service.category}
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 flex flex-col flex-1">
                      <h3 className="font-display text-xl font-bold text-[#111822] group-hover:text-[#07558F] transition-colors leading-tight">
                        {title}
                      </h3>
                      <p className="text-xs text-[#444440] mt-2.5 leading-relaxed flex-1">
                        {shortDesc}
                      </p>

                      {/* Sub-service tags */}
                      {subTags.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-[#E5E3DC]">
                          <div className="text-[10px] font-bold uppercase tracking-widest text-[#6B6B67] mb-2.5">
                            SCOPE INCLUDES
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {subTags.slice(0, 6).map((tag, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 bg-[#F2EFE9] border border-[#D8D8D2] text-[10px] font-medium text-[#444440] leading-tight"
                              >
                                {tag}
                              </span>
                            ))}
                            {subTags.length > 6 && (
                              <span className="px-2 py-0.5 bg-[#07558F]/8 border border-[#07558F]/20 text-[10px] font-bold text-[#07558F] leading-tight">
                                +{subTags.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Card Footer */}
                      <div className="mt-5 pt-4 border-t border-[#F0EFEA] flex items-center justify-between">
                        <Link
                          to={`/services/${slug}`}
                          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#07558F] hover:text-[#054373] transition-colors"
                        >
                          <span>Explore Services</span>
                          <FiArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                        </Link>
                        <Link
                          to="/contact"
                          className="text-[11px] font-medium text-[#6B6B67] hover:text-[#111822] uppercase underline underline-offset-2"
                        >
                          Request BOQ
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-12 bg-[#F2EFE9] border-t border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-widest text-[#07558F] mb-1">STANDARDS & COMPLIANCE</div>
              <h4 className="font-display text-base font-bold text-[#111822]">
                All Services Comply with NBC 2016, IS Codes &amp; Statutory Requirements
              </h4>
              <p className="text-xs text-[#6B6B67] font-medium mt-1">
                Chartered Engineer oversight on every project. IS 456, IS 800, IS 1893, IRC:112, and CPWD norms.
              </p>
            </div>
            <Link
              to="/contact"
              className="px-6 py-3 bg-[#07558F] text-white font-bold text-xs uppercase tracking-wider shrink-0 hover:bg-[#054373] transition-colors"
            >
              Request a Service BOQ &amp; Estimate
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
