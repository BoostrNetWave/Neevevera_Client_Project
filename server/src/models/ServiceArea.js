import mongoose from 'mongoose';

const serviceAreaSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^[1-9][0-9]{5}$/, 'PIN code must be a valid 6-digit Indian PIN code'],
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['covered', 'not_covered'],
      default: 'covered',
    },
    officeNames: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    allServices: {
      type: Boolean,
      default: true,
    },
    serviceIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

export default mongoose.model('ServiceArea', serviceAreaSchema);
