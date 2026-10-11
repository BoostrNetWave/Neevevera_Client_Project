import mongoose from 'mongoose';

/**
 * MediaAsset.js — Cloudinary upload registry.
 * Every file uploaded through the system gets a record here BEFORE
 * any content document saves its URL. This enables:
 *   - Orphan detection (usageCount === 0 after 48h → cleanup candidate)
 *   - Safe deletion (check usageCount before calling cloudinary.uploader.destroy)
 *   - Audit trail (who uploaded what, when)
 *
 * Correction applied: compound index uses createdAt (from timestamps:true),
 * NOT a separate uploadedAt field — orphan cleanup queries use createdAt < now-48h.
 */
const mediaAssetSchema = new mongoose.Schema(
  {
    url:        { type: String, required: true },
    publicId:   { type: String, required: true, unique: true }, // Cloudinary public_id — required for deletion

    context: {
      type: String,
      enum: ['serviceImage', 'projectImage', 'teamPhoto', 'galleryMedia', 'galleryVideo', 'resume', 'vendorDocument'],
      required: true,
    },

    originalName: String,
    mimeType:     String,
    sizeBytes:    Number,

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null for public (resume/vendor) uploads
    isDeleted:  { type: Boolean, default: false },

    // usageCount = how many content documents reference this asset's URL.
    // Incremented when a Project/Service/etc saves this URL,
    // decremented (and orphan-check triggered) when the reference is removed.
    usageCount: { type: Number, default: 0 },
  },
  { timestamps: true }   // createdAt serves as uploadedAt for orphan cleanup queries
);

// Compound index: supports orphan-cleanup query (usageCount + createdAt)
// without a full collection scan.
mediaAssetSchema.index({ usageCount: 1, createdAt: 1 });
mediaAssetSchema.index({ context: 1 });

export default mongoose.model('MediaAsset', mediaAssetSchema);
