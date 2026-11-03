import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

import app from '../app.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import SiteInspectionBooking from '../models/SiteInspectionBooking.js';
import SiteInspectionSettings from '../models/SiteInspectionSettings.js';
import InspectionSlot from '../models/InspectionSlot.js';

let mongoServer;
let adminToken;
let fieldStaffToken;
let otherStaffToken;
let adminUser;
let fieldStaffUser;
let otherStaffUser;
let testSlot;

beforeAll(async () => {
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // 1. Admin user
  adminUser = await User.create({
    name: 'Admin Director',
    email: 'admin.director@neevevara.com',
    password: 'Password@123',
    role: 'admin',
    isActive: true,
  });
  adminToken = jwt.sign(
    { id: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'neevevera-test-secret-do-not-use-in-production',
    { expiresIn: '1h' }
  );

  // 2. Field Staff user
  fieldStaffUser = await User.create({
    name: 'Er. Rajesh Kumar',
    email: 'rajesh.kumar@neevevara.com',
    password: 'Password@123',
    role: 'field_staff',
    isActive: true,
  });
  fieldStaffToken = jwt.sign(
    { id: fieldStaffUser._id, role: 'field_staff' },
    process.env.JWT_SECRET || 'neevevera-test-secret-do-not-use-in-production',
    { expiresIn: '1h' }
  );

  // 3. Other Staff user
  otherStaffUser = await User.create({
    name: 'Er. Ananya Jena',
    email: 'ananya.jena@neevevara.com',
    password: 'Password@123',
    role: 'field_staff',
    isActive: true,
  });
  otherStaffToken = jwt.sign(
    { id: otherStaffUser._id, role: 'field_staff' },
    process.env.JWT_SECRET || 'neevevera-test-secret-do-not-use-in-production',
    { expiresIn: '1h' }
  );

  // Create slot for bookings
  testSlot = await InspectionSlot.create({
    date: new Date('2026-12-10'),
    windowName: 'morning',
    startTime: new Date('2026-12-10T10:00:00Z'),
    endTime: new Date('2026-12-10T13:00:00Z'),
    capacity: 5,
    pinCodes: ['753001', '751001'],
    isActive: true,
  });
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 60000);

beforeEach(async () => {
  await Vendor.deleteMany({});
  await SiteInspectionBooking.deleteMany({});
});

describe('Operational Registration & Field Staff Workflow Tests', () => {
  // ── 1. Field Staff Role & Security Isolation ─────────────────────
  describe('1. Field Staff Role & Access Control Isolation', () => {
    it('field_staff cannot access admin user management (403 forbidden)', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${fieldStaffToken}`);
      expect(res.status).toBe(403);
    });

    it('field_staff cannot edit CMS content like projects (403 forbidden)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${fieldStaffToken}`)
        .send({
          title: 'Unauthorized Project',
          category: 'commercial',
        });
      expect(res.status).toBe(403);
    });

    it('field_staff sees ONLY visits assigned to their own account', async () => {
      // Booking assigned to Rajesh
      const booking1 = await SiteInspectionBooking.create({
        bookingRef: 'NV-VIS-TEST-RAJESH',
        customerName: 'Priya Sharma',
        customerPhone: '9876543210',
        siteAddress: 'Plot 45, Saheed Nagar',
        pinCode: '751001',
        district: 'Khurda',
        visitType: 'Structural Consultation',
        slotId: testSlot._id,
        visitStartTime: testSlot.startTime,
        visitEndTime: testSlot.endTime,
        amountPaise: 100000,
        bookingStatus: 'assigned',
        assignedStaffId: fieldStaffUser._id,
        policyAccepted: true,
      });

      // Booking assigned to Ananya
      await SiteInspectionBooking.create({
        bookingRef: 'NV-VIS-TEST-ANANYA',
        customerName: 'Bikash Das',
        customerPhone: '9123456780',
        siteAddress: 'Badambadi, Cuttack',
        pinCode: '753001',
        district: 'Cuttack',
        visitType: 'Soil Bearing Test',
        slotId: testSlot._id,
        visitStartTime: testSlot.startTime,
        visitEndTime: testSlot.endTime,
        amountPaise: 100000,
        bookingStatus: 'assigned',
        assignedStaffId: otherStaffUser._id,
        policyAccepted: true,
      });

      // Rajesh queries my-visits
      const res = await request(app)
        .get('/api/site-inspections/staff/my-visits')
        .set('Authorization', `Bearer ${fieldStaffToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.data[0].bookingRef).toBe('NV-VIS-TEST-RAJESH');
      expect(res.body.data[0].customerName).toBe('Priya Sharma');
    });

    it('field_staff cannot modify visit status of visits assigned to other engineers', async () => {
      const ananyaBooking = await SiteInspectionBooking.create({
        bookingRef: 'NV-VIS-ANANYA-ONLY',
        customerName: 'Deepak Rout',
        customerPhone: '9876543210',
        siteAddress: 'CDA Sector 9, Cuttack',
        pinCode: '753001',
        district: 'Cuttack',
        visitType: 'Structural Assessment',
        slotId: testSlot._id,
        visitStartTime: testSlot.startTime,
        visitEndTime: testSlot.endTime,
        amountPaise: 100000,
        bookingStatus: 'assigned',
        assignedStaffId: otherStaffUser._id, // Assigned to Ananya
        policyAccepted: true,
      });

      // Rajesh tries to update Ananya's visit
      const res = await request(app)
        .patch(`/api/site-inspections/staff/visits/${ananyaBooking._id}/status`)
        .set('Authorization', `Bearer ${fieldStaffToken}`)
        .send({ status: 'visit_in_progress' });

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found or not assigned to you/i);
    });

    it('field_staff can advance their own visit status and submit report findings', async () => {
      const visit = await SiteInspectionBooking.create({
        bookingRef: 'NV-VIS-REPORT-TEST',
        customerName: 'Manoj Panigrahi',
        customerPhone: '9876543210',
        siteAddress: 'Khandagiri Enclave',
        pinCode: '751001',
        district: 'Khurda',
        visitType: 'Foundation Assessment',
        slotId: testSlot._id,
        visitStartTime: testSlot.startTime,
        visitEndTime: testSlot.endTime,
        amountPaise: 100000,
        bookingStatus: 'assigned',
        assignedStaffId: fieldStaffUser._id,
        policyAccepted: true,
      });

      // 1. Advance to visit_in_progress
      const statusRes = await request(app)
        .patch(`/api/site-inspections/staff/visits/${visit._id}/status`)
        .set('Authorization', `Bearer ${fieldStaffToken}`)
        .send({ status: 'visit_in_progress', note: 'Engineer arrived at site' });

      expect(statusRes.status).toBe(200);
      expect(statusRes.body.data.bookingStatus).toBe('visit_in_progress');

      // 2. Submit Final Inspection Report
      const reportRes = await request(app)
        .post(`/api/site-inspections/staff/visits/${visit._id}/report`)
        .set('Authorization', `Bearer ${fieldStaffToken}`)
        .send({
          soilCondition: 'Hard moorum with clay layer at 3 meters',
          structuralObservations: 'Plot is level with adequate road front',
          recommendations: 'Isolated footings suitable up to G+3',
          fieldNotes: 'Discussed plinth height requirement with owner',
          sitePhotos: [{ url: 'https://res.cloudinary.com/test/photo1.jpg', caption: 'North Boundary Wall' }],
        });

      expect(reportRes.status).toBe(200);
      expect(reportRes.body.data.bookingStatus).toBe('completed');
      expect(reportRes.body.data.inspectionFindings.soilCondition).toBe('Hard moorum with clay layer at 3 meters');
    });
  });

  // ── 2. Freelancer Registration via Vendor System ────────────────
  describe('2. Freelancer Registration via Vendor API', () => {
    it('successfully registers an independent engineer with applicantType freelancer', async () => {
      const res = await request(app)
        .post('/api/vendors')
        .send({
          applicantType: 'freelancer',
          contactPerson: 'Er. Subham Nayak',
          specialization: 'Structural Draughtsman',
          experienceYears: 7,
          qualification: 'B.Tech Civil Engineering',
          dailyRate: 3500,
          email: 'subham.civil@gmail.com',
          phone: '+91 9437112233',
          pinCode: '751010',
          city: 'Bhubaneswar',
          state: 'Odisha',
          tradeCategory: 'civil-construction',
          regionsServed: ['odisha'],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const dbVendor = await Vendor.findById(res.body.data.id);
      expect(dbVendor).toBeDefined();
      expect(dbVendor.applicantType).toBe('freelancer');
      expect(dbVendor.specialization).toBe('Structural Draughtsman');
      expect(dbVendor.experienceYears).toBe(7);
      expect(dbVendor.companyName).toMatch(/Subham Nayak/);
    });

    it('admin can filter vendor listing by applicantType=freelancer', async () => {
      // 1. Corporate vendor
      await Vendor.create({
        companyName: 'Utkal Concrete Products',
        contactPerson: 'Mr. Pradhan',
        email: 'utkal.concrete@gmail.com',
        phone: '9876543211',
        pinCode: '751001',
        city: 'Bhubaneswar',
        state: 'Odisha',
        tradeCategory: 'concrete-supply',
        applicantType: 'company',
      });

      // 2. Freelancer
      await Vendor.create({
        contactPerson: 'Er. Anita Mishra',
        specialization: 'Land Surveyor',
        email: 'anita.survey@gmail.com',
        phone: '9876543212',
        pinCode: '751001',
        city: 'Bhubaneswar',
        state: 'Odisha',
        tradeCategory: 'survey-testing',
        applicantType: 'freelancer',
      });

      // Query freelancers
      const res = await request(app)
        .get('/api/vendors?applicantType=freelancer')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      const list = res.body.items || res.body.data;
      expect(list[0].contactPerson).toBe('Er. Anita Mishra');
      expect(list[0].applicantType).toBe('freelancer');
    });
  });

  // ── 3. Token Amount Bounds in SiteInspectionSettings ────────────
  describe('3. Token Amount Bounded between ₹500 and ₹1,500', () => {
    it('enforces min 50,000 paise (₹500) and max 150,000 paise (₹1,500)', async () => {
      // Valid amount ₹1,000
      const valid = new SiteInspectionSettings({
        tokenAmountPaise: 100000,
        policyVersion: 'v1.0',
      });
      await expect(valid.validate()).resolves.toBeUndefined();

      // Under minimum (< ₹500)
      const tooLow = new SiteInspectionSettings({
        tokenAmountPaise: 30000, // ₹300
        policyVersion: 'v1.0',
      });
      await expect(tooLow.validate()).rejects.toThrow();

      // Over maximum (> ₹1,500)
      const tooHigh = new SiteInspectionSettings({
        tokenAmountPaise: 200000, // ₹2,000
        policyVersion: 'v1.0',
      });
      await expect(tooHigh.validate()).rejects.toThrow();
    });
  });
});
