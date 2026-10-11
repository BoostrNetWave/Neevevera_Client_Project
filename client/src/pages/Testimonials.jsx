import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiShield, FiArrowRight } from 'react-icons/fi'
import { testimonials as mockTestimonials } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Testimonials = () => {
  const [liveTestimonials, setLiveTestimonials] = useState([])

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const res = await axios.get(`${API}/testimonials`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          const formatted = res.data.items.map(t => ({
            id: t._id,
            projectRef: t.projectRef,
            review: t.review,
            clientName: t.clientName,
            clientDesignation: t.clientDesignation,
            clientOrganization: t.clientOrganization
          }))
          setLiveTestimonials(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch testimonials:', err)
      }
    }
    fetchTestimonials()
  }, [])

  const allTestimonials = [
    ...liveTestimonials,
    ...mockTestimonials.filter(mock => !liveTestimonials.some(live => live.clientName === mock.clientName))
  ]

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            09 // CLIENT ENDORSEMENTS
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Client Testimonials &amp; Site Audits
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            Direct assessments from institutional developers, public works departments, and industrial plant directors who have commissioned Neevevera for their structural projects.
          </p>
        </div>
      </section>

      {/* ── Testimonials Grid ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {allTestimonials.map((t) => (
              <div
                key={t.id}
                className="border border-[#D8D8D2] bg-white p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all rounded-xs"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-medium text-[#07558F] font-bold uppercase mb-3">
                    <span>{t.projectRef || t.project}</span>
                    <span className="text-[#075638] flex items-center gap-1">
                      <FiCheckCircle size={12} /> Verified
                    </span>
                  </div>

                  <p className="text-sm text-[#444440] italic leading-relaxed">
                    "{t.review || t.quote}"
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E5E3DC]">
                  <div className="font-bold text-sm text-[#111822]">{t.clientName}</div>
                  <div className="text-xs text-[#6B6B67]">{t.clientDesignation || t.role}</div>
                  <div className="text-xs font-medium font-bold text-[#075638] mt-1">{t.clientOrganization || t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Audit Guarantee ── */}
      <section className="py-12 bg-[#F2EFE9] border-t border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <FiShield className="text-[#07558F] text-3xl shrink-0" />
            <div>
              <h4 className="font-display text-base font-bold text-[#111822]">
                100% Performance Guarantee on Turnkey Works
              </h4>
              <p className="text-xs text-[#6B6B67] font-medium">
                Structural warranty certificates backed by third-party testing and chartered engineering compliance.
              </p>
            </div>
          </div>

          <Link
            to="/contact"
            className="px-6 py-3 bg-[#07558F] text-white font-medium text-xs font-bold uppercase tracking-wider shrink-0"
          >
            Start Your Project
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Testimonials
