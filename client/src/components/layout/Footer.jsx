import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useFormSubmit } from '../../hooks/useFormSubmit'
import { subscribeNewsletter } from '../../services/newsletter.api'

const Footer = () => {
  const { t } = useTranslation('common')
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
              {t('footer.tagline')}
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
              {t('footer.quickLinks')}
            </div>
            <ul className="space-y-2 text-xs text-soft-grey">
              <li><Link className="hover:text-brand-blue transition-colors" to="/about">{t('nav.about')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/services">{t('nav.services')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/projects">{t('nav.projects')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/services">{t('nav.capabilities')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/gallery">{t('nav.gallery')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/team">{t('nav.team')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/careers">{t('nav.careers')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/vendors">{t('nav.vendors')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/partners">Marketing Partners</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/insights">{t('nav.insights')}</Link></li>
              <li><Link className="hover:text-brand-blue transition-colors" to="/contact">{t('nav.contact')}</Link></li>
            </ul>
            <div className="pt-2 border-t border-border-neutral">
              <span className="text-[10px] font-bold text-graphite uppercase tracking-wider block mb-1">
                Plan Your Project
              </span>
              <Link
                to="/estimate"
                className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover transition-colors flex items-center gap-1"
              >
                <span>{t('nav.estimateProjectCost')} →</span>
              </Link>
              <Link
                to="/book-inspection"
                className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover transition-colors flex items-center gap-1 mt-1.5"
              >
                <span>{t('bookInspection.title')} →</span>
              </Link>
            </div>
          </div>

          {/* Operational Commands */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-bold text-graphite uppercase border-b border-border-neutral pb-1">
              {t('footer.regionalHubs')}
            </div>
            <div className="space-y-3 text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-blue uppercase">{t('footer.odishaHq')}</span>
                <p className="text-soft-grey leading-tight">Sector 9, CDA Industrial Estate, Cuttack – 753014</p>
                <p className="text-graphite font-medium">Ph: +91 8596911655</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-green uppercase">{t('footer.andamanCell')}</span>
                <p className="text-soft-grey leading-tight">Haddo Maritime Corridor, Port Blair – 744102</p>
                <p className="text-graphite font-medium">Ph: +91 8596911656</p>
              </div>
              <div className="space-y-0.5">
                <span className="font-semibold text-brand-gold uppercase">{t('footer.kolkataCell')}</span>
                <p className="text-soft-grey leading-tight">Sector V, Salt Lake City, Kolkata – 700091</p>
                <p className="text-graphite font-medium">Ph: +91 33 2955 1040</p>
              </div>
            </div>
          </div>

          {/* Technical Updates / Subscription */}
          <div className="lg:col-span-3 space-y-3">
            <div className="text-xs font-bold text-graphite uppercase border-b border-border-neutral pb-1">
              {t('footer.newsletterTitle')}
            </div>
            <p className="text-xs text-soft-grey leading-relaxed">
              {t('footer.newsletterDesc')}
            </p>
            {subStatus === 'success' ? (
              <div className="p-2.5 bg-green-50 border border-green-200 text-brand-green text-xs rounded-sm">
                ✓ {t('footer.subscribed')}
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
                  {subStatus === 'loading' ? t('common.loading') : t('footer.subscribe')}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Legal bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-soft-grey">
          <div>© Neevevera Private Limited. {t('footer.rights')}</div>
          <div className="flex items-center gap-4 flex-wrap">
            <span>{t('footer.standards')}</span>
            <span className="text-border-neutral">•</span>
            <button
              type="button"
              onClick={() => setShowCredits(true)}
              className="hover:text-graphite transition-colors text-xs text-soft-grey cursor-pointer"
            >
              Credits
            </button>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/privacy">Privacy Policy</Link>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/terms">Terms of Service</Link>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/refund-policy">Refund Policy</Link>
            <span className="text-border-neutral">•</span>
            <Link className="hover:text-graphite transition-colors" to="/partner-terms">Partner Terms</Link>
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
