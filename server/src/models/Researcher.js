import mongoose from 'mongoose';

/**
 * Researcher.js — Civil Researcher and Academic Collaborator Model.
 *
 * Captures qualifications, research interests, proposal documents,
 * and review workflow for technical collaboration with Neevevera R&D.
 */
const researcherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    institution: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    designation: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Research Scholar',
    },
    highestQualification: {
      type: String,
      enum: ['phd', 'postdoc', 'mtech-me', 'btech-be', 'msc', 'other'],
      required: true,
    },
    researchInterests: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one research interest discipline is required.',
      },
    },
    summary: {
      type: String,
      trim: true,
      maxlength: 3000,
    },
    publications: {
      type: [String],
      default: [],
    },
    proposalUrl: {
      type: String,
      trim: true,
    },
    isPublicListingConsented: {
      type: Boolean,
      default: false,
    },

    // Administrative review workflow
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

researcherSchema.index({ status: 1, isPublicListingConsented: 1, createdAt: -1 });
researcherSchema.index({ email: 1 });

export default mongoose.model('Researcher', researcherSchema);
