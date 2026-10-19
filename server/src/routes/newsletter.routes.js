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

import rateLimit from 'express-rate-limit';

const newsletterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, message: 'Too many submissions from your IP. Please wait a few minutes.' },
});

router.post('/subscribe',   newsletterLimiter, asyncHandler(newsletterController.subscribe));
router.post('/unsubscribe', newsletterLimiter, asyncHandler(newsletterController.unsubscribe));
router.get('/subscribers',  protect, requireRole('admin', 'superadmin'), asyncHandler(newsletterController.getSubscribers));

export default router;
