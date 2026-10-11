import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { SectorSpecialization } from '../components/SectorSpecialization';
import {
  services as mockServices,
  projects as mockProjects,
  testimonials as mockTestimonials
} from '../data/mockData';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
          axios.get(`${API}/home`).catch(() => ({ data: {} })),
          axios.get(`${API}/services?limit=10`).catch(() => ({ data: {} })),
          axios.get(`${API}/projects?limit=10`).catch(() => ({ data: {} })),
          axios.get(`${API}/testimonials?limit=10`).catch(() => ({ data: {} })),
        ]);

        if (homeRes.data?.success && homeRes.data?.data) {
          setHomeData(homeRes.data.data);
        }
        if (svcRes.data?.success) {
          const items = svcRes.data.items || svcRes.data.data || [];
          setLiveServices(items.map((s, idx) => ({
            id: s._id,
            slug: s.slug,
            number: String(idx + 1).padStart(2, '0'),
            title: s.title,
            category: s.category,
            shortDescription: s.shortDescription || (s.description ? s.description.substring(0, 100) + '...' : ''),
            description: s.description,
            image: s.image || s.coverImage || mockServices[idx % mockServices.length]?.image || '/images/client_commercial.webp',
            features: (s.features && s.features.length > 0)
              ? s.features
              : (mockServices[idx % mockServices.length]?.features || ['Deep bored cast-in-situ piling & raft foundations', 'Monolithic concrete framing & structural columns', 'Strict IS 456 & IS 800 standards adherence']),
          })));
        }
        if (prjRes.data?.success) {
          const items = prjRes.data.items || prjRes.data.data || [];
          setLiveProjects(items.map((p, idx) => ({
            id: p._id,
            slug: p.slug,
            title: p.name || p.title,
            category: p.category ? (p.category.charAt(0).toUpperCase() + p.category.slice(1)) : 'Civil Infrastructure',
            location: p.location ? (p.location + (p.region ? `, ${p.region}` : '')) : 'Odisha Region',
            client: p.clientName || p.client || 'State Authority',
            status: p.status === 'commissioned' ? 'Completed' : (p.status || 'Active Execution'),
            shortDescription: p.shortDescription || (p.description ? p.description.substring(0, 120) + '...' : ''),
            coverImage: p.coverImage || p.image || mockProjects[idx % mockProjects.length]?.coverImage || '/images/client_hero.webp',
            specs: p.specs || [],
            spec: p.specs?.[0]?.value || 'Prestressed Girder Architecture',
            projectCode: p.projectCode || (p.slug ? p.slug.split('-')[0].toUpperCase() : 'CIVIL-01'),
          })));
        }
        if (tstRes.data?.success) {
          const items = tstRes.data.items || tstRes.data.data || [];
          setLiveTestimonials(items);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      }
    };

    fetchAllData();
  }, []);

  const handleFormSubmit = (e) => {
    e.preventDefault();
  };

  // ── Smart Merge Pattern: Live data first, padded with mock data ──
  const baseServices = [
    ...liveServices,
    ...mockServices.filter(mock => !liveServices.some(live => live.slug === mock.slug))
  ];
  const featuredSvcIds = (homeData?.featuredServiceIds || []).map(id => (typeof id === 'object' && id?._id) ? String(id._id) : String(id));
  const allServices = (featuredSvcIds.length > 0)
    ? [
        ...baseServices.filter(s => featuredSvcIds.includes(String(s.id || s._id))),
        ...baseServices.filter(s => !featuredSvcIds.includes(String(s.id || s._id)))
      ].slice(0, 6)
    : baseServices.slice(0, 6);

  // Filter live projects: skip ones with known-bad test Cloudinary uploads (si4gj9xf7kbspozye5pe)
  const validLiveProjects = liveProjects.filter(p =>
    !p.coverImage || !p.coverImage.includes('si4gj9xf7kbspozye5pe')
  );

  const baseProjects = [
    ...validLiveProjects,
    ...mockProjects.filter(mock => !validLiveProjects.some(live => live.slug === mock.slug))
  ];
  const featuredProjIds = (homeData?.featuredProjectIds || []).map(id => (typeof id === 'object' && id?._id) ? String(id._id) : String(id));
  const allProjects = (featuredProjIds.length > 0)
    ? [
        ...baseProjects.filter(p => featuredProjIds.includes(String(p.id || p._id))),
        ...baseProjects.filter(p => !featuredProjIds.includes(String(p.id || p._id)))
      ]
    : baseProjects;

  const allTestimonials = [
    ...liveTestimonials,
    ...mockTestimonials.filter(mock => !liveTestimonials.some(live => (live.clientName || live.name) === (mock.clientName || mock.name)))
  ];

  const p1 = allProjects[0] || mockProjects[0];
  const p2 = allProjects[1] || mockProjects[1];
  const p3 = allProjects[2] || mockProjects[2];

  const t1 = allTestimonials[0] || mockTestimonials[0];
  const t2 = allTestimonials[1] || mockTestimonials[1];

  return (
    <main className="w-full flex-1">
<section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-12 lg:py-20">
<div className="max-w-7xl mx-auto">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
{/* Text Column */}
<div className="lg:col-span-5 space-y-6">
<div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border-neutral text-brand-green text-[11px] font-semibold tracking-wider uppercase rounded-sm">
<span className="w-2 h-2 rounded-full bg-brand-green"></span>
<span>Civil Infrastructure • PMC • Turnkey EPC</span>
</div>
<div className="space-y-3">
<h1 className="font-display text-4xl sm:text-5xl lg:text-[52px] text-graphite tracking-tight font-extrabold uppercase leading-[1.08]">{homeData?.heroTitle ? homeData.heroTitle : <>BUILDING WHAT MATTERS.<br/><span className="text-brand-blue">ENGINEERING WITH PRECISION.</span></>}</h1>
<p className="text-base text-soft-grey leading-relaxed">{homeData?.heroSubtitle || 'Engineering and construction solutions across residential, commercial, industrial, and infrastructure developments. Executed with technical performance and structural rigor.'}</p>
</div>
{/* Authentic Indicators */}
<div className="grid grid-cols-3 gap-3 py-3 border-y border-border-neutral text-[11px] text-soft-grey">
<div>
<span className="text-graphite font-bold block text-[13px]">Certified Codes</span>
<span>IS 456 • IS 800 • IRC</span>
</div>
<div>
<span className="text-graphite font-bold block text-[13px]">Precision Build</span>
<span>Structural Tolerance Control</span>
</div>
<div>
<span className="text-graphite font-bold block text-[13px]">Safe Protocols</span>
<span>Rigorous Site HSE</span>
</div>
</div>
<div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
<a className="px-6 py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-colors shadow-sm" href={homeData?.heroCtaLink || '#portfolio'}>
<span>{homeData?.heroCtaLabel || 'Explore Projects'}</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
<a className="px-6 py-3.5 bg-white text-graphite border border-border-neutral hover:bg-surface-muted text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-colors" href="#contact-block">
<span>Contact Us</span>
<span className="material-symbols-outlined text-[15px]">north_east</span>
</a>
</div>
<div className="flex items-center gap-3.5 p-3.5 bg-white border border-border-neutral rounded-sm">
<span className="material-symbols-outlined text-brand-green text-2xl shrink-0">verified</span>
<div className="text-[12px] text-soft-grey">
<span className="font-bold text-graphite block">Director-Led Technical Governance</span>
<span>BE (Civil), MIE, Chart Eng. • MIRC, PBMC Registered</span>
</div>
</div>
</div>
{/* Hero Image Column */}
<div className="lg:col-span-7 relative">
<div className="relative bg-white border border-border-neutral overflow-hidden rounded-sm shadow-sm">
<img alt="Neevevera Active Infrastructure Civil Engineering Site" className="w-full h-[400px] lg:h-[520px] object-cover filter contrast-[1.02]" src={homeData?.heroImage || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"} onError={e => { e.target.onerror=null; e.target.src='/images/client_hero.webp'; }}/>
<div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-transparent to-transparent pointer-events-none"></div>
{/* Top Discreet Badge with Logo Red accent */}
<div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-border-neutral px-3 py-1.5 flex items-center gap-2 rounded-sm">
<span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
<span className="text-[11px] uppercase tracking-wider text-graphite font-semibold">Active Project Execution</span>
</div>
{/* Bottom Caption */}
<div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row justify-between sm:items-end gap-3 text-white">
<div>
<span className="text-[11px] text-white/80 tracking-wider uppercase font-medium">Structural Framework • Cast-in-Situ Core</span>
<p className="font-display text-lg lg:text-xl font-bold">Commercial &amp; Institutional Concrete Superstructure</p>
</div>
<div className="bg-black/60 backdrop-blur-md px-3 py-1.5 border border-white/20 rounded-sm self-start sm:self-auto">
<span className="text-[11px] tracking-wider text-white uppercase font-medium">Engineered Concrete &amp; Rebar Standard</span>
</div>
</div>
</div>
</div>
</div>
</div>
</section>
{/* METRICS STRIP -- driven by homeData.stats from CMS */}
{(() => {
  const borderColors = ['border-brand-blue','border-brand-green','border-brand-gold','border-border-neutral'];
  const textColors   = ['text-graphite','text-brand-green','text-brand-gold','text-graphite'];
  const mockStats = [
    { value: 'XX', suffix: '+', label: 'Projects Delivered' },
    { value: 'XX', suffix: '+', label: 'Years of Leadership' },
    { value: 'XX', suffix: '+', label: 'Field Specialists' },
    { value: '03', suffix: '',  label: 'Regional Command Hubs' },
  ];
  const displayStats = (homeData && homeData.stats && homeData.stats.length > 0)
    ? homeData.stats
    : mockStats;
  return (
    <section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
          {displayStats.map((stat, i) => (
            <div key={i} className={`border-l-2 ${borderColors[i % borderColors.length]} pl-4 space-y-1`}>
              <span className={`font-display text-3xl lg:text-4xl font-extrabold ${textColors[i % textColors.length]}`}>
                {stat.value}{stat.suffix}
              </span>
              <div className="text-[12px] text-soft-grey uppercase font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
})()}
{/* 01 ABOUT US & LEADERSHIP */}
<section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="about">
<div className="max-w-7xl mx-auto space-y-14"><div className="space-y-12"><div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start"><div className="lg:col-span-7 space-y-6">
  <div className="text-xs font-bold text-brand-blue uppercase tracking-wider">{homeData?.whyChooseUsTitle || '01 ABOUT US'}</div>
  <h2 className="font-display text-3xl lg:text-4xl text-graphite tracking-tight font-extrabold uppercase leading-tight">
    {homeData?.introHeadline ? homeData.introHeadline : <>ENGINEERING WITH PURPOSE.<br/>CONSTRUCTION WITH RESPONSIBILITY.</>}
  </h2>
  <p className="text-base text-soft-grey leading-relaxed">
    {homeData?.introBody || 'Neevevera Private Limited is a forward-thinking engineering and construction firm dedicated to creating resilient infrastructure and high-performance buildings. Backed by extensive chartered engineering discipline, we ensure every foundation, frame, and finish adheres to rigorous national codes and lasting craftsmanship.'}
  </p>
  <p className="text-sm text-soft-grey leading-relaxed">Our multidisciplinary team integrates structural analysis, geotechnical insight, and comprehensive project governance to deliver turnkey civil solutions on schedule and within parameters across Eastern India and Island Territories.</p>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
    {(homeData?.whyChooseUsPoints && homeData.whyChooseUsPoints.filter(p => p.title || p.body).length > 0) ? (
      homeData.whyChooseUsPoints.filter(p => p.title || p.body).map((pt, i) => (
        <div key={i} className="p-4 bg-white border border-border-neutral rounded-sm">
          <span className="text-xs font-bold text-brand-blue uppercase block mb-1">{pt.title}</span>
          <p className="text-xs text-soft-grey">{pt.body}</p>
        </div>
      ))
    ) : (
      <>
        <div className="p-4 bg-white border border-border-neutral rounded-sm"><span className="text-xs font-bold text-brand-blue uppercase block mb-1">Code Compliance</span><p className="text-xs text-soft-grey">Full adherence to IS 456 for concrete, IS 800 for structural steel, and relevant IRC transit specifications.</p></div>
        <div className="p-4 bg-white border border-border-neutral rounded-sm"><span className="text-xs font-bold text-brand-green uppercase block mb-1">Structural Governance</span><p className="text-xs text-soft-grey">Independent structural peer reviews, continuous QA/QC cube testing, and comprehensive field inspection logs.</p></div>
      </>
    )}
  </div>
</div><div className="lg:col-span-5 bg-white border border-border-neutral p-6 lg:p-8 space-y-5 rounded-sm shadow-sm"><div className="flex items-center justify-between border-b border-border-neutral pb-3"><span className="text-xs text-brand-blue font-bold uppercase tracking-wider">Leadership Profile</span><span className="w-2 h-2 rounded-full bg-brand-green"></span></div><div><h3 className="font-display text-2xl font-extrabold text-graphite uppercase">Pankaj Kumar Rungta</h3><p className="text-xs text-brand-blue font-semibold uppercase pt-1">Director • Neevevera Private Limited</p></div><div className="bg-surface-muted p-4 space-y-2 border-l-2 border-brand-blue rounded-r-sm"><span className="text-[11px] text-soft-grey uppercase font-semibold">Technical Credentials &amp; Charter</span><p className="font-display text-sm text-graphite font-bold">BE (Civil), MIE, Chart Eng.</p><p className="text-xs text-soft-grey leading-relaxed">MIBC • MIOV • MIRC • PBMC Regd. Professional Civil &amp; Structural Engineer</p></div><p className="text-xs text-soft-grey leading-relaxed">Provides direct technical governance across project engineering, material testing programs, foundation stability, and statutory compliance across all operating regions.</p><div className="pt-2"><a className="inline-flex items-center gap-2 text-xs uppercase font-bold text-brand-blue hover:text-brand-blue-hover transition-colors" href="#contact"><span>Consult Leadership</span><span className="material-symbols-outlined text-[15px]">arrow_forward</span></a></div></div></div><div className="border-t border-border-neutral pt-10"><div className="text-xs font-bold text-brand-blue uppercase tracking-wider mb-6">CORPORATE PILLARS &amp; CHARTER</div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"><div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold text-brand-blue uppercase">Mission</span><span className="material-symbols-outlined text-soft-grey text-lg">flag</span></div><p className="text-xs text-soft-grey leading-relaxed italic bg-surface-warm p-3 border border-border-neutral rounded-sm">[CLIENT CONTENT PENDING — Formal Mission Statement to be Provided by Executive Board]</p></div><div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold text-brand-green uppercase">Vision</span><span className="material-symbols-outlined text-soft-grey text-lg">visibility</span></div><p className="text-xs text-soft-grey leading-relaxed italic bg-surface-warm p-3 border border-border-neutral rounded-sm">[CLIENT CONTENT PENDING — Long-Term Vision Framework to be Provided by Executive Board]</p></div><div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold text-brand-gold uppercase">Company History</span><span className="material-symbols-outlined text-soft-grey text-lg">history_edu</span></div><p className="text-xs text-soft-grey leading-relaxed italic bg-surface-warm p-3 border border-border-neutral rounded-sm">[CLIENT CONTENT PENDING — Detailed Founding Chronology and Milestones to be Provided]</p></div><div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold text-brand-blue uppercase">Core Values</span><span className="material-symbols-outlined text-soft-grey text-lg">verified</span></div><p className="text-xs text-graphite font-medium leading-relaxed">Integrity, Engineering Rigor, Safety Governance, Client Partnership, and Code Adherence.</p></div><div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold text-brand-green uppercase">Certifications</span><span className="material-symbols-outlined text-soft-grey text-lg">workspace_premium</span></div><p className="text-xs text-soft-grey leading-relaxed italic bg-surface-warm p-3 border border-border-neutral rounded-sm">[CLIENT CONTENT PENDING — ISO / Regulatory Certification Registry under review]</p></div><div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm"><div className="flex items-center justify-between"><span className="text-xs font-bold text-brand-gold uppercase">Awards &amp; Recognition</span><span className="material-symbols-outlined text-soft-grey text-lg">military_tech</span></div><p className="text-xs text-soft-grey leading-relaxed italic bg-surface-warm p-3 border border-border-neutral rounded-sm">[CLIENT CONTENT PENDING — Regional Industry Citations to be updated]</p></div></div></div></div></div>
</section>
{/* 02 FEATURED PROJECT SHOWCASE */}
<section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="services"><div className="max-w-7xl mx-auto space-y-12"><div className="flex flex-col md:flex-row justify-between md:items-end gap-4 border-b border-border-neutral pb-4"><div><span className="text-xs text-brand-blue uppercase font-bold tracking-wider">OUR SERVICES</span><h2 className="font-display text-3xl lg:text-4xl font-extrabold text-graphite uppercase">COMPREHENSIVE ENGINEERING &amp; CONSTRUCTION SERVICES</h2></div><p className="text-xs text-soft-grey max-w-md">Turnkey execution, statutory precision, and licensed civil governance delivered across Eastern India.</p></div><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {allServices.map((service, idx) => (
    <div key={service.id || service._id || idx} className="bg-surface-warm border border-border-neutral rounded-sm flex flex-col justify-between overflow-hidden shadow-sm hover:border-brand-blue transition-colors">
      <div className="h-44 overflow-hidden relative">
        <img alt={service.title} className="w-full h-full object-cover" src={service.image || service.coverImage || '/images/client_commercial.webp'} onError={e => { e.target.onerror=null; e.target.src='/images/client_commercial.webp'; }} />
        <div className="absolute top-2 left-2 bg-white/90 px-2 py-0.5 text-[11px] font-bold text-brand-blue uppercase rounded-sm">Service {String(idx + 1).padStart(2, '0')}</div>
      </div>
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <h3 className="font-display text-lg font-bold text-graphite uppercase">{service.title}</h3>
          <p className="text-xs text-soft-grey leading-relaxed pt-1">{service.shortDescription || (service.description ? service.description.substring(0, 100) + '...' : '')}</p>
          <ul className="mt-3 space-y-1.5 text-xs text-graphite border-t border-border-neutral pt-2.5">
            {(service.features && service.features.length > 0 ? service.features : ['Deep bored cast-in-situ piling & raft foundations', 'Monolithic concrete framing & structural columns', 'Strict IS 456 & IS 800 standards adherence']).slice(0, 3).map((f, i) => (
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
</div></div></section><section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24">
<div className="max-w-7xl mx-auto space-y-8">
<div className="flex flex-col md:flex-row justify-between md:items-end gap-3 border-b border-border-neutral pb-4">
<div>
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">02 FEATURED PROJECT</span>
<h2 className="font-display text-2xl lg:text-3xl font-extrabold text-graphite uppercase tracking-tight">FEATURED INFRASTRUCTURE &amp; COMMERCIAL PROJECT</h2>
</div>
<div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-warm border border-border-neutral text-graphite text-xs uppercase font-medium rounded-sm">
<span className="w-2 h-2 rounded-full bg-brand-green"></span>
<span>Commercial Benchmark</span>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-surface-warm border border-border-neutral overflow-hidden rounded-sm shadow-sm">
<div className="lg:col-span-7 relative group overflow-hidden min-h-[380px] lg:min-h-[460px]">
<img alt="High-Rise Commercial Tower" className="w-full h-full object-cover group-hover:scale-[1.01] transition-transform duration-500" src="https://images.unsplash.com/photo-1486325212027-8081e485255e?auto=format&fit=crop&w=1200&q=80"/>
<div className="absolute bottom-3 left-3 bg-graphite/85 backdrop-blur-md px-3 py-1 text-xs text-white rounded-sm">
              Eastern Regional Commercial Hub
            </div>
</div>
<div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between space-y-6">
<div className="space-y-4">
<span className="text-xs text-brand-blue uppercase tracking-wider font-semibold">Turnkey Commercial Architecture</span>
<h3 className="font-display text-2xl font-black text-graphite uppercase leading-snug">
                High-Rise Commercial Tower &amp; Structural Envelope
              </h3>
<p className="text-sm text-soft-grey leading-relaxed">
                Comprehensive civil turnkey execution including deep bored cast-in-situ piles, pre-stressed structural concrete core, and integrated seismic-resistant diagrid facade engineering.
              </p>
<div className="space-y-2 border-t border-border-neutral pt-3 text-xs">
<div className="flex justify-between py-1.5 px-2.5 bg-white rounded-sm">
<span className="text-soft-grey">Scope of Works</span>
<span className="font-semibold text-graphite">Civil, Structural &amp; Diagrid Framing</span>
</div>
<div className="flex justify-between py-1.5 px-2.5 bg-surface-muted rounded-sm">
<span className="text-soft-grey">Structural Steel</span>
<span className="font-semibold text-graphite">Fe550D High-Yield Rebar</span>
</div>
<div className="flex justify-between py-1.5 px-2.5 bg-white rounded-sm">
<span className="text-soft-grey">Floor Precision</span>
<span className="font-semibold text-graphite">Laser Screed Superflat Finish</span>
</div>
<div className="flex justify-between py-1.5 px-2.5 bg-surface-muted rounded-sm">
<span className="text-soft-grey">Status</span>
<span className="font-semibold text-brand-green">Successfully Commissioned</span>
</div>
</div>
</div>
<div>
<a className="w-full py-3 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs uppercase tracking-wider font-semibold flex items-center justify-center gap-2 rounded-sm transition-colors shadow-sm" href="#contact-block">
<span>Request Detailed Case Study</span>
<span className="material-symbols-outlined text-[15px]">arrow_forward</span>
</a>
</div>
</div>
</div>
</div>
</section>
{/* 03 OUR PROJECTS (Asymmetric Project Index) */}
<section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="portfolio">
<div className="max-w-7xl mx-auto space-y-10">
<div className="flex flex-col md:flex-row justify-between md:items-end gap-5">
<div>
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">03 OUR PROJECTS</span>
<h2 className="font-display text-3xl font-extrabold text-graphite uppercase">PROJECT PORTFOLIO</h2>
</div>
{/* Clean Category Filter Tabs */}
<div className="flex flex-wrap items-center gap-1.5 text-xs bg-white p-1 border border-border-neutral rounded-sm" id="project-filter-bar">
<button className="filter-btn px-3.5 py-1.5 bg-brand-blue text-white uppercase font-bold rounded-sm transition-colors" data-filter="all">ALL</button>
<button className="filter-btn px-3.5 py-1.5 text-soft-grey hover:text-graphite uppercase font-medium rounded-sm transition-colors" data-filter="residential">RESIDENTIAL</button>
<button className="filter-btn px-3.5 py-1.5 text-soft-grey hover:text-graphite uppercase font-medium rounded-sm transition-colors" data-filter="commercial">COMMERCIAL</button>
<button className="filter-btn px-3.5 py-1.5 text-soft-grey hover:text-graphite uppercase font-medium rounded-sm transition-colors" data-filter="industrial">INDUSTRIAL</button>
<button className="filter-btn px-3.5 py-1.5 text-soft-grey hover:text-graphite uppercase font-medium rounded-sm transition-colors" data-filter="infrastructure">INFRASTRUCTURE</button>
<button className="filter-btn px-3.5 py-1.5 text-soft-grey hover:text-graphite uppercase font-medium rounded-sm transition-colors" data-filter="government">GOVERNMENT</button>
</div>
</div>
{/* Asymmetric Cards Grid */}
<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch" id="projects-grid">
{/* Card 1: Main Featured Project (7 Cols) */}
<div className="project-item lg:col-span-7 bg-white border border-border-neutral flex flex-col justify-between group overflow-hidden rounded-sm shadow-sm" data-category="infrastructure government">
<div className="relative overflow-hidden h-[300px] lg:h-[380px]">
<img alt={p1.title || p1.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={p1.coverImage || p1.image || 'https://images.unsplash.com/photo-1558024920-b41e1887dc32?auto=format&fit=crop&w=1000&q=80'}/>
<div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm border border-border-neutral px-2.5 py-1 rounded-sm">
<span className="text-xs text-brand-blue font-bold uppercase">{p1.category || 'Infrastructure • Heavy Civil'}</span>
</div>
<div className="absolute bottom-3 right-3 bg-brand-green text-white px-2.5 py-1 text-xs uppercase font-medium rounded-sm">
  {p1.status || 'Active Execution'}
</div>
</div>
<div className="p-6 space-y-3">
<div className="flex items-center justify-between text-xs">
<span className="text-soft-grey uppercase font-medium">{p1.client || p1.clientName || 'State Highway Corridor'}</span>
<span className="text-brand-blue font-bold">{p1.location || 'Odisha Region'}</span>
</div>
<h3 className="font-display text-xl font-bold text-graphite uppercase">
  {p1.title || p1.name}
</h3>
<p className="text-xs text-soft-grey leading-relaxed">
  {p1.shortDescription || (p1.description ? p1.description.substring(0, 120) + '...' : 'Subgrade pier casting, heavy girder launching, and composite concrete slab bridge spans for high-volume regional transit connectivity.')}
</p>
<div className="pt-2 border-t border-border-neutral flex items-center justify-between text-xs">
<span className="text-soft-grey">{p1.spec || (p1.specs?.[0]?.value) || 'Prestressed Girder Architecture'}</span>
<Link className="uppercase font-bold text-brand-blue hover:text-brand-blue-hover inline-flex items-center gap-1 transition-colors" to={p1.slug ? '/projects/' + p1.slug : '#portfolio'}>
<span>View Project Dossier</span>
<span className="material-symbols-outlined text-[14px]">arrow_forward</span>
</Link>
</div>
</div>
</div>

{/* Stacked Right Cards (5 Cols) */}
<div className="lg:col-span-5 flex flex-col gap-6 justify-between">
{/* Card 2: Commercial Project */}
<div className="project-item bg-white border border-border-neutral flex flex-col sm:flex-row group overflow-hidden rounded-sm shadow-sm" data-category="commercial residential">
<div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
<img alt={p2.title || p2.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={p2.coverImage || p2.image || 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80'}/>
</div>
<div className="sm:w-3/5 p-5 flex flex-col justify-between space-y-2">
<div>
<span className="text-[11px] text-brand-blue font-bold uppercase">{p2.category || 'Commercial Architecture'}</span>
<h4 className="font-display text-base font-bold text-graphite uppercase pt-1">{p2.title || p2.name}</h4>
<p className="text-xs text-soft-grey pt-1">{p2.shortDescription || (p2.description ? p2.description.substring(0, 90) + '...' : 'Coffered slab architecture, double-height exposed concrete, and glazed curtain wall structures.')}</p>
</div>
<div className="pt-2 border-t border-border-neutral flex items-center justify-between text-xs">
<span className="text-brand-green font-medium">{p2.status || 'Completed'}</span>
<Link className="font-bold text-brand-blue hover:text-brand-blue-hover uppercase" to={p2.slug ? '/projects/' + p2.slug : '#portfolio'}>Details →</Link>
</div>
</div>
</div>

{/* Card 3: Industrial Foundation Project */}
<div className="project-item bg-white border border-border-neutral flex flex-col sm:flex-row group overflow-hidden rounded-sm shadow-sm" data-category="industrial infrastructure">
<div className="sm:w-2/5 h-48 sm:h-auto overflow-hidden">
<img alt={p3.title || p3.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={p3.coverImage || p3.image || 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80'}/>
</div>
<div className="sm:w-3/5 p-5 flex flex-col justify-between space-y-2">
<div>
<span className="text-[11px] text-brand-gold font-bold uppercase">{p3.category || 'Industrial Foundation • QA'}</span>
<h4 className="font-display text-base font-bold text-graphite uppercase pt-1">{p3.title || p3.name}</h4>
<p className="text-xs text-soft-grey pt-1">{p3.shortDescription || (p3.description ? p3.description.substring(0, 90) + '...' : 'Heavy mat raft reinforcement built for vibration-sensitive industrial manufacturing equipment.')}</p>
</div>
<div className="pt-2 border-t border-border-neutral flex items-center justify-between text-xs">
<span className="text-soft-grey">{p3.status || 'Controlled Quality'}</span>
<Link className="font-bold text-brand-blue hover:text-brand-blue-hover uppercase" to={p3.slug ? '/projects/' + p3.slug : '#portfolio'}>Details →</Link>
</div>
</div>
</div>
</div>
</div></div>
</section>
{/* 04 CAPABILITIES (8 Core PRD Divisions) */}
<section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="capabilities">
<div className="max-w-7xl mx-auto space-y-12">
<div className="max-w-3xl space-y-3">
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">04 CAPABILITIES</span>
<h2 className="font-display text-3xl lg:text-4xl font-extrabold text-graphite uppercase">OUR CORE PRACTICE DIVISIONS</h2>
<p className="text-base text-soft-grey leading-relaxed">
            Full-spectrum civil construction, engineering consultation, and turnkey project delivery structured to meet exact architectural and statutory standards.
          </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
{/* 01 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">01</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">apartment</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Building &amp; Civil Construction</h3>
<p className="text-xs text-soft-grey leading-relaxed">Foundation piling, structural columns, core framing, and full building envelope construction adhering strictly to IS 456 codes.</p>
</div>
{/* 02 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">02</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">home_work</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Residential &amp; Commercial</h3>
<p className="text-xs text-soft-grey leading-relaxed">High-rise housing, luxury residential developments, corporate offices, institutional complexes, and modern retail environments.</p>
</div>
{/* 03 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">03</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">factory</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Industrial Construction</h3>
<p className="text-xs text-soft-grey leading-relaxed">Pre-engineered buildings (PEB), heavy machine foundations, logistics warehouses, and industrial floor systems.</p>
</div>
{/* 04 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">04</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">bridge</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Infrastructure &amp; Bridges</h3>
<p className="text-xs text-soft-grey leading-relaxed">Elevated viaducts, box culverts, bridge spans, arterial roadways, and water conveyance channels.</p>
</div>
{/* 05 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">05</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">schema</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Project Management &amp; Consultancy</h3>
<p className="text-xs text-soft-grey leading-relaxed">Comprehensive PMC, CPM scheduling, bill auditing, vendor procurement governance, and site quality control.</p>
</div>
{/* 06 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">06</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">build_circle</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Repair, Restoration &amp; Retrofitting</h3>
<p className="text-xs text-soft-grey leading-relaxed">Structural rehabilitation, seismic retrofits, carbon fiber wrapping, crack injection, and non-destructive structural audits.</p>
</div>
{/* 07 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">07</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">engineering</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Technical &amp; Manpower Services</h3>
<p className="text-xs text-soft-grey leading-relaxed">Deployment of licensed resident civil engineers, precision surveyors, QA inspectors, and experienced craft teams.</p>
</div>
{/* 08 */}
<div className="bg-surface-warm border border-border-neutral p-6 space-y-3 rounded-sm hover:border-brand-blue transition-colors">
<div className="flex items-center justify-between">
<span className="text-sm font-bold text-brand-blue">08</span>
<span className="material-symbols-outlined text-soft-grey text-[22px]">draw</span>
</div>
<h3 className="font-display text-base font-bold text-graphite uppercase">Design &amp; 3D Modeling Services</h3>
<p className="text-xs text-soft-grey leading-relaxed">BIM structural coordination, architectural rendering, STAAD/ETABS analysis, and good-for-construction (GFC) drawings.</p>
</div>
</div>
</div>
</section>
{/* 05 HOW WE WORK (5-Stage Discipline) */}
<section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24">
<div className="max-w-7xl mx-auto space-y-12">
<div className="space-y-3">
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">05 HOW WE WORK</span>
<h2 className="font-display text-3xl font-extrabold text-graphite uppercase">OUR EXECUTION PROCESS</h2>
<p className="text-base text-soft-grey max-w-2xl leading-relaxed">
            From preliminary geotechnical assessments to final building handover, every phase requires technical validation before proceeding.
          </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-5 gap-4">
{/* Step 01 */}
<div className="bg-white border border-border-neutral p-5 flex flex-col justify-between space-y-4 rounded-sm shadow-sm">
<div className="space-y-2">
<div className="flex items-center justify-between border-b border-border-neutral pb-2">
<span className="text-xs font-bold text-brand-blue">01 PLAN</span>
<span className="material-symbols-outlined text-sm text-soft-grey">explore</span>
</div>
<h4 className="font-display text-sm font-bold text-graphite uppercase">Assessment &amp; Feasibility</h4>
<p className="text-xs text-soft-grey leading-relaxed">Site survey, soil strata sampling, environmental reviews, and preliminary master layout validation.</p>
</div>
<div className="pt-2 border-t border-border-neutral text-[11px] font-semibold text-graphite">
              Deliverable: Project Charter
            </div>
</div>
{/* Step 02 */}
<div className="bg-white border border-border-neutral p-5 flex flex-col justify-between space-y-4 rounded-sm shadow-sm">
<div className="space-y-2">
<div className="flex items-center justify-between border-b border-border-neutral pb-2">
<span className="text-xs font-bold text-brand-blue">02 DESIGN</span>
<span className="material-symbols-outlined text-sm text-soft-grey">architecture</span>
</div>
<h4 className="font-display text-sm font-bold text-graphite uppercase">Engineering &amp; Modeling</h4>
<p className="text-xs text-soft-grey leading-relaxed">Structural calculations, load schedules, MEP clash detection, and good-for-construction documentation.</p>
</div>
<div className="pt-2 border-t border-border-neutral text-[11px] font-semibold text-graphite">
              Deliverable: GFC Drawings
            </div>
</div>
{/* Step 03 */}
<div className="bg-white border border-border-neutral p-5 flex flex-col justify-between space-y-4 rounded-sm shadow-sm">
<div className="space-y-2">
<div className="flex items-center justify-between border-b border-border-neutral pb-2">
<span className="text-xs font-bold text-brand-blue">03 EXECUTE</span>
<span className="material-symbols-outlined text-sm text-soft-grey">construction</span>
</div>
<h4 className="font-display text-sm font-bold text-graphite uppercase">Mobilize &amp; Construct</h4>
<p className="text-xs text-soft-grey leading-relaxed">Machinery mobilization, bar bending pacing, formwork assembly, and disciplined concrete pouring.</p>
</div>
<div className="pt-2 border-t border-border-neutral text-[11px] font-semibold text-graphite">
              Deliverable: Monolithic Frame
            </div>
</div>
{/* Step 04 */}
<div className="bg-white border border-border-neutral p-5 flex flex-col justify-between space-y-4 rounded-sm shadow-sm">
<div className="space-y-2">
<div className="flex items-center justify-between border-b border-border-neutral pb-2">
<span className="text-xs font-bold text-brand-blue">04 CONTROL</span>
<span className="material-symbols-outlined text-sm text-soft-grey">fact_check</span>
</div>
<h4 className="font-display text-sm font-bold text-graphite uppercase">Quality &amp; Safety Audit</h4>
<p className="text-xs text-soft-grey leading-relaxed">Mandatory cube strength tests, ultrasonic inspections, rebar cover verification, and site HSE tracking.</p>
</div>
<div className="pt-2 border-t border-border-neutral text-[11px] font-semibold text-graphite">
              Deliverable: QA/QC Certification
            </div>
</div>
{/* Step 05 */}
<div className="bg-white border border-border-neutral p-5 flex flex-col justify-between space-y-4 rounded-sm shadow-sm">
<div className="space-y-2">
<div className="flex items-center justify-between border-b border-border-neutral pb-2">
<span className="text-xs font-bold text-brand-blue">05 DELIVER</span>
<span className="material-symbols-outlined text-sm text-soft-grey">task_alt</span>
</div>
<h4 className="font-display text-sm font-bold text-graphite uppercase">Handover &amp; Commission</h4>
<p className="text-xs text-soft-grey leading-relaxed">Integrated testing, fire safety approvals, as-built dossiers, and final defect liability warranty.</p>
</div>
<div className="pt-2 border-t border-border-neutral text-[11px] font-semibold text-graphite">
              Deliverable: Completion Protocol
            </div>
</div>
</div>
</div>
</section>
{/* 06 SECTORS (Interactive Specialization Tabs) */}\n<SectorSpecialization />\n{/* 07 RESOURCE NETWORK & PIN CODE AUDITOR */}
{/* 08 FIELD GALLERY & 10 TESTIMONIALS */}
<section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24">
<div className="max-w-7xl mx-auto space-y-16">
{/* 08 FIELD GALLERY */}
<div className="space-y-6">
<div className="flex flex-col sm:flex-row justify-between sm:items-end gap-3 border-b border-border-neutral pb-3">
<div>
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">08 FIELD GALLERY</span>
<h2 className="font-display text-2xl lg:text-3xl font-extrabold text-graphite uppercase">DOCUMENTARY FIELD OBSERVATIONS</h2>
</div>
<span className="text-xs text-soft-grey uppercase">Engineering in Progress</span>
</div>
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
<div className="bg-surface-warm border border-border-neutral overflow-hidden rounded-sm group">
<div className="h-48 overflow-hidden">
<img alt="Active Foundation Pour" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="/images/client_hero.webp"/>
</div>
<div className="p-3.5 space-y-1">
<span className="text-[11px] font-bold text-brand-blue uppercase">Site Staging</span>
<p className="text-xs text-graphite font-semibold">Superstructure Concrete Pour</p>
<p className="text-[11px] text-soft-grey">Formwork alignment and beam inspections.</p>
</div>
</div>
<div className="bg-surface-warm border border-border-neutral overflow-hidden rounded-sm group">
<div className="h-48 overflow-hidden">
<img alt="Foundation Rebar Cage Inspection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?auto=format&fit=crop&w=800&q=80"/>
</div>
<div className="p-3.5 space-y-1">
<span className="text-[11px] font-bold text-brand-green uppercase">Quality Assurance</span>
<p className="text-xs text-graphite font-semibold">Rebar Spacing Verification</p>
<p className="text-[11px] text-soft-grey">Cover blocks and tie bar integrity checks.</p>
</div>
</div>
<div className="bg-surface-warm border border-border-neutral overflow-hidden rounded-sm group">
<div className="h-48 overflow-hidden">
<img alt="Infrastructure Viaduct Works" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1558024920-b41e1887dc32?auto=format&fit=crop&w=1000&q=80"/>
</div>
<div className="p-3.5 space-y-1">
<span className="text-[11px] font-bold text-brand-gold uppercase">Infrastructure</span>
<p className="text-xs text-graphite font-semibold">Girder Launching Operations</p>
<p className="text-[11px] text-soft-grey">Heavy crane coordination and alignment.</p>
</div>
</div>
<div className="bg-surface-warm border border-border-neutral overflow-hidden rounded-sm group">
<div className="h-48 overflow-hidden">
<img alt="Architectural Atrium" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80"/>
</div>
<div className="p-3.5 space-y-1">
<span className="text-[11px] font-bold text-brand-blue uppercase">Interiors</span>
<p className="text-xs text-graphite font-semibold">Exposed Concrete Finish</p>
<p className="text-[11px] text-soft-grey">High-specification architectural handover.</p>
</div>
</div>
</div>
</div>
{/* 10 TESTIMONIALS */}
<div className="space-y-6">
<div className="flex items-center justify-between border-b border-border-neutral pb-3">
<div>
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">10 TESTIMONIALS</span>
<h2 className="font-display text-2xl font-extrabold text-graphite uppercase">CLIENT &amp; PARTNER FEEDBACK</h2>
</div>
<span className="text-xs text-soft-grey uppercase">Performance Audits</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<div className="bg-surface-warm border border-border-neutral p-6 space-y-4 rounded-sm">
<div className="flex items-center gap-2 text-brand-gold">
<span className="material-symbols-outlined text-[20px]">format_quote</span>
<span className="text-xs font-bold text-graphite uppercase">{t1.clientOrganization || t1.company || 'Commercial Asset Developer • Eastern Region'}</span>
</div>
<p className="text-sm text-soft-grey italic leading-relaxed">
  "{t1.review || t1.content || 'Neevevera brought architectural discipline and uncompromising engineering precision to our commercial foundations. Their site supervision team caught critical deviations before pour, saving substantial project time and cost.'}"
</p>
<div className="text-xs text-soft-grey border-t border-border-neutral pt-2">
  {t1.clientName || t1.name || 'Verified Client'} • Verified Project Review • {t1.projectRef || 'Commercial Tower Scope'}
</div>
</div>
<div className="bg-surface-warm border border-border-neutral p-6 space-y-4 rounded-sm flex flex-col justify-between">
<div className="space-y-3">
<div className="flex items-center gap-2 text-brand-gold">
<span className="material-symbols-outlined text-[20px]">format_quote</span>
<span className="text-xs font-bold text-graphite uppercase">{t2.clientOrganization || t2.company || 'Public Works & Institutional Partner'}</span>
</div>
<p className="text-sm text-soft-grey italic leading-relaxed">
  "{t2.review || t2.content || 'Exceptional rigor in concrete mix design and continuous cube testing logs. The Neevevera engineering team met all IRC standard specifications on the regional corridor project.'}"
</p>
</div>
<div className="text-xs text-soft-grey border-t border-border-neutral pt-2">
  {t2.clientName || t2.name || 'Suresh Kumar (Chief Engineer)'} • Official Certification Registry • {t2.projectRef || 'Regional Infrastructure Audit'}
</div>
</div>
</div></div>
</div>
</section>
{/* 09 LEADERSHIP & TECHNICAL GOVERNANCE */}
<section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24">
<div className="max-w-7xl mx-auto space-y-12">
<div className="space-y-3">
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">09 LEADERSHIP</span>
<h2 className="font-display text-3xl font-extrabold text-graphite uppercase">TECHNICAL GOVERNANCE &amp; FIELD LEADS</h2>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
<div className="lg:col-span-5 bg-white border border-border-neutral p-6 lg:p-8 space-y-5 rounded-sm shadow-sm">
<span className="text-xs text-brand-blue font-bold tracking-wider uppercase">Director Technical Profile</span>
<div className="space-y-1">
<h3 className="font-display text-2xl font-black text-graphite uppercase">Pankaj Kumar Rungta</h3>
<p className="text-xs text-brand-blue font-bold uppercase">Chartered Engineer • Managing Director</p>
</div>
<div className="space-y-2 text-xs">
<div className="p-3 bg-surface-warm border-l-2 border-brand-blue rounded-r-sm">
<div className="font-bold text-graphite">BE (Civil) • MIE • Chartered Engineer</div>
<div className="text-soft-grey">The Institution of Engineers (India) Chartered Roster</div>
</div>
<div className="p-3 bg-white border border-border-neutral rounded-sm">
<div className="font-bold text-graphite">MIBC • MIOV • MIRC • PBMC Registered</div>
<div className="text-soft-grey">Indian Roads Congress &amp; Structural Valuation Panels</div>
</div>
</div>
<p className="text-xs text-soft-grey leading-relaxed">
              Provides direct technical governance over site execution, subgrade seismic modeling, material cube testing logs, and statutory building compliance across state development jurisdictions.
            </p>
<div className="pt-2 border-t border-border-neutral flex items-center gap-2 text-brand-green text-xs font-bold">
<span className="material-symbols-outlined text-[18px]">verified_user</span>
<span>100% Regulatory &amp; Technical Accreditation</span>
</div>
</div>
<div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
<div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm shadow-sm">
<span className="text-xs font-bold text-brand-blue">Practice Discipline 01</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">Project Managers (PMC)</h4>
<p className="text-xs text-soft-grey leading-relaxed">Experienced civil managers handling critical path schedules, contractor accountability, and budget compliance.</p>
</div>
<div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm shadow-sm">
<span className="text-xs font-bold text-brand-blue">Practice Discipline 02</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">Structural Engineers</h4>
<p className="text-xs text-soft-grey leading-relaxed">Specialists assessing wind shear, seismic coefficients, and high-tensile column loads for multi-story builds.</p>
</div>
<div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm shadow-sm">
<span className="text-xs font-bold text-brand-green">Practice Discipline 03</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">Site QA/QC Officers</h4>
<p className="text-xs text-soft-grey leading-relaxed">Resident supervisors verifying slump tests, concrete cover clearance, batch mix logs, and curing intervals.</p>
</div>
<div className="bg-white border border-border-neutral p-5 space-y-2 rounded-sm shadow-sm">
<span className="text-xs font-bold text-brand-gold">Practice Discipline 04</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">BIM &amp; CAD Modelers</h4>
<p className="text-xs text-soft-grey leading-relaxed">Digital coordination teams resolving architectural, structural, and MEP clashes prior to ground breaking.</p>
</div>
</div>
</div>
</div>
</section>
{/* 11 CAREERS & 12 INSIGHTS */}
<section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-16 lg:py-24" id="insights">
<div className="max-w-7xl mx-auto space-y-16">
{/* 11 CAREERS BANNER */}
<div className="bg-surface-warm border border-border-neutral p-6 lg:p-10 rounded-sm shadow-sm space-y-8" id="careers"><div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-border-neutral pb-6"><div><span className="text-xs text-brand-blue uppercase font-bold tracking-wider">CAREERS AT NEEVEVERA</span><h3 className="font-display text-2xl lg:text-3xl font-black text-graphite uppercase">BUILD YOUR CAREER WITH US</h3><p className="text-sm text-soft-grey leading-relaxed mt-1 max-w-2xl">Join our chartered engineering team working on key commercial, residential, and infrastructure assets across Odisha, Andaman, and West Bengal.</p></div><div><a className="px-5 py-3 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs uppercase font-bold text-center tracking-wider rounded-sm transition-colors shadow-sm inline-flex items-center gap-2" href="mailto:careers@neevevara.com?subject=Application%20for%20Civil%20Engineering%20Role"><span>Submit Resume</span><span className="material-symbols-outlined text-[15px]">arrow_forward</span></a></div></div><div className="space-y-4"><div className="flex items-center justify-between"><h4 className="font-display text-sm font-bold text-graphite uppercase tracking-wide">CURRENT OPENINGS</h4><span className="text-xs text-soft-grey">3 Positions Listed</span></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div className="bg-white border border-border-neutral p-5 rounded-sm flex flex-col justify-between space-y-3"><div className="space-y-2"><span className="text-[10px] font-bold px-2 py-0.5 bg-surface-muted text-brand-blue uppercase rounded-sm inline-block">SAMPLE OPENING — CONTENT PENDING</span><h5 className="font-display text-sm font-bold text-graphite uppercase">Senior Civil Engineer • Infrastructure</h5><div className="text-xs text-brand-blue font-medium">Location: Cuttack / Odisha • Full Time</div><p className="text-xs text-soft-grey leading-relaxed">Lead site engineering for bridge viaducts and structural concrete projects. Minimum 5+ years field experience required.</p></div><a className="text-xs font-bold text-brand-blue hover:underline uppercase inline-flex items-center gap-1 pt-2 border-t border-border-neutral" href="mailto:careers@neevevara.com?subject=Application%20-%20Senior%20Civil%20Engineer"><span>View Opening / Apply</span><span>→</span></a></div><div className="bg-white border border-border-neutral p-5 rounded-sm flex flex-col justify-between space-y-3"><div className="space-y-2"><span className="text-[10px] font-bold px-2 py-0.5 bg-surface-muted text-brand-green uppercase rounded-sm inline-block">SAMPLE OPENING — CONTENT PENDING</span><h5 className="font-display text-sm font-bold text-graphite uppercase">Site QA/QC Supervisor • Industrial</h5><div className="text-xs text-brand-green font-medium">Location: Port Blair • Andaman • Full Time</div><p className="text-xs text-soft-grey leading-relaxed">Oversee rebar placement, concrete cube testing, batching logs, and statutory civil quality protocols.</p></div><a className="text-xs font-bold text-brand-blue hover:underline uppercase inline-flex items-center gap-1 pt-2 border-t border-border-neutral" href="mailto:careers@neevevara.com?subject=Application%20-%20Site%20QA/QC%20Supervisor"><span>View Opening / Apply</span><span>→</span></a></div><div className="bg-white border border-border-neutral p-5 rounded-sm flex flex-col justify-between space-y-3"><div className="space-y-2"><span className="text-[10px] font-bold px-2 py-0.5 bg-surface-muted text-brand-gold uppercase rounded-sm inline-block">SAMPLE OPENING — CONTENT PENDING</span><h5 className="font-display text-sm font-bold text-graphite uppercase">BIM &amp; Structural Modeler</h5><div className="text-xs text-brand-gold font-medium">Location: Kolkata / Remote • Full Time</div><p className="text-xs text-soft-grey leading-relaxed">Produce Revit/AutoCAD structural models, clash detection reports, and good-for-construction shop drawings.</p></div><a className="text-xs font-bold text-brand-blue hover:underline uppercase inline-flex items-center gap-1 pt-2 border-t border-border-neutral" href="mailto:careers@neevevara.com?subject=Application%20-%20BIM%20Modeler"><span>View Opening / Apply</span><span>→</span></a></div></div></div></div>
{/* 12 INSIGHTS & MEDIA (Whitepapers & Podcast) */}
<div className="space-y-6">
<div className="border-b border-border-neutral pb-3 flex justify-between items-end">
<div>
<span className="text-xs text-brand-blue uppercase font-bold tracking-wider">12 INSIGHTS &amp; MEDIA</span>
<h2 className="font-display text-2xl font-extrabold text-graphite uppercase">TECHNICAL INSIGHTS &amp; FIELD NOTES</h2>
</div>
<span className="text-xs text-soft-grey uppercase hidden sm:inline">Engineering Publications</span>
</div>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<article className="bg-surface-warm border border-border-neutral p-5 space-y-3 flex flex-col justify-between rounded-sm">
<div className="space-y-2">
<span className="text-[11px] text-brand-blue uppercase font-bold">Field Note • Foundation</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">Deep Piling Protocols in Coastal Soils</h4>
<p className="text-xs text-soft-grey leading-relaxed">Technical review of sulfate-resistant cement mixes, bentonite slurry management, and pile integrity testing in island conditions.</p>
</div>
<a className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase pt-2 border-t border-border-neutral inline-flex items-center justify-between" href="#contact-block">
<span>Read Specification</span>
<span>→</span>
</a>
</article>
<article className="bg-surface-warm border border-border-neutral p-5 space-y-3 flex flex-col justify-between rounded-sm">
<div className="space-y-2">
<span className="text-[11px] text-brand-green uppercase font-bold">Field Note • Quality Control</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">Non-Destructive Testing for Concrete</h4>
<p className="text-xs text-soft-grey leading-relaxed">Calibrating rebound hammers and ultrasonic pulse velocity metrics to evaluate structural soundness in commercial concrete cores.</p>
</div>
<a className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase pt-2 border-t border-border-neutral inline-flex items-center justify-between" href="#contact-block">
<span>Read Specification</span>
<span>→</span>
</a>
</article>
<article className="bg-surface-warm border border-border-neutral p-5 space-y-3 flex flex-col justify-between rounded-sm">
<div className="space-y-2">
<span className="text-[11px] text-brand-gold uppercase font-bold">Podcast • Audio Dispatch</span>
<h4 className="font-display text-base font-bold text-graphite uppercase">Regional Infrastructure Podcast</h4>
<p className="text-xs text-soft-grey leading-relaxed">Discussions with chartered engineers on regional logistics, subgrade soil behavior, and modern fast-track bridge building.</p>
</div>
<a className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase pt-2 border-t border-border-neutral inline-flex items-center justify-between" href="#contact-block">
<span>Listen to Episode</span>
<span>→</span>
</a>
</article>
</div>
</div>
</div>
</section>
{/* 13 CONTACT US & REGIONAL COMMANDS */}
<section className="w-full bg-surface-warm px-6 lg:px-10 py-16 lg:py-24 border-b border-border-neutral" id="contact"><div className="max-w-7xl mx-auto space-y-12"><div className="flex flex-col md:flex-row justify-between md:items-end gap-6 border-b border-border-neutral pb-6"><div><span className="text-xs text-brand-blue uppercase font-bold tracking-wider">CONTACT US</span><h2 className="font-display text-3xl lg:text-5xl font-extrabold text-graphite uppercase tracking-tight">{homeData?.ctaTitle ? homeData.ctaTitle : <>HAVE A PROJECT IN MIND?<br/><span className="text-brand-blue">LET’S BUILD WITH PRECISION.</span></>}</h2><p className="text-base text-soft-grey max-w-2xl leading-relaxed mt-2">{homeData?.ctaBody || 'Consult directly with our engineering team to review architectural blueprints, BOQs, structural scopes, or regional site feasibility.'}</p></div><div className="flex flex-col gap-2 shrink-0"><a className="px-6 py-3.5 bg-brand-green hover:bg-[#05452d] text-white text-xs uppercase font-bold tracking-wider rounded-sm transition-colors shadow-sm flex items-center justify-center gap-2" href={homeData?.ctaButtonLink || "#"}><span className="material-symbols-outlined text-[18px]">chat</span><span>{homeData?.ctaButtonLabel ? `${homeData.ctaButtonLabel.toUpperCase()} →` : 'CHAT ON WHATSAPP →'}</span></a><span className="text-[11px] text-soft-grey text-center">[WHATSAPP NUMBER TO BE PROVIDED]</span></div></div><div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"><div className="lg:col-span-5 space-y-6"><div className="bg-white border border-border-neutral p-6 lg:p-8 space-y-6 rounded-sm shadow-sm"><span className="text-xs text-brand-blue uppercase font-bold tracking-wider block border-b border-border-neutral pb-2">Regional Command Headquarters</span><div className="space-y-4 text-xs"><div className="space-y-1 pb-3 border-b border-border-neutral"><div className="text-xs font-bold text-graphite uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-blue"></span><span>ODISHA (HEADQUARTERS)</span></div><p className="text-soft-grey leading-relaxed">3rd Floor, Block A, Radianz Complex, Plot No. 2471, Near Field Toyota, Nuagan, Cuttack, Odisha – 754001</p><div className="text-brand-blue font-semibold">Ph: +91 8596911655</div></div><div className="space-y-1 pb-3 border-b border-border-neutral"><div className="text-xs font-bold text-graphite uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-green"></span><span>ANDAMAN &amp; NICOBAR ISLANDS</span></div><p className="text-soft-grey leading-relaxed">75 JN Road, Haddo, Post Box No. 663, Port Blair – 744102, Andaman &amp; Nicobar Islands</p><div className="text-brand-blue font-semibold">Ph: 03192-241890 • M: +91 7695030022</div></div><div className="space-y-1"><div className="text-xs font-bold text-graphite uppercase flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand-gold"></span><span>KOLKATA UNIT</span></div><p className="text-soft-grey leading-relaxed">31, Giri Babu Lane, 1st Floor, Room No. 8B, Kolkata – 700012</p><div className="text-brand-blue font-semibold">Ph: 033-22252605 • M: +91 7980207618</div></div></div><div className="p-4 bg-surface-warm border border-border-neutral space-y-1 rounded-sm text-xs"><div className="text-[11px] text-soft-grey uppercase font-medium">Official Contact Desk</div><a className="font-display text-base font-extrabold text-graphite hover:text-brand-blue transition-colors block" href="mailto:info@neevevara.com">info@neevevara.com</a><div className="text-[11px] text-soft-grey">Website: <a className="text-brand-blue font-semibold" href="https://www.neevevara.com">www.neevevara.com</a></div></div></div><div className="bg-white border border-border-neutral p-4 rounded-sm shadow-sm"><div className="h-44 bg-surface-muted border border-border-neutral rounded-sm flex flex-col items-center justify-center p-4 text-center"><span className="material-symbols-outlined text-3xl text-brand-blue mb-1">location_on</span><span className="font-display text-xs font-bold text-graphite uppercase block">ODISHA HEADQUARTERS — GOOGLE MAP LOCATION</span><p className="text-[11px] text-soft-grey mt-1">(Radianz Complex, Plot No. 2471, Nuagan, Cuttack – 754001)</p><span className="text-[10px] text-brand-blue font-medium mt-2">Interactive Map Embed • Verified Coordinates</span></div></div></div><div className="lg:col-span-7 bg-white border border-border-neutral p-6 lg:p-8 rounded-sm shadow-sm"><div className="border-b border-border-neutral pb-3 mb-5"><span className="text-xs text-brand-blue uppercase font-bold tracking-wider">REQUEST FOR PROPOSAL / CONSULTATION</span><h3 className="font-display text-xl font-bold text-graphite uppercase pt-1">SUBMIT YOUR PROJECT SPECIFICATION</h3></div><form className="space-y-4" onSubmit={handleFormSubmit}><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs text-graphite uppercase font-bold block">Full Name *</label><input className="w-full bg-surface-warm border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue" placeholder="e.g. Er. Rajesh Patel" required="" type="text"/></div><div className="space-y-1"><label className="text-xs text-graphite uppercase font-bold block">Email Address *</label><input className="w-full bg-surface-warm border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue" placeholder="e.g. rajesh@example.com" required="" type="email"/></div></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div className="space-y-1"><label className="text-xs text-graphite uppercase font-bold block">Phone Number *</label><input className="w-full bg-surface-warm border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue" placeholder="+91 XXXXX XXXXX" required="" type="tel"/></div><div className="space-y-1"><label className="text-xs text-graphite uppercase font-bold block">Project PIN Code</label><input className="w-full bg-surface-warm border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue" placeholder="e.g. 754001" type="text"/></div></div><div className="space-y-1"><label className="text-xs text-graphite uppercase font-bold block">Service Category *</label><select className="w-full bg-surface-warm border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue"><option>01 Building &amp; Civil Construction</option><option>02 Residential &amp; Commercial Projects</option><option>03 Industrial &amp; Heavy Facilities</option><option>04 Infrastructure, Roads &amp; Bridges</option><option>05 Project Management &amp; EPC Consultancy</option><option>06 Repair, Restoration &amp; Retrofitting</option></select></div><div className="space-y-1"><label className="text-xs text-graphite uppercase font-bold block">Project Scope &amp; Details *</label><textarea className="w-full bg-surface-warm border border-border-neutral px-3.5 py-2 text-graphite text-xs rounded-sm focus:outline-none focus:border-brand-blue" placeholder="Describe your site location, approximate area, structural specifications, timeline requirements, or BOQ notes..." required="" rows="4"></textarea></div><div className="flex items-center gap-2 pt-1"><input className="w-4 h-4 rounded-sm border-border-neutral text-brand-blue focus:ring-0" id="nda-box" type="checkbox"/><label className="text-xs text-soft-grey cursor-pointer" htmlFor="nda-box">Request mutual Non-Disclosure Agreement (NDA) prior to transmitting sensitive project drawings.</label></div><div><button className="w-full py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs uppercase tracking-wider font-bold rounded-sm transition-colors shadow-sm flex items-center justify-center gap-2" type="submit"><span>Submit Project Inquiry</span><span className="material-symbols-outlined text-[16px]">send</span></button></div><div className="hidden p-3.5 bg-green-50 border border-green-200 text-brand-green text-xs font-medium text-center rounded-sm" id="rfq-feedback">✓ Project inquiry transmitted successfully. An engineering representative will respond within 24 business hours.</div></form></div></div></div></section>

    </main>
  );
};

export default Home;
