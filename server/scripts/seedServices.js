import 'dotenv/config';
import mongoose from 'mongoose';
import Service from '../src/models/Service.js';

const SEED_SERVICES = [
  {
    slug: 'construction',
    title: 'Construction',
    category: 'construction',
    order: 1,
    shortDescription: 'Integrated residential, institutional, and commercial structural execution built to rigorous Indian and global engineering benchmarks.',
    description: 'Neevevera provides integrated civil, structural, and infrastructure solutions compliant with National Building Code (NBC 2016) and relevant Indian Standards (IS Codes). We execute projects with full turnkey accountability from geotechnical surveys and deep piling to structural shell completion.',
    image: '/images/client_hero.webp',
    benefits: [
      'IS 456 & IS 800 statutory compliance',
      'Director-led chartered engineer QA/QC protocols',
      'NABL-certified 7 & 28-day concrete cube testing',
      'Full turnkey handover with structural warranty',
    ],
    features: [
      'Deep bored cast-in-situ piling & raft foundations',
      'Monolithic concrete framing & post-tensioned slabs',
      'PEB clear-span warehouse frameworks up to 48m',
      'Seismic Zone-V ductile detailing per IS 13920',
    ],
    isActive: true,
    sections: [
      {
        title: 'A. Residential Construction',
        description: 'End-to-end residential civil execution ranging from luxury standalone villas to high-density multi-story apartment complexes.',
        order: 1,
        services: [
          {
            title: 'Villas',
            description: 'Custom architectural framing, premium turnkey execution, and monolithic RCC structural framing for luxury private residences.',
            image: '/images/client_residential.webp',
            isActive: true,
            order: 1,
          },
          {
            title: 'Apartments',
            description: 'Multi-family high-rise housing towers with post-tensioned slabs, shear wall systems, and seismic-resilient engineering.',
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 2,
          },
          {
            title: 'Other Residential Buildings',
            description: 'Townships, row houses, and community residential developments engineered for longevity and tropical weather resilience.',
            image: '/images/client_hero.webp',
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
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 1,
          },
          {
            title: 'Hospitals',
            description: 'Specialized healthcare facilities engineered for heavy medical equipment vibration damping, cleanroom HVAC integration, and uninterrupted utility services.',
            image: '/images/client_infrastructure.webp',
            isActive: true,
            order: 2,
          },
          {
            title: 'Industrial Buildings and Facilities',
            description: 'Pre-Engineered Buildings (PEB), heavy manufacturing bays, clear-span warehouses, and laser-screed FM2 superflat industrial floors.',
            image: '/images/client_industrial.webp',
            isActive: true,
            order: 3,
          },
          {
            title: 'Other Institutional Projects',
            description: 'Government administrative complexes, judiciary annexes, and civic public utility facilities adhering to CPWD norms.',
            image: '/images/client_hero.webp',
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
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 1,
          },
          {
            title: 'Other Commercial Buildings and Facilities',
            description: 'Corporate office towers, business parks, IT incubators, and hospitality centers with modern facade and MEP integration.',
            image: '/images/client_coastal.webp',
            isActive: true,
            order: 2,
          },
        ],
      },
    ],
  },
  {
    slug: 'building-repair-maintenance',
    title: 'Building Repair and Maintenance',
    category: 'building-repair-maintenance',
    order: 2,
    shortDescription: 'End-to-end structural retrofitting, non-destructive rehabilitation, waterproofing, and institutional AMC management.',
    description: 'Comprehensive civil rehabilitation, non-destructive structural diagnostics, specialized waterproofing, and routine asset longevity maintenance for residential, commercial, and industrial facilities across Odisha, Andaman, and Kolkata sectors.',
    image: '/images/client_rebar.webp',
    benefits: [
      'CPWD / IS 15988 seismic & structural retrofitting compliance',
      'Rapid response SLA under 24 hours for emergency repairs',
      'Up to 10-year warranty on elastomeric & injection waterproofing',
      'Zero Lost Time Injury (LTI) safety compliance record',
    ],
    features: [
      'Non-destructive testing (NDT) & Ultrasonic Pulse Velocity audits',
      'Carbon Fiber Reinforced Polymer (CFRP) structural wrapping',
      'Pressure injection epoxy grouting for foundation and slab cracks',
      'Multi-tier facility Annual Maintenance Contracts (AMC)',
    ],
    isActive: true,
    sections: [
      {
        title: 'Specialized Maintenance Modules',
        description: 'Dedicated multidisciplinary teams deployed with calibrated instrumentation, safety gear, and industrial-grade compounds.',
        order: 1,
        services: [
          {
            title: 'Annual Maintenance Contract (AMC)',
            description: 'Preventive structured care, routine moisture inspections, joint sealant re-checks, and scheduled maintenance schedules for commercial campuses and housing societies.',
            image: '/images/client_hero.webp',
            isActive: true,
            order: 1,
          },
          {
            title: 'Fabrication Work',
            description: 'Custom heavy structural steel framing, MS & SS architectural staircases, protective canopy fabrications, and industrial pipe rack installations.',
            image: '/images/client_industrial.webp',
            isActive: true,
            order: 2,
          },
          {
            title: 'Waterproofing and Leakage Repair',
            description: 'Negative-side crystalline waterproofing, polyurethane pressure grouting, elastomeric terrace coatings, and basement hydrostatic relief systems.',
            image: '/images/client_coastal.webp',
            isActive: true,
            order: 3,
          },
          {
            title: 'Painting',
            description: 'Anti-fungal, UV-resilient exterior elastomeric paints, acoustic baffle interior finishes, and textured protective coatings.',
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 4,
          },
          {
            title: 'Masonry Work',
            description: 'Load-bearing and partition brickwork, autoclaved aerated concrete (AAC) block masonry, repointing of historic stone joints, and boundary wall fortifications.',
            image: '/images/client_residential.webp',
            isActive: true,
            order: 5,
          },
          {
            title: 'Electrical Work',
            description: 'Substation setups, HT/LT cable laying, distribution panel overhauls, earthing grid certifications, and energy-efficient LED conversion retrofits.',
            image: '/images/client_infrastructure.webp',
            isActive: true,
            order: 6,
          },
          {
            title: 'Plumbing Work',
            description: 'Hydro-pneumatic pumping networks, CPVC/UPVC water distribution lines, sewage stack replacements, rainwater harvesting, and interceptor chamber overhauls.',
            image: '/images/client_rebar.webp',
            isActive: true,
            order: 7,
          },
          {
            title: 'Other Repair and Maintenance Services',
            description: 'Tailored micro-repairs including tile re-grouting, spall patch-work, de-laminated floor realignments, and rapid-response emergency water damage mitigations.',
            image: '/images/client_industrial.webp',
            isActive: true,
            order: 8,
          },
        ],
      },
    ],
  },
  {
    slug: 'design-planning',
    title: 'Design and Planning',
    category: 'design-planning',
    order: 3,
    shortDescription: 'Complete architectural drafting, structural engineering calculations, 3D visualizations, and BIM walkthrough coordination.',
    description: 'Holistic architectural conceptualization, structural analysis per Indian & international design codes, high-fidelity 3D modeling, and comprehensive clash-free pre-construction documentation.',
    image: '/images/client_commercial.webp',
    benefits: [
      'LOD 400 Building Information Modeling (BIM)',
      'STAAD Pro & ETABS finite element seismic modeling',
      'Clash detection before site ground breaking',
      'Statutory sanction drawing packages approved by municipal authorities',
    ],
    features: [
      'Comprehensive architectural blueprinting and space planning',
      'Photorealistic 3D external and interior rendering',
      'Cinematic 4K camera walkthroughs',
      'Good-for-Construction (GFC) structural details',
    ],
    isActive: true,
    sections: [
      {
        title: 'Architectural & Structural Design Solutions',
        description: 'Integrated drafting, spatial planning, and advanced computer-aided engineering modeling.',
        order: 1,
        services: [
          {
            title: 'Building Design',
            description: 'Complete architectural planning, functional layout optimization, statutory sanction drawings, and sustainable passive bioclimatic design.',
            image: '/images/client_residential.webp',
            isActive: true,
            order: 1,
          },
          {
            title: '3D Visualization',
            description: 'Photorealistic exterior and interior architectural renderings, material texture mapping, and daylight simulation studies.',
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 2,
          },
          {
            title: '3D Camera Walkthrough',
            description: 'Cinematic 4K virtual tours, immersive space walkthroughs, and interactive client presentation experiences before ground-breaking.',
            image: '/images/client_hero.webp',
            isActive: true,
            order: 3,
          },
          {
            title: 'Structural Design',
            description: 'STAAD Pro and ETABS structural analysis, seismic ductile detailing per IS 13920, and precision Good-For-Construction (GFC) engineering blueprints.',
            image: '/images/client_rebar.webp',
            isActive: true,
            order: 4,
          },
        ],
      },
    ],
  },
  {
    slug: 'interior-exterior-solutions',
    title: 'Interior and Exterior Solutions',
    category: 'interior-exterior-solutions',
    order: 4,
    shortDescription: 'Architectural facade engineering, high-durability exterior cladding, false ceiling systems, and bespoke corporate interior fit-outs.',
    description: 'Complete turnkey execution of interior spaces, modern facade systems, and architectural envelopes blending aesthetic elegance with industrial durability.',
    image: '/images/client_commercial.webp',
    benefits: [
      'Class A materials and fire-retardant certifications',
      'Turnkey handover including electrical, acoustic, and HVAC integration',
      'Weather-resistant exterior cladding engineered for coastal salinity',
      'Customized furniture manufacturing with long-term warranties',
    ],
    features: [
      'Turnkey corporate and residential fit-outs',
      'Acoustic ceiling and fluted wall panel systems',
      'High-Pressure Laminate (HPL) & ACP exterior facades',
      'Bespoke commercial and hospitality furniture fabrication',
    ],
    isActive: true,
    sections: [
      {
        title: 'Interior & Exterior Execution Capabilities',
        description: 'High-durability finishes, bespoke furnishings, and climate-resistant building envelopes.',
        order: 1,
        services: [
          {
            title: 'Interior Design and Execution',
            description: 'End-to-end turnkey corporate office, retail, and luxury residential interior execution with coordinated MEP and acoustic engineering.',
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 1,
          },
          {
            title: 'False Ceiling and Ceiling Work',
            description: 'Gypsum plasterboard, modular acoustic tiles, metal baffle systems, and concealed ambient LED lighting integrations.',
            image: '/images/client_residential.webp',
            isActive: true,
            order: 2,
          },
          {
            title: 'Furnishing',
            description: 'Tailored space furnishing, ergonomic workstation layouts, modular cabinetry, and premium custom woodwork.',
            image: '/images/client_hero.webp',
            isActive: true,
            order: 3,
          },
          {
            title: 'Wall Cladding',
            description: 'Interior stone veneers, acoustic timber panels, fluted decorative wall panels, and moisture-resistant tile cladding.',
            image: '/images/client_commercial.webp',
            isActive: true,
            order: 4,
          },
          {
            title: 'Exterior Cladding',
            description: 'High-pressure laminate (HPL), fiber cement boards, ACP panels, and terracotta rainscreen cladding systems.',
            image: '/images/client_infrastructure.webp',
            isActive: true,
            order: 5,
          },
          {
            title: 'Facade Renovation and Face-Lifting',
            description: 'Structural glazing, curtain wall modernization, exterior structural louvers, and aesthetic architectural building transformations.',
            image: '/images/client_coastal.webp',
            isActive: true,
            order: 6,
          },
          {
            title: 'Furniture and Furnishing Solutions (Sofas, Mattresses, etc.)',
            description: 'Custom executive sofas, ergonomic commercial seating, contract hospitality bedding, mattresses, and soft furnishings.',
            image: '/images/client_residential.webp',
            isActive: true,
            order: 7,
          },
        ],
      },
    ],
  },
  {
    slug: 'project-management-consultancy',
    title: 'Project Management Consultancy (PMC)',
    category: 'project-management-consultancy',
    order: 5,
    shortDescription: 'Comprehensive site governance, tender preparation, quality assurance supervision, and statutory liaison for large civil undertakings.',
    description: 'Chartered Engineer-led project management consultancy providing rigorous quality control, schedule acceleration, cost auditing, contractor governance, and statutory certification across all construction lifecycle stages.',
    image: '/images/client_rebar.webp',
    benefits: [
      'Chartered Engineer oversight on every critical milestone',
      'FIDIC & CPWD contract governance and dispute mitigation',
      'Independent BOQ reconciliation preventing billing inflation',
      'On-site laboratory testing supervision for concrete and steel',
    ],
    features: [
      'Critical Path Method (CPM) project scheduling and resource leveling',
      'Detailed contractor pre-qualification and tender documentation',
      'Milestone-linked bill verification and technical audits',
      'Statutory compliance and occupancy certificate coordination',
    ],
    isActive: true,
    sections: [
      {
        title: 'Advisory & Execution Governance',
        description: 'Independent third-party technical oversight ensuring transparent billing, zero-defect execution, and timeline compliance.',
        order: 1,
        services: [
          {
            title: 'Project Management and Consultancy Services',
            description: 'Critical path scheduling (CPM), BOQ reconciliation, vendor procurement governance, on-site QA/QC laboratory supervision, and chartered engineer milestone certifications.',
            image: '/images/client_rebar.webp',
            isActive: true,
            order: 1,
          },
        ],
      },
    ],
  },
  {
    slug: 'additional-services-platform-features',
    title: 'Additional Services and Platform Features',
    category: 'additional-services-platform-features',
    order: 6,
    shortDescription: 'Modular and specialized technical capabilities, emerging engineering integrations, and proprietary digital platform services.',
    description: 'Modular and specialized technical capabilities, emerging engineering integrations, and proprietary digital platform services engineered to streamline civil project tracking and technical compliance.',
    image: '/images/client_industrial.webp',
    benefits: [
      'Modular prefabrication reducing site build timelines by up to 35%',
      'Real-time cloud dashboard for tracking progress and inspection records',
      'NABL-accredited diagnostic laboratory testing for specialized audits',
      'Scalable enterprise integrations for corporate asset managers',
    ],
    features: [
      'Off-site prefabrication and modular volumetric construction',
      'Proprietary digital client portal with drone-assisted site logs',
      'Specialized non-destructive structural diagnostics & testing',
      'Custom technical engineering consultations',
    ],
    isActive: true,
    sections: [
      {
        title: 'Specialized Capabilities & Digital Features',
        description: 'Innovative construction methodologies and real-time project management digital tools.',
        order: 1,
        services: [
          {
            title: 'Modular Construction Solutions',
            description: 'Off-site prefabricated volumetric modules, quick-assembly structural units, and temporary site office infrastructures.',
            image: '/images/client_industrial.webp',
            isActive: true,
            order: 1,
          },
          {
            title: 'Proprietary Digital Platform Integration',
            description: 'Cloud-based client portal for live site progress tracking, drone surveillance feeds, automated BOQ reconciliation, and digital QA sign-offs.',
            image: '/images/client_hero.webp',
            isActive: true,
            order: 2,
          },
          {
            title: 'Specialized Site Testing & Technical Audits',
            description: 'Ultrasonic Pulse Velocity (UPV), concrete core extraction, soil bearing capacity plate load tests, and statutory structural fitness certificates.',
            image: '/images/client_infrastructure.webp',
            isActive: true,
            order: 3,
          },
        ],
      },
    ],
  },
];

async function seed() {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error('MONGO_URI is missing from environment.');
      process.exit(1);
    }
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    for (const s of SEED_SERVICES) {
      const existing = await Service.findOne({ slug: s.slug });
      if (existing) {
        console.log(`Updating existing service: ${s.title} (${s.slug})`);
        await Service.findByIdAndUpdate(existing._id, s, { runValidators: true });
      } else {
        console.log(`Creating new service: ${s.title} (${s.slug})`);
        await Service.create(s);
      }
    }

    console.log('✅ Services seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
