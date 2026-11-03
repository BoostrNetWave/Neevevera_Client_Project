import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import DsrItem from '../src/models/DsrItem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * UNVERIFIED DEVELOPMENT FIXTURES (26 Items)
 * WARNING: These items are development fixtures constructed from general civil engineering knowledge.
 * Source pages, base rates, and specifications have NOT been cross-checked against official
 * CPWD DSR 2023 Civil Volume 1 & 2 PDFs or state correction slips.
 * They MUST remain isVerified: false and MUST NOT be published or claimed as official CPWD rates
 * until an official PDF line-by-line audit is complete.
 */
export const SEED_DSR_ITEMS = [
  // ── 1. Finishing & Painting ──────────────────────────────────────────
  {
    itemNo: '13.43.1',
    category: 'Finishing & Painting',
    subhead: 'Interior Wall Painting',
    title: 'Acrylic Emulsion Paint (2+ Coats)',
    desc: 'Wall painting with premium acrylic emulsion paint of approved brand (Asian Paints Royale / Berger Silk or equivalent) having VOC content less than 50 gm/litre: Two or more coats on new surface over primer.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 115.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 120–140 sq.ft per litre for 2 coats',
    keywords: ['painting', 'paint', 'emulsion', 'acrylic', 'interior', 'wall', 'royale', 'silk', 'color', 'colour', 'whitewash'],
    typicalBrands: 'Asian Paints Royale, Berger Silk Luxury, Dulux Velvet Touch',
    order: 1,
  },
  {
    itemNo: '13.90.1',
    category: 'Finishing & Painting',
    subhead: 'Exterior Weatherproof Painting',
    title: 'Exterior 100% Acrylic Anti-Fungal Paint (Apex / Weathercoat)',
    desc: 'Finishing exterior walls with 100% acrylic exterior anti-fungal emulsion paint of approved brand: Two or more coats applied @ 1.43 ltr/10 sqm over priming coat of exterior primer.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 165.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 55–65 sq.ft per litre for 2 coats with primer',
    keywords: ['painting', 'paint', 'exterior', 'weathercoat', 'apex', 'anti-fungal', 'waterproof paint', 'facade'],
    typicalBrands: 'Asian Paints Apex Ultima, Berger WeatherCoat Long Life, Dulux Weathershield',
    order: 2,
  },
  {
    itemNo: '13.80.1',
    category: 'Finishing & Painting',
    subhead: 'Wall Surface Preparation',
    title: 'White Cement Based Wall Putty (Avg. 1.5mm Thickness)',
    desc: 'Providing and applying white cement based putty of average thickness 1.5 mm of approved brand over plastered wall surface to prepare the surface smooth before painting.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 85.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 12–15 sq.ft per kg for 1.5mm thickness',
    keywords: ['putty', 'patti', 'birla', 'jk', 'wall putty', 'smoothing', 'base', 'painting'],
    typicalBrands: 'Birla White WallSeal, JK Cement WhiteMaxX',
    order: 3,
  },
  {
    itemNo: '13.41.1',
    category: 'Finishing & Painting',
    subhead: 'Wall Priming',
    title: 'Water Thinnable Cement Primer (1 Coat)',
    desc: 'Applying one coat of water thinnable cement primer of approved brand on wall surface for interior plaster surfaces.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 48.50,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 100–120 sq.ft per litre per coat',
    keywords: ['primer', 'priming', 'base coat', 'painting', 'undercoat'],
    typicalBrands: 'Asian Paints Decoprime, Berger BP White Primer',
    order: 4,
  },
  {
    itemNo: '13.44.1',
    category: 'Finishing & Painting',
    subhead: 'Distemper',
    title: 'Washable Acrylic Distemper (Economic Painting)',
    desc: 'Distempering with 1st quality acrylic washable distemper of approved manufacturer and shade: Two or more coats on new work.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 65.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 90–100 sq.ft per kg for 2 coats',
    keywords: ['distemper', 'distempering', 'budget painting', 'paint', 'economic'],
    typicalBrands: 'Asian Paints Tractor Distemper, Berger Bison',
    order: 5,
  },
  {
    itemNo: '13.60.1',
    category: 'Finishing & Painting',
    subhead: 'Wood & Steel Enamel',
    title: 'Synthetic Enamel Paint on Metal/Wood (2+ Coats)',
    desc: 'Painting with synthetic enamel paint of approved brand to give an even shade: Two or more coats on new work including primer for steel gates, grills, and woodwork.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 135.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 90–110 sq.ft per litre for 2 coats',
    keywords: ['enamel', 'oil paint', 'gloss', 'steel paint', 'grill painting', 'wood painting', 'painting'],
    typicalBrands: 'Asian Paints Apcolite, Berger Luxol High Gloss',
    order: 6,
  },
  {
    itemNo: '13.95.1',
    category: 'Finishing & Painting',
    subhead: 'Industrial & Floor Coatings',
    title: 'Heavy Duty Epoxy Floor Paint (2mm Self-Leveling)',
    desc: 'Providing and laying self-leveling solvent-free epoxy resin floor topping of 2 mm nominal thickness, high abrasion resistance for workshops, basements, and commercial floors.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 780.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: '2 mm solid resin build',
    keywords: ['epoxy', 'floor painting', 'industrial coating', 'basement flooring', 'painting'],
    typicalBrands: 'Fosroc Nitoflor, Sika Floor-264',
    order: 7,
  },

  // ── 2. Concrete & RCC Work ──────────────────────────────────────────
  {
    itemNo: '4.1.3',
    category: 'Concrete & RCC Work',
    subhead: 'Structural Concrete',
    title: 'RCC M20 Grade (1:1.5:3) for Slabs, Beams & Columns',
    desc: 'Providing and laying in position specified grade of reinforced cement concrete (1:1.5:3) in suspended floors, roofs, landings, balconies, beams, and columns.',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 6850.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 8.5 to 9.5 bags cement per m³',
    keywords: ['concrete', 'rcc', 'slab', 'beam', 'column', 'm20', 'roof casting', 'casting'],
    typicalBrands: 'Ultratech, ACC, Dalmia Cement with tested river sand & blue metal',
    order: 8,
  },
  {
    itemNo: '4.1.5',
    category: 'Concrete & RCC Work',
    subhead: 'High Strength Concrete',
    title: 'RCC M25 Grade Design Mix for Heavy Load Columns & Footings',
    desc: 'Providing and laying design mix reinforced cement concrete M25 in columns, raft foundations, and shear walls with automatic batching plant concrete.',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 7450.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'High compressive strength grade IS 456 compliant',
    keywords: ['concrete', 'rcc', 'm25', 'design mix', 'columns', 'raft foundation'],
    typicalBrands: 'Ultratech RMC / ACC Ready Mix',
    order: 9,
  },
  {
    itemNo: '4.1.8',
    category: 'Concrete & RCC Work',
    subhead: 'Foundation PCC',
    title: 'Plain Cement Concrete (PCC 1:4:8) for Foundation Bedding',
    desc: 'Providing and laying plain cement concrete 1:4:8 (1 cement : 4 coarse sand : 8 stone aggregate 40mm) in foundation beds and under plinth beams.',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 4950.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Under-footing moisture barrier & levelling',
    keywords: ['pcc', 'plain concrete', 'bedding', 'footing base', 'foundation concrete'],
    typicalBrands: 'Standard 43/53 grade OPC/PPC',
    order: 10,
  },
  {
    itemNo: '5.9.1',
    category: 'Concrete & RCC Work',
    subhead: 'Formwork / Shuttering',
    title: 'Centering & Shuttering for RCC Slabs, Beams & Columns',
    desc: 'Centering and shuttering including strutting, propping, bracing up to 4.5m height and removal of formwork for suspended floors, roofs, and columns.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 480.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Formwork contact area',
    keywords: ['shuttering', 'centering', 'formwork', 'slab shuttering', 'scaffolding'],
    typicalBrands: 'IS 4990 Marine Film Faced Shuttering Ply / MS Plates',
    order: 11,
  },

  // ── 3. Reinforcement Steel ──────────────────────────────────────────
  {
    itemNo: '5.22.6',
    category: 'Reinforcement Steel',
    subhead: 'TMT Reinforcement Bars',
    title: 'TMT Bar Fe-500D / Fe-550D Cutting, Bending & Placing',
    desc: 'Steel reinforcement for R.C.C. work including straightening, cutting, bending, placing in position, and binding complete: Thermo-Mechanically Treated bars Fe-500D / Fe-550D.',
    unit: 'kg',
    unitLabel: 'Kilogram (kg)',
    sqftFactor: 1,
    baseRate: 78.50,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 3.5–4.5 kg per sq.ft of built-up residential slab',
    keywords: ['steel', 'tmt', 'saria', 'iron rod', 'reinforcement', 'fe500', 'fe550', 'rebar', 'binding wire'],
    typicalBrands: 'Tata Tiscon, JSW Neosteel, SAIL, Jindal Panther',
    order: 12,
  },

  // ── 4. Brickwork & Masonry ──────────────────────────────────────────
  {
    itemNo: '6.1.1',
    category: 'Brickwork & Masonry',
    subhead: 'Red Brick Masonry',
    title: 'Burnt Clay Brickwork in Cement Mortar 1:6 in Superstructure',
    desc: 'Brick work with common burnt clay bricks of class 7.5 in superstructure in cement mortar 1:6 (1 cement : 6 coarse sand).',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 5420.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Approx. 500 standard red bricks per m³',
    keywords: ['brick', 'brickwork', 'masonry', 'wall', 'red brick', 'cement mortar', 'eent'],
    typicalBrands: 'Kiln burnt class 7.5 non-modular clay bricks',
    order: 13,
  },
  {
    itemNo: '6.25.1',
    category: 'Brickwork & Masonry',
    subhead: 'AAC Block Masonry',
    title: 'Autoclaved Aerated Concrete (AAC) Block Masonry 200mm',
    desc: 'Providing and laying Autoclaved Aerated Concrete (AAC) block masonry with 200mm/150mm thick blocks using thin bed polymer block jointing mortar.',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 4680.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'High thermal insulation, 60% lighter than red bricks',
    keywords: ['aac', 'block', 'siporex', 'fly ash block', 'lightweight wall', 'masonry'],
    typicalBrands: 'Ultratech Xtralite, Magicrete, Godrej Renova',
    order: 14,
  },
  {
    itemNo: '13.1.2',
    category: 'Finishing & Painting',
    subhead: 'Plastering',
    title: 'Cement Plaster 12mm Thick (1:6) on Internal Walls',
    desc: '12 mm cement plaster of mix: 1:6 (1 cement : 6 fine sand) on interior brick/concrete wall surface finished smooth.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 195.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Internal room wall surface',
    keywords: ['plaster', 'plastering', 'internal plaster', 'cement plaster', 'chhan'],
    typicalBrands: 'Screened river sand / M-sand with Grade 43 cement',
    order: 15,
  },
  {
    itemNo: '13.2.1',
    category: 'Finishing & Painting',
    subhead: 'Plastering',
    title: 'Exterior Cement Plaster 20mm Thick (1:4) with Waterproofing',
    desc: '20 mm cement plaster of mix: 1:4 including integral waterproofing admixture applied on exterior walls in two coats.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 285.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'External weatherproof envelope',
    keywords: ['plaster', 'exterior plaster', 'waterproof plaster', 'sand face plaster'],
    typicalBrands: 'Coarse river sand with integral Dr. Fixit LW+',
    order: 16,
  },

  // ── 5. Flooring & Tiling ──────────────────────────────────────────
  {
    itemNo: '11.36.1',
    category: 'Flooring & Tiling',
    subhead: 'Vitrified Tiles',
    title: 'Premium Glazed Vitrified Tiles (GVT) 600x600mm / 800x800mm',
    desc: 'Providing and laying polished vitrified floor tiles with water absorption <0.08%, laid on 20mm thick cement mortar 1:4 with polymer adhesive bed and epoxy grout.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 980.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Interior living, bedrooms, and commercial lobbies',
    keywords: ['tile', 'tiling', 'vitrified', 'floor tile', 'gvt', 'marbonite', 'flooring'],
    typicalBrands: 'Kajaria, Somany, Nitco, Simpolo',
    order: 17,
  },
  {
    itemNo: '11.41.2',
    category: 'Flooring & Tiling',
    subhead: 'Granite Stone',
    title: 'Jet Black Granite Stone 18mm for Kitchen Counters & Stairs',
    desc: 'Providing and fixing 18 mm thick mirror polished granite stone slab in kitchen countertops and stair treads/risers laid over cement mortar 1:4 including edge moulding.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 1850.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Kitchen platform, counter, treads, thresholds',
    keywords: ['granite', 'stone', 'countertop', 'kitchen platform', 'staircase', 'black granite'],
    typicalBrands: 'First quality South Indian Jet Black / Hassan Green',
    order: 18,
  },
  {
    itemNo: '11.37.1',
    category: 'Flooring & Tiling',
    subhead: 'Bathroom & Anti-Skid Tiles',
    title: 'Ceramic Anti-Skid Floor Tiles 300x300mm for Bathrooms',
    desc: 'Providing and laying ceramic glazed anti-skid floor tiles in toilets, balconies, and utility wash areas on 20mm cement mortar 1:4 including waterproof jointing.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 680.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Wet areas, toilet flooring, verandas',
    keywords: ['anti-skid', 'bathroom tile', 'toilet flooring', 'ceramic tile', 'tiling'],
    typicalBrands: 'Kajaria Anti-Skid, Johnson, Somany',
    order: 19,
  },

  // ── 6. Earthwork & Excavation ──────────────────────────────────────────
  {
    itemNo: '2.8.1',
    category: 'Earthwork & Excavation',
    subhead: 'Foundation Excavation',
    title: 'Earth Work in Excavation for Foundation Trenches (Up to 1.5m)',
    desc: 'Earth work in excavation by mechanical/manual means in foundation trenches or drains not exceeding 1.5 m depth in ordinary soil including dressing of sides.',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 265.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Footing trenches & basement pits',
    keywords: ['excavation', 'earthwork', 'trench', 'digging', 'soil work', 'jcb', 'foundation trench'],
    typicalBrands: 'Mechanical excavator / JCB 3DX with depth control',
    order: 20,
  },
  {
    itemNo: '2.25.1',
    category: 'Earthwork & Excavation',
    subhead: 'Plinth Sand Filling',
    title: 'Filling Plinth & Foundations with River Sand (Watered & Rammed)',
    desc: 'Filling available clean river sand in plinth, trenches, and foundation sides in layers not exceeding 20cm in depth, consolidating by ramming and watering.',
    unit: 'cum',
    unitLabel: 'Cubic Meter (m³)',
    sqftFactor: 35.315,
    baseRate: 1150.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Plinth settlement prevention and moisture barrier',
    keywords: ['sand filling', 'plinth filling', 'backfilling', 'sand', 'compaction'],
    typicalBrands: 'Washed river sand free from silt and organic debris',
    order: 21,
  },

  // ── 7. Waterproofing & Roofing ──────────────────────────────────────────
  {
    itemNo: '22.1.1',
    category: 'Waterproofing & Roofing',
    subhead: 'Terrace Waterproofing',
    title: 'Brick Bat Coba Integral Waterproofing for Terraces (115mm Thick)',
    desc: 'Providing and laying integral cement based water proofing treatment including laying 115mm average thickness brick bats soaked in water and grouted with cement slurry.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 790.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Terrace roof, slope to drainage spout, 10-year waterproofing guarantee',
    keywords: ['waterproofing', 'terrace', 'brick bat coba', 'roof leak', 'damp proof', 'seepage'],
    typicalBrands: 'Dr. Fixit Pidiproof, Fosroc Conplast WP',
    order: 22,
  },
  {
    itemNo: '22.14.1',
    category: 'Waterproofing & Roofing',
    subhead: 'Basement & Retaining Walls',
    title: 'APP Polymer Modified Bituminous Membrane (3mm Thick)',
    desc: 'Providing and laying 3mm thick Atactic Polypropylene (APP) modified polymeric membrane reinforced with non-woven polyester mat, torch-applied over primer.',
    unit: 'sqm',
    unitLabel: 'Square Meter (m²)',
    sqftFactor: 10.764,
    baseRate: 520.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Underground basements, podiums, and water retainers',
    keywords: ['membrane', 'app membrane', 'bituminous', 'basement waterproofing', 'torch applied'],
    typicalBrands: 'STP Superlay, Dr. Fixit Torchshield',
    order: 23,
  },

  // ── 8. Structural Steel & Fabrication ──────────────────────────────────
  {
    itemNo: '10.2.1',
    category: 'Structural Steel & Fabrication',
    subhead: 'Trusses & Girders',
    title: 'Structural Steel Work (Trusses, Columns, Purlins) Welded/Bolted',
    desc: 'Structural steel work in single section, built up sections, trusses and framed work, including cutting, hoisting, fixing in position and priming coat.',
    unit: 'kg',
    unitLabel: 'Kilogram (kg)',
    sqftFactor: 1,
    baseRate: 98.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Industrial sheds, warehouse roofs, structural mezzanines',
    keywords: ['structural steel', 'truss', 'peb', 'fabrication', 'welding', 'iron work', 'purlin'],
    typicalBrands: 'SAIL / Tata Steel IS 2062 Grade E250',
    order: 24,
  },

  // ── 9. Plumbing & Drainage ──────────────────────────────────────────
  {
    itemNo: '18.7.1',
    category: 'Plumbing & Drainage',
    subhead: 'Concealed Water Supply',
    title: 'CPVC Water Supply Piping (25mm OD) Concealed in Wall',
    desc: 'Providing and fixing Chlorinated Polyvinyl Chloride (CPVC) pipe lines SDR 11, for hot & cold water supply, including chases cutting in wall and pressure testing.',
    unit: 'metre',
    unitLabel: 'Running Metre (Rmt)',
    sqftFactor: 3.281,
    baseRate: 345.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: 'Concealed bathroom and kitchen water line',
    keywords: ['cpvc', 'pipe', 'plumbing', 'water line', 'pipe fitting', 'water supply'],
    typicalBrands: 'Astral, Ashirvad, Supreme SDR 11',
    order: 25,
  },

  // ── 10. Electrical & Conduits ──────────────────────────────────────────
  {
    itemNo: '19.1.1',
    category: 'Electrical & Conduits',
    subhead: 'Concealed Point Wiring',
    title: 'Modular Electrical Point Wiring in Concealed PVC Conduit',
    desc: 'Wiring for light / fan / exhaust point with 1.5 sq.mm FRLS PVC insulated copper conductor single core cable in recessed PVC conduit with modular switch & plate.',
    unit: 'point',
    unitLabel: 'Per Point',
    sqftFactor: 1,
    baseRate: 850.00,
    markupPercent: 18,
    costIndex: 100,
    coverage: '1 complete lighting or appliance point',
    keywords: ['electrical', 'wiring', 'point wiring', 'switch', 'light point', 'copper wire'],
    typicalBrands: 'Havells, Polycab FRLS, Schneider / Legrand Modular',
    order: 26,
  },
];

async function seedDsrRates() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/neevevera';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    console.log(`Seeding ${SEED_DSR_ITEMS.length} development fixture items (isVerified: false — unverified development fixture, pending CPWD DSR 2023 cross-check)...`);

    let upsertedCount = 0;
    let skippedVerifiedCount = 0;
    let skippedOverridesCount = 0;

    for (const itemData of SEED_DSR_ITEMS) {
      const minLoad = 15;
      const maxLoad = 20;
      const costIdx = itemData.costIndex || 100;
      const factor = itemData.sqftFactor || 1;

      const low = Math.round(itemData.baseRate * (1 + minLoad / 100) * (costIdx / 100) * 100) / 100;
      const high = Math.round(itemData.baseRate * (1 + maxLoad / 100) * (costIdx / 100) * 100) / 100;
      const lowSqft = Math.round((low / factor) * 100) / 100;
      const highSqft = Math.round((high / factor) * 100) / 100;

      const isAddOn = /extra for|add for|additional/i.test(`${itemData.title} ${itemData.desc}`);

      // Protection: Do not overwrite verified items or audited overrides
      const existing = await DsrItem.findOne({ itemNo: itemData.itemNo });
      if (existing) {
        if (existing.isVerified) {
          skippedVerifiedCount++;
          console.log(`[PROTECTED] Item ${itemData.itemNo} is officially verified. Skipping overwrite.`);
          continue;
        }
        if (existing.overrides && existing.overrides.length > 0) {
          skippedOverridesCount++;
          console.log(`[PROTECTED] Item ${itemData.itemNo} has custom audited overrides. Skipping overwrite.`);
          continue;
        }
      }

      // Upsert unverified fixture
      await DsrItem.findOneAndUpdate(
        { itemNo: itemData.itemNo },
        {
          ...itemData,
          loadingMin: minLoad,
          loadingMax: maxLoad,
          clientRateMin: low,
          clientRateMax: high,
          clientRateSqftMin: lowSqft,
          clientRateSqftMax: highSqft,
          clientRate: high,
          clientRateSqft: highSqft,
          isAddOn,
          isVerified: false, // Remains unverified fixture pending CPWD DSR 2023 audit
          isActive: true,
        },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );
      upsertedCount++;
    }

    console.log(`✅ Upserted ${upsertedCount} unverified fixture items into MongoDB (${skippedVerifiedCount} verified skipped, ${skippedOverridesCount} overrides preserved).`);

  } catch (err) {
    console.error('❌ Failed to seed DSR rates:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
}

if (process.argv[1] && (process.argv[1].endsWith('seed-dsr-2023.js') || process.argv[1].includes('seed-dsr-2023'))) {
  seedDsrRates();
}
