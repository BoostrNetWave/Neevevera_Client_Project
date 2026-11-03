import { useState, useEffect, useCallback } from 'react';
import adminApi from '../../utils/adminApi';

const CATEGORIES = [
  'All Categories',
  'Finishing & Painting',
  'Concrete & RCC Work',
  'Reinforcement Steel',
  'Brickwork & Masonry',
  'Earthwork & Excavation',
  'Flooring & Tiling',
  'Waterproofing & Roofing',
  'Structural Steel & Fabrication',
  'Plumbing & Drainage',
  'Electrical & Conduits',
  'Woodwork & Doors',
];

const AdminDsrRates = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [meta, setMeta] = useState({ total: 0, activeCount: 0, verifiedCount: 0 });
  const [settings, setSettings] = useState({ loadingMin: 15, loadingMax: 20, locationIndex: 100 });
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Audited Override Modal
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideTarget, setOverrideTarget] = useState(null);
  const [overrideBaseRate, setOverrideBaseRate] = useState('');
  const [overrideMinLoading, setOverrideMinLoading] = useState('15');
  const [overrideMaxLoading, setOverrideMaxLoading] = useState('20');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideLoading, setOverrideLoading] = useState(false);

  // Global Settings Modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [globalMinLoading, setGlobalMinLoading] = useState('15');
  const [globalMaxLoading, setGlobalMaxLoading] = useState('20');
  const [globalCostIndex, setGlobalCostIndex] = useState('100');
  const [globalIsActive, setGlobalIsActive] = useState(false);
  const [resetOverrides, setResetOverrides] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(false);

  // User role check for confidential settings and import permissions
  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user') || '{}'); }
    catch { return {}; }
  })();
  const isAdminOrSuper = adminUser?.role === 'admin' || adminUser?.role === 'superadmin';

  // CSV Import & Batch History Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importTab, setImportTab] = useState('upload'); // 'upload' | 'history'
  const [selectedFile, setSelectedFile] = useState(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [allowPartial, setAllowPartial] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [commitResult, setCommitResult] = useState(null);
  const [importHistory, setImportHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [schemaOpen, setSchemaOpen] = useState(false);
  // Stale-response guard: increment before each preview request, check after response
  const uploadSeqRef = useState(() => ({ current: 0 }))[0];

  // Form Fields for Add/Edit
  const [formItemNo, setFormItemNo] = useState('');
  const [formCategory, setFormCategory] = useState('Finishing & Painting');
  const [formChapter, setFormChapter] = useState('');
  const [formSubhead, setFormSubhead] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formUnit, setFormUnit] = useState('sqm');
  const [formUnitLabel, setFormUnitLabel] = useState('Square Meter (m²)');
  const [formSqftFactor, setFormSqftFactor] = useState('10.764');
  const [formSourcePage, setFormSourcePage] = useState('1');
  const [formIsAddOn, setFormIsAddOn] = useState(false);
  const [formBaseRate, setFormBaseRate] = useState('');
  const [formLoadingMin, setFormLoadingMin] = useState('15');
  const [formLoadingMax, setFormLoadingMax] = useState('20');
  const [formCostIndex, setFormCostIndex] = useState('100');
  const [formCoverage, setFormCoverage] = useState('');
  const [formTypicalBrands, setFormTypicalBrands] = useState('');
  const [formKeywords, setFormKeywords] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formIsVerified, setFormIsVerified] = useState(true);

  // Live preview for modal
  const previewMin = (() => {
    const base = parseFloat(formBaseRate) || 0;
    const minL = parseFloat(formLoadingMin) || 15;
    const idx = parseFloat(formCostIndex) || 100;
    return Math.round(base * (1 + minL / 100) * (idx / 100) * 100) / 100;
  })();

  const previewMax = (() => {
    const base = parseFloat(formBaseRate) || 0;
    const maxL = parseFloat(formLoadingMax) || 20;
    const idx = parseFloat(formCostIndex) || 100;
    return Math.round(base * (1 + maxL / 100) * (idx / 100) * 100) / 100;
  })();

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { limit: 200 };
      if (selectedCategory !== 'All Categories') params.category = selectedCategory;
      if (search.trim()) params.search = search.trim();

      const res = await adminApi.get('/dsr/admin/items', { params });
      setItems(res.data.data || []);
      setMeta(res.data.meta || { total: 0, activeCount: 0, verifiedCount: 0 });
      if (res.data.settings) {
        setSettings(res.data.settings);
        setGlobalMinLoading(String(res.data.settings.loadingMin || 15));
        setGlobalMaxLoading(String(res.data.settings.loadingMax || 20));
        setGlobalCostIndex(String(res.data.settings.locationIndex || 100));
        setGlobalIsActive(Boolean(res.data.settings.isEstimatorActive));
      }
    } catch (err) {
      console.error('Failed to load DSR rates:', err);
      setError('Failed to load DSR rates from server.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormItemNo('');
    setFormCategory('Finishing & Painting');
    setFormChapter('13. Finishing');
    setFormSubhead('');
    setFormTitle('');
    setFormDesc('');
    setFormUnit('sqm');
    setFormUnitLabel('Square Meter (m²)');
    setFormSqftFactor('10.764');
    setFormSourcePage('1');
    setFormIsAddOn(false);
    setFormBaseRate('');
    setFormLoadingMin('15');
    setFormLoadingMax('20');
    setFormCostIndex('100');
    setFormCoverage('');
    setFormTypicalBrands('');
    setFormKeywords('');
    setFormIsActive(true);
    setFormIsVerified(true);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormItemNo(item.itemNo || '');
    setFormCategory(item.category || 'Finishing & Painting');
    setFormChapter(item.chapter || item.category || '');
    setFormSubhead(item.subhead || '');
    setFormTitle(item.title || '');
    setFormDesc(item.desc || '');
    setFormUnit(item.unit || 'sqm');
    setFormUnitLabel(item.unitLabel || '');
    setFormSqftFactor(item.sqftFactor ? String(item.sqftFactor) : '1');
    setFormSourcePage(item.sourcePage ? String(item.sourcePage) : '1');
    setFormIsAddOn(Boolean(item.isAddOn));
    setFormBaseRate(item.baseRate !== undefined ? String(item.baseRate) : '');
    setFormLoadingMin(item.loadingMin !== undefined ? String(item.loadingMin) : '15');
    setFormLoadingMax(item.loadingMax !== undefined ? String(item.loadingMax) : '20');
    setFormCostIndex(item.costIndex !== undefined ? String(item.costIndex) : '100');
    setFormCoverage(item.coverage || '');
    setFormTypicalBrands(item.typicalBrands || '');
    setFormKeywords(Array.isArray(item.keywords) ? item.keywords.join(', ') : '');
    setFormIsActive(item.isActive !== false);
    setFormIsVerified(item.isVerified !== false);
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenOverride = (item) => {
    setOverrideTarget(item);
    setOverrideBaseRate(String(item.baseRate || ''));
    setOverrideMinLoading(String(item.loadingMin || 15));
    setOverrideMaxLoading(String(item.loadingMax || 20));
    setOverrideReason('');
    setIsOverrideModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    setModalError('');

    try {
      const payload = {
        itemNo: formItemNo.trim(),
        category: formCategory,
        chapter: formChapter.trim(),
        subhead: formSubhead.trim(),
        title: formTitle.trim(),
        desc: formDesc.trim(),
        unit: formUnit.trim(),
        unitLabel: formUnitLabel.trim(),
        sqftFactor: parseFloat(formSqftFactor) || 1,
        sourcePage: parseInt(formSourcePage, 10) || 1,
        isAddOn: formIsAddOn,
        baseRate: parseFloat(formBaseRate),
        loadingMin: parseFloat(formLoadingMin) || 15,
        loadingMax: parseFloat(formLoadingMax) || 20,
        costIndex: parseFloat(formCostIndex) || 100,
        coverage: formCoverage.trim(),
        typicalBrands: formTypicalBrands.trim(),
        keywords: formKeywords.split(',').map((k) => k.trim()).filter(Boolean),
        isActive: formIsActive,
        isVerified: formIsVerified,
      };

      if (editingItem) {
        await adminApi.put(`/dsr/admin/items/${editingItem._id}`, payload);
      } else {
        await adminApi.post('/dsr/admin/items', payload);
      }

      setIsModalOpen(false);
      fetchItems();
    } catch (err) {
      console.error('Save failed:', err);
      setModalError(err.response?.data?.error || 'Failed to save DSR item.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleApplyOverride = async (e) => {
    e.preventDefault();
    if (!overrideReason.trim()) {
      alert('An audit reason is required.');
      return;
    }
    setOverrideLoading(true);
    try {
      await adminApi.patch(`/dsr/admin/items/${overrideTarget._id}/override`, {
        baseRate: parseFloat(overrideBaseRate),
        loadingMin: parseFloat(overrideMinLoading),
        loadingMax: parseFloat(overrideMaxLoading),
        reason: overrideReason.trim(),
      });
      setIsOverrideModalOpen(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to apply override.');
    } finally {
      setOverrideLoading(false);
    }
  };  const handleToggleVerified = async (item) => {
    try {
      await adminApi.patch(`/dsr/admin/items/${item._id}/status`, {
        isVerified: !item.isVerified,
      });
      fetchItems();
    } catch {
      alert('Failed to update verification status.');
    }
  };

  const handleToggleActive = async (item) => {
    try {
      await adminApi.patch(`/dsr/admin/items/${item._id}/status`, {
        isActive: !item.isActive,
      });
      fetchItems();
    } catch {
      alert('Failed to update active status.');
    }
  };

  const handleDeleteItem = async (id, itemNo) => {
    if (!window.confirm(`Are you sure you want to delete item ${itemNo}?`)) return;
    try {
      await adminApi.delete(`/dsr/admin/items/${id}`);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete item.');
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (resetOverrides) {
      const confirmed = window.confirm(
        'WARNING: You have selected to reset all audited per-item overrides. Are you sure you want to overwrite custom rates with global settings?'
      );
      if (!confirmed) return;
    }
    setSettingsLoading(true);
    try {
      const res = await adminApi.put('/dsr/admin/settings', {
        loadingMin: parseFloat(globalMinLoading),
        loadingMax: parseFloat(globalMaxLoading),
        locationIndex: parseFloat(globalCostIndex),
        isEstimatorActive: globalIsActive,
        resetCustomOverrides: resetOverrides,
      });
      // B3: Toggle only reports success after stored setting is saved
      alert(res.data.message || 'Settings saved successfully.');
      setIsSettingsModalOpen(false);
      setResetOverrides(false);
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update settings.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await adminApi.get('/dsr/admin/export-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Neevevera_DSR_2023_Rates_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download CSV export.');
    }
  };

  // CSV Import Action Handlers
  const handleOpenImport = () => {
    setIsImportModalOpen(true);
    setImportTab('upload');
    setSelectedFile(null);
    setImportError('');
    setPreviewData(null);
    setAllowPartial(false);
    setCommitResult(null);
    setSchemaOpen(false);
    setIsDragOver(false);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await adminApi.get('/dsr/admin/import-csv/template', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Neevevera_DSR_Import_Template.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      alert('Failed to download canonical import template.');
    }
  };

  // Accept a File object directly — used by both drag-drop and hidden file input.
  // Auto-triggers preview immediately; uses sequence counter to discard stale responses.
  const handleAcceptFile = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setImportError('Invalid file type. Only .csv files are accepted.');
      setSelectedFile(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImportError(`File too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Maximum size is 5 MB.`);
      setSelectedFile(null);
      return;
    }

    // Increment sequence so any in-flight response from a previous file is ignored.
    const thisSeq = ++uploadSeqRef.current;

    setImportError('');
    setSelectedFile(file);
    setPreviewData(null);
    setCommitResult(null);
    setAllowPartial(false);
    setImportLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await adminApi.post('/dsr/admin/import-csv/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Discard if a newer file was selected while this request was in-flight
      if (thisSeq !== uploadSeqRef.current) return;
      setPreviewData(res.data);
    } catch (err) {
      if (thisSeq !== uploadSeqRef.current) return;
      console.error('Preview upload failed:', err);
      const errMsg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        'Failed to process CSV preview on server.';
      setImportError(errMsg);
      if (err.response?.data?.errors?.length) {
        setPreviewData({
          summary: {
            totalRows: 0,
            newCount: 0,
            updateCount: 0,
            conflictCount: 0,
            unchangedCount: 0,
            invalidCount: err.response.data.errors.length,
          },
          items: [],
          errors: err.response.data.errors,
        });
      }
    } finally {
      if (thisSeq === uploadSeqRef.current) setImportLoading(false);
    }
  };

  // Hidden file-input onChange
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    // Reset so the same file can be re-selected after clearing
    e.target.value = '';
    handleAcceptFile(file);
  };

  // Drag-and-drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    handleAcceptFile(file);
  };

  const handleCommitBatch = async () => {
    if (!previewData?.batchId) return;

    const hasInvalid = (previewData.summary?.invalidCount || 0) > 0;
    if (hasInvalid && !allowPartial) {
      alert('This batch has invalid rows. Resolve the errors in your CSV or check "Allow partial import" to proceed.');
      return;
    }

    const { newCount = 0, updateCount = 0, conflictCount = 0 } = previewData.summary || {};

    const confirmed = window.confirm(
      `Confirm CSV Import:\n\n` +
      `• ${newCount} new items will be created as UNVERIFIED (isolated from public quotes).\n` +
      `• ${updateCount} existing unverified items will be updated with audit tracking.\n` +
      `• ${conflictCount} verified items will be PROTECTED and left untouched.\n` +
      (hasInvalid ? `• ${previewData.summary.invalidCount} invalid rows will be SKIPPED.\n\n` : '\n') +
      `Do you want to proceed with committing this batch?`
    );
    if (!confirmed) return;

    setCommitLoading(true);
    setImportError('');

    try {
      const res = await adminApi.post(`/dsr/admin/import-csv/${previewData.batchId}/commit`, {
        allowPartial,
      });
      setCommitResult(res.data);
      fetchItems();
    } catch (err) {
      console.error('Commit failed:', err);
      setImportError(err.response?.data?.error || 'Failed to commit import batch.');
    } finally {
      setCommitLoading(false);
    }
  };

  const fetchImportHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await adminApi.get('/dsr/admin/import-csv/history');
      setImportHistory(res.data.data || []);
    } catch (err) {
      console.error('Failed to load import history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSwitchTab = (tab) => {
    setImportTab(tab);
    if (tab === 'history') {
      fetchImportHistory();
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-neutral">
        <div>
          <h1 className="text-xl font-display font-bold text-graphite uppercase tracking-tight">
            DSR 2023 Rate Library & CMS
          </h1>
          <p className="text-xs text-soft-grey mt-0.5">
            CPWD DSR 2023 source rates, audited overrides, contractor loading range (15%–20%), and client quote ranges.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdminOrSuper && (
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-warm text-graphite hover:bg-border-neutral text-xs font-semibold font-display uppercase tracking-wider transition-colors border border-border-neutral"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              Loading Settings
            </button>
          )}
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-warm text-graphite hover:bg-border-neutral text-xs font-semibold font-display uppercase tracking-wider transition-colors border border-border-neutral"
          >
            <span className="material-symbols-outlined text-[16px]">download</span>
            Export CSV
          </button>
          {isAdminOrSuper && (
            <button
              onClick={handleOpenImport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-surface-warm text-graphite hover:bg-border-neutral text-xs font-semibold font-display uppercase tracking-wider transition-colors border border-border-neutral"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              Import CSV
            </button>
          )}
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-brand-blue text-white hover:bg-brand-blue/90 text-xs font-semibold font-display uppercase tracking-wider transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add Item
          </button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-sm border border-border-neutral shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-soft-grey font-display">
            Total DSR Items
          </div>
          <div className="text-2xl font-bold font-display text-graphite mt-1">{meta.total}</div>
        </div>
        <div className="bg-white p-4 rounded-sm border border-border-neutral shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-soft-grey font-display">
            Verified for Public UI
          </div>
          <div className="text-2xl font-bold font-display text-emerald-600 mt-1">{meta.verifiedCount}</div>
        </div>
        {isAdminOrSuper ? (
          <div className="bg-white p-4 rounded-sm border border-border-neutral shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-widest text-soft-grey font-display">
              Loading Range
            </div>
            <div className="text-2xl font-bold font-display text-brand-blue mt-1">
              {settings.loadingMin || 15}% – {settings.loadingMax || 20}%
            </div>
          </div>
        ) : (
          <div className="bg-white p-4 rounded-sm border border-border-neutral shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-widest text-soft-grey font-display">
              Pricing Configuration
            </div>
            <div className="text-xs font-semibold text-soft-grey mt-2">
              Confidential (Admin Only)
            </div>
          </div>
        )}
        <div className="bg-white p-4 rounded-sm border border-border-neutral shadow-xs">
          <div className="text-[10px] font-bold uppercase tracking-widest text-soft-grey font-display">
            Estimator Kill-Switch
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-block w-2.5 h-2.5 rounded-full ${settings.isEstimatorActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span className={`text-sm font-bold font-display ${settings.isEstimatorActive ? 'text-emerald-700' : 'text-red-600'}`}>
              {settings.isEstimatorActive ? 'ONLINE' : 'OFFLINE (503)'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Pricing Protection Notice ── */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded p-3 text-xs text-amber-900 flex items-start gap-2.5">
        <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">security</span>
        <div>
          <span className="font-semibold">Security Rule Enforced: </span>
          Public visitors only see the loaded price range (e.g. ₹115.00 – ₹120.00). Base rates, loading percentages, and cost indices are never sent across the public API.
        </div>
      </div>

      {/* ── Search & Filter Bar ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded border border-border-neutral">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-soft-grey text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Search code, title, specification..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-border-neutral rounded bg-surface-white focus:outline-none focus:border-brand-blue"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-soft-grey shrink-0">Category:</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-border-neutral rounded px-2.5 py-1.5 bg-surface-white focus:outline-none focus:border-brand-blue"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Data Table ── */}
      {loading ? (
        <div className="py-12 text-center text-xs text-soft-grey">Loading DSR rates...</div>
      ) : error ? (
        <div className="py-6 text-center text-xs text-red-600 bg-red-50 border border-red-200 rounded">{error}</div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-xs text-soft-grey bg-white rounded border border-border-neutral">
          No DSR items found matching your filters.
        </div>
      ) : (
        <div className="bg-white rounded border border-border-neutral overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF9F6] border-b border-border-neutral text-graphite font-display uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4 font-bold">Code & Page</th>
                  <th className="py-3 px-4 font-bold">Title & Description</th>
                  <th className="py-3 px-3 font-bold">Category</th>
                  <th className="py-3 px-3 font-bold">Unit</th>
                  <th className="py-3 px-3 font-bold text-right text-amber-800">Base DSR (₹)</th>
                  <th className="py-3 px-4 font-bold text-right text-emerald-700">Quoted Range (₹)</th>
                  <th className="py-3 px-3 font-bold text-center">Verified</th>
                  <th className="py-3 px-3 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-neutral">
                {items.map((item) => (
                  <tr key={item._id} className="hover:bg-surface-warm/40 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-mono font-semibold text-brand-blue">{item.itemNo}</div>
                      <div className="text-[10px] text-soft-grey">PDF p. {item.sourcePage || 1}</div>
                    </td>
                    <td className="py-3 px-4 max-w-sm">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-graphite line-clamp-1">{item.title}</span>
                        {item.isAddOn && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                            Add-on
                          </span>
                        )}
                        {item.overrides && item.overrides.length > 0 && (
                          <span className="shrink-0 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200" title="Audited override active">
                            Overridden
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-soft-grey line-clamp-1 mt-0.5">{item.subhead || item.desc}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-soft-grey text-[11px]">{item.category}</td>
                    <td className="py-3 px-3 uppercase text-[11px] font-mono text-soft-grey">{item.unit}</td>
                    <td className="py-3 px-3 text-right font-mono text-amber-800 font-medium">
                      ₹{Number(item.baseRate).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                      ₹{Number(item.clientRateMin || item.clientRate).toFixed(2)} – ₹{Number(item.clientRateMax || item.clientRate).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleVerified(item)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                          item.isVerified
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-stone-100 text-stone-500 border border-stone-200'
                        }`}
                        title="Toggle public verification"
                      >
                        {item.isVerified ? 'Verified' : 'Unverified'}
                      </button>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => handleToggleActive(item)}
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                          item.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-red-50 text-red-600 border border-red-200'
                        }`}
                        title="Toggle visibility"
                      >
                        {item.isActive ? 'Active' : 'Hidden'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenOverride(item)}
                        className="p-1 text-soft-grey hover:text-amber-600 transition-colors"
                        title="Audited Rate Override"
                      >
                        <span className="material-symbols-outlined text-[17px]">history_edu</span>
                      </button>
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1 text-soft-grey hover:text-brand-blue transition-colors ml-1"
                        title="Edit Full Details"
                      >
                        <span className="material-symbols-outlined text-[17px]">edit</span>
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item._id, item.itemNo)}
                        className="p-1 text-soft-grey hover:text-red-600 transition-colors ml-1"
                        title="Delete Item"
                      >
                        <span className="material-symbols-outlined text-[17px]">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Item Modal ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-border-neutral shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-border-neutral">
              <h2 className="text-sm font-display font-bold uppercase tracking-tight text-graphite">
                {editingItem ? `Edit DSR Item ${editingItem.itemNo}` : 'Add New DSR 2023 Item'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-soft-grey hover:text-graphite text-lg material-symbols-outlined"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-5 space-y-4 text-xs">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600">{modalError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-graphite mb-1">Item Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 13.43.1"
                    value={formItemNo}
                    onChange={(e) => setFormItemNo(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-graphite mb-1">Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-graphite mb-1">PDF Page</label>
                  <input
                    type="number"
                    value={formSourcePage}
                    onChange={(e) => setFormSourcePage(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-graphite mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acrylic Emulsion Paint (2+ Coats)"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-graphite mb-1">Unit *</label>
                  <input
                    type="text"
                    required
                    placeholder="sqm, cum, kg, point"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-graphite mb-1">Unit Label</label>
                  <input
                    type="text"
                    placeholder="Square Meter (m²)"
                    value={formUnitLabel}
                    onChange={(e) => setFormUnitLabel(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-graphite mb-1">Sqft Factor</label>
                  <input
                    type="number"
                    step="0.001"
                    value={formSqftFactor}
                    onChange={(e) => setFormSqftFactor(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>
              </div>

              {/* Rate Loading Box */}
              <div className="bg-[#FAF9F6] border border-border-neutral rounded p-3.5 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-graphite font-display">
                  Pricing & Indicative Range (15%–20%)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block font-medium text-amber-900 mb-1">Base DSR (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formBaseRate}
                      onChange={(e) => setFormBaseRate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-amber-300 rounded bg-white font-mono text-amber-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-graphite mb-1">Min Loading (%)</label>
                    <input
                      type="number"
                      value={formLoadingMin}
                      onChange={(e) => setFormLoadingMin(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-neutral rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-graphite mb-1">Max Loading (%)</label>
                    <input
                      type="number"
                      value={formLoadingMax}
                      onChange={(e) => setFormLoadingMax(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-neutral rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-graphite mb-1">Cost Index</label>
                    <input
                      type="number"
                      value={formCostIndex}
                      onChange={(e) => setFormCostIndex(e.target.value)}
                      className="w-full px-3 py-1.5 border border-border-neutral rounded bg-white font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-border-neutral flex items-center justify-between">
                  <span className="text-[11px] text-soft-grey font-medium">Customer Quoted Range:</span>
                  <span className="font-mono text-sm font-bold text-emerald-700">
                    ₹{previewMin.toFixed(2)} – ₹{previewMax.toFixed(2)} / {formUnit}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-graphite mb-1">Full Description & Conditions (Never cut off)</label>
                <textarea
                  rows="3"
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsAddOn}
                    onChange={(e) => setFormIsAddOn(e.target.checked)}
                    className="rounded text-brand-blue"
                  />
                  <span className="font-semibold text-graphite">Add-on Item ("Extra for...", "Add for...")</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formIsVerified}
                    onChange={(e) => setFormIsVerified(e.target.checked)}
                    className="rounded text-brand-blue"
                  />
                  <span className="font-semibold text-graphite">Verified for Public Estimator</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-neutral">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-border-neutral text-graphite hover:bg-surface-warm font-semibold font-display uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-4 py-1.5 rounded bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold font-display uppercase tracking-wider disabled:opacity-50"
                >
                  {modalLoading ? 'Saving...' : editingItem ? 'Update Item' : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Audited Override Modal ── */}
      {isOverrideModalOpen && overrideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-border-neutral shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-border-neutral">
              <h2 className="text-sm font-display font-bold uppercase tracking-tight text-graphite">
                Audited Override: {overrideTarget.itemNo}
              </h2>
              <button
                onClick={() => setIsOverrideModalOpen(false)}
                className="text-soft-grey hover:text-graphite text-lg material-symbols-outlined"
              >
                close
              </button>
            </div>

            <form onSubmit={handleApplyOverride} className="p-5 space-y-4 text-xs">
              <p className="text-soft-grey">
                Override the base rate or loading range with audit traceability. The original CPWD value remains preserved in history.
              </p>

              <div>
                <label className="block font-semibold text-graphite mb-1">New Base Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={overrideBaseRate}
                  onChange={(e) => setOverrideBaseRate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-graphite mb-1">Min Loading (%)</label>
                  <input
                    type="number"
                    value={overrideMinLoading}
                    onChange={(e) => setOverrideMinLoading(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-graphite mb-1">Max Loading (%)</label>
                  <input
                    type="number"
                    value={overrideMaxLoading}
                    onChange={(e) => setOverrideMaxLoading(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-graphite mb-1">Audit Reason / Justification *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Approved CPWD Correction Slip 08 Nov 2025 by Chief Engineer"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-neutral">
                <button
                  type="button"
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-border-neutral text-graphite hover:bg-surface-warm font-semibold font-display uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={overrideLoading}
                  className="px-4 py-1.5 rounded bg-amber-600 text-white hover:bg-amber-700 font-semibold font-display uppercase tracking-wider disabled:opacity-50"
                >
                  {overrideLoading ? 'Applying...' : 'Apply & Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Global Settings Modal ── */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-sm border border-border-neutral shadow-lg max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b border-border-neutral">
              <h2 className="text-sm font-display font-bold uppercase tracking-tight text-graphite">
                Global DSR Loading Settings
              </h2>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-soft-grey hover:text-graphite text-lg material-symbols-outlined"
              >
                close
              </button>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-graphite mb-1">Global Min Loading (%)</label>
                  <input
                    type="number"
                    value={globalMinLoading}
                    onChange={(e) => setGlobalMinLoading(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-graphite mb-1">Global Max Loading (%)</label>
                  <input
                    type="number"
                    value={globalMaxLoading}
                    onChange={(e) => setGlobalMaxLoading(e.target.value)}
                    className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-graphite mb-1">Location Cost Index (Odisha Base: 100)</label>
                <input
                  type="number"
                  value={globalCostIndex}
                  onChange={(e) => setGlobalCostIndex(e.target.value)}
                  className="w-full px-3 py-1.5 border border-border-neutral rounded bg-surface-white font-mono"
                />
              </div>

              {/* B3: Authoritative Estimator Kill-Switch Toggle */}
              <div className="pt-2 border-t border-border-neutral">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={globalIsActive}
                    onChange={(e) => setGlobalIsActive(e.target.checked)}
                    className="rounded border-border-neutral text-brand-blue"
                  />
                  <div>
                    <span className="font-semibold text-graphite">Public Estimator Active</span>
                    <p className="text-[11px] text-soft-grey">
                      When unchecked, public search and estimation return HTTP 503 (fail-closed).
                    </p>
                  </div>
                </label>
              </div>

              {/* M1: Override Preservation Notice & Reset Option */}
              <div className="p-3 bg-surface-warm/70 border border-border-neutral rounded text-[11px] space-y-2">
                <div className="font-semibold text-graphite">
                  Per-Item Override Protection ({items.filter((i) => i.overrides && i.overrides.length > 0).length} custom items)
                </div>
                <p className="text-soft-grey">
                  Items with custom audited overrides are preserved by default during global settings updates.
                </p>
                <label className="flex items-center gap-2 cursor-pointer text-amber-900 font-medium pt-1">
                  <input
                    type="checkbox"
                    checked={resetOverrides}
                    onChange={(e) => setResetOverrides(e.target.checked)}
                    className="rounded border-amber-300 text-amber-600"
                  />
                  <span>Reset all per-item overrides to these global values</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-neutral">
                <button
                  type="button"
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-3 py-1.5 rounded border border-border-neutral text-graphite hover:bg-surface-warm font-semibold font-display uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={settingsLoading}
                  className="px-4 py-1.5 rounded bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold font-display uppercase tracking-wider disabled:opacity-50"
                >
                  {settingsLoading ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CSV Import & Bulk History Modal ── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-sm border border-border-neutral shadow-2xl max-w-5xl w-full my-8 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border-neutral shrink-0">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-brand-blue text-[26px]">upload_file</span>
                <div>
                  <h2 className="text-base font-display font-bold uppercase tracking-tight text-graphite">
                    DSR CSV Upload & Bulk Import
                  </h2>
                  <p className="text-[11px] text-soft-grey">
                    Import CPWD DSR rates via canonical CSV. Preview validated server staging before committing.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="text-soft-grey hover:text-graphite text-xl material-symbols-outlined p-1"
                title="Close"
              >
                close
              </button>
            </div>

            {/* Modal Tab Bar */}
            <div className="flex items-center gap-4 px-5 pt-3 border-b border-border-neutral bg-[#FAF9F6] shrink-0">
              <button
                onClick={() => handleSwitchTab('upload')}
                className={`pb-2.5 text-xs font-display font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  importTab === 'upload'
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-soft-grey hover:text-graphite'
                }`}
              >
                Upload & Dry-Run Preview
              </button>
              <button
                onClick={() => handleSwitchTab('history')}
                className={`pb-2.5 text-xs font-display font-bold uppercase tracking-wider transition-colors border-b-2 ${
                  importTab === 'history'
                    ? 'border-brand-blue text-brand-blue'
                    : 'border-transparent text-soft-grey hover:text-graphite'
                }`}
              >
                Import Batch History ({importHistory.length > 0 ? importHistory.length : 'Audit'})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-5 text-xs flex-1">
              {importTab === 'upload' ? (
                <>
                  {/* If Commit Success */}
                  {commitResult ? (
                    <div className="p-6 bg-emerald-50 border border-emerald-200 rounded text-center space-y-4">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-700">
                        <span className="material-symbols-outlined text-2xl">check_circle</span>
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-900 font-display uppercase tracking-wide">
                          Import Committed Successfully
                        </h3>
                        <p className="text-xs text-emerald-800 mt-1 font-mono">
                          Batch ID: {commitResult.batchId}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto pt-2 text-left">
                        <div className="p-3 bg-white rounded border border-emerald-200">
                          <div className="text-[10px] uppercase font-bold text-soft-grey font-display">New Items Added</div>
                          <div className="text-lg font-bold text-emerald-700 font-display mt-0.5">{commitResult.insertedCount}</div>
                        </div>
                        <div className="p-3 bg-white rounded border border-emerald-200">
                          <div className="text-[10px] uppercase font-bold text-soft-grey font-display">Updated (Unverified)</div>
                          <div className="text-lg font-bold text-blue-700 font-display mt-0.5">{commitResult.updatedCount}</div>
                        </div>
                        <div className="p-3 bg-white rounded border border-emerald-200">
                          <div className="text-[10px] uppercase font-bold text-soft-grey font-display">Protected / Skipped</div>
                          <div className="text-lg font-bold text-amber-700 font-display mt-0.5">{commitResult.skippedCount}</div>
                        </div>
                        <div className="p-3 bg-white rounded border border-emerald-200">
                          <div className="text-[10px] uppercase font-bold text-soft-grey font-display">Invalid Skipped</div>
                          <div className="text-lg font-bold text-rose-700 font-display mt-0.5">{commitResult.invalidCount}</div>
                        </div>
                      </div>

                      <div className="text-[11px] text-emerald-800 bg-emerald-100/60 p-2.5 rounded max-w-xl mx-auto">
                        <span className="font-semibold">Security Note:</span> All {commitResult.insertedCount} newly inserted items default to <code className="bg-white px-1 py-0.5 rounded text-emerald-900">isVerified: false</code> and remain isolated from public searches. Existing verified items were strictly protected.
                      </div>

                      <div className="flex items-center justify-center gap-3 pt-3">
                        <button
                          type="button"
                          onClick={handleOpenImport}
                          className="px-4 py-2 rounded bg-white border border-border-neutral text-graphite hover:bg-surface-warm font-semibold font-display uppercase tracking-wider text-xs"
                        >
                          Import Another File
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSwitchTab('history')}
                          className="px-4 py-2 rounded bg-surface-warm border border-border-neutral text-graphite hover:bg-border-neutral font-semibold font-display uppercase tracking-wider text-xs"
                        >
                          View Batch History
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsImportModalOpen(false)}
                          className="px-5 py-2 rounded bg-brand-blue text-white hover:bg-brand-blue/90 font-semibold font-display uppercase tracking-wider text-xs shadow-xs"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ── Collapsed CSV Format Help ── */}
                      <div className="border border-border-neutral rounded overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setSchemaOpen((v) => !v)}
                          className="w-full flex items-center justify-between px-4 py-2.5 bg-[#FAF9F6] hover:bg-surface-warm transition-colors text-left"
                        >
                          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider font-display text-graphite">
                            <span className="material-symbols-outlined text-[16px] text-soft-grey">info</span>
                            CSV Format Requirements
                          </span>
                          <span className="material-symbols-outlined text-[18px] text-soft-grey transition-transform" style={{ transform: schemaOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            expand_more
                          </span>
                        </button>
                        {schemaOpen && (
                          <div className="p-4 border-t border-border-neutral grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="space-y-1.5 md:col-span-2">
                              <div className="text-[11px] font-bold uppercase tracking-wider font-display text-graphite">Required Columns</div>
                              <div className="font-mono text-[11px] bg-[#FAF9F6] p-2 rounded border border-border-neutral text-graphite overflow-x-auto">
                                edition, volume, chapter, itemNo, description, unit, rate, sourcePage
                              </div>
                              <p className="text-[11px] text-soft-grey leading-relaxed">
                                UTF-8 (with or without BOM), comma-separated, quoted multi-line text supported.
                                Item No &amp; Edition uniquely identify records. Max file size: 5 MB.
                              </p>
                            </div>
                            <div className="flex flex-col justify-between">
                              <p className="text-[11px] text-soft-grey">
                                Download the pre-formatted template with reference rows to fill in.
                              </p>
                              <button
                                type="button"
                                onClick={handleDownloadTemplate}
                                className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 rounded text-blue-700 hover:bg-blue-50 font-semibold font-display uppercase tracking-wider text-[11px] transition-colors"
                              >
                                <span className="material-symbols-outlined text-[15px]">download</span>
                                Download Template (.csv)
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Drag & Drop Zone (Step 1) ── */}
                      {(() => {
                        // Hidden file input ref declared inline — avoids adding top-level ref
                        const inputId = 'dsr-csv-file-input';
                        return (
                          <div>
                            {/* Drop zone */}
                            <div
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onDrop={handleDrop}
                              onClick={() => !importLoading && document.getElementById(inputId)?.click()}
                              className={`relative flex flex-col items-center justify-center gap-3 p-8 rounded border-2 border-dashed transition-all cursor-pointer select-none ${
                                isDragOver
                                  ? 'border-brand-blue bg-blue-50/60 scale-[1.01]'
                                  : importLoading
                                  ? 'border-amber-300 bg-amber-50/40 cursor-wait'
                                  : selectedFile && !importError
                                  ? 'border-emerald-400 bg-emerald-50/30'
                                  : importError
                                  ? 'border-rose-400 bg-rose-50/30'
                                  : 'border-border-neutral bg-[#FAF9F6] hover:border-brand-blue/50 hover:bg-blue-50/20'
                              }`}
                            >
                              {importLoading ? (
                                <>
                                  <span className="inline-block w-10 h-10 border-4 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-amber-800 font-display">Uploading &amp; Validating…</div>
                                    <div className="text-[11px] text-amber-700 mt-0.5">{selectedFile?.name}</div>
                                  </div>
                                </>
                              ) : selectedFile && !importError ? (
                                <>
                                  <span className="material-symbols-outlined text-[40px] text-emerald-500">check_circle</span>
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-emerald-800 font-display">{selectedFile.name}</div>
                                    <div className="text-[11px] text-emerald-700 mt-0.5">{(selectedFile.size / 1024).toFixed(1)} KB · Preview loaded below</div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      uploadSeqRef.current++; // invalidate any in-flight preview
                                      setSelectedFile(null);
                                      setPreviewData(null);
                                      setImportError('');
                                      setCommitResult(null);
                                    }}
                                    className="text-[11px] text-rose-600 hover:underline font-semibold mt-1"
                                  >
                                    ✕ Remove file
                                  </button>
                                </>
                              ) : importError && !previewData ? (
                                <>
                                  <span className="material-symbols-outlined text-[40px] text-rose-500">error</span>
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-rose-800 font-display">File rejected</div>
                                    <div className="text-[11px] text-rose-700 mt-0.5">{importError}</div>
                                  </div>
                                  <span className="text-[11px] text-soft-grey mt-1">Drop another file or click to browse</span>
                                </>
                              ) : (
                                <>
                                  <span className="material-symbols-outlined text-[48px] text-soft-grey">{isDragOver ? 'file_download' : 'upload_file'}</span>
                                  <div className="text-center">
                                    <div className="text-sm font-semibold text-graphite font-display">
                                      {isDragOver ? 'Drop your CSV file here' : 'Drag & drop your CSV file here'}
                                    </div>
                                    <div className="text-[11px] text-soft-grey mt-0.5">or click to browse · CSV only · max 5 MB</div>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Accessible hidden file input */}
                            <input
                              id={inputId}
                              type="file"
                              accept=".csv,text/csv"
                              className="sr-only"
                              tabIndex={-1}
                              onChange={handleFileChange}
                            />
                          </div>
                        );
                      })()}

                      {/* General Error Banner (shown only when preview data is also present, e.g. row-level failures) */}
                      {importError && previewData && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 flex items-start gap-2">
                          <span className="material-symbols-outlined text-[18px] text-red-600 shrink-0 mt-0.5">error</span>
                          <div>
                            <div className="font-semibold">Import Error</div>
                            <div className="text-[11px] mt-0.5">{importError}</div>
                          </div>
                        </div>
                      )}

                      {/* Dry-Run Preview Results */}
                      {previewData && (
                        <div className="space-y-4 pt-2 border-t border-border-neutral">
                          {/* Batch Metadata Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-stone-50 border border-border-neutral rounded">
                            <div>
                              <div className="font-bold text-graphite font-display uppercase tracking-wide text-xs">
                                Batch Staged: <span className="font-mono text-brand-blue">{previewData.batchId}</span>
                              </div>
                              <div className="text-[11px] text-soft-grey mt-0.5 font-mono">
                                SHA-256: {previewData.fileHash || 'N/A'}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                                Dry-Run Preview (Uncommitted)
                              </span>
                            </div>
                          </div>

                          {/* 6 Summary Counts */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            <div className="p-2.5 bg-white rounded border border-border-neutral text-center">
                              <div className="text-[10px] uppercase font-bold text-soft-grey font-display">Total Rows</div>
                              <div className="text-lg font-bold text-graphite font-display mt-0.5">
                                {previewData.summary?.totalRows || 0}
                              </div>
                            </div>
                            <div className="p-2.5 bg-emerald-50/70 rounded border border-emerald-200 text-center">
                              <div className="text-[10px] uppercase font-bold text-emerald-800 font-display">New Items</div>
                              <div className="text-lg font-bold text-emerald-700 font-display mt-0.5">
                                {previewData.summary?.newCount || 0}
                              </div>
                            </div>
                            <div className="p-2.5 bg-blue-50/70 rounded border border-blue-200 text-center">
                              <div className="text-[10px] uppercase font-bold text-blue-800 font-display">Updates (Unver.)</div>
                              <div className="text-lg font-bold text-blue-700 font-display mt-0.5">
                                {previewData.summary?.updateCount || 0}
                              </div>
                            </div>
                            <div className="p-2.5 bg-amber-50/80 rounded border border-amber-200 text-center" title="Existing verified items are protected and cannot be overwritten">
                              <div className="text-[10px] uppercase font-bold text-amber-900 font-display">Conflicts (Prot.)</div>
                              <div className="text-lg font-bold text-amber-700 font-display mt-0.5">
                                {previewData.summary?.conflictCount || 0}
                              </div>
                            </div>
                            <div className="p-2.5 bg-stone-50 rounded border border-border-neutral text-center">
                              <div className="text-[10px] uppercase font-bold text-soft-grey font-display">Unchanged</div>
                              <div className="text-lg font-bold text-stone-600 font-display mt-0.5">
                                {previewData.summary?.unchangedCount || 0}
                              </div>
                            </div>
                            <div className="p-2.5 bg-rose-50/70 rounded border border-rose-200 text-center">
                              <div className="text-[10px] uppercase font-bold text-rose-800 font-display">Invalid Rows</div>
                              <div className="text-lg font-bold text-rose-700 font-display mt-0.5">
                                {previewData.summary?.invalidCount || 0}
                              </div>
                            </div>
                          </div>

                          {/* Conflict & Protection Notice */}
                          {(previewData.summary?.conflictCount || 0) > 0 && (
                            <div className="p-3 bg-amber-50/90 border border-amber-200 rounded text-amber-900 text-xs flex items-start gap-2">
                              <span className="material-symbols-outlined text-amber-700 text-[18px] shrink-0 mt-0.5">shield</span>
                              <div>
                                <span className="font-semibold">Verified Protection Active: </span>
                                {previewData.summary.conflictCount} item(s) in this CSV match officially verified DSR items. Bulk import will <span className="font-bold underline">NEVER</span> overwrite verified items or custom audited overrides. Matching verified records will be safely preserved.
                              </div>
                            </div>
                          )}

                          {/* Row-Level Errors List */}
                          {previewData.errors?.length > 0 && (
                            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded space-y-2">
                              <div className="flex items-center justify-between text-rose-900 font-bold uppercase tracking-wider text-[11px] font-display">
                                <span className="flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-rose-600">warning</span>
                                  Validation Errors ({previewData.errors.length} rows with issues)
                                </span>
                                <span className="text-[10px] text-rose-700 font-normal">Must fix in CSV or enable Partial Import</span>
                              </div>
                              <div className="max-h-40 overflow-y-auto space-y-1 text-[11px] pr-1">
                                {previewData.errors.map((err, idx) => (
                                  <div key={idx} className="flex items-start gap-2 p-1.5 bg-white/80 rounded border border-rose-100 text-rose-900 font-mono">
                                    <span className="font-bold shrink-0 bg-rose-100 px-1 rounded text-rose-800">
                                      Row {err.rowNumber}
                                    </span>
                                    {err.itemNo && (
                                      <span className="shrink-0 font-semibold text-graphite">[{err.itemNo}]</span>
                                    )}
                                    <span className="text-rose-800">{err.message}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Staged Items Preview Table */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold uppercase tracking-wider font-display text-graphite">
                                Row-by-Row Staging Preview ({previewData.items?.length || 0} rows displayed)
                              </span>
                              <span className="text-[11px] text-soft-grey">
                                Inspect mapped rates and action classification
                              </span>
                            </div>
                            <div className="border border-border-neutral rounded overflow-hidden max-h-72 overflow-y-auto shadow-2xs">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead className="bg-[#FAF9F6] sticky top-0 border-b border-border-neutral text-graphite font-display uppercase tracking-wider text-[10px] z-10">
                                  <tr>
                                    <th className="py-2 px-3 font-bold">#</th>
                                    <th className="py-2 px-3 font-bold">Item No</th>
                                    <th className="py-2 px-3 font-bold">Chapter</th>
                                    <th className="py-2 px-3 font-bold">Description</th>
                                    <th className="py-2 px-2 font-bold">Unit</th>
                                    <th className="py-2 px-2 font-bold text-center">Page</th>
                                    <th className="py-2 px-3 font-bold text-right">CSV Rate (₹)</th>
                                    <th className="py-2 px-3 font-bold text-right">Live Rate (₹)</th>
                                    <th className="py-2 px-3 font-bold text-center">Staged Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border-neutral bg-white font-mono">
                                  {previewData.items?.map((row, idx) => {
                                    let badgeClass = 'bg-stone-100 text-stone-600 border-stone-200';
                                    let badgeText = row.status?.toUpperCase() || 'UNKNOWN';

                                    if (row.status === 'new') {
                                      badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                                      badgeText = 'NEW ITEM';
                                    } else if (row.status === 'update') {
                                      badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                                      badgeText = 'UPDATE';
                                    } else if (row.status === 'conflict') {
                                      badgeClass = 'bg-amber-50 text-amber-800 border-amber-300';
                                      badgeText = 'CONFLICT (PROTECTED)';
                                    } else if (row.status === 'unchanged') {
                                      badgeClass = 'bg-stone-50 text-stone-500 border-stone-200';
                                      badgeText = 'UNCHANGED';
                                    } else if (row.status === 'invalid') {
                                      badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
                                      badgeText = 'INVALID';
                                    }

                                    return (
                                      <tr key={idx} className="hover:bg-surface-warm/30 transition-colors">
                                        <td className="py-2 px-3 text-soft-grey text-[10px]">{row.rowNumber}</td>
                                        <td className="py-2 px-3 font-semibold text-graphite whitespace-nowrap">{row.itemNo}</td>
                                        <td className="py-2 px-3 font-sans text-soft-grey text-[10px] truncate max-w-[120px]">{row.chapter || '-'}</td>
                                        <td className="py-2 px-3 font-sans text-graphite max-w-xs truncate" title={row.desc}>
                                          {row.desc}
                                        </td>
                                        <td className="py-2 px-2 uppercase text-soft-grey">{row.unit}</td>
                                        <td className="py-2 px-2 text-center text-soft-grey">{row.sourcePage || '-'}</td>
                                        <td className="py-2 px-3 text-right font-bold text-graphite">
                                          {row.rate !== undefined && row.rate !== null ? `₹${Number(row.rate).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="py-2 px-3 text-right text-soft-grey">
                                          {row.existingRate !== undefined && row.existingRate !== null ? `₹${Number(row.existingRate).toFixed(2)}` : '-'}
                                        </td>
                                        <td className="py-2 px-3 text-center whitespace-nowrap">
                                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${badgeClass}`}>
                                            {badgeText}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* Commit Controls Bar */}
                          <div className="p-4 bg-[#FAF9F6] border border-border-neutral rounded space-y-3">
                            {(previewData.summary?.invalidCount || 0) > 0 && (
                              <div className="p-3 bg-rose-50 border border-rose-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="text-xs text-rose-900">
                                  <span className="font-bold">Partial Import Mode: </span>
                                  There are {previewData.summary.invalidCount} invalid row(s). Check below to import only valid items and skip errors.
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer font-semibold text-rose-900 shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={allowPartial}
                                    onChange={(e) => setAllowPartial(e.target.checked)}
                                    className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                                  />
                                  <span>Allow partial import</span>
                                </label>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                              <div className="text-[11px] text-soft-grey">
                                Ready to write to live collection: <span className="font-semibold text-graphite">
                                  {(previewData.summary?.newCount || 0) + (previewData.summary?.updateCount || 0)} items
                                </span>
                              </div>
                              <div className="flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPreviewData(null);
                                    setSelectedFile(null);
                                  }}
                                  className="px-3.5 py-1.5 rounded border border-border-neutral text-graphite hover:bg-surface-warm font-semibold font-display uppercase tracking-wider text-xs"
                                >
                                  Clear Preview
                                </button>
                                <button
                                  type="button"
                                  disabled={
                                    commitLoading ||
                                    ((previewData.summary?.invalidCount || 0) > 0 && !allowPartial) ||
                                    ((previewData.summary?.newCount || 0) + (previewData.summary?.updateCount || 0) === 0)
                                  }
                                  onClick={handleCommitBatch}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-emerald-600 text-white hover:bg-emerald-700 font-semibold font-display uppercase tracking-wider text-xs shadow-xs disabled:opacity-50 transition-colors"
                                >
                                  {commitLoading ? (
                                    <>
                                      <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      Committing to Database...
                                    </>
                                  ) : (
                                    <>
                                      <span className="material-symbols-outlined text-[16px]">task_alt</span>
                                      Commit Batch to DSR
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* Import History Tab */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider font-display text-graphite">
                        DSR Import Batch Audit Log
                      </h3>
                      <p className="text-[11px] text-soft-grey mt-0.5">
                        Permanent audit trail of uploaded CSV batches, SHA-256 signatures, and commit outcomes.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={fetchImportHistory}
                      disabled={historyLoading}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border border-border-neutral rounded bg-white hover:bg-surface-warm font-display uppercase tracking-wider text-graphite"
                    >
                      <span className="material-symbols-outlined text-[14px]">refresh</span>
                      Refresh
                    </button>
                  </div>

                  {historyLoading ? (
                    <div className="py-12 text-center text-xs text-soft-grey">Loading batch history...</div>
                  ) : importHistory.length === 0 ? (
                    <div className="py-12 text-center text-xs text-soft-grey bg-[#FAF9F6] rounded border border-border-neutral">
                      No past import batches found.
                    </div>
                  ) : (
                    <div className="border border-border-neutral rounded overflow-hidden max-h-96 overflow-y-auto shadow-2xs">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <thead className="bg-[#FAF9F6] sticky top-0 border-b border-border-neutral text-graphite font-display uppercase tracking-wider text-[10px] z-10">
                          <tr>
                            <th className="py-2.5 px-3 font-bold">Batch ID</th>
                            <th className="py-2.5 px-3 font-bold">Date & Time</th>
                            <th className="py-2.5 px-3 font-bold">Uploader</th>
                            <th className="py-2.5 px-3 font-bold">File Name</th>
                            <th className="py-2.5 px-3 font-bold">SHA-256</th>
                            <th className="py-2.5 px-3 font-bold text-center">Status</th>
                            <th className="py-2.5 px-3 font-bold text-right">Rows</th>
                            <th className="py-2.5 px-3 font-bold">Outcome</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-neutral bg-white font-mono">
                          {importHistory.map((b) => (
                            <tr key={b._id} className="hover:bg-surface-warm/40 transition-colors">
                              <td className="py-2.5 px-3 font-bold text-brand-blue">{b.batchId}</td>
                              <td className="py-2.5 px-3 text-soft-grey whitespace-nowrap font-sans text-[10px]">
                                {new Date(b.createdAt).toLocaleString()}
                              </td>
                              <td className="py-2.5 px-3 font-sans text-graphite">{b.uploaderName || 'Admin'}</td>
                              <td className="py-2.5 px-3 font-sans text-soft-grey max-w-[140px] truncate" title={b.originalFileName}>
                                {b.originalFileName}
                              </td>
                              <td className="py-2.5 px-3 text-[10px] text-soft-grey" title={b.fileHash}>
                                {b.fileHash ? `${b.fileHash.slice(0, 10)}...` : '-'}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                                    b.status === 'committed'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : b.status === 'failed'
                                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                                      : 'bg-stone-100 text-stone-600 border-stone-200'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-graphite">
                                {b.summary?.totalRows || 0}
                              </td>
                              <td className="py-2.5 px-3 font-sans text-[10px] text-soft-grey">
                                {b.status === 'committed' ? (
                                  <span className="text-emerald-800">
                                    +{b.summary?.newCount || 0} new, {b.summary?.updateCount || 0} upd, {b.summary?.conflictCount || 0} prot.
                                  </span>
                                ) : b.status === 'failed' ? (
                                  <span className="text-rose-600">{b.errorMessage || 'Commit failed'}</span>
                                ) : (
                                  <span className="text-stone-500">Staged (uncommitted)</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-4 border-t border-border-neutral bg-[#FAF9F6] shrink-0">
              <div className="text-[11px] text-soft-grey flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[15px] text-emerald-600">verified_user</span>
                All operations audited with admin timestamp and SHA-256 signature.
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-1.5 rounded border border-border-neutral text-graphite hover:bg-white font-semibold font-display uppercase tracking-wider text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDsrRates;
