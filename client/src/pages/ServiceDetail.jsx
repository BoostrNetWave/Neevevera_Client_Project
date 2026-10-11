import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiShield, FiFileText } from 'react-icons/fi'
import axios from 'axios'
import { services as mockServices } from '../data/mockData'

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
          axios.get(`http://localhost:5000/api/services/${slug}`),
          axios.get(`http://localhost:5000/api/services?limit=10`)
        ])
        if (resService.data.success && resService.data.data) {
          const s = resService.data.data
          setService({
            id: s._id,
            slug: s.slug,
            title: s.title,
            category: s.category,
            shortDescription: s.shortDescription || (s.description ? s.description.substring(0, 100) + '...' : ''),
            description: s.description,
            image: s.coverImage || '/placeholder.jpg',
            features: s.features || [],
            benefits: s.process || [], // Using process from DB as benefits
            priceNote: s.priceNote || ''
          })
        }
        
        if (resAll.data.success && resAll.data.items) {
          const liveOthers = resAll.data.items.map(s => ({
            _id: s._id,
            slug: s.slug,
            title: s.title
          }))
          setOtherServices([
            ...liveOthers,
            ...mockServices.filter(mock => !liveOthers.some(live => live.slug === mock.slug))
          ])
        }
      } catch (err) {
        // Fallback to mock data
        const mockMatch = mockServices.find(s => s.slug === slug)
        if (mockMatch) {
          setService({
            ...mockMatch,
            image: mockMatch.image || '/placeholder.jpg'
          })
          setOtherServices(mockServices.map(s => ({ _id: s.id, slug: s.slug, title: s.title })))
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
      <div className="w-full min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#171717]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium uppercase tracking-widest text-[#07558F]">Loading Service...</p>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-[#171717] px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-[#111822] mb-2">Service Not Found</h1>
        <Link to="/services" className="px-6 py-3 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054373]">
          Return to Directory
        </Link>
      </div>
    )
  }

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
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between text-xs font-medium">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-[#07558F] hover:underline font-bold uppercase"
          >
            <FiArrowLeft size={13} />
            <span>Return to Services Directory</span>
          </Link>
          <div className="text-[#6B6B67]">
            VERTICAL CODE: <span className="font-bold text-[#111822]">SRV-{service.order || 1}</span>
          </div>
        </div>
      </div>

      {/* ── Service Header ── */}
      <section className="border-b border-[#D8D8D2] py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="text-xs font-medium font-bold uppercase text-[#07558F] mb-2">
                ENGINEERING SERVICE VERTICAL // {service.order || 1}
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
                {service.title}
              </h1>
              <div className="text-sm sm:text-base text-[#444440] mt-3 max-w-3xl leading-relaxed whitespace-pre-line">
                {service.description}
              </div>
            </div>

            <Link
              to="/contact"
              className="px-6 py-3.5 bg-[#07558F] hover:bg-[#054373] text-white font-medium text-xs font-bold uppercase tracking-wider shrink-0"
            >
              Request Service BOQ &amp; Estimate
            </Link>
          </div>
        </div>
      </section>

      {/* ── Visual Banner ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-10">
        <div className="relative aspect-[21/9] w-full overflow-hidden border border-[#D8D8D2] bg-neutral-900 shadow-sm">
          <img
            src={service.image || '/placeholder.jpg'}
            alt={service.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm text-white px-4 py-2 font-medium text-xs">
            TECHNICAL FIELD STAGING RECORD
          </div>
        </div>
      </section>

      {/* ── Core Details & Methodology ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main 8 cols */}
          <div className="lg:col-span-8 space-y-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#111822] pb-3 border-b border-[#D8D8D2]">
                Detailed Technical Scope &amp; Methodology
              </h2>
              <p className="mt-4 text-sm text-[#444440] leading-relaxed">
                Neevevera executes {service.title} with full turnkey responsibility. From pre-construction geotechnical surveys and structural calculations to the final issuance of occupancy and load-bearing certificates, every stage is executed by chartered civil engineers.
              </p>
            </div>

            <div>
              <h3 className="font-display text-lg font-bold text-[#111822] mb-4">
                Specific Technical Deliverables
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(service.benefits && service.benefits.length > 0 ? service.benefits : []).map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3.5 bg-white border border-[#D8D8D2] text-xs font-medium">
                    <FiCheckCircle className="text-[#075638] shrink-0 mt-0.5" size={14} />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* QA/QC Protocols */}
            <div>
              <h3 className="font-display text-lg font-bold text-[#111822] mb-3">
                Director-Led Quality Assurance Protocol
              </h3>
              <div className="p-4 bg-[#F2EFE9] border border-[#D8D8D2] text-xs text-[#444440] leading-relaxed space-y-2">
                <p>
                  1. Pre-pour verification of shuttering, formwork alignment, and rebar covers under laser measurement.
                </p>
                <p>
                  2. Slump cone testing and continuous temperature monitoring for all RMC trucks entering the site.
                </p>
                <p>
                  3. NABL-accredited 7-day and 28-day concrete cube compression testing archived in project dossier.
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-[#D8D8D2] bg-white p-6 shadow-xs">
              <div className="font-medium text-xs font-bold uppercase text-[#07558F] pb-3 border-b border-[#E5E3DC]">
                ENGAGEMENT PARAMETERS
              </div>

              <div className="mt-4 space-y-3 font-medium text-xs">
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">SERVICE ID</span>
                  <span className="font-bold text-[#111822]">SRV-{service.order || 1}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">CONTRACT TYPE</span>
                  <span className="font-bold text-[#111822]">EPC / Item Rate / BOQ</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">STANDARDS</span>
                  <span className="font-bold text-[#07558F]">IS 456 / IS 800 / NBC</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">AUDIT CYCLE</span>
                  <span className="font-bold text-[#075638]">Milestone Audited</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E3DC]">
                <Link
                  to="/contact"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#07558F] text-white text-xs font-medium font-bold uppercase"
                >
                  <span>Request RFQ for this Service</span>
                  <FiArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Other Services link */}
            <div className="border border-[#D8D8D2] bg-[#FAF9F6] p-4 text-xs">
              <div className="font-medium font-bold uppercase text-[#111822] mb-2">Other Key Services</div>
              <ul className="space-y-1.5 font-medium text-[#6B6B67]">
                {otherServices.filter((s) => s._id !== service._id).slice(0, 4).map((s) => (
                  <li key={s._id}>
                    <Link to={`/services/${s.slug}`} className="hover:text-[#07558F]">
                      → {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ServiceDetail
