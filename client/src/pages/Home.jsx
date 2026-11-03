import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import {
  services as mockServices,
  projects as mockProjects
} from '../data/mockData';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getItemKey = (item) => item?._id || item?.id || item?.slug;

const Home = () => {
  const { t } = useTranslation('common');
  const [homeData, setHomeData] = useState(null);
  const [liveServices, setLiveServices] = useState([]);
  const [liveProjects, setLiveProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Home Enquiry Form State (Fully wired to backend /api/enquiries)
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    email: '',
    pinCode: '',
    serviceCategory: '01 Building & Civil Construction',
    projectScope: '',
    ndaRequested: false,
  });
  const [formStatus, setFormStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [formError, setFormError] = useState('');

  const handleEnquirySubmit = async (e) => {
    e.preventDefault();
    if (!enquiryForm.name.trim() || !enquiryForm.phone.trim() || !enquiryForm.email.trim() || !enquiryForm.projectScope.trim()) {
      setFormError('Please fill in all required fields (Name, Phone, Email, and Project Scope).');
      return;
    }
    setFormStatus('loading');
    setFormError('');

    try {
      const payload = {
        name: enquiryForm.name.trim(),
        phone: enquiryForm.phone.trim(),
        email: enquiryForm.email.trim().toLowerCase(),
        pinCode: enquiryForm.pinCode.trim(),
        serviceCategory: enquiryForm.serviceCategory,
        projectScope: enquiryForm.projectScope.trim(),
        ndaRequested: Boolean(enquiryForm.ndaRequested),
        type: 'contact',
        source: 'homepage_contact_section',
      };

      await axios.post(`${API}/enquiries`, payload);
      setFormStatus('success');
      setEnquiryForm({
        name: '',
        phone: '',
        email: '',
        pinCode: '',
        serviceCategory: '01 Building & Civil Construction',
        projectScope: '',
        ndaRequested: false,
      });
    } catch (err) {
      console.error('Failed to submit enquiry:', err);
      setFormStatus('error');
      setFormError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to submit enquiry. Please check your network or call our engineering desk directly at +91 8596911655.'
      );
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [homeRes, svcRes, prjRes] = await Promise.all([
          axios.get(`${API}/home`).catch(() => ({ data: {} })),
          axios.get(`${API}/services?limit=4`).catch(() => ({ data: {} })),
          axios.get(`${API}/projects?limit=3`).catch(() => ({ data: {} })),
        ]);

        if (homeRes.data?.success && homeRes.data?.data) {
          setHomeData(homeRes.data.data);
        }

        if (svcRes.data?.success) {
          const items = svcRes.data.items || svcRes.data.data || [];
          setLiveServices(items.map((s, idx) => ({
            id: s._id,
            slug: s.slug,
            title: s.title,
            category: s.category || 'Civil Engineering',
            shortDescription: s.shortDescription || (s.description ? s.description.substring(0, 110) + '...' : ''),
            image: s.image || s.coverImage || mockServices[idx % mockServices.length]?.image || '/images/client_commercial.webp',
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
            status: p.status === 'commissioned' ? 'Completed' : (p.status || 'Active Execution'),
            shortDescription: p.shortDescription || (p.description ? p.description.substring(0, 120) + '...' : ''),
            coverImage: p.coverImage || p.image || mockProjects[idx % mockProjects.length]?.coverImage || '/images/client_hero.webp',
          })));
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  // Merge live data with mock fallbacks
  const servicesList = (liveServices.length > 0 ? liveServices : mockServices).slice(0, 4);
  const featuredProjects = (liveProjects.length > 0 ? liveProjects : mockProjects).slice(0, 3);

  return (
    <main className="w-full flex-1">
      {/* ── 1. HEADER + HERO ── */}
      <section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-12 lg:py-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-border-neutral text-brand-green text-[11px] font-semibold tracking-wider uppercase rounded-sm">
                <span className="w-2 h-2 rounded-full bg-brand-green"></span>
                <span>Civil Infrastructure • PMC • Turnkey EPC</span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-[52px] text-graphite tracking-tight font-extrabold uppercase leading-[1.08]">
                  {homeData?.heroTitle ? homeData.heroTitle : (
                    <>BUILDING WHAT MATTERS.<br /><span className="text-brand-blue">ENGINEERING WITH PRECISION.</span></>
                  )}
                </h1>
                <p className="text-base text-soft-grey leading-relaxed">
                  {homeData?.heroSubtitle || 'Engineering and construction solutions across residential, commercial, industrial, and infrastructure developments. Executed with technical performance and structural rigor.'}
                </p>
              </div>

              {/* Verified Technical Standards */}
              <div className="grid grid-cols-3 gap-3 py-3 border-y border-border-neutral text-[11px] text-soft-grey">
                <div>
                  <span className="text-graphite font-bold block text-[13px]">Certified Codes</span>
                  <span>IS 456 • IS 800 • IRC</span>
                </div>
                <div>
                  <span className="text-graphite font-bold block text-[13px]">Precision Build</span>
                  <span>Structural Tolerance</span>
                </div>
                <div>
                  <span className="text-graphite font-bold block text-[13px]">Safe Protocols</span>
                  <span>Rigorous Site HSE</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 pt-1">
                <Link
                  to="/projects"
                  className="px-6 py-3.5 bg-brand-blue hover:bg-brand-blue-hover text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-colors shadow-sm"
                >
                  <span>{homeData?.heroCtaLabel || t('home.exploreServices')}</span>
                  <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                </Link>
                <Link
                  to="/estimate"
                  className="px-5 py-3.5 bg-white text-[#07558F] border border-[#07558F]/30 hover:bg-[#07558F]/5 text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-colors"
                >
                  <span>{t('nav.estimateProjectCost')}</span>
                  <span className="material-symbols-outlined text-[15px]">calculate</span>
                </Link>
                <Link
                  to="/contact"
                  className="px-5 py-3.5 bg-white text-graphite border border-border-neutral hover:bg-surface-muted text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 rounded-sm transition-colors"
                >
                  <span>{t('nav.contact')}</span>
                  <span className="material-symbols-outlined text-[15px]">north_east</span>
                </Link>
              </div>

              {/* Technical Governance Badge */}
              <div className="flex items-center gap-3.5 p-3.5 bg-white border border-border-neutral rounded-sm">
                <span className="material-symbols-outlined text-brand-green text-2xl shrink-0">verified</span>
                <div className="text-[12px] text-soft-grey">
                  <span className="font-bold text-graphite block">Director-Led Technical Governance</span>
                  <span>BE (Civil), MIE, Chart Eng. • MIRC, PBMC Registered</span>
                </div>
              </div>
            </div>

            {/* Right Hero Visual */}
            <div className="lg:col-span-7 relative">
              <div className="relative bg-white border border-border-neutral overflow-hidden rounded-sm shadow-sm">
                <img
                  alt="Neevevera Active Infrastructure Civil Engineering Site"
                  className="w-full h-[400px] lg:h-[520px] object-cover filter contrast-[1.02]"
                  src={homeData?.heroImage || "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80"}
                  loading="eager"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/client_hero.webp'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-graphite/80 via-transparent to-transparent pointer-events-none"></div>
                <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm border border-border-neutral px-3 py-1.5 flex items-center gap-2 rounded-sm">
                  <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse"></span>
                  <span className="text-[11px] uppercase tracking-wider text-graphite font-semibold">Active Project Execution</span>
                </div>
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

      {/* ── 2. ABOUT NEEVEVERA PREVIEW ── */}
      <section className="w-full bg-surface-warm border-b border-border-neutral px-6 lg:px-10 py-14 lg:py-20" id="about-preview">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-7 space-y-5">
              <span className="text-xs text-brand-blue uppercase font-bold tracking-wider">ABOUT NEEVEVERA</span>
              <h2 className="font-display text-3xl lg:text-4xl text-graphite tracking-tight font-extrabold uppercase leading-tight">
                {homeData?.introHeadline ? homeData.introHeadline : (
                  <>ENGINEERING WITH PURPOSE.<br /><span className="text-brand-blue">CONSTRUCTION WITH RESPONSIBILITY.</span></>
                )}
              </h2>
              <p className="text-base text-soft-grey leading-relaxed">
                {homeData?.introBody || 'Neevevera Private Limited is a forward-thinking engineering and construction firm dedicated to creating resilient infrastructure and high-performance buildings across Eastern India and Island Territories.'}
              </p>
              <p className="text-sm text-soft-grey leading-relaxed">
                Backed by extensive chartered engineering discipline, we ensure every foundation, frame, and finish adheres strictly to national statutory codes (IS 456, IS 800) and verified structural integrity.
              </p>

              {/* 2 Core Proof Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-white border border-border-neutral rounded-sm">
                  <span className="text-xs font-bold text-brand-blue uppercase block mb-1">Code Compliance</span>
                  <p className="text-xs text-soft-grey">Strict compliance with IS 456 for concrete, IS 800 for structural steel, and IRC specifications.</p>
                </div>
                <div className="p-4 bg-white border border-border-neutral rounded-sm">
                  <span className="text-xs font-bold text-brand-green uppercase block mb-1">Structural Governance</span>
                  <p className="text-xs text-soft-grey">Continuous QA/QC testing, cube crush metrics, and independent chartered engineer reviews.</p>
                </div>
              </div>

              {/* Clean Link to Dedicated About Page */}
              <div className="pt-2">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-blue hover:text-brand-blue-hover hover:underline transition-all"
                >
                  <span>Learn More About Our Company &amp; Board →</span>
                </Link>
              </div>
            </div>

            {/* Leadership Profile Preview Card */}
            <div className="lg:col-span-5 bg-white border border-border-neutral p-6 lg:p-8 space-y-4 rounded-sm shadow-sm">
              <div className="flex items-center justify-between border-b border-border-neutral pb-3">
                <span className="text-xs text-brand-blue font-bold uppercase tracking-wider">Leadership Profile</span>
                <span className="w-2 h-2 rounded-full bg-brand-green"></span>
              </div>
              <div>
                <h3 className="font-display text-2xl font-extrabold text-graphite uppercase">Pankaj Kumar Rungta</h3>
                <p className="text-xs text-brand-blue font-semibold uppercase pt-0.5">Director • Neevevera Private Limited</p>
              </div>
              <div className="bg-surface-muted p-4 space-y-1.5 border-l-2 border-brand-blue rounded-r-sm">
                <span className="text-[11px] text-soft-grey uppercase font-semibold">Technical Charter &amp; Credentials</span>
                <p className="font-display text-sm text-graphite font-bold">BE (Civil), MIE, Chart Eng.</p>
                <p className="text-xs text-soft-grey leading-relaxed">MIBC • MIOV • MIRC • PBMC Regd. Chartered Structural &amp; Civil Engineer</p>
              </div>
              <p className="text-xs text-soft-grey leading-relaxed">
                Direct oversight on project engineering, subgrade stability, foundation designs, and statutory compliance across Odisha, Andaman &amp; Nicobar, and West Bengal.
              </p>
              <div className="pt-2 border-t border-border-neutral">
                <Link
                  to="/team"
                  className="inline-flex items-center gap-2 text-xs uppercase font-bold text-brand-blue hover:text-brand-blue-hover transition-colors"
                >
                  <span>View Leadership &amp; Engineering Team →</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SERVICES PREVIEW ── */}
      <section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-14 lg:py-20" id="services-preview">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border-neutral pb-5">
            <div className="space-y-2">
              <span className="text-xs text-brand-blue uppercase font-bold tracking-wider">SERVICES</span>
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-graphite uppercase">Core Engineering Capabilities</h2>
              <p className="text-sm text-soft-grey max-w-2xl">A concise selection of services. Visit our services portal for detailed specifications and scopes.</p>
            </div>
            <Link
              to="/services"
              className="shrink-0 inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-brand-blue hover:text-brand-blue-hover transition-colors"
            >
              Explore All Services <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          {servicesList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {servicesList.map((svc, index) => (
                <div
                  key={getItemKey(svc) || index}
                  className="bg-surface-warm border border-border-neutral hover:border-brand-blue transition-colors rounded-sm flex flex-col justify-between overflow-hidden shadow-2xs group"
                >
                  <div className="h-44 overflow-hidden relative bg-surface-muted">
                    <img
                      src={svc.image}
                      alt={svc.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/client_commercial.webp'; }}
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] uppercase font-bold text-brand-blue rounded-xs">
                      {svc.category}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <h3 className="font-display text-base font-bold text-graphite uppercase leading-snug group-hover:text-brand-blue transition-colors">
                        {svc.title}
                      </h3>
                      <p className="text-xs text-soft-grey leading-relaxed">
                        {svc.shortDescription}
                      </p>
                    </div>

                    <Link
                      to={`/services/${svc.slug}`}
                      className="text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase tracking-wider pt-3 border-t border-border-neutral flex items-center justify-between"
                    >
                      <span>View Specification</span>
                      <span className="material-symbols-outlined text-[15px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="bg-white border border-border-neutral p-5 text-sm text-soft-grey">Services will be displayed here when they are available.</p>
          )}
        </div>
      </section>

      {/* ── 4. CONSOLIDATED FEATURED PROJECTS: ONE FEATURE + TWO HIGHLIGHTS ── */}
      <section className="w-full bg-surface-white border-b border-border-neutral px-6 lg:px-10 py-14 lg:py-20" id="featured-projects">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-border-neutral pb-5">
            <div className="space-y-2">
              <span className="text-xs text-brand-blue uppercase font-bold tracking-wider">PROJECTS</span>
              <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-graphite uppercase">Selected Project Experience</h2>
              <p className="text-sm text-soft-grey max-w-2xl">A concise look at selected work. Visit the portfolio to explore available project details.</p>
            </div>
            <Link
              to="/projects"
              className="shrink-0 inline-flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-brand-blue hover:text-brand-blue-hover transition-colors"
            >
              Explore Full Portfolio <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </Link>
          </div>

          {featuredProjects.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              {featuredProjects[0] && (
                <article className="lg:col-span-7 bg-surface-warm border border-border-neutral overflow-hidden rounded-sm shadow-sm flex flex-col">
                  <div className="relative h-64 sm:h-80 overflow-hidden bg-surface-muted">
                    <img
                      alt={featuredProjects[0].title || featuredProjects[0].name || 'Featured project'}
                      className="w-full h-full object-cover"
                      src={featuredProjects[0].coverImage || featuredProjects[0].image || '/images/client_hero.webp'}
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/images/client_hero.webp';
                      }}
                    />
                    <span className="absolute top-3 left-3 bg-white/95 border border-border-neutral px-2.5 py-1 text-[11px] text-brand-blue font-bold uppercase rounded-sm">
                      {featuredProjects[0].category || 'Featured Project'}
                    </span>
                  </div>
                  <div className="p-5 lg:p-7 space-y-3 flex flex-col flex-1">
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-soft-grey">
                      {featuredProjects[0].location && <span>{featuredProjects[0].location}</span>}
                      {featuredProjects[0].status && <span>{featuredProjects[0].status}</span>}
                    </div>
                    <h3 className="font-display text-xl lg:text-2xl font-bold text-graphite uppercase">{featuredProjects[0].title || featuredProjects[0].name}</h3>
                    <p className="text-sm text-soft-grey leading-relaxed flex-1">
                      {featuredProjects[0].shortDescription || featuredProjects[0].description || 'View the project portfolio for further information.'}
                    </p>
                    <Link
                      to={featuredProjects[0].slug ? `/projects/${featuredProjects[0].slug}` : '/projects'}
                      className="pt-3 border-t border-border-neutral inline-flex items-center justify-between gap-2 text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase"
                    >
                      View Project <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              )}

              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
                {featuredProjects.slice(1, 3).map((project, index) => (
                  <article key={getItemKey(project) || index} className="bg-white border border-border-neutral rounded-sm overflow-hidden shadow-sm grid grid-cols-1 sm:grid-cols-5">
                    <div className="sm:col-span-2 h-44 sm:h-full min-h-40 bg-surface-muted overflow-hidden">
                      <img
                        alt={project.title || project.name || 'Project highlight'}
                        className="w-full h-full object-cover"
                        src={project.coverImage || project.image || '/images/client_commercial.webp'}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = '/images/client_commercial.webp';
                        }}
                      />
                    </div>
                    <div className="sm:col-span-3 p-4 sm:p-5 flex flex-col gap-2">
                      <span className="text-[10px] text-brand-blue uppercase font-bold tracking-wider">{project.category || 'Project Highlight'}</span>
                      <h3 className="font-display text-base font-bold text-graphite uppercase">{project.title || project.name}</h3>
                      <p className="text-xs text-soft-grey leading-relaxed line-clamp-3 flex-1">
                        {project.shortDescription || project.description || 'Explore this project in the full portfolio.'}
                      </p>
                      <Link
                        to={project.slug ? `/projects/${project.slug}` : '/projects'}
                        className="pt-2 border-t border-border-neutral inline-flex items-center justify-between gap-2 text-xs font-bold text-brand-blue hover:text-brand-blue-hover uppercase"
                      >
                        View Details <span aria-hidden="true">→</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <p className="bg-surface-warm border border-border-neutral p-5 text-sm text-soft-grey">Projects will be displayed here when they are available.</p>
          )}
        </div>
      </section>

      {/* ── 5. DIRECT SITE ENQUIRY & REGIONAL HEADQUARTERS (Map + Form) ── */}
      <section className="w-full bg-surface-warm px-6 lg:px-10 py-16 lg:py-20 border-b border-border-neutral" id="contact-section">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="border-b border-border-neutral pb-5">
            <span className="text-xs text-brand-blue uppercase font-bold tracking-wider">PROJECT ENQUIRY & CONSULTATION</span>
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold text-graphite uppercase tracking-tight mt-1">
              Request a Site Inspection or Consultation
            </h2>
            <p className="text-sm text-soft-grey max-w-2xl mt-1">
              Direct communication with our central estimating and site engineering desk in Cuttack &amp; Bhubaneswar.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left: Regional Contact Hub & Interactive Map (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-border-neutral p-6 sm:p-7 rounded-sm shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <span className="text-[11px] font-bold text-brand-blue uppercase tracking-widest font-display">
                  CENTRAL HEADQUARTERS
                </span>
                <h3 className="font-display text-xl font-bold text-graphite uppercase">
                  Odisha Civil Engineering Cell
                </h3>

                <div className="text-xs text-soft-grey space-y-2.5 pt-1">
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-brand-blue text-[18px] shrink-0 mt-0.5">location_on</span>
                    <span>Sector 9, CDA Industrial Corridor, Cuttack, Odisha – 753014</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-brand-blue text-[18px] shrink-0">call</span>
                    <a href="tel:+918596911655" className="font-bold text-graphite hover:text-brand-blue transition-colors">+91 8596911655</a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-brand-blue text-[18px] shrink-0">mail</span>
                    <a href="mailto:info@neevevara.com" className="font-bold text-brand-blue hover:underline">info@neevevara.com</a>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-brand-blue text-[18px] shrink-0">schedule</span>
                    <span>Mon – Sat: 9:00 AM – 6:30 PM (Direct Site Dispatch)</span>
                  </div>
                </div>
              </div>

              {/* Interactive Google Map Embed */}
              <div className="w-full h-52 sm:h-60 rounded border border-border-neutral overflow-hidden bg-surface-muted relative">
                <iframe
                  title="Neevevera Odisha Headquarters"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d119530.13735073016!2d85.8078953934375!3d20.462521199999997!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a190d6350f00001%3A0x6b6bbd2478d1f2e1!2sCuttack%2C%20Odisha!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>

              <div className="pt-2 border-t border-border-neutral flex items-center justify-between text-xs text-soft-grey">
                <span>Coverage: Khurda &amp; Cuttack Full District</span>
                <Link to="/contact" className="font-bold text-brand-blue hover:underline uppercase text-[11px]">
                  All Regional Hubs →
                </Link>
              </div>
            </div>

            {/* Right: The Full Enquiry Form (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-border-neutral p-6 sm:p-8 rounded-sm shadow-sm flex flex-col justify-between">
              <div className="space-y-4">
                <div className="pb-3 border-b border-border-neutral flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold text-graphite uppercase">
                    Submit Site Enquiry / RFQ
                  </h3>
                  <span className="text-[10px] text-soft-grey uppercase tracking-wider font-mono">
                    Direct CMS Logging
                  </span>
                </div>

                {formStatus === 'success' ? (
                  <div className="py-10 text-center bg-emerald-50 border border-emerald-200 rounded p-6 space-y-3">
                    <span className="material-symbols-outlined text-emerald-600 text-5xl">check_circle</span>
                    <h4 className="font-display text-xl font-bold text-emerald-900 uppercase">
                      Enquiry Dispatched Successfully!
                    </h4>
                    <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                      Thank you. Your project requirement has been recorded in our central administrative system. A qualified site engineer will contact you within 24 working hours.
                    </p>
                    <button
                      onClick={() => setFormStatus('idle')}
                      className="mt-4 px-5 py-2 bg-brand-blue text-white text-xs font-bold font-display uppercase tracking-wider rounded"
                    >
                      Submit Another Requirement
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleEnquirySubmit} className="space-y-4 text-xs">
                    {formStatus === 'error' && (
                      <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded flex items-start gap-2">
                        <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-graphite mb-1">Your Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Er. Rajesh Pattnaik"
                          value={enquiryForm.name}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-graphite mb-1">Phone Number *</label>
                        <input
                          type="tel"
                          required
                          placeholder="10-digit mobile number"
                          value={enquiryForm.phone}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-semibold text-graphite mb-1">Email Address *</label>
                        <input
                          type="email"
                          required
                          placeholder="name@company.com"
                          value={enquiryForm.email}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-graphite mb-1">Site PIN Code / Location</label>
                        <input
                          type="text"
                          placeholder="e.g. 753014 (Cuttack) or 751024 (Bhubaneswar)"
                          value={enquiryForm.pinCode}
                          onChange={(e) => setEnquiryForm({ ...enquiryForm, pinCode: e.target.value })}
                          className="w-full px-3 py-2 border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-graphite mb-1">Service Required</label>
                      <select
                        value={enquiryForm.serviceCategory}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, serviceCategory: e.target.value })}
                        className="w-full px-3 py-2 border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue"
                      >
                        <option value="Civil Construction">Civil Construction &amp; Turnkey Contracting</option>
                        <option value="Building Repair and Maintenance">Building Repair &amp; Structural Maintenance</option>
                        <option value="Design and Planning">Architectural Design &amp; Structural Planning</option>
                        <option value="Interior and Exterior Solutions">Interior &amp; Exterior Finishing Works</option>
                        <option value="Project Management Consultancy (PMC)">Project Management Consultancy (PMC)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-graphite mb-1">Project Scope / Requirements *</label>
                      <textarea
                        rows="3"
                        required
                        placeholder="Brief description of your project (e.g., plot size, built-up area, current site stage, or estimated start timeline)..."
                        value={enquiryForm.projectScope}
                        onChange={(e) => setEnquiryForm({ ...enquiryForm, projectScope: e.target.value })}
                        className="w-full px-3 py-2 border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-soft-grey">
                        Guaranteed response within 24 working hours.
                      </span>
                      <button
                        type="submit"
                        disabled={formStatus === 'loading'}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold font-display uppercase tracking-wider text-xs rounded transition-colors shadow-xs disabled:opacity-50"
                      >
                        {formStatus === 'loading' ? 'Submitting...' : 'Send Enquiry'}
                        <span className="material-symbols-outlined text-[16px]">send</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;
