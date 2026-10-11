/**
 * user.routes.js — CMS Admin User Management
 *
 * All routes require authentication. Role constraints:
 *   GET  /api/users          — superadmin only: list all CMS users
 *   POST /api/users          — superadmin only: create admin / editor accounts
 *   GET  /api/users/:id      — superadmin only: get single user
 *   PATCH /api/users/:id     — superadmin only: update name / role / isActive
 *   DELETE /api/users/:id    — superadmin only: deactivate (soft) — never hard-delete
 *
 * NOTE: Admins/editors manage their OWN profile via GET /api/auth/me.
 * Superadmin does NOT manage its own account through these routes to prevent
 * accidental self-lockout. A second superadmin must do it.
 */

import express from 'express';
import bcrypt  from 'bcrypt';
import User    from '../models/User.js';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = express.Router();

// All routes in this file require authentication + superadmin role
router.use(protect, requireRole('superadmin'));

// ── GET / — list all CMS users ────────────────────────────────
router.get('/', asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select('-password')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: users });
}));

// ── GET /:id — get single user ────────────────────────────────
router.get('/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: user });
}));

// ── POST / — create new admin or editor account ───────────────
router.post('/', asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'name, email, password, and role are required.' });
  }

  const ALLOWED_ROLES = ['admin', 'editor'];
  if (!ALLOWED_ROLES.includes(role)) {
    // Superadmins are bootstrapped via script — never created via API
    return res.status(400).json({ success: false, message: `role must be one of: ${ALLOWED_ROLES.join(', ')}` });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(409).json({ success: false, message: 'An account with that email already exists.' });
  }

  const user = await User.create({
    name,
    email,
    password,
    role,
    createdBy: req.user._id,
  });

  // Never return password hash in response
  const safe = user.toObject();
  delete safe.password;

  res.status(201).json({ success: true, data: safe });
}));

// ── PATCH /:id — update name, role, or isActive ──────────────
router.patch('/:id', asyncHandler(async (req, res) => {
  // Prevent superadmin from deactivating/demoting themselves
  if (req.params.id === req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You cannot modify your own account via this endpoint. Ask another superadmin.' });
  }

  const PATCHABLE = ['name', 'role', 'isActive', 'password'];
  const updates   = {};

  for (const key of PATCHABLE) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (updates.role) {
    const VALID_ROLES = ['admin', 'editor', 'superadmin'];
    if (!VALID_ROLES.includes(updates.role)) {
      return res.status(400).json({ success: false, message: `Invalid role: ${updates.role}` });
    }
  }

  // If password is being changed, hash it before saving
  if (updates.password) {
    if (updates.password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters.' });
    }
    updates.password = await bcrypt.hash(updates.password, 12);
    // Invalidate all existing sessions by bumping tokenVersion
    updates['$inc'] = { tokenVersion: 1 };
  }

  updates.updatedBy = req.user._id;

  const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({ success: true, data: user });
}));

// ── DELETE /:id — soft-deactivate (isActive: false) ──────────
// Hard delete is intentionally not supported — preserves audit trail.
// createdBy/updatedBy refs on content records would become dangling on hard delete.
router.delete('/:id', asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'You cannot deactivate your own account.' });
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false, updatedBy: req.user._id, $inc: { tokenVersion: 1 } },
    { new: true }
  ).select('-password');

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({ success: true, message: `${user.name} has been deactivated.`, data: user });
}));

export default router;
