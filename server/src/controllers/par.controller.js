import mongoose from 'mongoose';
import ParRate from '../models/ParRate.js';
import ParLocation from '../models/ParLocation.js';
import ParSettings from '../models/ParSettings.js';

// Safe decimal rounding helper
function roundDec(val, decimals = 2) {
  if (typeof val !== 'number' || isNaN(val)) return 0;
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────────

/**
 * GET /api/par/public-meta
 * Provides approved categories, approved locations, and public settings state.
 */
export const getPublicParMeta = async (req, res) => {
  const settings = await ParSettings.getSettings();

  const rates = await ParRate.find({ isActive: true, isVerified: true })
    .select('code category subCategory title structuralSystem floorHeightSpec unit sqftFactor sourceReference pageNumber edition correctionSlip')
    .sort({ category: 1, title: 1 })
    .lean();

  const locations = await ParLocation.find({ isActive: true, approvalStatus: 'approved' })
    .select('locationCode locationName state district costIndex baseIndexEdition sourceCircular effectiveDate')
    .sort({ state: 1, locationName: 1 })
    .lean();

  return res.json({
    success: true,
    data: {
      isEnabled: settings.isEnabled,
      activeEdition: settings.activeEdition,
      correctionSlipsApplied: settings.correctionSlipsApplied,
      customerDisclaimer: settings.customerDisclaimer,
      disabledMessage: settings.disabledMessage,
      availableRates: rates,
      availableLocations: locations,
    },
  });
};

/**
 * POST /api/par/estimate
 * Server-authoritative floor-wise plinth area cost calculation based on official CPWD PAR 2025.
 */
export const calculateEstimate = async (req, res) => {
  const settings = await ParSettings.getSettings();

  // Guard: if public estimator is disabled, reject safely
  if (!settings.isEnabled && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin'))) {
    return res.status(503).json({
      success: false,
      code: 'PAR_ESTIMATOR_DISABLED',
      error: settings.disabledMessage || 'Plinth Area Estimator is currently undergoing calibration and is unavailable.',
    });
  }

  const { rateId, rateCode, locationId, locationCode, floors } = req.body;

  // 1. Resolve and validate ParRate
  let rate = null;
  if (rateId && mongoose.Types.ObjectId.isValid(rateId)) {
    rate = await ParRate.findOne({ _id: rateId, isActive: true });
  } else if (rateCode) {
    rate = await ParRate.findOne({ code: String(rateCode).trim().toUpperCase(), isActive: true });
  }

  if (!rate) {
    return res.status(404).json({
      success: false,
      error: 'Approved CPWD PAR rate record not found for the specified identifier.',
    });
  }

  if (!rate.isVerified) {
    return res.status(400).json({
      success: false,
      error: 'The selected PAR rate is pending engineering verification and cannot be used for calculation.',
    });
  }

  // 2. Resolve and validate ParLocation
  let location = null;
  if (locationId && mongoose.Types.ObjectId.isValid(locationId)) {
    location = await ParLocation.findOne({ _id: locationId, isActive: true });
  } else if (locationCode) {
    location = await ParLocation.findOne({ locationCode: String(locationCode).trim().toUpperCase(), isActive: true });
  }

  if (!location) {
    return res.status(404).json({
      success: false,
      error: 'Approved location record not found for the specified identifier.',
    });
  }

  if (location.approvalStatus !== 'approved' && !settings.allowDraftLocations) {
    return res.status(400).json({
      success: false,
      error: 'Approved building cost index for the specified location is not established.',
    });
  }

  // 3. Validate floor-wise inputs
  if (!Array.isArray(floors) || floors.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'At least one floor with a positive plinth area is required.',
    });
  }

  const sqftFactor = Number(rate.sqftFactor) > 0 ? Number(rate.sqftFactor) : 10.7639;

  // Standard base rate per sqm
  const baseRatePerSqm = rate.unit === 'sqm' ? Number(rate.baseRate) : Number(rate.baseRate) * sqftFactor;
  const costIndexMultiplier = Number(location.costIndex) / 100;

  // Location-adjusted rates
  const adjustedRatePerSqm = baseRatePerSqm * costIndexMultiplier;
  const adjustedRatePerSqft = adjustedRatePerSqm / sqftFactor;

  let totalPlinthAreaSqft = 0;
  let totalPlinthAreaSqm = 0;
  let totalEstimatedCost = 0;

  const evaluatedFloors = [];

  for (let i = 0; i < floors.length; i++) {
    const f = floors[i];
    const rawArea = Number(f.area);
    if (isNaN(rawArea) || rawArea <= 0) {
      return res.status(400).json({
        success: false,
        error: `Invalid area on floor index ${i + 1}. Floor area must be a positive number.`,
      });
    }

    const inputUnit = f.unit === 'sqm' ? 'sqm' : 'sqft';
    let areaSqft = 0;
    let areaSqm = 0;

    if (inputUnit === 'sqm') {
      areaSqm = rawArea;
      areaSqft = rawArea * sqftFactor;
    } else {
      areaSqft = rawArea;
      areaSqm = rawArea / sqftFactor;
    }

    const floorCost = areaSqm * adjustedRatePerSqm;

    totalPlinthAreaSqft += areaSqft;
    totalPlinthAreaSqm += areaSqm;
    totalEstimatedCost += floorCost;

    evaluatedFloors.push({
      floorLevel: f.floorLevel || `Floor ${i + 1}`,
      areaSqft: roundDec(areaSqft, 2),
      areaSqm: roundDec(areaSqm, 2),
      ratePerSqft: roundDec(adjustedRatePerSqft, 2),
      ratePerSqm: roundDec(adjustedRatePerSqm, 2),
      estimatedCost: roundDec(floorCost, 2),
    });
  }

  const effectiveRatePerSqft = totalPlinthAreaSqft > 0 ? totalEstimatedCost / totalPlinthAreaSqft : 0;
  const effectiveRatePerSqm = totalPlinthAreaSqm > 0 ? totalEstimatedCost / totalPlinthAreaSqm : 0;

  return res.json({
    success: true,
    data: {
      edition: rate.edition,
      correctionSlip: rate.correctionSlip || null,
      sourceReference: rate.sourceReference,
      pageNumber: rate.pageNumber || null,
      rateCode: rate.code,
      category: rate.category,
      subCategory: rate.subCategory || null,
      buildingTitle: rate.title,
      structuralSystem: rate.structuralSystem,
      floorHeightSpec: rate.floorHeightSpec,
      location: {
        locationCode: location.locationCode,
        locationName: location.locationName,
        state: location.state,
        district: location.district || null,
        costIndex: location.costIndex,
        baseIndexEdition: location.baseIndexEdition,
        sourceCircular: location.sourceCircular,
        effectiveDate: location.effectiveDate,
      },
      totalPlinthArea: {
        sqft: roundDec(totalPlinthAreaSqft, 2),
        sqm: roundDec(totalPlinthAreaSqm, 2),
      },
      rateSummary: {
        perSqft: roundDec(effectiveRatePerSqft, 2),
        perSqm: roundDec(effectiveRatePerSqm, 2),
      },
      totalEstimatedCost: roundDec(totalEstimatedCost, 2),
      floorBreakdown: evaluatedFloors,
      constructionDuration: null, // Engineering duration methodology kept separate
      disclaimer: settings.customerDisclaimer,
      calculatedAt: new Date(),
    },
  });
};

// ─── ADMIN ENDPOINTS ────────────────────────────────────────────────────────────

// ── Rate Library ──
export const getParRatesAdmin = async (req, res) => {
  const { category, isVerified, isActive, search } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  if (search && String(search).trim()) {
    const q = String(search).trim();
    filter.$or = [
      { code: { $regex: q, $options: 'i' } },
      { title: { $regex: q, $options: 'i' } },
      { category: { $regex: q, $options: 'i' } },
      { structuralSystem: { $regex: q, $options: 'i' } },
    ];
  }

  const items = await ParRate.find(filter)
    .populate('verifiedBy', 'name email')
    .sort({ category: 1, code: 1 });

  return res.json({ success: true, count: items.length, data: items });
};

export const createParRateAdmin = async (req, res) => {
  const doc = new ParRate(req.body);
  await doc.save();
  return res.status(201).json({ success: true, data: doc });
};

export const updateParRateAdmin = async (req, res) => {
  const { id } = req.params;
  const item = await ParRate.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, error: 'PAR rate record not found' });
  return res.json({ success: true, data: item });
};

export const verifyParRateAdmin = async (req, res) => {
  const { id } = req.params;
  const { isVerified = true, auditNotes = '' } = req.body;

  const item = await ParRate.findById(id);
  if (!item) return res.status(404).json({ success: false, error: 'PAR rate record not found' });

  item.isVerified = Boolean(isVerified);
  item.verifiedBy = isVerified ? req.user?._id || null : null;
  item.verifiedAt = isVerified ? new Date() : null;
  if (auditNotes) item.auditNotes = String(auditNotes).trim();

  await item.save();
  return res.json({ success: true, data: item });
};

export const deleteParRateAdmin = async (req, res) => {
  const { id } = req.params;
  const item = await ParRate.findByIdAndDelete(id);
  if (!item) return res.status(404).json({ success: false, error: 'PAR rate record not found' });
  return res.json({ success: true, message: 'PAR rate record removed successfully' });
};

// ── Location & Cost Indices ──
export const getParLocationsAdmin = async (req, res) => {
  const { state, approvalStatus, isActive } = req.query;
  const filter = {};

  if (state) filter.state = state;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (isActive !== undefined) filter.isActive = isActive === 'true';

  const items = await ParLocation.find(filter)
    .populate('approvedBy', 'name email')
    .sort({ state: 1, locationName: 1 });

  return res.json({ success: true, count: items.length, data: items });
};

export const createParLocationAdmin = async (req, res) => {
  const doc = new ParLocation(req.body);
  await doc.save();
  return res.status(201).json({ success: true, data: doc });
};

export const updateParLocationAdmin = async (req, res) => {
  const { id } = req.params;
  const item = await ParLocation.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!item) return res.status(404).json({ success: false, error: 'Location record not found' });
  return res.json({ success: true, data: item });
};

export const approveParLocationAdmin = async (req, res) => {
  const { id } = req.params;
  const { approvalStatus = 'approved' } = req.body;

  const item = await ParLocation.findById(id);
  if (!item) return res.status(404).json({ success: false, error: 'Location record not found' });

  item.approvalStatus = approvalStatus;
  item.approvedBy = approvalStatus === 'approved' ? req.user?._id || null : null;
  item.approvedAt = approvalStatus === 'approved' ? new Date() : null;

  await item.save();
  return res.json({ success: true, data: item });
};

// ── Settings ──
export const getParSettingsAdmin = async (req, res) => {
  const settings = await ParSettings.getSettings();
  return res.json({ success: true, data: settings });
};

export const updateParSettingsAdmin = async (req, res) => {
  let settings = await ParSettings.findOne();
  if (!settings) {
    settings = new ParSettings(req.body);
  } else {
    Object.assign(settings, req.body);
  }

  if (req.user?._id) {
    settings.updatedBy = req.user._id;
  }

  await settings.save();
  return res.json({ success: true, data: settings });
};
