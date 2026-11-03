import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import * as researcherController from '../controllers/researcher.controller.js';

const router = express.Router();

const researcherRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many registration requests. Please wait a few minutes.' },
});

// ── Public Routes ─────────────────────────────────────────────────────────────
// POST /api/researchers/register — public researcher application submission
router.post(
  '/register',
  researcherRegisterLimiter,
  asyncHandler(researcherController.registerResearcher)
);

// GET /api/researchers/approved — public directory of approved, consented researchers
router.get(
  '/approved',
  asyncHandler(researcherController.getApprovedResearchersPublic)
);

// ── Admin-Only Routes ─────────────────────────────────────────────────────────
// GET /api/researchers — paginated listing with status and search filters
router.get(
  '/',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  asyncHandler(researcherController.getResearchersAdmin)
);

// GET /api/researchers/:id — full researcher details including unmasked contacts & proposal URL
router.get(
  '/:id',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  asyncHandler(researcherController.getResearcherAdminById)
);

// PATCH /api/researchers/:id/status — review workflow (approve, reject, under_review)
router.patch(
  '/:id/status',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(researcherController.updateResearcherStatus)
);

// DELETE /api/researchers/:id — admin removal of an application
router.delete(
  '/:id',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(researcherController.deleteResearcherAdmin)
);

export default router;
