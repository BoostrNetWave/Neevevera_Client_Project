import mongoose from 'mongoose';

/**
 * Partner — Marketing Partner Registration & Referral Management (V1)
 *
 * Rules:
 *  - Separate business role; does NOT reuse Vendor models, permissions, or tokens.
 *  - High entropy referral codes: 'NV-' + 16 hex chars (64-bit entropy).
 *  - One-time verification tokens stored strictly as SHA-256 hashes with expiry.
 */
const partnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
    },
    normalizedPhone: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
      index: true,
    },
    normalizedEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    pin: {
      type: String,
      required: true,
      trim: true,
      match: /^[1-9][0-9]{5}$/,
    },
    partnerType: {
      type: String,
      required: true,
      enum: ['individual', 'agency', 'professional', 'other'],
      default: 'individual',
    },
    status: {
      type: String,
      enum: ['pending_email', 'pending_approval', 'approved', 'rejected', 'suspended'],
      default: 'pending_email',
      index: true,
    },
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    verificationTokenHash: {
      type: String,
      index: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
    },
    emailVerifiedAt: {
      type: Date,
    },
    agreementVersion: {
      type: String,
      default: 'v1.0',
    },
    agreementAcceptedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: {
      type: Date,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectedAt: {
      type: Date,
    },
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    suspendedAt: {
      type: Date,
    },
    suspendedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    suspendedReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// Compound index for fast deduplication check
partnerSchema.index({ normalizedEmail: 1, status: 1 });
partnerSchema.index({ normalizedPhone: 1, status: 1 });

export default mongoose.model('Partner', partnerSchema);

