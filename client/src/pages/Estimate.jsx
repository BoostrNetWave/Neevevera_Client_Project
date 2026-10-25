import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiCheck,
  FiFileText,
  FiDownload,
  FiShare2,
  FiSliders,
  FiArrowRight,
  FiInfo,
} from 'react-icons/fi';
import { DSR_ITEMS, DSR_CATEGORIES } from '../data/dsrRates';

export default function Estimate() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [unitMode, setUnitMode] = useState('metric'); // 'metric' (sqm/cum) or 'imperial' (sqft)
  const [contractorMargin, setContractorMargin] = useState(18); // 15% to 20%
  const [basket, setBasket] = useState([]); // [{ itemNo, qty, customRate }]
  const [itemQuantities, setItemQuantities] = useState({}); // local input states for items
  const [copiedLink, setCopiedLink] = useState(false);

  // Normalized search query helper with typo-tolerance for 'paiting' -> 'painting'
  const normalizedQuery = searchQuery.trim().toLowerCase().replace(/paiting/g, 'painting');

  // Filter items
  const filteredItems = useMemo(() => {
    return DSR_ITEMS.filter((item) => {
      const matchCat =
        selectedCategory === 'All Categories' || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!normalizedQuery) return true;

      const fullText = [
        item.itemNo,
        item.title,
        item.desc,
        item.category,
        item.subhead,
        item.unit,
        ...(item.keywords || []),
      ]
        .join(' ')
        .toLowerCase();

      // Check direct inclusion or token match
      const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
      return tokens.every((token) => fullText.includes(token));
    });
  }, [selectedCategory, normalizedQuery]);

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
    const qty = itemQuantities[item.itemNo] || 100; // default 100 if empty
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
      // 2BHK Full Painting: Putty + Primer + 2 Coats Acrylic Emulsion
      const putty = DSR_ITEMS.find((i) => i.itemNo === '13.80.1');
      const primer = DSR_ITEMS.find((i) => i.itemNo === '13.41.1');
      const interior = DSR_ITEMS.find((i) => i.itemNo === '13.43.1');
      const exterior = DSR_ITEMS.find((i) => i.itemNo === '13.90.1');

      setBasket([
        { ...putty, qty: 350 },
        { ...primer, qty: 350 },
        { ...interior, qty: 350 },
        { ...exterior, qty: 150 },
      ]);
      setSearchQuery('painting');
    } else if (templateName === 'slab') {
      // 1000 sqft RCC Slab: M20 concrete + TMT steel + Shuttering
      const concrete = DSR_ITEMS.find((i) => i.itemNo === '4.1.3');
      const steel = DSR_ITEMS.find((i) => i.itemNo === '5.22.6');
      const shuttering = DSR_ITEMS.find((i) => i.itemNo === '5.9.1');

      setBasket([
        { ...concrete, qty: 12 },
        { ...steel, qty: 1100 },
        { ...shuttering, qty: 95 },
      ]);
      setSearchQuery('concrete');
    }
  };

  // Calculations
  const baseTotal = useMemo(() => {
    return basket.reduce((acc, item) => {
      const activeRate =
        unitMode === 'imperial' && item.rateSqft ? item.rateSqft : item.rate;
      return acc + activeRate * item.qty;
    }, 0);
  }, [basket, unitMode]);

  const marginAmount = (baseTotal * contractorMargin) / 100;
  const grandTotal = baseTotal + marginAmount;

  // Export to CSV
  const handleExportCSV = () => {
    if (basket.length === 0) return;
    const headers = ['Item Code', 'Category', 'Description', 'Unit', 'Rate (INR)', 'Quantity', 'Subtotal (INR)'];
    const rows = basket.map((item) => {
      const rate = unitMode === 'imperial' && item.rateSqft ? item.rateSqft : item.rate;
      const sub = rate * item.qty;
      return [
        `"${item.itemNo}"`,
        `"${item.category}"`,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.unit}"`,
        rate.toFixed(2),
        item.qty,
        sub.toFixed(2),
      ].join(',');
    });

    const summaryRows = [
      '',
      `"Base DSR Material & Labour Subtotal",,,,,,${baseTotal.toFixed(2)}`,
      `"Contractor Overhead & Margin (${contractorMargin}%)",,,,,,${marginAmount.toFixed(2)}`,
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

  return (
    <div className="w-full bg-[#FAF9F6] min-h-screen text-[#171717] pb-16">
      <Helmet>
        <title>DSR Rate Calculator & Civil Cost Estimator | Neevevera Private Limited</title>
        <meta
          name="description"
          content="Calculate painting, civil construction, RCC, brickwork, and structural rates using Central Public Works Department (CPWD) DSR schedule with real-time contractor margins."
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
            <span className="text-[#111822] font-semibold">DSR Rate Calculator</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-[#07558F] bg-[#07558F]/10 px-2.5 py-0.5 rounded-full font-bold">
              CPWD DSR SCHEDULE ARCHITECTURE
            </span>
          </div>
        </div>
      </div>

      {/* ── Hero Banner ── */}
      <section className="pt-8 pb-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-[#E3E2DA]">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#07558F]/10 text-[#07558F] rounded-full text-[11px] font-bold font-mono uppercase tracking-wider mb-2">
              <span className="material-symbols-outlined text-[15px]">calculate</span>
              <span>ESTA SOFTWARE-COMPLIANT DSR RATE ENGINE</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-[#111822] tracking-tight">
              Interactive Project Cost &amp; Rate Calculator
            </h1>
            <p className="text-sm sm:text-base text-[#4B5563] mt-2 max-w-3xl leading-relaxed">
              Search official Delhi Schedule of Rates (DSR) items for painting, civil construction, RCC, and finishes. Enter your site dimensions or quantities to calculate transparent project estimates with statutory contractor margins.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="shrink-0 flex flex-wrap sm:flex-nowrap gap-2 items-center">
            <button
              type="button"
              onClick={() => loadTemplate('painting')}
              className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-[#07558F] border border-[#07558F]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#07558F]">format_paint</span>
              <span>2BHK Painting Template</span>
            </button>
            <button
              type="button"
              onClick={() => loadTemplate('slab')}
              className="px-3.5 py-2 bg-white hover:bg-neutral-50 text-[#07558F] border border-[#07558F]/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px] text-[#07558F]">foundation</span>
              <span>RCC Slab Casting</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Workbench ── */}
      <section className="pt-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder='Search by item keyword (e.g. "painting", "acrylic", "concrete", "steel", "brick", "putty") or code "13.43.1"...'
                  className="w-full pl-12 pr-10 py-3.5 bg-[#FAF9F6] border border-[#D5D3C8] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#07558F] font-medium text-[#111822] placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
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
                  Showing <strong className="text-[#111822]">{filteredItems.length}</strong> items found
                </div>
              </div>

              {/* Category Pills Bar */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                {DSR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
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
                  const activeUnit =
                    unitMode === 'imperial' && item.rateSqft
                      ? 'sq.ft'
                      : item.unit;
                  const itemCost = activeRate * defaultVal;
                  const itemCostWithMargin = itemCost * (1 + contractorMargin / 100);
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

                        {/* Standard Base Rate Badge */}
                        <div className="shrink-0 text-left sm:text-right bg-[#FAF9F6] p-3 rounded-xl border border-[#DDDAD1]/60">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 block">
                            CPWD DSR Base Rate
                          </span>
                          <div className="font-mono text-lg font-bold text-[#111822]">
                            ₹{activeRate.toFixed(2)}
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
                        {/* Area / Quantity Input */}
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

                        {/* Computed Cost for this Item */}
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-gray-500 uppercase block">
                              Calculated Cost (+{contractorMargin}% Margin)
                            </span>
                            <span className="font-mono text-base font-extrabold text-[#07558F]">
                              ₹{itemCostWithMargin.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                            </span>
                          </div>

                          {/* Add to Basket Button */}
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
          </div>

          {/* Right Column: Sticky Project BOQ Basket & Summary (4 Cols) */}
          <div className="lg:col-span-4 space-y-6 sticky top-28">

            {/* Project BOQ Card */}
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
                    const sub = activeRate * item.qty;

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
                            <span>{unitMode === 'imperial' && item.rateSqft ? 'sq.ft' : item.unit}</span>
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

              {/* Contractor Margin Slider (PRD Requirement: 15% to 20%) */}
              <div className="p-3.5 bg-[#FAF9F6] rounded-xl border border-[#DDDAD1]/70 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
                    <FiSliders className="w-3.5 h-3.5 text-[#07558F]" />
                    <span>Contractor Profit &amp; Overhead</span>
                  </div>
                  <span className="font-mono font-bold text-[#07558F] text-xs">
                    {contractorMargin}%
                  </span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="20"
                  step="0.5"
                  value={contractorMargin}
                  onChange={(e) => setContractorMargin(parseFloat(e.target.value))}
                  className="w-full accent-[#07558F] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                  <span>15% (Institutional/Large)</span>
                  <span>18% (Standard)</span>
                  <span>20% (Turnkey)</span>
                </div>
              </div>

              {/* Cost Summary Breakdown */}
              <div className="space-y-2 pt-2 border-t border-gray-100 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Base DSR Schedule Cost:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    ₹{baseTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Contractor Margin ({contractorMargin}%):</span>
                  <span className="font-mono font-semibold text-gray-900">
                    +₹{marginAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="pt-2 border-t border-gray-200 flex justify-between items-baseline">
                  <span className="font-bold text-sm text-[#111822]">Total Indicative Estimate:</span>
                  <span className="font-mono text-xl font-extrabold text-[#07558F]">
                    ₹{grandTotal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </span>
                </div>
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
    </div>
  );
}
