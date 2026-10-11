import mongoose from 'mongoose';

/**
 * Unified Enquiry model.
 *
 * Every inbound message lands here — contact form, quick-RFQ, vendor RFQ,
 * newsletter signup confirmation, etc. — distinguished by the `type` field.
 * This gives the Phase 2 admin a single inbox rather than 3+ separate screens.
 *
 * Enquiry types:
 *   'contact'        — /contact page full enquiry form
 *   'rfq'            — home-page / services Quick RFQ widget
 *   'vendor-rfq'     — Vendors.jsx sends RFQ for a specific trade
 *   'general'        — catch-all (chatbot, footer form, etc.)
 *
 * Note: Job applications are intentionally kept in Career.applications[]
 * because they carry resume attachments and per-job status tracking that
 * don't fit a generic inbox well. That separation is documented, not accidental.
 */
const enquirySchema = new mongoose.Schema(
  {
    // ── Classification (enables single-inbox filtering) ────────
    type: {
      type: String,
      enum: ['contact', 'rfq', 'vendor-rfq', 'general'],
      default: 'contact',
    },

    // ── Sender identity ────────────────────────────────────────
    name:             { type: String, required: true, trim: true, maxlength: 120 },
    email:            { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    phone:            { type: String, required: true, trim: true, maxlength: 20 },
    organization:     { type: String, trim: true, maxlength: 200 },

    // ── Project / enquiry body ─────────────────────────────────
    pinCode:          { type: String, trim: true },
    serviceCategory:  String,
    projectScope:     { type: String, required: true, trim: true, maxlength: 2000 },
    budgetRange:      String,
    timeline:         String,
    ndaRequested:     { type: Boolean, default: false },

    // ── Vendor-RFQ specific ────────────────────────────────────
    vendorCategory:   String,    // populated when type === 'vendor-rfq'
    vendorRegion:     String,

    // ── Admin workflow ─────────────────────────────────────────
    status: {
      type: String,
      enum: ['new', 'read', 'contacted', 'boq-sent', 'won', 'lost', 'closed'],
      default: 'new',
    },
    assignedTo:   String,
    internalNote: String,

    // ── Meta ───────────────────────────────────────────────────
    source:    { type: String, default: 'website' },
    ipAddress: String,           // captured server-side for abuse detection
    userAgent: String,
  },
  { timestamps: true }
);

// Indexes for admin inbox queries
enquirySchema.index({ type: 1, status: 1, createdAt: -1 });
enquirySchema.index({ email: 1 });

export default mongoose.model('Enquiry', enquirySchema);
