import 'dotenv/config';
import mongoose from 'mongoose';
import MediaAsset from '../src/models/MediaAsset.js';
import GalleryItem from '../src/models/GalleryItem.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  const asset = await MediaAsset.create({
    url: 'http://example.com/test-image.jpg',
    publicId: 'test_public_id_123',
    context: 'galleryMedia',
    usageCount: 0
  });
  console.log('Created MediaAsset:', asset.publicId);
  
  const item = await GalleryItem.create({
    title: 'Test Fresh Item',
    imageUrl: asset.url,
    publicId: asset.publicId,
    category: 'other'
  });
  console.log('Created GalleryItem:', item.publicId);
  
  await mongoose.disconnect();
}

run().catch(console.error);
