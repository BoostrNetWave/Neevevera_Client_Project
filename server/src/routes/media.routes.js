/**
 * media.routes.js — MediaAsset Registry Management
 *
 * Protected: all routes require at minimum 'editor' role.
 *
 *   GET  /api/media           — list all media assets (paginated, filterable by context)
 *   GET  /api/media/:id       — single asset details
 *   GET  /api/media/orphans   — assets with usageCount === 0, older than 48h (cleanup candidates)
 *
 * NOTE: Upload (POST) and delete (DELETE) are on /api/upload — not here.
 * This router is purely read-only management/reporting.
 */

import express    from 'express';
import MediaAsset from '../models/MediaAsset.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { paginate } from '../utils/paginate.js';

const router = express.Router();
const READ_ROLES  = ['editor', 'admin', 'superadmin'];

router.use(protect, requireRole(...READ_ROLES));

// ── GET /orphans — must come before /:id ─────────────────────
// Lists assets with usageCount === 0 that were uploaded more than 48 hours ago.
// These are safe deletion candidates.
router.get('/orphans', asyncHandler(async (req, res) => {
  const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const orphans = await MediaAsset.find({
    usageCount: 0,
    isDeleted:  false,
    createdAt:  { $lt: cutoff },
  })
    .sort({ createdAt: 1 })
    .limit(100);

  res.json({
    success: true,
    count:   orphans.length,
    data:    orphans,
    note:    'These assets have no content references and can be safely deleted from /api/upload/:publicId',
  });
}));

// ── GET / — list all assets (paginated) ──────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const query = { isDeleted: false };
  if (req.query.context) query.context = req.query.context;
  if (req.query.uploadedBy) query.uploadedBy = req.query.uploadedBy;
  // Allow viewing zero-usage assets explicitly (query string ?unused=true)
  if (req.query.unused === 'true') query.usageCount = 0;

  const data = await paginate(MediaAsset, query, req, {
    sort: { createdAt: -1 },
    populate: { path: 'uploadedBy', select: 'name email' },
  });

  res.json({ success: true, ...data });
}));

// ── GET /:id — single asset ───────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const asset = await MediaAsset.findById(req.params.id).populate('uploadedBy', 'name email');
  if (!asset || asset.isDeleted) {
    return res.status(404).json({ success: false, message: 'Asset not found.' });
  }
  res.json({ success: true, data: asset });
}));

export default router;
