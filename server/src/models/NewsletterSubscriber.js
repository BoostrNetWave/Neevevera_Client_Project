import mongoose from 'mongoose';

/**
 * NewsletterSubscriber — persists email signups from Newsletter.jsx.
 * Phase 2 CMS will expose subscriber list in the admin inbox.
 */
const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    name:         { type: String, trim: true },           // optional, if form collects it
    interests:    [String],                                // topic tags (optional multi-select)
    isConfirmed:  { type: Boolean, default: false },       // double opt-in ready
    confirmToken: String,                                  // used for verification email
    confirmedAt:  Date,
    source:       { type: String, default: 'website-newsletter' },
    isActive:     { type: Boolean, default: true },        // false = unsubscribed
    unsubscribedAt: Date,
  },
  { timestamps: true }
);

// NOTE: email unique index is declared inline on the field (unique: true) above.
// No separate schema.index() needed — that would create a duplicate.

export default mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema);
