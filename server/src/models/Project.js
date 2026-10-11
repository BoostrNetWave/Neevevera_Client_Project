import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    slug:     { type: String, required: true },
    name:     { type: String, required: true },
    category: {
      type: String,
      enum: ['residential', 'commercial', 'industrial', 'infrastructure', 'government'],
      required: true,
    },
    location:          { type: String, required: true },
    region:            { type: String, enum: ['odisha', 'andaman', 'bengal', 'corridor', 'other'], required: true },
    clientName:        String,
    description:       { type: String, required: true },
    shortDescription:  String,
    completionDate:    Date,
    status:            { type: String, enum: ['ongoing', 'commissioned', 'planning'], default: 'ongoing' },
    completionPercent: { type: Number, min: 0, max: 100 },
    coverImage:        String,
    gallery:           [String],
    specs:             [{ label: String, value: String }],
    projectCode:       String,
    isActive:          { type: Boolean, default: true },
    isFeatured:        { type: Boolean, default: false },

    // Phase 2 additions
    isDeleted:  { type: Boolean, default: false },
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Partial unique index: slug is unique ONLY among non-deleted records.
// Allows slug reuse after a soft-delete (plain unique index blocks it).
projectSchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
projectSchema.index({ category: 1, isDeleted: 1 });
projectSchema.index({ isFeatured: 1, isDeleted: 1 });

export default mongoose.model('Project', projectSchema);
