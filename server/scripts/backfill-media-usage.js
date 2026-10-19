/**
 * backfill-media-usage.js
 *
 * One-time script: repairs MediaAsset.usageCount for every record across the
 * entire CMS (Projects, Services, Team, Blog, etc.) that existed before the
 * system-wide usageCount tracking fix.
 *
 * Uses the single-source-of-truth registry utils/mediaFields.js to extract
 * all media references across every collection.
 *
 * Usage:
 *   node scripts/backfill-media-usage.js [--dry-run]
 *
 * Flags:
 *   --dry-run   Print what would change without writing anything (default: dry-run)
 *   --execute   Actually apply the increments
 */

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

const DRY_RUN = !process.argv.includes('--execute');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB.\n');

  if (DRY_RUN) {
    console.log('=== DRY-RUN MODE — no writes will occur ===');
    console.log('Pass --execute to apply changes.\n');
  } else {
    console.log('=== EXECUTE MODE — changes will be written ===\n');
  }

  // 1. Gather ALL referenced media URLs and publicIds from all collections
  const referencedUrls = new Set();
  const referencedPublicIds = new Set();

  const addUrl = (url) => { if (url) referencedUrls.add(url); };
  const addPublicId = (pid) => { if (pid) referencedPublicIds.add(pid); };

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

  console.log('Scanning collections using MEDIA_FIELDS registry:');
  for (const { modelName, model } of collections) {
    const docs = await model.find().lean();
    let colUrlCount = 0;
    for (const doc of docs) {
      const urls = extractMediaUrls(modelName, doc);
      for (const u of urls) {
        addUrl(u);
        colUrlCount++;
      }
      if (modelName === 'GalleryItem' && doc.publicId) {
        addPublicId(doc.publicId);
      }
    }
    console.log(`  • ${modelName.padEnd(12)}: ${docs.length.toString().padStart(2)} doc(s), ${colUrlCount} media reference(s)`);
  }

  console.log(`\nFound ${referencedUrls.size} unique URLs and ${referencedPublicIds.size} unique PublicIDs actively referenced across all content.\n`);

  // 2. Fetch all MediaAssets that match these references
  const query = {
    $or: [
      { url: { $in: Array.from(referencedUrls) } },
      { publicId: { $in: Array.from(referencedPublicIds) } }
    ]
  };

  const assets = await MediaAsset.find(query).lean();
  console.log(`Found ${assets.length} corresponding MediaAsset record(s) in the database.\n`);

  let toIncrement = [];
  let alreadyClaimed = [];

  for (const asset of assets) {
    if (asset.usageCount >= 1) {
      alreadyClaimed.push(asset);
    } else {
      toIncrement.push(asset);
    }
  }

  console.log(`─── Needs increment (usageCount === 0): ${toIncrement.length}`);
  toIncrement.forEach(a => console.log(`  + [${a.context || 'asset'}] ${a.publicId || a.url}`));

  if (alreadyClaimed.length > 0) {
    console.log(`\n─── Already claimed (usageCount >= 1): ${alreadyClaimed.length}`);
    alreadyClaimed.forEach(a => console.log(`  ✓ [${a.context || 'asset'}] ${a.publicId || a.url}  usageCount=${a.usageCount}`));
  }

  // Also check if any known orphan is accidentally matched:
  const allOrphans = await MediaAsset.find({ usageCount: 0 }).lean();
  const trueOrphans = allOrphans.filter(o => !referencedUrls.has(o.url) && !referencedPublicIds.has(o.publicId));
  console.log(`\n─── Unreferenced true orphans remaining at usageCount: 0: ${trueOrphans.length}`);
  trueOrphans.forEach(o => console.log(`  orphan: ${o.publicId || o.url} (context: ${o.context})`));

  if (toIncrement.length === 0) {
    console.log('\nNothing to increment. All referenced MediaAssets are correctly tracked.');
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log(`\nDRY-RUN: Would increment usageCount on ${toIncrement.length} MediaAsset(s).`);
    console.log('Run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  // 3. Execute increments safely
  const assetIdsToFix = toIncrement.map(a => a._id);
  const result = await MediaAsset.updateMany(
    { _id: { $in: assetIdsToFix } },
    { $inc: { usageCount: 1 } }
  );

  console.log(`\n✅ Incremented usageCount on ${result.modifiedCount} MediaAsset(s).`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error('Backfill script failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
