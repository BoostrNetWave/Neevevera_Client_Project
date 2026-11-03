/**
 * Migration & Dry-Run Script: Unverify Placeholder Seed Records (H1 Remediation)
 *
 * SCOPE:
 * Strictly targets the 26 development fixture items seeded by seed-dsr-2023.js.
 * Sets isVerified: false so they cannot be publicly searched or retrieved by ID
 * until verified against official CPWD DSR 2023 PDFs and approved by management.
 *
 * USAGE:
 * Dry-run (safe preview, no DB writes):
 *   node server/scripts/unverify-placeholder-seed.js --dry-run
 *
 * Apply changes (non-production DB only):
 *   node server/scripts/unverify-placeholder-seed.js --apply
 *
 * DO NOT RUN AGAINST PRODUCTION DATABASE WITHOUT EXPLICIT AUTHORIZATION.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import DsrItem from '../src/models/DsrItem.js';
import { SEED_DSR_ITEMS } from './seed-dsr-2023.js';

const SEED_ITEM_NOS = SEED_DSR_ITEMS.map((item) => item.itemNo);

async function runUnverifyMigration() {
  const isDryRun = process.argv.includes('--dry-run') || !process.argv.includes('--apply');
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/neevevera';

  console.log('================================================================');
  console.log('H1 Remediation — Unverify Placeholder Seed Records');
  console.log(`Mode: ${isDryRun ? 'DRY-RUN (Preview only, no DB writes)' : 'APPLY (Writing changes to non-prod DB)'}`);
  console.log(`Targeting exact ${SEED_ITEM_NOS.length} known placeholder seed item numbers.`);
  console.log('================================================================');

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.\n');

    const matchedRecords = await DsrItem.find({ itemNo: { $in: SEED_ITEM_NOS } }).select('itemNo title category isVerified');

    console.log(`Found ${matchedRecords.length} of ${SEED_ITEM_NOS.length} placeholder records in database:`);
    let currentlyVerified = 0;
    let alreadyUnverified = 0;

    for (const record of matchedRecords) {
      if (record.isVerified) {
        currentlyVerified++;
        console.log(`  [NEEDS REMEDIATION] ${record.itemNo.padEnd(10)} | ${record.category.padEnd(25)} | ${record.title}`);
      } else {
        alreadyUnverified++;
        console.log(`  [ALREADY SAFE]      ${record.itemNo.padEnd(10)} | ${record.category.padEnd(25)} | ${record.title}`);
      }
    }

    console.log(`\nSummary:`);
    console.log(`  - Total placeholder items targetable: ${SEED_ITEM_NOS.length}`);
    console.log(`  - Matched in database:              ${matchedRecords.length}`);
    console.log(`  - Currently verified (need fix):    ${currentlyVerified}`);
    console.log(`  - Already unverified:               ${alreadyUnverified}`);

    if (isDryRun) {
      console.log('\n[DRY RUN COMPLETE] No records were modified.');
      console.log('Run with --apply to perform updates in non-production environment.');
    } else {
      if (currentlyVerified > 0) {
        const updateResult = await DsrItem.updateMany(
          { itemNo: { $in: SEED_ITEM_NOS }, isVerified: true },
          { $set: { isVerified: false } }
        );
        console.log(`\n[APPLIED] Successfully marked ${updateResult.modifiedCount} records as isVerified: false.`);
      } else {
        console.log('\n[APPLIED] All matching placeholder records are already unverified. No changes needed.');
      }
    }
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB.');
  }
}

// Execute only if run directly from CLI
if (process.argv[1]?.endsWith('unverify-placeholder-seed.js')) {
  runUnverifyMigration();
}

export { SEED_ITEM_NOS, runUnverifyMigration };
