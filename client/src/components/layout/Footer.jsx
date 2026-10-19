import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { subscribeNewsletter } from '../../services/newsletter.api'

const Footer = () => {
  const { submit: subscribeFn, status: subStatus } = useFormSubmit(subscribeNewsletter)
  const [email, setEmail] = useState('')
  const [showCredits, setShowCredits] = useState(false)

  useEffect(() => {
    // Professional Developer Console Signature
    console.log(
      `%c🏗️ NEEVEVERA DIGITAL INFRASTRUCTURE\n%cProduct & Architecture: Boostr Netwave Solutions\nLead Engineer: Ayan Azmi\nBuilt for Permanence | IS 456 & IS 800 Standard`,
      'color: #07558F; font-size: 12px; font-weight: 800; font-family: monospace;',
      'color: #6B6B67; font-size: 10px; font-family: monospace;'
    )
  }, [])

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (email.trim()) {
      await subscribeFn({ email })
      setEmail('')
    }
  }

  return (
    <footer className="w-full bg-surface-warm border-t border-border-neutral text-graphite">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 pb-10 border-b border-border-neutral">
          {/* Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <Link className="inline-block" to="/">
              <img
                alt="Neevevera Private Limited"
                className="h-11 w-auto object-contain"
                src="/neevevara-logo.png"
              />
            </Link>
            <p className="text-xs text-soft-grey leading-relaxed">
              Multi-disciplinary civil engineering and infrastructure enterprise. Executing high-permanence structural assets across Eastern India and Island Territories.
            </p>
            <div className="space-y-1 text-xs text-soft-grey">
              <div>
                Email: <a className="text-brand-blue font-semibold hover:underline" href="mailto:info@neevevara.com">info@neevevara.com</a>
              </div>
              <div>
                Web: <a className="text-brand-blue font-semibold hover:underline" href="https://www.neevevara.com">www.neevevara.com</a>
              </div>
            </div>
            <div className="pt-2 space-y-1">
              <div className="text-[11px] font-bold text-graphite uppercase tracking-wider">Social Media Channels</div>
              <div className="flex items-center gap-2 text-xs text-soft-grey flex-wrap">
                <span className="px-2 py-1 bg-white border border-border-neutral rounded text-[11px]">LinkedIn</span>
                <span className="px-2 py-1 bg-white border border-border-neutral rounded text-[11px]">Facebook</span>
                <span className="px-2 py-1 bg-white border border-border-neutral rounded text-[11px]">Instagram</span>
                <span className="px-2 py-1 bg-white border border-border-neutral rounded text-[11px]">YouTube</span>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-2 space-y-3">
            <div className="text-xs font-bold text-graphite uppercase border-b border-border-neutral pb-1">
              Navigation
            </div>
            <ul className="space-y-2 text-xs text-soft-grey">
              <li><Link className="hover:text-brand-blue transition-colors" to="/about">About Us</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/services">Services</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/projects">Project Portfolio</Link></li>
              <li><a className="hover:text-brand-blue transition-colors" href="/#capabilities">Capabilities</a></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/gallery">Field Gallery</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/team">Leadership Team</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/careers">Careers</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/vendors">Vendor Enrolment</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/insights">Insights &amp; Notes</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/contact">Contact Us</Link></li>
            </ul>
          </div>

          {/* Operational Commands */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-bold text-graphite uppercase border-b border-border-neutral pb-1">
              Operational Commands
            </div>
            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-blue uppercase">Odisha HQ</span>
                <p className="text-soft-grey leading-tight">3rd Floor, Radianz Complex, Nuagan, Cuttack – 754001</p>
                <p className="text-graphite font-medium">Ph: +91 8596911655</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-green uppercase">Andaman Hub</span>
                <p className="text-soft-grey leading-tight">75 JN Road, Haddo, Port Blair – 744102</p>
                <p className="text-graphite font-medium">Ph: 03192-241890</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-gold uppercase">Kolkata Office</span>
                <p className="text-soft-grey leading-tight">31 Giri Babu Lane, 1st Floor, Kolkata – 700012</p>
                <p className="text-graphite font-medium">Ph: 033-22252605</p>
              </div>
            </div>
          </div>

          {/* Technical Updates / Subscription */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-bold text-graphite uppercase border-b border-border-neutral pb-1">
              Technical Updates
            </div>
            <p className="text-xs text-soft-grey leading-relaxed">
              Receive technical field notes and structural engineering briefs published by our senior design panel.
            </p>
            {subStatus === 'success' ? (
              <div className="p-2.5 bg-green-50 border border-green-200 text-brand-green text-xs rounded-sm">
                ✓ Thank you for subscribing to field notes.
              </div>
            ) : (
              <form className="space-y-2" onSubmit={handleSubscribe}>
                <input
                  className="w-full bg-white border border-border-neutral px-3 py-2 text-xs text-graphite rounded-sm focus:outline-none focus:border-brand-blue"
                  placeholder="Enter corporate email..."
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={subStatus === 'loading'}
                />
                <button
                  className="w-full py-2 bg-brand-blue hover:bg-brand-blue-hover disabled:opacity-60 text-white text-xs uppercase font-semibold rounded-sm transition-colors"
                  type="submit"
                  disabled={subStatus === 'loading'}
                >
                  {subStatus === 'loading' ? 'Subscribing...' : 'Subscribe to Field Notes'}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-soft-grey">
          <div>© Neevevera Private Limited. All rights reserved. CIN Certified Infrastructure Entity.</div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>IS 456 • IS 800 • IRC Standards</span>
            <span className="text-border-neutral">•</span>
            <button
              type="button"
              onClick={() => setShowCredits(true)}
              className="hover:text-graphite transition-colors text-xs text-soft-grey cursor-pointer"
            >
              Credits
            </button>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/contact">Privacy Policy</Link>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/contact">Terms of Tender</Link>
          </div>
        </div>
      </div>

      {/* ── Professional Credits Modal (Neevevera Brand Palette) ── */}
      {showCredits && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#111822]/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowCredits(false)}
        >
          <div
            className="bg-[#111822] border border-[#232D3F] rounded-xl max-w-xs sm:max-w-sm w-full p-6 shadow-2xl relative text-white space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header: Logo in Neevevera Blue + Version + Close */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#07558F] border border-[#0A6DB7] flex items-center justify-center font-bold text-white shadow-md text-sm font-display">
                  N
                </div>
                <div>
                  <h3 className="font-display font-bold text-sm tracking-tight text-white leading-tight">
                    Neevevera Portal
                  </h3>
                  <span className="text-[11px] font-mono text-[#94A3B8]">v2.4</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCredits(false)}
                className="text-[#94A3B8] hover:text-white transition-colors p-1 text-sm leading-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Content Details: Product & Lead Engineer */}
            <div className="space-y-4 pt-1">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-0.5">
                  PRODUCT &amp; ARCHITECTURE
                </span>
                <p className="text-sm font-semibold text-white tracking-tight">
                  Boostr Netwave Solutions
                </p>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8] block mb-0.5">
                  LEAD ENGINEER
                </span>
                <p className="text-sm font-semibold text-white tracking-tight">
                  Ayan Azmi
                </p>
              </div>
            </div>

            {/* Modal Footer Copyright */}
            <div className="pt-3 border-t border-[#232D3F] text-center">
              <p className="text-[11px] text-[#94A3B8]">
                © Boostr Netwave Solutions
              </p>
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default Footer
