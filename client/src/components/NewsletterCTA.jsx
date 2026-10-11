import React, { useState } from 'react'
import { useFormSubmit } from '../hooks/useFormSubmit'
import { subscribeNewsletter } from '../services/newsletter.api'
import { FiAlertCircle, FiLoader } from 'react-icons/fi'

const NewsletterCTA = () => {
  const { submit, status, errorMsg, successMsg, reset } = useFormSubmit(subscribeNewsletter)
  const [email, setEmail] = useState('')
  const [consent, setConsent] = useState(true)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!consent) return
    await submit({ email })
  }

  return (
    <section className="py-16 border-b border-[#D8D8D2]" id="newsletter-digest">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="bg-[#111822] text-white rounded-sm p-8 lg:p-12 relative overflow-hidden shadow-lg">
          {/* Grid wireframe pattern */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none hidden lg:block">
            <svg className="w-full h-full" fill="none" stroke="currentColor">
              <defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/></pattern></defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          <div className="relative z-10 max-w-2xl space-y-5">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-[#B9923B]">
              <span className="material-symbols-outlined text-[16px]">drafts</span>Direct Technical Dispatch
            </div>
            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-white tracking-tight">
              Receive our quarterly technical whitepapers and tender briefs.
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Directly delivered to consulting engineers, project managers, and institutional developers. No promotional spam — strictly field forensics, statutory changes, and concrete engineering datasheets.
            </p>

            {status === 'success' ? (
              <div className="p-4 bg-white/10 border border-white/20 rounded-sm flex flex-col sm:flex-row items-center gap-3">
                <span className="material-symbols-outlined text-[#075638] text-2xl">check_circle</span>
                <span className="text-sm text-white font-bold flex-1">
                  {successMsg || 'Thank you. Your address is registered for the upcoming Q2 2025 Civil Engineering Digest.'}
                </span>
                <button 
                  onClick={() => { reset(); setEmail(''); }}
                  className="mt-2 sm:mt-0 px-4 py-2 bg-white/10 hover:bg-white/20 transition-colors text-xs uppercase font-bold tracking-wider rounded-sm"
                >
                  Subscribe Another
                </button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={handleSubmit}>
                {status === 'error' && (
                  <div className="flex items-start gap-2.5 p-3 bg-red-900/30 border border-red-500/30 text-xs font-medium text-red-200 rounded-sm">
                    <FiAlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 max-w-lg">
                  <div className="relative flex-1">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B67] text-[20px]">mail</span>
                    <input
                      type="email"
                      required
                      disabled={status === 'loading'}
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="Enter professional email address..."
                      className="w-full bg-white text-[#111822] pl-10 pr-4 py-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#B9923B] rounded-sm disabled:opacity-70"
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={status === 'loading'}
                    className="px-6 py-3 bg-[#B9923B] hover:bg-[#A6812F] disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-bold uppercase tracking-wider transition-colors rounded-sm whitespace-nowrap shadow-sm flex items-center justify-center gap-2"
                  >
                    {status === 'loading' ? (
                      <>
                        <FiLoader className="animate-spin" />
                        <span>Registering...</span>
                      </>
                    ) : (
                      'Subscribe to Digest'
                    )}
                  </button>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <input 
                    type="checkbox" 
                    required 
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    disabled={status === 'loading'}
                    className="mt-0.5 rounded text-[#B9923B]" 
                  />
                  <label className="text-[11px] text-white/60 leading-tight">
                    I consent to receive technical engineering briefs per Neevevera's Privacy and Statutory Information Policy. Unsubscribe at any time.
                  </label>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export default NewsletterCTA
