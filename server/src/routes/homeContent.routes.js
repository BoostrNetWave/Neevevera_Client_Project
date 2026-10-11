import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { getHomeContent, updateHomeContent } from '../controllers/homeContent.controller.js';

const router = express.Router();

// GET /api/home — public
router.get('/', asyncHandler(getHomeContent));

// PUT /api/home — admin/superadmin only
router.put('/', protect, requireRole('admin', 'superadmin'), asyncHandler(updateHomeContent));

export default router;
