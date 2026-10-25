import express from 'express';
import {
  checkPincodeCoverage,
  getAllServiceAreas,
  createServiceArea,
  updateServiceArea,
  deleteServiceArea,
} from '../controllers/serviceArea.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────
// Global check endpoint (covered by globalLimiter in app.js)
router.get('/check', checkPincodeCoverage);

// ── Admin Protected Routes ────────────────────────────────────
router.get('/', protect, requireRole('admin', 'superadmin'), getAllServiceAreas);
router.post('/', protect, requireRole('admin', 'superadmin'), createServiceArea);
router.put('/:id', protect, requireRole('admin', 'superadmin'), updateServiceArea);
router.delete('/:id', protect, requireRole('admin', 'superadmin'), deleteServiceArea);

export default router;
