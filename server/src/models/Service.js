

import mongoose from 'mongoose';


const subServiceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },

  description: {
    type: String,
    default: '',
    trim: true,
  },

  image: {
    type: String,
    default: '',
    trim: true,
  },

  isActive: {
    type: Boolean,
    default: true,
  },

  order: {
    type: Number,
    default: 0,
  },
});


const serviceSectionSchema = new mongoose.Schema({
  title: {
    type: String,
    trim: true,
    default: '',
  },

  description: {
    type: String,
    trim: true,
    default: '',
  },

  services: {
    type: [subServiceSchema],
    default: [],
  },

  order: {
    type: Number,
    default: 0,
  },
});

const serviceSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: [
        'construction',
        'building-repair-maintenance',
        'design-planning',
        'interior-exterior-solutions',
        'project-management-consultancy',
        'additional-services-platform-features',
      ],
      required: true,
    },

    // Main vertical information
    description: {
      type: String,
      required: true,
    },

    shortDescription: {
      type: String,
      default: '',
    },

    image: {
      type: String,
      default: '',
    },

    // Nested subheadings and their individual services
    sections: {
      type: [serviceSectionSchema],
      default: [],
    },

    // Existing fields retained for compatibility
    gallery: {
      type: [String],
      default: [],
    },

    benefits: {
      type: [String],
      default: [],
    },

    features: {
      type: [String],
      default: [],
    },

    priceNote: String,
    legalNote: String,

    isTieupRequired: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    order: {
      type: Number,
      default: 0,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Service', serviceSchema);
