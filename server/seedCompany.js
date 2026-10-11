import mongoose from 'mongoose';
import dotenv from 'dotenv';
import CompanyInfo from './src/models/CompanyInfo.js';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB');

  const existing = await CompanyInfo.findOne({});
  if (existing) {
    console.log('CompanyInfo already seeded');
    process.exit(0);
  }

  await CompanyInfo.create({
    overview: 'Neevevera Private Limited delivers specialized civil construction, commercial towers, marine infrastructure, and industrial developments across Odisha, the Andaman & Nicobar Islands, and West Bengal.',
    mission: 'To construct enduring infrastructure that elevates communities.',
    vision: 'To be the premier engineering partner in Eastern India and the Islands.',
    history: 'Founded by Er. Eshwar K. with a vision for excellence.',
    values: ['Safety', 'Integrity', 'Precision', 'Innovation'],
    certifications: ['ISO 9001:2015'],
    awards: ['Best Emerging Contractor 2024'],
  });

  console.log('CompanyInfo seeded successfully.');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
