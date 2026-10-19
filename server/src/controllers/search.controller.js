import Project from '../models/Project.js';
import Service from '../models/Service.js';
import Blog from '../models/Blog.js';
import Career from '../models/Career.js';
import Podcast from '../models/Podcast.js';
import TeamMember from '../models/TeamMember.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ── Company Core Services Catalog (ensures full coverage regardless of DB seed state) ──
const CATALOG_SERVICES = [
  {
    slug: 'building-civil-construction',
    title: 'Building & Civil Construction',
    category: 'construction',
    badge: 'Civil Construction',
    shortDescription: 'End-to-end civil execution from deep piling to structural shell completion under strict IS code compliance.',
    description: 'Full-scope civil construction encompassing deep bored cast-in-situ piling, raft foundations, monolithic concrete framing, structural columns, and complete building envelope construction — strictly adhering to IS 456 and IS 800 standards.',
    image: '/images/client_hero.webp',
    features: [
      'Deep bored cast-in-situ piling & raft foundations',
      'Monolithic concrete framing & structural columns',
      'Strict IS 456 & IS 800 standards adherence',
      'High-performance concrete mix design',
      'Seismic-resilient ductile detailing'
    ],
    benefits: ['Code Compliant', 'Director-Led QA/QC', 'Structural Warranty'],
    keywords: ['civil', 'construction', 'building', 'piling', 'pile', 'foundation', 'raft', 'concrete', 'superstructure', 'is 456', 'is 800', 'framing', 'columns', 'ductile', 'rcc', 'cement', 'excavation', 'deep foundation', 'structure']
  },
  {
    slug: 'residential-commercial-projects',
    title: 'Residential & Commercial Projects',
    category: 'construction',
    badge: 'Turnkey Real Estate',
    shortDescription: 'High-rise multi-family housing, modern commercial workspaces, and bespoke institutional developments.',
    description: 'Specialized turnkey engineering for residential complexes, corporate office towers, retail malls, and institutional buildings featuring post-tensioned slabs, seismic-resistant frames, and premium MEP integration.',
    image: '/images/client_residential.webp',
    features: [
      'Seismic-resistant structural frame design',
      'Architectural finishing & high-spec MEP integration',
      'On-schedule milestone handover protocols',
      'Post-tensioned slab systems',
      'NBC 2016 full compliance'
    ],
    benefits: ['Turnkey Delivery', 'Premium Finish', 'Milestone Tracking'],
    keywords: ['residential', 'commercial', 'housing', 'apartment', 'apartments', 'flats', 'flat', 'tower', 'towers', 'office', 'offices', 'workspace', 'workspaces', 'mall', 'malls', 'retail', 'complex', 'institutional', 'post-tensioned', 'turnkey', 'mep', 'interior', 'highrise']
  },
  {
    slug: 'industrial-heavy-facilities',
    title: 'Industrial & Heavy Facilities',
    category: 'construction',
    badge: 'Industrial Infrastructure',
    shortDescription: 'Heavy equipment foundations, Pre-Engineered Buildings (PEB), and industrial laser-screed floors.',
    description: 'Full structural shell construction for manufacturing plants, heavy equipment warehouses, and logistics centers with clear-span steel frameworks, crane runway beams, and vibration-damped machine foundations built to IS 800:2007.',
    image: '/images/client_industrial.webp',
    features: [
      'Vibration-damped equipment foundation pads',
      'Clear-span structural steel warehouse framing',
      'High-load abrasion-resistant concrete flooring',
      'Pre-Engineered Building (PEB) systems up to 48m span',
      'Laser-screed superflat FM2 floor finishes'
    ],
    benefits: ['Heavy Load Rated', 'IS 800 Compliant', 'Industrial Grade'],
    keywords: ['industrial', 'heavy', 'peb', 'pre-engineered', 'warehouse', 'warehouses', 'factory', 'factories', 'plant', 'plants', 'laser screed', 'superflat', 'fm2', 'crane', 'vibration', 'machine foundation', 'shed', 'steel structure', 'clear-span']
  },
  {
    slug: 'infrastructure-roads-bridges',
    title: 'Infrastructure, Roads & Bridges',
    category: 'construction',
    badge: 'Civic Infrastructure',
    shortDescription: 'Regional transit viaducts, reinforced box culverts, composite girder spans, and civil drainage channels.',
    description: 'Execution of highway viaducts, box culverts, bridge spans, and arterial roadways built with high-performance prestressed concrete, deep bored piles, and anti-corrosive reinforcement — compliant with IRC:112 and MORTH specifications.',
    image: '/images/client_infrastructure.webp',
    features: [
      'Prestressed concrete girder launching',
      'IRC-compliant subgrade & pavement execution',
      'Coastal and marine corrosive resilience measures',
      'Large-diameter bored pile foundations',
      '100-year design life cycle standards'
    ],
    benefits: ['IRC:112 Compliant', 'Marine Grade', 'PWD Registered'],
    keywords: ['infrastructure', 'road', 'roads', 'bridge', 'bridges', 'viaduct', 'highway', 'highways', 'culvert', 'culverts', 'girder', 'girders', 'transit', 'pavement', 'drainage', 'irc', 'morth', 'caisson', 'flyover', 'box culvert']
  },
  {
    slug: 'project-management-consultancy',
    title: 'Project Management & EPC Consultancy',
    category: 'professional',
    badge: 'Chartered PMC',
    shortDescription: 'Chartered engineer oversight, critical-path scheduling, vendor audits, and comprehensive site governance.',
    description: 'Comprehensive PMC services including CPM scheduling, contractor accountability, bill auditing, vendor procurement governance, and on-site QA/QC laboratory supervision — delivered by a registered Chartered Engineer.',
    image: '/images/client_rebar.webp',
    features: [
      'Independent BOQ reconciliation & bill certification',
      'On-site QA/QC laboratory testing supervision',
      'Statutory clearance & compliance assistance',
      'Critical path method scheduling',
      'Chartered Engineer sign-off on all milestones'
    ],
    benefits: ['Chartered Engineer Led', 'ISO QA/QC', 'Statutory Clearance'],
    keywords: ['pmc', 'consultancy', 'consultant', 'epc', 'project management', 'chartered engineer', 'boq', 'billing', 'audit', 'auditing', 'supervision', 'qa/qc', 'qa', 'qc', 'iso', 'cpm', 'scheduling', 'governance', 'tendering', 'tender', 'inspection']
  },
  {
    slug: 'repair-restoration-retrofitting',
    title: 'Repair, Restoration & Retrofitting',
    category: 'specialized',
    badge: 'Structural Rehabilitation',
    shortDescription: 'Diagnostic audits, seismic retrofitting, micro-concreting, and structural life extension of heritage assets.',
    description: 'Advanced engineering interventions for distressed RCC superstructures including non-destructive testing, carbon fiber wrapping (CFRP), epoxy injection, and micro-concrete jacketing to restore load capacity and seismic ductility.',
    image: '/images/client_industrial.webp',
    features: [
      'Non-destructive structural integrity evaluation (UPV)',
      'Carbon fiber wrapping & epoxy pressure grouting',
      'Rebar passivation and anti-corrosive treatments',
      'Seismic retrofitting per IS 13920',
      'Micro-concrete jacketing for load recovery'
    ],
    benefits: ['+40% Load Recovery', 'IS 13920 Compliant', 'Lifecycle Extension'],
    keywords: ['repair', 'repairs', 'restoration', 'retrofitting', 'retrofit', 'waterproofing', 'waterproof', 'leakage', 'leak', 'crack', 'cracks', 'damage', 'cfrp', 'carbon fiber', 'grouting', 'epoxy', 'micro-concrete', 'rebar', 'passivation', 'ndt', 'heritage', 'renovation', 'rehabilitation', 'seismic retrofitting']
  }
];

// ── Company Core Projects Catalog (fallback / enrichment) ──
const CATALOG_PROJECTS = [
  {
    slug: 'apex-horizon-commercial-tower',
    title: 'Apex Horizon Commercial Tower & Core',
    name: 'Apex Horizon Commercial Tower & Core',
    category: 'commercial',
    location: 'Cuttack / Bhubaneswar, Odisha',
    client: 'Institutional Developer',
    description: 'G+22 composite superstructure with seismic-resilient core frame and post-tensioned floor plates.',
    shortDescription: 'G+22 composite superstructure with seismic-resilient core frame.',
    image: '/images/client_commercial.webp',
    keywords: ['apex', 'commercial', 'tower', 'bhubaneswar', 'cuttack', 'highrise', 'post-tensioned', 'office']
  },
  {
    slug: 'kalyani-elevated-expressway-viaduct',
    title: 'Kalyani Multi-Span Elevated Expressway Viaduct',
    name: 'Kalyani Multi-Span Elevated Expressway Viaduct',
    category: 'infrastructure',
    location: 'Kalyani, West Bengal',
    client: 'State Highway Authority',
    description: 'Deep rotary bored piling, segmental precast box girder launching, 4.2 km elevated deck over alluvial terrain.',
    shortDescription: 'Deep rotary bored piling, segmental precast box girder launching.',
    image: '/images/client_infrastructure.webp',
    keywords: ['kalyani', 'viaduct', 'bridge', 'expressway', 'bengal', 'highway', 'girder', 'piling']
  },
  {
    slug: 'bayview-maritime-coastal-retaining',
    title: 'Bayview Maritime Coastal Retaining & Infrastructure Works',
    name: 'Bayview Maritime Coastal Retaining & Infrastructure Works',
    category: 'infrastructure',
    location: 'Port Blair, Andaman & Nicobar',
    client: 'Island Infrastructure Directorate',
    description: 'Marine-grade sulfate-resistant concrete, gravity retaining walls, and shoreline stabilization against tidal surges.',
    shortDescription: 'Marine-grade sulfate-resistant concrete, gravity retaining walls.',
    image: '/images/client_coastal.webp',
    keywords: ['bayview', 'andaman', 'port blair', 'coastal', 'marine', 'retaining wall', 'tidal']
  },
  {
    slug: 'high-bay-industrial-logistics-hub',
    title: 'High-Bay Industrial Logistics Hub & Superflat PEB',
    name: 'High-Bay Industrial Logistics Hub & Superflat PEB',
    category: 'industrial',
    location: 'Odisha Industrial Corridor',
    client: 'National Supply Chain Corp',
    description: 'Pre-engineered steel buildings, heavy-load laser screed paving, and reinforced foundation grade beams with 48m clear span.',
    shortDescription: 'Pre-engineered steel buildings, heavy-load laser screed paving.',
    image: '/images/client_industrial.webp',
    keywords: ['logistics', 'industrial', 'warehouse', 'peb', 'laser screed', 'odisha', 'superflat']
  },
  {
    slug: 'island-crest-premium-residential-township',
    title: 'Island Crest Premium Residential Township (G+14)',
    name: 'Island Crest Premium Residential Township (G+14)',
    category: 'residential',
    location: 'Port Blair, Andaman & Nicobar',
    client: 'Island Realty Consortium',
    description: 'Seismic Zone V compliant G+14 high-ductility structural framing with salt-spray resistant concrete.',
    shortDescription: 'Seismic Zone V compliant G+14 high-ductility structural framing.',
    image: '/images/client_commercial.webp',
    keywords: ['island crest', 'residential', 'township', 'andaman', 'port blair', 'housing', 'apartments']
  },
  {
    slug: 'bhubaneswar-administrative-complex',
    title: 'Bhubaneswar Central Administrative & Secretariat Annex',
    name: 'Bhubaneswar Central Administrative & Secretariat Annex',
    category: 'government',
    location: 'Bhubaneswar, Odisha',
    client: 'State Public Works Division',
    description: 'High-capacity G+8 government administrative complex adhering to CPWD specifications and NBC standards.',
    shortDescription: 'High-capacity G+8 government administrative complex adhering to CPWD.',
    image: '/images/client_commercial.webp',
    keywords: ['bhubaneswar', 'government', 'administrative', 'secretariat', 'pwd', 'cpwd', 'odisha']
  }
];

export const globalSearch = asyncHandler(async (req, res) => {
  const rawQuery = (req.query.q || '').trim();

  if (!rawQuery) {
    return res.json({
      success: true,
      count: 0,
      data: [],
      services: [],
      projects: [],
      insights: [],
      careers: [],
      podcasts: [],
      team: [],
    });
  }

  const queryText = rawQuery.toLowerCase();
  const isGenericServicesQuery = /^(services?|our\s+services?|all\s+services?|service\s+list)$/i.test(rawQuery);
  const isGenericProjectsQuery = /^(projects?|our\s+projects?|all\s+projects?|portfolio)$/i.test(rawQuery);

  const regex = { $regex: rawQuery, $options: 'i' };

  // ── Parallel DB queries ────────────────────────────────────────────────────
  const [dbProjects, dbServices, blogs, careers, podcasts, team] = await Promise.all([
    // Projects from DB
    Project.find({
      isDeleted: false,
      $or: [
        { name: regex },
        { title: regex },
        { description: regex },
        { shortDescription: regex },
        { category: regex },
        { location: regex },
        { clientName: regex },
        { region: regex },
        { projectCode: regex },
      ],
    }).select('name title slug description shortDescription category location coverImage region clientName projectCode').limit(12).lean(),

    // Services from DB
    Service.find({
      isActive: true,
      $or: isGenericServicesQuery ? [{}] : [
        { title: regex },
        { description: regex },
        { shortDescription: regex },
        { category: regex },
        { features: regex },
        { benefits: regex },
        { priceNote: regex },
      ],
    }).select('title slug description shortDescription category image features benefits').limit(12).lean(),

    // Blogs
    Blog.find({
      isDeleted: false,
      isPublished: true,
      $or: [
        { title: regex },
        { excerpt: regex },
        { content: regex },
        { category: regex },
        { tags: regex },
        { author: regex },
      ],
    }).select('title slug excerpt content category coverImage publishedAt author tags').limit(10).lean(),

    // Careers
    Career.find({
      isActive: true,
      $or: [
        { title: regex },
        { description: regex },
        { department: regex },
        { location: regex },
        { responsibilities: regex },
        { requirements: regex },
        { type: regex },
      ],
    }).select('title slug description department location type experience').limit(8).lean(),

    // Podcasts
    Podcast.find({
      isPublished: true,
      $or: [
        { title: regex },
        { description: regex },
        { guest: regex },
        { host: regex },
        { tags: regex },
      ],
    }).select('title slug description guest host coverImage publishedAt episodeNumber').limit(6).lean(),

    // Team members
    TeamMember.find({
      isActive: true,
      $or: [
        { name: regex },
        { designation: regex },
        { role: regex },
        { bio: regex },
      ],
    }).select('name designation role bio photo').limit(6).lean(),
  ]);

  // ── 1. Services Matching & Prioritization ──────────────────────────────────
  // Match against catalog services using title, description, features, and rich keyword aliases
  const catalogMatchedServices = CATALOG_SERVICES.filter(cs => {
    if (isGenericServicesQuery) return true;
    const inTitle = cs.title.toLowerCase().includes(queryText);
    const inDesc = cs.description.toLowerCase().includes(queryText) || cs.shortDescription.toLowerCase().includes(queryText);
    const inCategory = cs.category.toLowerCase().includes(queryText);
    const inFeatures = cs.features.some(f => f.toLowerCase().includes(queryText));
    const inKeywords = cs.keywords.some(k => k.includes(queryText) || queryText.includes(k));
    return inTitle || inDesc || inCategory || inFeatures || inKeywords;
  });

  // Map DB services to clean structure
  const formattedDbServices = dbServices.map(s => ({
    id: s._id,
    type: 'service',
    title: s.title || '',
    description: s.description || '',
    shortDescription: s.shortDescription || s.description || '',
    slug: s.slug,
    image: s.image || '',
    category: s.category || '',
    badge: s.category || '',
  }));

  // Merge DB services and catalog services without duplicate slugs
  const formattedCatalogServices = catalogMatchedServices.map(s => ({
    id: s.slug,
    type: 'service',
    title: s.title,
    description: s.description,
    shortDescription: s.shortDescription,
    slug: s.slug,
    image: s.image,
    category: s.category,
    badge: s.badge || s.category,
  }));

  const allMatchedServices = [
    ...formattedDbServices,
    ...formattedCatalogServices.filter(cs => !formattedDbServices.some(ds => ds.slug === cs.slug))
  ];

  // ── 2. Projects Matching ───────────────────────────────────────────────────
  const formattedDbProjects = dbProjects.map(p => ({
    id: p._id,
    type: 'project',
    title: p.name || p.title || 'Untitled Project',
    name: p.name || p.title || 'Untitled Project',
    description: p.description || '',
    summary: p.shortDescription || p.description || '',
    category: p.category || '',
    location: p.location || '',
    slug: p.slug,
    image: p.coverImage || '',
    badge: p.category || '',
  }));

  const catalogMatchedProjects = CATALOG_PROJECTS.filter(cp => {
    if (isGenericProjectsQuery) return true;
    const inTitle = cp.title.toLowerCase().includes(queryText);
    const inDesc = cp.description.toLowerCase().includes(queryText);
    const inLoc = cp.location.toLowerCase().includes(queryText);
    const inCat = cp.category.toLowerCase().includes(queryText);
    const inKeywords = cp.keywords.some(k => k.includes(queryText) || queryText.includes(k));
    return inTitle || inDesc || inLoc || inCat || inKeywords;
  }).map(p => ({
    id: p.slug,
    type: 'project',
    title: p.title,
    name: p.title,
    description: p.description,
    summary: p.shortDescription,
    category: p.category,
    location: p.location,
    slug: p.slug,
    image: p.image,
    badge: p.category,
  }));

  const allMatchedProjects = [
    ...formattedDbProjects,
    ...catalogMatchedProjects.filter(cp => !formattedDbProjects.some(dp => dp.slug === cp.slug))
  ];

  // ── 3. Insights Matching ───────────────────────────────────────────────────
  const formattedBlogs = blogs.map(b => {
    const plainText = b.content ? b.content.replace(/<[^>]+>/g, '').slice(0, 200) : '';
    return {
      id: b._id,
      type: 'insight',
      title: b.title || '',
      description: b.excerpt || plainText,
      excerpt: b.excerpt || plainText,
      slug: b.slug,
      image: b.coverImage || '',
      category: b.category || '',
      badge: b.category || '',
      author: b.author || 'Neevevera Editorial',
      date: b.publishedAt
        ? new Date(b.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '',
    };
  });

  // ── 4. Careers Matching ───────────────────────────────────────────────────
  const formattedCareers = careers.map(c => ({
    id: c._id,
    type: 'career',
    title: c.title || '',
    description: c.description || '',
    department: c.department || '',
    location: c.location || '',
    slug: c.slug,
    badge: c.department || '',
    jobType: c.type || 'full-time',
    experience: c.experience || '',
  }));

  // ── 5. Podcasts Matching ──────────────────────────────────────────────────
  const formattedPodcasts = podcasts.map(p => ({
    id: p._id,
    type: 'podcast',
    title: p.title || '',
    description: p.description || '',
    guest: p.guest || '',
    host: p.host || '',
    slug: p.slug,
    image: p.coverImage || '',
    badge: `Ep. ${p.episodeNumber || '?'}`,
    date: p.publishedAt
      ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : '',
  }));

  // ── 6. Team Matching ──────────────────────────────────────────────────────
  const formattedTeam = team.map(t => ({
    id: t._id,
    type: 'team',
    title: t.name || '',
    name: t.name || '',
    description: t.bio || t.designation || '',
    designation: t.designation || '',
    role: t.role || '',
    image: t.photo || '',
    badge: t.role || '',
  }));

  // ── Final Priority Ordered List: SERVICES ALWAYS SURFACE FIRST ─────────────
  const allResults = [
    ...allMatchedServices, // PRIORITY 1: Services directly surfaced first
    ...allMatchedProjects, // PRIORITY 2: Projects
    ...formattedBlogs,     // PRIORITY 3: Technical Insights
    ...formattedCareers,   // PRIORITY 4: Job Openings
    ...formattedPodcasts,  // PRIORITY 5: Podcasts
    ...formattedTeam,      // PRIORITY 6: Team
  ];

  res.json({
    success: true,
    count: allResults.length,
    data: allResults,
    services:  allMatchedServices,
    projects:  allMatchedProjects,
    insights:  formattedBlogs,
    careers:   formattedCareers,
    podcasts:  formattedPodcasts,
    team:      formattedTeam,
  });
});

