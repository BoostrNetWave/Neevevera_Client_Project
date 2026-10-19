/**
 * phase2.test.js — Neevevera Phase 2 Backend Test Suite
 *
 * Architecture note:
 *   - Global afterEach clears ALL collections between tests.
 *   - Therefore every test that needs a user must create that user INSIDE the test
 *     (or in a beforeEach), not in a beforeAll — beforeAll users get wiped by afterEach.
 *   - Each test is fully self-contained: create user → login → run assertions.
 *
 * Covers:
 *   1. Protected CMS routes — auth gate (401 without token)
 *   2. Role enforcement — editor/admin/superadmin boundaries
 *   3. Project CRUD — create, read, update, concurrent-edit conflict, soft-delete
 *   4. Blog CRUD — draft vs published soft/hard delete policy
 *   5. Team / Service / Testimonial / Podcast CRUD smoke
 *   6. User management routes (superadmin only)
 *   7. Media asset listing routes
 *   8. Auth — /me, /refresh flow
 *   9. Concurrent-edit 409 conflict detection
 *  10. Slug reuse after soft-delete
 */

import { describe, test, expect, beforeAll, afterAll, afterEach } from 'vitest';
import request  from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app         from '../app.js';
import User        from '../models/User.js';
import Project     from '../models/Project.js';
import Blog        from '../models/Blog.js';
import Service     from '../models/Service.js';
import TeamMember  from '../models/TeamMember.js';
import Testimonial from '../models/Testimonial.js';
import Podcast     from '../models/Podcast.js';
import MediaAsset  from '../models/MediaAsset.js';
import CompanyInfo from '../models/CompanyInfo.js';
import Career      from '../models/Career.js';

// ── Test DB lifecycle ──────────────────────────────────────────
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

// ── Helpers ─────────────────────────────────────────────────────

/** Create a user and return their accessToken cookie string */
async function setup(role = 'admin') {
  const email = `${role}-${Date.now()}@test.com`;
  const password = 'pass1234';
  const user = await User.create({ name: `${role} User`, email, password, role });
  const loginRes = await request(app).post('/api/auth/login').send({ email, password });
  expect(loginRes.status, `Login failed for ${role}`).toBe(200);
  const cookie = loginRes.headers['set-cookie'].find(c => c.startsWith('accessToken=')).split(';')[0];
  return { user, cookie, email, password };
}

const projectPayload = (overrides = {}) => ({
  slug: `proj-${Date.now()}`,
  name: 'Solar Park Odisha',
  category: 'industrial',
  location: 'Cuttack',
  region: 'odisha',
  description: 'A large-scale solar installation.',
  ...overrides,
});

// ── 1. AUTH GATE ───────────────────────────────────────────────
describe('Auth gate — unauthenticated requests', () => {
  test('POST /api/projects returns 401 without cookie', async () => {
    const res = await request(app).post('/api/projects').send({ name: 'Test' });
    expect(res.status).toBe(401);
  });

  test('POST /api/services returns 401 without cookie', async () => {
    const res = await request(app).post('/api/services').send({});
    expect(res.status).toBe(401);
  });

  test('POST /api/blog returns 401 without cookie', async () => {
    const res = await request(app).post('/api/blog').send({});
    expect(res.status).toBe(401);
  });

  test('GET /api/users returns 401 without cookie', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  test('GET /api/media returns 401 without cookie', async () => {
    const res = await request(app).get('/api/media');
    expect(res.status).toBe(401);
  });
});

// ── 2. ROLE ENFORCEMENT ────────────────────────────────────────
describe('Role enforcement', () => {
  test('editor CANNOT access /api/users (superadmin only)', async () => {
    const { cookie } = await setup('editor');
    const res = await request(app).get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });

  test('admin CANNOT access /api/users (superadmin only)', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });

  test('superadmin CAN access /api/users', async () => {
    const { cookie } = await setup('superadmin');
    const res = await request(app).get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
  });

  test('editor CAN create a project (write roles include editor)', async () => {
    const { cookie } = await setup('editor');
    const res = await request(app).post('/api/projects').set('Cookie', [cookie]).send(projectPayload());
    expect(res.status).toBe(201);
  });

  test('editor CANNOT delete a project (admin/superadmin only)', async () => {
    const { cookie } = await setup('editor');
    const proj = await Project.create({
      ...projectPayload(), isDeleted: false,
    });
    const res = await request(app).delete(`/api/projects/${proj._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });

  test('editor CAN access /api/media (editor+)', async () => {
    const { cookie } = await setup('editor');
    const res = await request(app).get('/api/media').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
  });
});

// ── 3. PROJECT CRUD ────────────────────────────────────────────
describe('Project CRUD', () => {
  test('GET /api/projects — empty list returns 200 with items:[]', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(200);
    expect(res.body.items).toHaveLength(0);
  });

  test('POST /api/projects — creates with createdBy set', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).post('/api/projects').set('Cookie', [cookie]).send(projectPayload());
    expect(res.status).toBe(201);
    expect(res.body.data.createdBy).toBeDefined();
  });

  test('GET /api/projects/:slug — returns single non-deleted project', async () => {
    const payload = projectPayload({ slug: 'slug-single' });
    await Project.create({ ...payload, isDeleted: false });
    const res = await request(app).get(`/api/projects/${payload.slug}`);
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe(payload.name);
  });

  test('GET /api/projects/:slug — 404 for non-existent', async () => {
    const res = await request(app).get('/api/projects/no-such-slug');
    expect(res.status).toBe(404);
  });

  test('PUT /api/projects/:id — updates the project', async () => {
    const { cookie } = await setup('admin');
    const proj = await Project.create({ ...projectPayload(), isDeleted: false });
    const res = await request(app)
      .put(`/api/projects/${proj._id}`)
      .set('Cookie', [cookie])
      .send({ name: 'Updated Name', lastKnownUpdatedAt: proj.updatedAt });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated Name');
  });

  test('DELETE /api/projects/:id — soft-deletes (isDeleted: true)', async () => {
    const { cookie } = await setup('admin');
    const proj = await Project.create({ ...projectPayload(), isDeleted: false });
    const res = await request(app).delete(`/api/projects/${proj._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    const updated = await Project.findById(proj._id);
    expect(updated.isDeleted).toBe(true);
  });

  test('Soft-deleted project does NOT appear in public list', async () => {
    await Project.create({ ...projectPayload(), isDeleted: true });
    const res = await request(app).get('/api/projects');
    expect(res.body.items).toHaveLength(0);
  });

  test('POST /api/projects — invalid category returns 400', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).post('/api/projects').set('Cookie', [cookie])
      .send(projectPayload({ category: 'not-a-real-category' }));
    expect(res.status).toBe(400);
  });
});

// ── 4. CONCURRENT-EDIT CONFLICT (409) ─────────────────────────
describe('Concurrent-edit conflict (409)', () => {
  test('PUT with stale lastKnownUpdatedAt returns 409', async () => {
    const { cookie } = await setup('admin');
    const proj = await Project.create({ ...projectPayload(), isDeleted: false });
    const staleDate = new Date(proj.updatedAt.getTime() - 5000);

    const res = await request(app)
      .put(`/api/projects/${proj._id}`)
      .set('Cookie', [cookie])
      .send({ name: 'Should Conflict', lastKnownUpdatedAt: staleDate });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/modified/i);
  });

  test('PUT without lastKnownUpdatedAt proceeds without conflict check', async () => {
    const { cookie } = await setup('admin');
    const proj = await Project.create({ ...projectPayload(), isDeleted: false });
    const res = await request(app)
      .put(`/api/projects/${proj._id}`)
      .set('Cookie', [cookie])
      .send({ name: 'Updated No Conflict Check' });
    expect(res.status).toBe(200);
  });
});

// ── 5. SLUG REUSE AFTER SOFT-DELETE ───────────────────────────
describe('Slug reuse after soft-delete', () => {
  test('Creating a project with the slug of a soft-deleted record succeeds', async () => {
    const { cookie } = await setup('admin');
    const SLUG = `reuse-${Date.now()}`;

    // Create & soft-delete
    const proj = await Project.create({ ...projectPayload({ slug: SLUG }), isDeleted: false });
    await Project.findByIdAndUpdate(proj._id, { isDeleted: true });

    // Create again with same slug — should succeed
    const res = await request(app).post('/api/projects').set('Cookie', [cookie]).send(projectPayload({ slug: SLUG }));
    expect(res.status).toBe(201);
  });
});

// ── 6. BLOG CRUD ──────────────────────────────────────────────
describe('Blog CRUD', () => {
  const blogBase = (overrides = {}) => ({
    slug: `blog-${Date.now()}`,
    title: 'Test Blog Post',
    content: 'Lorem ipsum dolor sit amet.',
    isPublished: false,
    ...overrides,
  });

  test('POST /api/blog — creates draft (201)', async () => {
    const { cookie } = await setup('editor');
    const res = await request(app).post('/api/blog').set('Cookie', [cookie]).send(blogBase());
    expect(res.status).toBe(201);
    expect(res.body.data.isPublished).toBe(false);
  });

  test('GET /api/blog — draft not visible publicly', async () => {
    await Blog.create({ ...blogBase(), isDeleted: false });
    const res = await request(app).get('/api/blog');
    expect(res.body.items).toHaveLength(0);
  });

  test('GET /api/blog/admin — draft visible to authenticated admin', async () => {
    const { cookie } = await setup('editor');
    await Blog.create({ ...blogBase(), isDeleted: false });
    const res = await request(app).get('/api/blog/admin').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  test('Published blog — GET /api/blog/:slug returns 200', async () => {
    const slug = `pub-${Date.now()}`;
    await Blog.create({ ...blogBase({ slug }), isPublished: true, publishedAt: new Date(), isDeleted: false });
    const res = await request(app).get(`/api/blog/${slug}`);
    expect(res.status).toBe(200);
  });

  test('DELETE published blog — soft-deletes (isDeleted: true)', async () => {
    const { cookie } = await setup('admin');
    const blog = await Blog.create({ ...blogBase(), isPublished: true, isDeleted: false });
    const res = await request(app).delete(`/api/blog/${blog._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    const updated = await Blog.findById(blog._id);
    expect(updated.isDeleted).toBe(true);
  });

  test('DELETE draft blog — hard-deletes (record gone)', async () => {
    const { cookie } = await setup('admin');
    const blog = await Blog.create({ ...blogBase(), isPublished: false, isDeleted: false });
    const res = await request(app).delete(`/api/blog/${blog._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    const gone = await Blog.findById(blog._id);
    expect(gone).toBeNull();
  });
});

// ── 7. CMS ENTITY SMOKE TESTS ─────────────────────────────────
describe('CMS entity smoke tests (Team, Service, Testimonial, Podcast)', () => {
  test('POST /api/team — creates team member with required fields', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).post('/api/team').set('Cookie', [cookie]).send({
      name:        'Ravi Shankar',
      designation: 'Senior Civil Engineer',
      role:        'civil-engineer',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Ravi Shankar');
  });

  test('POST /api/services — creates service with required fields', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).post('/api/services').set('Cookie', [cookie]).send({
      slug:        `svc-${Date.now()}`,
      title:       'Civil Construction',
      category:    'construction',
      description: 'Full-scale civil construction services.',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('Civil Construction');
  });

  test('POST /api/testimonials — creates testimonial', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).post('/api/testimonials').set('Cookie', [cookie]).send({
      clientName: 'Ramesh Kumar',
      review:     'Excellent work by the team.',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.clientName).toBe('Ramesh Kumar');
  });

  test('POST /api/podcast — creates podcast episode', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app).post('/api/podcast').set('Cookie', [cookie]).send({
      slug:          `ep-${Date.now()}`,
      episodeNumber: '1',
      title:         'Civil Engineering Today',
      description:   'Discussing trends in civil construction.',
    });
    expect(res.status).toBe(201);
  });

  test('GET /api/services — returns only active services publicly', async () => {
    await Service.create({ slug: 'active-svc', title: 'Active', category: 'construction', description: 'Active', isActive: true });
    await Service.create({ slug: 'inactive-svc', title: 'Inactive', category: 'building-repair-maintenance', description: 'Inactive', isActive: false });
    const res = await request(app).get('/api/services');
    expect(res.status).toBe(200);
    expect(res.body.items.every(s => s.isActive === true)).toBe(true);
    expect(res.body.items.length).toBe(1);
  });
});

// ── 8. USER MANAGEMENT (/api/users) ───────────────────────────
describe('User management (/api/users)', () => {
  test('GET /api/users — superadmin lists users, no passwords returned', async () => {
    const { cookie } = await setup('superadmin');
    const res = await request(app).get('/api/users').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].password).toBeUndefined();
  });

  test('POST /api/users — superadmin creates editor', async () => {
    const { cookie } = await setup('superadmin');
    const res = await request(app).post('/api/users').set('Cookie', [cookie]).send({
      name: 'New Editor', email: `neweditor-${Date.now()}@test.com`, password: 'pass1234', role: 'editor',
    });
    expect(res.status).toBe(201);
    expect(res.body.data.role).toBe('editor');
    expect(res.body.data.password).toBeUndefined();
  });

  test('POST /api/users — cannot create superadmin via API (400)', async () => {
    const { cookie } = await setup('superadmin');
    const res = await request(app).post('/api/users').set('Cookie', [cookie]).send({
      name: 'Bad SA', email: `badsa-${Date.now()}@test.com`, password: 'pass1234', role: 'superadmin',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/users — duplicate email returns 409', async () => {
    const { cookie } = await setup('superadmin');
    const email = `dup-${Date.now()}@test.com`;
    await User.create({ name: 'Dup', email, password: 'pass1234', role: 'editor' });
    const res = await request(app).post('/api/users').set('Cookie', [cookie]).send({
      name: 'Dup 2', email, password: 'pass1234', role: 'editor',
    });
    expect(res.status).toBe(409);
  });

  test('PATCH /api/users/:id — updates name and role', async () => {
    const { cookie } = await setup('superadmin');
    const target = await User.create({ name: 'Target', email: `target-${Date.now()}@test.com`, password: 'pass1234', role: 'editor' });
    const res = await request(app)
      .patch(`/api/users/${target._id}`)
      .set('Cookie', [cookie])
      .send({ name: 'Promoted', role: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.data.role).toBe('admin');
    expect(res.body.data.name).toBe('Promoted');
  });

  test('PATCH /api/users — cannot modify own account (403)', async () => {
    const { user, cookie } = await setup('superadmin');
    const res = await request(app)
      .patch(`/api/users/${user._id}`)
      .set('Cookie', [cookie])
      .send({ name: 'Self-Edit' });
    expect(res.status).toBe(403);
  });

  test('DELETE /api/users/:id — soft-deactivates user', async () => {
    const { cookie } = await setup('superadmin');
    const target = await User.create({ name: 'Tgt', email: `tgt-${Date.now()}@test.com`, password: 'pass1234', role: 'editor' });
    const res = await request(app).delete(`/api/users/${target._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    const updated = await User.findById(target._id);
    expect(updated.isActive).toBe(false);
  });

  test('DELETE /api/users — cannot deactivate own account (403)', async () => {
    const { user, cookie } = await setup('superadmin');
    const res = await request(app).delete(`/api/users/${user._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(403);
  });

  test('Deactivated user cannot log in (401)', async () => {
    const email = `inactive-${Date.now()}@test.com`;
    const user = await User.create({ name: 'Inactive', email, password: 'pass1234', role: 'editor' });
    await User.findByIdAndUpdate(user._id, { isActive: false });
    const res = await request(app).post('/api/auth/login').send({ email, password: 'pass1234' });
    expect(res.status).toBe(401);
  });
});

// ── 9. AUTH /me and /refresh ───────────────────────────────────
describe('Auth — /me and /refresh', () => {
  test('GET /api/auth/me — returns current user, no password field', async () => {
    const { cookie, email } = await setup('admin');
    const res = await request(app).get('/api/auth/me').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(email);
    expect(res.body.role).toBe('admin');
    expect(res.body.password).toBeUndefined();
  });

  test('POST /api/auth/refresh — issues new accessToken', async () => {
    const email    = `refresh-${Date.now()}@test.com`;
    const password = 'pass1234';
    await User.create({ name: 'Refresh User', email, password, role: 'editor' });

    const loginRes = await request(app).post('/api/auth/login').send({ email, password });
    expect(loginRes.status).toBe(200);

    const refreshCookie = loginRes.headers['set-cookie']
      .find(c => c.startsWith('refreshToken=')).split(';')[0];

    const res = await request(app).post('/api/auth/refresh').set('Cookie', [refreshCookie]);
    expect(res.status).toBe(200);
    expect(res.headers['set-cookie'].some(c => c.startsWith('accessToken='))).toBe(true);
  });
});

// ── 10. MEDIA ASSET LISTING (/api/media) ──────────────────────
describe('Media asset listing (/api/media)', () => {
  test('GET /api/media — returns paginated assets', async () => {
    const { cookie } = await setup('editor');
    await MediaAsset.create({ url: 'https://test.com/img.jpg', publicId: `media-${Date.now()}`, context: 'projectImage', mimeType: 'image/jpeg' });
    const res = await request(app).get('/api/media').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBe(1);
  });

  test('GET /api/media/orphans — returns old assets with usageCount 0', async () => {
    const { cookie } = await setup('editor');
    // Use the model's collection directly to bypass Mongoose timestamps protection
    // and insert a document with createdAt set to 50h ago
    await MediaAsset.collection.insertOne({
      url:        'https://test.com/orphan.jpg',
      publicId:   `orphan-${Date.now()}`,
      context:    'teamPhoto',
      usageCount: 0,
      isDeleted:  false,
      mimeType:   'image/jpeg',
      createdAt:  new Date(Date.now() - 50 * 60 * 60 * 1000),
      updatedAt:  new Date(Date.now() - 50 * 60 * 60 * 1000),
    });

    const res = await request(app).get('/api/media/orphans').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('GET /api/media/orphans — recent upload NOT listed', async () => {
    const { cookie } = await setup('editor');
    const pid = `recent-${Date.now()}`;
    await MediaAsset.create({ url: 'https://test.com/recent.jpg', publicId: pid, context: 'teamPhoto', usageCount: 0 });

    const res = await request(app).get('/api/media/orphans').set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    const ids = res.body.data.map(a => a.publicId);
    expect(ids).not.toContain(pid);
  });

  test('GET /api/media/:id — returns single asset', async () => {
    const { cookie } = await setup('editor');
    const asset = await MediaAsset.create({ url: 'https://t.com/a.jpg', publicId: `single-${Date.now()}`, context: 'serviceImage' });
    const res = await request(app).get(`/api/media/${asset._id}`).set('Cookie', [cookie]);
    expect(res.status).toBe(200);
    expect(res.body.data.publicId).toBe(asset.publicId);
  });
});

// ── 11. COMPANY INFO (/api/company) ───────────────────────────
describe('CompanyInfo — GET and PUT /api/company', () => {
  const companyPayload = (overrides = {}) => ({
    name:      'Neevevera Pvt. Ltd.',
    overview:  'A leading civil construction firm.',
    mission:   'Build for tomorrow.',
    vision:    'Sustainable infrastructure across India.',
    ...overrides,
  });

  test('GET /api/company — returns 404 when no record exists', async () => {
    const res = await request(app).get('/api/company');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/company — returns 200 with data after seeding', async () => {
    await CompanyInfo.create(companyPayload());
    const res = await request(app).get('/api/company');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Neevevera Pvt. Ltd.');
    expect(res.body.data.mission).toBeDefined();
    expect(res.body.data.vision).toBeDefined();
  });

  test('PUT /api/company — admin can update company info', async () => {
    const { cookie } = await setup('admin');
    await CompanyInfo.create(companyPayload());
    const res = await request(app)
      .put('/api/company')
      .set('Cookie', [cookie])
      .send({ tagline: 'Building a Better Tomorrow', foundedYear: 2010 });
    expect(res.status).toBe(200);
    expect(res.body.data.tagline).toBe('Building a Better Tomorrow');
    expect(res.body.data.foundedYear).toBe(2010);
  });

  test('PUT /api/company — upserts when no record exists (no prior seed required)', async () => {
    const { cookie } = await setup('admin');
    const res = await request(app)
      .put('/api/company')
      .set('Cookie', [cookie])
      .send(companyPayload({ tagline: 'Upserted' }));
    expect(res.status).toBe(200);
    expect(res.body.data.overview).toBe('A leading civil construction firm.');
    expect(res.body.data.tagline).toBe('Upserted');
  });

  test('PUT /api/company — editor CANNOT update (403)', async () => {
    const { cookie } = await setup('editor');
    const res = await request(app)
      .put('/api/company')
      .set('Cookie', [cookie])
      .send({ tagline: 'Editor attempt' });
    expect(res.status).toBe(403);
  });

  test('PUT /api/company — returns 400 when no valid fields sent', async () => {
    const { cookie } = await setup('admin');
    await CompanyInfo.create(companyPayload());
    const res = await request(app)
      .put('/api/company')
      .set('Cookie', [cookie])
      .send({ _singleton: 'hack', unknownField: 'ignored' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('PUT /api/company — unauthenticated returns 401', async () => {
    const res = await request(app).put('/api/company').send({ tagline: 'No auth' });
    expect(res.status).toBe(401);
  });
});

// ── 12. CAREER APPLICATION STATUS PATCH ───────────────────────
describe('Career application status — PATCH /api/careers/:slug/applications/:appId', () => {
  /** Create a job and submit one application; return { job, appId } */
  async function seedJobWithApplication() {
    const slug = `job-${Date.now()}`;
    const job = await Career.create({
      slug,
      title:       'Site Supervisor',
      location:    'Bhubaneswar',
      description: 'Oversee on-site operations.',
      isActive:    true,
    });
    job.applications.push({
      name: 'Priya Nair', email: 'priya@example.com',
      phone: '9876543210', resumeUrl: 'https://res.cloudinary.com/resume.pdf',
    });
    await job.save();
    const appId = job.applications[0]._id.toString();
    return { job, slug, appId };
  }

  test('admin can update application status to "reviewed" (200)', async () => {
    const { cookie } = await setup('admin');
    const { slug, appId } = await seedJobWithApplication();
    const res = await request(app)
      .patch(`/api/careers/${slug}/applications/${appId}`)
      .set('Cookie', [cookie])
      .send({ status: 'reviewed' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('reviewed');
  });

  test('admin can advance status through the full enum cycle', async () => {
    const { cookie } = await setup('admin');
    const { slug, appId } = await seedJobWithApplication();
    for (const status of ['reviewed', 'shortlisted', 'rejected']) {
      const res = await request(app)
        .patch(`/api/careers/${slug}/applications/${appId}`)
        .set('Cookie', [cookie])
        .send({ status });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(status);
    }
  });

  test('invalid status value returns 400 with enum message', async () => {
    const { cookie } = await setup('admin');
    const { slug, appId } = await seedJobWithApplication();
    const res = await request(app)
      .patch(`/api/careers/${slug}/applications/${appId}`)
      .set('Cookie', [cookie])
      .send({ status: 'hired' });   // not in enum
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/received|reviewed|shortlisted|rejected/);
  });

  test('non-existent job slug returns 404', async () => {
    const { cookie } = await setup('admin');
    const { appId } = await seedJobWithApplication();
    const res = await request(app)
      .patch(`/api/careers/no-such-job/applications/${appId}`)
      .set('Cookie', [cookie])
      .send({ status: 'reviewed' });
    expect(res.status).toBe(404);
  });

  test('non-existent appId returns 404', async () => {
    const { cookie } = await setup('admin');
    const { slug } = await seedJobWithApplication();
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .patch(`/api/careers/${slug}/applications/${fakeId}`)
      .set('Cookie', [cookie])
      .send({ status: 'reviewed' });
    expect(res.status).toBe(404);
  });

  test('editor CANNOT update application status (403)', async () => {
    const { cookie } = await setup('editor');
    const { slug, appId } = await seedJobWithApplication();
    const res = await request(app)
      .patch(`/api/careers/${slug}/applications/${appId}`)
      .set('Cookie', [cookie])
      .send({ status: 'reviewed' });
    expect(res.status).toBe(403);
  });

  test('unauthenticated request returns 401', async () => {
    const { slug, appId } = await seedJobWithApplication();
    const res = await request(app)
      .patch(`/api/careers/${slug}/applications/${appId}`)
      .send({ status: 'reviewed' });
    expect(res.status).toBe(401);
  });
});
