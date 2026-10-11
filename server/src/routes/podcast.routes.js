import { asyncHandler } from "../utils/asyncHandler.js";
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as podcastController from '../controllers/podcast.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

router.get('/',      asyncHandler(podcastController.getPodcasts));
router.get('/admin', protect, requireRole(...WRITE_ROLES), asyncHandler(podcastController.getAdminPodcasts));
router.get('/admin/:id', protect, requireRole(...WRITE_ROLES), asyncHandler(podcastController.getAdminPodcastById));
router.get('/:slug', asyncHandler(podcastController.getPodcastBySlug));
router.post('/',     protect, requireRole(...WRITE_ROLES), asyncHandler(podcastController.createPodcast));
router.put('/:id',   protect, requireRole(...WRITE_ROLES), asyncHandler(podcastController.updatePodcast));
router.delete('/:id', protect, requireRole('admin', 'superadmin'), asyncHandler(podcastController.deletePodcast));

export default router;
