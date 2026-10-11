import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
      setSearchQuery('')
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-surface-warm/95 backdrop-blur-md border-b border-border-neutral">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="h-20 flex items-center justify-between gap-6">
          {/* Logo with perfect branding */}
          <Link aria-label="Neevevera Private Limited" className="flex items-center py-1 focus:outline-none" to="/">
            <img
              alt="Neevevera Private Limited"
              className="h-11 sm:h-12 w-auto object-contain transition-transform duration-200 hover:scale-[1.01]"
              src="/neevevara-logo.png"
            />
          </Link>

          {/* Desktop Navigation Links matching reference */}
          <nav className="hidden xl:flex items-center gap-6">
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/about">
              About
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/services">
              Services
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/projects">
              Projects
            </Link>
            <a className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" href="/#capabilities">
              Capabilities
            </a>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/gallery">
              Gallery
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/team">
              Team
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/careers">
              Careers
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/vendors">
              Vendors
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/insights">
              Insights
            </Link>
            <Link className="text-[13px] font-semibold text-graphite/80 hover:text-brand-blue tracking-wide uppercase transition-colors" to="/contact">
              Contact
            </Link>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              aria-label="Search directory"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-soft-grey hover:text-brand-blue transition-colors rounded-full hover:bg-border-light"
              type="button"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
            </button>

            <Link
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-[12px] font-semibold uppercase tracking-wider transition-all duration-200 shadow-sm rounded-sm"
              to="/contact"
            >
              <span>Start a Project</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 text-soft-grey hover:text-brand-blue transition-colors rounded-full"
              type="button"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Search Overlay */}
        {searchOpen && (
          <div className="py-3 border-t border-border-neutral">
            <form onSubmit={handleSearch} className="flex items-center gap-2 max-w-xl mx-auto">
              <input
                autoFocus
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search civil engineering services, projects, specs..."
                className="flex-1 bg-white border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue font-medium"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-brand-blue text-white text-xs font-semibold uppercase rounded-sm"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="xl:hidden py-4 border-t border-border-neutral flex flex-col gap-2">
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/about">About</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/services">Services</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/projects">Projects</Link>
            <a onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" href="/#capabilities">Capabilities</a>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/gallery">Gallery</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/team">Team</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/careers">Careers</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/vendors">Vendors</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/insights">Insights</Link>
            <Link onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 text-xs font-semibold uppercase text-graphite hover:text-brand-blue" to="/contact">Contact</Link>
            <Link
              onClick={() => setMobileMenuOpen(false)}
              className="mt-2 text-center py-2.5 bg-brand-blue text-white text-xs font-semibold uppercase tracking-wider rounded-sm"
              to="/contact"
            >
              Start a Project
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Navbar
