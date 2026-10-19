import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiBriefcase, FiMapPin, FiClock, FiCheckCircle } from 'react-icons/fi'
import { careers as mockCareers } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Careers = () => {
  const [filterDept, setFilterDept] = useState('ALL')
  const [liveCareers, setLiveCareers] = useState([])

  useEffect(() => {
    const fetchCareers = async () => {
      try {
        const res = await axios.get(`${API}/careers`, { params: { limit: 100 } })
        const rawJobs = res.data.data || res.data.items;
        if (res.data.success && Array.isArray(rawJobs)) {
          const formatted = rawJobs.map(c => ({
            id: c._id,
            slug: c.slug,
            title: c.title,
            department: c.department,
            location: c.location,
            type: c.type,
            experience: c.experience,
            excerpt: c.description?.substring(0, 100) + '...',
            description: c.description,
            requirements: c.requirements || [],
            benefits: c.benefits || []
          }))
          setLiveCareers(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch careers:', err)
      }
    }
    fetchCareers()
  }, [])

  const allCareers = [
    ...liveCareers,
    ...mockCareers.filter(mock => !liveCareers.some(live => live.slug === mock.slug))
  ]

  const departments = ['ALL', 'Engineering', 'Quality & HSE', 'Project Management']

  const filteredCareers =
    filterDept === 'ALL'
      ? allCareers
      : allCareers.filter((c) => c.department.toLowerCase().includes(filterDept.toLowerCase()))

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            10 // HUMAN CAPITAL
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Careers &amp; Field Opportunities
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            Build your civil engineering and construction career with Neevevera. We offer structured technical mentorship, competitive regional compensation, and direct site leadership experience.
          </p>
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <section className="border-b border-[#D8D8D2] bg-white sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setFilterDept(dept)}
                className={`px-3.5 py-1 text-xs font-medium font-bold uppercase tracking-wider transition-colors rounded-sm ${
                  filterDept === dept
                    ? 'bg-[#07558F] text-white'
                    : 'bg-[#F2EFE9] text-[#6B6B67] hover:text-[#111822]'
                }`}
              >
                {dept}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-[#6B6B67]">
            OPEN POSITIONS: <span className="font-bold text-[#111822]">{filteredCareers.length} VACANCIES</span>
          </div>
        </div>
      </section>

      {/* ── Job Listings ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="space-y-6">
            {filteredCareers.map((job) => (
              <div
                key={job.id}
                className="border border-[#D8D8D2] bg-white p-6 hover:border-[#07558F] transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xs hover:shadow-sm"
              >
                <div className="space-y-2 max-w-2xl">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium">
                    <span className="bg-[#07558F]/10 text-[#07558F] px-2.5 py-0.5 font-bold uppercase rounded-xs">
                      {job.department}
                    </span>
                    <span className="text-[#6B6B67] flex items-center gap-1">
                      <FiMapPin size={12} /> {job.location}
                    </span>
                    <span className="text-[#6B6B67] flex items-center gap-1">
                      <FiClock size={12} /> {job.type}
                    </span>
                    <span className="text-[#075638] font-bold">
                      Exp: {job.experience}
                    </span>
                  </div>

                  <h3 className="font-display text-xl font-bold text-[#111822]">
                    {job.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-[#444440] leading-relaxed">
                    {job.description}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    to={`/careers/${job.slug}`}
                    className="px-5 py-2.5 bg-white border border-[#D8D8D2] hover:bg-[#F2EFE9] text-xs font-medium font-bold uppercase text-[#111822] transition-colors"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/careers/${job.slug}/apply`}
                    className="px-5 py-2.5 bg-[#07558F] hover:bg-[#054373] text-white text-xs font-medium font-bold uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Apply Now
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Careers
