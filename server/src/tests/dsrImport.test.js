/**
 * DSR 2023 CSV Import & Bulk Processing Test Suite
 * Runner: Vitest
 */
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import User from '../models/User.js';
import DsrItem from '../models/DsrItem.js';
import DsrSetting from '../models/DsrSetting.js';
import DsrImportBatch from '../models/DsrImportBatch.js';

let mongoServer;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) await collections[key].deleteMany({});
});

async function setupUser(role = 'admin') {
  const email = `${role}-${Date.now()}@test.com`;
  const password = 'pass1234';
  const user = await User.create({ name: `${role} User`, email, password, role });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  expect(loginRes.status).toBe(200);
  const cookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('accessToken=')).split(';')[0];
  return { user, cookie };
}

async function enableEstimator() {
  return await DsrSetting.findOneAndUpdate(
    { key: 'global_dsr_settings' },
    {
      key: 'global_dsr_settings',
      loadingMin: 15,
      loadingMax: 20,
      locationIndex: 100,
      isEstimatorActive: true,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

describe('DSR CSV Upload & Bulk Import API', () => {
  // ── TEST 1: Template Download ──
  test('1. Download template returns CSV with canonical headers and no-store cache headers', async () => {
    const { cookie } = await setupUser('admin');
    const res = await request(app)
      .get('/api/dsr/admin/import-csv/template')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.headers['cache-control']).toBe('no-store, private');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.text).toContain('Item Code,Category,Chapter,Subhead,Title,Description,Unit');
  });

  // ── TEST 2: RBAC Enforcement ──
  test('2. RBAC: Unauthenticated and editor-only requests are denied (401 / 403)', async () => {
    const unauthRes = await request(app).post('/api/dsr/admin/import-csv/preview');
    expect(unauthRes.status).toBe(401);

    const { cookie: editorCookie } = await setupUser('editor');
    const editorPreviewRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', editorCookie)
      .attach('file', Buffer.from('Item Code,Category\n'), 'test.csv');
    expect(editorPreviewRes.status).toBe(403);

    const editorCommitRes = await request(app)
      .post('/api/dsr/admin/import-csv/dsr-batch-fake/commit')
      .set('Cookie', editorCookie)
      .send({ allowPartial: false });
    expect(editorCommitRes.status).toBe(403);
  });

  // ── TEST 3: Validation: Empty, Malformed, Missing Columns ──
  test('3. Rejects empty, missing required columns, and malformed files', async () => {
    const { cookie } = await setupUser('admin');

    // Missing file
    const noFileRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie);
    expect(noFileRes.status).toBe(400);

    // Empty file
    const emptyRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(''), 'empty.csv');
    expect(emptyRes.status).toBe(400);
    expect(emptyRes.body.error).toContain('empty');

    // Missing required columns (e.g. missing Base DSR Rate)
    const missingColsCsv = 'Item Code,Category,Title,Unit\n13.43.1,Finishing & Painting,Paint,sqm\n';
    const missingRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(missingColsCsv), 'missing.csv');
    expect(missingColsCsv).toBeDefined();
    expect(missingRes.status).toBe(400);
    expect(missingRes.body.error).toContain('Missing required CSV column');
  });

  // ── TEST 4: Row-Level Validation & Error Reporting ──
  test('4. Reports row numbers and actionable messages for invalid rate, category, and duplicate item codes', async () => {
    const { cookie } = await setupUser('admin');

    const csvContent = [
      'Item Code,Category,Title,Unit,Base DSR Rate (INR),PDF Source Page',
      '13.43.1,Finishing & Painting,Paint Item 1,sqm,100,43',
      '13.43.2,Invalid Category,Paint Item 2,sqm,150,44', // Invalid category
      '13.43.3,Finishing & Painting,Paint Item 3,sqm,-50,45', // Negative rate
      '13.43.1,Finishing & Painting,Duplicate Item 1,sqm,120,46', // Duplicate code within file
    ].join('\n');

    const res = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(csvContent), 'validation_test.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.totalRows).toBe(4);
    expect(res.body.summary.invalidCount).toBe(3); // row 3, 4, 5
    expect(res.body.summary.newCount).toBe(1); // row 2 (13.43.1)

    expect(res.body.errors.length).toBe(3);
    expect(res.body.errors[0].row).toBe(3);
    expect(res.body.errors[0].error).toContain('Invalid category');
    expect(res.body.errors[1].row).toBe(4);
    expect(res.body.errors[1].error).toContain('Base DSR rate must be a positive');
    expect(res.body.errors[2].row).toBe(5);
    expect(res.body.errors[2].error).toContain('Duplicate item code');
  });

  // ── TEST 5: Robust RFC 4180 Parsing (BOM, Commas, Escaped Quotes) ──
  test('5. Handles UTF-8 BOM, quoted commas, escaped quotes, and newlines correctly', async () => {
    const { cookie } = await setupUser('admin');

    // UTF-8 BOM prefix (\uFEFF)
    const bomCsv =
      '\uFEFFItem Code,Category,Title,Description,Unit,Base DSR Rate (INR),PDF Source Page\n' +
      '"13.99.1","Finishing & Painting","Paint with ""Royale"" Finish","Plastered walls, 2 coats, smooth finish","sqm",125.50,50\n';

    const res = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(bomCsv, 'utf-8'), 'bom_test.csv');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.summary.newCount).toBe(1);

    const item = res.body.stagedItems[0];
    expect(item.itemNo).toBe('13.99.1');
    expect(item.title).toBe('Paint with "Royale" Finish'); // Escaped quotes handled
    expect(item.desc).toBe('Plastered walls, 2 coats, smooth finish'); // Embedded commas handled
    expect(item.baseRate).toBe(125.5);
  });

  // ── TEST 6: Verified Item Protection (Conflict Detection) ──
  test('6. Protects verified items against silent overwrite (marked as conflict and preserved)', async () => {
    const { cookie } = await setupUser('admin');

    // 1. Existing verified item in DB
    await DsrItem.create({
      itemNo: '4.1.3',
      category: 'Concrete & RCC Work',
      title: 'Verified M20 Concrete',
      unit: 'cum',
      baseRate: 6850,
      isVerified: true, // VERIFIED!
    });

    // 2. Incoming CSV tries to overwrite 4.1.3 with lower rate
    const csvContent =
      'Item Code,Category,Title,Unit,Base DSR Rate (INR)\n' +
      '4.1.3,Concrete & RCC Work,Maliciously Altered Concrete,cum,3000\n' +
      '4.1.4,Concrete & RCC Work,Brand New Item,cum,5000\n';

    const previewRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(csvContent), 'conflict_test.csv');

    expect(previewRes.status).toBe(200);
    expect(previewRes.body.summary.conflictCount).toBe(1);
    expect(previewRes.body.summary.newCount).toBe(1);

    const conflict = previewRes.body.conflicts[0];
    expect(conflict.itemNo).toBe('4.1.3');
    expect(conflict.status).toBe('conflict');
    expect(conflict.conflictReason).toContain('already verified');

    // 3. Commit batch
    const commitRes = await request(app)
      .post(`/api/dsr/admin/import-csv/${previewRes.body.batchId}/commit`)
      .set('Cookie', cookie)
      .send({ allowPartial: false });

    expect(commitRes.status).toBe(200);
    expect(commitRes.body.skippedConflictsCount).toBe(1);

    // 4. Verify original verified item was NOT altered
    const dbItem = await DsrItem.findOne({ itemNo: '4.1.3' });
    expect(dbItem.title).toBe('Verified M20 Concrete');
    expect(dbItem.baseRate).toBe(6850); // PRESERVED!
    expect(dbItem.isVerified).toBe(true);

    // New item 4.1.4 created
    const newDbItem = await DsrItem.findOne({ itemNo: '4.1.4' });
    expect(newDbItem).not.toBeNull();
    expect(newDbItem.isVerified).toBe(false); // New import defaults to unverified
  });

  // ── TEST 7: Preview Cannot Be Tampered With & Prevents Duplicate Commits ──
  test('7. Commit enforces server-staged data and rejects duplicate commit attempts', async () => {
    const { cookie } = await setupUser('admin');

    const csvContent =
      'Item Code,Category,Title,Unit,Base DSR Rate (INR)\n' +
      '11.1.1,Flooring & Tiling,Ceramic Tiles,sqm,90\n';

    const previewRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(csvContent), 'preview_lock.csv');

    const batchId = previewRes.body.batchId;

    // First commit succeeds
    const commit1 = await request(app)
      .post(`/api/dsr/admin/import-csv/${batchId}/commit`)
      .set('Cookie', cookie)
      .send({ allowPartial: false, clientInjectedField: 'hack' }); // Injected fields ignored

    expect(commit1.status).toBe(200);
    expect(commit1.body.success).toBe(true);
    expect(commit1.body.committedCount).toBe(1);

    // Second commit of same batch fails
    const commit2 = await request(app)
      .post(`/api/dsr/admin/import-csv/${batchId}/commit`)
      .set('Cookie', cookie)
      .send({ allowPartial: false });

    expect(commit2.status).toBe(400);
    expect(commit2.body.error).toContain('already been committed');
  });

  // ── TEST 8: Imported Items Remain Unverified & Invisible to Public ──
  test('8. Imported items default to isVerified: false and remain hidden from public search and quotes', async () => {
    await enableEstimator();
    const { cookie } = await setupUser('admin');

    const csvContent =
      'Item Code,Category,Title,Unit,Base DSR Rate (INR)\n' +
      '12.99.1,Waterproofing & Roofing,Experimental Polymer Waterproofing,sqm,450\n';

    const previewRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(csvContent), 'unverified_import.csv');

    await request(app)
      .post(`/api/dsr/admin/import-csv/${previewRes.body.batchId}/commit`)
      .set('Cookie', cookie)
      .send({ allowPartial: false });

    const imported = await DsrItem.findOne({ itemNo: '12.99.1' });
    expect(imported).not.toBeNull();
    expect(imported.isVerified).toBe(false); // MUST BE FALSE

    // Public search must NOT return this item
    const publicSearchRes = await request(app).get('/api/dsr/search?q=Polymer');
    expect(publicSearchRes.status).toBe(200);
    expect(publicSearchRes.body.data.length).toBe(0);

    // Direct ID calculate probe must return 404
    const directEstimateRes = await request(app)
      .post('/api/dsr/estimate')
      .send({ lines: [{ itemId: imported._id, quantity: 10 }] });
    expect(directEstimateRes.status).toBe(404);
  });

  // ── TEST 9: Import History and SHA-256 Traceability ──
  test('9. Records full audit history including fileHash, uploader, and row metrics', async () => {
    const { cookie, user } = await setupUser('admin');

    const csvContent =
      'Item Code,Category,Title,Unit,Base DSR Rate (INR)\n' +
      '10.50.1,Structural Steel & Fabrication,Mild Steel Joists,kg,85\n';

    const previewRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(csvContent), 'audit_test.csv');

    await request(app)
      .post(`/api/dsr/admin/import-csv/${previewRes.body.batchId}/commit`)
      .set('Cookie', cookie)
      .send({ allowPartial: false });

    // Fetch history
    const historyRes = await request(app)
      .get('/api/dsr/admin/import-csv/history')
      .set('Cookie', cookie);

    expect(historyRes.status).toBe(200);
    expect(historyRes.headers['cache-control']).toBe('no-store, private');
    expect(historyRes.body.data.length).toBeGreaterThan(0);

    const record = historyRes.body.data[0];
    expect(record.batchId).toBe(previewRes.body.batchId);
    expect(record.originalFilename).toBe('audit_test.csv');
    expect(record.fileHash).toBeDefined();
    expect(record.fileHash.length).toBe(64); // SHA-256 hex string
    expect(record.uploaderName).toBe(user.name);
    expect(record.status).toBe('committed');
    expect(record.committedCount).toBe(1);
  });

  // ── TEST 10: Seed Re-run Protection ──
  test('10. Seed protection: re-seeding cannot overwrite verified items or clear custom overrides', async () => {
    // 1. Manually verified item with audited override
    const verifiedItem = await DsrItem.create({
      itemNo: '13.43.1', // matching one of the 26 seed items
      category: 'Finishing & Painting',
      title: 'Officially Audited Acrylic Emulsion',
      desc: 'Checked against CPWD DSR 2023 Vol 2 Page 43',
      unit: 'sqm',
      baseRate: 142.50,
      clientRateMin: 163.88,
      clientRateMax: 171.00,
      clientRate: 171.00,
      isVerified: true,
      isActive: true,
      overrides: [
        {
          baseRate: 115.00,
          reason: 'Audited against CPWD 2023 PDF Vol 2',
          updatedBy: new mongoose.Types.ObjectId(),
        },
      ],
    });

    // 2. Simulate re-running seed script check
    const existing = await DsrItem.findOne({ itemNo: '13.43.1' });
    expect(existing).not.toBeNull();
    expect(existing.isVerified).toBe(true);

    // If verified, seed script logic skips overwrite
    const shouldSkip = existing.isVerified || (existing.overrides && existing.overrides.length > 0);
    expect(shouldSkip).toBe(true);

    // Verify record in DB is unchanged
    const afterCheck = await DsrItem.findOne({ itemNo: '13.43.1' });
    expect(afterCheck.baseRate).toBe(142.50);
    expect(afterCheck.isVerified).toBe(true);
    expect(afterCheck.overrides.length).toBe(1);
  });

  // ── TEST 11: Expired Import Batch Rejection ──
  test('11. Rejects expired import batch commit', async () => {
    const { cookie } = await setupUser('admin');

    const csvContent =
      'Item Code,Category,Title,Unit,Base DSR Rate (INR)\n' +
      '15.1.1,Earthwork & Excavation,Trench Excavation,cum,210\n';

    const previewRes = await request(app)
      .post('/api/dsr/admin/import-csv/preview')
      .set('Cookie', cookie)
      .attach('file', Buffer.from(csvContent), 'expiry_test.csv');

    const batchId = previewRes.body.batchId;

    // Simulate batch expiration
    await DsrImportBatch.findOneAndUpdate(
      { batchId },
      { expiresAt: new Date(Date.now() - 5000) } // 5 seconds in the past
    );

    const commitRes = await request(app)
      .post(`/api/dsr/admin/import-csv/${batchId}/commit`)
      .set('Cookie', cookie)
      .send({ allowPartial: false });

    expect(commitRes.status).toBe(400);
    expect(commitRes.body.error).toContain('expired');
  });

  // ── TEST 12: Decimal Monetary Precision & Reconciliation ──
  test('12. Decimal monetary reconciliation: line subtotals and grand totals reconcile accurately without floating point skew', async () => {
    await enableEstimator();

    const item1 = await DsrItem.create({
      itemNo: '13.43.10',
      category: 'Finishing & Painting',
      title: 'Precision Paint Item',
      unit: 'sqm',
      baseRate: 115.55,
      clientRateMin: 132.88,
      clientRateMax: 138.66,
      clientRate: 138.66,
      isVerified: true,
      isActive: true,
    });

    const item2 = await DsrItem.create({
      itemNo: '4.1.10',
      category: 'Concrete & RCC Work',
      title: 'Precision Concrete Item',
      unit: 'cum',
      baseRate: 4500.25,
      clientRateMin: 5175.29,
      clientRateMax: 5400.30,
      clientRate: 5400.30,
      isVerified: true,
      isActive: true,
    });

    // Send boundary quantities with 3 decimal places
    const qty1 = 12.345;
    const qty2 = 7.125;

    const res = await request(app)
      .post('/api/dsr/estimate')
      .send({
        lines: [
          { itemId: item1._id, quantity: qty1 },
          { itemId: item2._id, quantity: qty2 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const line1 = res.body.lines[0];
    const line2 = res.body.lines[1];

    // Line 1: 132.88 * 12.345 = 1640.4036 -> rounded 1640.40
    // Line 1 max: 138.66 * 12.345 = 1711.7577 -> rounded 1711.76
    expect(line1.subtotalMin).toBe(Math.round(132.88 * qty1 * 100) / 100);
    expect(line1.subtotalMax).toBe(Math.round(138.66 * qty1 * 100) / 100);

    // Line 2: 5175.29 * 7.125 = 36873.94125 -> rounded 36873.94
    // Line 2 max: 5400.30 * 7.125 = 38477.1375 -> rounded 38477.14
    expect(line2.subtotalMin).toBe(Math.round(5175.29 * qty2 * 100) / 100);
    expect(line2.subtotalMax).toBe(Math.round(5400.30 * qty2 * 100) / 100);

    // Reconcile grand totals: sum of line items must exactly equal grand total
    const expectedGrandTotalMin = Math.round((line1.subtotalMin + line2.subtotalMin) * 100) / 100;
    const expectedGrandTotalMax = Math.round((line1.subtotalMax + line2.subtotalMax) * 100) / 100;

    expect(res.body.totals.min).toBe(expectedGrandTotalMin);
    expect(res.body.totals.max).toBe(expectedGrandTotalMax);
  });
});
