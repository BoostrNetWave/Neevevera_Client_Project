import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiFileText,
  FiDownload,
  FiShare2,
  FiArrowRight,
  FiInfo,
  FiLayers,
  FiCalendar,
  FiMapPin,
  FiHome,
} from 'react-icons/fi';
import { DSR_ITEMS as INITIAL_DSR_ITEMS, DSR_CATEGORIES } from '../data/dsrRates';

// CPWD PAR 2025 Approved Reference Base Rates (Odisha Base Index = 100)
const PAR_BUILDING_TYPES = [
  {
    id: 'residential_rcc',
    name: 'Residential Building (RCC Framed Structure)',
    sub: 'CPWD PAR 2025 Table 1.1 — Normal Foundation, 3.35m Floor Height',
    baseRateSqft: 1850,
    rateRangeMax: 2150,
    baseDurationMonths: 6,
    durationPerFloorMonths: 1.5,
  },
  {
    id: 'commercial_office',
    name: 'Commercial & Office Building (RCC Framed)',
    sub: 'CPWD PAR 2025 Table 2.1 — Heavy Floor Loading, Fire Norms',
    baseRateSqft: 2200,
    rateRangeMax: 2600,
    baseDurationMonths: 8,
    durationPerFloorMonths: 2,
  },
  {
    id: 'institutional_school',
    name: 'Institutional / School Building',
    sub: 'CPWD PAR 2025 Table 3.2 — Large Spans, Wide Corridors',
    baseRateSqft: 1980,
    rateRangeMax: 2350,
    baseDurationMonths: 7,
    durationPerFloorMonths: 1.5,
  },
  {
    id: 'industrial_shed',
    name: 'Industrial Shed & PEB Warehouse',
    sub: 'CPWD PAR 2025 Section 5 — Steel Truss / Pre-Engineered Frame',
    baseRateSqft: 1450,
    rateRangeMax: 1750,
    baseDurationMonths: 5,
    durationPerFloorMonths: 1,
  },
];

const PAR_LOCATIONS = [
  { id: 'bhubaneswar', name: 'Bhubaneswar / Khurda', costIndex: 100, zone: 'Central Urban' },
  { id: 'cuttack', name: 'Cuttack Municipal Area', costIndex: 102, zone: 'Twin City Zone' },
  { id: 'puri', name: 'Puri Coastal Heritage Zone', costIndex: 105, zone: 'High Salinity / Special Foundation' },
  { id: 'rourkela', name: 'Rourkela / Sundargarh', costIndex: 108, zone: 'Western Industrial Belt' },
  { id: 'berhampur', name: 'Berhampur / Ganjam', costIndex: 104, zone: 'Southern Coastal' },
  { id: 'other_odisha', name: 'Other Odisha Districts', costIndex: 103, zone: 'State Regional Average' },
];

// Helper to format active unit based on metric/imperial mode
function getActiveUnitLabel(unit, isImperial, rateSqft) {
  if (!isImperial || !rateSqft) return unit || '';
  const u = (unit || '').toLowerCase().trim();
  if (u === 'sqm' || u === 'sq.m' || u === 'm2' || u === 'square meter') return 'sq.ft';
  if (u === 'cum' || u === 'cu.m' || u === 'm3' || u === 'cubic meter') return 'cu.ft';
  return unit || '';
}

export default function Estimate() {
  const location = useLocation();

  // Tab state: 'dsr' for DSR items, 'plinth' for building plinth area calculator
  const [activeTab, setActiveTab] = useState(() => {
    return location.pathname.includes('building') || location.hash === '#plinth'
      ? 'plinth'
      : 'dsr';
  });

  // ── DSR ITEMS CALCULATOR STATE ──
  const [dsrItems, setDsrItems] = useState(INITIAL_DSR_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalItemsCount, setTotalItemsCount] = useState(INITIAL_DSR_ITEMS.length);
  const [totalPages, setTotalPages] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [unitMode, setUnitMode] = useState('metric'); // 'metric' (sqm/cum) or 'imperial' (sqft)
  const [basket, setBasket] = useState([]); // [{ itemNo, qty, customRate }]
  const [itemQuantities, setItemQuantities] = useState({}); // local input states for items
  const [copiedLink, setCopiedLink] = useState(false);

  // Debounced server-side search across entire master catalogue (300ms) with stale request cancellation
  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({
          page: String(currentPage),
          limit: '25',
        });
        if (searchQuery.trim()) params.set('q', searchQuery.trim());
        if (selectedCategory && selectedCategory !== 'All Categories') params.set('category', selectedCategory);

        const res = await fetch(`/api/dsr/search?${params.toString()}`, {
          signal: controller.signal,
        });

        if (res.ok) {
          const json = await res.json();
          const itemsList = json?.data || json?.items;
          if (json?.success && Array.isArray(itemsList)) {
            setDsrItems(itemsList);
            setTotalItemsCount(json.meta?.total ?? itemsList.length);
            setTotalPages(json.meta?.totalPages ?? 1);
          }
        } else {
          // If estimator disabled or error, fallback to local initial list filter
          const normalized = searchQuery.trim().toLowerCase();
          const localFiltered = INITIAL_DSR_ITEMS.filter((item) => {
            const matchCat = selectedCategory === 'All Categories' || item.category === selectedCategory;
            if (!matchCat) return false;
            if (!normalized) return true;
            return (
              item.itemNo.toLowerCase().includes(normalized) ||
              item.title.toLowerCase().includes(normalized) ||
              (item.desc && item.desc.toLowerCase().includes(normalized))
            );
          });
          setDsrItems(localFiltered);
          setTotalItemsCount(localFiltered.length);
          setTotalPages(1);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Fallback to local items if network failed
          const normalized = searchQuery.trim().toLowerCase();
          const localFiltered = INITIAL_DSR_ITEMS.filter((item) => {
            const matchCat = selectedCategory === 'All Categories' || item.category === selectedCategory;
            if (!matchCat) return false;
            if (!normalized) return true;
            return (
              item.itemNo.toLowerCase().includes(normalized) ||
              item.title.toLowerCase().includes(normalized)
            );
          });
          setDsrItems(localFiltered);
          setTotalItemsCount(localFiltered.length);
          setTotalPages(1);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchQuery, selectedCategory, currentPage]);

  // Reset page when filter or search changes
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  // Dynamic categories from loaded items (including newly uploaded items)
  const categories = useMemo(() => {
    const set = new Set(DSR_CATEGORIES);
    dsrItems.forEach((item) => {
      if (item.category && typeof item.category === 'string') {
        set.add(item.category.trim());
      }
    });
    return Array.from(set);
  }, [dsrItems]);

  // Items currently in view
  const filteredItems = dsrItems;

  // Handle local quantity change on an item card
  const handleQtyChange = (itemNo, val) => {
    const num = parseFloat(val);
    setItemQuantities((prev) => ({
      ...prev,
      [itemNo]: isNaN(num) || num < 0 ? 0 : num,
    }));
  };

  // Add item to basket
  const handleAddToBasket = (item) => {
    const qty = itemQuantities[item.itemNo] || 100;
    setBasket((prev) => {
      const existing = prev.find((b) => b.itemNo === item.itemNo);
      if (existing) {
        return prev.map((b) =>
          b.itemNo === item.itemNo ? { ...b, qty: b.qty + qty } : b
        );
      }
      return [...prev, { ...item, qty }];
    });
  };

  // Remove from basket
  const handleRemoveFromBasket = (itemNo) => {
    setBasket((prev) => prev.filter((b) => b.itemNo !== itemNo));
  };

  // Update quantity in basket
  const handleBasketQtyUpdate = (itemNo, newQty) => {
    const val = parseFloat(newQty);
    if (isNaN(val) || val <= 0) {
      handleRemoveFromBasket(itemNo);
      return;
    }
    setBasket((prev) =>
      prev.map((b) => (b.itemNo === itemNo ? { ...b, qty: val } : b))
    );
  };

  // Clear basket
  const handleClearBasket = () => {
    setBasket([]);
  };

  // Pre-load common templates
  const loadTemplate = (templateName) => {
    if (templateName === 'painting') {
      const putty = dsrItems.find((i) => i.itemNo === '13.80.1') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '13.80.1');
      const primer = dsrItems.find((i) => i.itemNo === '13.41.1') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '13.41.1');
      const interior = dsrItems.find((i) => i.itemNo === '13.43.1') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '13.43.1');
      const exterior = dsrItems.find((i) => i.itemNo === '13.90.1') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '13.90.1');

      const itemsToAdd = [
        putty ? { ...putty, qty: 350 } : null,
        primer ? { ...primer, qty: 350 } : null,
        interior ? { ...interior, qty: 350 } : null,
        exterior ? { ...exterior, qty: 150 } : null,
      ].filter(Boolean);

      setBasket(itemsToAdd);
      setSearchQuery('painting');
    } else if (templateName === 'slab') {
      const concrete = dsrItems.find((i) => i.itemNo === '4.1.3') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '4.1.3');
      const steel = dsrItems.find((i) => i.itemNo === '5.22.6') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '5.22.6');
      const shuttering = dsrItems.find((i) => i.itemNo === '5.9.1') || INITIAL_DSR_ITEMS.find((i) => i.itemNo === '5.9.1');

      const itemsToAdd = [
        concrete ? { ...concrete, qty: 12 } : null,
        steel ? { ...steel, qty: 1100 } : null,
        shuttering ? { ...shuttering, qty: 95 } : null,
      ].filter(Boolean);

      setBasket(itemsToAdd);
      setSearchQuery('concrete');
    }
  };

  // Calculations for DSR (rates are already loaded turnkey rates with approved margin)
  const grandTotal = useMemo(() => {
    return basket.reduce((acc, item) => {
      const activeRate =
        unitMode === 'imperial' && item.rateSqft ? item.rateSqft : (item.rate || 0);
      return acc + activeRate * item.qty;
    }, 0);
  }, [basket, unitMode]);

  // Export DSR CSV
  const handleExportCSV = () => {
    if (basket.length === 0) return;
    const headers = ['Item Code', 'Category', 'Description', 'Unit', 'Indicative Turnkey Rate (INR)', 'Quantity', 'Subtotal (INR)'];
    const rows = basket.map((item) => {
      const rate = unitMode === 'imperial' && item.rateSqft ? item.rateSqft : item.rate;
      const sub = rate * item.qty;
      return [
        `"${item.itemNo}"`,
        `"${item.category || ''}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${item.unit || ''}"`,
        (rate || 0).toFixed(2),
        item.qty,
        sub.toFixed(2),
      ].join(',');
    });

    const summaryRows = [
      '',
      `"Total Indicative Project Estimate",,,,,,${grandTotal.toFixed(2)}`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows, ...summaryRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Neevevera_DSR_Estimate_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyEstimateLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ── PLINTH AREA CALCULATOR STATE (PAR 2025) ──
  const [selectedBuildingId, setSelectedBuildingId] = useState('residential_rcc');
  const [selectedLocationId, setSelectedLocationId] = useState('bhubaneswar');
  const [specQuality, setSpecQuality] = useState('standard'); // 'standard' | 'premium'
  const [floors, setFloors] = useState([
    { id: 1, name: 'Ground Floor', areaSqft: 1200 },
    { id: 2, name: 'First Floor', areaSqft: 1000 },
    { id: 3, name: 'Second Floor', areaSqft: 900 },
  ]);

  const activeBuilding = useMemo(() => {
    return PAR_BUILDING_TYPES.find((b) => b.id === selectedBuildingId) || PAR_BUILDING_TYPES[0];
  }, [selectedBuildingId]);

  const activeLocation = useMemo(() => {
    return PAR_LOCATIONS.find((l) => l.id === selectedLocationId) || PAR_LOCATIONS[0];
  }, [selectedLocationId]);

  // Plinth calculation helpers
  const totalPlinthAreaSqft = useMemo(() => {
    return floors.reduce((sum, f) => sum + (parseFloat(f.areaSqft) || 0), 0);
  }, [floors]);

  const totalPlinthAreaSqm = totalPlinthAreaSqft / 10.7639;

  // Rate adjustments based on Cost Index & Spec
  const locationMultiplier = (activeLocation.costIndex || 100) / 100;
  const specMultiplier = specQuality === 'premium' ? 1.15 : 1.0;

  const adjustedRateMinSqft = Math.round(activeBuilding.baseRateSqft * locationMultiplier * specMultiplier);
  const adjustedRateMaxSqft = Math.round(activeBuilding.rateRangeMax * locationMultiplier * specMultiplier);

  const plinthEstimatedCostMin = Math.round(totalPlinthAreaSqft * adjustedRateMinSqft);
  const plinthEstimatedCostMax = Math.round(totalPlinthAreaSqft * adjustedRateMaxSqft);

  // Construction timeline estimation
  const estimatedDurationMonths = useMemo(() => {
    const floorCount = floors.filter((f) => (parseFloat(f.areaSqft) || 0) > 0).length;
    const base = activeBuilding.baseDurationMonths;
    const floorAdd = Math.max(0, floorCount - 1) * activeBuilding.durationPerFloorMonths;
    return Math.round(base + floorAdd);
  }, [floors, activeBuilding]);

  const handleFloorAreaChange = (id, newArea) => {
    const val = parseFloat(newArea);
    setFloors((prev) =>
      prev.map((f) => (f.id === id ? { ...f, areaSqft: isNaN(val) || val < 0 ? 0 : val } : f))
    );
  };

  const handleAddFloor = () => {
    const nextNum = floors.length + 1;
    const suffix = nextNum === 4 ? 'Third Floor' : nextNum === 5 ? 'Fourth Floor' : `Floor ${nextNum}`;
    setFloors((prev) => [...prev, { id: Date.now(), name: suffix, areaSqft: 800 }]);
  };

  const handleRemoveFloor = (id) => {
    if (floors.length <= 1) return;
    setFloors((prev) => prev.filter((f) => f.id !== id));
  };

  // Export Plinth Area CSV
  const handleExportPlinthCSV = () => {
    const headers = ['Floor Level', 'Plinth Area (sq ft)', 'Plinth Area (sq m)', 'Min Indicative Cost (INR)', 'Max Indicative Cost (INR)'];
    const rows = floors.map((f) => {
      const area = parseFloat(f.areaSqft) || 0;
      const sqm = (area / 10.7639).toFixed(2);
      const minCost = Math.round(area * adjustedRateMinSqft);
      const maxCost = Math.round(area * adjustedRateMaxSqft);
      return [`"${f.name}"`, area, sqm, minCost, maxCost].join(',');
    });

    const summaryRows = [
      '',
      `"Total Plinth Area",${totalPlinthAreaSqft.toFixed(2)},${totalPlinthAreaSqm.toFixed(2)},,`,
      `"Building Type","${activeBuilding.name}",,,,`,
      `"Location","${activeLocation.name} (Index ${activeLocation.costIndex})",,,,`,
      `"Specification Quality","${specQuality === 'premium' ? 'Premium Finishes (+15%)' : 'CPWD Standard'}",,,,`,
      `"Indicative Rate Range","₹${adjustedRateMinSqft} - ₹${adjustedRateMaxSqft} per sq ft",,,,`,
      `"Estimated Project Cost Range",,"","₹${plinthEstimatedCostMin.toLocaleString('en-IN')}","₹${plinthEstimatedCostMax.toLocaleString('en-IN')}"`,
      `"Indicative Construction Duration","Duration not available (Pending engineering sign-off)",,,,`,
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows, ...summaryRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Neevevera_Plinth_Area_Estimate_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full bg-[#FAF9F6] min-h-screen text-[#171717] pb-16">
      <Helmet>
        <title>DSR Rate & Plinth Area Cost Calculator | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Calculate construction costs with official CPWD Delhi Schedule of Rates (DSR) and Plinth Area Rates (PAR 2025). Transparent engineering estimation for residential and commercial projects in Odisha."
        />
      </Helmet>

      {/* ── Breadcrumb Bar ── */}
      <div className="border-b border-[#DDDAD1]/70 bg-[#F2EFE9] py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#6B6B67]">
            <Link to="/" className="text-[#07558F] hover:underline font-semibold">Home</Link>
            <span>/</span>
            <Link to="/services" className="text-[#07558F] hover:underline font-semibold">Services</Link>
            <span>/</span>
            <span className="text-[#111822] font-semibold">Cost Estimator</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#07558F] bg-[#07558F]/10 px-2.5 py-0.5 rounded-full font-bold">
              CPWD DSR &amp; PAR 2025 STANDARDS
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <section className="pt-8 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E3E2DA]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#07558F]/10 text-[#07558F] rounded-full text-[11px] font-bold font-mono uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[15px]">calculate</span>
              <span>ESTA SOFTWARE-COMPLIANT ESTIMATION ENGINE</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight">
              Interactive Construction Cost &amp; Rate Calculator
            </h1>
            <p className="text-sm sm:text-base text-[#4B5563] mt-2 max-w-3xl leading-relaxed">
              Calculate turnkey construction costs via floor-wise <strong>Plinth Area Rates (PAR 2025)</strong> or itemize specialized civil, painting, RCC, and masonry schedules via <strong>Delhi Schedule of Rates (DSR)</strong>.
            </p>
          </div>

          {/* Calculator Mode Switcher Tabs */}
          <div className="shrink-0 flex items-center p-1 bg-[#EDEBE4] rounded-2xl border border-[#DDDAD1] shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('dsr')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'dsr'
                  ? 'bg-white text-[#07558F] shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <FiLayers className="w-3.5 h-3.5 text-[#07558F]" />
              <span>DSR Item Schedule</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('plinth')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'plinth'
                  ? 'bg-[#07558F] text-white shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              <FiHome className="w-3.5 h-3.5" />
              <span>Plinth Area Calculator (PAR 2025)</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: DSR ITEM-WISE RATE CALCULATOR
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'dsr' && (
        <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Limited Preview Disclaimer */}
          <div className="mb-6 p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-amber-900 text-xs leading-relaxed">
            <span className="material-symbols-outlined text-amber-600 text-lg shrink-0 mt-0.5">info</span>
            <div>
              <strong className="font-bold font-display uppercase tracking-wide text-[11px] block mb-0.5">Phase 1 Preview Catalogue (26 Curated DSR 2023 Items)</strong>
              This public calculator currently hosts a verified sample subset of 26 structural and finishing items from CPWD DSR 2023. Full indexing of DSR 2023 Volumes 1 &amp; 2 (comprising thousands of items across all sub-heads) is in progress. For complete tenders or custom items, please use our <em>Submit Quotation Enquiry</em> feature.
            </div>
          </div>
          {/* Quick Presets Bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 bg-[#F4F1EA] p-3 rounded-2xl border border-[#DDDAD1]/80">
            <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5 font-display uppercase tracking-wider">
              <span className="material-symbols-outlined text-[16px] text-[#07558F]">bolt</span>
              <span>Quick Estimation Templates:</span>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => loadTemplate('painting')}
                className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#07558F] border border-[#07558F]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-[#07558F]">format_paint</span>
                <span>2BHK Painting Template</span>
              </button>
              <button
                type="button"
                onClick={() => loadTemplate('slab')}
                className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#07558F] border border-[#07558F]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              >
                <span className="material-symbols-outlined text-[15px] text-[#07558F]">foundation</span>
                <span>RCC Slab Casting (1000 sq ft)</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Search & Item Feed (8 Cols) */}
            <div className="lg:col-span-8 space-y-6">
              {/* Search Bar + Controls Card */}
              <div className="bg-white p-5 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-4">
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder='Search by item keyword (e.g. "painting", "acrylic", "concrete", "steel", "brick", "putty") or code "13.43.1"...'
                    className="w-full pl-12 pr-10 py-3.5 bg-[#FAF9F6] border border-[#D5D3C8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#07558F] font-medium text-[#111822] placeholder:text-gray-400"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchChange('')}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm p-1 cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Units & Quick Stats Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-gray-100">
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500 font-medium">Display Units:</span>
                    <div className="inline-flex rounded-lg border border-[#DDDAD1] p-0.5 bg-[#FAF9F6]">
                      <button
                        type="button"
                        onClick={() => setUnitMode('metric')}
                        className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                          unitMode === 'metric'
                            ? 'bg-[#07558F] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-black'
                        }`}
                      >
                        Metric (m² / m³)
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnitMode('imperial')}
                        className={`px-2.5 py-1 rounded-md font-mono text-[11px] font-bold transition-all cursor-pointer ${
                          unitMode === 'imperial'
                            ? 'bg-[#07558F] text-white shadow-2xs'
                            : 'text-gray-600 hover:text-black'
                        }`}
                      >
                        Sq.Ft (Standard)
                      </button>
                    </div>
                  </div>

                  <div className="text-gray-500 font-mono text-[11px]">
                    Showing <strong className="text-[#111822]">{filteredItems.length}</strong> of <strong className="text-[#111822]">{totalItemsCount}</strong> items
                    {isSearching && <span className="ml-2 text-[#07558F] font-sans text-xs">Searching...</span>}
                  </div>
                </div>

                {/* Category Pills Bar */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3 py-1.5 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-[#07558F] text-white font-bold shadow-2xs'
                          : 'bg-[#FAF9F6] text-gray-600 hover:bg-[#EBE8DF] border border-[#DDDAD1]/60'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Matching Items List */}
              {filteredItems.length === 0 ? (
                <div className="bg-white p-10 rounded-2xl border border-[#DDDAD1]/80 text-center space-y-3">
                  <span className="material-symbols-outlined text-4xl text-gray-400">search_off</span>
                  <h3 className="font-display text-base font-bold text-gray-800">
                    No matching DSR schedule items found
                  </h3>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Try searching for terms like <span className="font-semibold text-[#07558F]">"painting"</span>, <span className="font-semibold text-[#07558F]">"putty"</span>, <span className="font-semibold text-[#07558F]">"concrete"</span>, or <span className="font-semibold text-[#07558F]">"steel"</span>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All Categories');
                    }}
                    className="px-4 py-2 bg-[#07558F] text-white rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Reset Search
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredItems.map((item) => {
                    const defaultVal = itemQuantities[item.itemNo] ?? 100;
                    const activeRate =
                      unitMode === 'imperial' && item.rateSqft ? item.rateSqft : item.rate;
                    const activeUnit = getActiveUnitLabel(item.unit, unitMode === 'imperial', item.rateSqft);
                    const activeRange =
                      unitMode === 'imperial' && item.rateSqftRange
                        ? item.rateSqftRange
                        : item.rateRange;
                    const hasRange =
                      activeRange &&
                      typeof activeRange.min === 'number' &&
                      typeof activeRange.max === 'number' &&
                      activeRange.min < activeRange.max;
                    const itemCost = (activeRate || 0) * defaultVal;
                    const isItemInBasket = basket.some((b) => b.itemNo === item.itemNo);

                    return (
                      <div
                        key={item.itemNo}
                        className="bg-white p-5 rounded-2xl border border-[#DDDAD1]/80 hover:border-[#07558F]/50 shadow-xs transition-all space-y-4 group"
                      >
                        {/* Top Header of Card */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 max-w-xl">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#07558F] bg-[#07558F]/10 px-2.5 py-0.5 rounded border border-[#07558F]/20">
                                Item {item.itemNo}
                              </span>
                              <span className="text-[11px] font-mono font-semibold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                {item.category}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                • {item.subhead}
                              </span>
                            </div>
                            <h3 className="font-display text-base font-bold text-[#111822] group-hover:text-[#07558F] transition-colors pt-1">
                              {item.title}
                            </h3>
                            <p className="text-xs text-[#4B5563] leading-relaxed">
                              {item.desc}
                            </p>
                            {item.typicalBrands && (
                              <div className="text-[11px] text-gray-500 pt-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[14px] text-[#B9923B]">verified</span>
                                <span><strong>Approved Standard:</strong> {item.typicalBrands}</span>
                              </div>
                            )}
                          </div>

                          {/* Indicative Turnkey Rate Badge */}
                          <div className="shrink-0 text-left sm:text-right bg-[#FAF9F6] p-3 rounded-xl border border-[#DDDAD1]/60">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500 block">
                              Indicative Turnkey Rate
                            </span>
                            <div className="font-mono text-lg font-bold text-[#111822]">
                              {hasRange ? (
                                <>
                                  ₹{activeRange.min.toFixed(2)} – ₹{activeRange.max.toFixed(2)}
                                </>
                              ) : (
                                <>₹{(activeRate || 0).toFixed(2)}</>
                              )}
                              <span className="text-xs text-gray-500 font-normal"> /{activeUnit}</span>
                            </div>
                            {item.coverage && (
                              <span className="text-[10px] text-gray-500 block mt-0.5">
                                {item.coverage}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interactive Calculator Input & Live Cost Row */}
                        <div className="bg-[#FAF9F6] p-3 rounded-xl border border-[#DDDAD1]/60 flex flex-wrap sm:flex-nowrap items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-semibold text-[#111822] shrink-0">
                              Enter Quantity ({activeUnit}):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={defaultVal}
                              onChange={(e) => handleQtyChange(item.itemNo, e.target.value)}
                              className="w-24 px-2.5 py-1.5 bg-white border border-[#D5D3C8] rounded-lg text-xs font-mono font-bold text-[#111822] focus:outline-none focus:ring-1 focus:ring-[#07558F]"
                            />
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="text-[10px] font-mono text-gray-500 uppercase block">
                                Estimated Cost
                              </span>
                              <span className="font-mono text-base font-extrabold text-[#07558F]">
                                ₹{itemCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleAddToBasket(item)}
                              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                                isItemInBasket
                                  ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                  : 'bg-[#07558F] text-white hover:bg-[#054370] shadow-sm'
                              }`}
                            >
                              {isItemInBasket ? (
                                <>
                                  <FiCheck className="w-3.5 h-3.5" />
                                  <span>Added ({basket.find((b) => b.itemNo === item.itemNo)?.qty} {activeUnit})</span>
                                </>
                              ) : (
                                <>
                                  <FiPlus className="w-3.5 h-3.5" />
                                  <span>Add to Estimate</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Server-Side Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#DDDAD1]/80 shadow-xs">
                  <div className="text-xs text-gray-600 font-medium">
                    Showing Page <strong className="text-[#111822]">{currentPage}</strong> of <strong className="text-[#111822]">{totalPages}</strong> ({totalItemsCount} total items in catalogue)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1 || isSearching}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      ← Previous
                    </button>
                    <button
                      type="button"
                      disabled={currentPage >= totalPages || isSearching}
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors shadow-2xs"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Sticky Project BOQ Basket & Summary (4 Cols) */}
            <div className="lg:col-span-4 space-y-6 sticky top-28">
              <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDDAD1]/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#07558F] text-[20px]">shopping_cart</span>
                    <h2 className="font-display text-base font-bold text-[#111822]">
                      Project BOQ Basket
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-bold bg-[#07558F]/10 text-[#07558F] px-2 py-0.5 rounded-full">
                    {basket.length} {basket.length === 1 ? 'Item' : 'Items'}
                  </span>
                </div>

                {basket.length === 0 ? (
                  <div className="py-8 text-center space-y-2 text-gray-400">
                    <FiFileText className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs">Your calculation basket is empty.</p>
                    <p className="text-[11px] text-gray-500">
                      Search <span className="text-[#07558F] font-semibold">"painting"</span> or select an item on the left to start calculating your budget.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                    {basket.map((item) => {
                      const activeRate =
                        unitMode === 'imperial' && item.rateSqft ? item.rateSqft : item.rate;
                      const sub = (activeRate || 0) * item.qty;

                      return (
                        <div
                          key={item.itemNo}
                          className="p-2.5 rounded-xl bg-[#FAF9F6] border border-[#DDDAD1]/60 text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="font-mono text-[10px] font-bold text-[#07558F]">
                                {item.itemNo}
                              </span>
                              <div className="font-semibold text-gray-800 line-clamp-1">
                                {item.title}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveFromBasket(item.itemNo)}
                              className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-gray-600 pt-1 border-t border-gray-200">
                            <div className="flex items-center gap-1.5">
                              <span>Qty:</span>
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => handleBasketQtyUpdate(item.itemNo, e.target.value)}
                                className="w-16 px-1.5 py-0.5 bg-white border border-[#D5D3C8] rounded text-center font-mono font-bold"
                              />
                              <span>{getActiveUnitLabel(item.unit, unitMode === 'imperial', item.rateSqft)}</span>
                            </div>
                            <div className="font-mono font-bold text-gray-900">
                              ₹{sub.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cost Summary Breakdown */}
                <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Estimated Items Subtotal:</span>
                    <span className="font-mono font-semibold text-gray-900">
                      ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-[#111822]">Total Indicative Estimate:</span>
                    <span className="font-mono text-xl font-extrabold text-[#07558F]">
                      ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 leading-tight pt-1">
                    * Rates are indicative turnkey market rates including material, labour, and contractor overheads calibrated to CPWD schedule norms. Final BOQ issued upon site inspection.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                  <Link
                    to={`/contact?service=dsr-estimate&items=${encodeURIComponent(
                      basket.map((b) => `${b.itemNo}:${b.qty}`).join(',')
                    )}&total=${Math.round(grandTotal)}`}
                    className="w-full py-3 bg-[#07558F] text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center block hover:bg-[#054370] transition-colors shadow-sm"
                  >
                    Request Official BOQ &amp; Site Visit →
                  </Link>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={basket.length === 0}
                      onClick={handleExportCSV}
                      className="py-2 px-3 bg-white border border-[#D5D3C8] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      <FiDownload className="w-3.5 h-3.5 text-[#07558F]" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleCopyEstimateLink}
                      className="py-2 px-3 bg-white border border-[#D5D3C8] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <FiShare2 className="w-3.5 h-3.5 text-[#07558F]" />
                      <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                    </button>
                  </div>

                  {basket.length > 0 && (
                    <button
                      type="button"
                      onClick={handleClearBasket}
                      className="w-full text-center text-[11px] text-gray-400 hover:text-red-500 py-1 cursor-pointer transition-colors"
                    >
                      Clear calculation basket
                    </button>
                  )}
                </div>
              </div>

              {/* Statutory Compliance Note */}
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#DDDAD1]/70 text-[11px] text-gray-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#07558F]">
                  <FiInfo className="w-3.5 h-3.5 shrink-0" />
                  <span>Statutory Schedule Transparency</span>
                </div>
                <p className="leading-relaxed">
                  Rates derived directly from CPWD Schedule of Rates. Actual tenders may vary slightly based on local quarry cartage and site accessibility in Odisha and Andaman &amp; Nicobar Islands.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: BUILDING / PLINTH AREA CALCULATOR (PAR 2025)
         ───────────────────────────────────────────────────────────── */}
      {activeTab === 'plinth' && (
        <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Draft Engineering Model Disclaimer */}
          <div className="mb-6 p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex items-start gap-3 text-[#07558F] text-xs leading-relaxed">
            <span className="material-symbols-outlined text-[#07558F] text-lg shrink-0 mt-0.5">engineering</span>
            <div>
              <strong className="font-bold font-display uppercase tracking-wide text-[11px] block mb-0.5">Preliminary Engineering Model (Pending Executive Sign-off)</strong>
              Turnkey plinth-area rates, regional cost indices, and project durations are draft approximations based on CPWD PAR guidelines. These models remain subject to formal validation and engineering sign-off by Neevevera's Chief Structural Engineer before binding execution. Durations are marked unavailable pending this review.
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Project Specifications & Floor Configuration (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Building Classification Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <FiHome className="text-[#07558F] text-lg" />
                  <h2 className="font-display text-base font-bold text-[#111822]">
                    1. Select Building Type &amp; Classification
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PAR_BUILDING_TYPES.map((bt) => {
                    const isSelected = selectedBuildingId === bt.id;
                    return (
                      <div
                        key={bt.id}
                        onClick={() => setSelectedBuildingId(bt.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#07558F] bg-[#07558F]/5 ring-1 ring-[#07558F]'
                            : 'border-[#DDDAD1]/80 hover:border-gray-400 bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold text-xs text-[#111822]">{bt.name}</span>
                          {isSelected && <FiCheck className="text-[#07558F] shrink-0" />}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1 leading-snug">{bt.sub}</p>
                        <div className="mt-2 text-[10px] font-mono text-[#07558F] font-semibold">
                          CPWD PAR Base: ₹{bt.baseRateSqft} – ₹{bt.rateRangeMax} / sq.ft
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Location & Cost Index Card */}
              <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FiMapPin className="text-[#07558F] text-lg" />
                    <h2 className="font-display text-base font-bold text-[#111822]">
                      2. Project Location &amp; Regional Cost Index
                    </h2>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Index: {activeLocation.costIndex} ({activeLocation.costIndex === 100 ? 'Base' : `+${activeLocation.costIndex - 100}%`})
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PAR_LOCATIONS.map((loc) => {
                    const isSelected = selectedLocationId === loc.id;
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => setSelectedLocationId(loc.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-[#07558F] bg-[#07558F]/5 ring-1 ring-[#07558F]'
                            : 'border-[#DDDAD1]/80 hover:border-gray-400 bg-[#FAF9F6]'
                        }`}
                      >
                        <div className="font-display font-bold text-xs text-[#111822] line-clamp-1">{loc.name}</div>
                        <div className="text-[10px] font-mono text-gray-500 mt-0.5">Factor: {loc.costIndex}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Floor-wise Plinth Area Inputs */}
              <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <FiLayers className="text-[#07558F] text-lg" />
                    <h2 className="font-display text-base font-bold text-[#111822]">
                      3. Floor-Wise Plinth Area Input (sq.ft)
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFloor}
                    className="text-xs font-bold text-[#07558F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FiPlus /> Add Floor
                  </button>
                </div>

                <div className="space-y-3">
                  {floors.map((floor, idx) => (
                    <div
                      key={floor.id}
                      className="flex items-center justify-between gap-3 p-3 bg-[#FAF9F6] rounded-xl border border-[#DDDAD1]/70"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-[#07558F]/10 text-[#07558F] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-display font-bold text-xs text-[#111822]">{floor.name}</div>
                          <span className="text-[10px] font-mono text-gray-500">
                            {((parseFloat(floor.areaSqft) || 0) / 10.7639).toFixed(1)} m²
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            step="10"
                            value={floor.areaSqft}
                            onChange={(e) => handleFloorAreaChange(floor.id, e.target.value)}
                            className="w-28 px-2.5 py-1.5 bg-white border border-[#D5D3C8] rounded-lg text-xs font-mono font-bold text-[#111822] text-right focus:outline-none focus:ring-1 focus:ring-[#07558F]"
                          />
                          <span className="text-xs text-gray-500 font-medium">sq.ft</span>
                        </div>
                        {floors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveFloor(floor.id)}
                            className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"
                            title="Remove Floor"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs">
                  <span className="font-semibold text-gray-600">Total Built-Up Plinth Area:</span>
                  <div className="font-mono text-right">
                    <strong className="text-sm font-bold text-[#07558F]">{totalPlinthAreaSqft.toLocaleString('en-IN')} sq.ft</strong>
                    <span className="text-[11px] text-gray-500 block">({totalPlinthAreaSqm.toFixed(1)} sq.m)</span>
                  </div>
                </div>
              </div>

              {/* Finishing Quality Standard */}
              <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-xs space-y-3">
                <h3 className="font-display text-xs font-bold text-[#111822] uppercase tracking-wider">
                  4. Specification Standard
                </h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSpecQuality('standard')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      specQuality === 'standard'
                        ? 'border-[#07558F] bg-[#07558F]/5 ring-1 ring-[#07558F]'
                        : 'border-[#DDDAD1]/80 hover:border-gray-400 bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="font-bold text-[#111822]">CPWD Standard Spec</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Vitrified tiles, flush doors, acrylic distemper</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSpecQuality('premium')}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      specQuality === 'premium'
                        ? 'border-[#07558F] bg-[#07558F]/5 ring-1 ring-[#07558F]'
                        : 'border-[#DDDAD1]/80 hover:border-gray-400 bg-[#FAF9F6]'
                    }`}
                  >
                    <div className="font-bold text-[#111822]">Premium Architectural (+15%)</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">Granite/marble, teak frames, premium emulsion</div>
                  </button>
                </div>
              </div>

            </div>

            {/* Right Column: Indicative Cost & Duration Summary (5 Cols) */}
            <div className="lg:col-span-5 space-y-6 sticky top-28">
              <div className="bg-white p-6 rounded-2xl border border-[#DDDAD1]/80 shadow-md space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#DDDAD1]/50">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#07558F] text-[22px]">domain</span>
                    <h2 className="font-display text-base font-bold text-[#111822]">
                      Plinth Area Cost Summary
                    </h2>
                  </div>
                  <span className="font-mono text-[11px] font-bold bg-[#07558F]/10 text-[#07558F] px-2.5 py-0.5 rounded-full">
                    PAR 2025
                  </span>
                </div>

                {/* Big Rate Per Sq.Ft Callout */}
                <div className="p-4 bg-[#FAF9F6] rounded-xl border border-[#DDDAD1]/70 text-center space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-gray-500">
                    Indicative Turnkey Plinth Rate
                  </span>
                  <div className="font-mono text-2xl font-extrabold text-[#07558F]">
                    ₹{adjustedRateMinSqft.toLocaleString('en-IN')} – ₹{adjustedRateMaxSqft.toLocaleString('en-IN')}
                    <span className="text-xs font-normal text-gray-500"> / sq.ft</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono">
                    Based on {activeBuilding.name} in {activeLocation.name}
                  </div>
                </div>

                {/* Grand Total Estimated Cost Range */}
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/80 text-center space-y-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-800 font-semibold">
                    Estimated Project Cost Range
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-extrabold text-emerald-900">
                    ₹{(plinthEstimatedCostMin / 100000).toFixed(2)} Lakh – ₹{(plinthEstimatedCostMax / 100000).toFixed(2)} Lakh
                  </div>
                  <div className="text-[10px] font-mono text-emerald-700">
                    ₹{plinthEstimatedCostMin.toLocaleString('en-IN')} to ₹{plinthEstimatedCostMax.toLocaleString('en-IN')}
                  </div>
                </div>

                {/* Floor-wise Breakdown Table */}
                <div className="space-y-2">
                  <span className="text-[11px] font-mono uppercase font-bold text-gray-500 block">
                    Floor-Wise Breakdown:
                  </span>
                  <div className="border border-gray-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#FAF9F6] border-b border-gray-100 text-[10px] uppercase font-mono text-gray-500">
                        <tr>
                          <th className="p-2.5">Level</th>
                          <th className="p-2.5 text-right">Area</th>
                          <th className="p-2.5 text-right">Cost (Min – Max)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {floors.map((f) => {
                          const area = parseFloat(f.areaSqft) || 0;
                          const fMin = Math.round(area * adjustedRateMinSqft);
                          const fMax = Math.round(area * adjustedRateMaxSqft);
                          return (
                            <tr key={f.id} className="text-gray-700 font-mono">
                              <td className="p-2.5 font-sans font-semibold text-gray-800">{f.name}</td>
                              <td className="p-2.5 text-right">{area} sq ft</td>
                              <td className="p-2.5 text-right text-[#07558F] font-bold">
                                ₹{(fMin / 100000).toFixed(1)}L – ₹{(fMax / 100000).toFixed(1)}L
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Indicative Duration Card */}
                <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#DDDAD1]/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <FiCalendar className="text-[#07558F] text-base" />
                    <div>
                      <div className="font-semibold text-gray-800">Estimated Duration</div>
                      <div className="text-[10px] text-gray-500">Structural &amp; turnkey handover</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-[#07558F] text-sm">
                    <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Duration not available (Pending engineering sign-off)</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-2">
                  <Link
                    to={`/book-inspection?type=plinth-estimate&building=${selectedBuildingId}&area=${totalPlinthAreaSqft}&est=${Math.round(plinthEstimatedCostMin)}`}
                    className="w-full py-3 bg-[#07558F] text-white rounded-xl text-xs font-bold uppercase tracking-wider text-center block hover:bg-[#054370] transition-colors shadow-sm"
                  >
                    Book Site Inspection &amp; Soil Check →
                  </Link>

                  <button
                    type="button"
                    onClick={handleExportPlinthCSV}
                    className="w-full py-2.5 px-3 bg-white border border-[#D5D3C8] hover:bg-neutral-50 rounded-xl text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <FiDownload className="w-3.5 h-3.5 text-[#07558F]" />
                    <span>Download Plinth Summary (CSV)</span>
                  </button>
                </div>

              </div>

              {/* Statutory Footnote */}
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#DDDAD1]/70 text-[11px] text-gray-600 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-[#07558F]">
                  <FiInfo className="w-3.5 h-3.5 shrink-0" />
                  <span>CPWD PAR 2025 Standards Basis</span>
                </div>
                <p className="leading-relaxed">
                  Based on Central Public Works Department Plinth Area Rates 2025 (dated 31 July 2025) and Correction Slip No. 1. Turnkey rates include civil works, internal water supply, sanitary installations, and internal electrical wiring. Soil conditions and structural architectural designs may warrant revisions.
                </p>
              </div>

            </div>

          </div>
        </section>
      )}

    </div>
  );
}
