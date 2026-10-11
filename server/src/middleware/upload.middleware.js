import multer             from 'multer';
import sharp              from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { v2 as cloudinary }  from 'cloudinary';
import axios              from 'axios';
import FormData           from 'form-data';

// ── Cloudinary config (credentials used ONLY for delete/sign operations) ──
// Image uploads use an unsigned preset — no api_key permission issues.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key:    process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
});

const CLOUD_NAME    = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const UPLOAD_PRESET = (process.env.CLOUDINARY_UPLOAD_PRESET || 'neevevera_upload').trim();

if (!CLOUD_NAME) {
  console.error('❌ CLOUDINARY_CLOUD_NAME missing in .env — uploads will fail!');
} else {
  console.log(`✅ Cloudinary ready  cloud=${CLOUD_NAME}  preset=${UPLOAD_PRESET}`);
}

// ── Upload context registry ──────────────────────────────────
export const UPLOAD_CONTEXTS = {
  serviceImage:   { types: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 5,   isVideo: false },
  projectImage:   { types: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 5,   isVideo: false },
  teamPhoto:      { types: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 3,   isVideo: false },
  galleryMedia:   { types: ['image/jpeg', 'image/png', 'image/webp'], maxSizeMB: 8,   isVideo: false },
  galleryVideo:   { types: ['video/mp4', 'video/webm', 'video/quicktime', 'video/ogg'], maxSizeMB: 200, isVideo: true },
  resume:         { types: ['application/pdf'],                        maxSizeMB: 5,   isVideo: false },
  vendorDocument: { types: ['application/pdf', 'image/jpeg', 'image/png'], maxSizeMB: 10, isVideo: false },
};

// ── Multer — memoryStorage only ──────────────────────────────
export const multerUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── Per-context validation middleware ────────────────────────
export function validateUpload(context) {
  return async (req, res, next) => {
    if (!UPLOAD_CONTEXTS[context]) {
      return res.status(400).json({ error: `Unknown upload context: ${context}` });
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided.' });
    }

    const ctx = UPLOAD_CONTEXTS[context];
    const { buffer, size } = req.file;

    if (size > ctx.maxSizeMB * 1024 * 1024) {
      return res.status(400).json({ error: `File exceeds the ${ctx.maxSizeMB} MB limit for ${context}.` });
    }

    const detected = await fileTypeFromBuffer(buffer);
    if (!detected || !ctx.types.includes(detected.mime)) {
      return res.status(400).json({ error: `Invalid file type. Allowed for ${context}: ${ctx.types.join(', ')}` });
    }

    if (!ctx.isVideo && detected.mime.startsWith('image/')) {
      try {
        await sharp(buffer).metadata();
      } catch {
        return res.status(400).json({ error: 'Image file is corrupt or unreadable.' });
      }
    }

    req.detectedMimeType = detected.mime;
    req.uploadContext     = context;
    next();
  };
}

// ── Cloudinary upload via raw HTTP POST (unsigned preset) ─────
// Uses axios directly — completely bypasses the Cloudinary SDK auth flow.
// This avoids the 403 that occurs when a restricted API key is present in config.
export async function uploadToCloudinary(buffer, context, originalname, maxRetries = 3) {
  if (!CLOUD_NAME) throw new Error('CLOUDINARY_CLOUD_NAME is not set in .env');

  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const form = new FormData();
      form.append('file', buffer, {
        filename:    originalname || 'upload',
        contentType: 'application/octet-stream',
      });
      form.append('upload_preset', UPLOAD_PRESET);
      form.append('tags',          `neevevera,${context}`);

      const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
      const res = await axios.post(url, form, {
        headers:        form.getHeaders(),
        timeout:        45000,
        maxContentLength: Infinity,
        maxBodyLength:    Infinity,
      });

      return res.data; // { secure_url, public_id, bytes, ... }
    } catch (err) {
      lastError = err;
      const status = err.response?.status;
      const detail = err.response?.data?.error?.message || err.message;
      console.error(`[Cloudinary] attempt ${attempt} failed — ${status ?? 'network'}: ${detail}`);
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, attempt * 1000));
      }
    }
  }
  throw lastError;
}

// ── Signed URL generator (for large video uploads direct from browser) ──
export function generateSignedUpload(context) {
  if (!UPLOAD_CONTEXTS[context]) throw new Error(`Unknown upload context: ${context}`);
  const timestamp = Math.round(Date.now() / 1000);
  const folder    = `neevevera/${context}`;
  const params    = { timestamp, folder };
  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET);
  return {
    signature,
    timestamp,
    folder,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    expiresAt: timestamp + 300,
  };
}
