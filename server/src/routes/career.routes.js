import { asyncHandler } from "../utils/asyncHandler.js";
import express    from 'express';
import rateLimit  from 'express-rate-limit';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as careerController from '../controllers/career.controller.js';

const router = express.Router();

// Rate limiter stays at route level — it is a transport/infrastructure concern, not business logic
const careerApplyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many applications submitted from your IP. Please wait a few minutes.' },
});

// ── Admin routes — application management ─────────────────────
const ADMIN_ROLES = ['admin', 'superadmin', 'editor'];

// Declared BEFORE dynamic /:slug to prevent CastError / route conflict
router.get(
  '/applications/count',
  protect,
  requireRole(...ADMIN_ROLES),
  asyncHandler(careerController.getApplicationsCount)
);

router.get(
  '/applications/all',
  protect,
  requireRole(...ADMIN_ROLES),
  asyncHandler(careerController.getAllApplications)
);

router.patch(
  '/applications/:appId',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(careerController.updateApplicationStatus)
);

// ── Admin routes — job management ─────────────────────────────
router.get('/admin/list', protect, requireRole(...ADMIN_ROLES), asyncHandler(careerController.getCareersAdmin));
router.get('/admin/:id',  protect, requireRole(...ADMIN_ROLES), asyncHandler(careerController.getCareerById));
router.post('/',          protect, requireRole(...ADMIN_ROLES), asyncHandler(careerController.createCareer));
router.put('/:id',        protect, requireRole(...ADMIN_ROLES), asyncHandler(careerController.updateCareer));
router.delete('/:id',     protect, requireRole('admin', 'superadmin'), asyncHandler(careerController.deactivateCareer));
router.patch('/:id/activate', protect, requireRole('admin', 'superadmin'), asyncHandler(careerController.activateCareer));

// ── Public routes ─────────────────────────────────────────────
router.get('/',           asyncHandler(careerController.getCareers));
router.get('/:slug',      asyncHandler(careerController.getCareerBySlug));
router.post('/:slug/apply', careerApplyLimiter, asyncHandler(careerController.applyToCareer));

// ── Admin routes — per-job application management ─────────────
// GET  /api/careers/:slug/applications         — view all applications for a job
// PATCH /api/careers/:slug/applications/:appId — update application status
router.get(
  '/:slug/applications',
  protect,
  requireRole(...ADMIN_ROLES),
  asyncHandler(careerController.getApplications)
);

router.patch(
  '/:slug/applications/:appId',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(careerController.updateApplicationStatus)
);

export default router;

