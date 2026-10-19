import MediaAsset from '../models/MediaAsset.js';

/**
 * Increment usageCount for a MediaAsset identified by its URL or Cloudinary publicId.
 * No-ops silently if the asset doesn't exist.
 */
export async function incrementMediaUsage(urlOrPublicId) {
  if (!urlOrPublicId) return;

  // Local static paths (e.g. /images/logo.png) never have a MediaAsset record — skip silently.
  if (urlOrPublicId.startsWith('/')) return;

  const query = urlOrPublicId.startsWith('http')
    ? { url: urlOrPublicId, isDeleted: false }
    : { publicId: urlOrPublicId, isDeleted: false };

  try {
    const result = await MediaAsset.findOneAndUpdate(
      query,
      { $inc: { usageCount: 1 } },
      { returnDocument: 'after' }
    );
    if (!result) {
      console.warn(`[mediaHelper] increment: no MediaAsset found for "${urlOrPublicId}" — possible pasted/external URL`);
    }
    return result;
  } catch (err) {
    console.error(`[mediaHelper] incrementMediaUsage failed for ${urlOrPublicId}:`, err.message);
  }
}

/**
 * Decrement usageCount for a MediaAsset in a single atomic update clamped at 0.
 * Uses conditional filter { usageCount: { $gt: 0 } } so it never matches at 0, preventing negative counts.
 */
export async function decrementMediaUsage(urlOrPublicId) {
  if (!urlOrPublicId) return;

  // Local static paths never have a MediaAsset record — skip silently.
  if (urlOrPublicId.startsWith('/')) return;

  const baseQuery = urlOrPublicId.startsWith('http')
    ? { url: urlOrPublicId }
    : { publicId: urlOrPublicId };

  try {
    const result = await MediaAsset.findOneAndUpdate(
      { ...baseQuery, usageCount: { $gt: 0 } },
      { $inc: { usageCount: -1 } },
      { returnDocument: 'after' }
    );
    if (!result) {
      const existing = await MediaAsset.findOne(baseQuery);
      if (!existing) {
        console.warn(`[mediaHelper] decrement: no MediaAsset found for "${urlOrPublicId}" — possible pasted/external URL`);
      } else {
        console.warn(`[mediaHelper] decrement: MediaAsset "${urlOrPublicId}" already at usageCount: ${existing.usageCount} (counts out of sync, clamped at 0)`);
      }
    }
    return result;
  } catch (err) {
    console.error(`[mediaHelper] decrementMediaUsage failed for ${urlOrPublicId}:`, err.message);
  }
}
