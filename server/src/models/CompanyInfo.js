import mongoose from 'mongoose';

/**
 * CompanyInfo.js — Singleton document.
 *
 * There is always exactly ONE CompanyInfo record.
 * It is created via the create-company-info.js bootstrap script,
 * then updated via PUT /api/company (admin only).
 *
 * Fields map directly to Req #129:
 *   Company Overview, Mission, Vision, History, Values,
 *   Certifications, Awards, Company Information.
 */
const companyInfoSchema = new mongoose.Schema(
  {
    // Singleton enforcement — only one document allowed
    _singleton: { type: String, default: 'company', unique: true, immutable: true },

    // Core identity
    name:             { type: String, default: 'Neevevera Pvt. Ltd.' },
    tagline:          String,
    overview:         String,   // Company Overview
    mission:          String,   // Mission
    vision:           String,   // Vision
    logoLight:        String,
    logoDark:         String,

    // History (rich text / markdown)
    history:          String,
    foundedYear:      Number,
    headquarters:     String,

    // Values — list of { title, description } objects
    values: [{
      title:       { type: String, required: true },
      description: String,
      icon:        String,  // optional icon key for frontend
    }],

    // Certifications & Awards
    certifications: [{
      name:       { type: String, required: true },
      issuedBy:   String,
      year:       Number,
      imageUrl:   String,
    }],

    awards: [{
      title:       { type: String, required: true },
      issuedBy:    String,
      year:        Number,
      description: String,
      imageUrl:    String,
    }],

    // Company facts / stats (displayed on About page)
    stats: [{
      label: { type: String, required: true },   // e.g. "Projects Completed"
      value: { type: String, required: true },   // e.g. "200+"
    }],

    // Contact & Company Information
    email:         String,
    phone:         String,
    address:       String,
    gstNumber:     String,
    cinNumber:     String,  // Corporate Identity Number
    website:       String,

    // Social links
    social: {
      linkedin:  String,
      instagram: String,
      facebook:  String,
      youtube:   String,
      twitter:   String,
    },

    // Audit
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('CompanyInfo', companyInfoSchema);
