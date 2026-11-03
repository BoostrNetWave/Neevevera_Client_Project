import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import DsrItem from '../src/models/DsrItem.js';
import DsrSetting from '../src/models/DsrSetting.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyAuditedDsr() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from environment.');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas...');

    // 1. Set global approved pricing settings
    let setting = await DsrSetting.findOne({ key: 'global_dsr_settings' });
    if (!setting) {
      setting = new DsrSetting({ key: 'global_dsr_settings' });
    }

    setting.loadingMin = 15;
    setting.loadingMax = 20;
    setting.locationIndex = 100;
    setting.isEstimatorActive = true;
    setting.taxNotice = 'Excluding GST (Applicable as per prevailing statutory rates)';
    setting.disclaimerText = 'Estimates are indicative and based on CPWD DSR 2023 norms adjusted for Odisha contractor parameters. Final BOQ is subject to structural drawings and site inspection.';
    await setting.save();
    console.log('✅ Approved Global Pricing Settings saved (15%–20% loading, Cost Index 100, Estimator ONLINE).');

    // 2. Read audited CSV
    const csvPath = path.join(__dirname, 'verified_cpwd_dsr_2023_import.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    const headerLine = lines[0];
    const dataRows = lines.slice(1);

    console.log(`Processing ${dataRows.length} audited CPWD DSR items...`);

    let updatedCount = 0;
    for (const row of dataRows) {
      const parts = row.split(',');
      if (parts.length < 10) continue;

      const itemNo = parts[0].trim();
      const category = parts[1].trim();
      const chapter = parts[2].trim();
      const subhead = parts[3].trim();
      const title = parts[4].trim();
      const desc = parts[5].trim();
      const unit = parts[6].trim().toLowerCase();
      const unitLabel = parts[7].trim();
      const sqftFactor = parseFloat(parts[8]) || 1;
      const baseRate = parseFloat(parts[9]);
      const sourcePage = parseInt(parts[10], 10) || 1;
      const edition = parts[11] ? parts[11].trim() : 'CPWD DSR 2023 Civil';
      const volume = parts[12] ? parseInt(parts[12], 10) || 1 : 1;
      const isAddOn = parts[13] ? parts[13].trim().toLowerCase() === 'true' : false;
      const coverage = parts[14] ? parts[14].trim() : '';
      const typicalBrands = parts[15] ? parts[15].trim() : '';

      const minLoad = setting.loadingMin;
      const maxLoad = setting.loadingMax;
      const costIdx = setting.locationIndex;

      const low = Math.round(baseRate * (1 + minLoad / 100) * (costIdx / 100) * 100) / 100;
      const high = Math.round(baseRate * (1 + maxLoad / 100) * (costIdx / 100) * 100) / 100;
      const lowSqft = Math.round((low / sqftFactor) * 100) / 100;
      const highSqft = Math.round((high / sqftFactor) * 100) / 100;

      await DsrItem.findOneAndUpdate(
        { itemNo },
        {
          itemNo,
          category,
          chapter,
          subhead,
          title,
          desc,
          unit,
          unitLabel,
          sqftFactor,
          baseRate,
          sourcePage,
          edition,
          volume,
          isAddOn,
          coverage,
          typicalBrands,
          loadingMin: minLoad,
          loadingMax: maxLoad,
          costIndex: costIdx,
          clientRateMin: low,
          clientRateMax: high,
          clientRateSqftMin: lowSqft,
          clientRateSqftMax: highSqft,
          clientRate: high,
          clientRateSqft: highSqft,
          isVerified: true, // Officially verified against CPWD DSR 2023
          isActive: true,
        },
        { upsert: true, returnDocument: 'after' }
      );
      updatedCount++;
    }

    console.log(`✅ Successfully updated ${updatedCount} items to Officially Verified with CPWD DSR 2023 rates!`);
  } catch (err) {
    console.error('❌ Error applying audited DSR:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

applyAuditedDsr();
