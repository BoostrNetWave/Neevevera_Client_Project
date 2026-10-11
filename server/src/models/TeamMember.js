import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    designation: { type: String, required: true },
    role: {
      type: String,
      enum: ['director', 'project-manager', 'civil-engineer', 'architect', 'site-engineer', 'supervisor', 'other'],
      required: true,
    },
    experience:     String,
    qualifications: [String],
    bio:            String,
    photo:          String,
    email:          String,
    order:          { type: Number, default: 0 },
    isActive:       { type: Boolean, default: true },

    // Phase 2 additions
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

teamMemberSchema.index({ isActive: 1, order: 1 });

export default mongoose.model('TeamMember', teamMemberSchema);
