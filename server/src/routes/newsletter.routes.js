import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * newsletter.routes.js
 *
 * Public write (§4.2):
 *   POST /api/newsletter/subscribe
 *   POST /api/newsletter/unsubscribe
 *
 * Admin-only (§4.3):
 *   GET /api/newsletter/subscribers
 */
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as newsletterController from '../controllers/newsletter.controller.js';

const router = express.Router();

router.post('/subscribe',   asyncHandler(newsletterController.subscribe));
router.post('/unsubscribe', asyncHandler(newsletterController.unsubscribe));
router.get('/subscribers',  protect, requireRole('admin', 'superadmin'), asyncHandler(newsletterController.getSubscribers));

export default router;
