import mongoose from 'mongoose';

/**
 * RazorpayWebhookEvent — deduplication and audit log for incoming webhook events.
 *
 * Rules:
 *  - `razorpayEventId` has a unique index — processing the same event twice is safe.
 *  - Raw Razorpay payloads are NOT stored (may contain customer PII and card metadata).
 *  - Store only the minimum needed for reconciliation and diagnosis.
 *  - Signature must be validated before any record is written to the DB.
 */
const razorpayWebhookEventSchema = new mongoose.Schema(
  {
    // Provider event ID (Razorpay `x-razorpay-event-id` header when provided)
    razorpayEventId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    eventName: { type: String, required: true, index: true },
    receivedAt: { type: Date, default: Date.now, index: true },
    signatureValid: { type: Boolean, required: true },

    // Processing state
    processingStatus: {
      type: String,
      enum: ['received', 'processing', 'processed', 'failed', 'skipped_duplicate'],
      default: 'received',
      index: true,
    },
    processingAttempts: { type: Number, default: 0 },
    lastError: { type: String },

    // Safe, non-PII identifiers for reconciliation
    bookingRef:        { type: String, index: true },
    razorpayOrderId:   { type: String, index: true },
    razorpayPaymentId: { type: String, index: true },
    eventAmountPaise:  { type: Number },
    eventCurrency:     { type: String },
  },
  { timestamps: true }
);

export default mongoose.model('RazorpayWebhookEvent', razorpayWebhookEventSchema);
