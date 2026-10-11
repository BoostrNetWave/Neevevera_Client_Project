import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiCheckCircle, FiShield, FiAward, FiArrowRight, FiUsers, FiMapPin, FiCompass } from 'react-icons/fi'
import { metrics, teamMembers as mockTeamMembers } from '../data/mockData'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const About = () => {
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
            image: m.photo,
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

  const allMembers = [...mockTeamMembers, ...liveMembers]
  return (
    <div className="w-full bg-[#FAF9F6] text-[#171717]">
      {/* ── Page Header ── */}
      <section className="border-b border-[#D8D8D2] pt-10 pb-14 bg-gradient-to-b from-[#F2EFE9]/70 to-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-[11px] font-medium tracking-widest uppercase text-[#07558F] font-bold mb-2">
            01 // INSTITUTIONAL PROFILE
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#111822] tracking-tight">
            Engineering Legacy. <br />
            Constructing Future.
          </h1>
          <p className="text-base sm:text-lg text-[#444440] mt-4 max-w-3xl leading-relaxed font-light">
            Neevevera Private Limited is an integrated civil engineering and EPC contracting organization operating across Eastern India and the Bay of Bengal corridor.
          </p>
        </div>
      </section>

      {/* ── Corporate Identity & Mission ── */}
      <section className="py-16 border-b border-[#D8D8D2] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="text-xs font-medium font-bold uppercase text-[#07558F]">
                OUR INSTITUTIONAL FOUNDATION
              </div>
              <h2 className="font-display text-3xl font-extrabold text-[#111822] tracking-tight">
                Built on Material Rigor, Geotechnical Discipline &amp; Unyielding Ethics
              </h2>
              <p className="text-sm sm:text-base text-[#444440] leading-relaxed">
                Founded with a mission to deliver permanent, structurally resilient civil infrastructure, Neevevera Private Limited has expanded from specialized regional foundation engineering to full-scope general civil contracting, PEB industrial hubs, commercial complexes, and coastal defense works.
              </p>
              <p className="text-sm sm:text-base text-[#444440] leading-relaxed">
                Our operations span across the mineral-rich industrial corridors of Odisha, high-seismic marine environments of the Andaman &amp; Nicobar archipelago, and urban commercial epicenters in Kolkata.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-[#FAF9F6] border border-[#D8D8D2]">
                  <div className="font-medium text-xs text-[#07558F] font-bold uppercase">Our Mission</div>
                  <p className="text-xs text-[#444440] mt-1.5 leading-relaxed">
                    To execute technically demanding civil and structural undertakings with zero compromise on safety, dimensional tolerances, and milestone timelines.
                  </p>
                </div>
                <div className="p-4 bg-[#FAF9F6] border border-[#D8D8D2]">
                  <div className="font-medium text-xs text-[#075638] font-bold uppercase">Our Vision</div>
                  <p className="text-xs text-[#444440] mt-1.5 leading-relaxed">
                    To be the most trusted civil engineering partner for government authorities, institutional developers, and industrial enterprises across Eastern India.
                  </p>
                </div>
              </div>
            </div>

            {/* Right side statutory info */}
            <div className="lg:col-span-5">
              <div className="border border-[#D8D8D2] bg-[#FAF9F6] p-6 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E3DC]">
                  <span className="font-medium text-xs font-bold uppercase tracking-wider text-[#111822]">
                    STATUTORY CREDENTIALS
                  </span>
                  <FiShield className="text-[#07558F]" size={18} />
                </div>

                <div className="space-y-3 font-medium text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#E5E3DC]">
                    <span className="text-[#6B6B67]">Company Name</span>
                    <span className="font-bold text-[#111822]">Neevevera Private Limited</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E5E3DC]">
                    <span className="text-[#6B6B67]">CIN</span>
                    <span className="font-bold text-[#111822]">U45200OR2020PTC033402</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E5E3DC]">
                    <span className="text-[#6B6B67]">Incorporation Date</span>
                    <span className="font-bold text-[#111822]">18 July 2020</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E5E3DC]">
                    <span className="text-[#6B6B67]">Registration ROC</span>
                    <span className="font-bold text-[#111822]">ROC Cuttack, Odisha</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E5E3DC]">
                    <span className="text-[#6B6B67]">Contractor Class</span>
                    <span className="font-bold text-[#075638]">PWD Special Class-A</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#E5E3DC]">
                    <span className="text-[#6B6B67]">ISO Standards</span>
                    <span className="font-bold text-[#111822]">9001:2015 • 45001:2018</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Link
                    to="/contact"
                    className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#07558F] text-white text-xs font-medium font-bold uppercase tracking-wider"
                  >
                    <span>Request Corporate Capability Deck</span>
                    <FiArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics Strip ── */}
      <section className="py-12 border-b border-[#D8D8D2] bg-[#F2EFE9]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {metrics.map((m, idx) => (
              <div key={idx} className="border-l-2 pl-4 py-2 border-[#07558F] bg-white p-4">
                <div className="font-medium text-3xl font-extrabold text-[#111822]">
                  {m.value}
                </div>
                <div className="text-xs font-bold uppercase text-[#07558F] mt-1 font-medium">
                  {m.label}
                </div>
                <div className="text-xs text-[#6B6B67] mt-0.5">
                  {m.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Board & Leadership ── */}
      <section className="py-20 border-b border-[#D8D8D2] bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
            <div>
              <div className="text-xs font-medium font-bold tracking-widest uppercase text-[#07558F] mb-1">
                EXECUTIVE GOVERNANCE
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight">
                Board of Directors &amp; Chief Engineers
              </h2>
            </div>
            <Link
              to="/team"
              className="inline-flex items-center gap-2 text-xs font-medium font-bold uppercase text-[#07558F]"
            >
              <span>View Complete Engineering Roster</span>
              <FiArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {allMembers.slice(0, 4).map((member) => (
              <div key={member.id} className="border border-[#D8D8D2] bg-[#FAF9F6] p-5">
                <div className="aspect-[4/5] w-full overflow-hidden bg-neutral-800 mb-4">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="font-medium text-[10px] text-[#07558F] font-bold uppercase">
                  {member.role}
                </div>
                <h3 className="font-display text-base font-bold text-[#111822] mt-0.5">
                  {member.name}
                </h3>
                <div className="text-[11px] font-medium text-[#6B6B67] mt-1">
                  {member.credentials}
                </div>
                <p className="text-xs text-[#444440] mt-2 line-clamp-3">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Regional Command Hubs ── */}
      <section className="py-20 bg-[#FAF9F6]">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-xs font-medium font-bold tracking-widest uppercase text-[#07558F] mb-1">
            TERRITORIAL DEPLOYMENT
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight mb-10">
            Regional Directorate Network
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#D8D8D2] bg-white p-6 space-y-3">
              <div className="font-medium text-xs font-bold uppercase text-[#07558F]">
                ODISHA HEADQUARTERS
              </div>
              <h3 className="font-display text-lg font-bold text-[#111822]">
                Civil Engineering Directorate
              </h3>
              <p className="text-xs text-[#444440] leading-relaxed">
                Sector 9, CDA Industrial Estate, Cuttack, Odisha - 753014. Oversees central engineering design, heavy machinery fleet, concrete quality laboratory, and state-wide PWD infrastructure works.
              </p>
              <div className="font-medium text-xs text-[#6B6B67] pt-2 border-t border-[#F0EFEA]">
                Direct: +91 8596911655
              </div>
            </div>

            <div className="border border-[#D8D8D2] bg-white p-6 space-y-3">
              <div className="font-medium text-xs font-bold uppercase text-[#075638]">
                ANDAMAN DIRECTORATE
              </div>
              <h3 className="font-display text-lg font-bold text-[#111822]">
                Marine &amp; Coastal Execution Cell
              </h3>
              <p className="text-xs text-[#444440] leading-relaxed">
                Haddo Maritime Corridor, Port Blair, Andaman &amp; Nicobar Islands - 744102. Manages coastal defense seawalls, deep piling in marine subgrades, and seismic Zone-V ductile residential undertakings.
              </p>
              <div className="font-medium text-xs text-[#6B6B67] pt-2 border-t border-[#F0EFEA]">
                Direct: +91 8596911656
              </div>
            </div>

            <div className="border border-[#D8D8D2] bg-white p-6 space-y-3">
              <div className="font-medium text-xs font-bold uppercase text-[#B9923B]">
                KOLKATA REGIONAL OFFICE
              </div>
              <h3 className="font-display text-lg font-bold text-[#111822]">
                Regional Project Procurement
              </h3>
              <p className="text-xs text-[#444440] leading-relaxed">
                Sector V, Salt Lake City, Kolkata, West Bengal - 700091. Manages commercial tower contracting, institutional developer coordination, and supply-chain logistics for heavy construction materials.
              </p>
              <div className="font-medium text-xs text-[#6B6B67] pt-2 border-t border-[#F0EFEA]">
                Direct: +91 33 2955 1040
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
