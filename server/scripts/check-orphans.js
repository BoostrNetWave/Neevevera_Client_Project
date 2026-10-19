import 'dotenv/config';
import mongoose from 'mongoose';
import MediaAsset from '../src/models/MediaAsset.js';
import GalleryItem from '../src/models/GalleryItem.js';
import Project from '../src/models/Project.js';
import Service from '../src/models/Service.js';
import TeamMember from '../src/models/TeamMember.js';
import Testimonial from '../src/models/Testimonial.js';
import Blog from '../src/models/Blog.js';
import HomeContent from '../src/models/HomeContent.js';
import CompanyInfo from '../src/models/CompanyInfo.js';
import { extractMediaUrls } from '../src/utils/mediaFields.js';

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  // Find all MediaAssets with usageCount 0
  const orphans = await MediaAsset.find({ usageCount: 0 }).lean();
  console.log(`Found ${orphans.length} MediaAssets with usageCount: 0`);

  if (orphans.length === 0) {
    await mongoose.disconnect();
    return;
  }

  // Gather referenced URLs/publicIds across all collections using MEDIA_FIELDS
  const referencedUrls = new Map(); // url -> Array of model names

  const collections = [
    { modelName: 'GalleryItem', model: GalleryItem },
    { modelName: 'Project',     model: Project },
    { modelName: 'Service',     model: Service },
    { modelName: 'TeamMember',  model: TeamMember },
    { modelName: 'Testimonial', model: Testimonial },
    { modelName: 'Blog',        model: Blog },
    { modelName: 'HomeContent', model: HomeContent },
    { modelName: 'CompanyInfo', model: CompanyInfo },
  ];

  for (const { modelName, model } of collections) {
    const docs = await model.find().lean();
    for (const doc of docs) {
      const urls = extractMediaUrls(modelName, doc);
      for (const u of urls) {
        if (!referencedUrls.has(u)) referencedUrls.set(u, []);
        referencedUrls.get(u).push(modelName);
      }
      if (modelName === 'GalleryItem' && doc.publicId) {
        if (!referencedUrls.has(doc.publicId)) referencedUrls.set(doc.publicId, []);
        referencedUrls.get(doc.publicId).push('GalleryItem');
      }
    }
  }

  let falseOrphans = 0;
  for (const asset of orphans) {
    const usedInUrl = referencedUrls.get(asset.url);
    const usedInPid = referencedUrls.get(asset.publicId);
    const usedIn = Array.from(new Set([...(usedInUrl || []), ...(usedInPid || [])]));

    if (usedIn.length > 0) {
      console.log(`FALSE ORPHAN: Asset ${asset.publicId} (context: ${asset.context}) is used in: ${usedIn.join(', ')}`);
      falseOrphans++;
    }
  }

  console.log(`\nTotal False Orphans (usageCount: 0 but actively referenced in content): ${falseOrphans}`);
  console.log(`True Orphans (safe to delete): ${orphans.length - falseOrphans}`);

  await mongoose.disconnect();
}

run().catch(console.error);
