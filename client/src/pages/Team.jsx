import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiAward, FiCheckCircle } from 'react-icons/fi'
import { teamMembers as mockTeamMembers } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const Team = () => {
  const [liveMembers, setLiveMembers] = useState([])

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await axios.get(`${API}/team`, { params: { limit: 100 } })
        if (res.data.success && res.data.items) {
          const formatted = res.data.items.map(m => ({
            id: m._id,
            name: m.name,
            role: m.designation,
            credentials: m.qualifications ? m.qualifications.join(' • ') : '',
            image: m.image || m.photo || '/placeholder.jpg',
            bio: m.bio,
            experience: m.experience || '15+ YRS'
          }))
          setLiveMembers(formatted)
        }
      } catch (err) {
        console.error('Failed to fetch team members:', err)
      }
    }
    fetchTeam()
  }, [])

  const allMembers = [
    ...liveMembers,
    ...mockTeamMembers.filter(mock => !liveMembers.some(live => live.name === mock.name))
  ]

  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-12 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            08 // TECHNICAL GOVERNANCE
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-[#111822] tracking-tight">
            Leadership &amp; Engineering Directorate
          </h1>
          <p className="text-sm sm:text-base text-[#444440] mt-3 max-w-2xl font-light">
            Our leadership combines over three decades of civil engineering experience, holding Fellow of Institution of Engineers (FIE) and Chartered Engineer accreditations.
          </p>
        </div>
      </section>

      {/* ── Directors & Senior Roster ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {allMembers.map((member) => (
              <div
                key={member.id}
                className="border border-[#D8D8D2] bg-white overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
              >
                <div>
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-neutral-900">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white font-medium text-[10px] px-2 py-0.5 uppercase">
                      REF // TM-0{member.id}
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="text-[11px] font-medium text-[#07558F] font-bold uppercase tracking-wider">
                      {member.role}
                    </div>
                    <h3 className="font-display text-lg font-bold text-[#111822] mt-1">
                      {member.name}
                    </h3>
                    <div className="text-xs font-medium text-[#6B6B67] mt-1 font-semibold">
                      {member.credentials}
                    </div>

                    <p className="text-xs text-[#444440] mt-3 leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 border-t border-[#F0EFEA] mt-4 flex items-center justify-between text-xs font-medium text-[#6B6B67]">
                  <span>EXP: {member.experience || '15+ YRS'}</span>
                  <span className="text-[#075638] font-bold">ACTIVE REGISTRATION</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Careers Banner ── */}
      <section className="py-12 bg-[#F2EFE9] border-t border-[#D8D8D2]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-display text-xl font-bold text-[#111822]">
              Join Our Engineering &amp; Site Management Roster
            </h3>
            <p className="text-xs text-[#6B6B67] font-medium mt-1">
              We are actively hiring civil site engineers, QA/QC managers, and surveyors in Odisha and Port Blair.
            </p>
          </div>
          <Link
            to="/careers"
            className="px-6 py-3 bg-[#07558F] hover:bg-[#054373] text-white font-medium text-xs font-bold uppercase tracking-wider shrink-0"
          >
            <span>Explore Open Vacancies</span>
            <FiArrowRight size={13} className="inline ml-2" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default Team
