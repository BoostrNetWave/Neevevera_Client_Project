import mongoose from 'mongoose';

const parLocationSchema = new mongoose.Schema(
  {
    locationCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    locationName: {
      type: String,
      required: [true, 'Location / city name is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State / Union Territory is required'],
      trim: true,
    },
    district: {
      type: String,
      trim: true,
      default: '',
    },
    costIndex: {
      type: Number,
      required: [true, 'Official Building Cost Index is required'],
      min: [10, 'Cost index must be a positive number'],
      max: [500, 'Cost index exceeds plausible range'],
    },
    baseIndexEdition: {
      type: String,
      required: [true, 'Base index reference (e.g. CPWD Cost Index Base 100 as of 01.04.2023) is required'],
      trim: true,
      default: 'CPWD Cost Index Base 100 as of 01.04.2023 / PAR 2025',
    },
    sourceCircular: {
      type: String,
      required: [true, 'Official CPWD circular or gazette notification reference is required'],
      trim: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Cost index effective date is required'],
    },
    geographicalScope: {
      type: String,
      trim: true,
      default: '',
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'verified', 'approved'],
      default: 'draft',
      index: true,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

parLocationSchema.index({ state: 1, locationName: 1, approvalStatus: 1 });

const ParLocation = mongoose.model('ParLocation', parLocationSchema);

export default ParLocation;
