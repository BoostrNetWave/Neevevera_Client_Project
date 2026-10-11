/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║  ⚠  PLACEHOLDER / MOCK DATA — NOT FOR PRODUCTION  ⚠                   ║
 * ╠══════════════════════════════════════════════════════════════════════════╣
 * ║  ALL project names, client names, persons, testimonials, metrics and    ║
 * ║  structural specifications below are FABRICATED for UI development.     ║
 * ║                                                                          ║
 * ║  QA HARD BLOCKER: grep this file for "[CLIENT CONTENT PENDING]"         ║
 * ║  before any staging or production deployment. Every marked field must   ║
 * ║  be replaced with real, client-supplied data before go-live.            ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

/* ── Image helpers — AI Generated & Local ── */
const IMG = {
  hero: '/images/client_hero.webp',
  building: '/images/client_commercial.webp',
  bridge: '/images/client_infrastructure.webp', // Client doesn't do bridges, but keeping key name so project data works, just mapping to general infrastructure.
  rebar: '/images/client_rebar.webp',
  commercial: '/images/client_commercial.webp',
  industrial: '/images/client_industrial.webp',
  residential: '/images/client_residential.webp',
  pmc: '/images/client_rebar.webp',
  repair: '/images/client_industrial.webp',
  coastal: '/images/client_coastal.webp',
  warehouse: '/images/client_industrial.webp',
  highrise: '/images/client_commercial.webp',
  road: '/images/client_infrastructure.webp',
  interior: '/images/client_commercial.webp',
  team1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  team2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  team3: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
  team4: 'https://images.unsplash.com/photo-1581092795360-fd1ca04f0952?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80',
}
/* ══════════════ SERVICES ══════════════ */
export const services = [
  {
    id: 1,
    slug: 'building-civil-construction',
    number: '01',
    title: 'Building & Civil Construction',
    category: 'construction',
    shortDescription: 'End-to-end civil execution from deep piling to structural shell completion under strict IS code compliance.',
    description: 'Full-scope civil construction encompassing deep bored cast-in-situ piling, raft foundations, monolithic concrete framing, structural columns, and complete building envelope construction — all strictly adhering to IS 456 and IS 800 national standards.',
    image: IMG.hero,
    features: [
      'Deep bored cast-in-situ piling & raft foundations',
      'Monolithic concrete framing & structural columns',
      'Strict IS 456 & IS 800 standards adherence',
      'High-performance concrete mix design',
      'Seismic-resilient ductile detailing',
    ],
    benefits: ['Code Compliant', 'Director-Led QA/QC', 'Structural Warranty'],
    priceNote: 'Quotation based on BOQ and structural audit.',
  },
  {
    id: 2,
    slug: 'residential-commercial-projects',
    number: '02',
    title: 'Residential & Commercial Projects',
    category: 'construction',
    shortDescription: 'High-rise multi-family housing, modern commercial workspaces, and bespoke institutional developments.',
    description: 'Specialized turnkey engineering for residential complexes, corporate office towers, retail malls, and institutional buildings featuring post-tensioned slabs, seismic-resistant frames, and premium MEP integration.',
    image: IMG.residential,
    features: [
      'Seismic-resistant structural frame design',
      'Architectural finishing & high-spec MEP integration',
      'On-schedule milestone handover protocols',
      'Post-tensioned slab systems',
      'NBC 2016 full compliance',
    ],
    benefits: ['Turnkey Delivery', 'Premium Finish', 'Milestone Tracking'],
    priceNote: 'Project-specific quotation with detailed BOQ.',
  },
  {
    id: 3,
    slug: 'industrial-heavy-facilities',
    number: '03',
    title: 'Industrial & Heavy Facilities',
    category: 'construction',
    shortDescription: 'Heavy equipment foundations, Pre-Engineered Buildings (PEB), and industrial laser-screed floors.',
    description: 'Full structural shell construction for manufacturing plants, heavy equipment warehouses, and logistics centers with clear-span steel frameworks, crane runway beams, and vibration-damped machine foundations built to IS 800:2007.',
    image: IMG.industrial,
    features: [
      'Vibration-damped equipment foundation pads',
      'Clear-span structural steel warehouse framing',
      'High-load abrasion-resistant concrete flooring',
      'Pre-Engineered Building (PEB) systems up to 48m span',
      'Laser-screed superflat FM2 floor finishes',
    ],
    benefits: ['Heavy Load Rated', 'IS 800 Compliant', 'Industrial Grade'],
    priceNote: 'Quotation post site survey and load schedule review.',
  },
  {
    id: 4,
    slug: 'infrastructure-roads-bridges',
    number: '04',
    title: 'Infrastructure, Roads & Bridges',
    category: 'construction',
    shortDescription: 'Regional transit viaducts, reinforced box culverts, composite girder spans, and civil drainage channels.',
    description: 'Execution of highway viaducts, box culverts, bridge spans, and arterial roadways built with high-performance prestressed concrete, deep bored piles, and anti-corrosive reinforcement — compliant with IRC:112 and MORTH specifications.',
    image: IMG.bridge,
    features: [
      'Prestressed concrete girder launching',
      'IRC-compliant subgrade & pavement execution',
      'Coastal and marine corrosive resilience measures',
      'Large-diameter bored pile foundations',
      '100-year design life cycle standards',
    ],
    benefits: ['IRC:112 Compliant', 'Marine Grade', 'PWD Registered'],
    priceNote: 'Tendering and BOQ-based contract engagement.',
  },
  {
    id: 5,
    slug: 'project-management-consultancy',
    number: '05',
    title: 'Project Management & EPC Consultancy',
    category: 'professional',
    shortDescription: 'Chartered engineer oversight, critical-path scheduling, vendor audits, and comprehensive site governance.',
    description: 'Comprehensive PMC services including CPM scheduling, contractor accountability, bill auditing, vendor procurement governance, and on-site QA/QC laboratory supervision — delivered by a registered Chartered Engineer.',
    image: IMG.pmc,
    features: [
      'Independent BOQ reconciliation & bill certification',
      'On-site QA/QC laboratory testing supervision',
      'Statutory clearance & compliance assistance',
      'Critical path method scheduling',
      'Chartered Engineer sign-off on all milestones',
    ],
    benefits: ['Chartered Engineer Led', 'ISO QA/QC', 'Statutory Clearance'],
    priceNote: 'Monthly retainer or project-based engagement.',
  },
  {
    id: 6,
    slug: 'repair-restoration-retrofitting',
    number: '06',
    title: 'Repair, Restoration & Retrofitting',
    category: 'specialized',
    shortDescription: 'Diagnostic audits, seismic retrofitting, micro-concreting, and structural life extension of heritage assets.',
    description: 'Advanced engineering interventions for distressed RCC superstructures including non-destructive testing, carbon fiber wrapping (CFRP), epoxy injection, and micro-concrete jacketing to restore load capacity and seismic ductility.',
    image: IMG.repair,
    features: [
      'Non-destructive structural integrity evaluation (UPV)',
      'Carbon fiber wrapping & epoxy pressure grouting',
      'Rebar passivation and anti-corrosive treatments',
      'Seismic retrofitting per IS 13920',
      'Micro-concrete jacketing for load recovery',
    ],
    benefits: ['+40% Load Recovery', 'IS 13920 Compliant', 'Lifecycle Extension'],
    priceNote: 'Post NDT audit and quantity survey.',
  },
]

/* ══════════════ PROJECTS ══════════════ */
// ⚠ [CLIENT CONTENT PENDING] — All 9 projects below are fabricated placeholders.
// Replace with real completed/active projects supplied by the client before launch.
export const projects = [
  {
    id: 1,
    slug: 'apex-horizon-commercial-tower',                  // ⚠ [CLIENT CONTENT PENDING]
    name: 'Apex Horizon Commercial Tower & Core',          // ⚠ [CLIENT CONTENT PENDING]
    category: 'commercial',
    region: 'odisha',
    location: 'Cuttack / Bhubaneswar, Odisha',             // ⚠ [CLIENT CONTENT PENDING]
    client: 'Institutional Developer',                     // ⚠ [CLIENT CONTENT PENDING]
    status: 'commissioned',
    completionDate: '2024',
    completionPercent: 100,
    coverImage: IMG.commercial,
    shortDescription: 'G+22 composite superstructure with seismic-resilient core frame and post-tensioned floor plates.',
    description: 'Engineered with advanced post-tensioned floor systems and reinforced dual-core shear walls. Serves as premier corporate headquarters within the Cuttack-Bhubaneswar institutional corridor.',
    specs: [
      { label: 'Scope of Works', value: 'Civil, Structural & Diagrid Framing' },
      { label: 'Floor Area', value: '380,000 Sq.Ft.' },
      { label: 'Structural Steel', value: 'Fe550D High-Yield Rebar' },
      { label: 'Floor Precision', value: 'Laser Screed Superflat Finish' },
      { label: 'Status', value: 'Successfully Commissioned' },
    ],
    isFeatured: true,
    projectCode: 'NV-2024-84',
    gallery: [IMG.commercial, IMG.building, IMG.rebar],
  },
  {
    id: 2,
    slug: 'kalyani-elevated-expressway-viaduct',             // ⚠ [CLIENT CONTENT PENDING]
    name: 'Kalyani Multi-Span Elevated Expressway Viaduct', // ⚠ [CLIENT CONTENT PENDING]
    category: 'infrastructure',
    region: 'bengal',
    location: 'Kalyani, West Bengal',                       // ⚠ [CLIENT CONTENT PENDING]
    client: 'State Highway Authority',                      // ⚠ [CLIENT CONTENT PENDING]
    status: 'ongoing',
    completionDate: 'Q3 2025',
    completionPercent: 82,
    coverImage: IMG.bridge,
    shortDescription: 'Deep rotary bored piling, segmental precast box girder launching, 4.2 km elevated deck over alluvial terrain.',
    description: 'Execution of deep rotary bored foundation piles, segmental precast box girder launching, and continuous grade separation over alluvial terrain to relieve inter-district logistics choke points.',
    specs: [
      { label: 'Client Entity', value: 'State Highway Authority' },
      { label: 'Structural Scope', value: '4.2 Km Elevated Deck' },
      { label: 'Target Commission', value: 'Q3 2025 Handover' },
      { label: 'Compliance', value: 'IS 456 & IRC:112' },
    ],
    isFeatured: true,
    projectCode: 'INFRA-WB-042',
    gallery: [IMG.bridge, IMG.road, IMG.rebar],
  },
  {
    id: 3,
    slug: 'bayview-maritime-coastal-retaining',              // ⚠ [CLIENT CONTENT PENDING]
    name: 'Bayview Maritime Coastal Retaining & Infrastructure Works', // ⚠ [CLIENT CONTENT PENDING]
    category: 'infrastructure',
    region: 'andaman',
    location: 'Port Blair, Andaman & Nicobar',              // ⚠ [CLIENT CONTENT PENDING]
    client: 'Island Infrastructure Directorate',            // ⚠ [CLIENT CONTENT PENDING]
    status: 'ongoing',
    completionDate: 'Q2 2025',
    completionPercent: 65,
    coverImage: IMG.coastal,
    shortDescription: 'Marine-grade sulfate-resistant concrete, gravity retaining walls, and shoreline stabilization against tidal surges.',
    description: 'Specialized marine-grade concrete formulation, gravity retaining walls, and shoreline stabilization against severe tidal surges across the Andaman coastline.',
    specs: [
      { label: 'Client Entity', value: 'Island Infrastructure Directorate' },
      { label: 'Corrosion Class', value: 'CX Ultra Marine Severe' },
      { label: 'Retaining Length', value: '1,450 Linear Meters' },
      { label: 'Compliance', value: 'CRZ & Marine Standards' },
    ],
    isFeatured: false,
    projectCode: 'INFRA-AN-028',
    gallery: [IMG.coastal, IMG.bridge, IMG.rebar],
  },
  {
    id: 4,
    slug: 'high-bay-industrial-logistics-hub',              // ⚠ [CLIENT CONTENT PENDING]
    name: 'High-Bay Industrial Logistics Hub & Superflat PEB', // ⚠ [CLIENT CONTENT PENDING]
    category: 'industrial',
    region: 'odisha',
    location: 'Odisha Industrial Corridor',                 // ⚠ [CLIENT CONTENT PENDING]
    client: 'National Supply Chain Corp',                   // ⚠ [CLIENT CONTENT PENDING]
    status: 'commissioned',
    completionDate: '2024',
    completionPercent: 100,
    coverImage: IMG.warehouse,
    shortDescription: 'Pre-engineered steel buildings, heavy-load laser screed paving, and reinforced foundation grade beams.',
    description: 'Heavy structural engineering incorporating pre-engineered steel buildings, high-volume automated drainage, and reinforced foundation grade beams with 48m clear span.',
    specs: [
      { label: 'Surface Area', value: '220,000 Sq.Ft.' },
      { label: 'Clear Span', value: '48m Column-Free' },
      { label: 'Floor System', value: 'FM2 Laser Screed' },
      { label: 'Status', value: 'Commissioned 2024' },
    ],
    isFeatured: true,
    projectCode: 'IND-OD-109',
    gallery: [IMG.warehouse, IMG.industrial, IMG.rebar],
  },
  {
    id: 5,
    slug: 'island-crest-premium-residential-township',      // ⚠ [CLIENT CONTENT PENDING]
    name: 'Island Crest Premium Residential Township (G+14)', // ⚠ [CLIENT CONTENT PENDING]
    category: 'residential',
    region: 'andaman',
    location: 'Port Blair, Andaman & Nicobar',              // ⚠ [CLIENT CONTENT PENDING]
    client: 'Island Realty Consortium',                     // ⚠ [CLIENT CONTENT PENDING]
    status: 'commissioned',
    completionDate: '2024',
    completionPercent: 100,
    coverImage: IMG.highrise,
    shortDescription: 'Seismic Zone V compliant G+14 high-ductility structural framing with salt-spray resistant concrete.',
    description: 'Engineered specifically for Seismic Zone V conditions in island topography. High-ductility structural framing with monolithic shear foundations and specialized salt-spray resistant exterior concrete.',
    specs: [
      { label: 'Capacity', value: '180 Units Across 3 Towers' },
      { label: 'Seismic Zone', value: 'Zone V Compliance' },
      { label: 'Framing', value: 'G+14 High-Strength Framing' },
      { label: 'Status', value: 'Civil Core Verified' },
    ],
    isFeatured: true,
    projectCode: 'RES-AN-055',
    gallery: [IMG.highrise, IMG.residential, IMG.building],
  },
  {
    id: 6,
    slug: 'bhubaneswar-administrative-complex',             // ⚠ [CLIENT CONTENT PENDING]
    name: 'Bhubaneswar Central Administrative & Secretariat Annex', // ⚠ [CLIENT CONTENT PENDING]
    category: 'government',
    region: 'odisha',
    location: 'Bhubaneswar, Odisha',                        // ⚠ [CLIENT CONTENT PENDING]
    client: 'State Public Works Division',                  // ⚠ [CLIENT CONTENT PENDING]
    status: 'ongoing',
    completionDate: 'Q4 2025',
    completionPercent: 55,
    coverImage: IMG.building,
    shortDescription: 'High-capacity G+8 government administrative complex adhering to CPWD specifications and NBC standards.',
    description: 'Disciplined civil execution for government administrative complex with strict milestone auditing, transparent BOQs, and adherence to statutory inspection schedules under CPWD specifications.',
    specs: [
      { label: 'Client', value: 'State PWD' },
      { label: 'Type', value: 'Government Administrative' },
      { label: 'Compliance', value: 'CPWD & NBC 2016' },
      { label: 'Status', value: 'Active Execution' },
    ],
    isFeatured: false,
    projectCode: 'GOV-OD-031',
    gallery: [IMG.building, IMG.commercial, IMG.pmc],
  },
  {
    id: 7,
    slug: 'mahanadi-river-multi-span-elevated-viaduct',     // ⚠ [CLIENT CONTENT PENDING]
    name: 'Mahanadi River Multi-Span Elevated Viaduct',     // ⚠ [CLIENT CONTENT PENDING]
    category: 'infrastructure',
    region: 'odisha',
    location: 'Cuttack, Odisha',                            // ⚠ [CLIENT CONTENT PENDING]
    client: 'State Highway Dept',                           // ⚠ [CLIENT CONTENT PENDING]
    status: 'commissioned',
    completionDate: '2023',
    completionPercent: 100,
    coverImage: IMG.bridge,
    shortDescription: 'High-speed arterial-class bridge with precast segmental spans and deep riverine foundation caissons.',
    description: 'Arterial-class bridge over the Mahanadi river featuring precast segmental spans, deep well caisson foundations, and high-performance concrete compliant with IRC:112.',
    specs: [
      { label: 'Total Length', value: '2.1 Kilometres' },
      { label: 'Foundation', value: 'Deep Well Caissons' },
      { label: 'Compliance', value: 'IRC:112 & IS 456' },
      { label: 'Status', value: 'Commissioned 2023' },
    ],
    isFeatured: false,
    projectCode: 'INFRA-OD-018',
    gallery: [IMG.bridge, IMG.road, IMG.rebar],
  },
  {
    id: 8,
    slug: 'eastern-regional-pharma-manufacturing',          // ⚠ [CLIENT CONTENT PENDING]
    name: 'Eastern Regional Pharma Manufacturing & Cleanroom', // ⚠ [CLIENT CONTENT PENDING]
    category: 'industrial',
    region: 'odisha',
    location: 'Angul, Odisha',                              // ⚠ [CLIENT CONTENT PENDING]
    client: 'National Pharma Group',                        // ⚠ [CLIENT CONTENT PENDING]
    status: 'commissioned',
    completionDate: '2024',
    completionPercent: 100,
    coverImage: IMG.industrial,
    shortDescription: 'GMP-compliant cleanroom superflat floors, anti-vibration machine pads, and HVAC structural penetrations.',
    description: 'Complex industrial facility combining GMP-compliant cleanroom construction with heavy-duty industrial floor systems and precision anti-vibration machine foundation pads.',
    specs: [
      { label: 'Client', value: 'National Pharma Group' },
      { label: 'Floor Spec', value: 'DIN 15185 Superflat' },
      { label: 'Cleanroom', value: 'ISO Class 8 Structure' },
      { label: 'Status', value: 'Commissioned 2024' },
    ],
    isFeatured: false,
    projectCode: 'IND-OD-097',
    gallery: [IMG.industrial, IMG.warehouse, IMG.rebar],
  },
  {
    id: 9,
    slug: 'heritage-judicial-court-restoration',            // ⚠ [CLIENT CONTENT PENDING]
    name: 'Heritage Judicial Court Retrofit & Structural Conservation', // ⚠ [CLIENT CONTENT PENDING]
    category: 'government',
    region: 'odisha',
    location: 'Cuttack, Odisha',                            // ⚠ [CLIENT CONTENT PENDING]
    client: 'Odisha Public Works Dept',                     // ⚠ [CLIENT CONTENT PENDING]
    status: 'commissioned',
    completionDate: '2023',
    completionPercent: 100,
    coverImage: IMG.repair,
    shortDescription: 'Deep structural underpinning, injection hardening, and seismic monitoring of a Grade II heritage structure.',
    description: 'Sensitive structural conservation of a century-old judicial complex combining modern seismic retrofitting techniques with heritage preservation protocols.',
    specs: [
      { label: 'Type', value: 'Heritage Retrofitting' },
      { label: 'Methodology', value: 'CFRP + Micro Concrete' },
      { label: 'Compliance', value: 'ASI Conservation Norms' },
      { label: 'Status', value: 'Successfully Conserved' },
    ],
    isFeatured: false,
    projectCode: 'GOV-OD-012',
    gallery: [IMG.repair, IMG.rebar, IMG.building],
  },
]

/* ══════════════ TEAM ══════════════ */
// ⚠ [CLIENT CONTENT PENDING] — Members 2–4 (Srinivas Rao, Priya Nair, Arjun Mehta) are
// fabricated. Replace with real team members supplied by client. Member 1 (Pankaj Kumar Rungta)
// is assumed real but confirm name/credentials with client before publishing.
export const team = [
  {
    id: 1,
    name: 'Pankaj Kumar Rungta',
    designation: 'Director & Chartered Engineer',
    role: 'director',
    experience: '30+ Years',
    qualifications: ['BE (Civil)', 'MIE', 'Chart Eng.', 'MIBC', 'MIOV', 'MIRC', 'PBMC Regd.'],
    bio: 'Provides direct technical governance over site execution, subgrade seismic modeling, material cube testing logs, and statutory building compliance across state development jurisdictions.',
    photo: IMG.team1,
    email: 'director@neevevara.com',
    order: 1,
  },
  {
    id: 2,
    name: 'Srinivas Rao',                                  // ⚠ [CLIENT CONTENT PENDING]
    designation: 'Senior Project Manager — PMC',           // ⚠ [CLIENT CONTENT PENDING]
    role: 'project-manager',
    experience: '18 Years',
    qualifications: ['BE (Civil)', 'PMP Certified', 'NICMAR Alumnus'],
    bio: 'Experienced civil manager handling critical path schedules, contractor accountability, and budget compliance across regional infrastructure projects.',
    photo: IMG.team2,
    email: 'srao@neevevara.com',
    order: 2,
  },
  {
    id: 3,
    name: 'Priya Nair',                                    // ⚠ [CLIENT CONTENT PENDING]
    designation: 'Lead Structural Engineer',               // ⚠ [CLIENT CONTENT PENDING]
    role: 'civil-engineer',
    experience: '12 Years',
    qualifications: ['M.Tech (Structural)', 'MIE', 'STAAD Pro Expert'],
    bio: 'Specializes in seismic analysis, wind shear assessment, and high-tensile column load design for multi-story commercial and industrial structures.',
    photo: IMG.team3,
    email: 'pnair@neevevara.com',
    order: 3,
  },
  {
    id: 4,
    name: 'Arjun Mehta',                                   // ⚠ [CLIENT CONTENT PENDING]
    designation: 'BIM & CAD Coordinator',                 // ⚠ [CLIENT CONTENT PENDING]
    role: 'architect',
    experience: '8 Years',
    qualifications: ['B.Arch', 'Revit Certified', 'LOD 400 BIM'],
    bio: 'Leads digital coordination teams resolving architectural, structural, and MEP clashes prior to ground breaking using Revit, AutoCAD, and ETABS.',
    photo: IMG.team4,
    email: 'amehta@neevevara.com',
    order: 4,
  },
]

/* ══════════════ TESTIMONIALS ══════════════ */
// ⚠ [CLIENT CONTENT PENDING] — All testimonials below are entirely fabricated.
// Publishing invented client quotes is a credibility and legal liability risk.
// Replace with verified, signed-off testimonials from actual clients.
export const testimonials = [
  {
    id: 1,
    clientName: 'Rajesh Panda',                            // ⚠ [CLIENT CONTENT PENDING]
    clientDesignation: 'MD',                               // ⚠ [CLIENT CONTENT PENDING]
    clientOrganization: 'Commercial Asset Developer • Eastern Region', // ⚠ [CLIENT CONTENT PENDING]
    review: 'Neevevera brought architectural discipline and uncompromising engineering precision to our commercial foundations. Their site supervision team caught critical deviations before pour, saving substantial project time and cost.',
    rating: 5,
    projectRef: 'Apex Horizon Commercial Tower',
    isApproved: true,
    isFeatured: true,
  },
  {
    id: 2,
    clientName: 'Suresh Kumar',                            // ⚠ [CLIENT CONTENT PENDING]
    clientDesignation: 'Chief Engineer',                   // ⚠ [CLIENT CONTENT PENDING]
    clientOrganization: 'State Highway Authority • Odisha', // ⚠ [CLIENT CONTENT PENDING]
    review: 'The viaduct execution quality exceeded our expectations. Neevevera\'s team maintained IS 456 and IRC:112 compliance throughout, with zero NCRs during our statutory inspections.',
    rating: 5,
    projectRef: 'Mahanadi River Viaduct',
    isApproved: true,
    isFeatured: true,
  },
  {
    id: 3,
    clientName: 'Anita Sharma',                            // ⚠ [CLIENT CONTENT PENDING]
    clientDesignation: 'Director',                         // ⚠ [CLIENT CONTENT PENDING]
    clientOrganization: 'Island Realty Consortium • Andaman', // ⚠ [CLIENT CONTENT PENDING]
    review: 'Building in Zone V seismic conditions requires extraordinary expertise. Neevevera delivered our G+14 township on schedule with complete structural certification — a remarkable achievement in island conditions.',
    rating: 5,
    projectRef: 'Island Crest Premium Township',
    isApproved: true,
    isFeatured: false,
  },
]

/* ══════════════ CAREERS ══════════════ */
export const careers = [
  {
    id: 1,
    slug: 'senior-civil-engineer-infrastructure',
    title: 'Senior Civil Engineer — Infrastructure',
    department: 'Engineering',
    location: 'Cuttack / Odisha',
    type: 'full-time',
    experience: '5+ Years',
    description: 'Lead site engineering for bridge viaducts and structural concrete projects across the Odisha corridor.',
    responsibilities: [
      'Lead structural execution on bridge and viaduct projects',
      'Coordinate with PMC teams on BOQ reconciliation',
      'Supervise rebar placement and concrete pour operations',
      'Maintain QA/QC logs and cube test records',
    ],
    requirements: [
      'BE / B.Tech in Civil Engineering',
      'Minimum 5 years field experience in infrastructure',
      'Proficiency in STAAD Pro or ETABS preferred',
      'IRC:112 and IS 456 working knowledge mandatory',
    ],
    closingDate: '2025-12-31',
    isActive: true,
    colorAccent: 'brand-blue',
  },
  {
    id: 2,
    slug: 'site-qa-qc-supervisor-andaman',
    title: 'Site QA/QC Supervisor — Industrial',
    department: 'Quality Assurance',
    location: 'Port Blair, Andaman',
    type: 'full-time',
    experience: '3+ Years',
    description: 'Oversee rebar placement, concrete cube testing, batching logs, and statutory civil quality protocols for island projects.',
    responsibilities: [
      'Conduct cube strength testing per IS 456 schedule',
      'Maintain daily site inspection and concrete pour logs',
      'Interface with third-party NABL lab for audits',
      'Verify cover blocks, tie bars, and formwork alignment',
    ],
    requirements: [
      'Diploma / BE in Civil Engineering',
      'Minimum 3 years site QA experience',
      'Familiarity with IS 456 cube testing protocols',
      'Ready to relocate to Andaman',
    ],
    closingDate: '2025-11-30',
    isActive: true,
    colorAccent: 'brand-green',
  },
  {
    id: 3,
    slug: 'bim-structural-modeler-kolkata',
    title: 'BIM & Structural Modeler',
    department: 'Design & Technology',
    location: 'Kolkata / Remote',
    type: 'full-time',
    experience: '2+ Years',
    description: 'Produce Revit / AutoCAD structural models, clash detection reports, and good-for-construction drawings.',
    responsibilities: [
      'Develop Revit structural models to LOD 350+',
      'Perform MEP and architectural clash detection',
      'Produce GFC drawings and shop drawing packages',
      'Coordinate with structural engineers on ETABS model verification',
    ],
    requirements: [
      'B.Arch or B.Tech (Civil / Structural)',
      'Proficiency in Revit, AutoCAD, and ETABS',
      'Minimum 2 years BIM project experience',
      'Familiarity with IS structural design codes',
    ],
    closingDate: '2025-12-15',
    isActive: true,
    colorAccent: 'brand-gold',
  },
]

/* ══════════════ BLOG / INSIGHTS ══════════════ */
export const insights = [
  {
    id: 1,
    slug: 'deep-piling-protocols-coastal-soils',
    title: 'Deep Piling Protocols in Coastal Soils',
    type: 'article',
    category: 'engineering',
    excerpt: 'Technical review of sulfate-resistant cement mixes, bentonite slurry management, and pile integrity testing in island and coastal conditions.',
    content: 'Reinforced concrete infrastructure in coastal zones faces unique challenges from chloride-induced corrosion, sulfate attack, and soil liquefaction risk...',
    coverImage: IMG.coastal,
    author: 'Er. Pankaj Kumar Rungta',
    tags: ['Foundation', 'Coastal Engineering', 'IS 456'],
    isPublished: true,
    publishedAt: '2025-08-15',
    readTime: '6 min',
    colorAccent: 'brand-blue',
  },
  {
    id: 2,
    slug: 'ndt-concrete-quality-assessment',
    title: 'Non-Destructive Testing for Concrete Quality Assessment',
    type: 'article',
    category: 'engineering',
    excerpt: 'Calibrating rebound hammers and ultrasonic pulse velocity metrics to evaluate structural soundness in commercial concrete cores.',
    content: 'Ultrasonic Pulse Velocity (UPV) testing has become the gold standard for in-situ concrete quality assessment...',
    coverImage: IMG.rebar,
    author: 'Er. Srinivas Rao',
    tags: ['QA/QC', 'NDT', 'Concrete Testing'],
    isPublished: true,
    publishedAt: '2025-07-20',
    readTime: '5 min',
    colorAccent: 'brand-green',
  },
  {
    id: 3,
    slug: 'regional-infrastructure-podcast-ep1',
    title: 'Regional Infrastructure Development — Episode 1',
    type: 'podcast',
    category: 'industry-news',
    excerpt: 'Discussions with chartered engineers on regional logistics, subgrade soil behavior, and modern fast-track bridge building.',
    content: 'In our inaugural episode, we discuss the challenges of building critical infrastructure in Eastern India\'s diverse terrain...',
    coverImage: IMG.bridge,
    author: 'Neevevera Editorial',
    tags: ['Podcast', 'Infrastructure', 'Eastern India'],
    isPublished: true,
    publishedAt: '2025-06-10',
    readTime: '32 min',
    colorAccent: 'brand-gold',
  },
  {
    id: 4,
    slug: 'seismic-retrofitting-zone-v-structures',
    title: 'Seismic Retrofitting of Zone V Structures in Island Territories',
    type: 'article',
    category: 'engineering',
    excerpt: 'Methodology for CFRP-based seismic upgrade of Andaman structures classified under IS 1893 Zone V seismicity.',
    content: 'The Andaman & Nicobar Islands lie in one of India\'s highest seismic risk zones, creating unique structural engineering challenges...',
    coverImage: IMG.repair,
    author: 'Er. Priya Nair',
    tags: ['Seismic', 'Retrofitting', 'Andaman', 'IS 13920'],
    isPublished: true,
    publishedAt: '2025-05-22',
    readTime: '8 min',
    colorAccent: 'brand-blue',
  },
]

/* ══════════════ NEWSLETTERS ══════════════ */
export const newsletters = [
  {
    id: 1,
    slug: 'field-notes-q3-2025',
    title: 'Neevevera Field Notes — Q3 2025',
    excerpt: 'Quarterly engineering bulletin covering active site progress across our Odisha, Andaman, and Kolkata operations.',
    coverImage: IMG.pmc,
    publishedAt: '2025-09-01',
    isPublished: true,
  },
  {
    id: 2,
    slug: 'construction-materials-bulletin',
    title: 'Construction Materials & Pricing Bulletin — September 2025',
    excerpt: 'Regional steel, cement and aggregate pricing updates with DSR rate analysis for Eastern India markets.',
    coverImage: IMG.industrial,
    publishedAt: '2025-09-05',
    isPublished: true,
  },
]

/* ══════════════ GALLERY ITEMS ══════════════ */
export const galleryItems = [
  { id: 1, image: IMG.hero,       caption: 'Superstructure Concrete Pour', tag: 'Site Staging',     tagColor: 'brand-blue'  },
  { id: 2, image: IMG.rebar,      caption: 'Rebar Spacing Verification',   tag: 'Quality Assurance', tagColor: 'brand-green' },
  { id: 3, image: IMG.bridge,     caption: 'Girder Launching Operations',   tag: 'Infrastructure',  tagColor: 'brand-gold'  },
  { id: 4, image: IMG.commercial, caption: 'Exposed Concrete Finish',       tag: 'Interiors',       tagColor: 'brand-blue'  },
  { id: 5, image: IMG.warehouse,  caption: 'PEB Steel Frame Erection',      tag: 'Industrial',      tagColor: 'brand-gold'  },
  { id: 6, image: IMG.coastal,    caption: 'Marine Retaining Wall Pour',    tag: 'Coastal Works',   tagColor: 'brand-green' },
  { id: 7, image: IMG.repair,     caption: 'CFRP Wrapping Application',     tag: 'Retrofitting',    tagColor: 'brand-blue'  },
  { id: 8, image: IMG.road,       caption: 'Subgrade Compaction Testing',   tag: 'Road Works',      tagColor: 'brand-green' },
]

/* ══════════════ METRICS ══════════════ */
// ⚠ [CLIENT CONTENT PENDING] — Numbers are estimated/fabricated. Confirm all
// figures (project count, years, headcount) with the client before launch.
export const metrics = [
  { value: '120+', label: 'Projects Delivered',    note: 'Residential, civil & turnkey developments',       accent: 'brand-blue'     }, // ⚠ [CLIENT CONTENT PENDING]
  { value: '30+',  label: 'Years of Leadership',   note: 'Chartered Engineer & Civil Leadership',           accent: 'brand-green'    }, // ⚠ [CLIENT CONTENT PENDING]
  { value: '200+', label: 'Field Specialists',      note: 'Engineers, supervisors & skilled craftspeople',  accent: 'brand-gold'     }, // ⚠ [CLIENT CONTENT PENDING]
  { value: '03',   label: 'Regional Command Hubs', note: 'Odisha • Andaman • Kolkata',                     accent: 'border-neutral' },
]

export const teamMembers = team.map((m) => ({
  ...m,
  role: m.designation,
  credentials: m.qualifications ? m.qualifications.join(' • ') : '',
  image: m.photo,
}))

export const podcasts = [
  {
    id: 1,
    episodeNumber: '01',
    title: 'Regional Infrastructure & High-Seismic Foundations in Eastern India',
    duration: '38 mins',
    publishedAt: 'October 2025',
    guest: 'Er. Pankaj Kumar Rungta, FIE',
    description: 'A deep-dive into geotechnical challenges in coastal alluvial soils, driven piling vs bored cast-in-situ, and seismic Zone-V ductile detailing.',
  },
  {
    id: 2,
    episodeNumber: '02',
    title: 'PEB Superflat Floors & Industrial Logistics Engineering',
    duration: '45 mins',
    publishedAt: 'November 2025',
    guest: 'Er. Srinivas Rao, PMP',
    description: 'Examining laser-screed FM2 flooring tolerances, crane runway deflection limits, and clear-span steel frame erection under tight deadlines.',
  },
  {
    id: 3,
    episodeNumber: '03',
    title: 'Marine Concrete Durability & Corrosion Mitigation in Andaman Waters',
    duration: '32 mins',
    publishedAt: 'December 2025',
    guest: 'Er. Priya Nair, M.Tech Structural',
    description: 'Analyzing chloride threshold values, GGBS replacement ratios, and cathodic protection methods for coastal retaining walls.',
  },
]
