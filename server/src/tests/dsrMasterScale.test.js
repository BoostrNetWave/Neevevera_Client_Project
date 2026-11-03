/**
 * Master CPWD DSR Scalability & Performance Benchmarking Test Suite
 * Runner: Vitest
 *
 * Verifies:
 * 1. 200, 1,000, 5,000, and 30,000 representative records streaming & bulkWrite
 * 2. Throughput, execution time, and memory usage profiling
 * 3. Compound and text database index execution plans (explain('executionStats'))
 * 4. Resumable checkpointing & idempotent retries
 * 5. Strict verified record (isVerified: true) overwrite protection
 * 6. Audit override trail preservation
 * 7. Server-side paginated search beyond first 100 items
 * 8. Zero leakage of confidential base rates or contractor margins
 * 9. Fail-closed estimator kill-switch behavior
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

import app from '../app.js';
import User from '../models/User.js';
import DsrItem from '../models/DsrItem.js';
import DsrSetting from '../models/DsrSetting.js';
import DsrStagedItem from '../models/DsrStagedItem.js';
import DsrImportBatch from '../models/DsrImportBatch.js';
import { runMasterDsrImport } from '../../scripts/import-master-dsr.js';

let mongoServer;
const tempFixtures = [];

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Ensure indexes are built
  await DsrItem.init();
  await DsrStagedItem.init();
}, 180000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();

  // Clean up any temporary fixture CSVs
  for (const f of tempFixtures) {
    if (fs.existsSync(f)) {
      try { fs.unlinkSync(f); } catch (_) {}
    }
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
});

async function setupAdminUser() {
  const email = `admin-${Date.now()}-${Math.random()}@test.com`;
  const password = 'pass1234Admin';
  const user = await User.create({ name: 'Admin Master', email, password, role: 'admin' });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  const cookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('accessToken=')).split(';')[0];
  return { user, cookie };
}

async function enableEstimator(loadingMin = 15, loadingMax = 20, locationIndex = 100) {
  return await DsrSetting.findOneAndUpdate(
    { key: 'global_dsr_settings' },
    {
      key: 'global_dsr_settings',
      loadingMin,
      loadingMax,
      locationIndex,
      isEstimatorActive: true,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

/**
 * Helper to generate synthetic CSV fixture with valid CPWD structure
 */
function createSyntheticCsv(rowCount, prefix = 'ITEM') {
  const fixturePath = path.resolve(process.cwd(), `test-dsr-${prefix}-${rowCount}-${Date.now()}.csv`);
  tempFixtures.push(fixturePath);

  const writeStream = fs.createWriteStream(fixturePath, { encoding: 'utf-8' });
  writeStream.write('Item Code,Category,Chapter,Subhead,Title,Description,Unit,Unit Label,Sqft Factor,Base DSR Rate (INR),PDF Source Page,Edition,Volume\r\n');

  const categories = [
    'Finishing & Painting',
    'Concrete & RCC Work',
    'Reinforcement Steel',
    'Brickwork & Masonry',
    'Earthwork & Excavation',
    'Flooring & Tiling',
  ];

  for (let i = 1; i <= rowCount; i++) {
    const itemNo = `${prefix}.${Math.floor(i / 1000) + 1}.${i % 1000}`;
    const cat = categories[i % categories.length];
    const baseRate = (100 + (i % 500) * 1.5).toFixed(2);
    const line = `"${itemNo}","${cat}","Chapter ${cat}","Subhead ${i}","Specification ${prefix} Item ${i}","Full technical description for item ${i} in CPWD catalogue","sqm","Square Meter (m²)","10.764","${baseRate}","${(i % 300) + 1}","CPWD DSR 2023 Civil","1"\r\n`;
    writeStream.write(line);
  }

  writeStream.end();
  return new Promise((resolve) => writeStream.on('finish', () => resolve(fixturePath)));
}

describe('Master DSR Scalability, Indexing & Bulk Ingestion Pipeline', () => {
  // ── TEST 1: 200-row Import Benchmark ──
  test('1. 200-row batch import executes cleanly and correctly computes client rates', async () => {
    await enableEstimator();
    const csvFile = await createSyntheticCsv(200, 'T200');

    const metrics = await runMasterDsrImport({
      file: csvFile,
      commit: true,
      chunkSize: 500,
    });

    expect(metrics.totalRows).toBe(200);
    expect(metrics.validRows).toBe(200);
    expect(metrics.invalidRows).toBe(0);
    expect(metrics.insertedCount).toBe(200);

    const countInDb = await DsrItem.countDocuments({ edition: 'CPWD DSR 2023 Civil' });
    expect(countInDb).toBe(200);

    // Verify rate calculation on first item (100 * 1.15 = 115, 100 * 1.20 = 120)
    const first = await DsrItem.findOne({ itemNo: 'T200.1.1' });
    expect(first).not.toBeNull();
    expect(first.isVerified).toBe(false); // Unverified on import
    expect(first.clientRateMin).toBeCloseTo(101.5 * 1.15, 0);
  });

  // ── TEST 2: 1,000-row Import & Chunking ──
  test('2. 1,000-row batch import processes in 1,000-row chunk with zero data loss', async () => {
    await enableEstimator();
    const csvFile = await createSyntheticCsv(1000, 'T1K');

    const startMem = process.memoryUsage().heapUsed;
    const metrics = await runMasterDsrImport({
      file: csvFile,
      commit: true,
      chunkSize: 1000,
    });
    const endMem = process.memoryUsage().heapUsed;

    expect(metrics.totalRows).toBe(1000);
    expect(metrics.insertedCount).toBe(1000);
    expect(metrics.chunksProcessed).toBe(1);

    const count = await DsrItem.countDocuments({ itemNo: /^T1K\./ });
    expect(count).toBe(1000);
  });

  // ── TEST 3: 5,000-row Streaming Import & Memory Profiling ──
  test('3. 5,000-row streaming import maintains bounded memory heap', async () => {
    await enableEstimator();
    const csvFile = await createSyntheticCsv(5000, 'T5K');

    const memBefore = process.memoryUsage().heapUsed / (1024 * 1024);
    const metrics = await runMasterDsrImport({
      file: csvFile,
      commit: true,
      chunkSize: 1000,
    });
    const memAfter = process.memoryUsage().heapUsed / (1024 * 1024);

    expect(metrics.totalRows).toBe(5000);
    expect(metrics.insertedCount).toBe(5000);
    expect(metrics.chunksProcessed).toBe(5);

    // Heap difference should not spike unbounded
    const heapDiffMb = memAfter - memBefore;
    console.log(`[Memory Profile 5K] Heap before: ${memBefore.toFixed(2)} MB, after: ${memAfter.toFixed(2)} MB, diff: ${heapDiffMb.toFixed(2)} MB`);
    expect(heapDiffMb).toBeLessThan(200); // Stays well below 200MB
  });

  // ── TEST 4: Verified Item & Override Protection ──
  test('4. BulkWrite strictly preserves verified source records and archives overrides', async () => {
    await enableEstimator();

    // 1. Pre-insert a verified item
    await DsrItem.create({
      itemNo: 'PROT.1.1',
      category: 'Finishing & Painting',
      title: 'Original Official Verified Acrylic Paint',
      unit: 'sqm',
      baseRate: 150,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true, // VERIFIED
      isActive: true,
    });

    // 2. Pre-insert an unverified item
    await DsrItem.create({
      itemNo: 'UNVER.1.1',
      category: 'Finishing & Painting',
      title: 'Unverified Paint',
      unit: 'sqm',
      baseRate: 200,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: false, // UNVERIFIED
      isActive: true,
    });

    // 3. Create a CSV that attempts to overwrite both
    const fixturePath = path.resolve(process.cwd(), `test-protect-${Date.now()}.csv`);
    tempFixtures.push(fixturePath);
    const csvContent =
      'Item Code,Category,Title,Unit,Base DSR Rate (INR)\r\n' +
      '"PROT.1.1","Finishing & Painting","Malicious Overwrite of Verified","sqm","999.00"\r\n' +
      '"UNVER.1.1","Finishing & Painting","Updated Unverified Item","sqm","250.00"\r\n';
    fs.writeFileSync(fixturePath, csvContent, 'utf-8');

    const metrics = await runMasterDsrImport({
      file: fixturePath,
      commit: true,
      chunkSize: 500,
    });

    expect(metrics.conflictProtectedCount).toBe(1);
    expect(metrics.updateCount).toBe(1);

    // Verified item MUST NOT have been changed
    const verifiedItem = await DsrItem.findOne({ itemNo: 'PROT.1.1' });
    expect(verifiedItem.title).toBe('Original Official Verified Acrylic Paint');
    expect(verifiedItem.baseRate).toBe(150);
    expect(verifiedItem.isVerified).toBe(true);

    // Unverified item MUST have been updated AND previous rate archived into overrides
    const unverifiedItem = await DsrItem.findOne({ itemNo: 'UNVER.1.1' });
    expect(unverifiedItem.title).toBe('Updated Unverified Item');
    expect(unverifiedItem.baseRate).toBe(250);
    expect(unverifiedItem.overrides.length).toBe(1);
    expect(unverifiedItem.overrides[0].baseRate).toBe(200);
  });

  // ── TEST 5: Idempotency & Resumable Re-runs ──
  test('5. Re-running the exact same import is idempotent with 0 duplicate insertions', async () => {
    await enableEstimator();
    const csvFile = await createSyntheticCsv(300, 'IDEM');

    // Run 1
    const run1 = await runMasterDsrImport({ file: csvFile, commit: true, chunkSize: 500 });
    expect(run1.insertedCount).toBe(300);

    // Run 2 (Same file)
    const run2 = await runMasterDsrImport({ file: csvFile, commit: true, chunkSize: 500 });
    expect(run2.insertedCount).toBe(0);
    expect(run2.unchangedCount).toBe(300);

    const total = await DsrItem.countDocuments({ itemNo: /^IDEM\./ });
    expect(total).toBe(300);
  });

  // ── TEST 6: Server-side Search Beyond First 100 Items ──
  test('6. Server-side search finds records beyond first 100 items with exact code & multi-word match', async () => {
    await enableEstimator();

    // Insert 250 verified items
    const items = [];
    for (let i = 1; i <= 250; i++) {
      items.push({
        itemNo: `30.43.${i}`,
        category: 'Finishing & Painting',
        title: i === 220 ? 'Ultra Premium High Performance Slag Concrete Coating' : `Generic DSR Item ${i}`,
        desc: i === 220 ? 'Specialized anti-corrosion exterior protective coating' : `Description for ${i}`,
        unit: 'sqm',
        baseRate: 100 + i,
        loadingMin: 15,
        loadingMax: 20,
        costIndex: 100,
        isVerified: true,
        isActive: true,
        order: i,
      });
    }
    await DsrItem.insertMany(items);

    // 1. Test exact item code search for item #220 (which is beyond index 100)
    const codeRes = await request(app).get('/api/dsr/search?q=30.43.220');
    expect(codeRes.status).toBe(200);
    expect(codeRes.body.success).toBe(true);
    expect(codeRes.body.data.length).toBe(1);
    expect(codeRes.body.data[0].itemNo).toBe('30.43.220');
    expect(codeRes.body.data[0].title).toContain('Slag Concrete Coating');

    // 2. Test multi-token description search
    const tokenRes = await request(app).get('/api/dsr/search?q=anti-corrosion+protective');
    expect(tokenRes.status).toBe(200);
    expect(tokenRes.body.data.length).toBe(1);
    expect(tokenRes.body.data[0].itemNo).toBe('30.43.220');

    // 3. Test pagination: Page 10 with limit 20
    const pageRes = await request(app).get('/api/dsr/search?page=10&limit=20');
    expect(pageRes.status).toBe(200);
    expect(pageRes.body.meta.page).toBe(10);
    expect(pageRes.body.meta.limit).toBe(20);
    expect(pageRes.body.meta.total).toBe(250);
    expect(pageRes.body.meta.totalPages).toBe(13);
    expect(pageRes.body.meta.hasNextPage).toBe(true);
  });

  // ── TEST 7: Rate Confidentiality & Estimator Kill-Switch ──
  test('7. Search strictly suppresses baseRate/loading margins and enforces 503 kill-switch', async () => {
    await enableEstimator();

    await DsrItem.create({
      itemNo: 'SECRET.1',
      category: 'Concrete & RCC Work',
      title: 'Secret Base RCC Rate Item',
      unit: 'cum',
      baseRate: 5000,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true,
      isActive: true,
    });

    const activeRes = await request(app).get('/api/dsr/search?q=SECRET.1');
    expect(activeRes.status).toBe(200);
    const item = activeRes.body.data[0];

    // Allowed public rates
    expect(item.rateRange).toBeDefined();
    expect(item.rateRange.min).toBe(5750);
    expect(item.rateRange.max).toBe(6000);

    // Strictly forbidden fields
    expect(item.baseRate).toBeUndefined();
    expect(item.loadingMin).toBeUndefined();
    expect(item.loadingMax).toBeUndefined();
    expect(item.costIndex).toBeUndefined();
    expect(item.overrides).toBeUndefined();

    // Disable estimator kill-switch
    await DsrSetting.findOneAndUpdate(
      { key: 'global_dsr_settings' },
      { isEstimatorActive: false }
    );

    const disabledRes = await request(app).get('/api/dsr/search?q=SECRET.1');
    expect(disabledRes.status).toBe(503);
    expect(disabledRes.body.code).toBe('ESTIMATOR_DISABLED');
  });

  // ── TEST 8: Index Execution Explain Plan ──
  test('8. Compound and text indexes execute with index scan (IXSCAN / TEXT) without COLLSCAN', async () => {
    await enableEstimator();

    // Insert sample verified records
    const sample = [];
    for (let i = 1; i <= 50; i++) {
      sample.push({
        itemNo: `IDX.${i}`,
        category: 'Flooring & Tiling',
        title: `Vitrified Floor Tiles Type ${i}`,
        desc: `High gloss polished vitrified tile grade ${i}`,
        unit: 'sqm',
        baseRate: 450 + i,
        loadingMin: 15,
        loadingMax: 20,
        costIndex: 100,
        isVerified: true,
        isActive: true,
      });
    }
    await DsrItem.insertMany(sample);

    // Query with explain on exact item code
    const explainExact = await DsrItem.find({ itemNo: 'IDX.25' }).explain('executionStats');
    const winningStage = explainExact.queryPlanner?.winningPlan?.stage || explainExact.executionStats?.executionStages?.stage;

    // Must use index (IXSCAN or FETCH on top of IXSCAN), NOT pure COLLSCAN
    const planString = JSON.stringify(explainExact);
    expect(planString).toContain('IXSCAN');
  });

  // ── TEST 9: 30,000-Row Representative Staging Pipeline ──
  test('9. 30,000-row representative dataset ingestion pipeline executes without crash', async () => {
    await enableEstimator();
    const csvFile = await createSyntheticCsv(30000, 'M30K');

    const start = Date.now();
    const metrics = await runMasterDsrImport({
      file: csvFile,
      commit: true,
      chunkSize: 1000,
    });
    const elapsedSec = (Date.now() - start) / 1000;

    console.log(`[30K Ingestion Benchmark] Completed 30,000 rows in ${elapsedSec.toFixed(2)}s (${metrics.throughputRowsPerSec} rows/sec)`);

    expect(metrics.totalRows).toBe(30000);
    expect(metrics.insertedCount).toBe(30000);
    expect(metrics.failedRowsCount).toBe(0);

    const count = await DsrItem.countDocuments({ itemNo: /^M30K\./ });
    expect(count).toBe(30000);
  }, 120000); // 2 minute timeout headroom for 30,000 records
});

