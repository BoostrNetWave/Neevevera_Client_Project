/**
 * backfill-gallery-usage.js
 *
 * One-time script: repairs MediaAsset.usageCount for every GalleryItem record
 * that existed before the Option A hotfix (2026-10-06).
 *
 * Problem it solves:
 *   Before the hotfix, createGalleryItem never incremented usageCount.
 *   Any MediaAsset whose publicId matches an existing GalleryItem still has
 *   usageCount === 0, making it a target for the next orphan-cleanup run
 *   (daily at 2 AM).  This script does the one-time increment for those
 *   pre-existing records so the cleanup job no longer sees them as orphans.
 *
 * Safe to run multiple times (idempotent when run once, but double-running
 * would over-count — see note below).
 *
 * Usage:
 *   node scripts/backfill-gallery-usage.js [--dry-run]
 *
 * Flags:
 *   --dry-run   Print what would change without writing anything (default: dry-run)
 *   --execute   Actually apply the increments
 *
 * Prerequisites:
 *   MONGO_URI must be set in environment (or .env loaded below).
 *
 * Idempotency note:
 *   This script is NOT safe to run twice against a live database.
 *   After it runs once, usageCount reflects reality.  Running it again would
 *   increment counts a second time, creating a false surplus.  The script
 *   guards against this by printing a "ALREADY PATCHED" warning if it finds
 *   any GalleryItem whose matching MediaAsset already has usageCount >= 1 —
 *   check that output before committing to --execute on a second run.
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import GalleryItem from '../src/models/GalleryItem.js';
import MediaAsset from '../src/models/MediaAsset.js';

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

  // Fetch all GalleryItems that have a publicId recorded
  const galleryItems = await GalleryItem.find(
    { publicId: { $exists: true, $ne: '' } },
    { publicId: 1, title: 1, _id: 1 }
  ).lean();

  console.log(`Found ${galleryItems.length} GalleryItem(s) with a publicId.\n`);

  if (galleryItems.length === 0) {
    console.log('Nothing to backfill. Exiting.');
    await mongoose.disconnect();
    return;
  }

  // Collect all publicIds and fetch their current MediaAsset state in one query
  const publicIds = galleryItems.map(g => g.publicId);
  const assets = await MediaAsset.find(
    { publicId: { $in: publicIds } },
    { publicId: 1, usageCount: 1, isDeleted: 1 }
  ).lean();

  const assetMap = new Map(assets.map(a => [a.publicId, a]));

  let toIncrement = [];
  let alreadyClaimed = [];
  let noAssetRecord = [];

  for (const item of galleryItems) {
    const asset = assetMap.get(item.publicId);
    if (!asset) {
      noAssetRecord.push(item);
    } else if (asset.usageCount >= 1) {
      alreadyClaimed.push({ item, asset });
    } else {
      toIncrement.push({ item, asset });
    }
  }

  // Report
  console.log(`─── Needs increment (usageCount === 0): ${toIncrement.length}`);
  toIncrement.forEach(({ item }) =>
    console.log(`  + ${item.publicId}  (GalleryItem: "${item.title || item._id}")`)
  );

  if (alreadyClaimed.length > 0) {
    console.log(`\n─── ALREADY PATCHED (usageCount >= 1): ${alreadyClaimed.length}`);
    alreadyClaimed.forEach(({ item, asset }) =>
      console.log(`  ✓ ${item.publicId}  usageCount=${asset.usageCount}  (may already have been run)`)
    );
  }

  if (noAssetRecord.length > 0) {
    console.log(`\n─── WARNING — No MediaAsset row found for: ${noAssetRecord.length}`);
    noAssetRecord.forEach(({ publicId, title, _id }) =>
      console.log(`  ⚠ publicId="${publicId}"  (GalleryItem: "${title || _id}") — asset may have been manually deleted`)
    );
  }

  if (toIncrement.length === 0) {
    console.log('\nNothing to increment. All GalleryItems are already accounted for.');
    await mongoose.disconnect();
    return;
  }

  if (DRY_RUN) {
    console.log(`\nDRY-RUN: Would increment usageCount on ${toIncrement.length} MediaAsset(s).`);
    console.log('Run with --execute to apply.');
    await mongoose.disconnect();
    return;
  }

  // Execute increments
  const publicIdsToFix = toIncrement.map(({ item }) => item.publicId);
  const result = await MediaAsset.updateMany(
    { publicId: { $in: publicIdsToFix } },
    { $inc: { usageCount: 1 } }
  );

  console.log(`\n✅ Incremented usageCount on ${result.modifiedCount} MediaAsset(s).`);

  if (result.modifiedCount !== publicIdsToFix.length) {
    console.warn(
      `⚠  Expected ${publicIdsToFix.length} updates but only ${result.modifiedCount} matched. ` +
      `Some publicIds may be duplicated across GalleryItems or the asset rows are missing.`
    );
  }

  await mongoose.disconnect();
  console.log('\nDone. Disconnected from MongoDB.');
}

run().catch(err => {
  console.error('Backfill script failed:', err);
  mongoose.disconnect();
  process.exit(1);
});
