import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiMapPin, FiClock, FiBriefcase } from 'react-icons/fi'
import axios from 'axios'
import { careers as mockCareers } from '../data/mockData'

const JobDetail = () => {
  const { slug } = useParams()
  const [job, setJob] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/careers/${slug}`)
        if (res.data.success && res.data.data) {
          setJob(res.data.data)
        }
      } catch (err) {
        const mockMatch = mockCareers.find(c => c.slug === slug)
        if (mockMatch) {
          setJob(mockMatch)
        } else {
          setError(true)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchJob()
  }, [slug])

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex items-center justify-center text-[#171717]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-[#07558F] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-medium uppercase tracking-widest text-[#07558F]">Loading Role...</p>
        </div>
      </div>
    )
  }

  if (error || !job) {
    return (
      <div className="w-full min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center text-[#171717] px-6 text-center">
        <h1 className="font-display text-2xl font-bold text-[#111822] mb-2">Role Not Found</h1>
        <Link to="/careers" className="px-6 py-3 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#054373]">
          Return to Careers
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>{job.title} — Careers | Neevevera Private Limited</title>
        <meta name="description" content={job.description || `Apply for ${job.title} in ${job.location} with Neevevera.`} />
        <meta property="og:title" content={`${job.title} | Neevevera Careers`} />
        <meta property="og:description" content={job.description || `Apply for ${job.title} in ${job.location} with Neevevera.`} />
      </Helmet>
      {/* ── Breadcrumb ── */}
      <div className="border-b border-[#D8D8D2] bg-[#F2EFE9] py-3">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between text-xs font-medium">
          <Link
            to="/careers"
            className="inline-flex items-center gap-2 text-[#07558F] hover:underline font-bold uppercase"
          >
            <FiArrowLeft size={13} />
            <span>Return to Careers</span>
          </Link>
          <div className="text-[#6B6B67]">
            POSITION REF: <span className="font-bold text-[#111822]">NV-HR-{(job._id || '').slice(-4).toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* ── Job Header ── */}
      <section className="border-b border-[#D8D8D2] py-12 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase mb-2">
                <span className="bg-[#07558F] text-white px-2 py-0.5 font-bold">
                  {job.department}
                </span>
                <span className="text-[#6B6B67] flex items-center gap-1">
                  <FiMapPin size={12} /> {job.location}
                </span>
                <span className="text-[#6B6B67] flex items-center gap-1">
                  <FiClock size={12} /> {job.type}
                </span>
              </div>
              <h1 className="font-display text-3xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
                {job.title}
              </h1>
              <div className="text-sm sm:text-base text-[#444440] mt-3 max-w-3xl leading-relaxed whitespace-pre-line">
                {job.description}
              </div>
            </div>

            <Link
              to={`/careers/${job.slug}/apply`}
              className="px-6 py-3.5 bg-[#07558F] hover:bg-[#054373] text-white font-medium text-xs font-bold uppercase tracking-wider shrink-0"
            >
              Apply for this Position
            </Link>
          </div>
        </div>
      </section>

      {/* ── Responsibilities & Requirements ── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main 8 cols */}
          <div className="lg:col-span-8 space-y-10">
            <div>
              <h2 className="font-display text-2xl font-bold text-[#111822] pb-3 border-b border-[#D8D8D2]">
                Key Responsibilities
              </h2>
              <ul className="mt-4 space-y-3">
                {(job.responsibilities || []).map((resp, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#444440]">
                    <FiCheckCircle className="text-[#075638] shrink-0 mt-1" size={16} />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold text-[#111822] pb-3 border-b border-[#D8D8D2]">
                Candidate Qualifications &amp; Prerequisites
              </h2>
              <ul className="mt-4 space-y-3">
                {(job.requirements || []).map((req, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-[#444440]">
                    <FiCheckCircle className="text-[#07558F] shrink-0 mt-1" size={16} />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-[#D8D8D2] bg-white p-6 shadow-xs">
              <div className="font-medium text-xs font-bold uppercase text-[#07558F] pb-3 border-b border-[#E5E3DC]">
                ROLE SUMMARY
              </div>

              <div className="mt-4 space-y-3 font-medium text-xs">
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">LOCATION</span>
                  <span className="font-bold text-[#111822]">{job.location}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">EXPERIENCE</span>
                  <span className="font-bold text-[#111822]">{job.experience}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">EMPLOYMENT TYPE</span>
                  <span className="font-bold text-[#111822]">{job.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[#F0EFEA]">
                  <span className="text-[#6B6B67]">APPLY BEFORE</span>
                  <span className="font-bold text-[#075638]">{job.closingDate ? new Date(job.closingDate).toLocaleDateString() : 'Open until filled'}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E5E3DC]">
                <Link
                  to={`/careers/${job.slug}/apply`}
                  className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#07558F] text-white text-xs font-medium font-bold uppercase"
                >
                  <span>Submit Application</span>
                  <FiArrowRight size={13} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default JobDetail
