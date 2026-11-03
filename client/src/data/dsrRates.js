/**
 * dsrRates.js — Official CPWD Delhi Schedule of Rates (DSR) Dataset
 * Verified rate schedule for civil engineering, structural works, and finishing.
 * Pre-calibrated with Neevevera's approved 15%–20% contractor margin loading.
 */

export const DSR_CATEGORIES = [
  "All Categories",
  "Finishing & Painting",
  "Concrete & RCC Work",
  "Reinforcement Steel",
  "Brickwork & Masonry",
  "Earthwork & Excavation",
  "Flooring & Tiling",
  "Waterproofing & Roofing",
  "Structural Steel & Fabrication",
  "Plumbing & Drainage",
  "Electrical & Conduits"
];

export const DSR_ITEMS = [
  {
    "itemNo": "13.43.1",
    "category": "Finishing & Painting",
    "subhead": "Interior Wall Painting",
    "title": "Acrylic Emulsion Paint (2+ Coats)",
    "desc": "Wall painting with premium acrylic emulsion paint of approved brand having VOC content less than 50 gm/litre: Two or more coats on new surface over primer",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 130.08,
    "rateSqft": 12.08,
    "rateRange": {
      "min": 124.66,
      "max": 130.08
    },
    "rateSqftRange": {
      "min": 11.58,
      "max": 12.08
    },
    "coverage": "Approx. 120-140 sq.ft per litre for 2 coats",
    "keywords": [
      "painting",
      "paiting",
      "paint",
      "emulsion",
      "acrylic",
      "interior",
      "wall",
      "royale",
      "silk",
      "color",
      "colour",
      "whitewash"
    ],
    "typicalBrands": "Asian Paints Royale / Berger Silk / Dulux Velvet Touch"
  },
  {
    "itemNo": "13.90.1",
    "category": "Finishing & Painting",
    "subhead": "Exterior Weatherproof Painting",
    "title": "Exterior 100% Acrylic Anti-Fungal Paint",
    "desc": "Finishing exterior walls with 100% acrylic exterior anti-fungal emulsion paint of approved brand: Two or more coats applied @ 1.43 ltr/10 sqm over priming coat",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 185.1,
    "rateSqft": 17.2,
    "rateRange": {
      "min": 177.39,
      "max": 185.1
    },
    "rateSqftRange": {
      "min": 16.48,
      "max": 17.2
    },
    "coverage": "Approx. 55-65 sq.ft per litre for 2 coats with primer",
    "keywords": [
      "painting",
      "paiting",
      "paint",
      "exterior",
      "weathercoat",
      "apex",
      "anti-fungal",
      "waterproof paint",
      "facade"
    ],
    "typicalBrands": "Asian Paints Apex Ultima / Berger WeatherCoat Long Life"
  },
  {
    "itemNo": "13.80.1",
    "category": "Finishing & Painting",
    "subhead": "Wall Surface Preparation",
    "title": "White Cement Based Wall Putty (Avg. 1.5mm Thickness)",
    "desc": "Providing and applying white cement based putty of average thickness 1.5 mm of approved brand over plastered wall surface to prepare the surface smooth",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 107.04,
    "rateSqft": 9.94,
    "rateRange": {
      "min": 102.58,
      "max": 107.04
    },
    "rateSqftRange": {
      "min": 9.53,
      "max": 9.94
    },
    "coverage": "Approx. 12-15 sq.ft per kg for 1.5mm thickness",
    "keywords": [
      "putty",
      "patti",
      "birla",
      "jk",
      "wall putty",
      "smoothing",
      "base",
      "painting",
      "paiting"
    ],
    "typicalBrands": "Birla White WallSeal / JK Cement WhiteMaxX"
  },
  {
    "itemNo": "13.41.1",
    "category": "Finishing & Painting",
    "subhead": "Wall Priming",
    "title": "Water Thinnable Cement Primer (1 Coat)",
    "desc": "Applying one coat of water thinnable cement primer of approved brand on wall surface for interior plaster surfaces",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 53.76,
    "rateSqft": 4.99,
    "rateRange": {
      "min": 51.52,
      "max": 53.76
    },
    "rateSqftRange": {
      "min": 4.79,
      "max": 4.99
    },
    "coverage": "Approx. 100-120 sq.ft per litre per coat",
    "keywords": [
      "primer",
      "priming",
      "base coat",
      "painting",
      "paiting",
      "undercoat"
    ],
    "typicalBrands": "Asian Paints Decoprime / Berger BP White Primer"
  },
  {
    "itemNo": "13.44.1",
    "category": "Finishing & Painting",
    "subhead": "Distemper",
    "title": "Washable Acrylic Distemper (Economic Painting)",
    "desc": "Distempering with 1st quality acrylic washable distemper of approved manufacturer and shade: Two or more coats on new work",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 74.58,
    "rateSqft": 6.93,
    "rateRange": {
      "min": 71.47,
      "max": 74.58
    },
    "rateSqftRange": {
      "min": 6.64,
      "max": 6.93
    },
    "coverage": "Approx. 90-100 sq.ft per kg for 2 coats",
    "keywords": [
      "distemper",
      "distempering",
      "budget painting",
      "paiting",
      "paint",
      "economic"
    ],
    "typicalBrands": "Asian Paints Tractor Distemper / Berger Bison"
  },
  {
    "itemNo": "13.60.1",
    "category": "Finishing & Painting",
    "subhead": "Wood & Steel Enamel",
    "title": "Synthetic Enamel Paint on Metal/Wood (2+ Coats)",
    "desc": "Painting with synthetic enamel paint of approved brand to give an even shade: Two or more coats on new work including primer for steel gates and grills",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 154.2,
    "rateSqft": 14.33,
    "rateRange": {
      "min": 147.77,
      "max": 154.2
    },
    "rateSqftRange": {
      "min": 13.73,
      "max": 14.33
    },
    "coverage": "Approx. 90-110 sq.ft per litre for 2 coats",
    "keywords": [
      "enamel",
      "oil paint",
      "gloss",
      "steel paint",
      "grill painting",
      "wood painting",
      "painting",
      "paiting"
    ],
    "typicalBrands": "Asian Paints Apcolite / Berger Luxol High Gloss"
  },
  {
    "itemNo": "13.95.1",
    "category": "Finishing & Painting",
    "subhead": "Industrial & Floor Coatings",
    "title": "Heavy Duty Epoxy Floor Paint (2mm Self-Leveling)",
    "desc": "Providing and laying self-leveling solvent-free epoxy resin floor topping of 2 mm nominal thickness high abrasion resistance for workshops and basements",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 900,
    "rateSqft": 83.61,
    "rateRange": {
      "min": 862.5,
      "max": 900
    },
    "rateSqftRange": {
      "min": 80.13,
      "max": 83.61
    },
    "coverage": "2 mm solid resin build",
    "keywords": [
      "epoxy",
      "floor painting",
      "industrial coating",
      "basement flooring",
      "painting",
      "paiting"
    ],
    "typicalBrands": "Fosroc Nitoflor / Sika Floor-264"
  },
  {
    "itemNo": "4.1.3",
    "category": "Concrete & RCC Work",
    "subhead": "Structural Concrete",
    "title": "RCC M20 Grade (1:1.5:3) for Slabs Beams & Columns",
    "desc": "Providing and laying in position specified grade of reinforced cement concrete (1:1.5:3) in suspended floors roofs landings balconies beams and columns",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 8904,
    "rateSqft": 252.13,
    "rateRange": {
      "min": 8533,
      "max": 8904
    },
    "rateSqftRange": {
      "min": 241.63,
      "max": 252.13
    },
    "coverage": "Approx. 8.5 to 9.5 bags cement per m³",
    "keywords": [
      "concrete",
      "rcc",
      "slab",
      "beam",
      "column",
      "m20",
      "roof casting",
      "casting"
    ],
    "typicalBrands": "Ultratech / ACC / Dalmia Cement with tested river sand"
  },
  {
    "itemNo": "4.1.5",
    "category": "Concrete & RCC Work",
    "subhead": "High Strength Concrete",
    "title": "RCC M25 Grade Design Mix for Heavy Load Columns",
    "desc": "Providing and laying design mix reinforced cement concrete M25 in columns raft foundations and shear walls with automatic batching plant concrete",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 9576,
    "rateSqft": 271.16,
    "rateRange": {
      "min": 9177,
      "max": 9576
    },
    "rateSqftRange": {
      "min": 259.86,
      "max": 271.16
    },
    "coverage": "High compressive strength grade IS 456 compliant",
    "keywords": [
      "4.1.5",
      "rcc m25 grade design mix for heavy load columns"
    ],
    "typicalBrands": "Ultratech RMC / ACC Ready Mix"
  },
  {
    "itemNo": "4.1.8",
    "category": "Concrete & RCC Work",
    "subhead": "Foundation PCC",
    "title": "Plain Cement Concrete (PCC 1:4:8) for Foundation Bedding",
    "desc": "Providing and laying plain cement concrete 1:4:8 (1 cement : 4 coarse sand : 8 stone aggregate 40mm) in foundation beds and under plinth beams",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 5778,
    "rateSqft": 163.61,
    "rateRange": {
      "min": 5537.25,
      "max": 5778
    },
    "rateSqftRange": {
      "min": 156.8,
      "max": 163.61
    },
    "coverage": "Under-footing moisture barrier and levelling",
    "keywords": [
      "pcc",
      "plain concrete",
      "bedding",
      "footing base",
      "foundation concrete"
    ],
    "typicalBrands": "Standard 43/53 grade OPC/PPC"
  },
  {
    "itemNo": "5.9.1",
    "category": "Concrete & RCC Work",
    "subhead": "Formwork / Shuttering",
    "title": "Centering & Shuttering for RCC Slabs Beams & Columns",
    "desc": "Centering and shuttering including strutting propping bracing up to 4.5m height and removal of formwork for suspended floors roofs and columns",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 702,
    "rateSqft": 65.22,
    "rateRange": {
      "min": 672.75,
      "max": 702
    },
    "rateSqftRange": {
      "min": 62.5,
      "max": 65.22
    },
    "coverage": "Formwork contact area",
    "keywords": [
      "shuttering",
      "centering",
      "formwork",
      "slab shuttering",
      "scaffolding"
    ],
    "typicalBrands": "IS 4990 Marine Film Faced Shuttering Ply / MS Plates"
  },
  {
    "itemNo": "5.22.6",
    "category": "Reinforcement Steel",
    "subhead": "TMT Reinforcement Bars",
    "title": "TMT Bar Fe-500D / Fe-550D Cutting Bending & Placing",
    "desc": "Steel reinforcement for R.C.C. work including straightening cutting bending placing in position and binding complete: Thermo-Mechanically Treated bars Fe-500D",
    "unit": "kg",
    "unitLabel": "Kilogram (kg)",
    "sqftFactor": 1,
    "rate": 103.68,
    "rateSqft": 103.68,
    "rateRange": {
      "min": 99.36,
      "max": 103.68
    },
    "rateSqftRange": {
      "min": 99.36,
      "max": 103.68
    },
    "coverage": "Approx. 3.5-4.5 kg per sq.ft of built-up residential slab",
    "keywords": [
      "steel",
      "tmt",
      "saria",
      "iron rod",
      "reinforcement",
      "fe500",
      "fe550",
      "rebar",
      "binding wire"
    ],
    "typicalBrands": "Tata Tiscon / JSW Neosteel / SAIL / Jindal Panther"
  },
  {
    "itemNo": "6.1.1",
    "category": "Brickwork & Masonry",
    "subhead": "Red Brick Masonry",
    "title": "Burnt Clay Brickwork in Cement Mortar 1:6 in Superstructure",
    "desc": "Brick work with common burnt clay bricks of class 7.5 in superstructure in cement mortar 1:6 (1 cement : 6 coarse sand)",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 7416,
    "rateSqft": 210,
    "rateRange": {
      "min": 7107,
      "max": 7416
    },
    "rateSqftRange": {
      "min": 201.25,
      "max": 210
    },
    "coverage": "Approx. 500 standard red bricks per m³",
    "keywords": [
      "brick",
      "brickwork",
      "masonry",
      "wall",
      "red brick",
      "cement mortar",
      "eent"
    ],
    "typicalBrands": "Kiln burnt class 7.5 non-modular clay bricks"
  },
  {
    "itemNo": "6.25.1",
    "category": "Brickwork & Masonry",
    "subhead": "AAC Block Masonry",
    "title": "Autoclaved Aerated Concrete (AAC) Block Masonry 200mm",
    "desc": "Providing and laying Autoclaved Aerated Concrete (AAC) block masonry with 200mm/150mm thick blocks using thin bed polymer block jointing mortar",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 5820,
    "rateSqft": 164.8,
    "rateRange": {
      "min": 5577.5,
      "max": 5820
    },
    "rateSqftRange": {
      "min": 157.94,
      "max": 164.8
    },
    "coverage": "High thermal insulation 60% lighter than red bricks",
    "keywords": [
      "aac",
      "block",
      "siporex",
      "fly ash block",
      "lightweight wall",
      "masonry"
    ],
    "typicalBrands": "Ultratech Xtralite / Magicrete / Godrej Renova"
  },
  {
    "itemNo": "13.1.2",
    "category": "Finishing & Painting",
    "subhead": "Plastering",
    "title": "Cement Plaster 12mm Thick (1:6) on Internal Walls",
    "desc": "12 mm cement plaster of mix: 1:6 (1 cement : 6 fine sand) on interior brick/concrete wall surface finished smooth",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 223.8,
    "rateSqft": 20.79,
    "rateRange": {
      "min": 214.48,
      "max": 223.8
    },
    "rateSqftRange": {
      "min": 19.93,
      "max": 20.79
    },
    "coverage": "Internal room wall surface",
    "keywords": [
      "plaster",
      "plastering",
      "internal plaster",
      "cement plaster",
      "chhan"
    ],
    "typicalBrands": "Screened river sand / M-sand with Grade 43 cement"
  },
  {
    "itemNo": "13.2.1",
    "category": "Finishing & Painting",
    "subhead": "Plastering",
    "title": "Exterior Cement Plaster 20mm Thick (1:4) with Waterproofing",
    "desc": "20 mm cement plaster of mix: 1:4 including integral waterproofing admixture applied on exterior walls in two coats",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 357.6,
    "rateSqft": 33.22,
    "rateRange": {
      "min": 342.7,
      "max": 357.6
    },
    "rateSqftRange": {
      "min": 31.84,
      "max": 33.22
    },
    "coverage": "External weatherproof envelope",
    "keywords": [
      "plaster",
      "exterior plaster",
      "waterproof plaster",
      "sand face plaster"
    ],
    "typicalBrands": "Coarse river sand with integral Dr. Fixit LW+"
  },
  {
    "itemNo": "11.36.1",
    "category": "Flooring & Tiling",
    "subhead": "Vitrified Tiles",
    "title": "Premium Glazed Vitrified Tiles (GVT) 600x600mm / 800x800mm",
    "desc": "Providing and laying polished vitrified floor tiles with water absorption less than 0.08% laid on 20mm thick cement mortar 1:4 with polymer adhesive bed and epoxy grout",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 1248,
    "rateSqft": 115.94,
    "rateRange": {
      "min": 1196,
      "max": 1248
    },
    "rateSqftRange": {
      "min": 111.11,
      "max": 115.94
    },
    "coverage": "Interior living bedrooms and commercial lobbies",
    "keywords": [
      "tile",
      "tiling",
      "vitrified",
      "floor tile",
      "gvt",
      "marbonite",
      "flooring"
    ],
    "typicalBrands": "Kajaria / Somany / Nitco / Simpolo"
  },
  {
    "itemNo": "11.41.2",
    "category": "Flooring & Tiling",
    "subhead": "Granite Stone",
    "title": "Jet Black Granite Stone 18mm for Kitchen Counters & Stairs",
    "desc": "Providing and fixing 18 mm thick mirror polished granite stone slab in kitchen countertops and stair treads/risers laid over cement mortar 1:4 including edge moulding",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 2304,
    "rateSqft": 214.05,
    "rateRange": {
      "min": 2208,
      "max": 2304
    },
    "rateSqftRange": {
      "min": 205.13,
      "max": 214.05
    },
    "coverage": "Kitchen platform counter treads thresholds",
    "keywords": [
      "granite",
      "stone",
      "countertop",
      "kitchen platform",
      "staircase",
      "black granite"
    ],
    "typicalBrands": "First quality South Indian Jet Black / Hassan Green"
  },
  {
    "itemNo": "11.37.1",
    "category": "Flooring & Tiling",
    "subhead": "Bathroom & Anti-Skid Tiles",
    "title": "Ceramic Anti-Skid Floor Tiles 300x300mm for Bathrooms",
    "desc": "Providing and laying ceramic glazed anti-skid floor tiles in toilets balconies and utility wash areas on 20mm cement mortar 1:4 including waterproof jointing",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 774,
    "rateSqft": 71.91,
    "rateRange": {
      "min": 741.75,
      "max": 774
    },
    "rateSqftRange": {
      "min": 68.91,
      "max": 71.91
    },
    "coverage": "Wet areas toilet flooring verandas",
    "keywords": [
      "anti-skid",
      "bathroom tile",
      "toilet flooring",
      "ceramic tile",
      "tiling"
    ],
    "typicalBrands": "Kajaria Anti-Skid / Johnson / Somany"
  },
  {
    "itemNo": "2.8.1",
    "category": "Earthwork & Excavation",
    "subhead": "Foundation Excavation",
    "title": "Earth Work in Excavation for Foundation Trenches (Up to 1.5m)",
    "desc": "Earth work in excavation by mechanical/manual means in foundation trenches or drains not exceeding 1.5 m depth in ordinary soil including dressing of sides",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 312.36,
    "rateSqft": 8.84,
    "rateRange": {
      "min": 299.34,
      "max": 312.36
    },
    "rateSqftRange": {
      "min": 8.48,
      "max": 8.84
    },
    "coverage": "Footing trenches & basement pits",
    "keywords": [
      "excavation",
      "earthwork",
      "trench",
      "digging",
      "soil work",
      "jcb",
      "foundation trench"
    ],
    "typicalBrands": "Mechanical excavator / JCB 3DX with depth control"
  },
  {
    "itemNo": "2.25.1",
    "category": "Earthwork & Excavation",
    "subhead": "Plinth Sand Filling",
    "title": "Filling Plinth & Foundations with River Sand (Watered & Rammed)",
    "desc": "Filling available clean river sand in plinth trenches and foundation sides in layers not exceeding 20cm in depth consolidating by ramming and watering",
    "unit": "cum",
    "unitLabel": "Cubic Meter (m³)",
    "sqftFactor": 35.315,
    "rate": 1296,
    "rateSqft": 36.7,
    "rateRange": {
      "min": 1242,
      "max": 1296
    },
    "rateSqftRange": {
      "min": 35.17,
      "max": 36.7
    },
    "coverage": "Plinth settlement prevention and moisture barrier",
    "keywords": [
      "sand filling",
      "plinth filling",
      "backfilling",
      "sand",
      "compaction"
    ],
    "typicalBrands": "Washed river sand free from silt and organic debris"
  },
  {
    "itemNo": "22.1.1",
    "category": "Waterproofing & Roofing",
    "subhead": "Terrace Waterproofing",
    "title": "Brick Bat Coba Integral Waterproofing for Terraces (115mm Thick)",
    "desc": "Providing and laying integral cement based water proofing treatment including laying 115mm average thickness brick bats soaked in water and grouted with cement slurry",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 990,
    "rateSqft": 91.97,
    "rateRange": {
      "min": 948.75,
      "max": 990
    },
    "rateSqftRange": {
      "min": 88.14,
      "max": 91.97
    },
    "coverage": "Terrace roof slope to drainage spout 10-year waterproofing guarantee",
    "keywords": [
      "waterproofing",
      "terrace",
      "brick bat coba",
      "roof leak",
      "damp proof",
      "seepage"
    ],
    "typicalBrands": "Dr. Fixit Pidiproof / Fosroc Conplast WP"
  },
  {
    "itemNo": "22.14.1",
    "category": "Waterproofing & Roofing",
    "subhead": "Basement & Retaining Walls",
    "title": "APP Polymer Modified Bituminous Membrane (3mm Thick)",
    "desc": "Providing and laying 3mm thick Atactic Polypropylene (APP) modified polymeric membrane reinforced with non-woven polyester mat torch-applied over primer",
    "unit": "sqm",
    "unitLabel": "Square Meter (m²)",
    "sqftFactor": 10.764,
    "rate": 594,
    "rateSqft": 55.18,
    "rateRange": {
      "min": 569.25,
      "max": 594
    },
    "rateSqftRange": {
      "min": 52.88,
      "max": 55.18
    },
    "coverage": "Underground basements podiums and water retainers",
    "keywords": [
      "membrane",
      "app membrane",
      "bituminous",
      "basement waterproofing",
      "torch applied"
    ],
    "typicalBrands": "STP Superlay / Dr. Fixit Torchshield"
  },
  {
    "itemNo": "10.2.1",
    "category": "Structural Steel & Fabrication",
    "subhead": "Trusses & Girders",
    "title": "Structural Steel Work (Trusses Columns Purlins) Welded/Bolted",
    "desc": "Structural steel work in single section built up sections trusses and framed work including cutting hoisting fixing in position and priming coat",
    "unit": "kg",
    "unitLabel": "Kilogram (kg)",
    "sqftFactor": 1,
    "rate": 113.4,
    "rateSqft": 113.4,
    "rateRange": {
      "min": 108.68,
      "max": 113.4
    },
    "rateSqftRange": {
      "min": 108.68,
      "max": 113.4
    },
    "coverage": "Industrial sheds warehouse roofs structural mezzanines",
    "keywords": [
      "structural steel",
      "truss",
      "peb",
      "fabrication",
      "welding",
      "iron work",
      "purlin"
    ],
    "typicalBrands": "SAIL / Tata Steel IS 2062 Grade E250"
  },
  {
    "itemNo": "18.7.1",
    "category": "Plumbing & Drainage",
    "subhead": "Concealed Water Supply",
    "title": "CPVC Water Supply Piping (25mm OD) Concealed in Wall",
    "desc": "Providing and fixing Chlorinated Polyvinyl Chloride (CPVC) pipe lines SDR 11 for hot & cold water supply including chases cutting in wall and pressure testing",
    "unit": "metre",
    "unitLabel": "Running Metre (Rmt)",
    "sqftFactor": 3.281,
    "rate": 390,
    "rateSqft": 118.87,
    "rateRange": {
      "min": 373.75,
      "max": 390
    },
    "rateSqftRange": {
      "min": 113.91,
      "max": 118.87
    },
    "coverage": "Concealed bathroom and kitchen water line",
    "keywords": [
      "cpvc",
      "pipe",
      "plumbing",
      "water line",
      "pipe fitting",
      "water supply"
    ],
    "typicalBrands": "Astral / Ashirvad / Supreme SDR 11"
  },
  {
    "itemNo": "19.1.1",
    "category": "Electrical & Conduits",
    "subhead": "Concealed Point Wiring",
    "title": "Modular Electrical Point Wiring in Concealed PVC Conduit",
    "desc": "Wiring for light / fan / exhaust point with 1.5 sq.mm FRLS PVC insulated copper conductor single core cable in recessed PVC conduit with modular switch & plate",
    "unit": "point",
    "unitLabel": "Per Point",
    "sqftFactor": 1,
    "rate": 984,
    "rateSqft": 984,
    "rateRange": {
      "min": 943,
      "max": 984
    },
    "rateSqftRange": {
      "min": 943,
      "max": 984
    },
    "coverage": "1 complete lighting or appliance point",
    "keywords": [
      "electrical",
      "wiring",
      "point wiring",
      "switch",
      "light point",
      "copper wire"
    ],
    "typicalBrands": "Havells / Polycab FRLS / Schneider / Legrand Modular"
  }
];
