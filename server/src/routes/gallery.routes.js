import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as gc from '../controllers/gallery.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

// Public
router.get('/',            asyncHandler(gc.getGallery));

// Admin
router.get('/admin',       protect, requireRole(...WRITE_ROLES), asyncHandler(gc.getAdminGallery));
router.get('/:id',         protect, requireRole(...WRITE_ROLES), asyncHandler(gc.getGalleryItemById));
router.post('/',           protect, requireRole(...WRITE_ROLES), asyncHandler(gc.createGalleryItem));
router.put('/:id',         protect, requireRole(...WRITE_ROLES), asyncHandler(gc.updateGalleryItem));
router.patch('/:id/visibility', protect, requireRole(...WRITE_ROLES), asyncHandler(gc.toggleVisibility));
router.delete('/:id',      protect, requireRole('admin', 'superadmin'), asyncHandler(gc.deleteGalleryItem));

export default router;
