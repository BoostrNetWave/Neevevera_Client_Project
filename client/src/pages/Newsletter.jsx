import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { FiMail, FiDownload, FiCheckCircle, FiArrowRight, FiAlertCircle } from 'react-icons/fi'
import { newsletters as mockNewsletters } from '../data/mockData'
import { useFormSubmit } from '../hooks/useFormSubmit'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Newsletter = () => {
  const { submit, status, errorMsg } = useFormSubmit('/api/newsletter/subscribe')
  const [email, setEmail] = useState('')
  const [liveNewsletters, setLiveNewsletters] = useState([])

  useEffect(() => {
    const fetchNewsletters = async () => {
      try {
        const res = await axios.get(`${API}/newsletter`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          const formatted = res.data.items.map(n => ({
            id: n._id,
            title: n.title,
            excerpt: n.excerpt || n.body?.substring(0, 120) + '...',
            publishedAt: n.publishedAt ? new Date(n.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '',
            pdfUrl: n.pdfUrl,
            isPublished: n.isPublished,
          }))
          setLiveNewsletters(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch newsletters:', err)
      }
    }
    fetchNewsletters()
  }, [])

  const allNewsletters = [...mockNewsletters, ...liveNewsletters]

  const handleSub = async (e) => {
    e.preventDefault()
    if (email.trim()) await submit({ email })
  }


  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      <Helmet>
        <title>Engineering Newsletter & Field Notes | Neevevera</title>
        <meta name="description" content="Subscribe to Neevevera's monthly civil engineering bulletin covering DSR schedules, material pricing and construction methodology updates." />
      </Helmet>
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            15 // PUBLICATIONS DESK
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Field Notes &amp; Engineering Bulletin
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            Monthly technical dispatch sent to chief engineers, project managers, and public procurement authorities detailing regional material pricing, DSR schedules, and construction methodology breakthroughs.
          </p>
        </div>
      </section>

      {/* ── Subscribe Box ── */}
      <section className="py-12 border-b border-[#D8D8D2] bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="border border-[#D8D8D2] bg-[#FAF9F6] p-8 rounded-xs">
            <h2 className="font-display text-xl font-bold text-[#111822]">
              Subscribe to the Monthly Regional Civil Bulletin
            </h2>
            <p className="text-xs text-[#6B6B67] font-medium mt-1">
              Curated by the Neevevera Technical Evaluation Cell. No marketing spam.
            </p>

            {status === 'success' ? (
              <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 text-xs font-medium text-[#075638] flex items-center gap-2">
                <FiCheckCircle size={16} />
                <span>You have been subscribed to our monthly engineering intelligence dispatch.</span>
              </div>
            ) : (
              <>
                {status === 'error' && (
                  <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                    <FiAlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <form onSubmit={handleSub} className="mt-4 flex flex-col sm:flex-row gap-3">
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter corporate or institutional email"
                    disabled={status === 'loading'}
                    className="flex-1 text-xs font-medium px-3 py-3 bg-white border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-[#07558F] hover:bg-[#054373] disabled:opacity-60 text-white text-xs font-medium font-bold uppercase tracking-wider shrink-0 transition-colors"
                  >
                    {status === 'loading' ? 'Subscribing...' : 'Subscribe to Bulletin'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ── Archived Issues ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h3 className="font-display text-2xl font-bold text-[#111822] mb-8">
            Archived Technical Editions
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allNewsletters.map((nl) => (
              <div
                key={nl.id}
                className="border border-[#D8D8D2] bg-white p-6 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
              >
                <div>
                  <div className="text-[10px] font-medium text-[#07558F] font-bold uppercase mb-2">
                    EDITION // {nl.publishedAt}
                  </div>
                  <h4 className="font-display text-lg font-bold text-[#111822] group-hover:text-[#07558F] transition-colors leading-snug">
                    {nl.title}
                  </h4>
                  <p className="text-xs text-[#444440] mt-2 line-clamp-3 leading-relaxed">
                    {nl.excerpt}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#F0EFEA] flex items-center justify-between">
                  <span className="text-[10px] font-medium text-[#6B6B67]">PDF ISSUE</span>
                  <button
                    onClick={() => alert(`Downloading ${nl.title} (PDF)`)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium font-bold text-[#07558F] hover:underline uppercase"
                  >
                    <FiDownload size={13} />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Newsletter
