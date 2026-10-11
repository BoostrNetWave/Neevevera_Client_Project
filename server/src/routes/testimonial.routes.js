import { asyncHandler } from "../utils/asyncHandler.js";
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as testimonialController from '../controllers/testimonial.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

router.get('/',         asyncHandler(testimonialController.getTestimonials));
router.get('/admin',    protect, requireRole(...WRITE_ROLES), asyncHandler(testimonialController.getTestimonialsAdmin));
router.get('/admin/:id',protect, requireRole(...WRITE_ROLES), asyncHandler(testimonialController.getTestimonialById));
router.post('/',        protect, requireRole(...WRITE_ROLES), asyncHandler(testimonialController.createTestimonial));
router.put('/:id', protect, requireRole(...WRITE_ROLES), asyncHandler(testimonialController.updateTestimonial));
router.delete('/:id', protect, requireRole('admin', 'superadmin'), asyncHandler(testimonialController.deleteTestimonial));

export default router;
