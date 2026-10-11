import 'dotenv/config';
import mongoose from 'mongoose';
import MediaAsset from '../src/models/MediaAsset.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  const total = await MediaAsset.countDocuments();
  console.log(`Total MediaAssets: ${total}`);

  const byContext = await MediaAsset.aggregate([
    { $group: { _id: '$context', count: { $sum: 1 } } }
  ]);
  console.log('By context:');
  console.dir(byContext);

  const byUsage = await MediaAsset.aggregate([
    { $group: { _id: '$usageCount', count: { $sum: 1 } } }
  ]);
  console.log('By usageCount:');
  console.dir(byUsage);

  await mongoose.disconnect();
}

run().catch(console.error);
