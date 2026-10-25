import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import MediaAsset from '../models/MediaAsset.js';
import Career from '../models/Career.js';
import User from '../models/User.js';
import { evaluateSkills, normalizeText, matchesSkill } from '../utils/skillMatcher.js';

// Mock Cloudinary SDK
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn((options, callback) => ({
        end: () => callback(null, {
          secure_url: 'https://fake.cloudinary.com/test-doc.pdf',
          public_id: 'neevevera/supportingDoc/test-doc',
          bytes: 2048,
        }),
      })),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
    utils: {
      api_sign_request: vi.fn().mockReturnValue('fake-signature'),
    },
  },
}));

// Mock axios for uploadToCloudinary
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        secure_url: 'https://fake.cloudinary.com/test-doc.pdf',
        public_id: 'neevevera/supportingDoc/test-doc',
        bytes: 2048,
      },
    }),
    get: vi.fn().mockResolvedValue({
      data: Buffer.from('%PDF-1.4 mock pdf text containing AutoCAD and RCC Design and STAAD Pro'),
    }),
  },
}));

// Mock pdf-parse for PDF text extraction — the package exports a default async function,
// not a named class. The function receives a buffer and returns { text, numpages, ... }.
vi.mock('pdf-parse', () => ({
  default: vi.fn().mockResolvedValue({
    text: 'Extracted resume content: AutoCAD, RCC Design, STAAD Pro expert.',
    numpages: 2,
  }),
}));

let mongoServer;
let adminCookie;
let testJob;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Create test admin
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin-career@neevevera.com',
    password: 'password123',
    role: 'admin',
    isActive: true,
  });

  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin-career@neevevera.com', password: 'password123' });

  adminCookie = loginRes.headers['set-cookie'];

  // Create test job
  testJob = await Career.create({
    slug: 'senior-structural-engineer-test',
    title: 'Senior Structural Engineer',
    department: 'Civil Engineering',
    location: 'Bhubaneswar, Odisha',
    type: 'full-time',
    description: 'Lead structural engineering analysis and high-rise RCC design.',
    responsibilities: ['Conduct STAAD Pro structural analysis', 'Review BOQ and fabrication drawings'],
    requirements: ['B.Tech / M.Tech in Civil / Structural Engineering', '5+ years experience in RCC structures'],
    requiredSkills: ['AutoCAD', 'RCC Design', 'STAAD Pro'],
    preferredSkills: ['Primavera P6', 'BIM Modelling'],
    isActive: true,
  });
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Wave 0: Resume Asset Usage Count & Orphan Cleanup Safeguards', () => {
  it('increments usageCount on resume MediaAsset when career application is submitted', async () => {
    const resumeUrl = 'https://fake.cloudinary.com/candidate-resume-123.pdf';
    
    // 1. Candidate uploads resume -> MediaAsset created with usageCount: 0
    const asset = await MediaAsset.create({
      url: resumeUrl,
      publicId: 'neevevera/resume/candidate-resume-123',
      context: 'resume',
      originalName: 'Amit_Patel_CV.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 1048576,
      usageCount: 0,
    });
    expect(asset.usageCount).toBe(0);

    // 2. Candidate submits application
    const applyRes = await request(app)
      .post(`/api/careers/${testJob.slug}/apply`)
      .send({
        name: 'Er. Amit Patel',
        email: 'amit.patel@example.com',
        phone: '+91 9876543210',
        resumeUrl,
        coverLetter: 'Experienced in AutoCAD, RCC Design, and structural site leadership.',
      });

    expect(applyRes.status).toBe(201);
    expect(applyRes.body.success).toBe(true);

    // 3. MediaAsset usageCount MUST be incremented to 1
    const updatedAsset = await MediaAsset.findById(asset._id);
    expect(updatedAsset.usageCount).toBe(1);
  });

  it('orphan cleanup logic excludes claimed resumes and targets unclaimed expired uploads', async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000); // 50 hours old

    // Claimed resume (used by an application): usageCount: 1, created 50h ago
    const claimedAsset = await MediaAsset.create({
      url: 'https://fake.cloudinary.com/claimed-resume.pdf',
      publicId: 'neevevera/resume/claimed-resume',
      context: 'resume',
      originalName: 'Claimed_CV.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 500000,
      usageCount: 1,
      createdAt: fortyEightHoursAgo,
    });

    // Abandoned upload (uploaded but application was never submitted): usageCount: 0, created 50h ago
    const abandonedAsset = await MediaAsset.create({
      url: 'https://fake.cloudinary.com/abandoned-resume.pdf',
      publicId: 'neevevera/resume/abandoned-resume',
      context: 'resume',
      originalName: 'Abandoned_CV.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 500000,
      usageCount: 0,
      createdAt: fortyEightHoursAgo,
    });

    // Query mimicking orphanCleanup.js
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const orphans = await MediaAsset.find({
      usageCount: 0,
      createdAt: { $lt: cutoff },
    });

    const orphanIds = orphans.map(o => o._id.toString());
    // Claimed asset is SAFE
    expect(orphanIds).not.toContain(claimedAsset._id.toString());
    // Abandoned asset IS marked for cleanup
    expect(orphanIds).toContain(abandonedAsset._id.toString());
  });
});

describe('Feature G: Supporting Document Upload & Media Lifecycle', () => {
  it('claims supportingDoc asset and increments usageCount when application is submitted', async () => {
    const supportingDocUrl = 'https://fake.cloudinary.com/portfolio-calc-sheets.pdf';

    const docAsset = await MediaAsset.create({
      url: supportingDocUrl,
      publicId: 'neevevera/supportingDoc/portfolio-calc-sheets',
      context: 'supportingDoc',
      originalName: 'Bridge_Design_Calculations.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 4000000,
      usageCount: 0,
    });
    expect(docAsset.usageCount).toBe(0);

    const applyRes = await request(app)
      .post(`/api/careers/${testJob.slug}/apply`)
      .send({
        name: 'Er. Sunita Rao',
        email: 'sunita.rao@example.com',
        phone: '+91 9876543211',
        resumeUrl: 'https://fake.cloudinary.com/sunita-resume.pdf',
        supportingDocUrl,
        coverLetter: 'Specialist in PEB design, STAAD Pro, and structural calculation sheets.',
      });

    expect(applyRes.status).toBe(201);

    const updatedDocAsset = await MediaAsset.findById(docAsset._id);
    expect(updatedDocAsset.usageCount).toBe(1);
  });

  it('admin can retrieve all applications and view supportingDocUrl', async () => {
    const res = await request(app)
      .get('/api/careers/applications/all')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);

    const sunitaApp = res.body.data.find(a => a.email === 'sunita.rao@example.com');
    expect(sunitaApp).toBeDefined();
    expect(sunitaApp.supportingDocUrl).toBe('https://fake.cloudinary.com/portfolio-calc-sheets.pdf');
  });
});

describe('Feature F: Keyword Matching Engine & 70/30 Formula', () => {
  it('correctly matches skills with word boundary and punctuation normalization', () => {
    const text = 'Expertise in STAAD.Pro analysis, AutoCAD 2024 drafting, and RCC-Design for multi-story towers.';
    const norm = normalizeText(text);

    expect(matchesSkill(norm, 'AutoCAD')).toBe(true);
    expect(matchesSkill(norm, 'RCC Design')).toBe(true);
    expect(matchesSkill(norm, 'STAAD Pro')).toBe(true);
    expect(matchesSkill(norm, 'Primavera P6')).toBe(false);
  });

  it('calculates score using exact formula: 0.70 * (Required Match) + 0.30 * (Preferred Match)', () => {
    // Required: ['AutoCAD', 'RCC Design', 'STAAD Pro'] (3 total)
    // Preferred: ['Primavera P6', 'BIM Modelling'] (2 total)
    // Candidate text matches 3 of 3 required (100%) and 1 of 2 preferred (50%)
    // Required Ratio = 1.0 -> 0.70 * 1.0 = 0.70
    // Preferred Ratio = 0.5 -> 0.30 * 0.5 = 0.15
    // Overall Ratio = 0.85 -> 85%
    const candidateText = 'Extensive experience in AutoCAD, RCC Design, STAAD Pro, and Primavera P6 project scheduling.';
    const requiredSkills = ['AutoCAD', 'RCC Design', 'STAAD Pro'];
    const preferredSkills = ['Primavera P6', 'BIM Modelling'];

    const result = evaluateSkills(candidateText, requiredSkills, preferredSkills);

    expect(result.requiredScore).toBe(100);
    expect(result.preferredScore).toBe(50);
    expect(result.overallScore).toBe(85);
    expect(result.matchedRequired).toEqual(['AutoCAD', 'RCC Design', 'STAAD Pro']);
    expect(result.missingRequired).toEqual([]);
    expect(result.matchedPreferred).toEqual(['Primavera P6']);
    expect(result.missingPreferred).toEqual(['BIM Modelling']);
    expect(result.formula).toBe('Overall Score = 0.70 * (Required Match) + 0.30 * (Preferred Match)');
  });

  it('calculates correctly when candidate has partial required and no preferred skills', () => {
    // 1 of 2 required (50%) -> 0.70 * 0.50 = 0.35
    // 0 of 2 preferred (0%)  -> 0.30 * 0 = 0
    // Overall = 35%
    const candidateText = 'Knowledge of AutoCAD drafting only.';
    const result = evaluateSkills(candidateText, ['AutoCAD', 'RCC Design'], ['STAAD Pro', 'BIM']);

    expect(result.requiredScore).toBe(50);
    expect(result.preferredScore).toBe(0);
    expect(result.overallScore).toBe(35);
    expect(result.matchedRequired).toEqual(['AutoCAD']);
    expect(result.missingRequired).toEqual(['RCC Design']);
  });

  it('evaluates application via admin API POST /api/careers/evaluate-text', async () => {
    const res = await request(app)
      .post('/api/careers/evaluate-text')
      .set('Cookie', adminCookie)
      .send({
        text: 'Civil Engineer with AutoCAD and RCC Design experience.',
        requiredSkills: ['AutoCAD', 'RCC Design', 'STAAD Pro'],
        preferredSkills: ['Primavera P6'],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // 2/3 required = 66.67% -> 0.70 * (2/3) = 46.67%
    // 0/1 preferred = 0% -> 0.30 * 0 = 0%
    // Overall = 47%
    expect(res.body.data.overallScore).toBe(47);
    expect(res.body.data.matchedRequired).toEqual(['AutoCAD', 'RCC Design']);
    expect(res.body.data.missingRequired).toEqual(['STAAD Pro']);
  });
});
