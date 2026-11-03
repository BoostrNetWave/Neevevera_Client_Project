import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as parController from '../controllers/par.controller.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────
// GET /api/par/public-meta — Approved categories, locations, and settings state
router.get(
  '/public-meta',
  asyncHandler(parController.getPublicParMeta)
);

// POST /api/par/estimate — Server-authoritative floor-wise estimate calculation
router.post(
  '/estimate',
  asyncHandler(parController.calculateEstimate)
);

// ── Admin Protected Routes ───────────────────────────────────────────────────

// Rate Library
router.get(
  '/rates',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  asyncHandler(parController.getParRatesAdmin)
);

router.post(
  '/rates',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.createParRateAdmin)
);

router.put(
  '/rates/:id',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.updateParRateAdmin)
);

router.patch(
  '/rates/:id/verify',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.verifyParRateAdmin)
);

router.delete(
  '/rates/:id',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.deleteParRateAdmin)
);

// Locations & Cost Indices
router.get(
  '/locations',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  asyncHandler(parController.getParLocationsAdmin)
);

router.post(
  '/locations',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.createParLocationAdmin)
);

router.put(
  '/locations/:id',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.updateParLocationAdmin)
);

router.patch(
  '/locations/:id/approve',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.approveParLocationAdmin)
);

// Estimator Settings
router.get(
  '/settings',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  asyncHandler(parController.getParSettingsAdmin)
);

router.put(
  '/settings',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(parController.updateParSettingsAdmin)
);

export default router;
