/**
 * Neevevera - Phase 1 Production Test Suite
 * Runner: Vitest (ESM-native, no Babel needed)
 * Run: npm test
 */

import { describe, test, expect, beforeAll, afterAll, afterEach, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import Enquiry              from '../models/Enquiry.js';
import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import Vendor               from '../models/Vendor.js';
import Career               from '../models/Career.js';

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

// ---------------------------------------------------------------
// 1. CONTACT / ENQUIRY FORM
// ---------------------------------------------------------------
describe('POST /api/enquiries', () => {
  const validPayload = {
    type: 'contact',
    name: 'Rajesh Patel',
    email: 'rajesh@example.com',
    phone: '9876543210',
    projectScope: 'Interested in a commercial project quote.',
  };

  test('accepts a valid submission and persists it', async () => {
    const res = await request(app).post('/api/enquiries').send(validPayload);
    expect(res.status).toBe(201);
    const saved = await Enquiry.findOne({ email: validPayload.email });
    expect(saved).not.toBeNull();
    expect(saved.type).toBe('contact');
  });

  test('rejects submission missing name (400)', async () => {
    const { name, ...withoutName } = validPayload;
    const res = await request(app).post('/api/enquiries').send(withoutName);
    expect(res.status).toBe(400);
    const saved = await Enquiry.findOne({ email: validPayload.email });
    expect(saved).toBeNull();
  });

  test('rejects empty body (400)', async () => {
    const res = await request(app).post('/api/enquiries').send({});
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------
// 2. NEWSLETTER SUBSCRIPTION
// ---------------------------------------------------------------
describe('POST /api/newsletter/subscribe', () => {
  test('accepts a valid new subscription (201)', async () => {
    const res = await request(app)
      .post('/api/newsletter/subscribe')
      .send({ email: 'subscriber@example.com' });
    expect(res.status).toBe(201);
    const saved = await NewsletterSubscriber.findOne({ email: 'subscriber@example.com' });
    expect(saved).not.toBeNull();
  });

  test('duplicate email returns 200 "already subscribed" — not 500', async () => {
    await request(app).post('/api/newsletter/subscribe').send({ email: 'dup@example.com' });
    const res = await request(app).post('/api/newsletter/subscribe').send({ email: 'dup@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('missing email returns 400', async () => {
    const res = await request(app).post('/api/newsletter/subscribe').send({});
    expect(res.status).toBe(400);
  });

  test('re-subscribe after unsubscribe returns 200 with welcome-back message', async () => {
    await request(app).post('/api/newsletter/subscribe').send({ email: 'resub@example.com' });
    await request(app).post('/api/newsletter/unsubscribe').send({ email: 'resub@example.com' });
    const res = await request(app).post('/api/newsletter/subscribe').send({ email: 'resub@example.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/re-subscribed/i);
  });
});

// ---------------------------------------------------------------
// 3. VENDOR REGISTRATION
// ---------------------------------------------------------------
describe('POST /api/vendors', () => {
  const validVendor = {
    companyName:   'Odisha Building Supplies',
    contactPerson: 'Ramesh Kumar',
    email:         'vendor@example.com',
    phone:         '9123456780',
    pinCode:       '754001',
    city:          'Cuttack',
    state:         'Odisha',
    tradeCategory: 'civil-construction',
  };

  test('accepts a valid vendor registration (201)', async () => {
    const res = await request(app).post('/api/vendors').send(validVendor);
    expect(res.status).toBe(201);
    const saved = await Vendor.findOne({ email: validVendor.email });
    expect(saved).not.toBeNull();
    expect(saved.tradeCategory).toBe('civil-construction');
  });

  test('rejects invalid tradeCategory enum (400)', async () => {
    const res = await request(app)
      .post('/api/vendors')
      .send({ ...validVendor, tradeCategory: 'not-a-real-category' });
    expect(res.status).toBe(400);
  });

  test('rejects duplicate email (409)', async () => {
    await request(app).post('/api/vendors').send(validVendor);
    const res = await request(app).post('/api/vendors').send(validVendor);
    expect(res.status).toBe(409);
  });

  test('rejects registration missing city (400)', async () => {
    const { city, ...withoutCity } = validVendor;
    const res = await request(app).post('/api/vendors').send(withoutCity);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------
// 4. CAREER APPLICATION
// ---------------------------------------------------------------
describe('POST /api/careers/:slug/apply', () => {
  let jobA, jobB;

  beforeEach(async () => {
    jobA = await Career.create({
      title: 'Senior Civil Engineer', slug: 'senior-civil-engineer',
      location: 'Cuttack, Odisha', department: 'Engineering',
      description: 'Lead civil engineering projects.', isActive: true,
    });
    jobB = await Career.create({
      title: 'BIM Modeler', slug: 'bim-modeler',
      location: 'Kolkata', department: 'Design',
      description: 'Create BIM models for large-scale projects.', isActive: true,
    });
  });

  const applicantPayload = (overrides = {}) => ({
    name: 'Ananya Sen', email: 'ananya@example.com',
    phone: '9988776655', resumeUrl: 'https://example.com/resume.pdf',
    ...overrides,
  });

  test('records application against the correct job (201)', async () => {
    const res = await request(app)
      .post(`/api/careers/${jobA.slug}/apply`)
      .send(applicantPayload());
    expect(res.status).toBe(201);
    const updated = await Career.findById(jobA._id);
    expect(updated.applications.length).toBe(1);
    expect(updated.applications[0].email).toBe('ananya@example.com');
  });

  test('REGRESSION: applications to two different jobs are not cross-contaminated', async () => {
    await request(app)
      .post(`/api/careers/${jobA.slug}/apply`)
      .send(applicantPayload({ email: 'a@example.com' }));
    await request(app)
      .post(`/api/careers/${jobB.slug}/apply`)
      .send(applicantPayload({ email: 'b@example.com' }));

    const rA = await Career.findById(jobA._id);
    const rB = await Career.findById(jobB._id);
    expect(rA.applications.length).toBe(1);
    expect(rB.applications.length).toBe(1);
    expect(rA.applications[0].email).toBe('a@example.com');
    expect(rB.applications[0].email).toBe('b@example.com');
    expect(rA.title).toBe('Senior Civil Engineer');
    expect(rB.title).toBe('BIM Modeler');
  });

  test('nonexistent job slug returns 404, not a crash', async () => {
    const res = await request(app)
      .post('/api/careers/this-job-does-not-exist/apply')
      .send(applicantPayload());
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------
// 5. AUTH — LOGIN & LOGOUT
// ---------------------------------------------------------------
describe('Auth routes', () => {
  const validUser = {
    name: 'Test Admin', email: 'admin@neevevera.com',
    password: 'SecurePass@123', role: 'admin',
  };

  beforeEach(async () => {
    const { default: User } = await import('../models/User.js');
    await User.create(validUser);
  });

  test('logs in with correct credentials and sets cookie (200)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email, password: 'SecurePass@123', // Raw password, hash was handled by pre-save
    });
    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('admin');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('rejects wrong password (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: validUser.email, password: 'WrongPassword!',
    });
    expect(res.status).toBe(401);
  });

  test('rejects non-existent user (401)', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'nobody@example.com', password: 'irrelevant',
    });
    expect(res.status).toBe(401); // Centralized error handler + login logic returns 401 for not found
  });

  test('logout clears the cookie (200)', async () => {
    // 1. Login first
    const loginRes = await request(app).post('/api/auth/login').send({
      email: validUser.email, password: 'SecurePass@123',
    });
    const cookie = loginRes.headers['set-cookie'].find(c => c.startsWith('accessToken=')).split(';')[0];
    
    // 2. Logout
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
  });
});

// ---------------------------------------------------------------
// 6. DOUBLE-SUBMIT SPOT CHECK
// ---------------------------------------------------------------
describe('Double-submit behaviour', () => {
  test('two rapid identical enquiry submissions — at least one succeeds (frontend button-disable is the guard)', async () => {
    const payload = {
      type: 'contact', name: 'Double Click',
      email: 'doubleclick@example.com', phone: '9000000000',
      projectScope: 'test',
    };
    const [first, second] = await Promise.all([
      request(app).post('/api/enquiries').send(payload),
      request(app).post('/api/enquiries').send(payload),
    ]);
    const statuses = [first.status, second.status];
    expect(statuses.some(s => s === 201)).toBe(true);
  });
});
