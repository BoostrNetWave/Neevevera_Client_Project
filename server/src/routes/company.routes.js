import { asyncHandler } from '../utils/asyncHandler.js';
/**
 * company.routes.js
 *
 * Public:    GET  /api/company          — returns the single company info document
 * Protected: PUT  /api/company          — admin upserts (superadmin/admin only)
 *
 * Singleton pattern: there is always exactly one CompanyInfo document.
 * Admin always uses PUT — never POST.
 */
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as companyController from '../controllers/company.controller.js';

const router = express.Router();

// Public — About page, footer, etc. read from this
router.get('/', asyncHandler(companyController.getCompanyInfo));

// Admin only — superadmin or admin can update company info
router.put(
  '/',
  protect,
  requireRole('superadmin', 'admin'),
  asyncHandler(companyController.updateCompanyInfo)
);

export default router;
