import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const sectorData = {
  residential: {
    label: 'Residential',
    title: 'Residential Developments & Housing Complexes',
    desc: 'High-rise multi-family towers, gated communities, and villa enclosures engineered to IS 1893 seismic standards with post-tensioned slab systems and NBC 2016 compliance.',
    points: ['G+20 RCC high-rise framing', 'Seismic ductile detailing', 'Premium MEP integration', 'On-schedule handover'],
    img: 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=800',
    stat: '45+ Units Delivered',
  },
  commercial: {
    label: 'Commercial',
    title: 'Commercial Towers & IT Park Campuses',
    desc: 'Post-tensioned clear floor spans, diagrid facade systems, and premium MEP shafts for corporate headquarters, retail malls, and institutional buildings.',
    points: ['Post-tensioned slab systems', 'Diagrid structural facades', 'LEED-aligned MEP design', 'Statutory clearance'],
    img: 'https://images.pexels.com/photos/1486785/pexels-photo-1486785.jpeg?auto=compress&cs=tinysrgb&w=800',
    stat: '30+ Projects Completed',
  },
  industrial: {
    label: 'Industrial',
    title: 'Heavy Industrial Facilities & Logistics PEB',
    desc: 'Clear-span structural steel frames up to 48m, vibration-damped machinery foundations, and laser-screed FM2 superflat floors for manufacturing and warehousing.',
    points: ['PEB clear-span up to 48m', 'FM2 laser-screed floors', 'Crane runway beam design', 'IS 800:2007 compliant'],
    img: 'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg?auto=compress&cs=tinysrgb&w=800',
    stat: '25+ Facilities Built',
  },
  infrastructure: {
    label: 'Infrastructure',
    title: 'Marine, Bridges & Regional Highway Viaducts',
    desc: 'Deep bored piling, segmental precast box girder launching, coastal seawalls, and arterial roadway construction compliant with IRC:112 and MORTH specifications.',
    points: ['4.2 km+ viaduct spans executed', 'Marine-grade corrosion protection', 'Large-diameter bored piles', '100-year design life'],
    img: 'https://images.pexels.com/photos/210182/pexels-photo-210182.jpeg?auto=compress&cs=tinysrgb&w=800',
    stat: '12+ Major Corridors',
  },
  government: {
    label: 'Government',
    title: 'Public Works & Institutional Development',
    desc: 'Hospitals, administrative complexes, judicial courts, and public utility infrastructure executed to PWD standards with transparent billing and statutory audit trails.',
    points: ['PWD-registered contractor', 'Transparent billing & audit', 'Government tender expertise', 'Statutory compliance'],
    img: 'https://images.pexels.com/photos/1134166/pexels-photo-1134166.jpeg?auto=compress&cs=tinysrgb&w=800',
    stat: '08+ Gov. Projects',
  }
};

export const SectorSpecialization = () => {
  const [activeTab, setActiveTab] = useState('residential');
  const data = sectorData[activeTab];

  return (
    <section className="w-full bg-white border-b border-[#E5E3DC] px-6 lg:px-10 py-14 lg:py-20">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E5E3DC] pb-6 mb-8">
          <div>
            <span className="text-[11px] text-[#07558F] uppercase font-bold tracking-widest block mb-1">06 SECTORS</span>
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-[#111822] uppercase tracking-tight">Sector Specialization</h2>
          </div>
          <Link to="/projects" className="text-xs font-bold text-[#07558F] uppercase hover:underline flex items-center gap-1 shrink-0">
            View All Projects →
          </Link>
        </div>

        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1.5 mb-8">
          {Object.entries(sectorData).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-xs uppercase tracking-wider transition-all rounded-sm font-bold ${
                activeTab === key
                  ? 'bg-[#07558F] text-white shadow-sm'
                  : 'bg-[#F2EFE9] text-[#6B6B67] hover:bg-[#E8E5DF] hover:text-[#111822]'
              }`}
            >
              {val.label}
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border border-[#E5E3DC] bg-[#FAF9F6] overflow-hidden rounded-sm shadow-sm">
          {/* Image */}
          <div className="lg:col-span-5 relative overflow-hidden min-h-[260px]">
            <img
              key={activeTab}
              src={data.img}
              alt={data.title}
              className="w-full h-full object-cover transition-opacity duration-300"
              style={{ minHeight: '260px' }}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#111822]/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-4 left-4 bg-[#07558F] text-white text-xs font-bold px-3 py-1 uppercase rounded-sm">
              {data.stat}
            </div>
          </div>

          {/* Text Content */}
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <h3 className="font-display text-xl lg:text-2xl font-bold text-[#111822] leading-snug">{data.title}</h3>
              <p className="text-sm text-[#6B6B67] leading-relaxed">{data.desc}</p>
              <ul className="space-y-2 pt-2">
                {data.points.map((pt, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-[#333330]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#07558F] shrink-0" />
                    {pt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="pt-4 border-t border-[#E5E3DC] flex items-center justify-between">
              <Link
                to="/projects"
                className="inline-flex items-center gap-2 text-xs font-bold text-[#07558F] uppercase hover:text-[#054373] transition-colors"
              >
                View {data.label} Projects
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
              <Link
                to="/contact"
                className="px-4 py-2 bg-[#07558F] text-white text-xs font-bold uppercase hover:bg-[#054373] transition-colors rounded-sm"
              >
                Get Quote
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
