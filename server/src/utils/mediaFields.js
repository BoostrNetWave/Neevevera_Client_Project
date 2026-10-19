import { incrementMediaUsage, decrementMediaUsage } from './mediaHelper.js';

/**
 * MEDIA_FIELDS — Single source of truth for all media-bearing fields
 * across the CMS data models.
 *
 * Array notation "[]" indicates an array of items (e.g., strings or subdocuments).
 */
export const MEDIA_FIELDS = {
  Service:     ['image', 'gallery[]', 'sections[].services[].image'],
  Project:     ['coverImage', 'gallery[]'],
  Blog:        ['coverImage'],
  TeamMember:  ['photo'],
  Testimonial: ['photo'],
  GalleryItem: ['imageUrl'],
  HomeContent: ['heroImage'],
  CompanyInfo: ['logoLight', 'logoDark', 'certifications[].imageUrl', 'awards[].imageUrl'],
};

/**
 * Recursively extracts all media URLs/identifiers from a document based on the
 * field paths defined for its model.
 *
 * @param {string|string[]} modelOrFields - Model name from MEDIA_FIELDS or an array of field path strings
 * @param {object} doc - Mongoose document or plain object
 * @returns {Set<string>} - Set of unique media URLs/publicIds found in doc
 */
export function extractMediaUrls(modelOrFields, doc) {
  const urls = new Set();
  if (!doc) return urls;

  const raw = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const fields = Array.isArray(modelOrFields)
    ? modelOrFields
    : (MEDIA_FIELDS[modelOrFields] || []);

  function extractPath(current, segments) {
    if (current == null) return;
    if (segments.length === 0) {
      if (typeof current === 'string' && current.trim()) {
        urls.add(current.trim());
      }
      return;
    }

    const [head, ...tail] = segments;

    if (head.endsWith('[]')) {
      const prop = head.slice(0, -2);
      const arr = prop ? current[prop] : current;
      if (Array.isArray(arr)) {
        for (const item of arr) {
          extractPath(item, tail);
        }
      }
    } else {
      extractPath(current[head], tail);
    }
  }

  for (const fieldPath of fields) {
    const segments = fieldPath.split('.').filter(Boolean);
    extractPath(raw, segments);
  }

  return urls;
}

/**
 * Claim all media in a newly created document (+1 usageCount for each).
 */
export async function claimDocMedia(modelName, doc) {
  const urls = extractMediaUrls(modelName, doc);
  for (const url of urls) {
    await incrementMediaUsage(url);
  }
}

/**
 * Release all media in a deleted document (-1 usageCount for each, floor 0).
 */
export async function releaseDocMedia(modelName, doc) {
  const urls = extractMediaUrls(modelName, doc);
  for (const url of urls) {
    await decrementMediaUsage(url);
  }
}

/**
 * Diff media between before and after versions of a document:
 * Increments newly added URLs, decrements removed URLs.
 */
export async function syncDocMediaUsage(modelName, beforeDoc, afterDoc) {
  const before = extractMediaUrls(modelName, beforeDoc);
  const after = extractMediaUrls(modelName, afterDoc);

  for (const url of after) {
    if (!before.has(url)) {
      await incrementMediaUsage(url);
    }
  }

  for (const url of before) {
    if (!after.has(url)) {
      await decrementMediaUsage(url);
    }
  }
}
