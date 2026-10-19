import bcrypt from 'bcrypt';
import jwt    from 'jsonwebtoken';
import User   from '../models/User.js';

// Cookie factory — keeps cookie options consistent between login and refresh
function setCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: isProd ? 'Strict' : 'Lax',
    maxAge:   8 * 60 * 60 * 1000,           // 8 hours
  });

  if (refreshToken !== undefined) {
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   isProd,
      sameSite: isProd ? 'Strict' : 'Lax',
      maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
    });
  }
}

function clearCookies(res) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

// ── POST /api/auth/login ─────────────────────────────────────
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body ?? {};

    if (typeof email !== 'string' || !email.trim() ||
        typeof password !== 'string' || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Must use .select('+password') — field is select:false by default
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

    if (!user || !user.isActive) {
      // Same message for both "not found" and "inactive" — prevents user enumeration
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials.' });

    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id, tokenVersion: user.tokenVersion },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '30d' }
    );

    setCookies(res, accessToken, refreshToken);

    // Update lastLogin without triggering pre-save hook (no password re-hash)
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    return res.status(200).json({
      message: 'Logged in successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      accessToken, // also returned in body for Bearer-header usage (dev / cross-port)
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── POST /api/auth/logout ────────────────────────────────────
export async function logoutUser(req, res) {
  try {
    // Increment tokenVersion to invalidate ALL outstanding refresh tokens for this user
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { tokenVersion: 1 } });
    }
    clearCookies(res);
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── POST /api/auth/refresh ───────────────────────────────────
export async function refreshToken(req, res) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ error: 'No refresh token.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      clearCookies(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      clearCookies(res);
      return res.status(401).json({ error: 'User not found or inactive.' });
    }

    // tokenVersion check — ensures "log out everywhere" and post-password-change
    // invalidation actually work
    if (decoded.tokenVersion !== user.tokenVersion) {
      clearCookies(res);
      return res.status(401).json({ error: 'Session invalidated. Please log in again.' });
    }

    const newAccessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Set only the access token — refresh token is untouched unless close to expiry
    setCookies(res, newAccessToken, undefined);

    return res.status(200).json({ message: 'Token refreshed.', accessToken: newAccessToken });
  } catch (err) {
    console.error('Refresh error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
}

// ── GET /api/auth/me ─────────────────────────────────────────
export async function getMe(req, res) {
  // req.user attached by protect middleware
  const { _id, name, email, role, lastLogin } = req.user;
  return res.status(200).json({ id: _id, name, email, role, lastLogin });
}
