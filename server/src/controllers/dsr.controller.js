import crypto from 'crypto';
import DsrItem from '../models/DsrItem.js';
import DsrSetting from '../models/DsrSetting.js';
import Enquiry from '../models/Enquiry.js';
import DsrImportBatch from '../models/DsrImportBatch.js';
import DsrStagedItem from '../models/DsrStagedItem.js';
import { parseCsv, normalizeHeader } from '../utils/csvParser.js';
import { resolveReferralAttribution } from '../utils/referralAttribution.js';

export const DSR_CATEGORIES = [
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

/**
 * Helper to get or create global DSR settings
 */
async function getActiveSettings() {
  try {
    let settings = await DsrSetting.findOne({ key: 'global_dsr_settings' });
    if (!settings) {
      settings = await DsrSetting.create({
        key: 'global_dsr_settings',
        loadingMin: 15,
        loadingMax: 20,
        locationIndex: 100,
        indexBase: 100,
        isEstimatorActive: false, // B3: Fail-closed; newly created settings are disabled by default
      });
    }
    return settings;
  } catch (err) {
    // Fail-closed if database error occurs or settings are unreadable
    return { isEstimatorActive: false };
  }
}

/**
 * 1. Public Search Endpoint
 * GET /api/dsr/search?q=&category=&page=
 *
 * CRITICAL REQUIREMENTS:
 * - Debounced search (at most 25 items returned per page)
 * - Returns ONLY active and verified items
 * - Shows indicative loaded price range (e.g. ₹115–₹120)
 * - NEVER leaks baseRate, loadingMin, loadingMax, or costIndex
 */
export const searchPublicDsrItems = async (req, res, next) => {
  try {
    // B3 GUARD: Fail-closed estimator kill-switch
    const settings = await getActiveSettings();
    if (!settings || !settings.isEstimatorActive) {
      return res.status(503).json({
        success: false,
        error: 'Estimator is temporarily unavailable.',
        code: 'ESTIMATOR_DISABLED',
      });
    }

    const { q, category, page = 1, limit = 25 } = req.query;
    const filter = { isActive: true, isVerified: true };

    if (category && category !== 'All Categories' && category !== 'all') {
      filter.category = category;
    }

    if (q && q.trim()) {
      const trimmedQ = q.trim();
      const isItemCodeLike = /^[0-9]+(\.[0-9]+)*/.test(trimmedQ);
      if (isItemCodeLike) {
        const escaped = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        filter.$or = [
          { itemNo: new RegExp(`^${escaped}`, 'i') },
          { title: new RegExp(escaped, 'i') },
          { desc: new RegExp(escaped, 'i') },
          { subhead: new RegExp(escaped, 'i') },
        ];
      } else {
        // Multi-token text search across code, title, desc, subhead, keywords
        const tokens = trimmedQ.split(/\s+/).slice(0, 6).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
        filter.$and = tokens.map((t) => ({
          $or: [
            { itemNo: new RegExp(t, 'i') },
            { title: new RegExp(t, 'i') },
            { desc: new RegExp(t, 'i') },
            { subhead: new RegExp(t, 'i') },
            { keywords: new RegExp(t, 'i') },
          ],
        }));
      }
    }

    const parsedLimit = Math.min(Math.max(1, parseInt(limit, 10) || 25), 100);
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      DsrItem.find(filter)
        .select('itemNo description desc category chapter subhead title unit clientRate clientRateMin clientRateMax clientRateSqft clientRateSqftMin clientRateSqftMax sqftFactor sourcePage isAddOn coverage typicalBrands displayBadge order isActive isEstimatorActive')
        .sort({ order: 1, itemNo: 1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      DsrItem.countDocuments(filter),
    ]);

    // Public allowlisted serializer
    const safeItems = items.map((item) => ({
      _id: item._id,
      itemNo: item.itemNo,
      category: item.category,
      chapter: item.chapter || item.category,
      subhead: item.subhead,
      title: item.title,
      desc: item.desc,
      unit: item.unit,
      unitLabel: item.unitLabel || item.unit,
      sqftFactor: item.sqftFactor || 1,
      sourcePage: item.sourcePage || 1,
      isAddOn: Boolean(item.isAddOn),
      rateRange: {
        min: item.clientRateMin || item.clientRate || 0,
        max: item.clientRateMax || item.clientRate || 0,
      },
      rateSqftRange: {
        min: item.clientRateSqftMin || item.clientRateSqft || 0,
        max: item.clientRateSqftMax || item.clientRateSqft || 0,
      },
      // Backwards-compatible single rate (using upper range)
      rate: item.clientRateMax || item.clientRate || 0,
      rateSqft: item.clientRateSqftMax || item.clientRateSqft || 0,
      coverage: item.coverage,
      typicalBrands: item.typicalBrands,
    }));

    res.json({
      success: true,
      data: safeItems,
      items: safeItems,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
        hasNextPage: skip + items.length < total,
        hasPrevPage: parsedPage > 1,
      },
      disclaimer: settings.disclaimerText,
      taxNotice: settings.taxNotice,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 2. Server-Authoritative Project Estimate Calculator
 * POST /api/dsr/estimate
 *
 * Rules:
 * - 1 to 30 items
 * - Quantities must obey unit constraints (whole number for nos/point; max 3 decimals for sqm/cum)
 * - Authoritative server calculation — client never computes final quote
 */
export const calculateEstimate = async (req, res, next) => {
  try {
    // B3 GUARD: Fail-closed estimator kill-switch
    const settings = await getActiveSettings();
    if (!settings || !settings.isEstimatorActive) {
      return res.status(503).json({
        success: false,
        error: 'Estimator is temporarily unavailable.',
        code: 'ESTIMATOR_DISABLED',
      });
    }

    const { lines } = req.body;

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, error: 'Please provide at least 1 item for estimation.' });
    }

    if (lines.length > 30) {
      return res.status(400).json({ success: false, error: 'Maximum 30 items allowed per estimate submission.' });
    }

    const evaluatedLines = [];
    let grandTotalMin = 0;
    let grandTotalMax = 0;

    for (const line of lines) {
      const { itemId, quantity } = line;
      if (!itemId) {
        return res.status(400).json({ success: false, error: 'Each estimate line must include a valid itemId.' });
      }

      const numQty = parseFloat(quantity);
      if (isNaN(numQty) || numQty <= 0 || numQty > 10000000) {
        return res.status(400).json({
          success: false,
          error: `Invalid quantity for item. Must be a positive number up to 10,000,000.`,
        });
      }

      const item = await DsrItem.findById(itemId);
      // H1 GUARD: Public estimates must only use verified records
      if (!item || !item.isActive || !item.isVerified) {
        return res.status(404).json({ success: false, error: `Item with ID ${itemId} is not available.` });
      }

      // Unit constraint validation
      const integerUnits = ['nos', 'point', 'each', 'set', 'job', 'unit'];
      if (integerUnits.includes(item.unit.toLowerCase()) && !Number.isInteger(numQty)) {
        return res.status(400).json({
          success: false,
          error: `Item "${item.title}" (${item.itemNo}) with unit "${item.unit}" must be a whole number.`,
        });
      }

      // Decimal places check (max 3 decimals)
      const decimalStr = numQty.toString().split('.')[1];
      if (decimalStr && decimalStr.length > 3) {
        return res.status(400).json({
          success: false,
          error: `Item "${item.title}" quantity cannot have more than 3 decimal places.`,
        });
      }

      const rateMin = item.clientRateMin || item.clientRate || 0;
      const rateMax = item.clientRateMax || item.clientRate || 0;

      const subtotalMin = Math.round(rateMin * numQty * 100) / 100;
      const subtotalMax = Math.round(rateMax * numQty * 100) / 100;

      grandTotalMin += subtotalMin;
      grandTotalMax += subtotalMax;

      evaluatedLines.push({
        itemId: item._id,
        itemNo: item.itemNo,
        title: item.title,
        unit: item.unit,
        unitLabel: item.unitLabel || item.unit,
        quantity: numQty,
        rateMin,
        rateMax,
        subtotalMin,
        subtotalMax,
        isAddOn: Boolean(item.isAddOn),
      });
    }

    grandTotalMin = Math.round(grandTotalMin * 100) / 100;
    grandTotalMax = Math.round(grandTotalMax * 100) / 100;

    res.json({
      success: true,
      lines: evaluatedLines,
      totals: {
        min: grandTotalMin,
        max: grandTotalMax,
        currency: 'INR',
        taxNotice: settings.taxNotice || 'Excluding GST',
        disclaimer: settings.disclaimerText,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. Submit Estimate as Quotation Enquiry
 * POST /api/dsr/quotation
 *
 * Saves quotation enquiry to Enquiry collection with server-evaluated snapshot
 */
export const submitQuotationEnquiry = async (req, res, next) => {
  try {
    // B3 GUARD: Fail-closed estimator kill-switch on quotation endpoint
    const settings = await getActiveSettings();
    if (!settings || !settings.isEstimatorActive) {
      return res.status(503).json({
        success: false,
        error: 'Estimator is temporarily unavailable.',
        code: 'ESTIMATOR_DISABLED',
      });
    }

    const { name, email, phone, organization, pinCode, projectScope, lines } = req.body;

    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Name, email, and phone number are required.' });
    }

    if (!Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ success: false, error: 'Cannot submit a quotation without estimate items.' });
    }

    // Recompute snapshot authoritatively on the server
    const evaluatedLines = [];
    let grandTotalMin = 0;
    let grandTotalMax = 0;

    for (const line of lines) {
      const item = await DsrItem.findById(line.itemId);
      // H1 GUARD: Do not allow unverified placeholder records into quotation snapshots
      if (!item || !item.isActive || !item.isVerified) continue;

      const qty = parseFloat(line.quantity) || 1;
      const rateMin = item.clientRateMin || item.clientRate || 0;
      const rateMax = item.clientRateMax || item.clientRate || 0;
      const subMin = Math.round(rateMin * qty * 100) / 100;
      const subMax = Math.round(rateMax * qty * 100) / 100;

      grandTotalMin += subMin;
      grandTotalMax += subMax;

      evaluatedLines.push({
        itemId: item._id,
        itemNo: item.itemNo,
        title: item.title,
        desc: item.desc || '',
        unit: item.unit,
        quantity: qty,
        rateMin,
        rateMax,
        subtotalMin: subMin,
        subtotalMax: subMax,
        edition: item.edition || 'CPWD DSR 2023 Civil',
        volume: item.volume || 1,
        sourcePage: item.sourcePage || null,
        provenance: 'verified_cpwd_dsr_2023',
      });
    }

    if (evaluatedLines.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid verified estimate items found for quotation request.',
      });
    }

    const snapshot = {
      lines: evaluatedLines,
      totals: {
        min: Math.round(grandTotalMin * 100) / 100,
        max: Math.round(grandTotalMax * 100) / 100,
        taxNotice: settings.taxNotice || 'All rate ranges excluding GST.',
        disclaimer: settings.disclaimerText || 'Indicative estimate based on standard CPWD schedule. Final project pricing is subject to technical site appraisal.',
      },
      // B4: Store full server pricing context so saved quotations are fixed and self-documenting
      pricingConfig: {
        dsrSettingId: settings._id ? String(settings._id) : 'unversioned',
        version: settings.updatedAt ? settings.updatedAt.toISOString() : 'initial',
        loadingMin: settings.loadingMin,
        loadingMax: settings.loadingMax,
        locationIndex: settings.locationIndex,
        geography: settings.geography || 'Odisha (Khurda / Cuttack / Bhubaneswar)',
        edition: 'CPWD DSR 2023 Civil',
        effectiveDate: settings.effectiveDate,
      },
      calculatedAt: new Date(),
    };

    const cookieRef = req.cookies?.neeve_ref;
    const passedRefCode = req.body?.refCode;
    const attribution = await resolveReferralAttribution({
      refCode: passedRefCode,
      cookieRef,
      phone: phone.trim(),
      email: email.trim().toLowerCase(),
    });

    const enquiry = new Enquiry({
      type: 'quotation',
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      organization: organization?.trim() || '',
      pinCode: pinCode?.trim() || '',
      projectScope: projectScope?.trim() || `Quotation estimate for ${evaluatedLines.length} DSR civil items.`,
      estimateSnapshot: snapshot,
      source: 'dsr-calculator',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      ...attribution,
    });

    await enquiry.save();

    // B4: Return strictly customer-safe allowlisted response (never leak pricingConfig or internal internals)
    res.status(201).json({
      success: true,
      message: 'Your estimate quotation request has been received. Our engineering team will review and contact you.',
      enquiryId: enquiry._id,
      snapshot: {
        lines: evaluatedLines.map((l) => ({
          itemNo: l.itemNo,
          title: l.title,
          unit: l.unit,
          quantity: l.quantity,
          rateMin: l.rateMin,
          rateMax: l.rateMax,
          subtotalMin: l.subtotalMin,
          subtotalMax: l.subtotalMax,
        })),
        totals: snapshot.totals,
        calculatedAt: snapshot.calculatedAt,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 4. Admin DSR Items Listing
 * GET /api/dsr/admin/items
 */
export const getAdminDsrItems = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (category && category !== 'All Categories' && category !== 'all') {
      filter.category = category;
    }

    if (search && search.trim()) {
      const q = search.trim();
      const regex = new RegExp(q, 'i');
      filter.$or = [{ itemNo: regex }, { title: regex }, { desc: regex }, { subhead: regex }];
    }

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const [items, total, settings] = await Promise.all([
      DsrItem.find(filter)
        .sort({ category: 1, order: 1, itemNo: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      DsrItem.countDocuments(filter),
      getActiveSettings(),
    ]);

    const allItems = await DsrItem.find({}).select('isActive isVerified baseRate clientRateMin clientRateMax').lean();
    const activeCount = allItems.filter((i) => i.isActive).length;
    const verifiedCount = allItems.filter((i) => i.isVerified).length;

    res.json({
      success: true,
      data: items,
      settings,
      meta: {
        total,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
        activeCount,
        verifiedCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 5. Admin Create Item
 */
export const createDsrItem = async (req, res, next) => {
  try {
    const {
      itemNo,
      category,
      chapter,
      subhead,
      title,
      desc,
      unit,
      unitLabel,
      sqftFactor,
      sourcePage,
      isAddOn,
      baseRate,
      loadingMin,
      loadingMax,
      costIndex,
      coverage,
      typicalBrands,
      keywords,
      isVerified,
      isActive,
      order,
    } = req.body;

    if (!itemNo || !title || !category || !unit || baseRate === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Item code, title, category, unit, and base rate are required',
      });
    }

    const existing = await DsrItem.findOne({ itemNo: itemNo.trim().toUpperCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `DSR item code "${itemNo.trim()}" already exists`,
      });
    }

    const item = new DsrItem({
      itemNo: itemNo.trim().toUpperCase(),
      category: category.trim(),
      chapter: chapter?.trim() || category.trim(),
      subhead: subhead?.trim() || '',
      title: title.trim(),
      desc: desc?.trim() || '',
      unit: unit.trim().toLowerCase(),
      unitLabel: unitLabel?.trim() || unit.trim(),
      sqftFactor: Number(sqftFactor) > 0 ? Number(sqftFactor) : 1,
      sourcePage: Number(sourcePage) || 1,
      isAddOn: Boolean(isAddOn),
      baseRate: Number(baseRate),
      loadingMin: loadingMin !== undefined ? Number(loadingMin) : 15,
      loadingMax: loadingMax !== undefined ? Number(loadingMax) : 20,
      costIndex: costIndex !== undefined ? Number(costIndex) : 100,
      coverage: coverage?.trim() || '',
      typicalBrands: typicalBrands?.trim() || '',
      keywords: Array.isArray(keywords)
        ? keywords.map((k) => k.trim())
        : (keywords || '').split(',').map((k) => k.trim()).filter(Boolean),
      isVerified: isVerified !== undefined ? Boolean(isVerified) : true,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
      order: Number(order) || 0,
      updatedBy: req.user?._id,
    });

    await item.save();

    res.status(201).json({
      success: true,
      data: item,
      message: `Item ${item.itemNo} created successfully`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 6. Admin Update Item
 */
export const updateDsrItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await DsrItem.findById(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'DSR item not found' });
    }

    const fields = [
      'itemNo',
      'category',
      'chapter',
      'subhead',
      'title',
      'desc',
      'unit',
      'unitLabel',
      'sqftFactor',
      'sourcePage',
      'isAddOn',
      'baseRate',
      'loadingMin',
      'loadingMax',
      'costIndex',
      'coverage',
      'typicalBrands',
      'keywords',
      'isVerified',
      'isActive',
      'order',
    ];

    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === 'keywords' && typeof req.body[field] === 'string') {
          item.keywords = req.body[field].split(',').map((k) => k.trim()).filter(Boolean);
        } else if (field === 'itemNo') {
          item.itemNo = req.body.itemNo.trim().toUpperCase();
        } else {
          item[field] = req.body[field];
        }
      }
    });

    item.updatedBy = req.user?._id;
    await item.save();

    res.json({
      success: true,
      data: item,
      message: `Item ${item.itemNo} updated successfully`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 7. Admin Override with Auditing
 * PATCH /api/dsr/admin/items/:id/override
 */
export const overrideDsrItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { baseRate, loadingMin, loadingMax, costIndex, reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'An audit reason is required for rate overrides.' });
    }

    const item = await DsrItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'DSR item not found' });
    }

    // Record audit entry
    item.overrides.push({
      baseRate: item.baseRate,
      loadingMin: item.loadingMin,
      loadingMax: item.loadingMax,
      costIndex: item.costIndex,
      reason: reason.trim(),
      updatedBy: req.user?._id,
    });

    if (baseRate !== undefined) item.baseRate = Number(baseRate);
    if (loadingMin !== undefined) item.loadingMin = Number(loadingMin);
    if (loadingMax !== undefined) item.loadingMax = Number(loadingMax);
    if (costIndex !== undefined) item.costIndex = Number(costIndex);

    item.updatedBy = req.user?._id;
    await item.save();

    res.json({
      success: true,
      data: item,
      message: `Item ${item.itemNo} rate override applied and audited.`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 8. Admin Toggle Status / Verification
 */
export const toggleDsrItemStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isActive, isVerified } = req.body;

    const item = await DsrItem.findById(id);
    if (!item) {
      return res.status(404).json({ success: false, error: 'DSR item not found' });
    }

    if (isActive !== undefined) item.isActive = Boolean(isActive);
    if (isVerified !== undefined) item.isVerified = Boolean(isVerified);
    item.updatedBy = req.user?._id;

    await item.save();

    res.json({
      success: true,
      data: item,
      message: `Status updated for ${item.itemNo}`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 9. Admin Settings Management
 */
export const getDsrSettings = async (req, res, next) => {
  try {
    const settings = await getActiveSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

export const updateDsrSettings = async (req, res, next) => {
  try {
    const { loadingMin, loadingMax, locationIndex, disclaimerText, taxNotice, isEstimatorActive, resetCustomOverrides } = req.body;
    const settings = await getActiveSettings();

    if (loadingMin !== undefined) settings.loadingMin = Math.max(0, Math.min(50, Number(loadingMin)));
    if (loadingMax !== undefined) settings.loadingMax = Math.max(0, Math.min(50, Number(loadingMax)));
    if (locationIndex !== undefined) settings.locationIndex = Math.max(50, Math.min(200, Number(locationIndex)));
    if (disclaimerText !== undefined) settings.disclaimerText = disclaimerText.trim();
    if (taxNotice !== undefined) settings.taxNotice = taxNotice.trim();
    if (isEstimatorActive !== undefined) settings.isEstimatorActive = Boolean(isEstimatorActive);

    settings.updatedBy = req.user?._id;
    await settings.save();

    // M1: Preserve per-item overrides when global settings change unless explicitly confirmed with resetCustomOverrides === true
    const allItems = await DsrItem.find({});
    let updatedCount = 0;
    let preservedOverridesCount = 0;

    for (const item of allItems) {
      const hasCustomOverrides = Array.isArray(item.overrides) && item.overrides.length > 0;
      if (hasCustomOverrides && resetCustomOverrides !== true) {
        preservedOverridesCount++;
        continue; // M1: Preserve audited item overrides
      }

      item.loadingMin = settings.loadingMin;
      item.loadingMax = settings.loadingMax;
      item.costIndex = settings.locationIndex;
      if (resetCustomOverrides === true && hasCustomOverrides) {
        item.overrides.push({
          loadingMin: settings.loadingMin,
          loadingMax: settings.loadingMax,
          costIndex: settings.locationIndex,
          reason: 'Administrator confirmed reset of per-item overrides to global settings',
          updatedBy: req.user?._id,
        });
      }
      await item.save();
      updatedCount++;
    }

    res.json({
      success: true,
      data: settings,
      meta: {
        updatedItemsCount: updatedCount,
        preservedOverridesCount,
      },
      message: `Global loading settings updated. ${updatedCount} items synchronized (${preservedOverridesCount} audited item overrides preserved).`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 10. Delete Item
 */
export const deleteDsrItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const item = await DsrItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'DSR item not found' });
    }

    res.json({ success: true, message: `Item ${item.itemNo} removed` });
  } catch (err) {
    next(err);
  }
};

/**
 * 11. Export CSV
 */
export const exportDsrCsv = async (req, res, next) => {
  try {
    const items = await DsrItem.find({}).sort({ category: 1, order: 1, itemNo: 1 }).lean();

    const headers = [
      'Item Code',
      'Category',
      'Chapter',
      'Subhead',
      'Title',
      'Unit',
      'Sqft Factor',
      'PDF Source Page',
      'Is Add-on',
      'Base DSR Rate (INR)',
      'Loading Min (%)',
      'Loading Max (%)',
      'Cost Index',
      'Quoted Min Rate (INR)',
      'Quoted Max Rate (INR)',
      'Quoted Min Sqft Rate (INR)',
      'Quoted Max Sqft Rate (INR)',
      'Verified',
      'Active',
    ];

    const rows = items.map((item) =>
      [
        `"${item.itemNo}"`,
        `"${item.category}"`,
        `"${item.chapter || item.category}"`,
        `"${(item.subhead || '').replace(/"/g, '""')}"`,
        `"${(item.title || '').replace(/"/g, '""')}"`,
        `"${item.unit}"`,
        item.sqftFactor || 1,
        item.sourcePage || 1,
        item.isAddOn ? 'YES' : 'NO',
        (item.baseRate || 0).toFixed(2),
        item.loadingMin || 15,
        item.loadingMax || 20,
        item.costIndex || 100,
        (item.clientRateMin || item.clientRate || 0).toFixed(2),
        (item.clientRateMax || item.clientRate || 0).toFixed(2),
        (item.clientRateSqftMin || item.clientRateSqft || 0).toFixed(2),
        (item.clientRateSqftMax || item.clientRateSqft || 0).toFixed(2),
        item.isVerified ? 'YES' : 'NO',
        item.isActive ? 'YES' : 'NO',
      ].join(',')
    );

    const csvData = [headers.join(','), ...rows].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, private');  // M2: Prevent CDN/proxy caching of sensitive rate data
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Neevevera_DSR_2023_Rates_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    res.status(200).send(csvData);
  } catch (err) {
    next(err);
  }
};

/**
 * 12. Public DSR Items Legacy Endpoint (for backwards compatibility)
 */
export const getPublicDsrItems = async (req, res, next) => {
  return searchPublicDsrItems(req, res, next);
};

/**
 * 13. Download Sample CSV Import Template
 * GET /api/dsr/admin/import-csv/template
 */
export const downloadImportTemplate = async (req, res, next) => {
  try {
    const headers = [
      'Item Code',
      'Category',
      'Chapter',
      'Subhead',
      'Title',
      'Description',
      'Unit',
      'Unit Label',
      'Sqft Factor',
      'Base DSR Rate (INR)',
      'PDF Source Page',
      'Edition',
      'Volume',
      'Is Add-on',
      'Coverage',
      'Typical Brands',
    ];

    const sampleRows = [
      [
        '13.43.1',
        'Finishing & Painting',
        '13. Finishing',
        'Wall Painting',
        'Acrylic Emulsion Paint (2+ Coats)',
        'Wall painting with premium acrylic emulsion paint of approved brand: Two or more coats on new surface over primer.',
        'sqm',
        'Square Meter (m²)',
        '10.764',
        '115.00',
        '43',
        'CPWD DSR 2023 Civil',
        '2',
        'NO',
        'Approx. 120-140 sqft/ltr for 2 coats',
        'Asian Paints Royale, Berger Silk',
      ],
      [
        '4.1.3',
        'Concrete & RCC Work',
        '4. Concrete Work',
        'Foundation Concrete',
        'RCC M20 Grade (1:1.5:3) in Foundation & Plinth',
        'Providing and laying in position specified grade of reinforced cement concrete, excluding the cost of centering, shuttering, finishing and reinforcement: 1:1.5:3 (1 cement : 1.5 coarse sand : 3 graded stone aggregate 20mm nominal size).',
        'cum',
        'Cubic Meter (m³)',
        '35.315',
        '6850.00',
        '18',
        'CPWD DSR 2023 Civil',
        '1',
        'NO',
        '',
        'UltraTech, ACC, Ambuja',
      ],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map((r) => r.map((f) => `"${(f || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Disposition', 'attachment; filename="Neevevera_DSR_Import_Template.csv"');
    res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
};

/**
 * 14. Preview CSV Import (Dry-Run Validation)
 * POST /api/dsr/admin/import-csv/preview
 */
export const previewDsrCsvImport = async (req, res, next) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, error: 'Please upload a valid CSV file (.csv).' });
    }

    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Uploaded file exceeds maximum allowed size of 5 MB.' });
    }

    const fileHash = crypto.createHash('sha256').update(req.file.buffer).digest('hex');

    let parsed;
    try {
      parsed = parseCsv(req.file.buffer);
    } catch (parseErr) {
      return res.status(400).json({ success: false, error: parseErr.message });
    }

    const { headers, rows } = parsed;

    if (!headers || headers.length === 0 || rows.length === 0) {
      return res.status(400).json({ success: false, error: 'The uploaded CSV file is empty or missing headers.' });
    }

    // Map headers to canonical fields
    const headerMap = {};
    for (const h of headers) {
      const canonical = normalizeHeader(h);
      if (canonical) {
        headerMap[canonical] = h;
      }
    }

    // Automatic fallbacks for schema variations (e.g. compact canonical schema)
    if (!headerMap.title && headerMap.desc) {
      headerMap.title = headerMap.desc;
    }
    if (!headerMap.desc && headerMap.title) {
      headerMap.desc = headerMap.title;
    }
    if (!headerMap.category && headerMap.chapter) {
      headerMap.category = headerMap.chapter;
    }

    // Validate required columns
    const REQUIRED_COLUMNS = ['itemNo', 'category', 'title', 'unit', 'baseRate'];
    const missingColumns = REQUIRED_COLUMNS.filter((col) => !headerMap[col]);
    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required CSV column(s): ${missingColumns.join(', ')}. Please use our import template.`,
      });
    }

    const stagedItems = [];
    const errors = [];
    const seenItemNos = new Set();

    let newCount = 0;
    let updateCount = 0;
    let conflictCount = 0;
    let unchangedCount = 0;
    let invalidCount = 0;

    // Batch query existing candidate items to eliminate sequential DB roundtrips
    const candidateItemNos = rows
      .map((r) => (r[headerMap.itemNo] || '').trim())
      .filter(Boolean);

    const existingMap = new Map();
    for (let c = 0; c < candidateItemNos.length; c += 1000) {
      const slice = candidateItemNos.slice(c, c + 1000);
      const found = await DsrItem.find({ itemNo: { $in: slice } })
        .select('itemNo baseRate isVerified title unit')
        .lean();
      for (const item of found) {
        existingMap.set(item.itemNo, item);
      }
    }

    for (const row of rows) {
      const rowNum = row._rowNumber || stagedItems.length + 2;
      const rowErrors = [];

      const rawItemNo = row[headerMap.itemNo] || '';
      const rawCategory = row[headerMap.category] || '';
      const rawChapter = headerMap.chapter ? row[headerMap.chapter] || '' : '';
      const rawSubhead = headerMap.subhead ? row[headerMap.subhead] || '' : '';
      const rawTitle = row[headerMap.title] || '';
      const rawDesc = headerMap.desc ? row[headerMap.desc] || '' : '';
      const rawUnit = row[headerMap.unit] || '';
      const rawUnitLabel = headerMap.unitLabel ? row[headerMap.unitLabel] || '' : '';
      const rawSqftFactor = headerMap.sqftFactor ? row[headerMap.sqftFactor] : '';
      const rawBaseRate = row[headerMap.baseRate] || '';
      const rawSourcePage = headerMap.sourcePage ? row[headerMap.sourcePage] : '';
      const rawEdition = headerMap.edition ? row[headerMap.edition] || '' : '';
      const rawVolume = headerMap.volume ? row[headerMap.volume] : '';
      const rawIsAddOn = headerMap.isAddOn ? row[headerMap.isAddOn] : '';
      const rawCoverage = headerMap.coverage ? row[headerMap.coverage] || '' : '';
      const rawTypicalBrands = headerMap.typicalBrands ? row[headerMap.typicalBrands] || '' : '';
      const rawKeywords = headerMap.keywords ? row[headerMap.keywords] || '' : '';

      // 1. Validate Item Code
      const itemNo = rawItemNo.trim();
      if (!itemNo) {
        rowErrors.push('Item code is required.');
      } else if (itemNo.length > 30) {
        rowErrors.push('Item code exceeds maximum length of 30 characters.');
      } else if (seenItemNos.has(itemNo.toLowerCase())) {
        rowErrors.push(`Duplicate item code "${itemNo}" within this CSV file.`);
      } else {
        seenItemNos.add(itemNo.toLowerCase());
      }

      // 2. Validate Category
      const rawCatLower = rawCategory.trim().toLowerCase();
      let categoryMatch = DSR_CATEGORIES.find((cat) => cat.toLowerCase() === rawCatLower);
      if (!categoryMatch && rawCatLower) {
        // Smart match: check keywords (e.g. "13. Finishing" -> "Finishing & Painting")
        categoryMatch = DSR_CATEGORIES.find((cat) => {
          const words = cat.toLowerCase().split(/[ &]+/);
          return words.some((w) => w.length > 3 && rawCatLower.includes(w));
        });
      }
      const category = categoryMatch || rawCategory.trim();
      if (!category) {
        rowErrors.push('Category is required.');
      } else if (!categoryMatch) {
        rowErrors.push(`Invalid category "${rawCategory}". Must be one of standard DSR categories.`);
      }

      // 3. Validate Title
      const title = rawTitle.trim();
      if (!title) {
        rowErrors.push('Title/Specification is required.');
      } else if (title.length > 300) {
        rowErrors.push('Title exceeds maximum length of 300 characters.');
      }

      // 4. Validate Unit
      const unit = rawUnit.trim().toLowerCase();
      if (!unit) {
        rowErrors.push('Unit of measurement is required.');
      } else if (unit.length > 20) {
        rowErrors.push('Unit exceeds maximum length of 20 characters.');
      }

      // 5. Validate Base Rate
      const numBaseRate = parseFloat(rawBaseRate);
      if (isNaN(numBaseRate) || numBaseRate <= 0 || !Number.isFinite(numBaseRate) || numBaseRate > 10000000) {
        rowErrors.push('Base DSR rate must be a positive finite number (up to 10,000,000).');
      }

      // 6. Validate Source Page
      let sourcePage = 1;
      if (rawSourcePage) {
        const parsedPage = parseInt(rawSourcePage, 10);
        if (isNaN(parsedPage) || parsedPage < 1) {
          rowErrors.push('Source page must be a positive integer.');
        } else {
          sourcePage = parsedPage;
        }
      }

      // 7. Validate Sqft Factor
      let sqftFactor = 1;
      if (rawSqftFactor) {
        const parsedFactor = parseFloat(rawSqftFactor);
        if (!isNaN(parsedFactor) && parsedFactor > 0) {
          sqftFactor = parsedFactor;
        }
      }

      // 8. Validate Volume
      let volume = 1;
      if (rawVolume) {
        const parsedVol = parseInt(rawVolume, 10);
        if (parsedVol === 1 || parsedVol === 2) {
          volume = parsedVol;
        }
      }

      // 9. Validate isAddOn
      let isAddOn = false;
      if (rawIsAddOn !== undefined && rawIsAddOn !== '') {
        const lower = String(rawIsAddOn).toLowerCase().trim();
        isAddOn = lower === 'yes' || lower === 'true' || lower === '1';
      } else {
        isAddOn = DsrItem.suggestIsAddOn(title, rawDesc);
      }

      if (rowErrors.length > 0) {
        invalidCount++;
        const errMessage = rowErrors.join('; ');
        errors.push({ row: rowNum, itemNo, error: errMessage });
        stagedItems.push({
          row: rowNum,
          status: 'invalid',
          itemNo,
          category,
          title,
          unit,
          baseRate: isNaN(numBaseRate) ? 0 : numBaseRate,
          error: errMessage,
        });
        continue;
      }

      // Check existing item in database (from batch lookup map)
      const existing = existingMap.get(itemNo);
      let status = 'new';
      let existingBaseRate = null;
      let conflictReason = '';

      if (existing) {
        existingBaseRate = existing.baseRate;
        if (existing.isVerified) {
          // PROTECT VERIFIED ITEMS: Cannot overwrite via bulk CSV
          status = 'conflict';
          conflictReason = 'Item is already verified and published. Verified items cannot be overwritten via bulk CSV.';
          conflictCount++;
        } else {
          // Unverified item difference detection
          const rateDiff = Math.abs(existing.baseRate - Math.round(numBaseRate * 100) / 100) > 0.001;
          const titleDiff = existing.title !== title;
          const unitDiff = existing.unit !== unit;

          if (rateDiff || titleDiff || unitDiff) {
            status = 'update';
            updateCount++;
          } else {
            status = 'unchanged';
            unchangedCount++;
          }
        }
      } else {
        status = 'new';
        newCount++;
      }

      stagedItems.push({
        row: rowNum,
        status,
        itemNo,
        category,
        chapter: rawChapter.trim(),
        subhead: rawSubhead.trim(),
        title,
        desc: rawDesc.trim(),
        unit,
        unitLabel: rawUnitLabel.trim() || unit,
        sqftFactor,
        baseRate: Math.round(numBaseRate * 100) / 100,
        existingBaseRate,
        sourcePage,
        edition: rawEdition.trim() || 'CPWD DSR 2023 Civil',
        volume,
        isAddOn,
        coverage: rawCoverage.trim(),
        typicalBrands: rawTypicalBrands.trim(),
        keywords: rawKeywords ? rawKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
        conflictReason,
      });
    }

    const batchId = `dsr-batch-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const expiresAt = new Date(Date.now() + 2 * 3600 * 1000); // 2 hours expiry

    // Save individual staged items to DsrStagedItem collection in chunks of 1000
    const stagedDocs = stagedItems.map((item) => ({
      batchId,
      rowNumber: item.row,
      status: item.status,
      itemNo: item.itemNo,
      category: item.category,
      chapter: item.chapter,
      subhead: item.subhead,
      title: item.title,
      desc: item.desc,
      unit: item.unit,
      unitLabel: item.unitLabel,
      sqftFactor: item.sqftFactor,
      baseRate: item.baseRate,
      existingBaseRate: item.existingBaseRate,
      sourcePage: item.sourcePage,
      edition: item.edition,
      volume: item.volume,
      isAddOn: item.isAddOn,
      coverage: item.coverage,
      typicalBrands: item.typicalBrands,
      keywords: item.keywords,
      conflictReason: item.conflictReason,
      error: item.error,
      expiresAt,
    }));

    for (let c = 0; c < stagedDocs.length; c += 1000) {
      await DsrStagedItem.insertMany(stagedDocs.slice(c, c + 1000), { ordered: false });
    }

    const isExternalStaging = rows.length > 500;
    const batch = new DsrImportBatch({
      batchId,
      uploadedBy: req.user._id,
      uploaderName: req.user.name || 'Admin',
      originalFilename: req.file.originalname,
      fileHash,
      status: 'preview',
      isExternalStaging,
      summary: {
        totalRows: rows.length,
        newCount,
        updateCount,
        conflictCount,
        unchangedCount,
        invalidCount,
      },
      stagedItems: isExternalStaging ? stagedItems.slice(0, 100) : stagedItems,
      errors: errors.slice(0, 200),
      expiresAt,
    });

    await batch.save();

    res.setHeader('Cache-Control', 'no-store, private');
    res.json({
      success: true,
      batchId: batch.batchId,
      originalFilename: req.file.originalname,
      fileHash,
      summary: batch.summary,
      stagedItems: batch.stagedItems,
      errors: batch.errors,
      conflicts: batch.stagedItems.filter((i) => i.status === 'conflict'),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 15. Commit Staged CSV Import Batch
 * POST /api/dsr/admin/import-csv/:batchId/commit
 */
export const commitDsrCsvImport = async (req, res, next) => {
  try {
    const { batchId } = req.params;
    const { allowPartial } = req.body;

    const batch = await DsrImportBatch.findOne({ batchId });
    if (!batch) {
      return res.status(404).json({ success: false, error: 'Import batch not found or expired.' });
    }

    if (batch.expiresAt && new Date() > batch.expiresAt) {
      return res.status(400).json({ success: false, error: 'Import batch has expired. Please re-upload your CSV.' });
    }

    if (batch.status === 'committed') {
      return res.status(400).json({ success: false, error: 'This import batch has already been committed.' });
    }

    if (batch.status !== 'preview') {
      return res.status(400).json({ success: false, error: `Cannot commit batch in "${batch.status}" state.` });
    }

    // Require explicit allowPartial if there were invalid rows
    if (batch.summary.invalidCount > 0 && !allowPartial) {
      return res.status(400).json({
        success: false,
        error: `Batch contains ${batch.summary.invalidCount} invalid rows. Commit rejected unless partial import is explicitly confirmed.`,
      });
    }

    const settings = await getActiveSettings();

    // Determine records to commit: check DsrStagedItem first, fallback to batch.stagedItems
    let itemsToProcess = [];
    const stagedCount = await DsrStagedItem.countDocuments({ batchId });
    if (stagedCount > 0) {
      itemsToProcess = await DsrStagedItem.find({ batchId, status: { $in: ['new', 'update', 'conflict'] } })
        .sort({ rowNumber: 1 })
        .lean();
    } else if (Array.isArray(batch.stagedItems) && batch.stagedItems.length > 0) {
      itemsToProcess = batch.stagedItems.filter((i) => ['new', 'update', 'conflict'].includes(i.status));
    }

    let committedCount = 0;
    let updatedCount = 0;
    let skippedConflictCount = 0;
    const failedRows = [];

    const CHUNK_SIZE = 1000;
    for (let c = 0; c < itemsToProcess.length; c += CHUNK_SIZE) {
      const chunk = itemsToProcess.slice(c, c + CHUNK_SIZE);
      const chunkItemNos = chunk.map((item) => item.itemNo);

      // Fetch existing items for this chunk
      const existingRecords = await DsrItem.find({ itemNo: { $in: chunkItemNos } })
        .select('_id itemNo baseRate loadingMin loadingMax costIndex isVerified overrides')
        .lean();
      const existingMap = new Map(existingRecords.map((r) => [r.itemNo, r]));

      const bulkOps = [];
      const opIndexMap = []; // Tracks operation index to staged item row

      for (const item of chunk) {
        if (item.status === 'conflict') {
          skippedConflictCount++;
          continue;
        }

        const existing = existingMap.get(item.itemNo);

        // PROTECT VERIFIED RECORDS: never overwrite
        if (existing && existing.isVerified) {
          skippedConflictCount++;
          continue;
        }

        const calculated = DsrItem.calculateClientRateRange(
          item.baseRate,
          settings.loadingMin || 15,
          settings.loadingMax || 20,
          settings.locationIndex || 100,
          item.sqftFactor || 1
        );

        if (existing) {
          bulkOps.push({
            updateOne: {
              filter: { _id: existing._id, isVerified: { $ne: true } },
              update: {
                $set: {
                  baseRate: item.baseRate,
                  title: item.title,
                  desc: item.desc || '',
                  unit: item.unit,
                  unitLabel: item.unitLabel || item.unit,
                  category: item.category,
                  chapter: item.chapter || '',
                  subhead: item.subhead || '',
                  sqftFactor: item.sqftFactor || 1,
                  sourcePage: item.sourcePage || 1,
                  sourceHash: item.sourceHash || '',
                  correctionSlipRef: item.correctionSlipRef || '',
                  clientRateMin: calculated.clientRateMin,
                  clientRateMax: calculated.clientRateMax,
                  clientRateSqftMin: calculated.clientRateSqftMin,
                  clientRateSqftMax: calculated.clientRateSqftMax,
                  clientRate: calculated.clientRate,
                  markupPercent: settings.loadingMax || 20,
                  isVerified: false,
                  updatedBy: req.user?._id,
                },
                $push: {
                  overrides: {
                    baseRate: existing.baseRate,
                    loadingMin: existing.loadingMin,
                    loadingMax: existing.loadingMax,
                    costIndex: existing.costIndex,
                    reason: `Updated via CSV Import Batch ${batch.batchId} (${batch.originalFilename})`,
                    updatedBy: req.user?._id,
                    createdAt: new Date(),
                  },
                },
              },
            },
          });
          opIndexMap.push({ type: 'update', row: item.rowNumber || item.row, itemNo: item.itemNo });
        } else {
          bulkOps.push({
            insertOne: {
              document: {
                itemNo: item.itemNo,
                category: item.category,
                chapter: item.chapter || '',
                subhead: item.subhead || '',
                title: item.title,
                desc: item.desc || '',
                unit: item.unit,
                unitLabel: item.unitLabel || item.unit,
                sqftFactor: item.sqftFactor || 1,
                baseRate: item.baseRate,
                loadingMin: settings.loadingMin || 15,
                loadingMax: settings.loadingMax || 20,
                costIndex: settings.locationIndex || 100,
                clientRateMin: calculated.clientRateMin,
                clientRateMax: calculated.clientRateMax,
                clientRateSqftMin: calculated.clientRateSqftMin,
                clientRateSqftMax: calculated.clientRateSqftMax,
                clientRate: calculated.clientRate,
                markupPercent: settings.loadingMax || 20,
                sourcePage: item.sourcePage || 1,
                edition: item.edition || 'CPWD DSR 2023 Civil',
                volume: item.volume || 1,
                sourceHash: item.sourceHash || '',
                correctionSlipRef: item.correctionSlipRef || '',
                isAddOn: Boolean(item.isAddOn),
                isVerified: false, // NEVER verified automatically
                isActive: true,
                coverage: item.coverage || '',
                typicalBrands: item.typicalBrands || '',
                keywords: item.keywords || [],
                updatedBy: req.user?._id,
              },
            },
          });
          opIndexMap.push({ type: 'insert', row: item.rowNumber || item.row, itemNo: item.itemNo });
        }
      }

      if (bulkOps.length > 0) {
        try {
          const resOps = await DsrItem.bulkWrite(bulkOps, { ordered: false });
          committedCount += (resOps.insertedCount || 0) + (resOps.upsertedCount || 0);
          updatedCount += (resOps.modifiedCount || 0);
        } catch (bulkErr) {
          if (bulkErr.result) {
            committedCount += (bulkErr.result.nInserted || 0) + (bulkErr.result.nUpserted || 0);
            updatedCount += (bulkErr.result.nModified || 0);
          }
          if (Array.isArray(bulkErr.writeErrors)) {
            for (const we of bulkErr.writeErrors) {
              const meta = opIndexMap[we.index];
              failedRows.push({
                row: meta ? meta.row : null,
                itemNo: meta ? meta.itemNo : 'unknown',
                code: we.code,
                errmsg: we.errmsg,
              });
            }
          } else {
            throw bulkErr;
          }
        }
      }
    }

    batch.status = 'committed';
    batch.committedAt = new Date();
    batch.committedCount = committedCount + updatedCount;
    await batch.save();

    res.setHeader('Cache-Control', 'no-store, private');
    res.json({
      success: true,
      batchId: batch.batchId,
      committedCount: committedCount + updatedCount,
      newCreatedCount: committedCount,
      updatedCount,
      skippedConflictsCount: skippedConflictCount,
      failedRowsCount: failedRows.length,
      failedRows: failedRows.slice(0, 50),
      message: `Import batch committed successfully: ${committedCount} new items created, ${updatedCount} unverified items updated (${skippedConflictCount} verified conflicts protected).`,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * 16. Get Import Batch History
 * GET /api/dsr/admin/import-csv/history
 */
export const getDsrImportHistory = async (req, res, next) => {
  try {
    const batches = await DsrImportBatch.find({})
      .select('batchId uploaderName originalFilename fileHash status summary committedCount committedAt createdAt')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.setHeader('Cache-Control', 'no-store, private');
    res.json({
      success: true,
      data: batches,
    });
  } catch (err) {
    next(err);
  }
};

