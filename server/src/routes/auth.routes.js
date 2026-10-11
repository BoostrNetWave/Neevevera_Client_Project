import express    from 'express';
import rateLimit  from 'express-rate-limit';
import { loginUser, logoutUser, refreshToken, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Login-specific rate limiter: 5 attempts / 15 min / IP
// Separate instance from general and upload limiters.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many login attempts. Please wait 15 minutes.' },
});

import { asyncHandler } from '../utils/asyncHandler.js';

// POST /api/auth/login
router.post('/login',   loginLimiter, asyncHandler(loginUser));

// POST /api/auth/logout — protect middleware increments tokenVersion
router.post('/logout',  protect, asyncHandler(logoutUser));

// POST /api/auth/refresh — issues a new accessToken from a valid refreshToken
router.post('/refresh', asyncHandler(refreshToken));

// GET  /api/auth/me — returns current admin profile
router.get('/me', protect, asyncHandler(getMe));

// NOTE: /api/auth/seed intentionally removed.
// Use: node scripts/createSuperAdmin.js (or: npm run create-admin)
// to bootstrap the first superadmin. No HTTP seed endpoint in any environment.

export default router;
