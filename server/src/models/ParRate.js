import mongoose from 'mongoose';

const provisionSchema = new mongoose.Schema(
  {
    ruleCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    percentageAdjustment: {
      type: Number,
      default: 0,
    },
    fixedAdjustmentPerUnit: {
      type: Number,
      default: 0,
    },
    sourceClause: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const parRateSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Building category is required as per CPWD PAR classification'],
      trim: true,
      index: true,
    },
    subCategory: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Rate specification title is required'],
      trim: true,
    },
    structuralSystem: {
      type: String,
      required: [true, 'Structural system (e.g. RCC Framed, Load Bearing, PEB) is required'],
      trim: true,
    },
    floorHeightSpec: {
      type: String,
      trim: true,
      default: 'Standard floor height up to 3.35m',
    },
    baseRate: {
      type: Number,
      required: [true, 'Official base rate is required'],
      min: [0, 'Base rate cannot be negative'],
    },
    unit: {
      type: String,
      enum: ['sqm', 'sqft'],
      default: 'sqm',
      required: true,
    },
    sqftFactor: {
      type: Number,
      default: 10.7639,
      min: [1, 'Conversion factor must be valid'],
    },
    sourceReference: {
      type: String,
      required: [true, 'Official CPWD reference (e.g. PAR 2025 Table 1.1) is required'],
      trim: true,
    },
    pageNumber: {
      type: Number,
      min: 1,
    },
    edition: {
      type: String,
      required: true,
      default: 'CPWD PAR 2025',
      trim: true,
    },
    correctionSlip: {
      type: String,
      trim: true,
      default: 'Correction Slip No. 1 (15-01-2026)',
    },
    applicableProvisions: {
      type: [provisionSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    auditNotes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

parRateSchema.index({ category: 1, structuralSystem: 1, isActive: 1 });

const ParRate = mongoose.model('ParRate', parRateSchema);

export default ParRate;
