import mongoose from 'mongoose';

const dsrStagedItemSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      index: true,
    },
    jobId: {
      type: String,
      index: true,
      default: '',
    },
    rowNumber: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['new', 'update', 'unchanged', 'conflict', 'invalid'],
      required: true,
      index: true,
    },
    itemNo: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
    chapter: {
      type: String,
      trim: true,
      default: '',
    },
    subhead: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    desc: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    unitLabel: {
      type: String,
      trim: true,
      default: '',
    },
    sqftFactor: {
      type: Number,
      default: 1,
    },
    baseRate: {
      type: Number,
      default: 0,
    },
    existingBaseRate: {
      type: Number,
      default: null,
    },
    sourcePage: {
      type: Number,
      default: 1,
    },
    edition: {
      type: String,
      trim: true,
      default: 'CPWD DSR 2023 Civil',
    },
    volume: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    isAddOn: {
      type: Boolean,
      default: false,
    },
    coverage: {
      type: String,
      trim: true,
      default: '',
    },
    typicalBrands: {
      type: String,
      trim: true,
      default: '',
    },
    keywords: {
      type: [String],
      default: [],
    },
    conflictReason: {
      type: String,
      trim: true,
      default: '',
    },
    error: {
      type: String,
      trim: true,
      default: '',
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index for automatic staged cleanup
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for chunked processing and resumability
dsrStagedItemSchema.index({ batchId: 1, rowNumber: 1 });
dsrStagedItemSchema.index({ batchId: 1, status: 1 });
dsrStagedItemSchema.index({ jobId: 1, rowNumber: 1 });

export default mongoose.model('DsrStagedItem', dsrStagedItemSchema);

