import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import MediaAsset from '../models/MediaAsset.js';
import User from '../models/User.js';

// Real Controllers
import { createService, updateService, deleteService } from '../controllers/service.controller.js';
import { createProject, updateProject, deleteProject } from '../controllers/project.controller.js';
import { createBlog, updateBlog, deleteBlog } from '../controllers/blog.controller.js';
import { createTeamMember, updateTeamMember } from '../controllers/team.controller.js';
import { createTestimonial, updateTestimonial, deleteTestimonial } from '../controllers/testimonial.controller.js';
import { createGalleryItem, updateGalleryItem, deleteGalleryItem } from '../controllers/gallery.controller.js';
import { updateHomeContent } from '../controllers/homeContent.controller.js';
import { updateCompanyInfo } from '../controllers/company.controller.js';

import { decrementMediaUsage } from '../utils/mediaHelper.js';

let mongod;
let testUser;

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    },
  };
  return res;
}

async function seedAsset(url) {
  return MediaAsset.create({
    url,
    publicId: url,
    context: 'serviceImage',
    usageCount: 0,
    uploadedBy: testUser._id,
  });
}

async function getUsage(url) {
  const asset = await MediaAsset.findOne({ url });
  return asset ? asset.usageCount : null;
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  testUser = await User.create({
    name: 'Admin Tester',
    email: 'admin.tester@example.com',
    password: 'AdminPassword123!',
    role: 'superadmin',
  });
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    if (key !== 'users') {
      await collections[key].deleteMany({});
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Real Controller Invocation Tests — asserts on real MediaAsset rows', () => {

  it('1. Service controller: creates with image and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/service1.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        title: 'Building Construction',
        slug: 'building-construction',
        category: 'construction',
        description: 'Comprehensive construction services',
        image: url,
      },
      user: testUser,
    };
    const res = mockRes();

    await createService(req, res);
    expect(res.statusCode).toBe(201);
    expect(await getUsage(url)).toBe(1);
  });

  it('2. Project controller: creates with coverImage and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/project1.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        name: 'Skyline Heights',
        slug: 'skyline-heights',
        category: 'residential',
        region: 'odisha',
        location: 'Bhubaneswar',
        description: 'Luxury high-rise residential complex',
        coverImage: url,
      },
      user: testUser,
    };
    const res = mockRes();

    await createProject(req, res);
    expect(res.statusCode).toBe(201);
    expect(await getUsage(url)).toBe(1);
  });

  it('3. Blog controller: creates with coverImage and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/blog1.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        title: 'Future of Sustainable Construction',
        slug: 'future-of-sustainable-construction',
        content: 'Article content about green building technologies...',
        coverImage: url,
      },
      user: testUser,
    };
    const res = mockRes();

    await createBlog(req, res);
    expect(res.statusCode).toBe(201);
    expect(await getUsage(url)).toBe(1);
  });

  it('4. TeamMember controller: creates with photo and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/team-rajesh.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        name: 'Rajesh Kumar',
        designation: 'Senior Project Manager',
        role: 'project-manager',
        photo: url, // REAL model field name
      },
      user: testUser,
    };
    const res = mockRes();

    await createTeamMember(req, res);
    expect(res.statusCode).toBe(201);
    expect(await getUsage(url)).toBe(1);
  });

  it('5. Testimonial controller: creates with photo and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/client-anita.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        clientName: 'Anita Sharma',
        review: 'Exceptional craftsmanship and punctual delivery.',
        photo: url, // REAL model field name
      },
      user: testUser,
    };
    const res = mockRes();

    await createTestimonial(req, res);
    expect(res.statusCode).toBe(201);
    expect(await getUsage(url)).toBe(1);
  });

  it('6. GalleryItem controller: creates with imageUrl and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/gallery-site.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        title: 'Site excavation progress',
        imageUrl: url,
      },
      user: testUser,
    };
    const res = mockRes();

    await createGalleryItem(req, res);
    expect(res.statusCode).toBe(201);
    expect(await getUsage(url)).toBe(1);
  });

  it('7. HomeContent controller: updates with heroImage and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/home-hero.jpg';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        heroTitle: 'Transforming Visions into Landmarks',
        heroImage: url,
      },
      user: testUser,
    };
    const res = mockRes();

    await updateHomeContent(req, res);
    expect(res.statusCode).toBe(200);
    expect(await getUsage(url)).toBe(1);
  });

  it('8. CompanyInfo controller: updates with logoLight and increments usageCount to 1', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/logo-light.png';
    await seedAsset(url);
    expect(await getUsage(url)).toBe(0);

    const req = {
      body: {
        name: 'Neevevera Pvt. Ltd.',
        logoLight: url,
      },
      user: testUser,
    };
    const res = mockRes();

    await updateCompanyInfo(req, res);
    expect(res.statusCode).toBe(200);
    expect(await getUsage(url)).toBe(1);
  });

  it('9. Decrement clamping: atomic conditional update never drops below 0', async () => {
    const url = 'https://res.cloudinary.com/demo/image/upload/v1/photo-clamp.jpg';
    await seedAsset(url); // usageCount starts at 0

    const memberReq = {
      body: {
        name: 'Suresh Patel',
        designation: 'Architect',
        role: 'architect',
        photo: url,
      },
      user: testUser,
    };
    const createRes = mockRes();
    await createTeamMember(memberReq, createRes);
    const member = createRes.data.data;
    expect(await getUsage(url)).toBe(1);

    // Update with a new photo
    const newUrl = 'https://res.cloudinary.com/demo/image/upload/v1/photo-new.jpg';
    await seedAsset(newUrl);

    const updateReq = {
      params: { id: member._id.toString() },
      body: { photo: newUrl },
      user: testUser,
    };
    const updateRes = mockRes();
    await updateTeamMember(updateReq, updateRes);

    expect(await getUsage(url)).toBe(0);
    expect(await getUsage(newUrl)).toBe(1);

    // Decrement again directly on old url — must remain clamped at 0
    await decrementMediaUsage(url);
    expect(await getUsage(url)).toBe(0);
  });

});
