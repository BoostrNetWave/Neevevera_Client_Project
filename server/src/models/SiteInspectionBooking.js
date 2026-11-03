import mongoose from 'mongoose';
import crypto from 'crypto';

/**
 * SiteInspectionBooking — core booking document.
 *
 * Security rules (enforced throughout the codebase):
 *  1. Never return `_id`, `adminNotes`, `accessTokenHash`, or `assignedStaffId`
 *     to unauthenticated public responses.
 *  2. `bookingRef` is the unguessable public reference; never expose Mongo _id publicly.
 *  3. `accessTokenHash` stores only the SHA-256 hash of the one-time status token;
 *     the cleartext token is sent once to the customer and never stored.
 *  4. Two separate state machines: `bookingStatus` and `paymentStatus`.
 *     A failed payment event must NOT downgrade a captured payment.
 */
const siteInspectionBookingSchema = new mongoose.Schema(
  {
    // Public reference — unguessable, unique, safe to share with customer
    bookingRef: {
      type: String,
      required: true,
      unique: true,
      default: () => 'SIB-' + crypto.randomBytes(8).toString('hex').toUpperCase(),
      index: true,
    },

    // Client idempotency key to prevent duplicate bookings on retry
    idempotencyKey: { type: String, unique: true, sparse: true, index: true },

    // Anonymous status access token (SHA-256 hash stored; cleartext delivered to customer once)
    accessTokenHash:      { type: String, index: true },
    accessTokenExpiresAt: { type: Date },

    // ── Customer details (redacted in public serializers) ─────
    customerName:  { type: String, required: true, trim: true, maxlength: 120 },
    customerPhone: { type: String, required: true, trim: true, maxlength: 20 },
    customerEmail: { type: String, trim: true, lowercase: true, maxlength: 254 },

    // ── Site details ──────────────────────────────────────────
    siteAddress: { type: String, required: true, trim: true, maxlength: 500 },
    pinCode:     { type: String, required: true, trim: true, match: /^[1-9][0-9]{5}$/ },
    district:    { type: String, required: true, trim: true },
    state:       { type: String, default: 'Odisha', trim: true },
    visitType:   { type: String, required: true, trim: true },
    projectNote: { type: String, trim: true, maxlength: 1000 },

    // ── Slot reference + snapshot ─────────────────────────────
    slotId:        { type: mongoose.Schema.Types.ObjectId, ref: 'InspectionSlot', required: true },
    visitStartTime: { type: Date, required: true }, // immutable snapshot at booking time
    visitEndTime:   { type: Date, required: true },

    // ── State machines ─────────────────────────────────────────
    bookingStatus: {
      type: String,
      enum: [
        'pending_payment',
        'confirmed',
        'expired',
        'cancel_requested',
        'cancelled',
        'reschedule_required',
        'assigned',
        'visit_in_progress',
        'completed',
      ],
      default: 'pending_payment',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: [
        'not_started',
        'order_created',
        'authorized',
        'captured',
        'failed',
        'refund_requested',
        'refund_pending',
        'refunded',
        'reconciliation_required',
      ],
      default: 'not_started',
      index: true,
    },

    // ── Payment snapshot (loaded from settings, never from client) ──
    amountPaise:         { type: Number, required: true },
    currency:            { type: String, default: 'INR' },
    policyVersionSnapshot: { type: String },
    termsSnapshot:       { type: String },

    // ── Hold expiry ────────────────────────────────────────────
    holdExpiresAt: { type: Date, index: true },

    // ── Field Inspection Findings & Photos (Private to Staff / Admin) ──
    inspectionFindings: {
      type: {
        soilCondition:          { type: String, trim: true, maxlength: 1000 },
        structuralObservations: { type: String, trim: true, maxlength: 2000 },
        recommendations:        { type: String, trim: true, maxlength: 2000 },
        sitePhotos: [
          {
            url:        { type: String, required: true },
            caption:    { type: String, trim: true, maxlength: 200 },
            uploadedAt: { type: Date, default: Date.now },
          },
        ],
        completedAt: { type: Date },
      },
      select: false,
    },

    // ── Admin-only fields (NEVER in public serializers) ────────
    assignedStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      select: false, // excluded by default; admin must explicitly select
    },
    adminNotes: {
      type: String,
      maxlength: 2000,
      select: false,
    },
    cancellationReason:    { type: String, select: false },
    rescheduledFromSlotId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'InspectionSlot',
      select: false,
    },

    // ── State transition audit log ─────────────────────────────
    statusHistory: {
      type: [
        {
          fromBookingStatus: String,
          toBookingStatus:   String,
          fromPaymentStatus: String,
          toPaymentStatus:   String,
          changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          note:      String,
          timestamp: { type: Date, default: Date.now },
        },
      ],
      default: [],
      select: false,
    },

    // ── Policy acceptance ──────────────────────────────────────
    policyAccepted:   { type: Boolean, required: true, default: false },
    policyAcceptedAt: { type: Date },

    // ── Metadata ───────────────────────────────────────────────
    source:    { type: String, default: 'website' },
    ipAddress: { type: String, select: false },
  },
  { timestamps: true }
);

siteInspectionBookingSchema.index({ slotId: 1, bookingStatus: 1 });
siteInspectionBookingSchema.index({ pinCode: 1 });
siteInspectionBookingSchema.index({ holdExpiresAt: 1, bookingStatus: 1 });
siteInspectionBookingSchema.index({ createdAt: -1 });

export default mongoose.model('SiteInspectionBooking', siteInspectionBookingSchema);
