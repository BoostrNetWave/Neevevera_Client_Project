import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import bcrypt from 'bcrypt';

dotenv.config();

async function seed() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is missing from .env');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB Atlas...');

  const defaultPassword = process.env.ADMIN_SEED_PASSWORD || 'Ayan@1234';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // 1. Superadmin account
  const superadmin = await User.findOneAndUpdate(
    { email: 'fannekhan334@gmail.com' },
    {
      name: 'Fanne Khan',
      email: 'fannekhan334@gmail.com',
      password: hashedPassword,
      role: 'superadmin',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );
  console.log(`✅ Superadmin ready: ${superadmin.email}`);

  // 2. Admin account (Ayan Azmi)
  const admin = await User.findOneAndUpdate(
    { email: 'viperhunter@gmail.com' },
    {
      name: 'Ayan Azmi',
      email: 'viperhunter@gmail.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      tokenVersion: 0,
    },
    { upsert: true, new: true }
  );
  console.log(`✅ Admin ready: ${admin.email}`);
  console.log(`🔑 Password set to: "${defaultPassword}"`);

  process.exit(0);
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
