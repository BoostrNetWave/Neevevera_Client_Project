import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiShield, FiFileText } from 'react-icons/fi'
import { services as mockServices } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Services = () => {
  const [filter, setFilter] = useState('ALL')
  const [liveServices, setLiveServices] = useState([])



  useEffect(() => {
    const fetchServices = async () => {
      try {
        const res = await axios.get(`${API}/services`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          const formatted = res.data.items.map((s, idx) => ({
            id: s._id,
            slug: s.slug,
            number: String(idx + 1).padStart(2, '0'),
            title: s.title,
            category: s.category,
            shortDescription: s.shortDescription || (s.description ? s.description.substring(0, 100) + '...' : ''),
            description: s.description,
            image: s.image || '/placeholder.jpg', // Map image from backend
            features: s.features || [],
            benefits: s.process || [], // Map process to benefits for the mock UI
            priceNote: ''
          }))
          setLiveServices(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch services:', err)
      }
    }
    fetchServices()
  }, [])

  // Smart Merge: Show live services first, then pad with mock services (filtering out any mock slugs that match live slugs to avoid duplicates)
  const allServices = [
    ...liveServices,
    ...mockServices.filter(mock => !liveServices.some(live => live.slug === mock.slug))
  ];

  const categories = [
    { id: 'ALL', label: 'All Verticals' },
    { id: 'construction', label: 'Civil Construction' },
    { id: 'consultancy', label: 'PMC & Consultancy' },
    { id: 'rehabilitation', label: 'Retrofitting & Repairs' },
  ]

  const filtered =
    filter === 'ALL'
      ? allServices
      : allServices.filter((s) => s.category === filter || (filter === 'construction' && !s.category))

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-14 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            02 // CORE CAPABILITIES
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Engineering &amp; Construction Verticals
          </h1>
          <p className="text-base sm:text-lg text-[#444440] mt-3 max-w-3xl leading-relaxed font-light">
            Neevevera provides integrated civil, structural, and infrastructure solutions compliant with National Building Code (NBC 2016) and relevant Indian Standards (IS Codes).
          </p>
        </div>
      </section>

      {/* ── Category Filter Bar ── */}
      <section className="border-b border-[#D8D8D2] bg-white sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setFilter(c.id)}
                className={`px-4 py-1.5 text-xs font-medium font-bold uppercase tracking-wider transition-colors rounded-sm ${filter === c.id
                    ? 'bg-[#07558F] text-white shadow-xs'
                    : 'bg-[#F2EFE9] text-[#6B6B67] hover:text-[#111822]'
                  }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-[#6B6B67]">
            CATALOGUE: <span className="font-bold text-[#111822]">{filtered.length} ACTIVE VERTICALS</span>
          </div>
        </div>
      </section>

      {/* ── Services Listing ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((service) => (
              <div
                key={service.id}
                className="border border-[#D8D8D2] bg-white hover:border-[#111822] transition-all flex flex-col justify-between overflow-hidden group shadow-2xs hover:shadow-md"
              >
                <div>
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white font-medium text-[10px] px-2 py-0.5 uppercase tracking-wider">
                      VERTICAL // {service.number}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="font-display text-xl font-bold text-[#111822] group-hover:text-[#07558F] transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-[#444440] mt-2 leading-relaxed">
                      {service.shortDescription}
                    </p>

                    <div className="mt-5 pt-4 border-t border-[#E5E3DC]">
                      <div className="text-[10px] font-medium uppercase text-[#6B6B67] font-bold mb-2">
                        ENGINEERING SCOPE
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#444440]">
                        {service.features.slice(0, 4).map((f, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <FiCheckCircle className="text-[#075638] shrink-0 mt-0.5 text-xs" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-[#F0EFEA] mt-4 flex items-center justify-between">
                  <Link
                    to={`/services/${service.slug}`}
                    className="inline-flex items-center gap-2 text-xs font-medium font-bold uppercase text-[#07558F] group-hover:text-[#054373]"
                  >
                    <span>Inspect Engineering Dossier</span>
                    <FiArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    to="/contact"
                    className="text-[11px] font-medium text-[#6B6B67] hover:text-[#111822] uppercase underline"
                  >
                    Request BOQ
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quality Standard Guarantee ── */}
      <section className="py-12 bg-[#F2EFE9] border-t border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#07558F] text-white flex items-center justify-center rounded-sm shrink-0">
                <FiShield size={24} />
              </div>
              <div>
                <h4 className="font-display text-base font-bold text-[#111822]">
                  Standards &amp; Statutory Compliance Assured
                </h4>
                <p className="text-xs text-[#6B6B67] font-medium">
                  All work conforms strictly to IS 456, IS 800, IS 1893, IRC:112, and NBC 2016 safety parameters.
                </p>
              </div>
            </div>

            <Link
              to="/contact"
              className="px-6 py-3 bg-[#07558F] text-white font-medium text-xs font-bold uppercase tracking-wider shrink-0"
            >
              Consult Chief Estimator
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Services
