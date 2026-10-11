import mongoose from 'mongoose';

/**
 * Vendor / Subcontractor model — Phase 3 scope.
 * Present here so Vendors.jsx form submissions are persisted
 * (not silently dropped) while the PIN-code tie-up model
 * is finalized with the client.
 */
const vendorSchema = new mongoose.Schema(
  {
    // ── Contact ────────────────────────────────────────────────
    companyName:  { type: String, required: true, trim: true },
    contactPerson:{ type: String, required: true, trim: true },
    email:        { type: String, required: true, trim: true, lowercase: true },
    phone:        { type: String, required: true },
    pinCode:      { type: String, required: true },
    city:         { type: String, required: true },
    state:        { type: String, required: true },

    // ── Trade classification ────────────────────────────────────
    tradeCategory: {
      type: String,
      enum: [
        'civil-construction',
        'structural-steel',
        'mep-electrical',
        'mep-plumbing',
        'peb-systems',
        'concrete-supply',
        'rebar-steel',
        'waterproofing',
        'flooring-specialist',
        'finishing-interior',
        'survey-testing',
        'transport-logistics',
        'other',
      ],
      required: true,
    },
    tradeSubCategory: String, // free-text detail

    // ── Operational reach ──────────────────────────────────────
    regionsServed: {
      type: [String],
      enum: ['odisha', 'andaman', 'bengal', 'pan-india', 'other'],
      default: [],
    },

    // ── Registration / compliance ──────────────────────────────
    gstNumber:     String,
    panNumber:     String,
    esicRegistered:{ type: Boolean, default: false },
    pfRegistered:  { type: Boolean, default: false },
    isoTurnover:   String, // annual turnover range selected by vendor

    // ── Capacity indicators ────────────────────────────────────
    workforceSize:   String, // e.g. '10–50', '50–200', '200+'
    machineryOwned:  { type: Boolean, default: false },
    previousProjects:{ type: String, maxlength: 1000 },
    portfolioUrl:    String,
    resumeUrl:       String, // uploaded capability statement (Cloudinary/S3)

    // ── Message / RFQ context ──────────────────────────────────
    message:{ type: String, maxlength: 2000 },

    // ── Internal admin workflow ────────────────────────────────
    status: {
      type: String,
      enum: ['pending-review', 'approved', 'rejected', 'on-hold'],
      default: 'pending-review',
    },
    adminNotes: String,
    reviewedBy:  String,
    reviewedAt:  Date,

    source: { type: String, default: 'website-vendor-portal' },
  },
  { timestamps: true }
);

// Index for fast admin-panel queries
vendorSchema.index({ status: 1, tradeCategory: 1 });
vendorSchema.index({ email: 1 }, { unique: true });

export default mongoose.model('Vendor', vendorSchema);
