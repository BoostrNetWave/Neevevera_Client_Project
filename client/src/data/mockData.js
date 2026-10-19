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
    slug: 'construction',
    number: '01',
    title: 'Construction',
    category: 'construction',
    shortDescription: 'Integrated residential, institutional, and commercial structural execution built to rigorous Indian and global engineering benchmarks.',
    description: 'Neevevera provides integrated civil, structural, and infrastructure solutions compliant with National Building Code (NBC 2016) and relevant Indian Standards (IS Codes). We execute projects with full turnkey accountability from geotechnical surveys and deep piling to structural shell completion.',
    image: IMG.hero,
    features: [
      'Deep bored cast-in-situ piling & raft foundations',
      'Monolithic concrete framing & post-tensioned slabs',
      'PEB clear-span warehouse frameworks up to 48m',
      'Seismic Zone-V ductile detailing per IS 13920',
    ],
    benefits: [
      'IS 456 & IS 800 statutory compliance',
      'Director-led chartered engineer QA/QC protocols',
      'NABL-certified 7 & 28-day concrete cube testing',
      'Full turnkey handover with structural warranty',
    ],
    priceNote: 'Quotation based on itemized BOQ and site investigation.',
    sections: [
      {
        title: 'A. Residential Construction',
        description: 'End-to-end residential civil execution ranging from luxury standalone villas to high-density multi-story apartment complexes.',
        order: 1,
        services: [
          {
            title: 'Villas',
            description: 'Custom architectural framing, premium turnkey execution, and monolithic RCC structural framing for luxury private residences.',
            image: IMG.residential,
            isActive: true,
            order: 1,
          },
          {
            title: 'Apartments',
            description: 'Multi-family high-rise housing towers with post-tensioned slabs, shear wall systems, and seismic-resilient engineering.',
            image: IMG.commercial,
            isActive: true,
            order: 2,
          },
          {
            title: 'Other Residential Buildings',
            description: 'Townships, row houses, and community residential developments engineered for longevity and tropical weather resilience.',
            image: IMG.hero,
            isActive: true,
            order: 3,
          },
        ],
      },
      {
        title: 'B. Institutional Construction',
        description: 'Public, healthcare, educational, and heavy industrial facilities engineered under stringent compliance standards.',
        order: 2,
        services: [
          {
            title: 'Schools',
            description: 'Multi-wing educational facilities, auditoriums, science laboratories, and sports infrastructure built with child-safe civil detailing.',
            image: IMG.commercial,
            isActive: true,
            order: 1,
          },
          {
            title: 'Hospitals',
            description: 'Specialized healthcare facilities engineered for heavy medical equipment vibration damping, cleanroom HVAC integration, and uninterrupted utility services.',
            image: IMG.bridge,
            isActive: true,
            order: 2,
          },
          {
            title: 'Industrial Buildings and Facilities',
            description: 'Pre-Engineered Buildings (PEB), heavy manufacturing bays, clear-span warehouses, and laser-screed FM2 superflat industrial floors.',
            image: IMG.industrial,
            isActive: true,
            order: 3,
          },
          {
            title: 'Other Institutional Projects',
            description: 'Government administrative complexes, judiciary annexes, and civic public utility facilities adhering to CPWD norms.',
            image: IMG.hero,
            isActive: true,
            order: 4,
          },
        ],
      },
      {
        title: 'C. Commercial Construction',
        description: 'State-of-the-art corporate offices, retail hubs, and multi-tenant commercial centers.',
        order: 3,
        services: [
          {
            title: 'Shopping Malls',
            description: 'Large-span retail developments, multi-level atrium structures, central HVAC shafts, and heavy pedestrian traffic load design.',
            image: IMG.commercial,
            isActive: true,
            order: 1,
          },
          {
            title: 'Other Commercial Buildings and Facilities',
            description: 'Corporate office towers, business parks, IT incubators, and hospitality centers with modern facade and MEP integration.',
            image: IMG.coastal,
            isActive: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    id: 2,
    slug: 'building-repair-maintenance',
    number: '02',
    title: 'Building Repair and Maintenance',
    category: 'building-repair-maintenance',
    shortDescription: 'End-to-end structural retrofitting, non-destructive rehabilitation, waterproofing, and institutional AMC management.',
    description: 'Comprehensive civil rehabilitation, non-destructive structural diagnostics, specialized waterproofing, and routine asset longevity maintenance for residential, commercial, and industrial facilities across Odisha, Andaman, and Kolkata sectors.',
    image: IMG.rebar,
    features: [
      'Non-destructive testing (NDT) & Ultrasonic Pulse Velocity audits',
      'Carbon Fiber Reinforced Polymer (CFRP) structural wrapping',
      'Pressure injection epoxy grouting for foundation and slab cracks',
      'Multi-tier facility Annual Maintenance Contracts (AMC)',
    ],
    benefits: [
      'CPWD / IS 15988 seismic & structural retrofitting compliance',
      'Rapid response SLA under 24 hours for emergency repairs',
      'Up to 10-year warranty on elastomeric & injection waterproofing',
      'Zero Lost Time Injury (LTI) safety compliance record',
    ],
    priceNote: 'Site audit and non-destructive survey required prior to estimate.',
    sections: [
      {
        title: 'Specialized Maintenance Modules',
        description: 'Dedicated multidisciplinary teams deployed with calibrated instrumentation, safety gear, and industrial-grade compounds.',
        order: 1,
        services: [
          {
            title: 'Annual Maintenance Contract (AMC)',
            description: 'Preventive structured care, routine moisture inspections, joint sealant re-checks, and scheduled maintenance schedules for commercial campuses and housing societies.',
            image: IMG.hero,
            isActive: true,
            order: 1,
          },
          {
            title: 'Fabrication Work',
            description: 'Custom heavy structural steel framing, MS & SS architectural staircases, protective canopy fabrications, and industrial pipe rack installations.',
            image: IMG.industrial,
            isActive: true,
            order: 2,
          },
          {
            title: 'Waterproofing and Leakage Repair',
            description: 'Negative-side crystalline waterproofing, polyurethane pressure grouting, elastomeric terrace coatings, and basement hydrostatic relief systems.',
            image: IMG.coastal,
            isActive: true,
            order: 3,
          },
          {
            title: 'Painting',
            description: 'Anti-fungal, UV-resilient exterior elastomeric paints, acoustic baffle interior finishes, and textured protective coatings.',
            image: IMG.commercial,
            isActive: true,
            order: 4,
          },
          {
            title: 'Masonry Work',
            description: 'Load-bearing and partition brickwork, autoclaved aerated concrete (AAC) block masonry, repointing of historic stone joints, and boundary wall fortifications.',
            image: IMG.residential,
            isActive: true,
            order: 5,
          },
          {
            title: 'Electrical Work',
            description: 'Substation setups, HT/LT cable laying, distribution panel overhauls, earthing grid certifications, and energy-efficient LED conversion retrofits.',
            image: IMG.bridge,
            isActive: true,
            order: 6,
          },
          {
            title: 'Plumbing Work',
            description: 'Hydro-pneumatic pumping networks, CPVC/UPVC water distribution lines, sewage stack replacements, rainwater harvesting, and interceptor chamber overhauls.',
            image: IMG.rebar,
            isActive: true,
            order: 7,
          },
          {
            title: 'Other Repair and Maintenance Services',
            description: 'Tailored micro-repairs including tile re-grouting, spall patch-work, de-laminated floor realignments, and rapid-response emergency water damage mitigations.',
            image: IMG.industrial,
            isActive: true,
            order: 8,
          },
        ],
      },
    ],
  },
  {
    id: 3,
    slug: 'design-planning',
    number: '03',
    title: 'Design and Planning',
    category: 'design-planning',
    shortDescription: 'Complete architectural drafting, structural engineering calculations, 3D visualizations, and BIM walkthrough coordination.',
    description: 'Holistic architectural conceptualization, structural analysis per Indian & international design codes, high-fidelity 3D modeling, and comprehensive clash-free pre-construction documentation.',
    image: IMG.commercial,
    features: [
      'Comprehensive architectural blueprinting and space planning',
      'Photorealistic 3D external and interior rendering',
      'Cinematic 4K camera walkthroughs',
      'Good-for-Construction (GFC) structural details',
    ],
    benefits: [
      'LOD 400 Building Information Modeling (BIM)',
      'STAAD Pro & ETABS finite element seismic modeling',
      'Clash detection before site ground breaking',
      'Statutory sanction drawing packages approved by municipal authorities',
    ],
    priceNote: 'Tiered architectural and structural engineering fee schedule.',
    sections: [
      {
        title: 'Architectural & Structural Design Solutions',
        description: 'Integrated drafting, spatial planning, and advanced computer-aided engineering modeling.',
        order: 1,
        services: [
          {
            title: 'Building Design',
            description: 'Complete architectural planning, functional layout optimization, statutory sanction drawings, and sustainable passive bioclimatic design.',
            image: IMG.residential,
            isActive: true,
            order: 1,
          },
          {
            title: '3D Visualization',
            description: 'Photorealistic exterior and interior architectural renderings, material texture mapping, and daylight simulation studies.',
            image: IMG.commercial,
            isActive: true,
            order: 2,
          },
          {
            title: '3D Camera Walkthrough',
            description: 'Cinematic 4K virtual tours, immersive space walkthroughs, and interactive client presentation experiences before ground-breaking.',
            image: IMG.hero,
            isActive: true,
            order: 3,
          },
          {
            title: 'Structural Design',
            description: 'STAAD Pro and ETABS structural analysis, seismic ductile detailing per IS 13920, and precision Good-For-Construction (GFC) engineering blueprints.',
            image: IMG.rebar,
            isActive: true,
            order: 4,
          },
        ],
      },
    ],
  },
  {
    id: 4,
    slug: 'interior-exterior-solutions',
    number: '04',
    title: 'Interior and Exterior Solutions',
    category: 'interior-exterior-solutions',
    shortDescription: 'Architectural facade engineering, high-durability exterior cladding, false ceiling systems, and bespoke corporate interior fit-outs.',
    description: 'Complete turnkey execution of interior spaces, modern facade systems, and architectural envelopes blending aesthetic elegance with industrial durability.',
    image: IMG.commercial,
    features: [
      'Turnkey corporate and residential fit-outs',
      'Acoustic ceiling and fluted wall panel systems',
      'High-Pressure Laminate (HPL) & ACP exterior facades',
      'Bespoke commercial and hospitality furniture fabrication',
    ],
    benefits: [
      'Class A materials and fire-retardant certifications',
      'Turnkey handover including electrical, acoustic, and HVAC integration',
      'Weather-resistant exterior cladding engineered for coastal salinity',
      'Customized furniture manufacturing with long-term warranties',
    ],
    priceNote: 'Custom estimate based on architectural BOQ & finish tier.',
    sections: [
      {
        title: 'Interior & Exterior Execution Capabilities',
        description: 'High-durability finishes, bespoke furnishings, and climate-resistant building envelopes.',
        order: 1,
        services: [
          {
            title: 'Interior Design and Execution',
            description: 'End-to-end turnkey corporate office, retail, and luxury residential interior execution with coordinated MEP and acoustic engineering.',
            image: IMG.commercial,
            isActive: true,
            order: 1,
          },
          {
            title: 'False Ceiling and Ceiling Work',
            description: 'Gypsum plasterboard, modular acoustic tiles, metal baffle systems, and concealed ambient LED lighting integrations.',
            image: IMG.residential,
            isActive: true,
            order: 2,
          },
          {
            title: 'Furnishing',
            description: 'Tailored space furnishing, ergonomic workstation layouts, modular cabinetry, and premium custom woodwork.',
            image: IMG.hero,
            isActive: true,
            order: 3,
          },
          {
            title: 'Wall Cladding',
            description: 'Interior stone veneers, acoustic timber panels, fluted decorative wall panels, and moisture-resistant tile cladding.',
            image: IMG.commercial,
            isActive: true,
            order: 4,
          },
          {
            title: 'Exterior Cladding',
            description: 'High-pressure laminate (HPL), fiber cement boards, ACP panels, and terracotta rainscreen cladding systems.',
            image: IMG.bridge,
            isActive: true,
            order: 5,
          },
          {
            title: 'Facade Renovation and Face-Lifting',
            description: 'Structural glazing, curtain wall modernization, exterior structural louvers, and aesthetic architectural building transformations.',
            image: IMG.coastal,
            isActive: true,
            order: 6,
          },
          {
            title: 'Furniture and Furnishing Solutions (Sofas, Mattresses, etc.)',
            description: 'Custom executive sofas, ergonomic commercial seating, contract hospitality bedding, mattresses, and soft furnishings.',
            image: IMG.residential,
            isActive: true,
            order: 7,
          },
        ],
      },
    ],
  },
  {
    id: 5,
    slug: 'project-management-consultancy',
    number: '05',
    title: 'Project Management Consultancy (PMC)',
    category: 'project-management-consultancy',
    shortDescription: 'Comprehensive site governance, tender preparation, quality assurance supervision, and statutory liaison for large civil undertakings.',
    description: 'Chartered Engineer-led project management consultancy providing rigorous quality control, schedule acceleration, cost auditing, contractor governance, and statutory certification across all construction lifecycle stages.',
    image: IMG.pmc,
    features: [
      'Critical Path Method (CPM) project scheduling and resource leveling',
      'Detailed contractor pre-qualification and tender documentation',
      'Milestone-linked bill verification and technical audits',
      'Statutory compliance and occupancy certificate coordination',
    ],
    benefits: [
      'Chartered Engineer oversight on every critical milestone',
      'FIDIC & CPWD contract governance and dispute mitigation',
      'Independent BOQ reconciliation preventing billing inflation',
      'On-site laboratory testing supervision for concrete and steel',
    ],
    priceNote: 'Retainer or percentage-of-cost PMC model.',
    sections: [
      {
        title: 'Advisory & Execution Governance',
        description: 'Independent third-party technical oversight ensuring transparent billing, zero-defect execution, and timeline compliance.',
        order: 1,
        services: [
          {
            title: 'Project Management and Consultancy Services',
            description: 'Critical path scheduling (CPM), BOQ reconciliation, vendor procurement governance, on-site QA/QC laboratory supervision, and chartered engineer milestone certifications.',
            image: IMG.pmc,
            isActive: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    id: 6,
    slug: 'additional-services-platform-features',
    number: '06',
    title: 'Additional Services and Platform Features',
    category: 'additional-services-platform-features',
    shortDescription: 'Modular and specialized technical capabilities, emerging engineering integrations, and proprietary digital platform services.',
    description: 'Modular and specialized technical capabilities, emerging engineering integrations, and proprietary digital platform services engineered to streamline civil project tracking and technical compliance.',
    image: IMG.industrial,
    features: [
      'Off-site prefabrication and modular volumetric construction',
      'Proprietary digital client portal with drone-assisted site logs',
      'Specialized non-destructive structural diagnostics & testing',
      'Custom technical engineering consultations',
    ],
    benefits: [
      'Modular prefabrication reducing site build timelines by up to 35%',
      'Real-time cloud dashboard for tracking progress and inspection records',
      'NABL-accredited diagnostic laboratory testing for specialized audits',
      'Scalable enterprise integrations for corporate asset managers',
    ],
    priceNote: 'Engaged per module or enterprise licensing subscription.',
    sections: [
      {
        title: 'Specialized Capabilities & Digital Features',
        description: 'Innovative construction methodologies and real-time project management digital tools.',
        order: 1,
        services: [
          {
            title: 'Modular Construction Solutions',
            description: 'Off-site prefabricated volumetric modules, quick-assembly structural units, and temporary site office infrastructures.',
            image: IMG.industrial,
            isActive: true,
            order: 1,
          },
          {
            title: 'Proprietary Digital Platform Integration',
            description: 'Cloud-based client portal for live site progress tracking, drone surveillance feeds, automated BOQ reconciliation, and digital QA sign-offs.',
            image: IMG.hero,
            isActive: true,
            order: 2,
          },
          {
            title: 'Specialized Site Testing & Technical Audits',
            description: 'Ultrasonic Pulse Velocity (UPV), concrete core extraction, soil bearing capacity plate load tests, and statutory structural fitness certificates.',
            image: IMG.bridge,
            isActive: true,
            order: 3,
          },
        ],
      },
    ],
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
