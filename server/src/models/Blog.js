import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema(
  {
    slug:  { type: String, required: true },
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['article', 'podcast', 'newsletter', 'field-note'],
      default: 'article',
    },
    category: {
      type: String,
      enum: ['company-update', 'project-update', 'industry-news', 'construction-tips', 'engineering', 'maintenance'],
    },
    content:        { type: String, required: true },
    excerpt:        String,
    coverImage:     String,
    author:         { type: String, default: 'Neevevera Editorial' },
    tags:           [String],
    podcastUrl:     String,
    externalSource: String,
    isPublished:    { type: Boolean, default: false },
    publishedAt:    Date,

    // Phase 2 additions
    isDeleted:  { type: Boolean, default: false },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Partial unique index: slug unique only among non-deleted records
blogSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
blogSchema.index({ isPublished: 1, isDeleted: 1, publishedAt: -1 });

export default mongoose.model('Blog', blogSchema);
