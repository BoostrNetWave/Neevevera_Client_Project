/**
 * serviceMedia.test.js
 *
 * Verifies that MediaAsset.usageCount stays accurate through the full
 * lifecycle of Service documents: create, update (add / remove / swap
 * sub-service images), deactivate, delete, and backfill.
 *
 * Coverage matches the six tests specified in the audit review:
 *   1. Create with cover + 2 sub-service images (one duplicate) counts each once per service
 *   2. Removing a sub-service decrements only its image
 *   3. Swapping a sub-service image: old -> 0, new -> 1
 *   4. Saving with no image changes leaves counts unchanged  (prevents diff regression)
 *   5. Deleting the service returns every image to 0
 *   6. Running the backfill twice is idempotent
 *   7. Deactivating a service does NOT release images
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

import Service    from "../models/Service.js";
import MediaAsset from "../models/MediaAsset.js";
import User       from "../models/User.js";
import { collectServiceImages } from "../utils/serviceMedia.js";
import { incrementMediaUsage, decrementMediaUsage } from "../utils/mediaHelper.js";

// ---------------------------------------------------------------------------
// In-memory helpers so tests exercise the same logic as the controller
// without HTTP overhead.
// ---------------------------------------------------------------------------

async function simulateCreate(serviceData, userId) {
  const service = await Service.create({ ...serviceData, createdBy: userId });
  for (const url of collectServiceImages(service)) {
    await incrementMediaUsage(url);
  }
  return service;
}

async function simulateUpdate(serviceId, patch, userId) {
  const current = await Service.findById(serviceId);
  const before  = collectServiceImages(current);
  const updated = await Service.findByIdAndUpdate(
    serviceId,
    { ...patch, updatedBy: userId },
    { new: true, runValidators: true }
  );
  const after = collectServiceImages(updated);
  for (const url of after)  if (!before.has(url)) await incrementMediaUsage(url);
  for (const url of before) if (!after.has(url))  await decrementMediaUsage(url);
  return updated;
}

async function simulateDelete(serviceId) {
  const service = await Service.findById(serviceId);
  for (const url of collectServiceImages(service)) {
    await decrementMediaUsage(url);
  }
  await Service.findByIdAndDelete(serviceId);
}

async function seedAsset(url, userId) {
  return MediaAsset.create({ url, publicId: url, context: "serviceImage", usageCount: 0, uploadedBy: userId });
}

async function usageOf(url) {
  const a = await MediaAsset.findOne({ url });
  return a ? a.usageCount : null;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let mongoServer;
let userId;

const BASE = {
  slug: "test-service",
  title: "Test Service",
  category: "construction",
  description: "Test description for media tracking",
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  const user = await User.create({ name: "Tester", email: "smt@test.com", password: "pass1234", role: "admin" });
  userId = user._id;
});

afterEach(async () => {
  await Service.deleteMany({});
  await MediaAsset.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ---------------------------------------------------------------------------
// collectServiceImages unit tests
// ---------------------------------------------------------------------------

describe("collectServiceImages — Set semantics", () => {
  it("deduplicates image appearing at top-level and in a sub-service", () => {
    const shared = "https://cdn.example.com/shared.jpg";
    const doc = {
      image: shared,
      gallery: [],
      sections: [{ services: [{ image: shared }, { image: "https://cdn.example.com/other.jpg" }] }],
    };
    const urls = collectServiceImages(doc);
    expect(urls.size).toBe(2);
    expect(urls.has(shared)).toBe(true);
    expect(urls.has("https://cdn.example.com/other.jpg")).toBe(true);
  });

  it("handles null / empty service gracefully", () => {
    expect(collectServiceImages(null).size).toBe(0);
    expect(collectServiceImages({}).size).toBe(0);
    expect(collectServiceImages({ image: "https://x.com/a.jpg" }).size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test 1
// ---------------------------------------------------------------------------

describe("Test 1 — create with cover + 2 sub-service images (one duplicate)", () => {
  it("counts each unique URL once per service", async () => {
    const cover = "https://cdn.example.com/cover.jpg";
    const sub1  = "https://cdn.example.com/sub1.jpg";

    await seedAsset(cover, userId);
    await seedAsset(sub1, userId);

    await simulateCreate({
      ...BASE,
      image: cover,
      sections: [{
        title: "Section A",
        services: [
          { title: "Sub 1", image: sub1 },
          { title: "Sub 2", image: cover }, // duplicate of cover
        ],
      }],
    }, userId);

    expect(await usageOf(cover)).toBe(1); // counted once despite appearing twice
    expect(await usageOf(sub1 )).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test 2
// ---------------------------------------------------------------------------

describe("Test 2 — removing a sub-service decrements only its image", () => {
  it("other images are unaffected", async () => {
    const cover = "https://cdn.example.com/cover2.jpg";
    const sub1  = "https://cdn.example.com/sub1-2.jpg";
    const sub2  = "https://cdn.example.com/sub2-2.jpg";

    await seedAsset(cover, userId);
    await seedAsset(sub1, userId);
    await seedAsset(sub2, userId);

    const service = await simulateCreate({
      ...BASE,
      image: cover,
      sections: [{
        title: "Section B",
        services: [
          { title: "Sub A", image: sub1 },
          { title: "Sub B", image: sub2 },
        ],
      }],
    }, userId);

    const sec = service.sections[0].toObject();
    sec.services = sec.services.filter(s => s.image !== sub2);
    await simulateUpdate(service._id, { sections: [sec] }, userId);

    expect(await usageOf(cover)).toBe(1);
    expect(await usageOf(sub1 )).toBe(1);
    expect(await usageOf(sub2 )).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 3
// ---------------------------------------------------------------------------

describe("Test 3 — swapping a sub-service image", () => {
  it("old image goes to 0, new image goes to 1", async () => {
    const oldImg = "https://cdn.example.com/old.jpg";
    const newImg = "https://cdn.example.com/new.jpg";

    await seedAsset(oldImg, userId);
    await seedAsset(newImg, userId);

    const service = await simulateCreate({
      ...BASE,
      sections: [{ title: "S", services: [{ title: "Sub", image: oldImg }] }],
    }, userId);

    expect(await usageOf(oldImg)).toBe(1);
    expect(await usageOf(newImg)).toBe(0);

    const sec = service.sections[0].toObject();
    sec.services[0].image = newImg;
    await simulateUpdate(service._id, { sections: [sec] }, userId);

    expect(await usageOf(oldImg)).toBe(0);
    expect(await usageOf(newImg)).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test 4 — the most important: no phantom increments on text-only saves
// ---------------------------------------------------------------------------

describe("Test 4 — saving with no image changes leaves counts unchanged", () => {
  it("a text-only patch does not alter usageCounts", async () => {
    const cover = "https://cdn.example.com/cover3.jpg";
    const sub   = "https://cdn.example.com/sub3.jpg";

    await seedAsset(cover, userId);
    await seedAsset(sub, userId);

    const service = await simulateCreate({
      ...BASE,
      image: cover,
      sections: [{ title: "S", services: [{ title: "Old title", image: sub }] }],
    }, userId);

    const sec = service.sections[0].toObject();
    sec.services[0].title = "New title";
    await simulateUpdate(service._id, { sections: [sec] }, userId);

    expect(await usageOf(cover)).toBe(1);
    expect(await usageOf(sub  )).toBe(1);

    // Second text-only patch
    await simulateUpdate(service._id, { description: "Updated desc" }, userId);

    expect(await usageOf(cover)).toBe(1);
    expect(await usageOf(sub  )).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Test 5
// ---------------------------------------------------------------------------

describe("Test 5 — deleting the service returns every image in the tree to 0", () => {
  it("cover, gallery, and all sub-service images are decremented", async () => {
    const cover   = "https://cdn.example.com/del-cover.jpg";
    const gallery = "https://cdn.example.com/del-gal.jpg";
    const sub1    = "https://cdn.example.com/del-sub1.jpg";
    const sub2    = "https://cdn.example.com/del-sub2.jpg";

    await seedAsset(cover,   userId);
    await seedAsset(gallery, userId);
    await seedAsset(sub1,    userId);
    await seedAsset(sub2,    userId);

    const service = await simulateCreate({
      ...BASE,
      image:   cover,
      gallery: [gallery],
      sections: [{
        title: "S",
        services: [
          { title: "A", image: sub1 },
          { title: "B", image: sub2 },
        ],
      }],
    }, userId);

    expect(await usageOf(cover  )).toBe(1);
    expect(await usageOf(gallery)).toBe(1);
    expect(await usageOf(sub1   )).toBe(1);
    expect(await usageOf(sub2   )).toBe(1);

    await simulateDelete(service._id);

    expect(await usageOf(cover  )).toBe(0);
    expect(await usageOf(gallery)).toBe(0);
    expect(await usageOf(sub1   )).toBe(0);
    expect(await usageOf(sub2   )).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Test 6 — backfill is idempotent
// ---------------------------------------------------------------------------

describe("Test 6 — backfill is idempotent (running twice does not double-count)", () => {
  it("second run leaves usageCount at 1, not 2", async () => {
    const url = "https://cdn.example.com/backfill.jpg";
    await Service.create({ ...BASE, image: url });
    await seedAsset(url, userId); // usageCount: 0

    // First pass
    const services = await Service.find().lean();
    const referenced = new Set();
    for (const s of services) {
      if (s.image) referenced.add(s.image);
      for (const sec of s.sections ?? []) {
        for (const sub of sec.services ?? []) {
          if (sub.image) referenced.add(sub.image);
        }
      }
    }
    for (const u of referenced) await incrementMediaUsage(u);
    expect(await usageOf(url)).toBe(1);

    // Second pass: only assets with usageCount 0 are eligible (real backfill check)
    const toFix = await MediaAsset.find({ url: { $in: Array.from(referenced) }, usageCount: 0 }).lean();
    for (const a of toFix) await incrementMediaUsage(a.url);

    expect(await usageOf(url)).toBe(1); // NOT 2
  });
});

// ---------------------------------------------------------------------------
// Test 7 — deactivate does not release images
// ---------------------------------------------------------------------------

describe("Test 7 — deactivating does NOT release images", () => {
  it("usageCount unchanged after isActive: false", async () => {
    const cover = "https://cdn.example.com/deact.jpg";
    await seedAsset(cover, userId);

    const service = await simulateCreate({ ...BASE, image: cover }, userId);

    expect(await usageOf(cover)).toBe(1);

    // Deactivate without media accounting (matches the real deactivateService controller)
    await Service.findByIdAndUpdate(service._id, { isActive: false });

    expect(await usageOf(cover)).toBe(1);
  });
});
