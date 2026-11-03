import mongoose from 'mongoose';

const dsrSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_dsr_settings',
      unique: true,
    },
    loadingMin: {
      type: Number,
      default: 15,
      min: 0,
      max: 50,
    },
    loadingMax: {
      type: Number,
      default: 20,
      min: 0,
      max: 50,
    },
    locationIndex: {
      type: Number,
      default: 100,
      min: 50,
      max: 200,
    },
    indexBase: {
      type: Number,
      default: 100,
    },
    geography: {
      type: String,
      default: 'Odisha (Khurda / Cuttack / Bhubaneswar)',
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    isEstimatorActive: {
      type: Boolean,
      default: false, // B3: Fail-closed; unconfigured estimator disabled by default
    },
    disclaimerText: {
      type: String,
      default: 'Indicative estimate based on standard CPWD schedule. Final project pricing is subject to technical site appraisal.',
    },
    taxNotice: {
      type: String,
      default: 'All rate ranges excluding GST.',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('DsrSetting', dsrSettingSchema);
