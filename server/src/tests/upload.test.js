import { describe, it, expect, vi, beforeAll, afterEach, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import MediaAsset from '../models/MediaAsset.js';
import User from '../models/User.js';

// ── Mock Cloudinary SDK (used for delete and signed URL operations) ──────────
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn((options, callback) => ({
        end: () => callback(null, {
          secure_url: 'https://fake.cloudinary.com/test.jpg',
          public_id: 'test123',
          bytes: 1024,
        }),
      })),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
    utils: {
      api_sign_request: vi.fn().mockReturnValue('fake-signature'),
    },
  },
}));

// ── Mock axios so uploadToCloudinary (which POSTs directly to Cloudinary) ────
// The middleware bypasses the SDK and uses axios for image uploads.
vi.mock('axios', () => ({
  default: {
    post: vi.fn().mockResolvedValue({
      data: {
        secure_url: 'https://fake.cloudinary.com/test.jpg',
        public_id: 'test123',
        bytes: 1024,
      },
    }),
  },
}));

import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer;

describe('Upload Pipeline Reliability', () => {
  let adminToken;
  let adminId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());

    const admin = await User.create({
      name: 'Test Admin',
      email: 'upload-test@admin.com',
      password: 'password123',
      role: 'admin',
    });
    adminId = admin._id;

    // Login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'upload-test@admin.com', password: 'password123' });
    
    // Extract access token from cookies
    const cookie = res.headers['set-cookie'].find(c => c.startsWith('accessToken='));
    adminToken = cookie.split(';')[0];
  });

  afterEach(async () => {
    await MediaAsset.deleteMany({});
    vi.clearAllMocks();
  });

  it('Upload succeeds -> MediaAsset created with usageCount: 0', async () => {
    // Create a 1px png buffer
    const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');

    const res = await request(app)
      .post('/api/upload/image')
      .set('Cookie', [adminToken])
      .field('context', 'projectImage')
      .attach('file', buf, 'test.png');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.url).toBe('https://fake.cloudinary.com/test.jpg');

    const asset = await MediaAsset.findOne({ publicId: 'test123' });
    expect(asset).toBeTruthy();
    expect(asset.usageCount).toBe(0);
    expect(asset.uploadedBy.toString()).toBe(adminId.toString());
  });

  it('Upload fails clean when Cloudinary rejects', async () => {
    // Override axios (used by uploadToCloudinary) to simulate Cloudinary 5xx on all retries
    const cloudinaryErr = Object.assign(new Error('Cloudinary 5xx error'), {
      response: { status: 500, data: { error: { message: 'Internal server error' } } },
    });
    axios.post
      .mockRejectedValueOnce(cloudinaryErr)
      .mockRejectedValueOnce(cloudinaryErr)
      .mockRejectedValueOnce(cloudinaryErr);

    const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    const res = await request(app)
      .post('/api/upload/image')
      .set('Cookie', [adminToken])
      .field('context', 'projectImage')
      .attach('file', buf, 'test.png');

    // After all 3 retries fail → 500 returned
    expect(res.status).toBeGreaterThanOrEqual(500);
    expect(res.body.error).toBeDefined();
  }, 30000);

  it('Missing file returns 400 clean', async () => {
    const res = await request(app)
      .post('/api/upload/image')
      .set('Cookie', [adminToken])
      .field('context', 'projectImage');
    
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/No file provided/i);
  });

  it('Oversized file returns 400 clean (based on context limit)', async () => {
    // Generate a 6MB buffer (projectImage limit is 5MB)
    const bigBuf = Buffer.alloc(6 * 1024 * 1024, 'a');
    
    const res = await request(app)
      .post('/api/upload/image')
      .set('Cookie', [adminToken])
      .field('context', 'projectImage')
      .attach('file', bigBuf, 'test.png');
      
    expect(res.status).toBe(400);
    // Error is: "File exceeds the 5 MB limit for projectImage."
    expect(res.body.error).toMatch(/exceeds.*5 MB limit/i);
  });

  it('Wrong file type (renamed extension spoofing) returns 400', async () => {
    // This is actually a text string, not an image
    const spoofBuf = Buffer.from('this is not a real image but has a png extension');
    
    const res = await request(app)
      .post('/api/upload/image')
      .set('Cookie', [adminToken])
      .field('context', 'projectImage')
      .attach('file', spoofBuf, 'spoof.png');
      
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid file type/i);
  });

  it('Corrupt image returns 400', async () => {
    // A garbage buffer that fails the file-type check (doesn't even hit sharp)
    const corruptBuf = Buffer.from('garbage data here to break everything');
    
    const res = await request(app)
      .post('/api/upload/image')
      .set('Cookie', [adminToken])
      .field('context', 'projectImage')
      .attach('file', corruptBuf, 'corrupt.png');
      
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/Invalid file type/i);
  });

  it('DELETE /api/upload/:publicId — rejects if usageCount > 0', async () => {
    const asset = await MediaAsset.create({
      url: 'https://fake.cloudinary.com/used.jpg',
      publicId: 'used123',
      context: 'projectImage',
      usageCount: 1, // In use!
    });
    
    const res = await request(app)
      .delete(`/api/upload/${asset.publicId}`)
      .set('Cookie', [adminToken]);
      
    expect(res.status).toBe(409); // Conflict
    expect(res.body.error).toMatch(/referenced by 1 content record/i);
    
    // Ensure cloud destroy was NOT called
    expect(cloudinary.uploader.destroy).not.toHaveBeenCalled();
  });

  it('DELETE /api/upload/:publicId — Cloudinary delete first, then DB delete', async () => {
    const asset = await MediaAsset.create({
      url: 'https://fake.cloudinary.com/free.jpg',
      publicId: 'free123',
      context: 'projectImage',
      usageCount: 0,
    });
    
    const res = await request(app)
      .delete(`/api/upload/${asset.publicId}`)
      .set('Cookie', [adminToken]);
      
    expect(res.status).toBe(200);
    expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('free123', expect.any(Object));
    
    // DB record should be gone
    const check = await MediaAsset.findById(asset._id);
    expect(check).toBeNull();
  });

  it('POST /api/upload/confirm-signed-upload — creates MediaAsset from direct upload', async () => {
    // publicId MUST start with 'neevevera/<context>/' to pass the integrity check
    const res = await request(app)
      .post('/api/upload/confirm-signed-upload')
      .set('Cookie', [adminToken])
      .send({
        url: 'https://cloudinary.com/neevevera/galleryMedia/direct123.mp4',
        publicId: 'neevevera/galleryMedia/direct123',
        context: 'galleryMedia',
        sizeBytes: 4000,
      });
      
    expect(res.status).toBe(201);
    expect(res.body.assetId).toBeDefined();
    
    const asset = await MediaAsset.findById(res.body.assetId);
    expect(asset.url).toBe('https://cloudinary.com/neevevera/galleryMedia/direct123.mp4');
    expect(asset.context).toBe('galleryMedia');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });
});
