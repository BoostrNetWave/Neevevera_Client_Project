/**
 * GalleryItem.js — CMS-managed gallery entry.
 * Each item is an uploaded media asset that the admin has explicitly
 * added to the public gallery, with a caption and category label.
 */
import mongoose from 'mongoose';

const gallerySchema = new mongoose.Schema(
  {
    title:     { type: String, required: true },
    caption:   { type: String, default: '' },
    imageUrl:  { type: String, required: true },
    publicId:  { type: String, default: '' },   // Cloudinary public_id for safe delete
    mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
    category: {
      type: String,
      enum: ['construction-site', 'completed-project', 'work-progress', 'equipment', 'team', 'project-video', 'other'],
      default: 'other',
    },
    isVisible: { type: Boolean, default: true },
    order:     { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

gallerySchema.index({ isVisible: 1, order: 1 });

export default mongoose.model('GalleryItem', gallerySchema);
