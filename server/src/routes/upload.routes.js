import { asyncHandler } from "../utils/asyncHandler.js";
/**
 * upload.routes.js — Two-phase commit upload pipeline.
 *
 * ADMIN UPLOADS (require authentication):
 *   POST /api/upload/image         — serviceImage, projectImage, teamPhoto, galleryMedia
 *   POST /api/upload/document      — admin-uploaded PDFs (not resume/vendor)
 *   POST /api/upload/signed-url    — pre-signed URL for large direct-browser uploads
 *   DELETE /api/upload/:publicId   — safe delete: Cloudinary first, then MediaAsset record
 *
 * PUBLIC UPLOADS (unauthenticated, strictly limited contexts):
 *   POST /api/public-upload/resume          — job applications
 *   POST /api/public-upload/vendor-document — vendor registrations
 *
 * Two-phase commit pattern:
 *   1. Client uploads file via this route first — gets back { url, publicId }
 *   2. Client then POSTs the content resource (Project, Career apply, etc.) with the URL.
 *   3. A content record is never created with a missing/partial image reference.
 */

import express    from 'express';
import rateLimit  from 'express-rate-limit';
import { v2 as cloudinary } from 'cloudinary';
import { protect, requireRole } from '../middleware/auth.middleware.js';
import {
  multerUpload,
  validateUpload,
  uploadToCloudinary,
  generateSignedUpload,
} from '../middleware/upload.middleware.js';
import MediaAsset from '../models/MediaAsset.js';

const router        = express.Router();
const publicRouter  = express.Router();

// ── Admin upload rate limiter: 20 uploads / 10 min / IP ──────
const adminUploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many uploads. Please wait a few minutes.' },
});

// ── Public upload rate limiter: 5 uploads / 15 min / IP ──────
const publicUploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many upload attempts. Please wait.' },
});

// ── Helper: create MediaAsset record after Cloudinary upload ──
async function persistMediaAsset({ result, context, originalname, mimeType, uploadedBy }) {
  return MediaAsset.create({
    url:          result.secure_url,
    publicId:     result.public_id,
    context,
    originalName: originalname,
    mimeType,
    sizeBytes:    result.bytes,
    uploadedBy:   uploadedBy || null,
    usageCount:   0,
  });
}

// ══ ADMIN ROUTES ═════════════════════════════════════════════

const IMAGE_CONTEXTS = ['serviceImage', 'projectImage', 'teamPhoto', 'galleryMedia'];

router.post(
  '/image',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  adminUploadLimiter,
  multerUpload.single('file'),
  // Dynamic validation middleware wrapper based on req.body.context
  (req, res, next) => {
    if (!IMAGE_CONTEXTS.includes(req.body.context)) {
      return res.status(400).json({ error: `context must be one of: ${IMAGE_CONTEXTS.join(', ')}` });
    }
    validateUpload(req.body.context)(req, res, next);
  },
  asyncHandler(async (req, res) => {
    const context  = req.body.context;
    // req.detectedMimeType is set by validateUpload() middleware above
    const mimeType = req.detectedMimeType || req.file.mimetype;

    try {
      const result = await uploadToCloudinary(req.file.buffer, context, req.file.originalname);
      const asset  = await persistMediaAsset({
        result,
        context,
        originalname: req.file.originalname,
        mimeType,
        uploadedBy:   req.user._id,
      });
      return res.status(201).json({
        success: true,
        url:      result.secure_url,
        publicId: result.public_id,
        assetId:  asset._id,
      });
    } catch (err) {
      console.error('Image upload failed:', err);
      return res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  })
);

// POST /api/upload/signed-url — pre-signed URL for large direct-browser uploads
//
// Requires fileSizeBytes in request body so the server can enforce the per-context
// size limit BEFORE issuing the Cloudinary signature. A client that skips the browser
// form and calls this endpoint directly (Postman, scripts) will hit this check — the
// signature is never issued for oversized files regardless of upload path.
//
// Note: fileSizeBytes is still client-reported (server never sees actual bytes), so
// this is not a perfect cryptographic guarantee — but it closes the "bypass the
// browser" case. Cloudinary's own account-level limit acts as the final backstop.
router.post(
  '/signed-url',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  asyncHandler(async (req, res) => {
    const { context, fileSizeBytes } = req.body;

    // 1. Validate context exists
    const { UPLOAD_CONTEXTS } = await import('../middleware/upload.middleware.js');
    const config = UPLOAD_CONTEXTS[context];
    if (!config) {
      return res.status(400).json({ error: `Unknown upload context: ${context}` });
    }

    // 2. Server-side size enforcement — signature is never issued for oversized files
    const maxBytes = config.maxSizeMB * 1024 * 1024;
    if (!fileSizeBytes || typeof fileSizeBytes !== 'number' || fileSizeBytes <= 0) {
      return res.status(400).json({ error: 'fileSizeBytes must be provided as a positive number.' });
    }
    if (fileSizeBytes > maxBytes) {
      return res.status(400).json({
        error: `File exceeds the ${config.maxSizeMB} MB limit for context "${context}".`,
      });
    }

    // 3. Size check passed — issue the Cloudinary signature
    try {
      const signedData = generateSignedUpload(context);
      return res.status(200).json({ success: true, ...signedData });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  })
);

// POST /api/upload/confirm-signed-upload — bridge a direct Cloudinary upload into a MediaAsset
router.post(
  '/confirm-signed-upload',
  protect,
  requireRole('admin', 'superadmin', 'editor'),
  adminUploadLimiter,
  asyncHandler(async (req, res) => {
    const { url, publicId, context, originalName, mimeType, sizeBytes } = req.body;
    
    if (!url || !publicId || !context) {
      return res.status(400).json({ error: 'url, publicId, and context are required.' });
    }
    
    const { UPLOAD_CONTEXTS } = await import('../middleware/upload.middleware.js');
    if (!UPLOAD_CONTEXTS[context]) {
      return res.status(400).json({ error: `Unknown context: ${context}` });
    }

    // Integrity check: Ensure the signed upload actually matches our expected folder
    const expectedPrefix = `neevevera/${context}/`;
    if (!publicId.startsWith(expectedPrefix)) {
      return res.status(400).json({ error: 'Invalid publicId for the specified context.' });
    }

    const asset = await persistMediaAsset({
      result: { secure_url: url, public_id: publicId, bytes: sizeBytes || 0 },
      context,
      originalname: originalName || 'direct-upload',
      mimeType: mimeType || 'application/octet-stream',
      uploadedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      url: asset.url,
      publicId: asset.publicId,
      assetId: asset._id,
    });
  })
);

// DELETE /api/upload/:publicId — safe delete: Cloudinary first, then DB record
router.delete(
  '/:publicId',
  protect,
  requireRole('admin', 'superadmin'),
  asyncHandler(async (req, res) => {
    try {
      const asset = await MediaAsset.findOne({ publicId: req.params.publicId });
      if (!asset) return res.status(404).json({ error: 'Asset not found.' });

      if (asset.usageCount > 0) {
        return res.status(409).json({
          error: `Asset is referenced by ${asset.usageCount} content record(s). Remove those references first.`,
        });
      }

      // Step 1: Attempt to destroy on Cloudinary.
      // We wrap this in a try/catch because API keys with restricted permissions
      // will throw 403 on delete. We still want to remove the DB record so the CMS doesn't get stuck.
      const resourceType = asset.mimeType?.startsWith('video/') ? 'video' : 'image';
      try {
        await cloudinary.uploader.destroy(asset.publicId, { resource_type: resourceType });
      } catch (cloudErr) {
        console.warn(`[Cloudinary] Failed to delete ${asset.publicId} from cloud (continuing DB delete). Error:`, cloudErr.message || cloudErr);
      }

      // Step 2: Only now delete the DB record.
      await MediaAsset.findByIdAndDelete(asset._id);

      return res.status(200).json({ success: true, message: 'Asset deleted.' });
    } catch (err) {
      console.error('Asset delete failed:', err);
      return res.status(500).json({ error: 'Deletion failed. Asset record preserved for retry.' });
    }
  })
);

// ══ PUBLIC ROUTES ═════════════════════════════════════════════
// Strictly scoped: cannot delete, cannot choose folder, cannot bypass context.

// POST /api/public-upload/resume — job applicants uploading CVs
publicRouter.post(
  '/resume',
  publicUploadLimiter,
  multerUpload.single('file'),
  validateUpload('resume'),
  asyncHandler(async (req, res) => {
    try {
      const result = await uploadToCloudinary(req.file.buffer, 'resume', req.file.originalname);
      await persistMediaAsset({
        result,
        context:      'resume',
        originalname: req.file.originalname,
        mimeType:     req.detectedMimeType,
        uploadedBy:   null, // anonymous
      });
      return res.status(201).json({ success: true, url: result.secure_url });
    } catch (err) {
      console.error('Public resume upload failed:', err);
      return res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  })
);

// POST /api/public-upload/vendor-document — vendors uploading capability statements
publicRouter.post(
  '/vendor-document',
  publicUploadLimiter,
  multerUpload.single('file'),
  validateUpload('vendorDocument'),
  asyncHandler(async (req, res) => {
    try {
      const result = await uploadToCloudinary(req.file.buffer, 'vendorDocument', req.file.originalname);
      await persistMediaAsset({
        result,
        context:      'vendorDocument',
        originalname: req.file.originalname,
        mimeType:     req.detectedMimeType,
        uploadedBy:   null,
      });
      return res.status(201).json({ success: true, url: result.secure_url });
    } catch (err) {
      console.error('Public vendor-document upload failed:', err);
      return res.status(500).json({ error: 'Upload failed. Please try again.' });
    }
  })
);

export { router as uploadRouter, publicRouter as publicUploadRouter };
