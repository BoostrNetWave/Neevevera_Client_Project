import React, { useState, useEffect } from 'react'
import { Helmet } from 'react-helmet-async'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiCheckCircle, FiUploadCloud, FiSend, FiAlertCircle } from 'react-icons/fi'
import { careers as mockCareers } from '../data/mockData'
import { useFormSubmit } from '../hooks/useFormSubmit'
import { uploadResume, submitApplication } from '../services/careers.api'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Application = () => {
  const { slug } = useParams()
  
  const [job, setJob] = useState(null)
  const [loadingJob, setLoadingJob] = useState(true)
  const [resumeFile, setResumeFile] = useState(null)

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await axios.get(`${API}/careers/${slug}`)
        if (res.data.success && res.data.data) {
          setJob(res.data.data)
          setLoadingJob(false)
          return
        }
      } catch (err) {
        console.warn('Live career fetch error, checking mock fallback:', err.message)
      }

      const mockJob = mockCareers.find((c) => c.slug === slug)
      if (mockJob) {
        setJob(mockJob)
      }
      setLoadingJob(false)
    }
    
    fetchJob()
  }, [slug])

  const currentSlug = slug || job?.slug

  const handleFullSubmit = async (payload) => {
    let resumeUrl = ''
    if (resumeFile) {
      const uploadRes = await uploadResume(resumeFile)
      resumeUrl = uploadRes.url || uploadRes.secure_url || ''
    }
    return submitApplication({
      ...payload,
      resumeUrl
    })
  }

  const { submit, status, errorMsg, reset } = useFormSubmit(handleFullSubmit)

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    experience: '',
    qualification: 'B.Tech Civil Engineering',
    currentLocation: '',
    expectedCtc: '',
    notes: '',
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submit({
      name: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      coverLetter: formData.notes || `Experience: ${formData.experience}. Qualification: ${formData.qualification}. Current Location: ${formData.currentLocation}. Expected CTC: ${formData.expectedCtc}`,
      jobTitle: job?.title,
      jobSlug: currentSlug,
      jobId: job?._id || job?.id,
    })
  }

  if (loadingJob) {
    return <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">Loading...</div>
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex flex-col items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4">Position Not Found</h2>
        <Link to="/careers" className="text-[#07558F] underline">Back to Careers</Link>
      </div>
    )
  }

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717] py-12">
      <Helmet>
        <title>Apply — {job?.title || 'Careers'} | Neevevera</title>
        <meta name="description" content={`Apply for ${job?.title || 'open positions'} at Neevevera Private Limited.`} />
      </Helmet>
      <div className="max-w-3xl mx-auto px-6">
        <Link
          to={`/careers/${slug || ''}`}
          className="inline-flex items-center gap-2 text-xs font-medium font-bold uppercase text-[#07558F] hover:underline mb-6"
        >
          <FiArrowLeft size={13} />
          <span>Back to Job Profile</span>
        </Link>

        <div className="border border-[#D8D8D2] bg-white p-8 rounded-xs shadow-sm">
          <div className="pb-6 border-b border-[#E5E3DC] mb-6">
            <div className="text-xs font-medium font-bold uppercase text-[#07558F]">
              JOB APPLICATION // {job.title}
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#111822] mt-1">
              Submit Candidate Credentials
            </h1>
            <p className="text-xs font-medium text-[#6B6B67] mt-1">
              Department: {job.department} • Location: {job.location}
            </p>
          </div>

          {status === 'success' ? (
            <div className="py-12 text-center bg-emerald-50 border border-emerald-200 rounded-xs">
              <FiCheckCircle className="mx-auto text-[#075638] mb-3" size={48} />
              <h2 className="font-display text-2xl font-bold text-[#075638]">
                Application Submitted Successfully
              </h2>
              <p className="text-xs font-medium text-emerald-950 mt-2 max-w-md mx-auto">
                Thank you for applying to Neevevera. Our HR &amp; Technical Evaluation Cell will review your credentials and contact shortlisted candidates.
              </p>
              <Link
                to="/careers"
                className="mt-6 inline-block px-6 py-2.5 bg-[#07558F] text-white text-xs font-medium font-bold uppercase"
              >
                Browse Other Vacancies
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {status === 'error' && (
                <div className="flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 text-xs font-medium text-red-800">
                  <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Full Name *
                  </label>
                  <input
                    required
                    type="text"
                    disabled={status === 'loading'}
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="Er. Amit Patel"
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Email Address *
                  </label>
                  <input
                    required
                    type="email"
                    disabled={status === 'loading'}
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="amit.patel@domain.com"
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Phone Number *
                  </label>
                  <input
                    required
                    type="tel"
                    disabled={status === 'loading'}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Years of Experience *
                  </label>
                  <input
                    required
                    type="text"
                    disabled={status === 'loading'}
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 6.5 Years"
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Current Location
                  </label>
                  <input
                    type="text"
                    disabled={status === 'loading'}
                    value={formData.currentLocation}
                    onChange={(e) => setFormData({ ...formData, currentLocation: e.target.value })}
                    placeholder="e.g. Bhubaneswar"
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Highest Technical Degree
                  </label>
                  <select
                    value={formData.qualification}
                    disabled={status === 'loading'}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  >
                    <option>B.Tech / BE Civil Engineering</option>
                    <option>M.Tech Structural Engineering</option>
                    <option>M.Tech Geotechnical Engineering</option>
                    <option>Diploma in Civil Engineering</option>
                    <option>Other Relevant Engineering Degree</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                    Expected CTC (Annual)
                  </label>
                  <input
                    type="text"
                    disabled={status === 'loading'}
                    value={formData.expectedCtc}
                    onChange={(e) => setFormData({ ...formData, expectedCtc: e.target.value })}
                    placeholder="e.g. ₹ 8,50,000 INR"
                    className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium uppercase text-[#6B6B67] mb-1 font-semibold">
                  Field Summary &amp; Projects Managed
                </label>
                <textarea
                  rows={4}
                  disabled={status === 'loading'}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Detail previous project types (bridges, PEB, commercial towers), software knowledge (AutoCAD, STAAD, Primavera), and site leadership experiences..."
                  className="w-full text-xs font-medium px-3 py-2.5 bg-[#FAF9F6] border border-[#D8D8D2] focus:outline-none focus:border-[#07558F]"
                ></textarea>
              </div>

              <div className="p-4 border border-dashed border-[#D8D8D2] bg-[#FAF9F6] text-center relative overflow-hidden">
                <FiUploadCloud className="mx-auto text-2xl text-[#6B6B67] mb-1" />
                <div className="text-xs font-medium font-bold text-[#111822]">
                  {resumeFile ? resumeFile.name : 'Attach Resume / Curriculum Vitae'}
                </div>
                <div className="text-[10px] font-medium text-[#6B6B67] mt-0.5">
                  PDF, DOCX up to 10MB
                </div>
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  disabled={status === 'loading'}
                  onChange={(e) => setResumeFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
              </div>

              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-3.5 bg-[#07558F] hover:bg-[#054373] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-medium font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin" width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" /></svg>
                    <span>Uploading & Submitting...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={14} />
                    <span>Submit Job Application</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default Application
