import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * vendor.routes.js
 *
 * Public write  (§4.2 — unauthenticated, allowlisted):
 *   POST /api/vendors
 *
 * Admin-only reads (§4.3):
 *   GET  /api/vendors
 *   GET  /api/vendors/:id
 *   PATCH /api/vendors/:id/status
 */
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as vendorController from '../controllers/vendor.controller.js';

const router = express.Router();

// Public: unauthenticated vendor enrolment
router.post('/', asyncHandler(vendorController.registerVendor));

// Admin-only
router.get('/',    protect, requireRole('admin', 'superadmin'), asyncHandler(vendorController.getVendors));
router.get('/:id', protect, requireRole('admin', 'superadmin'), asyncHandler(vendorController.getVendor));
router.patch('/:id/status', protect, requireRole('admin', 'superadmin'), asyncHandler(vendorController.updateVendorStatus));

export default router;
