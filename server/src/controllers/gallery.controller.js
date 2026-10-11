import GalleryItem from '../models/GalleryItem.js';
import MediaAsset from '../models/MediaAsset.js';
import { paginate } from '../utils/paginate.js';

/**
 * usageCount contract (Option A hotfix — 2026-10-06):
 *
 *   create  → $inc usageCount +1 on the MediaAsset matching publicId
 *   update  → if publicId changed: -1 on old, +1 on new
 *   delete  → $inc usageCount -1 (floor 0) on the matching MediaAsset
 *
 * Why publicId and not ObjectId ref?  GalleryItem currently stores the
 * Cloudinary publicId string (copied from the upload response), not a
 * MongoDB ObjectId ref to MediaAsset.  The hotfix works within that
 * constraint.  Option B (replace string copy with a proper ObjectId ref)
 * is tracked in TECH_DEBT.md as a near-term follow-up refactor.
 *
 * Silent failure policy:
 *   usageCount maintenance errors are logged but never surface to the
 *   caller.  The GalleryItem operation (create/update/delete) has already
 *   completed successfully at that point; the count is a housekeeping
 *   concern, not a data-integrity blocker that should fail the request.
 */

// ── Internal helpers ───────────────────────────────────────────

/**
 * Increment usageCount for a MediaAsset identified by its Cloudinary publicId.
 * No-ops silently if the asset doesn't exist (e.g. test data with no MediaAsset row).
 */
async function claimAsset(publicId) {
  if (!publicId) return;
  try {
    await MediaAsset.findOneAndUpdate(
      { publicId, isDeleted: false },
      { $inc: { usageCount: 1 } }
    );
  } catch (err) {
    console.error(`[gallery] claimAsset failed for publicId=${publicId}:`, err.message);
  }
}

/**
 * Decrement usageCount for a MediaAsset, flooring at 0.
 * Uses $max to prevent going negative — MongoDB's $inc can produce negatives
 * if decrements race, so we combine $inc -1 with a $max floor via aggregation
 * pipeline update (Mongo 4.2+).
 */
async function releaseAsset(publicId) {
  if (!publicId) return;
  try {
    await MediaAsset.findOneAndUpdate(
      { publicId },
      [{ $set: { usageCount: { $max: [0, { $subtract: ['$usageCount', 1] }] } } }]
    );
  } catch (err) {
    console.error(`[gallery] releaseAsset failed for publicId=${publicId}:`, err.message);
  }
}

// ── Route handlers ─────────────────────────────────────────────

// GET /api/gallery — public: visible items only, ordered
export const getGallery = async (req, res) => {
  const filter = { isVisible: true };
  if (req.query.category) filter.category = req.query.category;
  const data = await paginate(GalleryItem, filter, req, { sort: { order: 1, createdAt: -1 } });
  res.json({ success: true, ...data });
};

// GET /api/gallery/admin — admin: all items
export const getAdminGallery = async (req, res) => {
  const filter = {};
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.title = { $regex: req.query.search, $options: 'i' };
  const data = await paginate(GalleryItem, filter, req, { sort: { order: 1, createdAt: -1 } });
  res.json({ success: true, ...data });
};

// GET /api/gallery/:id — admin: single item
export const getGalleryItemById = async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found.' });
  res.json({ success: true, data: item });
};

// POST /api/gallery — admin: create
export const createGalleryItem = async (req, res) => {
  const item = await GalleryItem.create({ ...req.body, createdBy: req.user._id });

  // Claim the asset — increment usageCount so orphan cleanup won't delete it.
  // Fire-and-forget: don't await inside the response (already responded with 201).
  claimAsset(item.publicId);

  res.status(201).json({ success: true, data: item });
};

// PUT /api/gallery/:id — admin: update
export const updateGalleryItem = async (req, res) => {
  // Fetch the existing document FIRST so we can compare publicIds.
  // findByIdAndUpdate with { new: true } only returns the updated doc —
  // we'd lose the old publicId and couldn't do the decrement.
  const existing = await GalleryItem.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Gallery item not found.' });

  const oldPublicId = existing.publicId;
  const newPublicId = req.body.publicId;

  const updated = await GalleryItem.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  // If the image was swapped, release the old asset and claim the new one.
  // If publicId is unchanged (caption/title edit only), neither runs.
  if (newPublicId && newPublicId !== oldPublicId) {
    releaseAsset(oldPublicId);
    claimAsset(newPublicId);
  }

  res.json({ success: true, data: updated });
};

// PATCH /api/gallery/:id/visibility — admin: toggle visibility (no image change)
export const toggleVisibility = async (req, res) => {
  const item = await GalleryItem.findById(req.params.id);
  if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found.' });
  item.isVisible = !item.isVisible;
  item.updatedBy = req.user._id;
  await item.save();
  res.json({ success: true, data: item });
};

// DELETE /api/gallery/:id — admin/superadmin: hard delete
export const deleteGalleryItem = async (req, res) => {
  const item = await GalleryItem.findByIdAndDelete(req.params.id);
  // item is the deleted document (findByIdAndDelete returns it).
  // If it didn't exist, no-op — nothing to release.
  if (item?.publicId) {
    releaseAsset(item.publicId);
  }
  res.json({ success: true, message: 'Gallery item deleted.' });
};
