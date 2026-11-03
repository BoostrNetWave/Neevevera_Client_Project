import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import User from '../models/User.js';
import ParRate from '../models/ParRate.js';
import ParLocation from '../models/ParLocation.js';
import ParSettings from '../models/ParSettings.js';

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
  const email = `${role}-${Date.now()}-${Math.random()}@test.com`;
  const password = 'Password123!';
  const user = await User.create({ name: `${role} User`, email, password, role });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  expect(loginRes.status).toBe(200);
  const cookie = loginRes.headers['set-cookie'].find((c) => c.startsWith('accessToken=')).split(';')[0];
  return { user, cookie, email };
}

const createSampleRate = async (overrides = {}) => {
  return await ParRate.create({
    code: `PAR-2025-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    category: 'Residential',
    subCategory: 'Residential Buildings',
    title: 'RCC Framed Structure (Plinth Height up to 1.2m, Floor Height up to 3.35m)',
    structuralSystem: 'RCC Framed Structure',
    floorHeightSpec: 'Standard floor height up to 3.35m',
    baseRate: 20000, // INR 20,000 per sqm
    unit: 'sqm',
    sqftFactor: 10.7639,
    sourceReference: 'CPWD PAR 2025 Table 1.1, Item 1.1.1',
    pageNumber: 14,
    edition: 'CPWD PAR 2025',
    correctionSlip: 'Correction Slip No. 1 (15-01-2026)',
    isActive: true,
    isVerified: true,
    ...overrides,
  });
};

const createSampleLocation = async (overrides = {}) => {
  return await ParLocation.create({
    locationCode: `LOC-${Date.now()}`,
    locationName: 'Bhubaneswar',
    state: 'Odisha',
    district: 'Khurda',
    costIndex: 110, // 10% above base 100
    baseIndexEdition: 'CPWD Cost Index Base 100 as of 01.04.2023 / PAR 2025',
    sourceCircular: 'CPWD Cost Index Circular 2025/OD-01',
    effectiveDate: new Date('2025-08-01'),
    approvalStatus: 'approved',
    isActive: true,
    ...overrides,
  });
};

describe('CPWD PAR 2025 Backend Foundation API', () => {
  describe('Schema Validation & Constraints', () => {
    test('ParRate rejects creation when required source fields are missing', async () => {
      await expect(
        ParRate.create({
          category: 'Residential',
          // missing code, title, structuralSystem, baseRate, sourceReference
        })
      ).rejects.toThrow();
    });

    test('ParLocation rejects creation when costIndex or sourceCircular is missing', async () => {
      await expect(
        ParLocation.create({
          locationCode: 'TEST-LOC',
          locationName: 'Puri',
          state: 'Odisha',
          // missing costIndex, sourceCircular, effectiveDate
        })
      ).rejects.toThrow();
    });

    test('ParSettings defaults isEnabled to false (strict safe default)', async () => {
      const settings = await ParSettings.getSettings();
      expect(settings.isEnabled).toBe(false);
      expect(settings.activeEdition).toBe('CPWD PAR 2025');
      expect(settings.correctionSlipsApplied).toContain('Correction Slip No. 1 (15-01-2026)');
    });
  });

  describe('Feature Disablement & Kill-Switch', () => {
    test('POST /api/par/estimate returns 503 when estimator is disabled', async () => {
      await ParSettings.findOneAndUpdate({}, { isEnabled: false }, { upsert: true });

      const rate = await createSampleRate();
      const location = await createSampleLocation();

      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: location.locationCode,
          floors: [{ floorLevel: 'Ground Floor', area: 100, unit: 'sqm' }],
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('PAR_ESTIMATOR_DISABLED');
    });

    test('POST /api/par/estimate proceeds when enabled in settings', async () => {
      await ParSettings.findOneAndUpdate({}, { isEnabled: true }, { upsert: true });

      const rate = await createSampleRate();
      const location = await createSampleLocation();

      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: location.locationCode,
          floors: [{ floorLevel: 'Ground Floor', area: 100, unit: 'sqm' }],
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Safe Rejections on Missing / Unverified / Draft Data', () => {
    beforeEach(async () => {
      await ParSettings.findOneAndUpdate({}, { isEnabled: true }, { upsert: true });
    });

    test('rejects with 404 if rate is not found', async () => {
      const location = await createSampleLocation();
      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: 'NON_EXISTENT_CODE',
          locationCode: location.locationCode,
          floors: [{ floorLevel: 'Ground Floor', area: 100, unit: 'sqm' }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Approved CPWD PAR rate record not found/);
    });

    test('rejects with 400 if rate is not verified', async () => {
      const unverifiedRate = await createSampleRate({ isVerified: false });
      const location = await createSampleLocation();

      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: unverifiedRate.code,
          locationCode: location.locationCode,
          floors: [{ floorLevel: 'Ground Floor', area: 100, unit: 'sqm' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/pending engineering verification/);
    });

    test('rejects with 404 if location is not found', async () => {
      const rate = await createSampleRate();
      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: 'UNKNOWN_LOC',
          floors: [{ floorLevel: 'Ground Floor', area: 100, unit: 'sqm' }],
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/Approved location record not found/);
    });

    test('rejects with 400 if location is in draft status', async () => {
      const rate = await createSampleRate();
      const draftLocation = await createSampleLocation({ approvalStatus: 'draft' });

      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: draftLocation.locationCode,
          floors: [{ floorLevel: 'Ground Floor', area: 100, unit: 'sqm' }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/not established/);
    });

    test('rejects with 400 if floors array is empty or has zero/negative area', async () => {
      const rate = await createSampleRate();
      const location = await createSampleLocation();

      const resEmpty = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: location.locationCode,
          floors: [],
        });
      expect(resEmpty.status).toBe(400);

      const resZero = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: location.locationCode,
          floors: [{ floorLevel: 'G', area: -10 }],
        });
      expect(resZero.status).toBe(400);
    });
  });

  describe('Decimal-Safe Calculation & Unit Conversion', () => {
    beforeEach(async () => {
      await ParSettings.findOneAndUpdate({}, { isEnabled: true }, { upsert: true });
    });

    test('accurately calculates floor-wise cost with cost index factor and unit conversions', async () => {
      // Base rate: 10,000 INR/sqm
      // sqftFactor: 10.7639
      // Location cost index: 110 (multiplier = 1.10)
      // Adjusted rate per sqm: 10,000 * 1.10 = 11,000 INR/sqm
      // Adjusted rate per sqft: 11,000 / 10.7639 = 1,021.9344... INR/sqft
      const rate = await createSampleRate({
        baseRate: 10000,
        unit: 'sqm',
        sqftFactor: 10.7639,
      });

      const location = await createSampleLocation({
        costIndex: 110,
      });

      // 2 Floors:
      // Floor 1: 100 sqm -> cost = 100 * 11,000 = 1,100,000
      // Floor 2: 1,076.39 sqft -> converts to 100 sqm -> cost = 1,100,000
      const res = await request(app)
        .post('/api/par/estimate')
        .send({
          rateCode: rate.code,
          locationCode: location.locationCode,
          floors: [
            { floorLevel: 'Ground Floor', area: 100, unit: 'sqm' },
            { floorLevel: 'First Floor', area: 1076.39, unit: 'sqft' },
          ],
        });

      expect(res.status).toBe(200);
      const data = res.body.data;

      expect(data.edition).toBe('CPWD PAR 2025');
      expect(data.correctionSlip).toBe('Correction Slip No. 1 (15-01-2026)');
      expect(data.totalEstimatedCost).toBe(2200000);
      expect(data.totalPlinthArea.sqm).toBe(200);
      expect(data.rateSummary.perSqm).toBe(11000);
      expect(data.rateSummary.perSqft).toBe(1021.93);

      expect(data.floorBreakdown).toHaveLength(2);
      expect(data.floorBreakdown[0].estimatedCost).toBe(1100000);
      expect(data.floorBreakdown[1].estimatedCost).toBe(1100000);
      expect(data.constructionDuration).toBeNull(); // Keep separate, not arbitrary
    });
  });

  describe('API Security & Role Enforcement', () => {
    test('rejects unauthenticated attempts to create or verify PAR rates (401)', async () => {
      const resCreate = await request(app)
        .post('/api/par/rates')
        .send({ title: 'Unauthorized' });
      expect(resCreate.status).toBe(401);

      const resVerify = await request(app)
        .patch('/api/par/rates/6ae4dcd678da641a4f852d3a/verify')
        .send({ isVerified: true });
      expect(resVerify.status).toBe(401);
    });

    test('rejects editor role from creating rates or approving locations (403)', async () => {
      const { cookie } = await setupUser('editor');

      const resRate = await request(app)
        .post('/api/par/rates')
        .set('Cookie', cookie)
        .send({ title: 'Editor Rate' });
      expect(resRate.status).toBe(403);

      const resLoc = await request(app)
        .post('/api/par/locations')
        .set('Cookie', cookie)
        .send({ locationName: 'Editor City' });
      expect(resLoc.status).toBe(403);
    });

    test('admin can create, update, and verify rates with audit trail', async () => {
      const { user, cookie } = await setupUser('admin');

      // Create
      const createRes = await request(app)
        .post('/api/par/rates')
        .set('Cookie', cookie)
        .send({
          code: 'PAR-2025-ADMIN-1',
          category: 'Residential',
          title: 'Admin Created Specification',
          structuralSystem: 'RCC Framed',
          baseRate: 25000,
          sourceReference: 'CPWD PAR 2025 Table 1.2',
        });
      expect(createRes.status).toBe(201);
      const createdId = createRes.body.data._id;

      // Verify
      const verifyRes = await request(app)
        .patch(`/api/par/rates/${createdId}/verify`)
        .set('Cookie', cookie)
        .send({ isVerified: true, auditNotes: 'Verified against official CPWD publication' });
      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.isVerified).toBe(true);
      expect(verifyRes.body.data.verifiedBy).toBe(String(user._id));
      expect(verifyRes.body.data.auditNotes).toBe('Verified against official CPWD publication');
    });

    test('admin can manage locations and approve building cost indices', async () => {
      const { user, cookie } = await setupUser('admin');

      // Create location
      const createRes = await request(app)
        .post('/api/par/locations')
        .set('Cookie', cookie)
        .send({
          locationCode: 'OD-CTC',
          locationName: 'Cuttack',
          state: 'Odisha',
          costIndex: 106,
          sourceCircular: 'CPWD Works Circular 2025/11',
          effectiveDate: '2025-09-01',
        });
      expect(createRes.status).toBe(201);
      const locId = createRes.body.data._id;
      expect(createRes.body.data.approvalStatus).toBe('draft');

      // Approve location
      const approveRes = await request(app)
        .patch(`/api/par/locations/${locId}/approve`)
        .set('Cookie', cookie)
        .send({ approvalStatus: 'approved' });
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.approvalStatus).toBe('approved');
      expect(approveRes.body.data.approvedBy).toBe(String(user._id));
    });
  });
});
