import mongoose from 'mongoose';

const overrideSchema = new mongoose.Schema(
  {
    baseRate: Number,
    loadingMin: Number,
    loadingMax: Number,
    costIndex: Number,
    reason: { type: String, required: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

const dsrItemSchema = new mongoose.Schema(
  {
    edition: {
      type: String,
      default: 'DSR 2023 Civil',
      trim: true,
    },
    volume: {
      type: Number,
      enum: [1, 2],
      default: 1,
    },
    chapter: {
      type: String,
      trim: true,
      default: '',
    },
    itemNo: {
      type: String,
      required: [true, 'DSR item code is required'],
      unique: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    subhead: {
      type: String,
      trim: true,
      default: '',
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    desc: {
      type: String,
      trim: true,
      default: '',
    },
    unit: {
      type: String,
      required: [true, 'Unit of measurement is required'],
      trim: true,
      lowercase: true,
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
    sourcePage: {
      type: Number,
      default: 1,
    },
    sourceHash: {
      type: String,
      trim: true,
      default: '',
    },
    correctionSlipRef: {
      type: String,
      trim: true,
      default: '',
    },
    isAddOn: {
      type: Boolean,
      default: false,
    },

    // ── Official CPWD DSR 2023 Base Rate (Strictly Confidential - Admin Only) ──
    baseRate: {
      type: Number,
      required: [true, 'Base DSR rate is required'],
      min: [0, 'Base rate cannot be negative'],
    },

    // ── Contractor Margin Loading Range (Default: 15% to 20%) ──
    loadingMin: {
      type: Number,
      default: 15,
      min: [0, 'Minimum loading cannot be negative'],
      max: [50, 'Minimum loading exceeds maximum allowed threshold'],
    },
    loadingMax: {
      type: Number,
      default: 20,
      min: [0, 'Maximum loading cannot be negative'],
      max: [50, 'Maximum loading exceeds maximum allowed threshold'],
    },

    // ── Location Cost Index (Default 100 for base DSR) ──
    costIndex: {
      type: Number,
      default: 100,
      min: [50, 'Cost index too low'],
      max: [200, 'Cost index too high'],
    },

    // ── Precalculated Client Rate Range (₹ per metric unit) ──
    clientRateMin: {
      type: Number,
      min: [0, 'Client min rate cannot be negative'],
    },
    clientRateMax: {
      type: Number,
      min: [0, 'Client max rate cannot be negative'],
    },

    // ── Precalculated Client Rate Range (₹ per sq.ft) ──
    clientRateSqftMin: {
      type: Number,
      min: [0, 'Client min rate per sqft cannot be negative'],
    },
    clientRateSqftMax: {
      type: Number,
      min: [0, 'Client max rate per sqft cannot be negative'],
    },

    // Legacy fields for backward compatibility
    clientRate: {
      type: Number,
    },
    markupPercent: {
      type: Number,
      default: 18,
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
    isVerified: {
      type: Boolean,
      default: false, // H1: Must be explicitly verified against CPWD DSR 2023 PDFs before public use
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    overrides: [overrideSchema],
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to calculate client rate range
dsrItemSchema.pre('save', function (next) {
  const minLoad = typeof this.loadingMin === 'number' ? this.loadingMin : 15;
  const maxLoad = typeof this.loadingMax === 'number' ? this.loadingMax : 20;
  const costIdx = typeof this.costIndex === 'number' ? this.costIndex : 100;
  const factor = this.sqftFactor && this.sqftFactor > 0 ? this.sqftFactor : 1;

  // Formula:
  // low = round_half_up(base * (1 + loadingMin/100) * (costIndex/100))
  // high = round_half_up(base * (1 + loadingMax/100) * (costIndex/100))
  const low = this.baseRate * (1 + minLoad / 100) * (costIdx / 100);
  const high = this.baseRate * (1 + maxLoad / 100) * (costIdx / 100);

  this.clientRateMin = Math.round(low * 100) / 100;
  this.clientRateMax = Math.round(high * 100) / 100;

  this.clientRateSqftMin = Math.round((low / factor) * 100) / 100;
  this.clientRateSqftMax = Math.round((high / factor) * 100) / 100;

  // Set legacy fields for backwards compatibility
  this.clientRate = this.clientRateMax;
  this.markupPercent = maxLoad;

  // H2 FIX: Never mutate isAddOn on existing documents (!this.isNew).
  // On new documents, only suggest if isAddOn was NOT explicitly provided (is undefined).
  // Never override an explicit admin choice (false or true).
  if (this.isNew && this.isAddOn === undefined) {
    const text = `${this.title} ${this.desc}`.toLowerCase();
    const hasAddonPhrase = /\b(extra for|add for|additional for|extra over)\b/i.test(text);
    this.isAddOn = Boolean(hasAddonPhrase);
  }

  if (typeof next === 'function') {
    next();
  }
});

// Helper static to suggest isAddOn classification in import preview without mutating DB
dsrItemSchema.statics.suggestIsAddOn = function (title = '', desc = '') {
  const text = `${title} ${desc}`.toLowerCase();
  return /\b(extra for|add for|additional for|extra over)\b/i.test(text);
};

// Helper static to compute loaded rates for plain objects
dsrItemSchema.statics.calculateClientRateRange = function (baseRate, loadingMin = 15, loadingMax = 20, costIndex = 100, sqftFactor = 1) {
  const factor = sqftFactor > 0 ? sqftFactor : 1;
  const low = baseRate * (1 + loadingMin / 100) * (costIndex / 100);
  const high = baseRate * (1 + loadingMax / 100) * (costIndex / 100);

  return {
    clientRateMin: Math.round(low * 100) / 100,
    clientRateMax: Math.round(high * 100) / 100,
    clientRateSqftMin: Math.round((low / factor) * 100) / 100,
    clientRateSqftMax: Math.round((high / factor) * 100) / 100,
    clientRate: Math.round(high * 100) / 100,
  };
};

// Compound indexes for scalable querying and uniqueness
dsrItemSchema.index({ edition: 1, volume: 1, itemNo: 1 });
dsrItemSchema.index({ isActive: 1, isVerified: 1, category: 1, order: 1 });
dsrItemSchema.index(
  { itemNo: 'text', title: 'text', desc: 'text', subhead: 'text', keywords: 'text' },
  {
    weights: { itemNo: 10, title: 5, subhead: 3, desc: 1, keywords: 2 },
    name: 'dsr_search_text_idx',
    default_language: 'none',
  }
);

export default mongoose.model('DsrItem', dsrItemSchema);
