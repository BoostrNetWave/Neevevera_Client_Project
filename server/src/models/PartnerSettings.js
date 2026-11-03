import mongoose from 'mongoose';

/**
 * PartnerSettings — Versioned configuration for referral programme & incentives
 *
 * Safeguard (Amendment D):
 *  - isIncentiveCalculationActive defaults to false.
 *  - Earning and incentive calculations are strictly locked until client/PO sign-off.
 */
const partnerSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_partner_settings',
      unique: true,
    },
    attributionWindowDays: {
      type: Number,
      default: 60,
      min: 1,
      max: 365,
    },
    // Amendment D: Locked until client gives explicit written approval
    isIncentiveCalculationActive: {
      type: Boolean,
      default: false,
    },
    activeRule: {
      version: { type: String, default: 'v1.0-draft' },
      basis: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
      value: { type: Number, default: 0 },
      qualifyingTrigger: { type: String, default: 'contract_signed' },
      minPayoutPaise: { type: Number, default: 100000 }, // default ₹1000 threshold
      effectiveFrom: { type: Date, default: Date.now },
      notes: { type: String, default: 'Pending client approval of qualifying trigger and basis' },
    },
    termsVersion: {
      type: String,
      default: 'v1.0',
    },
    termsNotice: {
      type: String,
      default: 'Marketing Partner Programme is strictly single-level and subject to verified customer conversion.',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('PartnerSettings', partnerSettingsSchema);

