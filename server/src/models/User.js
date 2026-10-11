import mongoose from 'mongoose';
import bcrypt    from 'bcrypt';

/**
 * User.js — CMS admin accounts ONLY.
 * Customer/client accounts (Phase 3) get a SEPARATE Customer model.
 * Merging them is a recurring source of authorization bugs.
 *
 * password is select:false — always call .select('+password') explicitly
 * when you need to compare it (login route only).
 */
const userSchema = new mongoose.Schema(
  {
    name:  { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },

    // select:false — never returned by default; must be explicitly requested
    password: { type: String, required: true, select: false },

    role: {
      type: String,
      enum: ['superadmin', 'admin', 'editor'],
      required: true,
    },

    isActive:     { type: Boolean, default: true },
    lastLogin:    { type: Date },

    // Increment on logout/password-change to invalidate all outstanding refresh tokens
    tokenVersion: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

// Pre-save: hash password (12 rounds) only if it was modified
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});

export default mongoose.model('User', userSchema);
