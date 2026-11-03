import express from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import {
  searchPublicDsrItems,
  getPublicDsrItems,
  calculateEstimate,
  submitQuotationEnquiry,
  getAdminDsrItems,
  createDsrItem,
  updateDsrItem,
  overrideDsrItem,
  toggleDsrItemStatus,
  deleteDsrItem,
  getDsrSettings,
  updateDsrSettings,
  exportDsrCsv,
  downloadImportTemplate,
  previewDsrCsvImport,
  commitDsrCsvImport,
  getDsrImportHistory,
} from '../controllers/dsr.controller.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

// Multer in-memory storage for CSV imports (strictly bounded, never written to disk)
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const isCsvExt = file.originalname?.toLowerCase().endsWith('.csv');
    if (isCsvExt) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files (.csv) are allowed.'));
    }
  },
});

// M3: Moderate rate limit for public estimate calculation (prevent enumeration)
export const dsrEstimateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many estimate requests. Please wait a few minutes.' },
});

// M3: Strict write limit for quotation submissions (prevent spam)
export const dsrQuotationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many quotation submissions from your IP. Please wait a few minutes.' },
});

// Rate limit for admin CSV imports (prevent rapid-fire bulk staging)
export const dsrImportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { success: false, error: 'Too many import requests. Please wait a few minutes.' },
});

// ── Public Routes (Zero Raw DSR Rates Exposed) ────────────────
router.get('/search', searchPublicDsrItems);
router.get('/public', getPublicDsrItems);
router.post('/estimate', dsrEstimateLimiter, calculateEstimate);
router.post('/quotation', dsrQuotationLimiter, submitQuotationEnquiry);

// ── Admin Protected Routes (Editor, Admin, Superadmin) ─────────
router.get('/admin/items', protect, requireRole('editor', 'admin', 'superadmin'), getAdminDsrItems);
router.post('/admin/items', protect, requireRole('editor', 'admin', 'superadmin'), createDsrItem);
router.put('/admin/items/:id', protect, requireRole('editor', 'admin', 'superadmin'), updateDsrItem);
router.patch('/admin/items/:id/status', protect, requireRole('editor', 'admin', 'superadmin'), toggleDsrItemStatus);
router.patch('/admin/items/:id/override', protect, requireRole('admin', 'superadmin'), overrideDsrItem);
router.delete('/admin/items/:id', protect, requireRole('admin', 'superadmin'), deleteDsrItem);

// ── Admin Settings ─────────────────────────────────────────────
router.get('/admin/settings', protect, requireRole('editor', 'admin', 'superadmin'), getDsrSettings);
router.put('/admin/settings', protect, requireRole('admin', 'superadmin'), updateDsrSettings);
router.get('/admin/export-csv', protect, requireRole('editor', 'admin', 'superadmin'), exportDsrCsv);

// ── Admin CSV Import Pipeline (admin / superadmin only) ─────────
router.get('/admin/import-csv/template', protect, requireRole('editor', 'admin', 'superadmin'), downloadImportTemplate);
router.get('/admin/import-template', protect, requireRole('editor', 'admin', 'superadmin'), downloadImportTemplate);
router.post(
  '/admin/import-csv/preview',
  protect,
  requireRole('admin', 'superadmin'),
  dsrImportLimiter,
  csvUpload.single('file'),
  previewDsrCsvImport
);
router.post(
  '/admin/import-csv/:batchId/commit',
  protect,
  requireRole('admin', 'superadmin'),
  dsrImportLimiter,
  commitDsrCsvImport
);
router.get(
  '/admin/import-csv/history',
  protect,
  requireRole('admin', 'superadmin'),
  getDsrImportHistory
);

// Backwards-compatible admin listing alias
router.get('/admin', protect, requireRole('editor', 'admin', 'superadmin'), getAdminDsrItems);
router.post('/admin', protect, requireRole('editor', 'admin', 'superadmin'), createDsrItem);
router.put('/admin/:id', protect, requireRole('editor', 'admin', 'superadmin'), updateDsrItem);
router.delete('/admin/:id', protect, requireRole('admin', 'superadmin'), deleteDsrItem);

export default router;
