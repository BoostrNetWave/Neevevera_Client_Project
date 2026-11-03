import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerPartner,
  verifyPartnerEmail,
  trackReferral,
  getAdminPartners,
  updatePartnerStatus,
  getAdminPartnerDetail,
  markEnquiryConversion,
  markIncentivePaid,
  exportIncentivesCsv,
  getPartnerSettings,
  updatePartnerSettings,
} from '../controllers/partner.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Rate limiter for partner registration (form-spam prevention)
const partnerRegisterLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many registration requests. Please wait a few minutes.' },
});

// Rate limiter for referral tracking
const partnerTrackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many referral tracking requests. Please wait a few minutes.' },
});

// ── Public Routes ─────────────────────────────────────────────
router.post('/register', partnerRegisterLimiter, registerPartner);
router.get('/verify/:token', verifyPartnerEmail);
router.post('/referral/track', partnerTrackLimiter, trackReferral);

// ── Admin Protected Routes (admin & superadmin) ───────────────
router.get('/admin', protect, requireRole('admin', 'superadmin'), getAdminPartners);
router.get('/admin/settings', protect, requireRole('admin', 'superadmin'), getPartnerSettings);
router.put('/admin/settings', protect, requireRole('admin', 'superadmin'), updatePartnerSettings);
router.get('/admin/incentives/export', protect, requireRole('admin', 'superadmin'), exportIncentivesCsv);
router.get('/admin/:id', protect, requireRole('admin', 'superadmin'), getAdminPartnerDetail);
router.patch('/admin/:id/status', protect, requireRole('admin', 'superadmin'), updatePartnerStatus);
router.patch('/admin/enquiries/:id/conversion', protect, requireRole('admin', 'superadmin'), markEnquiryConversion);
router.post('/admin/incentives/:id/mark-paid', protect, requireRole('admin', 'superadmin'), markIncentivePaid);

export default router;

