import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useFormSubmit } from '../../hooks/useFormSubmit'

const Footer = () => {
  const { submit: subscribeFn, status: subStatus } = useFormSubmit('/api/newsletter/subscribe')
  const [email, setEmail] = useState('')

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
            <Link className="hover:text-graphite transition-colors" to="/contact">Privacy Policy</Link>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/contact">Terms of Tender</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
