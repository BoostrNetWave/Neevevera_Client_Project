import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * project.routes.js
 *
 * Public:    GET  /api/projects        — paginated, isDeleted:false
 *            GET  /api/projects/:slug  — single project
 * Protected: POST /api/projects
 *            PUT  /api/projects/:id   — with concurrent-edit check
 *            DELETE /api/projects/:id — soft delete only
 */
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as projectController from '../controllers/project.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

// ── GET / — public list ───────────────────────────────────────
router.get('/', asyncHandler(projectController.getProjects));

// ── GET /:slug — public single ───────────────────────────────
router.get('/:slug', asyncHandler(projectController.getProjectBySlug));

// ── GET /admin/:id — protected fetch by ID for CMS ───────────
router.get('/admin/:id', protect, requireRole(...WRITE_ROLES), asyncHandler(projectController.getProjectById));

// ── POST / — create (protected) ──────────────────────────────
router.post('/', protect, requireRole(...WRITE_ROLES), asyncHandler(projectController.createProject));

// ── PUT /:id — update with concurrent-edit protection ────────
router.put('/:id', protect, requireRole(...WRITE_ROLES), asyncHandler(projectController.updateProject));

// ── DELETE /:id — soft delete only ───────────────────────────
router.delete('/:id', protect, requireRole('admin', 'superadmin'), asyncHandler(projectController.deleteProject));

export default router;
