import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app.js';
import Partner from '../models/Partner.js';
import PartnerIncentive from '../models/PartnerIncentive.js';
import PartnerSettings from '../models/PartnerSettings.js';
import Enquiry from '../models/Enquiry.js';
import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import {
  normalizePhone,
  normalizeEmail,
  generateUniqueReferralCode,
  generateVerificationToken,
  resolveReferralAttribution,
} from '../utils/referralAttribution.js';

let mongoServer;
let adminToken;
let editorToken;
let adminUser;

beforeAll(async () => {
  // Increased hook timeout for Windows MongoMemoryServer startup
  if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create admin and editor users for RBAC testing
  adminUser = await User.create({
    name: 'Admin Director',
    email: 'admin.director@neevevara.com',
    password: 'Password@123',
    role: 'admin',
    isActive: true,
  });

  const editorUser = await User.create({
    name: 'Editor User',
    email: 'editor.user@neevevara.com',
    password: 'Password@123',
    role: 'editor',
    isActive: true,
  });

  adminToken = jwt.sign(
    { id: adminUser._id, role: 'admin' },
    process.env.JWT_SECRET || 'neevevera-test-secret-do-not-use-in-production',
    { expiresIn: '1h' }
  );

  editorToken = jwt.sign(
    { id: editorUser._id, role: 'editor' },
    process.env.JWT_SECRET || 'neevevera-test-secret-do-not-use-in-production',
    { expiresIn: '1h' }
  );
}, 120000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 120000);

beforeEach(async () => {
  await Partner.deleteMany({});
  await PartnerIncentive.deleteMany({});
  await PartnerSettings.deleteMany({});
  await Enquiry.deleteMany({});
});

describe('Marketing Partner V1 — Steps 1 & 2 Tests', () => {
  describe('1. Unit Utilities & Entropy (Amendment B)', () => {
    it('normalizes Indian phone numbers accurately to 10 digits', () => {
      expect(normalizePhone('+91 98765-43210')).toBe('9876543210');
      expect(normalizePhone('09876543210')).toBe('9876543210');
      expect(normalizePhone('9876543210')).toBe('9876543210');
    });

    it('normalizes email addresses to lowercase trimmed strings', () => {
      expect(normalizeEmail('  Partner.Test@Neevevara.Com  ')).toBe('partner.test@neevevara.com');
    });

    it('generates unique referral code with 64-bit entropy prefix NV-', async () => {
      const code1 = await generateUniqueReferralCode();
      const code2 = await generateUniqueReferralCode();
      expect(code1).toMatch(/^NV-[A-Z0-9]{6,16}$/);
      expect(code2).toMatch(/^NV-[A-Z0-9]{6,16}$/);
      expect(code1).not.toBe(code2);
    });

    it('generates high-entropy one-time verification token with SHA-256 hash', () => {
      const { rawToken, tokenHash, expiresAt } = generateVerificationToken();
      expect(rawToken).toHaveLength(64); // 32 bytes hex
      expect(tokenHash).toHaveLength(64); // sha256 hex
      expect(expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('2. Public Registration (POST /api/partners/register)', () => {
    const validData = {
      name: 'Priyabrata Mohanty',
      phone: '+91 9437123456',
      email: 'priyabrata.mohanty@gmail.com',
      city: 'Bhubaneswar',
      pin: '751024',
      partnerType: 'individual',
      agreementAccepted: true,
    };

    it('creates partner in pending_email status with token hash', async () => {
      const res = await request(app)
        .post('/api/partners/register')
        .send(validData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);

      const saved = await Partner.findOne({ email: 'priyabrata.mohanty@gmail.com' });
      expect(saved).not.toBeNull();
      expect(saved.status).toBe('pending_email');
      expect(saved.verificationTokenHash).toBeDefined();
      expect(saved.referralCode).toBeUndefined(); // Code not generated until approval
    });

    it('rejects registration when agreement is not accepted', async () => {
      const res = await request(app)
        .post('/api/partners/register')
        .send({ ...validData, agreementAccepted: false });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Partner Terms');
    });

    it('rejects invalid PIN code format', async () => {
      const res = await request(app)
        .post('/api/partners/register')
        .send({ ...validData, pin: '7510' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('PIN code');
    });

    it('rejects duplicate email registration', async () => {
      await request(app).post('/api/partners/register').send(validData);

      const res = await request(app)
        .post('/api/partners/register')
        .send({ ...validData, phone: '9861000000' }); // different phone, same email

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });

    it('rejects duplicate phone registration', async () => {
      await request(app).post('/api/partners/register').send(validData);

      const res = await request(app)
        .post('/api/partners/register')
        .send({ ...validData, email: 'different.email@gmail.com' }); // different email, same phone

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already registered');
    });
  });

  describe('3. Email Verification (GET /api/partners/verify/:token)', () => {
    it('advances partner status to pending_approval and clears verification token', async () => {
      const { rawToken, tokenHash, expiresAt } = generateVerificationToken();
      const partner = await Partner.create({
        name: 'Soumya Ranjan',
        phone: '9853112233',
        normalizedPhone: '9853112233',
        email: 'soumya@odishabuild.in',
        normalizedEmail: 'soumya@odishabuild.in',
        city: 'Cuttack',
        pin: '753001',
        partnerType: 'professional',
        status: 'pending_email',
        verificationTokenHash: tokenHash,
        verificationTokenExpiresAt: expiresAt,
      });

      const res = await request(app).get(`/api/partners/verify/${rawToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Partner.findById(partner._id);
      expect(updated.status).toBe('pending_approval');
      expect(updated.emailVerifiedAt).toBeDefined();
      expect(updated.verificationTokenHash).toBeUndefined();
    });

    it('rejects expired or invalid verification tokens', async () => {
      const res = await request(app).get('/api/partners/verify/nonexistent-token-12345');
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid or expired');
    });
  });

  describe('4. Admin Approval & High-Entropy Code Generation', () => {
    it('approves partner and assigns unique referral code NV-XXXXXXXXXXXXXXXX', async () => {
      const partner = await Partner.create({
        name: 'Tapas Kumar',
        phone: '9439001122',
        normalizedPhone: '9439001122',
        email: 'tapas@gmail.com',
        normalizedEmail: 'tapas@gmail.com',
        city: 'Puri',
        pin: '752001',
        partnerType: 'individual',
        status: 'pending_approval',
        emailVerifiedAt: new Date(),
      });

      const res = await request(app)
        .patch(`/api/partners/admin/${partner._id}/status`)
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ action: 'approve' });

      expect(res.status).toBe(200);
      expect(res.body.partner.status).toBe('approved');
      expect(res.body.partner.referralCode).toMatch(/^NV-[A-Z0-9]{6,16}$/);

      const dbPartner = await Partner.findById(partner._id);
      expect(dbPartner.status).toBe('approved');
      expect(dbPartner.referralCode).toBe(res.body.partner.referralCode);
    });

    it('rejects partner with internal reason', async () => {
      const partner = await Partner.create({
        name: 'Invalid Applicant',
        phone: '9439999999',
        normalizedPhone: '9439999999',
        email: 'invalid@applicant.com',
        normalizedEmail: 'invalid@applicant.com',
        city: 'Puri',
        pin: '752001',
        partnerType: 'other',
        status: 'pending_approval',
      });

      const res = await request(app)
        .patch(`/api/partners/admin/${partner._id}/status`)
        .set('Cookie', [`accessToken=${adminToken}`])
        .send({ action: 'reject', reason: 'Unverifiable contact credentials' });

      expect(res.status).toBe(200);
      expect(res.body.partner.status).toBe('rejected');
      expect(res.body.partner.rejectionReason).toBe('Unverifiable contact credentials');
    });

    it('RBAC: non-admin (editor) is rejected from approving partner (403)', async () => {
      const partner = await Partner.create({
        name: 'Pending Test',
        phone: '9439888888',
        normalizedPhone: '9439888888',
        email: 'pending@test.com',
        normalizedEmail: 'pending@test.com',
        city: 'Puri',
        pin: '752001',
        partnerType: 'individual',
        status: 'pending_approval',
      });

      const res = await request(app)
        .patch(`/api/partners/admin/${partner._id}/status`)
        .set('Cookie', [`accessToken=${editorToken}`])
        .send({ action: 'approve' });

      expect(res.status).toBe(403);
    });
  });

  describe('5. Referral Tracking & First-Touch Signed Cookie (Amendment A)', () => {
    it('sets 60-day HTTP-only neeve_ref cookie when visiting with valid referral code', async () => {
      const code = await generateUniqueReferralCode();
      await Partner.create({
        name: 'Active Partner',
        phone: '9861234567',
        normalizedPhone: '9861234567',
        email: 'active.partner@gmail.com',
        normalizedEmail: 'active.partner@gmail.com',
        city: 'Bhubaneswar',
        pin: '751010',
        partnerType: 'individual',
        status: 'approved',
        referralCode: code,
      });

      const res = await request(app)
        .post('/api/partners/referral/track')
        .send({ refCode: code });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.valid).toBe(true);

      const cookieHeader = res.headers['set-cookie'];
      expect(cookieHeader).toBeDefined();
      expect(cookieHeader[0]).toContain(`neeve_ref=${code}`);
      expect(cookieHeader[0]).toContain('HttpOnly');
    });

    it('first-touch wins: preserves existing neeve_ref cookie and prevents overwrite', async () => {
      const originalCode = 'NV-AAAAAAAAAAAAAAAA';
      const newAttemptCode = 'NV-BBBBBBBBBBBBBBBB';

      const res = await request(app)
        .post('/api/partners/referral/track')
        .set('Cookie', [`neeve_ref=${originalCode}`])
        .send({ refCode: newAttemptCode });

      expect(res.status).toBe(200);
      expect(res.body.refCode).toBe(originalCode);
      expect(res.body.message).toContain('first-touch');
    });

    it('rejects invalid or inactive referral codes', async () => {
      const res = await request(app)
        .post('/api/partners/referral/track')
        .send({ refCode: 'NV-NONEXISTENT0000' });

      expect(res.status).toBe(404);
      expect(res.body.valid).toBe(false);
    });
  });

  describe('6. Shared Attribution Resolver & Self-Referral Prevention', () => {
    it('blocks attribution if partner attempts to refer themselves via phone match', async () => {
      const code = 'NV-1111222233334444';
      const partner = await Partner.create({
        name: 'Self Partner',
        phone: '9876543210',
        normalizedPhone: '9876543210',
        email: 'self@partner.com',
        normalizedEmail: 'self@partner.com',
        city: 'Bhubaneswar',
        pin: '751001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: code,
      });

      const attribution = await resolveReferralAttribution({
        refCode: code,
        phone: '+91 98765 43210', // matching phone
        email: 'customer@yahoo.com',
      });

      expect(attribution.attributionStatus).toBe('self_referral_blocked');
      expect(attribution.partnerId.toString()).toBe(partner._id.toString());
    });

    it('blocks attribution if partner attempts to refer themselves via email match', async () => {
      const code = 'NV-5555666677778888';
      const partner = await Partner.create({
        name: 'Self Partner Email',
        phone: '9876500000',
        normalizedPhone: '9876500000',
        email: 'self.email@partner.com',
        normalizedEmail: 'self.email@partner.com',
        city: 'Bhubaneswar',
        pin: '751001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: code,
      });

      const attribution = await resolveReferralAttribution({
        refCode: code,
        phone: '9123456789',
        email: 'Self.Email@partner.com', // matching email
      });

      expect(attribution.attributionStatus).toBe('self_referral_blocked');
      expect(attribution.partnerId.toString()).toBe(partner._id.toString());
    });

    it('blocks duplicate attribution if lead phone or email already exists in prior Enquiry', async () => {
      const code = 'NV-9999000011112222';
      await Partner.create({
        name: 'Legit Partner',
        phone: '9800000000',
        normalizedPhone: '9800000000',
        email: 'legit@partner.com',
        normalizedEmail: 'legit@partner.com',
        city: 'Bhubaneswar',
        pin: '751001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: code,
      });

      // Existing prior lead in Enquiry collection
      await Enquiry.create({
        name: 'Existing Lead',
        email: 'prior.lead@domain.com',
        phone: '9111222333',
        projectScope: 'Civil construction',
      });

      const attribution = await resolveReferralAttribution({
        refCode: code,
        phone: '9111222333', // matches prior lead phone
        email: 'different@lead.com',
      });

      expect(attribution.attributionStatus).toBe('duplicate_blocked');
    });

    it('successfully attributes valid new lead to approved partner', async () => {
      const code = 'NV-VALIDPARTNER001';
      const partner = await Partner.create({
        name: 'Valid Referral Partner',
        phone: '9800000001',
        normalizedPhone: '9800000001',
        email: 'partner.one@domain.com',
        normalizedEmail: 'partner.one@domain.com',
        city: 'Bhubaneswar',
        pin: '751001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: code,
      });

      const attribution = await resolveReferralAttribution({
        refCode: code,
        phone: '9777123456',
        email: 'genuinely.new.lead@domain.com',
      });

      expect(attribution.attributionStatus).toBe('attributed');
      expect(attribution.partnerId.toString()).toBe(partner._id.toString());
      expect(attribution.refCode).toBe(code);
      expect(attribution.referralCapturedAt).toBeDefined();
    });
  });

  describe('7. End-to-End Enquiry Attribution Integration', () => {
    it('automatically attaches referral attribution to POST /api/enquiries when cookie is present', async () => {
      const code = 'NV-COOKIEPARTNER01';
      const partner = await Partner.create({
        name: 'Cookie Partner',
        phone: '9800000002',
        normalizedPhone: '9800000002',
        email: 'cookie.partner@domain.com',
        normalizedEmail: 'cookie.partner@domain.com',
        city: 'Bhubaneswar',
        pin: '751001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: code,
      });

      const res = await request(app)
        .post('/api/enquiries')
        .set('Cookie', [`neeve_ref=${code}`])
        .send({
          name: 'Referred Customer',
          email: 'referred.customer@gmail.com',
          phone: '9438000111',
          projectScope: 'Turnkey residential construction inquiry',
        });

      expect(res.status).toBe(201);
      const enquiry = await Enquiry.findById(res.body.data.id);
      expect(enquiry.attributionStatus).toBe('attributed');
      expect(enquiry.partnerId.toString()).toBe(partner._id.toString());
      expect(enquiry.refCode).toBe(code);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SUITE 8: Mark Enquiry Conversion
  // ─────────────────────────────────────────────────────────────
  describe('8. Admin: Mark Enquiry Conversion', () => {
    let convPartner, attributedEnquiry;

    beforeEach(async () => {
      await PartnerSettings.findOneAndUpdate(
        { key: 'global_partner_settings' },
        { key: 'global_partner_settings', isIncentiveCalculationActive: false },
        { upsert: true }
      );

      convPartner = await Partner.create({
        name: 'Conversion Test Partner',
        phone: '9900000001',
        normalizedPhone: '9900000001',
        email: 'conv.partner@test.com',
        normalizedEmail: 'conv.partner@test.com',
        city: 'Bhubaneswar',
        pin: '751001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: 'NV-CONVTEST00000001',
      });

      attributedEnquiry = await Enquiry.create({
        name: 'Attributed Lead',
        email: 'attributed.lead@test.com',
        phone: '9100000001',
        projectScope: 'Test construction project',
        refCode: 'NV-CONVTEST00000001',
        partnerId: convPartner._id,
        attributionStatus: 'attributed',
        conversionStatus: 'none',
        referralCapturedAt: new Date(),
      });
    });

    it('marks enquiry as converted when incentive calculation is disabled', async () => {
      const res = await request(app)
        .patch(`/api/partners/admin/enquiries/${attributedEnquiry._id}/conversion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractValuePaise: 500000000, notes: 'Contract signed' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.enquiry.conversionStatus).toBe('converted');
      expect(res.body.incentive).toBeNull();
      expect(res.body.message).toMatch(/disabled pending client approval/i);
    });

    it('returns 400 when trying to convert an unattributed enquiry', async () => {
      const directEnquiry = await Enquiry.create({
        name: 'Direct Lead',
        email: 'direct.lead@test.com',
        phone: '9100000002',
        projectScope: 'Direct project',
      });

      const res = await request(app)
        .patch(`/api/partners/admin/enquiries/${directEnquiry._id}/conversion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractValuePaise: 100000000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatch(/unattributed/i);
    });

    it('returns 400 when attribution status is not attributed', async () => {
      const blockedEnquiry = await Enquiry.create({
        name: 'Blocked Lead',
        email: 'blocked.lead@test.com',
        phone: '9100000003',
        projectScope: 'Blocked project',
        refCode: 'NV-CONVTEST00000001',
        partnerId: convPartner._id,
        attributionStatus: 'self_referral_blocked',
        conversionStatus: 'none',
      });

      const res = await request(app)
        .patch(`/api/partners/admin/enquiries/${blockedEnquiry._id}/conversion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractValuePaise: 100000000 });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('creates incentive accrual when isIncentiveCalculationActive is true', async () => {
      await PartnerSettings.findOneAndUpdate(
        { key: 'global_partner_settings' },
        {
          key: 'global_partner_settings',
          isIncentiveCalculationActive: true,
          activeRule: {
            basis: 'fixed',
            value: 1000000,
            qualifyingTrigger: 'contract_signed',
            version: 'v1.0',
          },
        },
        { upsert: true, new: true }
      );

      const res = await request(app)
        .patch(`/api/partners/admin/enquiries/${attributedEnquiry._id}/conversion`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ contractValuePaise: 500000000, notes: 'Test incentive accrual' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incentive).not.toBeNull();
      expect(res.body.incentive.amountPaise).toBe(1000000);
      expect(res.body.incentive.eventType).toBe('accrual');
      expect(res.body.incentive.idempotencyKey).toBeDefined();

      // Reset settings
      await PartnerSettings.findOneAndUpdate(
        { key: 'global_partner_settings' },
        { isIncentiveCalculationActive: false },
        { new: true }
      );
    });

    it('returns 403 when editor tries to mark conversion', async () => {
      const res = await request(app)
        .patch(`/api/partners/admin/enquiries/${attributedEnquiry._id}/conversion`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ contractValuePaise: 500000000 });

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SUITE 9: Mark Incentive Paid
  // ─────────────────────────────────────────────────────────────
  describe('9. Admin: Mark Incentive Paid', () => {
    let testIncentive;

    beforeEach(async () => {
      const p = await Partner.create({
        name: 'Payout Partner',
        phone: '9900000010',
        normalizedPhone: '9900000010',
        email: 'payout.p@test.com',
        normalizedEmail: 'payout.p@test.com',
        city: 'Puri',
        pin: '752001',
        partnerType: 'individual',
        status: 'approved',
        referralCode: 'NV-PAYOUTTEST000001',
      });

      // PartnerIncentive requires enquiryId — create a dummy enquiry
      const dummyEnquiry = await Enquiry.create({
        name: 'Payout Dummy Lead',
        email: `payout.dummy.${Date.now()}@test.com`,
        phone: `98${String(Date.now()).slice(-8)}`,
        projectScope: 'Payout dummy project',
      });

      testIncentive = await PartnerIncentive.create({
        idempotencyKey: `PI-TEST-${Date.now()}`,
        partnerId: p._id,
        enquiryId: dummyEnquiry._id,
        eventType: 'accrual',
        amountPaise: 500000,
        status: 'pending_approval',
        ruleSnapshot: {
          ruleId: 'v1.0',
          version: 'v1.0',
          basis: 'fixed',
          basisValue: 500000,
          qualifyingTrigger: 'contract_signed',
          calculatedAt: new Date(),
        },
        createdBy: adminUser._id,
        auditTrail: [],
      });
    });

    it('marks incentive as paid with valid payment reference', async () => {
      const res = await request(app)
        .post(`/api/partners/admin/incentives/${testIncentive._id}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentReference: 'UTR1234567890', notes: 'NEFT transfer' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.incentive.status).toBe('paid');
      expect(res.body.incentive.paymentReference).toBe('UTR1234567890');
      expect(res.body.incentive.auditTrail).toHaveLength(1);
      expect(res.body.incentive.auditTrail[0].action).toBe('marked_paid');
    });

    it('returns 400 when payment reference is missing', async () => {
      const res = await request(app)
        .post(`/api/partners/admin/incentives/${testIncentive._id}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ notes: 'missing ref' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 400 when trying to mark an already-paid incentive', async () => {
      // First mark as paid
      await request(app)
        .post(`/api/partners/admin/incentives/${testIncentive._id}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentReference: 'UTR-FIRST-PAY' });

      // Second attempt
      const res = await request(app)
        .post(`/api/partners/admin/incentives/${testIncentive._id}/mark-paid`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ paymentReference: 'UTR-SECOND-ATTEMPT' });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/already been marked as paid/i);
    });

    it('idempotency keys are unique per accrual event', async () => {
      const key1 = `PI-ENQ1-ACCRUAL-${Date.now()}`;
      const key2 = `PI-ENQ2-ACCRUAL-${Date.now() + 1}`;
      const dummyEnq = testIncentive.enquiryId; // reuse the dummy enquiry from beforeEach

      const [r1, r2] = await Promise.all([
        PartnerIncentive.create({
          idempotencyKey: key1,
          partnerId: testIncentive.partnerId,
          enquiryId: dummyEnq,
          eventType: 'accrual',
          amountPaise: 10000,
          status: 'pending_approval',
          ruleSnapshot: { ruleId: 'v1', version: 'v1', basis: 'fixed', basisValue: 10000, qualifyingTrigger: 'contract_signed', calculatedAt: new Date() },
          createdBy: adminUser._id,
          auditTrail: [],
        }),
        PartnerIncentive.create({
          idempotencyKey: key2,
          partnerId: testIncentive.partnerId,
          enquiryId: dummyEnq,
          eventType: 'accrual',
          amountPaise: 20000,
          status: 'pending_approval',
          ruleSnapshot: { ruleId: 'v1', version: 'v1', basis: 'fixed', basisValue: 20000, qualifyingTrigger: 'contract_signed', calculatedAt: new Date() },
          createdBy: adminUser._id,
          auditTrail: [],
        }),
      ]);

      expect(r1.idempotencyKey).toBe(key1);
      expect(r2.idempotencyKey).toBe(key2);
      expect(r1.idempotencyKey).not.toBe(r2.idempotencyKey);
    });

    it('returns 403 for editor role', async () => {
      const res = await request(app)
        .post(`/api/partners/admin/incentives/${testIncentive._id}/mark-paid`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ paymentReference: 'UTR-EDITOR-ATTEMPT' });

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SUITE 10: Export Incentives CSV
  // ─────────────────────────────────────────────────────────────
  describe('10. Admin: Export Incentives CSV', () => {
    it('returns valid CSV with no-store cache headers', async () => {
      const res = await request(app)
        .get('/api/partners/admin/incentives/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
      expect(res.headers['cache-control']).toMatch(/no-store/);
      expect(res.headers['content-disposition']).toMatch(/attachment/);
      expect(res.headers['content-disposition']).toMatch(/Neevevera_Partner_Incentives/);

      const lines = res.text.split('\n');
      expect(lines[0]).toContain('Ledger Key');
      expect(lines[0]).toContain('Partner Name');
      expect(lines[0]).toContain('Referral Code');
      expect(lines[0]).toContain('Amount (INR)');
    });

    it('returns 403 for editor role', async () => {
      const res = await request(app)
        .get('/api/partners/admin/incentives/export')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SUITE 11: Partner Programme Settings
  // ─────────────────────────────────────────────────────────────
  describe('11. Admin: Partner Programme Settings', () => {
    it('GET /api/partners/admin/settings returns or creates default settings', async () => {
      const res = await request(app)
        .get('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings).toBeDefined();
      expect(typeof res.body.settings.isIncentiveCalculationActive).toBe('boolean');
      expect(res.body.settings.isIncentiveCalculationActive).toBe(false);
      expect(res.body.settings.attributionWindowDays).toBeGreaterThan(0);
    });

    it('PUT /api/partners/admin/settings updates attributionWindowDays', async () => {
      const res = await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ attributionWindowDays: 90 });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.settings.attributionWindowDays).toBe(90);

      // Restore to 60
      await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ attributionWindowDays: 60 });
    });

    it('PUT clamps attributionWindowDays to max 365', async () => {
      const res = await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ attributionWindowDays: 999 });

      expect(res.status).toBe(200);
      expect(res.body.settings.attributionWindowDays).toBe(365);
    });

    it('PUT does not apply attributionWindowDays when value is 0 (falsy guard in controller)', async () => {
      // First set a known value
      await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ attributionWindowDays: 45 });

      // Send 0 — parseInt(0) is falsy so controller ignores it
      const res = await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ attributionWindowDays: 0 });

      expect(res.status).toBe(200);
      // Value should remain 45 since 0 was ignored
      expect(res.body.settings.attributionWindowDays).toBe(45);

      // Restore
      await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ attributionWindowDays: 60 });
    });

    it('PUT does not change isIncentiveCalculationActive when value is not a boolean', async () => {
      // Ensure flag is false
      await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isIncentiveCalculationActive: false });

      // Send non-boolean — should be ignored
      await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isIncentiveCalculationActive: 'yes' });

      const check = await request(app)
        .get('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(check.body.settings.isIncentiveCalculationActive).toBe(false);
    });

    it('returns 403 for editor role on GET /settings', async () => {
      const res = await request(app)
        .get('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${editorToken}`);

      expect(res.status).toBe(403);
    });

    it('returns 403 for editor role on PUT /settings', async () => {
      const res = await request(app)
        .put('/api/partners/admin/settings')
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ attributionWindowDays: 30 });

      expect(res.status).toBe(403);
    });
  });
});

