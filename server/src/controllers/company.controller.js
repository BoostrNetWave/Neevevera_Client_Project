import CompanyInfo from '../models/CompanyInfo.js';
import { syncDocMediaUsage } from '../utils/mediaFields.js';

/**
 * company.controller.js
 *
 * Singleton pattern:
 *   GET  — findOne() — always returns the single record
 *   PUT  — findOneAndUpdate with upsert:true — creates if missing, updates if exists
 *
 * This means the admin never POSTs to create — they always PUT.
 * The record is seeded via create-company-info.js bootstrap script.
 */

// GET /api/company — public, no auth required
export const getCompanyInfo = async (req, res) => {
  const info = await CompanyInfo.findOne({ _singleton: 'company' })
    .populate('updatedBy', 'name email')
    .lean();

  if (!info) {
    return res.status(404).json({
      success: false,
      message: 'Company information not yet configured. Run the bootstrap script.',
    });
  }

  res.json({ success: true, data: info });
};

// PUT /api/company — admin only, upsert
// Fields explicitly whitelisted — never blindly spread req.body into a singleton
export const updateCompanyInfo = async (req, res) => {
  const ALLOWED = [
    'name', 'tagline', 'overview', 'mission', 'vision',
    'history', 'foundedYear', 'headquarters',
    'values', 'certifications', 'awards', 'stats',
    'email', 'phone', 'address', 'gstNumber', 'cinNumber', 'website',
    'social', 'logoLight', 'logoDark',
  ];

  const updates = {};
  for (const key of ALLOWED) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ success: false, message: 'No valid fields provided.' });
  }

  updates.updatedBy = req.user._id;

  const current = await CompanyInfo.findOne({ _singleton: 'company' });

  const info = await CompanyInfo.findOneAndUpdate(
    { _singleton: 'company' },
    { $set: updates },
    { returnDocument: 'after', upsert: true, runValidators: true }
  );

  await syncDocMediaUsage('CompanyInfo', current, info);

  res.json({ success: true, data: info });
};
