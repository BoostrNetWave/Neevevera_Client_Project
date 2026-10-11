import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    slug:  { type: String, required: true, unique: true },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['construction', 'finishing', 'specialized', 'professional', 'legal', 'education'],
      required: true,
    },
    description:      { type: String, required: true },
    shortDescription: String,
    image:            String,
    gallery:          [String],
    benefits:         [String],
    features:         [String],
    priceNote:        String,
    legalNote:        String,
    isTieupRequired:  { type: Boolean, default: false },
    isActive:         { type: Boolean, default: true },
    order:            { type: Number, default: 0 },

    // Phase 2 additions
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
