import mongoose from 'mongoose';

/**
 * SiteInspectionSettings — singleton document (key: 'global_site_inspection_settings').
 *
 * Design:
 *  - `paymentsEnabled` and `bookingEnabled` both default to false (fail-closed).
 *  - `tokenAmountPaise` is authoritative: the client never submits an amount.
 *  - Default token ₹1,000 is a TEST FIXTURE only — must be approved before going live.
 *  - Razorpay credentials are NEVER stored here; use server env variables.
 */
const siteInspectionSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_site_inspection_settings',
      unique: true,
    },

    // Feature flags — both off by default
    bookingEnabled: { type: Boolean, default: false },
    paymentsEnabled: { type: Boolean, default: false },

    // Payment config (set by authorized admin only from an approved amount)
    tokenAmountPaise: {
      type: Number,
      default: 100000, // ₹1,000 test fixture — NOT production-approved
      min: 50000,      // ₹500 minimum (client agreed floor)
      max: 150000,     // ₹1,500 maximum (client agreed ceiling ₹500–₹1,500)
      validate: {
        validator: (v) => Number.isInteger(v),
        message: 'Token amount must be a whole integer in paise.',
      },
    },
    currency: { type: String, default: 'INR', enum: ['INR'] },

    // Slot hold expiry (seconds)
    holdDurationSeconds: { type: Number, default: 600, min: 60, max: 3600 },

    // Operating schedule
    operatingDays: {
      type: [Number],
      default: [1, 2, 3, 4, 5, 6], // Mon(1) – Sat(6); 0 = Sunday
      validate: {
        validator: (arr) => arr.every((d) => d >= 0 && d <= 6),
        message: 'operatingDays must contain values 0–6.',
      },
    },
    startHourIST: { type: Number, default: 9, min: 0, max: 23 },
    endHourIST:   { type: Number, default: 18, min: 1, max: 24 },
    visitDurationMinutes: { type: Number, default: 90, min: 30, max: 480 },
    maxBookingsPerSlot: { type: Number, default: 2, min: 1, max: 20 },
    bookingHorizonDays: { type: Number, default: 30, min: 1, max: 365 },

    // Policy
    policyVersion: { type: String, default: 'v1.0', trim: true },
    cancellationWindowHours: { type: Number, default: 24, min: 0 },
    isRefundable: { type: Boolean, default: false },
    refundPolicy: {
      type: String,
      default:
        'The booking token is non-refundable. It may be adjusted against confirmed construction or consultancy work at Neevevera\'s discretion.',
    },
    disclaimerText: {
      type: String,
      default:
        'Booking token confirms your appointment slot only. Fees, scope of work, and project terms are discussed during the site visit.',
    },
    taxNotice: {
      type: String,
      default: 'Booking token amount is inclusive of all applicable taxes.',
    },

    // Approved visit types shown to customers
    visitTypes: {
      type: [String],
      default: [
        'Residential (Plot / Individual House)',
        'Commercial Building',
        'Industrial Shed / Warehouse',
        'Institutional (School / Hospital / College)',
        'Renovation / Retrofitting',
        'Structural Assessment',
        'Other',
      ],
    },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('SiteInspectionSettings', siteInspectionSettingsSchema);
