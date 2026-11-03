import mongoose from 'mongoose';

const stagedItemSchema = new mongoose.Schema(
  {
    row: { type: Number, required: true },
    status: {
      type: String,
      enum: ['new', 'update', 'unchanged', 'conflict', 'invalid'],
      required: true,
    },
    itemNo: { type: String, trim: true },
    category: { type: String, trim: true },
    chapter: { type: String, trim: true, default: '' },
    subhead: { type: String, trim: true, default: '' },
    title: { type: String, trim: true },
    desc: { type: String, trim: true, default: '' },
    unit: { type: String, trim: true, lowercase: true },
    unitLabel: { type: String, trim: true, default: '' },
    sqftFactor: { type: Number, default: 1 },
    baseRate: { type: Number },
    existingBaseRate: { type: Number },
    sourcePage: { type: Number, default: 1 },
    edition: { type: String, trim: true, default: 'CPWD DSR 2023 Civil' },
    volume: { type: Number, enum: [1, 2], default: 1 },
    isAddOn: { type: Boolean, default: false },
    coverage: { type: String, trim: true, default: '' },
    typicalBrands: { type: String, trim: true, default: '' },
    keywords: [{ type: String }],
    conflictReason: { type: String, default: '' },
    error: { type: String, default: '' },
  },
  { _id: false }
);

const dsrImportBatchSchema = new mongoose.Schema(
  {
    batchId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    uploaderName: {
      type: String,
      default: '',
    },
    originalFilename: {
      type: String,
      required: true,
    },
    fileHash: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['preview', 'committed', 'cancelled', 'failed'],
      default: 'preview',
      index: true,
    },
    summary: {
      totalRows: { type: Number, default: 0 },
      newCount: { type: Number, default: 0 },
      updateCount: { type: Number, default: 0 },
      conflictCount: { type: Number, default: 0 },
      unchangedCount: { type: Number, default: 0 },
      invalidCount: { type: Number, default: 0 },
    },
    stagedItems: [stagedItemSchema],
    isExternalStaging: {
      type: Boolean,
      default: false,
    },
    jobId: {
      type: String,
      default: '',
      index: true,
    },
    checkpoint: {
      lastProcessedRow: { type: Number, default: 0 },
      committedRows: { type: Number, default: 0 },
    },
    errors: [
      {
        row: { type: Number, required: true },
        itemNo: { type: String, default: '' },
        error: { type: String, required: true },
      },
    ],
    committedAt: {
      type: Date,
    },
    committedCount: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      index: { expires: 0 }, // TTL index for automatic cleanup of stale previews
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('DsrImportBatch', dsrImportBatchSchema);
