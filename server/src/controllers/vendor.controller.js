import Vendor from '../models/Vendor.js';
import { paginate } from '../utils/paginate.js';

// POST / — public, unauthenticated vendor registration
export const registerVendor = async (req, res) => {
  const existing = await Vendor.findOne({ email: req.body.email?.toLowerCase() });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'A registration with this email already exists. Our team will contact you.',
    });
  }
  const vendor = await Vendor.create(req.body);
  res.status(201).json({
    success: true,
    message: 'Vendor registration received. Our team will review within 2-3 business days.',
    data: { id: vendor._id },
  });
};

// GET / — admin list with pagination
export const getVendors = async (req, res) => {
  const filter = {};
  if (req.query.status)        filter.status        = req.query.status;
  if (req.query.tradeCategory) filter.tradeCategory = req.query.tradeCategory;
  const data = await paginate(Vendor, filter, req);
  res.json({ success: true, ...data });
};

// GET /:id — single vendor detail (admin)
export const getVendor = async (req, res) => {
  const vendor = await Vendor.findById(req.params.id);
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });
  res.json({ success: true, data: vendor });
};

// PATCH /:id/status — admin approval workflow
// Only allows: status, adminNotes, reviewedBy — never the full body
export const updateVendorStatus = async (req, res) => {
  const { status, adminNotes, reviewedBy } = req.body;
  const vendor = await Vendor.findByIdAndUpdate(
    req.params.id,
    { status, adminNotes, reviewedBy, reviewedAt: new Date() },
    { new: true, runValidators: true }
  );
  if (!vendor) return res.status(404).json({ success: false, message: 'Vendor not found.' });
  res.json({ success: true, message: 'Vendor status updated.', data: vendor });
};
