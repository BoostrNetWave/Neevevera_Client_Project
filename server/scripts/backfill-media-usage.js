/**
 * backfill-media-usage.js
 *
 * One-time script: repairs MediaAsset.usageCount for every record across the
 * entire CMS (Projects, Services, Team, Blog, etc.) that existed before the
 * system-wide usageCount tracking fix (2026-10-06).
 *
 * Supersedes the earlier gallery-only backfill.
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

  // Helper to safely add to sets
  const addUrl = (url) => { if (url) referencedUrls.add(url); };
  const addUrls = (arr) => { if (Array.isArray(arr)) arr.forEach(addUrl); };
  const addPublicId = (pid) => { if (pid) referencedPublicIds.add(pid); };

  // Gallery (uses publicId and imageUrl)
  const galleries = await GalleryItem.find().lean();
  galleries.forEach(g => { addUrl(g.imageUrl); addPublicId(g.publicId); });

  // Projects (coverImage, gallery array)
  const projects = await Project.find().lean();
  projects.forEach(p => { addUrl(p.coverImage); addUrls(p.gallery); });

  // Services (coverImage)
  const services = await Service.find().lean();
  services.forEach(s => addUrl(s.coverImage));

  // Team (image)
  const team = await TeamMember.find().lean();
  team.forEach(t => addUrl(t.image));

  // Testimonial (image)
  const testimonials = await Testimonial.find().lean();
  testimonials.forEach(t => addUrl(t.image));

  // Blog (coverImage)
  const blogs = await Blog.find().lean();
  blogs.forEach(b => addUrl(b.coverImage));

  // HomeContent (heroImage)
  const home = await HomeContent.findOne({ _singletonKey: 'home' }).lean();
  if (home) addUrl(home.heroImage);

  // CompanyInfo (logoLight, logoDark, certifications)
  const company = await CompanyInfo.findOne({ _singleton: 'company' }).lean();
  if (company) {
    addUrl(company.logoLight);
    addUrl(company.logoDark);
    addUrls((company.certifications || []).map(c => c.image));
  }

  console.log(`Found ${referencedUrls.size} unique URLs and ${referencedPublicIds.size} unique PublicIDs actively referenced in content.\n`);

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
  toIncrement.forEach(a => console.log(`  + ${a.publicId || a.url}`));

  if (alreadyClaimed.length > 0) {
    console.log(`\n─── ALREADY PATCHED (usageCount >= 1): ${alreadyClaimed.length}`);
    alreadyClaimed.forEach(a => console.log(`  ✓ ${a.publicId || a.url}  usageCount=${a.usageCount}`));
  }

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
