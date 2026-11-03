import mongoose from 'mongoose';

const parSettingsSchema = new mongoose.Schema(
  {
    // The public estimator is kept disabled by default until verified rates and calibration data are established
    isEnabled: {
      type: Boolean,
      default: false,
    },
    activeEdition: {
      type: String,
      default: 'CPWD PAR 2025',
      trim: true,
    },
    correctionSlipsApplied: {
      type: [String],
      default: ['Correction Slip No. 1 (15-01-2026)'],
    },
    customerDisclaimer: {
      type: String,
      default:
        'Indicative plinth area cost based on official CPWD Plinth Area Rates 2025 (with Correction Slip No. 1) and approved local building cost indices. Final cost is strictly subject to architectural layout, soil investigation, and structural design.',
      trim: true,
    },
    disabledMessage: {
      type: String,
      default:
        'The Plinth Area calculation engine is undergoing calibration against official CPWD PAR 2025 publications and regional cost index data.',
      trim: true,
    },
    allowDraftLocations: {
      type: Boolean,
      default: false,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Singleton helper to fetch or initialize settings
parSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      isEnabled: false,
      activeEdition: 'CPWD PAR 2025',
      correctionSlipsApplied: ['Correction Slip No. 1 (15-01-2026)'],
    });
  }
  return settings;
};

const ParSettings = mongoose.model('ParSettings', parSettingsSchema);

export default ParSettings;
