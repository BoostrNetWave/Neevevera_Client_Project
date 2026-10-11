import mongoose from 'mongoose';

const careerSchema = new mongoose.Schema(
  {
    slug:             { type: String, required: true, unique: true },
    title:            { type: String, required: true },
    department:       String,
    location:         { type: String, required: true },
    type:             { type: String, enum: ['full-time', 'part-time', 'contract', 'freelance'], default: 'full-time' },
    experience:       String,
    description:      { type: String, required: true },
    responsibilities: [String],
    requirements:     [String],
    isActive:         { type: Boolean, default: true },
    closingDate:      Date,
    applications: [{
      name:        String,
      email:       String,
      phone:       String,
      resumeUrl:   String,
      coverLetter: String,
      appliedAt:   { type: Date, default: Date.now },
      status:      { type: String, enum: ['received', 'reviewed', 'shortlisted', 'rejected'], default: 'received' },
    }],

    // Phase 2 additions
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

careerSchema.index({ isActive: 1 });

export default mongoose.model('Career', careerSchema);
