import jwt  from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * protect — verifies the accessToken cookie.
 * Attaches req.user (full Mongoose document) on success.
 *
 * Applied per-route explicitly — never assumed inherited from a parent router.
 * A single route added later without this middleware is an unprotected door.
 */
async function protect(req, res, next) {
  // Prefer HttpOnly cookie (production / same-origin), fall back to
  // Authorization: Bearer <token> (useful in dev where ports differ).
  let token = req.cookies?.accessToken;

  if (!token) {
    const auth = req.headers.authorization;
    if (auth?.startsWith('Bearer ')) token = auth.slice(7);
  }

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * requireRole(...roles) — RBAC guard.
 * Must be called AFTER protect(), since it relies on req.user.
 *
 * Usage: router.put('/projects/:id', protect, requireRole('admin','superadmin'), updateProject);
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

export { protect, requireRole };
