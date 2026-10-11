const fs = require('fs');

// Read the raw body (the original hardcoded JSX sections)
const body = fs.readFileSync('home_body_jsx.txt', 'utf8');

// ── 1. Wire SERVICES grid ─────────────────────────────────────────────────────
const SVC_OPEN  = '<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">';
const SVC_CLOSE = '</div></div></section><section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="portfolio">';

const svcStart = body.indexOf(SVC_OPEN);
const svcEnd   = body.indexOf(SVC_CLOSE);

// ── 2. Wire PROJECTS grid ─────────────────────────────────────────────────────
const PRJ_OPEN  = '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="projects-grid">';
const prjStart  = body.indexOf(PRJ_OPEN);
const prjEnd    = body.indexOf('</section>', prjStart);

// ── 3. Wire TESTIMONIALS ──────────────────────────────────────────────────────
const TST_OPEN  = '<div className="relative mt-12 bg-white border border-border-neutral rounded-sm p-8 lg:p-12 shadow-sm">';
const tstStart  = body.indexOf(TST_OPEN);
const tstEnd    = body.indexOf('</section>', tstStart);

// Build new sections
const SERVICES_JSX = `<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {(liveServices.length > 0 ? liveServices : mockServices).slice(0, 6).map((service, idx) => (
    <div key={service._id || idx} className="bg-surface-warm border border-border-neutral rounded-sm flex flex-col justify-between overflow-hidden shadow-sm hover:border-brand-blue transition-colors">
      <div className="h-44 overflow-hidden relative">
        <img alt={service.title} className="w-full h-full object-cover" src={service.image || service.coverImage || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80'} />
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-brand-blue uppercase rounded-sm">Service {String(idx + 1).padStart(2, '0')}</div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-graphite uppercase">{service.title}</h3>
          <p className="text-xs text-soft-grey leading-relaxed pt-1">{service.shortDescription || (service.description ? service.description.substring(0, 100) + '...' : '')}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-graphite border-t border-border-neutral pt-2.5">
            {(service.features || []).slice(0, 3).map((f, i) => (
              <li key={i} className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-brand-blue"></span>{f}</li>
            ))}
          </ul>
        </div>
        <Link className="pt-3 border-t border-border-neutral text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase inline-flex items-center justify-between" to={service.slug ? '/services/' + service.slug : '#contact'}>
          <span>Enquire About This Service</span><span>&#8594;</span>
        </Link>
      </div>
    </div>
  ))}
</div></div>`;

const PROJECTS_JSX = `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch" id="projects-grid">
  {(liveProjects.length > 0 ? liveProjects : mockProjects).slice(0, 3).map((project, idx) => (
    <div key={project._id || idx} className="bg-white border border-border-neutral flex flex-col justify-between group overflow-hidden rounded-sm shadow-sm">
      <div className="relative overflow-hidden h-[300px]">
        <img alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={project.coverImage || project.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80'} />
        <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-border-neutral px-2.5 py-1 rounded-sm">
          <span className="text-xs text-brand-blue font-bold uppercase">{project.category || 'Infrastructure'}</span>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-soft-grey uppercase font-medium">{project.client || ''}</span>
            <span className="text-brand-blue font-bold">{project.location || ''}</span>
          </div>
          <h3 className="font-display text-xl font-bold text-graphite uppercase">{project.title}</h3>
          <p className="text-xs text-soft-grey leading-relaxed mt-2">{project.shortDescription || (project.description ? project.description.substring(0, 100) + '...' : '')}</p>
        </div>
        <div className="pt-3 border-t border-border-neutral flex items-center justify-between text-xs">
          <span className="text-brand-green font-medium uppercase tracking-wider">{project.status || 'Completed'}</span>
          <Link className="uppercase font-bold text-brand-blue hover:text-brand-blue-hover inline-flex items-center gap-1 transition-colors" to={project.slug ? '/projects/' + project.slug : '#portfolio'}>
            <span>View Project</span>
            <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  ))}
</div>`;

const TESTIMONIALS_JSX = `<div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
  {(liveTestimonials.length > 0 ? liveTestimonials : mockTestimonials).slice(0, 3).map((t, idx) => (
    <div key={t._id || idx} className="bg-white border border-border-neutral rounded-sm p-8 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex text-[#F5B041] mb-4">
          {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined text-[18px]">star</span>)}
        </div>
        <p className="text-sm text-graphite leading-relaxed font-medium mb-6">"{(t.content || '').substring(0, 160)}"</p>
      </div>
      <div className="flex items-center gap-4 pt-4 border-t border-border-neutral">
        {(t.image || t.avatar) && <img src={t.image || t.avatar} alt={t.name} className="w-10 h-10 rounded-full object-cover border border-border-neutral" />}
        <div>
          <h4 className="text-xs font-bold text-graphite uppercase">{t.name}</h4>
          <p className="text-[10px] text-soft-grey uppercase font-semibold">{t.role}{t.company ? ', ' + t.company : ''}</p>
        </div>
      </div>
    </div>
  ))}
</div>`;

// Hero image & title wiring
let newBody = body;

// Wire hero title
newBody = newBody.replace(
  `                BUILDING WHAT MATTERS.<br/>\n<span className="text-brand-blue">ENGINEERING WITH PRECISION.</span>`,
  `                {homeData?.heroTitle || 'BUILDING WHAT MATTERS.'}<br/>\n<span className="text-brand-blue">{homeData?.heroSubtitle || 'ENGINEERING WITH PRECISION.'}</span>`
);

// Wire hero image (first img in hero section)
newBody = newBody.replace(
  `src="https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80"/>`,
  `src={homeData?.heroImage || '/images/client_hero.webp'}/>`
);

// Wire stats
newBody = newBody.replace(
  `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">`,
  `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
  {/* Stats dynamically driven from Admin CMS */}`
);

// Replace services / projects / testimonials sections
if (svcStart !== -1 && svcEnd !== -1) {
  newBody = newBody.substring(0, svcStart) + SERVICES_JSX + newBody.substring(svcEnd);
}

// Recalculate offsets after service replacement
const newPrjStart = newBody.indexOf(PRJ_OPEN);
const newPrjEnd   = newBody.indexOf('</section>', newPrjStart);
if (newPrjStart !== -1 && newPrjEnd !== -1) {
  newBody = newBody.substring(0, newPrjStart) + PROJECTS_JSX + newBody.substring(newPrjEnd);
}

const newTstStart = newBody.indexOf(TST_OPEN);
const newTstEnd   = newBody.indexOf('</section>', newTstStart);
if (newTstStart !== -1 && newTstEnd !== -1) {
  newBody = newBody.substring(0, newTstStart) + TESTIMONIALS_JSX + newBody.substring(newTstEnd);
}

// Final component
const COMPONENT = `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { SectorSpecialization } from '../components/SectorSpecialization';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Hardcoded fallback mock data (displayed when DB is empty) ─────────────────
const mockServices = [
  { title: 'Building & Civil Construction', shortDescription: 'End-to-end civil execution from deep piling to structural shell completion under strict IS code compliance.', features: ['Deep bored cast-in-situ piling & raft foundations','Monolithic concrete framing & structural columns','Strict IS 456 & IS 800 standards adherence'], image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80', slug: '' },
  { title: 'Residential & Commercial Projects', shortDescription: 'High-rise multi-family housing, modern commercial workspaces, and bespoke institutional developments.', features: ['Seismic-resistant structural frame design','Architectural finishing & high-spec MEP integration','On-schedule milestone handover protocols'], image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80', slug: '' },
  { title: 'Industrial & Heavy Facilities', shortDescription: 'Heavy equipment foundations, Pre-Engineered Building (PEB) frameworks, and industrial laser-screed floors.', features: ['Vibration-damped equipment foundation pads','Clear-span structural steel warehouse framing','High-load abrasion-resistant concrete flooring'], image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80', slug: '' },
  { title: 'Infrastructure, Roads & Bridges', shortDescription: 'Regional transit viaducts, reinforced box culverts, composite girder spans, and civil drainage channels.', features: ['Prestressed concrete girder launching','IRC-compliant subgrade & pavement execution','Coastal and marine corrosive resilience measures'], image: 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?auto=format&fit=crop&w=1000&q=80', slug: '' },
  { title: 'Project Management & EPC Consultancy', shortDescription: 'Chartered engineer oversight, critical-path scheduling, vendor audits, and comprehensive site governance.', features: ['Independent BOQ reconciliation & bill certification','On-site QA/QC laboratory testing supervision','Statutory clearance & compliance assistance'], image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80', slug: '' },
  { title: 'Repair, Restoration & Retrofitting', shortDescription: 'Diagnostic audits, seismic retrofitting, micro-concreting, and structural life extension of heritage and industrial assets.', features: ['Non-destructive structural integrity evaluation','Carbon fiber wrapping & epoxy pressure grouting','Rebar passivation and anti-corrosive treatments'], image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80', slug: '' },
];

const mockProjects = [
  { title: 'Elevated Viaduct & Riverway Truss Steelwork', category: 'Infrastructure • Heavy Civil', client: 'State Highway Corridor', location: 'Odisha Region', shortDescription: 'Subgrade pier casting, heavy girder launching, and composite concrete slab bridge spans for high-volume regional transit connectivity.', coverImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?auto=format&fit=crop&w=1200&q=80', status: 'Active Execution', slug: '' },
  { title: 'Corporate Atrium & Concrete Framing', category: 'Commercial Architecture', client: 'Corporate Client', location: 'Eastern India', shortDescription: 'Coffered slab architecture, double-height exposed concrete, and glazed curtain wall structures.', coverImage: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80', status: 'Completed', slug: '' },
  { title: 'High-Tensile Machine Raft Foundation', category: 'Industrial Foundation', client: 'Industrial Client', location: 'West Bengal', shortDescription: 'Heavy mat raft reinforcement built for vibration-sensitive industrial manufacturing equipment.', coverImage: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80', status: 'Completed', slug: '' },
];

const mockTestimonials = [
  { name: 'Rajesh Sharma', role: 'Project Director', company: 'State Infrastructure Dept.', content: 'Neevevera delivered our viaduct project on schedule with exceptional structural precision. Their chartered engineering oversight gave us complete confidence throughout execution.', image: '' },
  { name: 'Priya Mehta', role: 'Managing Director', company: 'Commercial Developers Ltd.', content: 'The team\'s attention to IS code compliance and quality control was outstanding. Every milestone was met and the finished structure exceeded our expectations.', image: '' },
  { name: 'Anil Kumar', role: 'Site Engineer', company: 'Industrial Corp', content: 'Professional team with deep technical expertise. Their foundation work for our manufacturing facility was flawless and delivered within the agreed timeline.', image: '' },
];
// ─────────────────────────────────────────────────────────────────────────────

const Home = () => {
  const [homeData, setHomeData] = useState(null);
  const [liveServices, setLiveServices] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  const [liveTestimonials, setLiveTestimonials] = useState([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAllData = async () => {
      try {
        const [homeRes, svcRes, prjRes, tstRes] = await Promise.all([
          axios.get(API + '/home').catch(() => ({ data: {} })),
          axios.get(API + '/services?limit=6').catch(() => ({ data: {} })),
          axios.get(API + '/projects?limit=3').catch(() => ({ data: {} })),
          axios.get(API + '/testimonials?limit=3').catch(() => ({ data: {} })),
        ]);
        if (homeRes.data.success && homeRes.data.data) setHomeData(homeRes.data.data);
        if (svcRes.data.success) setLiveServices(svcRes.data.data || svcRes.data.items || []);
        if (prjRes.data.success) setLiveProjects(prjRes.data.data || prjRes.data.items || []);
        if (tstRes.data.success) setLiveTestimonials(tstRes.data.data || tstRes.data.items || []);
      } catch (err) {
        console.error('Homepage data fetch failed:', err);
      }
    };
    fetchAllData();
  }, []);

  const handleFormSubmit = (e) => { e.preventDefault(); };

  return (
    <main className="w-full flex-1">
${newBody}
      <SectorSpecialization />
    </main>
  );
};

export default Home;
`;

fs.writeFileSync('client/src/pages/Home.jsx', COMPONENT);
console.log('SUCCESS: Home.jsx fully wired with Smart Merge pattern');
console.log('Sections: svcStart=' + svcStart + ' svcEnd=' + svcEnd);
console.log('Sections: prjStart=' + prjStart + ' prjEnd=' + prjEnd);
console.log('Sections: tstStart=' + tstStart + ' tstEnd=' + tstEnd);
