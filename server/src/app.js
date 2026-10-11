/**
 * app.js — Neevevera Express Application
 *
 * Architecture decisions (documented here for the team):
 *
 * CORS:      Origin whitelist is driven by the ALLOWED_ORIGINS env variable in
 *            production/staging. Localhost fallback only applies in development.
 *
 * JWT Auth:  DECISION — HttpOnly cookies (sameSite: 'lax').
 *            Rationale: HttpOnly cookies are not accessible via JS,
 *            closing the XSS-token-theft vector. Bearer tokens in
 *            localStorage are convenient but exploitable. This is a
 *            firm decision; do not reopen as "cookie or bearer" later.
 *            Phase 2 auth middleware will verify req.cookies.token.
 *
 * Rate Limits:
 *   - Public write endpoints (enquiry, vendor submit, newsletter sub):
 *     10 requests / 15 min per IP — prevents form-spam.
 *   - Global API limiter: 200 requests / 15 min per IP — prevents
 *     scraping and DoS on read endpoints.
 *
 * File uploads (Phase 2):
 *   - Multer middleware (src/middleware/upload.js) enforces MIME
 *     whitelist and 10 MB file size ceiling before Cloudinary upload.
 *   - Accepted types: image/jpeg, image/png, image/webp, application/pdf.
 */

import express          from 'express';
import cors             from 'cors';
import cookieParser     from 'cookie-parser';
import mongoose         from 'mongoose';
import rateLimit        from 'express-rate-limit';

const app = express();

// ── CORS — environment-aware origin whitelist ─────────────────
const DEV_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];

const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : DEV_ORIGINS;

app.use(cors({
  origin(origin, callback) {
    // Allow server-to-server (no origin) and whitelisted origins
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,          // required for HttpOnly cookie auth
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// ── Body parsers & cookie parser ────────────────────────────
app.use(express.json({ limit: '1mb' }));                // protect from JSON bombs
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());                                // req.cookies for JWT auth

// ── Rate limiters ─────────────────────────────────────────────
/**
 * Global API limiter — all /api/* routes.
 * 200 requests per IP per 15 min window.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',   // disabled in test mode
  message: { success: false, message: 'Too many requests. Please try again later.' },
});

/**
 * Public write limiter — form submissions only.
 * 10 requests per IP per 15 min window (prevents form spam).
 */
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',   // disabled in test mode
  message: { success: false, message: 'Too many submissions from your IP. Please wait a few minutes.' },
});

app.use('/api', globalLimiter);

// ── Trust proxy for correct IP behind reverse proxies ─────────
// Required so rate limiter uses real IP, not proxy IP.
// Set to 1 if behind a single proxy (nginx/Cloudflare).
app.set('trust proxy', process.env.NODE_ENV === 'production' ? 1 : false);

// ── MongoDB Atlas connection (skipped during testing — vitest uses MongoMemoryServer) ──
if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Atlas connected — Neevevera DB'))
    .catch(err => console.error('❌ MongoDB connection error:', err.message));
}

// ── Health check ──────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    project: 'Neevevera Pvt. Ltd.',
    env: process.env.NODE_ENV || 'development',
    timestamp: new Date(),
  });
});

// ── Route imports ─────────────────────────────────────────────
import enquiryRoutes      from './routes/enquiry.routes.js';
import serviceRoutes      from './routes/service.routes.js';
import projectRoutes      from './routes/project.routes.js';
import teamRoutes         from './routes/team.routes.js';
import blogRoutes         from './routes/blog.routes.js';
import careerRoutes       from './routes/career.routes.js';
import testimonialRoutes  from './routes/testimonial.routes.js';
import vendorRoutes       from './routes/vendor.routes.js';
import newsletterRoutes   from './routes/newsletter.routes.js';
import podcastRoutes      from './routes/podcast.routes.js';
import authRoutes         from './routes/auth.routes.js';
import userRoutes         from './routes/user.routes.js';
import mediaRoutes        from './routes/media.routes.js';
import companyRoutes      from './routes/company.routes.js';
import searchRoutes       from './routes/search.routes.js';
import galleryRoutes      from './routes/gallery.routes.js';
import homeContentRoutes  from './routes/homeContent.routes.js';

// ── Mount routes ──────────────────────────────────────────────
// Public read — global rate limit only
app.use('/api/services',     serviceRoutes);
app.use('/api/projects',     projectRoutes);
app.use('/api/team',         teamRoutes);
app.use('/api/blog',         blogRoutes);
app.use('/api/testimonials', testimonialRoutes);
app.use('/api/podcast',      podcastRoutes);
app.use('/api/company',      companyRoutes);
app.use('/api/gallery',      galleryRoutes);
app.use('/api/home',         homeContentRoutes);
app.use('/api/search',       searchRoutes);

// Public write — global + write rate limit (stricter)
app.use('/api/enquiries',    writeLimiter, enquiryRoutes);
app.use('/api/careers',      careerRoutes);          // GET is public; POST /apply has its own write limiter below
app.use('/api/vendors',      writeLimiter, vendorRoutes);
app.use('/api/newsletter',   writeLimiter, newsletterRoutes);

import { uploadRouter, publicUploadRouter } from './routes/upload.routes.js';

// Auth
app.use('/api/auth', authRoutes);

// CMS user management (superadmin only)
app.use('/api/users', userRoutes);

// Media asset registry (read-only, editor+)
app.use('/api/media', mediaRoutes);

// Upload routes (image/doc upload + delete)
app.use('/api/upload', uploadRouter);
app.use('/api/public-upload', publicUploadRouter);

// ── 404 fallback ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
import { errorHandler } from './middleware/errorHandler.js';
app.use(errorHandler);

export default app;
