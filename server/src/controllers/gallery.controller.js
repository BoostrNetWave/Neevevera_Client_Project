import GalleryItem from '../models/GalleryItem.js';
import { paginate } from '../utils/paginate.js';
import { claimDocMedia, syncDocMediaUsage, releaseDocMedia } from '../utils/mediaFields.js';

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
  await claimDocMedia('GalleryItem', item);
  res.status(201).json({ success: true, data: item });
};

// PUT /api/gallery/:id — admin: update
export const updateGalleryItem = async (req, res) => {
  const existing = await GalleryItem.findById(req.params.id);
  if (!existing) return res.status(404).json({ success: false, message: 'Gallery item not found.' });

  const updated = await GalleryItem.findByIdAndUpdate(
    req.params.id,
    { ...req.body, updatedBy: req.user._id },
    { returnDocument: 'after', runValidators: true }
  );

  await syncDocMediaUsage('GalleryItem', existing, updated);

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
  if (item) {
    await releaseDocMedia('GalleryItem', item);
  }
  res.json({ success: true, message: 'Gallery item deleted.' });
};
