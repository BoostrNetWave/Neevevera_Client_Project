import mongoose from 'mongoose';

/**
 * InspectionSlot — represents a single admin-managed visit window.
 *
 * Concurrency safety:
 *  - `bookedCount` + `reservedCount` <= `capacity` is enforced at the application
 *    layer via MongoDB transactions (Atlas supports transactions).
 *  - A virtual `availableCapacity` is provided for convenience but must NEVER be
 *    trusted in payment-critical code — always reload from DB inside a transaction.
 */
const inspectionSlotSchema = new mongoose.Schema(
  {
    startTime: { type: Date, required: true },
    endTime:   { type: Date, required: true },
    capacity:  { type: Number, default: 2, min: 1, required: true },
    label:     { type: String, default: 'Inspection Window', trim: true },

    // bookedCount = permanently confirmed bookings
    bookedCount:   { type: Number, default: 0, min: 0 },
    // reservedCount = temporary holds (pending payment)
    reservedCount: { type: Number, default: 0, min: 0 },

    isBlocked:   { type: Boolean, default: false },
    blockReason: { type: String,  default: '' },

    // Optional staff pre-assignment
    assignedStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// Unique slot per start time — prevents admin from creating duplicate windows
inspectionSlotSchema.index({ startTime: 1 }, { unique: true });
inspectionSlotSchema.index({ startTime: 1, isBlocked: 1 });

// Virtual: remaining bookable capacity (informational; not payment-authoritative)
inspectionSlotSchema.virtual('availableCapacity').get(function () {
  return Math.max(0, this.capacity - this.bookedCount - this.reservedCount);
});

export default mongoose.model('InspectionSlot', inspectionSlotSchema);
