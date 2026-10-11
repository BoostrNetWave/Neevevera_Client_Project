import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * enquiry.routes.js
 *
 * Public write  (§4.2 — must remain unauthenticated, explicitly allowlisted):
 *   POST /api/enquiries
 *
 * Admin-only reads (§4.3):
 *   GET   /api/enquiries
 *   PATCH /api/enquiries/:id
 */
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as enquiryController from '../controllers/enquiry.controller.js';

const router = express.Router();

// Public: unauthenticated — allowlisted route, no protect middleware
router.post('/', asyncHandler(enquiryController.submitEnquiry));

// Admin inbox
router.get('/', protect, requireRole('admin', 'superadmin', 'editor'), asyncHandler(enquiryController.getEnquiries));

// Admin status update (field-whitelisted in controller)
router.patch('/:id', protect, requireRole('admin', 'superadmin'), asyncHandler(enquiryController.updateEnquiry));

export default router;
