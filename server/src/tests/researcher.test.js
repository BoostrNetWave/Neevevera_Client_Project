import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import User from '../models/User.js';
import Researcher from '../models/Researcher.js';

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

const validResearcherPayload = (overrides = {}) => ({
  name: 'Dr. Debabrata Samal',
  email: 'debabrata.samal@iitbbs.ac.in',
  phone: '9861012345',
  institution: 'School of Infrastructure, IIT Bhubaneswar',
  designation: 'Assistant Professor',
  highestQualification: 'phd',
  researchInterests: ['Coastal & Marine Concrete', 'Saline Water Durability', 'Geopolymer Chemistry'],
  summary: '10+ years investigating alkali-activated fly ash concrete exposed to high tidal saline environments.',
  publications: ['https://doi.org/10.1016/j.conbuildmat.2025.1001', 'https://scholar.google.com/citations?user=test'],
  proposalUrl: 'https://res.cloudinary.com/test_cloud/image/upload/v1/neevevera/supportingDoc/synopsis.pdf',
  isPublicListingConsented: true,
  ...overrides,
});

describe('Civil Researcher Registration & R&D API', () => {
  describe('Public Registration (POST /api/researchers/register)', () => {
    test('successfully registers a researcher with pending status', async () => {
      const payload = validResearcherPayload();
      const res = await request(app).post('/api/researchers/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.status).toBe('pending');

      const saved = await Researcher.findById(res.body.data.id);
      expect(saved).not.toBeNull();
      expect(saved.name).toBe('Dr. Debabrata Samal');
      expect(saved.status).toBe('pending');
      expect(saved.isPublicListingConsented).toBe(true);
      expect(saved.proposalUrl).toContain('synopsis.pdf');
    });

    test('validates required fields', async () => {
      const res = await request(app).post('/api/researchers/register').send({
        email: 'incomplete@example.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Full name is required');
    });

    test('validates email format and researchInterests presence', async () => {
      const badEmailRes = await request(app).post('/api/researchers/register').send(
        validResearcherPayload({ email: 'not-an-email' })
      );
      expect(badEmailRes.status).toBe(400);
      expect(badEmailRes.body.error).toContain('valid email');

      const noInterestsRes = await request(app).post('/api/researchers/register').send(
        validResearcherPayload({ researchInterests: [] })
      );
      expect(noInterestsRes.status).toBe(400);
      expect(noInterestsRes.body.error).toContain('research discipline');
    });

    test('prevents duplicate active registrations for the same email', async () => {
      const payload = validResearcherPayload();
      await request(app).post('/api/researchers/register').send(payload);

      const dupRes = await request(app).post('/api/researchers/register').send(payload);
      expect(dupRes.status).toBe(409);
      expect(dupRes.body.success).toBe(false);
      expect(dupRes.body.error).toContain('active researcher profile');
    });
  });

  describe('Public Approved Directory (GET /api/researchers/approved)', () => {
    test('returns only approved researchers with public listing consent', async () => {
      // 1. Approved with consent -> should be visible
      await Researcher.create({
        ...validResearcherPayload({ email: 'approved.consented@test.ac.in', name: 'Prof. Ananya Sen' }),
        status: 'approved',
        isPublicListingConsented: true,
      });

      // 2. Approved without consent -> should NOT be visible
      await Researcher.create({
        ...validResearcherPayload({ email: 'approved.private@test.ac.in', name: 'Dr. Private Scholar' }),
        status: 'approved',
        isPublicListingConsented: false,
      });

      // 3. Pending with consent -> should NOT be visible
      await Researcher.create({
        ...validResearcherPayload({ email: 'pending.consented@test.ac.in', name: 'Mr. Pending Fellow' }),
        status: 'pending',
        isPublicListingConsented: true,
      });

      const res = await request(app).get('/api/researchers/approved');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.docs || res.body.data || [];
      expect(items.length).toBe(1);
      expect(items[0].name).toBe('Prof. Ananya Sen');

      // Check phone and email masking in public serializer
      expect(items[0].phone).toBe('+91 98••••••45');
      expect(items[0].phone).not.toBe('9861012345');
      expect(items[0].email).toContain('•');
      expect(items[0].email).not.toBe('approved.consented@test.ac.in');

      // Private fields must NOT be exposed
      expect(items[0].proposalUrl).toBeUndefined();
      expect(items[0].adminNotes).toBeUndefined();
      expect(items[0].reviewedBy).toBeUndefined();
    });
  });

  describe('Admin Routes & Access Control (/api/researchers)', () => {
    test('unauthenticated request is rejected with 401', async () => {
      const res = await request(app).get('/api/researchers');
      expect(res.status).toBe(401);
    });

    test('admin can list applications and view unmasked phone and proposalUrl', async () => {
      const { cookie } = await setupUser('admin');
      const doc = await Researcher.create(validResearcherPayload());

      const res = await request(app).get('/api/researchers').set('Cookie', cookie);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const items = res.body.docs || [];
      expect(items.length).toBe(1);
      expect(items[0].phone).toBe('9861012345'); // Full phone available to authorized admin
      expect(items[0].email).toBe('debabrata.samal@iitbbs.ac.in');
      expect(items[0].proposalUrl).toContain('synopsis.pdf');

      // Single item detail
      const singleRes = await request(app).get(`/api/researchers/${doc._id}`).set('Cookie', cookie);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.data.name).toBe('Dr. Debabrata Samal');
    });

    test('admin can update researcher review status to approved with notes', async () => {
      const { user, cookie } = await setupUser('admin');
      const doc = await Researcher.create(validResearcherPayload());

      const updateRes = await request(app)
        .patch(`/api/researchers/${doc._id}/status`)
        .set('Cookie', cookie)
        .send({
          status: 'approved',
          adminNotes: 'Verified credential with IITBBS faculty directory. Excellent match for coastal R&D.',
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.data.status).toBe('approved');

      const updated = await Researcher.findById(doc._id);
      expect(updated.status).toBe('approved');
      expect(updated.adminNotes).toContain('Verified credential');
      expect(String(updated.reviewedBy)).toBe(String(user._id));
      expect(updated.reviewedAt).toBeDefined();
    });

    test('editor cannot update researcher review status (403 forbidden)', async () => {
      const { cookie } = await setupUser('editor');
      const doc = await Researcher.create(validResearcherPayload());

      const res = await request(app)
        .patch(`/api/researchers/${doc._id}/status`)
        .set('Cookie', cookie)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
    });

    test('rejects invalid status enum with 400', async () => {
      const { cookie } = await setupUser('admin');
      const doc = await Researcher.create(validResearcherPayload());

      const res = await request(app)
        .patch(`/api/researchers/${doc._id}/status`)
        .set('Cookie', cookie)
        .send({ status: 'unknown_status' });

      expect(res.status).toBe(400);
    });

    test('admin can delete a researcher record', async () => {
      const { cookie } = await setupUser('admin');
      const doc = await Researcher.create(validResearcherPayload());

      const delRes = await request(app).delete(`/api/researchers/${doc._id}`).set('Cookie', cookie);
      expect(delRes.status).toBe(200);

      const found = await Researcher.findById(doc._id);
      expect(found).toBeNull();
    });
  });
});
