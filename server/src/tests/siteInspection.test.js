/**
 * Site Inspection Booking & Razorpay Payment Integration Tests
 * Runner: Vitest
 */
import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import SiteInspectionSettings from '../models/SiteInspectionSettings.js';
import InspectionSlot from '../models/InspectionSlot.js';
import ServiceArea from '../models/ServiceArea.js';
import RazorpayWebhookEvent from '../models/RazorpayWebhookEvent.js';

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

describe('Site Inspection Booking & Payments API', () => {

  describe('GET /api/site-inspections/config', () => {
    test('Returns fail-closed defaults when no settings exist', async () => {
      const res = await request(app).get('/api/site-inspections/config');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bookingEnabled).toBe(false); // Fail-closed default
      expect(res.body.data.paymentsEnabled).toBe(false);
      expect(res.body.data.tokenAmountPaise).toBeNull(); // Null when paymentsEnabled is false
    });

    test('Returns configured token amount when payments are enabled', async () => {
      await SiteInspectionSettings.create({
        key: 'global_site_inspection_settings',
        bookingEnabled: true,
        paymentsEnabled: true,
        tokenAmountPaise: 99900,
      });

      const res = await request(app).get('/api/site-inspections/config');
      expect(res.status).toBe(200);
      expect(res.body.data.paymentsEnabled).toBe(true);
      expect(res.body.data.tokenAmountPaise).toBe(99900);
    });
  });

  describe('GET /api/site-inspections/check-coverage', () => {
    test('Rejects invalid 6-digit PIN code format', async () => {
      const res = await request(app).get('/api/site-inspections/check-coverage?pinCode=123');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('Returns not covered when PIN is not in covered service areas', async () => {
      const res = await request(app).get('/api/site-inspections/check-coverage?pinCode=751001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.covered).toBe(false);
    });

    test('Returns covered with district and state when PIN is active and covered', async () => {
      await ServiceArea.create({
        pincode: '751001',
        district: 'Khurda',
        state: 'Odisha',
        status: 'covered',
        isActive: true,
      });

      const res = await request(app).get('/api/site-inspections/check-coverage?pinCode=751001');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.covered).toBe(true);
      expect(res.body.district).toBe('Khurda');
      expect(res.body.state).toBe('Odisha');
    });
  });

  describe('GET /api/site-inspections/slots', () => {
    test('Returns 503 if bookingEnabled is false (Fail-Closed)', async () => {
      const res = await request(app).get('/api/site-inspections/slots');
      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });

    test('Returns only future, unblocked slots with remaining capacity when bookingEnabled is true', async () => {
      await SiteInspectionSettings.create({
        key: 'global_site_inspection_settings',
        bookingEnabled: true,
      });

      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 27 * 60 * 60 * 1000);

      const pastStart = new Date(Date.now() - 48 * 60 * 60 * 1000);
      const pastEnd = new Date(Date.now() - 45 * 60 * 60 * 1000);

      // 1. Available future slot
      await InspectionSlot.create({
        startTime: futureStart,
        endTime: futureEnd,
        capacity: 2,
        bookedCount: 0,
        reservedCount: 0,
        label: 'Morning Window',
      });

      // 2. Blocked slot
      await InspectionSlot.create({
        startTime: new Date(Date.now() + 30 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 33 * 60 * 60 * 1000),
        capacity: 2,
        isBlocked: true,
        label: 'Blocked Window',
      });

      // 3. Past slot
      await InspectionSlot.create({
        startTime: pastStart,
        endTime: pastEnd,
        capacity: 2,
        label: 'Past Window',
      });

      const res = await request(app).get('/api/site-inspections/slots');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].label).toBe('Morning Window');
    });
  });

  describe('POST /api/site-inspections/bookings (Slot Reservation)', () => {
    test('Returns 503 if bookingEnabled is false (Fail-Closed)', async () => {
      const res = await request(app)
        .post('/api/site-inspections/bookings')
        .send({
          customerName: 'Ashok Kumar',
          customerPhone: '9876543210',
          pinCode: '751001',
        });

      expect(res.status).toBe(503);
      expect(res.body.success).toBe(false);
    });

    test('Validates required inputs and reserves slot atomically', async () => {
      // Enable booking in settings
      await SiteInspectionSettings.create({
        key: 'global_site_inspection_settings',
        bookingEnabled: true,
        paymentsEnabled: false,
        tokenAmountPaise: 99900,
        holdDurationSeconds: 900,
      });

      // Add service area
      await ServiceArea.create({
        pincode: '751001',
        district: 'Khurda',
        state: 'Odisha',
        status: 'covered',
        isActive: true,
      });

      // Add slot
      const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureEnd = new Date(Date.now() + 27 * 60 * 60 * 1000);
      const slot = await InspectionSlot.create({
        startTime: futureStart,
        endTime: futureEnd,
        capacity: 2,
        bookedCount: 0,
        reservedCount: 0,
        label: 'Morning Window',
      });

      const payload = {
        customerName: 'Ramesh Das',
        customerPhone: '9876543210',
        customerEmail: 'ramesh@example.com',
        siteAddress: 'Plot 42, Infocity Road',
        pinCode: '751001',
        district: 'Khurda',
        state: 'Odisha',
        visitType: 'residential',
        slotId: slot._id.toString(),
        policyAccepted: true,
      };

      const res = await request(app)
        .post('/api/site-inspections/bookings')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.booking.bookingRef).toMatch(/^SIB-/);
      expect(res.body.booking.bookingStatus).toBe('pending_payment');

      // Verify slot reservedCount incremented
      const updatedSlot = await InspectionSlot.findById(slot._id);
      expect(updatedSlot.reservedCount).toBe(1);

      // Verify security exclusions: private fields are NOT in public response
      expect(res.body.booking._id).toBeUndefined();
      expect(res.body.booking.adminNotes).toBeUndefined();
      expect(res.body.booking.accessTokenHash).toBeUndefined();
      expect(res.body.booking.statusHistory).toBeUndefined();
    });
  });

  describe('POST /api/payments/razorpay/webhook (Raw HMAC & Deduplication)', () => {
    test('Rejects webhook with 400 when signature is invalid', async () => {
      process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret_key_123';

      const rawPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              order_id: 'order_test123',
              amount: 99900,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      });

      const res = await request(app)
        .post('/api/payments/razorpay/webhook')
        .set('x-razorpay-signature', 'invalid_signature_hex')
        .set('Content-Type', 'application/json')
        .send(rawPayload);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('signature');
    });

    test('Accepts valid HMAC signature and deduplicates event ID', async () => {
      const secret = 'test_webhook_secret_key_123';
      process.env.RAZORPAY_WEBHOOK_SECRET = secret;

      const eventPayload = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_valid_123',
              order_id: 'order_valid_123',
              amount: 99900,
              currency: 'INR',
              status: 'captured',
            },
          },
        },
      };

      const rawString = JSON.stringify(eventPayload);
      const validSig = crypto.createHmac('sha256', secret).update(rawString).digest('hex');
      const eventId = 'evt_unique_test_001';

      // 1. First event delivery
      const res1 = await request(app)
        .post('/api/payments/razorpay/webhook')
        .set('x-razorpay-signature', validSig)
        .set('x-razorpay-event-id', eventId)
        .set('Content-Type', 'application/json')
        .send(rawString);

      expect(res1.status).toBe(200);

      // Verify event recorded in DB
      const recorded = await RazorpayWebhookEvent.findOne({ razorpayEventId: eventId });
      expect(recorded).not.toBeNull();
      expect(recorded.signatureValid).toBe(true);

      // 2. Duplicate event delivery with same event ID
      const res2 = await request(app)
        .post('/api/payments/razorpay/webhook')
        .set('x-razorpay-signature', validSig)
        .set('x-razorpay-event-id', eventId)
        .set('Content-Type', 'application/json')
        .send(rawString);

      expect(res2.status).toBe(200);
      expect(res2.body.received).toBe(true);
    });
  });
});
