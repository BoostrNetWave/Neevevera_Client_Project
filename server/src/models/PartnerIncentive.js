import mongoose from 'mongoose';

/**
 * PartnerIncentive — Immutable Append-Only Financial Ledger (V1)
 *
 * Rules (Amendment C):
 *  - Idempotency key unique per ledger event, allowing multiple append-only records per enquiry.
 *  - Money stored as integer paise.
 *  - Never mutate previous ledger entries to 'fix' history; adjustments and reversals
 *    are recorded as distinct events.
 */
const partnerIncentiveSchema = new mongoose.Schema(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Partner',
      required: true,
      index: true,
    },
    enquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enquiry',
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ['accrual', 'adjustment', 'reversal', 'payout'],
      required: true,
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: '{VALUE} is not an integer paise value',
      },
    },
    status: {
      type: String,
      enum: ['pending_approval', 'approved', 'paid', 'cancelled'],
      default: 'pending_approval',
      index: true,
    },
    ruleSnapshot: {
      ruleId: String,
      version: String,
      basis: { type: String, enum: ['fixed', 'percentage'] },
      basisValue: Number,
      qualifyingTrigger: String,
      calculatedAt: Date,
    },
    paymentReference: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    paidAt: Date,
    paidBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: Date,
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: Date,
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    auditTrail: [
      {
        action: { type: String, required: true },
        performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        timestamp: { type: Date, default: Date.now },
        meta: mongoose.Schema.Types.Mixed,
      },
    ],
  },
  { timestamps: true }
);

// Indexes for reconciliation & reporting
partnerIncentiveSchema.index({ partnerId: 1, createdAt: -1 });
partnerIncentiveSchema.index({ enquiryId: 1, eventType: 1 });
partnerIncentiveSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('PartnerIncentive', partnerIncentiveSchema);

