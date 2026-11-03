import mongoose from 'mongoose';

/**
 * PaymentAttempt — tracks every Razorpay order/payment attempt for a booking.
 *
 * Rules:
 *  - Multiple attempts may belong to one booking (retry after failure).
 *  - Only ONE captured payment should confirm a booking.
 *  - An unexpected second capture is flagged as `duplicate_flagged` for manual review.
 *  - Card details, CVV, OTP, UPI PIN are NEVER stored here.
 */
const paymentAttemptSchema = new mongoose.Schema(
  {
    bookingRef: {
      type: String,
      required: true,
      index: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SiteInspectionBooking',
      required: true,
      index: true,
    },
    attemptNumber: { type: Number, default: 1, min: 1 },
    localIdempotencyKey: { type: String, unique: true, sparse: true, index: true },

    // Razorpay identifiers (unique when present)
    razorpayOrderId:   { type: String, unique: true, sparse: true, index: true },
    razorpayPaymentId: { type: String, sparse: true, index: true },
    // NOTE: We store the RESULT of signature verification, NOT the signature itself
    signatureVerified: { type: Boolean, default: false },

    // Expected vs. reported amounts (mismatch → reconciliation_required)
    expectedAmountPaise: { type: Number, required: true },
    expectedCurrency:    { type: String, default: 'INR' },
    reportedAmountPaise: { type: Number },
    reportedCurrency:    { type: String },
    reportedStatus:      { type: String },

    // Verification flags
    amountVerified:  { type: Boolean, default: false },
    captureVerified: { type: Boolean, default: false },

    // Attempt state
    status: {
      type: String,
      enum: [
        'pending_order',
        'order_created',
        'checkout_opened',
        'payment_attempted',
        'signature_verified',
        'captured',
        'failed',
        'refunded',
        'duplicate_flagged',
        'expired',
      ],
      default: 'pending_order',
      index: true,
    },

    // Failure info (safe codes only — no raw card errors)
    failureCode:        { type: String },
    failureDescription: { type: String },

    // Refund tracking
    refundId:          { type: String },
    refundAmountPaise: { type: Number },
    refundStatus:      { type: String },
    refundReason:      { type: String },
    refundInitiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refundInitiatedAt: { type: Date },

    // Reconciliation status
    reconciliationStatus: {
      type: String,
      enum: ['ok', 'mismatch', 'pending', 'manual_review'],
      default: 'ok',
    },

    // Timestamps
    orderCreatedAt:    { type: Date },
    paymentCapturedAt: { type: Date },
  },
  { timestamps: true }
);

paymentAttemptSchema.index({ bookingRef: 1, status: 1 });
paymentAttemptSchema.index({ createdAt: -1 });

export default mongoose.model('PaymentAttempt', paymentAttemptSchema);
