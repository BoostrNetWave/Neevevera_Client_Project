import React, { useState, useEffect } from 'react'
import { FiX, FiZoomIn, FiMaximize2 } from 'react-icons/fi'
import { galleryItems as mockGalleryItems } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Gallery = () => {
  const [selectedTag, setSelectedTag] = useState('ALL')
  const [activeModalImg, setActiveModalImg] = useState(null)
  const [liveItems, setLiveItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await axios.get(`${API}/gallery`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          const formattedLive = res.data.items.map(g => ({
            id: g._id,
            image: g.imageUrl,
            caption: g.title,
            tag: g.category.replace(/-/g, ' ').toUpperCase(),
            tagColor: 'brand-blue', // Default style, can be adjusted
          }))
          setLiveItems(formattedLive)
        }
      } catch (err) {
        console.error('Failed to fetch gallery items:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchGallery()
  }, [])

  // Merge live photos and mock photos, prioritizing live and deduplicating by image URL
  const allItems = [
    ...liveItems,
    ...mockGalleryItems.filter(mock => !liveItems.some(live => live.image === mock.image))
  ]

  // Extract unique tags from both mock and live data
  const uniqueTags = ['ALL', ...new Set(allItems.map(item => item.tag.toUpperCase()))]

  const filtered =
    selectedTag === 'ALL'
      ? allItems
      : allItems.filter((g) => g.tag.toUpperCase() === selectedTag)

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            07 // FIELD ARCHIVE
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Technical &amp; Site Gallery
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            Direct visual documentation of active concrete pours, offshore piling, structural steel erection, and quality assurance inspections across our Eastern Indian project sites.
          </p>
        </div>
      </section>

      {/* ── Filter Bar ── */}
      <section className="border-b border-[#D8D8D2] bg-white sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {uniqueTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3.5 py-1 text-xs font-medium font-bold uppercase tracking-wider transition-colors rounded-sm ${
                  selectedTag === tag
                    ? 'bg-[#07558F] text-white'
                    : 'bg-[#F2EFE9] text-[#6B6B67] hover:text-[#111822]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="text-xs font-medium text-[#6B6B67]">
            RECORDS: <span className="font-bold text-[#111822]">{filtered.length} ARCHIVED PHOTOS</span>
          </div>
        </div>
      </section>

      {/* ── Gallery Grid ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveModalImg(item)}
                className="group border border-[#D8D8D2] bg-white overflow-hidden cursor-pointer shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-900">
                  <img
                    src={item.image}
                    alt={item.caption}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white text-[10px] font-medium px-2 py-0.5 uppercase">
                    {item.tag}
                  </div>
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <FiMaximize2 size={24} />
                  </div>
                </div>

                <div className="p-4 bg-[#FAF9F6] border-t border-[#E5E3DC]">
                  <div className="text-xs font-bold text-[#111822] leading-snug">
                    {item.caption}
                  </div>
                  <div className="text-[10px] font-medium text-[#6B6B67] mt-1">
                    PHOTO REF: NV-IMG-0{item.id}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Image Modal ── */}
      {activeModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setActiveModalImg(null)}
        >
          <div
            className="max-w-4xl w-full bg-[#111822] text-white border border-white/20 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="font-medium text-xs text-[#B9923B] font-bold uppercase">
                {activeModalImg.tag} // {activeModalImg.caption}
              </div>
              <button
                onClick={() => setActiveModalImg(null)}
                className="text-white/70 hover:text-white p-1"
              >
                <FiX size={20} />
              </button>
            </div>

            <div className="relative aspect-[16/10] w-full bg-black">
              <img
                src={activeModalImg.image}
                alt={activeModalImg.caption}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="p-4 flex items-center justify-between text-xs font-medium text-white/60">
              <div>NEEVEVERA ENGINEERING ARCHIVE</div>
              <div>VERIFIED SITE LOG</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Gallery
