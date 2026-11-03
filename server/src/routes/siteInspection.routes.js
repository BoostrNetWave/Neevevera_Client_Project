import express from 'express';
import rateLimit from 'express-rate-limit';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
  getConfig,
  checkCoverage,
  getAvailableSlots,
  createBooking,
  verifyPayment,
  getBookingStatus,
  adminGetSettings,
  adminUpdateSettings,
  adminGetSlots,
  adminCreateSlot,
  adminUpdateSlot,
  adminDeleteSlot,
  adminGetBookings,
  adminGetBooking,
  adminAssignStaff,
  adminAddNote,
  adminReschedule,
  adminCancelBooking,
  adminRequestRefund,
  adminMarkVisitComplete,
  adminGetPaymentAttempts,
  staffGetMyVisits,
  staffUpdateVisitStatus,
  staffSubmitVisitReport,
} from '../controllers/siteInspection.controller.js';

const router = express.Router();

// ── Rate limiters ──────────────────────────────────────────────
const bookingCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 5,
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many booking attempts from your IP. Please wait a few minutes.' },
});

const statusCheckLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 20,
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many status checks. Please try again shortly.' },
});

const coverageLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 10000 : 30,
  standardHeaders: true, legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many coverage checks. Please slow down.' },
});

// ─────────────────────────────────────────────────────────────
//  PUBLIC ENDPOINTS
// ─────────────────────────────────────────────────────────────

// GET /api/site-inspections/config
router.get('/config', getConfig);

// GET /api/site-inspections/check-coverage?pinCode=...
router.get('/check-coverage', coverageLimiter, checkCoverage);

// GET /api/site-inspections/slots?from=...&to=...&pinCode=...
router.get('/slots', getAvailableSlots);

// POST /api/site-inspections/bookings
router.post('/bookings', bookingCreateLimiter, createBooking);

// POST /api/site-inspections/bookings/:bookingRef/verify-payment
router.post('/bookings/:bookingRef/verify-payment', verifyPayment);

// GET /api/site-inspections/bookings/:bookingRef/status
router.get('/bookings/:bookingRef/status', statusCheckLimiter, getBookingStatus);

// ─────────────────────────────────────────────────────────────
//  ADMIN — SETTINGS
// ─────────────────────────────────────────────────────────────

router.get(
  '/admin/settings',
  protect, requireRole('admin', 'superadmin'),
  adminGetSettings
);
router.put(
  '/admin/settings',
  protect, requireRole('admin', 'superadmin'),
  adminUpdateSettings
);

// ─────────────────────────────────────────────────────────────
//  ADMIN — SLOT MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get(
  '/admin/slots',
  protect, requireRole('editor', 'admin', 'superadmin'),
  adminGetSlots
);
router.post(
  '/admin/slots',
  protect, requireRole('admin', 'superadmin'),
  adminCreateSlot
);
router.put(
  '/admin/slots/:id',
  protect, requireRole('admin', 'superadmin'),
  adminUpdateSlot
);
router.delete(
  '/admin/slots/:id',
  protect, requireRole('admin', 'superadmin'),
  adminDeleteSlot
);

// ─────────────────────────────────────────────────────────────
//  ADMIN — BOOKING MANAGEMENT
// ─────────────────────────────────────────────────────────────

router.get(
  '/admin/bookings',
  protect, requireRole('editor', 'admin', 'superadmin'),
  adminGetBookings
);
router.get(
  '/admin/bookings/:id',
  protect, requireRole('editor', 'admin', 'superadmin'),
  adminGetBooking
);
router.patch(
  '/admin/bookings/:id/assign',
  protect, requireRole('admin', 'superadmin'),
  adminAssignStaff
);
router.patch(
  '/admin/bookings/:id/note',
  protect, requireRole('editor', 'admin', 'superadmin'),
  adminAddNote
);
router.post(
  '/admin/bookings/:id/reschedule',
  protect, requireRole('admin', 'superadmin'),
  adminReschedule
);
router.post(
  '/admin/bookings/:id/cancel',
  protect, requireRole('admin', 'superadmin'),
  adminCancelBooking
);
router.post(
  '/admin/bookings/:id/refund',
  protect, requireRole('superadmin'),
  adminRequestRefund
);
router.patch(
  '/admin/bookings/:id/complete',
  protect, requireRole('editor', 'admin', 'superadmin'),
  adminMarkVisitComplete
);
router.get(
  '/admin/bookings/:bookingRef/payment-attempts',
  protect, requireRole('admin', 'superadmin'),
  adminGetPaymentAttempts
);

// ─────────────────────────────────────────────────────────────────────────────
//  FIELD STAFF MOBILE WORKFLOW (field_staff, admin, superadmin)
// ─────────────────────────────────────────────────────────────────────────────

router.get(
  '/staff/my-visits',
  protect,
  requireRole('field_staff', 'admin', 'superadmin'),
  staffGetMyVisits
);

router.patch(
  '/staff/visits/:id/status',
  protect,
  requireRole('field_staff', 'admin', 'superadmin'),
  staffUpdateVisitStatus
);

router.post(
  '/staff/visits/:id/report',
  protect,
  requireRole('field_staff', 'admin', 'superadmin'),
  staffSubmitVisitReport
);

export default router;
