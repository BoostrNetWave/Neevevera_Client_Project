import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function createSuperAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');

    const superAdminCount = await User.countDocuments({ role: 'superadmin' });
    if (superAdminCount > 0) {
      console.log('❌ A superadmin already exists. Refusing to create another.');
      process.exit(1);
    }

    console.log('\n--- Create SuperAdmin ---');
    const name = await question('Name: ');
    const email = await question('Email: ');
    const password = await question('Password: ');

    if (!name || !email || !password) {
      console.log('❌ All fields are required.');
      process.exit(1);
    }

    const admin = await User.create({
      name,
      email,
      password,
      role: 'superadmin',
    });

    console.log(`✅ SuperAdmin ${admin.email} created successfully.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error creating superadmin:', err.message);
    process.exit(1);
  }
}

createSuperAdmin();
