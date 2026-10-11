import MediaAsset from '../models/MediaAsset.js';

/**
 * Increment usageCount for a MediaAsset identified by its URL or Cloudinary publicId.
 * No-ops silently if the asset doesn't exist.
 */
export async function incrementMediaUsage(urlOrPublicId) {
  if (!urlOrPublicId) return;
  
  const query = urlOrPublicId.startsWith('http') 
    ? { url: urlOrPublicId, isDeleted: false } 
    : { publicId: urlOrPublicId, isDeleted: false };

  try {
    await MediaAsset.findOneAndUpdate(
      query,
      { $inc: { usageCount: 1 } }
    );
  } catch (err) {
    console.error(`[mediaHelper] incrementMediaUsage failed for ${urlOrPublicId}:`, err.message);
  }
}

/**
 * Decrement usageCount for a MediaAsset, flooring at 0.
 * Uses $max to prevent going negative — MongoDB's $inc can produce negatives
 * if decrements race, so we combine $inc -1 with a $max floor via aggregation
 * pipeline update (Mongo 4.2+).
 */
export async function decrementMediaUsage(urlOrPublicId) {
  if (!urlOrPublicId) return;
  
  const query = urlOrPublicId.startsWith('http') 
    ? { url: urlOrPublicId } 
    : { publicId: urlOrPublicId };

  try {
    await MediaAsset.findOneAndUpdate(
      query,
      [{ $set: { usageCount: { $max: [0, { $subtract: ['$usageCount', 1] }] } } }]
    );
  } catch (err) {
    console.error(`[mediaHelper] decrementMediaUsage failed for ${urlOrPublicId}:`, err.message);
  }
}
