import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * blog.routes.js
 *
 * Soft-delete policy:
 *   Published records → soft delete (isDeleted:true)
 *   Draft (isPublished:false, never published) → hard delete permitted
 */
import express from 'express';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import * as blogController from '../controllers/blog.controller.js';

const router = express.Router();
const WRITE_ROLES = ['admin', 'superadmin', 'editor'];

// ── GET / — public list ───────────────────────────────────────
router.get('/', asyncHandler(blogController.getBlogs));

// ── GET /admin — admin list (includes drafts + deleted) ───────
router.get('/admin', protect, requireRole(...WRITE_ROLES), asyncHandler(blogController.getAdminBlogs));
router.get('/admin/:id', protect, requireRole(...WRITE_ROLES), asyncHandler(blogController.getAdminBlogById));

// ── GET /:slug — public single ───────────────────────────────
router.get('/:slug', asyncHandler(blogController.getBlogBySlug));

// ── POST / — create ───────────────────────────────────────────
router.post('/', protect, requireRole(...WRITE_ROLES), asyncHandler(blogController.createBlog));

// ── PUT /:id — update with concurrent-edit check ─────────────
router.put('/:id', protect, requireRole(...WRITE_ROLES), asyncHandler(blogController.updateBlog));

// ── DELETE /:id — soft or hard delete based on publish state ─
router.delete('/:id', protect, requireRole('admin', 'superadmin'), asyncHandler(blogController.deleteBlog));

export default router;

