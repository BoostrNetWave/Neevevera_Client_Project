/**
 * HomeContent.js — Singleton model for editable homepage content.
 * Only one document exists. GET returns it; PUT upserts it.
 * The SINGLETON_KEY ensures only one record ever exists.
 */
import mongoose from 'mongoose';

const statSchema = new mongoose.Schema({
  label: { type: String, default: '' },
  value: { type: String, default: '' },
  suffix: { type: String, default: '' },
}, { _id: false });

const whyPointSchema = new mongoose.Schema({
  title: { type: String, default: '' },
  body:  { type: String, default: '' },
  icon:  { type: String, default: '' },
}, { _id: false });

const homeContentSchema = new mongoose.Schema(
  {
    _singletonKey: { type: String, default: 'home', unique: true, immutable: true },

    // Hero
    heroTitle:      { type: String, default: '' },
    heroSubtitle:   { type: String, default: '' },
    heroImage:      { type: String, default: '' },
    heroCtaLabel:   { type: String, default: 'Explore Projects' },
    heroCtaLink:    { type: String, default: '/projects' },

    // Intro strip
    introHeadline:  { type: String, default: '' },
    introBody:      { type: String, default: '' },

    // Featured selections (references resolved on the frontend from their own APIs)
    featuredServiceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Service' }],
    featuredProjectIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],

    // Stats strip
    stats: [statSchema],

    // Why Choose Us
    whyChooseUsTitle:  { type: String, default: '' },
    whyChooseUsPoints: [whyPointSchema],

    // CTA section
    ctaTitle:       { type: String, default: '' },
    ctaBody:        { type: String, default: '' },
    ctaButtonLabel: { type: String, default: 'Contact Us' },
    ctaButtonLink:  { type: String, default: '/contact' },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('HomeContent', homeContentSchema);
