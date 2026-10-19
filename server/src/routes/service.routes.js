import { asyncHandler } from "../utils/asyncHandler.js";
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as serviceController from '../controllers/service.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

router.get('/',         asyncHandler(serviceController.getServices));
// Admin-only: returns ALL services including inactive — must come before /:slug
router.get('/admin',    protect, requireRole(...WRITE_ROLES), asyncHandler(serviceController.getServicesAdmin));
// Admin single-service by _id (must come before /:slug to avoid conflict)
router.get('/id/:id',  protect, requireRole(...WRITE_ROLES), asyncHandler(serviceController.getServiceById));
router.get('/:slug',   asyncHandler(serviceController.getServiceBySlug));
router.post('/',       protect, requireRole(...WRITE_ROLES), asyncHandler(serviceController.createService));
router.put('/:id',     protect, requireRole(...WRITE_ROLES), asyncHandler(serviceController.updateService));
router.delete('/:id',  protect, requireRole('admin', 'superadmin'), asyncHandler(serviceController.deactivateService));
router.patch('/:id/activate', protect, requireRole('admin', 'superadmin'), asyncHandler(serviceController.activateService));

export default router;
