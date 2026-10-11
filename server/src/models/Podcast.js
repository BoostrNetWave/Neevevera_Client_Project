import mongoose from 'mongoose';

const podcastSchema = new mongoose.Schema(
  {
    slug:          { type: String, required: true, unique: true, trim: true },
    episodeNumber: { type: String, required: true },
    title:         { type: String, required: true, trim: true },
    description:   { type: String, required: true },
    guest:         String,
    host:          String,
    duration:      String,
    coverImage:    String,
    audioUrl:      String,
    transcript:    String,
    tags:          [String],
    isPublished:   { type: Boolean, default: false },
    publishedAt:   Date,
    viewCount:     { type: Number, default: 0 },
    season:        { type: Number, default: 1 },

    // Phase 2 additions
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

podcastSchema.index({ isPublished: 1, publishedAt: -1 });

export default mongoose.model('Podcast', podcastSchema);
