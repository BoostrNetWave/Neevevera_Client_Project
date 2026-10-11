import React from 'react'

const TopBar = () => {
  return (
    <aside className="w-full bg-[#111822] text-[#E0E5EA] border-b border-white/10 text-xs">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-6 text-[12px]">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-green"></span>
            <span className="text-white/60">Regional Desk:</span>
            <a className="hover:text-white transition-colors font-medium" href="tel:+918596911655">
              +91 8596911655
            </a>
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            <span className="text-white/60">Official Desk:</span>
            <a className="hover:text-white transition-colors font-medium" href="mailto:info@neevevara.com">
              info@neevevara.com
            </a>
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-white/70">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-gold"></span>
          <span className="tracking-wider uppercase font-semibold text-white/90">Regional Operational Hubs:</span>
          <span className="text-white/80">Odisha • Andaman • Kolkata</span>
        </div>
      </div>
    </aside>
  )
}

export default TopBar
