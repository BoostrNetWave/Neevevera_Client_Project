import React, { useState, useEffect } from 'react'
import { FiPlay, FiPause, FiClock, FiCalendar, FiMic } from 'react-icons/fi'
import { podcasts as mockPodcasts } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Podcast = () => {
  const [playingId, setPlayingId] = useState(null)
  const [livePodcasts, setLivePodcasts] = useState([])

  useEffect(() => {
    const fetchPodcasts = async () => {
      try {
        const res = await axios.get(`${API}/podcasts`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          const formatted = res.data.items.map((p, idx) => ({
            id: p._id,
            episodeNumber: p.episodeNumber || String(mockPodcasts.length + idx + 1).padStart(2, '0'),
            title: p.title,
            duration: p.duration,
            publishedAt: p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '',
            guest: p.guest,
            description: p.description,
            audioUrl: p.audioUrl,
          }))
          setLivePodcasts(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch podcasts:', err)
      }
    }
    fetchPodcasts()
  }, [])

  const allPodcasts = [
    ...livePodcasts,
    ...mockPodcasts.filter(mock => !livePodcasts.some(live => live.title === mock.title))
  ]

  const togglePlay = (id) => {
    setPlayingId(playingId === id ? null : id)
  }


  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            16 // AUDIO DISPATCH
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            The Neevevera Engineering Podcast
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            In-depth technical conversations with chartered structural engineers, forensic geotechnical analysts, and public infrastructure directors exploring real challenges in Indian construction.
          </p>
        </div>
      </section>

      {/* ── Episodes List ── */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 space-y-6">
          {allPodcasts.map((ep) => (
            <div
              key={ep.id}
              className={`border transition-all p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xs ${
                playingId === ep.id
                  ? 'border-[#07558F] bg-white ring-1 ring-[#07558F]'
                  : 'border-[#D8D8D2] bg-white hover:border-[#07558F]'
              }`}
            >
              <div className="flex items-start gap-4">
                <button
                  onClick={() => togglePlay(ep.id)}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                    playingId === ep.id
                      ? 'bg-[#07558F] text-white scale-105'
                      : 'bg-[#F2EFE9] text-[#111822] hover:bg-[#07558F] hover:text-white'
                  }`}
                >
                  {playingId === ep.id ? <FiPause size={18} /> : <FiPlay size={18} className="ml-0.5" />}
                </button>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#6B6B67]">
                    <span className="text-[#07558F] font-bold">EPISODE {ep.episodeNumber || `0${ep.id}`}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <FiClock size={12} /> {ep.duration}
                    </span>
                    <span>•</span>
                    <span>{ep.publishedAt}</span>
                  </div>

                  <h3 className="font-display text-lg font-bold text-[#111822]">
                    {ep.title}
                  </h3>

                  <p className="text-xs text-[#444440] leading-relaxed max-w-2xl">
                    {ep.description}
                  </p>

                  <div className="text-[11px] font-medium text-[#6B6B67] pt-1">
                    Featured Guest: <span className="font-bold text-[#111822]">{ep.guest || 'Er. K. Mohapatra, FIE'}</span>
                  </div>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                {playingId === ep.id && (
                  <span className="text-xs font-medium text-[#075638] font-bold flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-[#075638]"></span>
                    Streaming Audio...
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default Podcast
