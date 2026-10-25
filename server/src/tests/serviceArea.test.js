/**
 * ServiceArea & PIN Code Coverage Test Suite
 * Runner: Vitest
 */
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import ServiceArea from '../models/ServiceArea.js';

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

describe('GET /api/service-areas/check', () => {
  test('Returns 400 if pincode query param is missing', async () => {
    const res = await request(app).get('/api/service-areas/check');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('Returns 400 for invalid PIN format (less than 6 digits or non-numeric)', async () => {
    const res1 = await request(app).get('/api/service-areas/check?pincode=12345');
    expect(res1.status).toBe(400);

    const res2 = await request(app).get('/api/service-areas/check?pincode=75300A');
    expect(res2.status).toBe(400);

    const res3 = await request(app).get('/api/service-areas/check?pincode=053001');
    expect(res3.status).toBe(400);
  });

  test('Returns unconfirmed status when PIN is not present in database', async () => {
    const res = await request(app).get('/api/service-areas/check?pincode=999999');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.serviceable).toBe(false);
    expect(res.body.status).toBe('unconfirmed');
  });

  test('Returns covered status when PIN is actively covered', async () => {
    await ServiceArea.create({
      pincode: '753001',
      district: 'Cuttack',
      state: 'Odisha',
      status: 'covered',
      officeNames: ['Cuttack G.P.O'],
      allServices: true,
    });

    const res = await request(app).get('/api/service-areas/check?pincode=753001');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.serviceable).toBe(true);
    expect(res.body.status).toBe('covered');
    expect(res.body.district).toBe('Cuttack');
    expect(res.body.state).toBe('Odisha');
  });

  test('Returns not_covered when PIN is explicitly designated not covered', async () => {
    await ServiceArea.create({
      pincode: '752000',
      district: 'Puri Rural',
      state: 'Odisha',
      status: 'not_covered',
      isActive: true,
    });

    const res = await request(app).get('/api/service-areas/check?pincode=752000');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.serviceable).toBe(false);
    expect(res.body.status).toBe('not_covered');
    expect(res.body.district).toBe('Puri Rural');
  });
});
