import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import bcrypt from 'bcrypt';

dotenv.config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const salt = await bcrypt.genSalt(10);
  const password = await bcrypt.hash('Ayan1234', salt);
  await User.findOneAndUpdate(
    { email: 'fannekhan334@gmail.com' },
    { name: 'Fanne Khan', email: 'fannekhan334@gmail.com', password, role: 'superadmin' },
    { upsert: true, new: true }
  );
  console.log('Superadmin created!');
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
