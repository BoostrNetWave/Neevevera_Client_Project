// setup-inspection.js — run from server/ dir: node setup-inspection.js
import mongoose from 'mongoose';
import { readFileSync } from 'fs';

// Load .env
const envContent = readFileSync('.env', 'utf-8');
for (const line of envContent.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const idx = t.indexOf('=');
  if (idx > 0) {
    const k = t.slice(0, idx);
    if (!process.env[k]) {
      let v = t.slice(idx + 1).trim();
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
      process.env[k] = v;
    }
  }
}

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) { console.error('MONGO_URI not set in .env'); process.exit(1); }

const settingsSchema = new mongoose.Schema({ key: String }, { strict: false });
const areaSchema = new mongoose.Schema({ pincode: String }, { strict: false });
const slotSchema = new mongoose.Schema({ startTime: Date }, { strict: false });
const Settings = mongoose.model('SiteInspectionSettings', settingsSchema);
const ServiceArea = mongoose.model('ServiceArea', areaSchema);
const Slot = mongoose.model('InspectionSlot', slotSchema);

await mongoose.connect(MONGO_URI);
console.log('Connected to MongoDB');

// Enable bookings
await Settings.findOneAndUpdate(
  { key: 'global_site_inspection_settings' },
  {
    key: 'global_site_inspection_settings',
    bookingEnabled: true,
    paymentsEnabled: false,
    tokenAmountPaise: 100000,
    currency: 'INR',
    holdDurationSeconds: 600,
    bookingHorizonDays: 30,
    visitDurationMinutes: 90,
    maxBookingsPerSlot: 3,
    cancellationWindowHours: 24,
    isRefundable: false,
    policyVersion: 'v1.0',
    refundPolicy: 'The booking token is non-refundable and adjustable against contract.',
    disclaimerText: 'Token confirms slot only. Terms discussed during visit.',
    taxNotice: 'Amount inclusive of all taxes.',
  },
  { upsert: true, new: true }
);
console.log('Settings: bookingEnabled=true, paymentsEnabled=false');

// Seed service areas
const areas = [
  { pincode: '751001', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751002', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751003', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751006', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751009', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751010', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751012', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751013', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751015', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751017', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751019', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751020', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751021', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751022', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751024', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751025', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751028', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '751030', district: 'Bhubaneswar', state: 'Odisha' },
  { pincode: '753001', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753002', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753003', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753004', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753007', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753009', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753010', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753011', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753012', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753013', district: 'Cuttack', state: 'Odisha' },
  { pincode: '753014', district: 'Cuttack', state: 'Odisha' },
  { pincode: '752001', district: 'Puri', state: 'Odisha' },
  { pincode: '752002', district: 'Puri', state: 'Odisha' },
  { pincode: '752003', district: 'Puri', state: 'Odisha' },
  { pincode: '752011', district: 'Puri', state: 'Odisha' },
  { pincode: '744101', district: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { pincode: '744102', district: 'Port Blair', state: 'Andaman and Nicobar Islands' },
  { pincode: '744103', district: 'South Andaman', state: 'Andaman and Nicobar Islands' },
  { pincode: '744104', district: 'South Andaman', state: 'Andaman and Nicobar Islands' },
  { pincode: '744106', district: 'South Andaman', state: 'Andaman and Nicobar Islands' },
  { pincode: '700001', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700002', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700005', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700007', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700013', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700016', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700017', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700019', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700025', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700027', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700032', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700046', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700047', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700053', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700060', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700064', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700075', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700078', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700082', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700088', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700091', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700094', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700099', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700107', district: 'Kolkata', state: 'West Bengal' },
  { pincode: '700108', district: 'Kolkata', state: 'West Bengal' },
];

let u = 0;
for (const a of areas) {
  await ServiceArea.findOneAndUpdate(
    { pincode: a.pincode },
    { ...a, status: 'covered', isActive: true },
    { upsert: true }
  );
  u++;
}
console.log('ServiceArea: ' + u + ' PIN codes seeded');

// Create inspection slots for the next 3 weeks
const now = new Date();
const windows = [
  { label: 'Morning (9 AM to 11 AM)', sh: 9, sm: 0, eh: 11, em: 0 },
  { label: 'Midday (11 AM to 1 PM)', sh: 11, sm: 0, eh: 13, em: 0 },
  { label: 'Afternoon (2 PM to 4 PM)', sh: 14, sm: 0, eh: 16, em: 0 },
  { label: 'Evening (4 PM to 6 PM)', sh: 16, sm: 0, eh: 18, em: 0 },
];
let created = 0;
for (let d = 1; d <= 21; d++) {
  const date = new Date(now);
  date.setDate(now.getDate() + d);
  if (date.getDay() === 0) continue;
  for (const w of windows) {
    const st = new Date(date); st.setHours(w.sh, w.sm, 0, 0);
    const et = new Date(date); et.setHours(w.eh, w.em, 0, 0);
    const ex = await Slot.findOne({ startTime: st });
    if (!ex) {
      await Slot.create({ startTime: st, endTime: et, label: w.label, capacity: 3, bookedCount: 0, reservedCount: 0, isBlocked: false });
      created++;
    }
  }
}
console.log('InspectionSlot: ' + created + ' new slots created');
console.log('');
console.log('DONE! Visit http://localhost:5173/book-inspection');
await mongoose.disconnect();