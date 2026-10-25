import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { SUPPORTED_LANGUAGES, selectLanguage } from '../../i18n'

const MORE_ITEMS = [
  {
    key: 'capabilities',
    to: '/#capabilities',
    label: 'Capabilities',
    desc: 'Civil & marine operations',
    icon: 'architecture',
    external: true,
  },
  {
    key: 'gallery',
    to: '/gallery',
    label: 'Gallery',
    desc: 'On-site imagery & drones',
    icon: 'camera',
  },
  {
    key: 'team',
    to: '/team',
    label: 'Team',
    desc: 'Board & technical staff',
    icon: 'diversity_3',
  },
  {
    key: 'careers',
    to: '/careers',
    label: 'Careers',
    desc: 'Join Odisha & Port Blair units',
    icon: 'work_history',
  },
  {
    key: 'vendors',
    to: '/vendors',
    label: 'Vendors',
    desc: 'Procurement portal',
    icon: 'local_shipping',
  },
  {
    key: 'insights',
    to: '/insights',
    label: 'Insights',
    desc: 'Articles & press releases',
    icon: 'auto_stories',
  },
]

const Navbar = () => {
  const { t, i18n } = useTranslation('common')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [moreOpenMobile, setMoreOpenMobile] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const moreRef = useRef(null)
  const langRef = useRef(null)
  const searchInputRef = useRef(null)

  // Current active language object
  const currentLangCode = i18n.language || 'en'
  const currentLang = SUPPORTED_LANGUAGES.find((l) => l.code === currentLangCode) || SUPPORTED_LANGUAGES[0]

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchOpen])

  // Close More & Language dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) {
        setMoreOpen(false)
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close menus on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setMoreOpen(false)
    setLangOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  const handleLanguageChange = (code) => {
    selectLanguage(code)
    setLangOpen(false)
  }

  // Active check helpers
  const isAboutActive = location.pathname === '/about'
  const isServicesActive = location.pathname.startsWith('/services')
  const isProjectsActive = location.pathname.startsWith('/projects')
  const isContactActive = location.pathname === '/contact'
  const isMoreActive = MORE_ITEMS.some((item) => !item.external && location.pathname.startsWith(item.to))

  return (
    <header className="sticky top-0 z-50 w-full py-2.5 sm:py-3 px-4 sm:px-6 lg:px-8 bg-surface-warm/80 backdrop-blur-md transition-all">
      <div className="max-w-[1400px] mx-auto h-[74px] px-5 sm:px-6 bg-white rounded-2xl shadow-md flex items-center justify-between gap-4 lg:gap-6 border border-[#DDDAD1]/70 relative">

        {/* ── Left: Corporate Logo ── */}
        <div className="flex items-center gap-3 shrink-0">
          <Link aria-label="Neevevera Private Limited" className="flex items-center py-1 focus:outline-none" to="/">
            <img
              alt="Neevevera Corporate Logo"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 hover:scale-[1.02]"
              src="/neevevara-logo.png"
            />
          </Link>
        </div>

        {/* ── Center: Floating Pill Navigation Track ── */}
        <nav className="hidden xl:flex items-center bg-[#FAF9F6] p-1.5 rounded-full border border-[#DDDAD1]/50 gap-1 shadow-2xs">
          {/* About */}
          <Link
            to="/about"
            className={`px-4 py-2 rounded-full text-[13px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isAboutActive
                ? 'text-[#07558F] font-bold bg-[#07558F]/10 shadow-2xs'
                : 'text-[#171717] font-semibold hover:bg-black/5 hover:text-[#07558F]'
            }`}
          >
            {isAboutActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B] shrink-0" />}
            <span>{t('nav.about')}</span>
          </Link>

          {/* Services */}
          <Link
            to="/services"
            className={`px-4 py-2 rounded-full text-[13px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isServicesActive
                ? 'text-[#07558F] font-bold bg-[#07558F]/10 shadow-2xs'
                : 'text-[#171717] font-semibold hover:bg-black/5 hover:text-[#07558F]'
            }`}
          >
            {isServicesActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B] shrink-0" />}
            <span>{t('nav.services')}</span>
          </Link>

          {/* Projects */}
          <Link
            to="/projects"
            className={`px-4 py-2 rounded-full text-[13px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isProjectsActive
                ? 'text-[#07558F] font-bold bg-[#07558F]/10 shadow-2xs'
                : 'text-[#171717] font-semibold hover:bg-black/5 hover:text-[#07558F]'
            }`}
          >
            {isProjectsActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B] shrink-0" />}
            <span>{t('nav.projects')}</span>
          </Link>

          {/* More Dropdown Pill */}
          <div className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              className={`px-4 py-2 rounded-full text-[13px] uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer ${
                isMoreActive || moreOpen
                  ? 'text-[#07558F] font-bold bg-[#07558F]/10 shadow-2xs'
                  : 'text-[#171717] font-semibold hover:bg-black/5 hover:text-[#07558F]'
              }`}
              aria-haspopup="true"
              aria-expanded={moreOpen}
            >
              {isMoreActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B] shrink-0" />}
              <span>{t('nav.more')}</span>
              <span
                className="material-symbols-outlined text-[16px] transition-transform duration-200"
                style={{ transform: moreOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>

            {/* Concept 5: Floating Card Popover with Gold Accent */}
            {moreOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-[420px] bg-white p-5 rounded-2xl shadow-xl border border-[#DDDAD1]/70 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDDAD1]/40 mb-3">
                  <span className="font-bold text-[13px] text-[#111822] tracking-wider uppercase font-mono">
                    {t('nav.directoryOverview')}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#B9923B]" />
                </div>
                <div className="space-y-1.5">
                  {MORE_ITEMS.map((item) => {
                    const isItemActive = !item.external && location.pathname.startsWith(item.to)
                    const translatedLabel = t(`nav.${item.key}`, item.label)
                    const translatedDesc = t(`nav.${item.key}Desc`, item.desc)
                    const content = (
                      <div className="flex items-center justify-between p-2 rounded-xl hover:bg-[#FAF9F6] transition-colors group cursor-pointer">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                            isItemActive ? 'bg-[#07558F] text-white' : 'bg-[#07558F]/10 text-[#07558F]'
                          }`}>
                            <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                          </div>
                          <div className="text-left">
                            <div className="text-[13px] font-semibold text-[#111822] group-hover:text-[#07558F] transition-colors">
                              {translatedLabel}
                            </div>
                            <div className="text-[11px] text-[#747878]">{translatedDesc}</div>
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-[16px] text-[#DDDAD1] group-hover:text-[#07558F] group-hover:translate-x-1 transition-all">
                          chevron_right
                        </span>
                      </div>
                    )

                    return item.external ? (
                      <a
                        key={item.key}
                        href={item.to}
                        onClick={() => setMoreOpen(false)}
                        className="block"
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        key={item.key}
                        to={item.to}
                        onClick={() => setMoreOpen(false)}
                        className="block"
                      >
                        {content}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <Link
            to="/contact"
            className={`px-4 py-2 rounded-full text-[13px] uppercase tracking-wider transition-all flex items-center gap-1.5 ${
              isContactActive
                ? 'text-[#07558F] font-bold bg-[#07558F]/10 shadow-2xs'
                : 'text-[#171717] font-semibold hover:bg-black/5 hover:text-[#07558F]'
            }`}
          >
            {isContactActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B] shrink-0" />}
            <span>{t('nav.contact')}</span>
          </Link>
        </nav>

        {/* ── Right: Search + Interactive Lang Dropdown + CTA ── */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          {/* Search Trigger */}
          <button
            aria-label="Search Database"
            onClick={() => setSearchOpen(!searchOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FAF9F6] text-[#444748] hover:text-[#07558F] hover:bg-[#E6E2D9] transition-all border border-transparent hover:border-[#DDDAD1] cursor-pointer"
            title="Search Database"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {searchOpen ? 'close' : 'search'}
            </span>
          </button>

          {/* Interactive Language Selector Dropdown (Desktop) */}
          <div className="relative hidden sm:block" ref={langRef}>
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-mono text-[#444748] hover:text-[#07558F] cursor-pointer px-3 py-1.5 rounded-full bg-[#FAF9F6] border border-[#DDDAD1]/70 hover:border-[#07558F]/50 select-none transition-all shadow-2xs"
              aria-haspopup="true"
              aria-expanded={langOpen}
              title="Change Language"
            >
              <span className="material-symbols-outlined text-[15px] text-[#07558F]">language</span>
              <span className="font-bold text-[#07558F]">{currentLang.label}</span>
              <span
                className="material-symbols-outlined text-[14px] text-gray-500 transition-transform duration-200"
                style={{ transform: langOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              >
                expand_more
              </span>
            </button>

            {langOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-[#DDDAD1]/80 py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3.5 py-1.5 text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono border-b border-[#DDDAD1]/40 mb-1">
                  Select Language
                </div>
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLangCode === lang.code
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`w-full px-3.5 py-2 text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#07558F]/10 text-[#07558F] font-bold'
                          : 'hover:bg-[#FAF9F6] text-[#111822]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold text-gray-400 uppercase w-5">
                          {lang.label}
                        </span>
                        <span className="font-medium">{lang.nativeName}</span>
                      </div>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B] shrink-0" />
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Primary CTA (Start a Project with circular forward arrow) */}
          <Link
            to="/contact"
            className="hidden sm:inline-flex group px-5 py-2.5 bg-[#07558F] text-white rounded-full text-[13px] font-semibold uppercase tracking-wider hover:bg-[#054370] transition-all items-center gap-2.5 shadow-sm shrink-0"
          >
            <span>{t('nav.startProject')}</span>
            <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
              <span className="material-symbols-outlined text-[13px] text-white">arrow_forward</span>
            </span>
          </Link>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden w-10 h-10 rounded-full bg-[#FAF9F6] hover:bg-[#E6E2D9] border border-[#DDDAD1]/50 flex items-center justify-center text-[#111822] cursor-pointer transition-colors"
            type="button"
            aria-label="Toggle navigation menu"
          >
            <span className="material-symbols-outlined text-[22px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>

        {/* ── Search Flyout Bar (When Search Open) ── */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white rounded-2xl shadow-xl border border-[#DDDAD1]/80 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
            <form onSubmit={handleSearch} className="flex items-center gap-3">
              <span className="material-symbols-outlined text-[#07558F] text-[20px] ml-1">search</span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('nav.searchPlaceholder')}
                className="flex-1 text-xs sm:text-sm px-2 py-1.5 bg-transparent border-none focus:outline-none text-[#111822] placeholder:text-gray-400 font-medium"
              />
              <button
                type="submit"
                className="px-4 py-1.5 bg-[#07558F] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#054370] transition-colors cursor-pointer shrink-0"
              >
                {t('nav.search')}
              </button>
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                aria-label="Close search"
              >
                ✕
              </button>
            </form>
          </div>
        )}

        {/* ── Concept 5: Mobile Drawer ── */}
        {mobileMenuOpen && (
          <div className="xl:hidden absolute top-full left-0 right-0 mt-2 p-4 bg-white rounded-2xl shadow-2xl border border-[#DDDAD1]/80 space-y-2 z-50 text-[13px] animate-in fade-in slide-in-from-top-2 duration-150">
            {/* About */}
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                isAboutActive ? 'bg-[#07558F]/10 text-[#07558F]' : 'hover:bg-neutral-100 text-[#111822]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isAboutActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B]" />}
                <span>{t('nav.about')}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
            </Link>

            {/* Services */}
            <Link
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                isServicesActive ? 'bg-[#07558F]/10 text-[#07558F]' : 'hover:bg-neutral-100 text-[#111822]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isServicesActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B]" />}
                <span>{t('nav.services')}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
            </Link>

            {/* Projects */}
            <Link
              to="/projects"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                isProjectsActive ? 'bg-[#07558F]/10 text-[#07558F]' : 'hover:bg-neutral-100 text-[#111822]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isProjectsActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B]" />}
                <span>{t('nav.projects')}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
            </Link>

            {/* More Accordion for Mobile */}
            <div className="rounded-xl border border-[#DDDAD1]/60 overflow-hidden">
              <button
                type="button"
                onClick={() => setMoreOpenMobile(!moreOpenMobile)}
                className="w-full p-2.5 font-semibold flex items-center justify-between bg-[#FAF9F6] text-[#111822] cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  {isMoreActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B]" />}
                  <span>{t('nav.moreDestinations')}</span>
                </div>
                <span
                  className="material-symbols-outlined text-[16px] transition-transform duration-200"
                  style={{ transform: moreOpenMobile ? 'rotate(180deg)' : 'rotate(0deg)' }}
                >
                  expand_more
                </span>
              </button>

              {moreOpenMobile && (
                <div className="p-2 space-y-1 bg-white border-t border-[#DDDAD1]/40">
                  {MORE_ITEMS.map((item) => {
                    const isItemActive = !item.external && location.pathname.startsWith(item.to)
                    const translatedLabel = t(`nav.${item.key}`, item.label)
                    const translatedDesc = t(`nav.${item.key}Desc`, item.desc)
                    const inner = (
                      <div className={`p-2 rounded-lg flex items-center justify-between ${
                        isItemActive ? 'bg-[#07558F]/10 text-[#07558F]' : 'hover:bg-neutral-50 text-gray-700'
                      }`}>
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[16px] text-[#07558F]">{item.icon}</span>
                          <span className="text-xs font-semibold">{translatedLabel}</span>
                        </div>
                        <span className="text-[10px] text-gray-400">{translatedDesc}</span>
                      </div>
                    )

                    return item.external ? (
                      <a
                        key={item.key}
                        href={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block"
                      >
                        {inner}
                      </a>
                    ) : (
                      <Link
                        key={item.key}
                        to={item.to}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block"
                      >
                        {inner}
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Contact */}
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className={`p-2.5 rounded-xl font-semibold flex items-center justify-between transition-colors ${
                isContactActive ? 'bg-[#07558F]/10 text-[#07558F]' : 'hover:bg-neutral-100 text-[#111822]'
              }`}
            >
              <div className="flex items-center gap-2">
                {isContactActive && <span className="w-1.5 h-1.5 rounded-full bg-[#B9923B]" />}
                <span>{t('nav.contact')}</span>
              </div>
              <span className="material-symbols-outlined text-[16px] text-gray-400">chevron_right</span>
            </Link>

            {/* Mobile Language Switcher Selector */}
            <div className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#DDDAD1]/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] uppercase tracking-wider font-mono font-bold text-gray-500 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[14px] text-[#07558F]">language</span>
                  Language
                </span>
                <span className="text-[10px] text-[#07558F] font-bold font-mono">
                  {currentLang.nativeName}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = currentLangCode === lang.code
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`py-1.5 px-1 rounded-lg text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#07558F] text-white font-bold shadow-2xs'
                          : 'bg-white border border-[#DDDAD1]/70 text-[#111822] hover:bg-neutral-50'
                      }`}
                    >
                      <div className="text-[10px] font-mono leading-none">{lang.label}</div>
                      <div className="text-[10px] truncate mt-0.5">{lang.nativeName}</div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Utility Row: Direct Search */}
            <div className="pt-2 flex items-center justify-between border-t border-[#DDDAD1]/40">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="text-xs text-[#07558F] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>{t('nav.searchPortal')}</span>
              </button>
            </div>

            {/* Full-width CTA */}
            <div className="pt-2">
              <Link
                to="/contact"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-3 bg-[#07558F] text-white rounded-full text-center block text-[13px] font-semibold uppercase tracking-wider hover:bg-[#054370] transition-colors shadow-sm"
              >
                {t('nav.startProject')} →
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  )
}

export default Navbar
