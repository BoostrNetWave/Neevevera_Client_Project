/**
 * upload.js — Multer middleware with strict MIME and size validation.
 *
 * Usage in routes:
 *   import { uploadImage, uploadDocument } from '../middleware/upload.js';
 *   router.post('/upload', uploadImage.single('file'), handler);
 *
 * Phase 2: After multer validates the file, the route handler should
 * stream it to Cloudinary using the cloudinary SDK already in package.json.
 */
import multer from 'multer';
import path   from 'path';

// ── MIME type whitelists ──────────────────────────────────────
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const DOC_MIME_TYPES   = ['application/pdf'];

// ── Memory storage (file is never written to disk) ────────────
// Keeping files in memory lets the route stream them directly to
// Cloudinary without temp-file cleanup overhead.
const memoryStorage = multer.memoryStorage();

// ── File filter factory ───────────────────────────────────────
function makeFileFilter(allowedMimes) {
  return (req, file, cb) => {
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`
        ),
        false
      );
    }
  };
}

// ── Image uploader (project photos, team headshots, gallery) ─
export const uploadImage = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,  // 10 MB ceiling
    files: 10,                    // max 10 images per request (gallery bulk upload)
  },
  fileFilter: makeFileFilter(IMAGE_MIME_TYPES),
});

// ── Document uploader (resumes / capability statements / PDFs) ─
export const uploadDocument = multer({
  storage: memoryStorage,
  limits: {
    fileSize: 5 * 1024 * 1024,   // 5 MB ceiling for PDFs
    files: 1,
  },
  fileFilter: makeFileFilter([...IMAGE_MIME_TYPES, ...DOC_MIME_TYPES]),
});

// ── Multer error handler middleware ───────────────────────────
// Attach to routes that use upload middleware to return clean JSON errors.
export function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const msgMap = {
      LIMIT_FILE_SIZE:  'File is too large. Maximum allowed size is 10 MB for images, 5 MB for documents.',
      LIMIT_FILE_COUNT: 'Too many files. Maximum 10 images per upload.',
      LIMIT_UNEXPECTED_FILE: 'Unexpected file field.',
    };
    return res.status(400).json({
      success: false,
      message: msgMap[err.code] || `Upload error: ${err.message}`,
    });
  }
  if (err?.message?.startsWith('Invalid file type')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
}
