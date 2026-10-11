import mongoose from 'mongoose';

const testimonialSchema = new mongoose.Schema(
  {
    clientName:         { type: String, required: true },
    clientDesignation:  String,
    clientOrganization: String,
    review:             { type: String, required: true },
    rating:             { type: Number, min: 1, max: 5, default: 5 },
    projectRef:         { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    photo:              String,
    isApproved:         { type: Boolean, default: false },
    isFeatured:         { type: Boolean, default: false },

    // Phase 2 additions
    isDeleted:  { type: Boolean, default: false },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

testimonialSchema.index({ isApproved: 1, isDeleted: 1 });

export default mongoose.model('Testimonial', testimonialSchema);
