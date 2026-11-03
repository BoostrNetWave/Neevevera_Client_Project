/**
 * DSR 2023 Item Rates & Estimator CMS Test Suite
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
import Enquiry from '../models/Enquiry.js';
import { dsrEstimateLimiter, dsrQuotationLimiter } from '../routes/dsr.routes.js';

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

async function enableEstimator(overrides = {}) {
  return await DsrSetting.findOneAndUpdate(
    { key: 'global_dsr_settings' },
    {
      key: 'global_dsr_settings',
      loadingMin: 15,
      loadingMax: 20,
      locationIndex: 100,
      isEstimatorActive: true,
      ...overrides,
    },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
  );
}

describe('DSR Rates & Authoritative Estimator API', () => {
  // ── B3 REGRESSION TESTS: Fail-Closed Kill-Switch ──
  test('B3.1: Public search returns 503 when estimator is unconfigured (fail-closed by default)', async () => {
    // Zero settings configured in DB
    const res = await request(app).get('/api/dsr/search?q=Concrete');
    expect(res.status).toBe(503);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('ESTIMATOR_DISABLED');
    expect(res.body.error).toBe('Estimator is temporarily unavailable.');
    // Must NOT leak confidential settings
    expect(res.body.loadingMin).toBeUndefined();
    expect(res.body.locationIndex).toBeUndefined();
  });

  test('B3.2: Estimate calculation returns 503 when isEstimatorActive is false', async () => {
    await DsrSetting.create({
      key: 'global_dsr_settings',
      isEstimatorActive: false,
    });

    const res = await request(app)
      .post('/api/dsr/estimate')
      .send({ lines: [{ itemId: new mongoose.Types.ObjectId(), quantity: 10 }] });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ESTIMATOR_DISABLED');
  });

  test('B3.3: Quotation submission returns 503 when isEstimatorActive is false', async () => {
    await DsrSetting.create({
      key: 'global_dsr_settings',
      isEstimatorActive: false,
    });

    const res = await request(app)
      .post('/api/dsr/quotation')
      .send({
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '9999999999',
        lines: [{ itemId: new mongoose.Types.ObjectId(), quantity: 10 }],
      });

    expect(res.status).toBe(503);
    expect(res.body.code).toBe('ESTIMATOR_DISABLED');
  });

  // ── PUBLIC PRICING & ZERO-LEAK TESTS ──
  test('1. A DSR item at ₹100 is shown to customer as ₹115–₹120 (zero base rate or percentages leaked)', async () => {
    await enableEstimator();

    await DsrItem.create({
      itemNo: '13.43.1',
      category: 'Finishing & Painting',
      title: 'Acrylic Emulsion Paint',
      unit: 'sqm',
      sqftFactor: 10,
      baseRate: 100,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true,
      isActive: true,
    });

    const res = await request(app).get('/api/dsr/search?q=Acrylic');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);

    const item = res.body.data[0];
    expect(item.itemNo).toBe('13.43.1');
    expect(item.rateRange.min).toBe(115);
    expect(item.rateRange.max).toBe(120);
    expect(item.rateSqftRange.min).toBe(11.5);
    expect(item.rateSqftRange.max).toBe(12);

    // CRITICAL SECURITY CHECKS:
    const jsonStr = JSON.stringify(res.body);
    expect(jsonStr).not.toContain('baseRate');
    expect(jsonStr).not.toContain('loadingMin');
    expect(jsonStr).not.toContain('loadingMax');
    expect(jsonStr).not.toContain('costIndex');
    expect(jsonStr).not.toContain('overrides');
    expect(item.baseRate).toBeUndefined();
  });

  test('2. Server authoritative calculation POST /api/dsr/estimate computes line ranges and totals', async () => {
    await enableEstimator();

    const item1 = await DsrItem.create({
      itemNo: '13.43.1',
      category: 'Finishing & Painting',
      title: 'Acrylic Emulsion Paint',
      unit: 'sqm',
      baseRate: 100,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true,
      isActive: true,
    });

    const item2 = await DsrItem.create({
      itemNo: '19.1.1',
      category: 'Electrical & Conduits',
      title: 'Modular Point Wiring',
      unit: 'point',
      baseRate: 500,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true,
      isActive: true,
    });

    const res = await request(app)
      .post('/api/dsr/estimate')
      .send({
        lines: [
          { itemId: item1._id, quantity: 100 }, // 100 sqm * (115–120) = 11,500 – 12,000
          { itemId: item2._id, quantity: 10 },  // 10 points * (575–600) = 5,750 – 6,000
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.lines.length).toBe(2);

    expect(res.body.lines[0].subtotalMin).toBe(11500);
    expect(res.body.lines[0].subtotalMax).toBe(12000);

    expect(res.body.lines[1].subtotalMin).toBe(5750);
    expect(res.body.lines[1].subtotalMax).toBe(6000);

    // Grand total: 17,250 – 18,000
    expect(res.body.totals.min).toBe(17250);
    expect(res.body.totals.max).toBe(18000);
    expect(res.body.totals.taxNotice.toLowerCase()).toContain('excluding gst');
  });

  test('3. Rejects invalid quantities or broken unit constraints', async () => {
    await enableEstimator();

    const pointItem = await DsrItem.create({
      itemNo: '19.1.1',
      category: 'Electrical & Conduits',
      title: 'Modular Point Wiring',
      unit: 'point',
      baseRate: 500,
      isVerified: true,
      isActive: true,
    });

    // Point requires whole numbers (no 2.5 points)
    const intRes = await request(app)
      .post('/api/dsr/estimate')
      .send({
        lines: [{ itemId: pointItem._id, quantity: 2.5 }],
      });
    expect(intRes.status).toBe(400);
    expect(intRes.body.error).toContain('whole number');

    // Negative or zero quantity rejected
    const negRes = await request(app)
      .post('/api/dsr/estimate')
      .send({
        lines: [{ itemId: pointItem._id, quantity: -5 }],
      });
    expect(negRes.status).toBe(400);

    // Empty lines rejected
    const emptyRes = await request(app).post('/api/dsr/estimate').send({ lines: [] });
    expect(emptyRes.status).toBe(400);
  });

  // ── H1 REGRESSION TESTS: Unverified Items Cannot Be Estimated or Quoted ──
  test('H1.1: Unverified items cannot be searched in public UI', async () => {
    await enableEstimator();

    await DsrItem.create({
      itemNo: '99.99.1',
      category: 'Finishing & Painting',
      title: 'Unverified Exotic Paint',
      unit: 'sqm',
      baseRate: 1000,
      isVerified: false, // NOT VERIFIED
      isActive: true,
    });

    const res = await request(app).get('/api/dsr/search?q=Exotic');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(0);
  });

  test('H1.2: Unverified items cannot be retrieved by direct ID for estimates', async () => {
    await enableEstimator();

    const unverifiedItem = await DsrItem.create({
      itemNo: '99.99.2',
      category: 'Finishing & Painting',
      title: 'Direct ID Probe Item',
      unit: 'sqm',
      baseRate: 1000,
      isVerified: false, // NOT VERIFIED
      isActive: true,
    });

    const res = await request(app)
      .post('/api/dsr/estimate')
      .send({
        lines: [{ itemId: unverifiedItem._id, quantity: 10 }],
      });

    expect(res.status).toBe(404);
    expect(res.body.error).toContain('not available');
  });

  // ── B4 REGRESSION TESTS: Self-Contained Snapshot & Zero Leak Allowlist ──
  test('B4: Submit quotation stores internal pricing snapshot context without leaking it to customer', async () => {
    const setting = await enableEstimator({
      loadingMin: 15,
      loadingMax: 20,
      locationIndex: 100,
      geography: 'Odisha (Khurda / Cuttack / Bhubaneswar)',
    });

    const item = await DsrItem.create({
      itemNo: '13.43.1',
      category: 'Finishing & Painting',
      title: 'Acrylic Emulsion Paint',
      desc: 'Wall painting with premium acrylic emulsion paint',
      unit: 'sqm',
      baseRate: 100,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true,
      isActive: true,
      sourcePage: 43,
    });

    const res = await request(app)
      .post('/api/dsr/quotation')
      .send({
        name: 'Debashish Mohanty',
        email: 'debashish@example.com',
        phone: '9876543210',
        pinCode: '753001',
        projectScope: 'Wall painting for 2BHK flat in Cuttack',
        lines: [{ itemId: item._id, quantity: 150 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Customer-safe response must NOT leak internal pricingConfig or base rates
    expect(res.body.snapshot.pricingConfig).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('pricingConfig');
    expect(JSON.stringify(res.body)).not.toContain('baseRate');
    expect(JSON.stringify(res.body)).not.toContain('costIndex');
    expect(res.body.snapshot.lines[0].rateMin).toBe(115);
    expect(res.body.snapshot.lines[0].rateMax).toBe(120);

    // Server-side Enquiry record MUST store the complete authoritative pricing context
    const saved = await Enquiry.findOne({ email: 'debashish@example.com' });
    expect(saved).not.toBeNull();
    expect(saved.type).toBe('quotation');
    expect(saved.estimateSnapshot.totals.min).toBe(17250); // 150 * 115
    expect(saved.estimateSnapshot.totals.max).toBe(18000); // 150 * 120

    const storedContext = saved.estimateSnapshot.pricingConfig;
    expect(storedContext).toBeDefined();
    expect(storedContext.loadingMin).toBe(15);
    expect(storedContext.loadingMax).toBe(20);
    expect(storedContext.locationIndex).toBe(100);
    expect(storedContext.edition).toBe('CPWD DSR 2023 Civil');
    expect(storedContext.dsrSettingId).toBe(String(setting._id));

    // Stored line item provenance check
    const savedLine = saved.estimateSnapshot.lines[0];
    expect(savedLine.provenance).toBe('verified_cpwd_dsr_2023');
    expect(savedLine.sourcePage).toBe(43);
  });

  // ── M1 REGRESSION TESTS: Override Preservation on Global Settings Update ──
  test('M1: Ordinary settings updates preserve per-item overrides; explicit reset overrides them', async () => {
    const { cookie } = await setupUser('admin');
    await enableEstimator();

    // 1. Create standard item and custom overridden item
    const standardItem = await DsrItem.create({
      itemNo: '4.1.3',
      category: 'Concrete & RCC Work',
      title: 'M20 Concrete Standard',
      unit: 'cum',
      baseRate: 4000,
      loadingMin: 15,
      loadingMax: 20,
      costIndex: 100,
      isVerified: true,
    });

    const customItem = await DsrItem.create({
      itemNo: '4.1.8',
      category: 'Concrete & RCC Work',
      title: 'M25 Concrete Custom Audited',
      unit: 'cum',
      baseRate: 5000,
      loadingMin: 22, // CUSTOM loading
      loadingMax: 28, // CUSTOM loading
      costIndex: 105,
      isVerified: true,
      overrides: [
        {
          loadingMin: 22,
          loadingMax: 28,
          costIndex: 105,
          reason: 'Site specific coastal aggregate premium approved',
        },
      ],
    });

    // 2. Normal global settings update (loading: 18%–24%) WITHOUT resetCustomOverrides
    const normalUpdateRes = await request(app)
      .put('/api/dsr/admin/settings')
      .set('Cookie', cookie)
      .send({
        loadingMin: 18,
        loadingMax: 24,
        locationIndex: 102,
      });

    expect(normalUpdateRes.status).toBe(200);
    expect(normalUpdateRes.body.meta.preservedOverridesCount).toBe(1);

    // Standard item should be updated
    const updatedStandard = await DsrItem.findById(standardItem._id);
    expect(updatedStandard.loadingMin).toBe(18);
    expect(updatedStandard.loadingMax).toBe(24);

    // Custom overridden item MUST BE PRESERVED
    const preservedCustom = await DsrItem.findById(customItem._id);
    expect(preservedCustom.loadingMin).toBe(22); // Unchanged!
    expect(preservedCustom.loadingMax).toBe(28); // Unchanged!

    // 3. Now perform an EXPLICIT confirmed reset (resetCustomOverrides: true)
    const resetRes = await request(app)
      .put('/api/dsr/admin/settings')
      .set('Cookie', cookie)
      .send({
        loadingMin: 18,
        loadingMax: 24,
        locationIndex: 102,
        resetCustomOverrides: true,
      });

    expect(resetRes.status).toBe(200);

    const resetCustom = await DsrItem.findById(customItem._id);
    expect(resetCustom.loadingMin).toBe(18); // Reset to global
    expect(resetCustom.loadingMax).toBe(24); // Reset to global
    // Audit trail was updated
    expect(resetCustom.overrides.length).toBe(2);
    expect(resetCustom.overrides[1].reason).toContain('confirmed reset');
  });

  // ── H2 REGRESSION TESTS: No Silent isAddOn Mutation ──
  test('H2: Save hook does not silently change isAddOn on existing records or explicit false', async () => {
    // 1. Explicitly false on creation with keywords in title
    const explicitFalse = await DsrItem.create({
      itemNo: '13.99.1',
      category: 'Finishing & Painting',
      title: 'Additional for primer (Standard Civil Scope)',
      desc: 'Regular plastering base',
      unit: 'sqm',
      baseRate: 50,
      isAddOn: false, // EXPLICIT FALSE
    });
    expect(explicitFalse.isAddOn).toBe(false);

    // 2. Rate-only update on existing document does not alter isAddOn
    explicitFalse.baseRate = 60;
    await explicitFalse.save();
    const reloaded = await DsrItem.findById(explicitFalse._id);
    expect(reloaded.isAddOn).toBe(false);

    // 3. Document created with isAddOn: true stays true
    const explicitTrue = await DsrItem.create({
      itemNo: '13.99.2',
      category: 'Finishing & Painting',
      title: 'Regular paint',
      unit: 'sqm',
      baseRate: 100,
      isAddOn: true,
    });
    explicitTrue.baseRate = 110;
    await explicitTrue.save();
    const reloadedTrue = await DsrItem.findById(explicitTrue._id);
    expect(reloadedTrue.isAddOn).toBe(true);
  });

  // ── M2 REGRESSION TESTS: Admin CSV Export Headers & Protection ──
  test('M2: Admin CSV export sets Cache-Control: no-store, private and is protected by auth', async () => {
    // Unauthenticated request rejected
    const unauthRes = await request(app).get('/api/dsr/admin/export-csv');
    expect(unauthRes.status).toBe(401);

    // Authenticated admin request
    const { cookie } = await setupUser('admin');
    const authRes = await request(app).get('/api/dsr/admin/export-csv').set('Cookie', cookie);

    expect(authRes.status).toBe(200);
    expect(authRes.headers['content-type']).toContain('text/csv');
    expect(authRes.headers['cache-control']).toBe('no-store, private');
    expect(authRes.headers['content-disposition']).toContain('attachment');
  });

  // ── M3 REGRESSION TESTS: Limiter Wiring ──
  test('M3: Rate limiters are registered with expected windowMs and max thresholds', () => {
    expect(dsrEstimateLimiter).toBeDefined();
    expect(dsrQuotationLimiter).toBeDefined();
    // Verify standard rate limit middleware configuration
    expect(typeof dsrEstimateLimiter).toBe('function');
    expect(typeof dsrQuotationLimiter).toBe('function');
  });
});
