import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MediaAsset from '../models/MediaAsset.js';
import { v2 as cloudinary } from 'cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * orphanCleanup.js
 * 
 * Schedule: 2:00 AM daily.
 * Target: MediaAsset docs where usageCount === 0 AND uploadedAt (createdAt) < (now - 48h).
 * Mode: Configured via DRY_RUN flag (defaults to true per Phase 2 spec).
 */

const DRY_RUN = process.env.ORPHAN_CLEANUP_DRY_RUN !== 'false';
const LOG_FILE = path.join(__dirname, '../../logs/orphan-cleanup.log');

// Ensure log directory exists
if (!fs.existsSync(path.dirname(LOG_FILE))) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
}

function logOutput(msg) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${msg}\n`;
  console.log(line.trim());
  fs.appendFileSync(LOG_FILE, line);
}

export function startOrphanCleanupJob() {
  logOutput(`Initializing Orphan Cleanup Job (DRY_RUN: ${DRY_RUN})`);
  
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    logOutput('Starting orphan cleanup run...');
    try {
      const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
      
      const orphans = await MediaAsset.find({
        usageCount: 0,
        createdAt: { $lt: fortyEightHoursAgo }
      });
      
      if (orphans.length === 0) {
        logOutput('No orphaned assets found. Clean run.');
        return;
      }
      
      logOutput(`Found ${orphans.length} orphaned assets to process.`);
      
      let successCount = 0;
      let failCount = 0;
      
      for (const asset of orphans) {
        if (DRY_RUN) {
          logOutput(`[DRY RUN] Would delete asset: ${asset.publicId} (ID: ${asset._id})`);
          successCount++;
        } else {
          try {
            // 1. Destroy on Cloudinary FIRST
            await cloudinary.uploader.destroy(asset.publicId, { resource_type: 'auto' });
            
            // 2. Delete the MongoDB record ONLY after Cloudinary succeeds
            await MediaAsset.findByIdAndDelete(asset._id);
            
            logOutput(`[DELETED] Successfully removed orphaned asset: ${asset.publicId}`);
            successCount++;
          } catch (err) {
            logOutput(`[ERROR] Failed to delete asset ${asset.publicId}: ${err.message}`);
            failCount++;
          }
        }
      }
      
      logOutput(`Cleanup run complete. Success: ${successCount}, Failed: ${failCount}.`);
    } catch (err) {
      logOutput(`[FATAL] Orphan cleanup job crashed: ${err.message}`);
    }
  });
}
