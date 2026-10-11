import Podcast from '../models/Podcast.js';
import { paginate } from '../utils/paginate.js';

export const getPodcasts = async (req, res) => {
  const data = await paginate(Podcast, { isPublished: true }, req, { sort: { publishedAt: -1 } });
  res.json({ success: true, ...data });
};

export const getPodcastBySlug = async (req, res) => {
  const ep = await Podcast.findOne({ slug: req.params.slug, isPublished: true });
  if (!ep) return res.status(404).json({ success: false, message: 'Episode not found.' });
  res.json({ success: true, data: ep });
};

export const getAdminPodcasts = async (req, res) => {
  const query = {};
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  const data = await paginate(Podcast, query, req, { sort: { createdAt: -1 } });
  res.json({ success: true, ...data });
};

export const getAdminPodcastById = async (req, res) => {
  const ep = await Podcast.findById(req.params.id);
  if (!ep) return res.status(404).json({ success: false, message: 'Episode not found.' });
  res.json({ success: true, data: ep });
};

export const createPodcast = async (req, res) => {
  const ep = await Podcast.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: ep });
};

export const updatePodcast = async (req, res) => {
  const current = await Podcast.findById(req.params.id);
  if (!current) return res.status(404).json({ success: false, message: 'Episode not found.' });
  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'Record was modified by another user.',
      updatedAt: current.updatedAt,
    });
  }
  const { lastKnownUpdatedAt, ...updateData } = req.body;
  // Auto-set publishedAt on first publish
  if (updateData.isPublished && !current.publishedAt) updateData.publishedAt = new Date();
  const updated = await Podcast.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  res.json({ success: true, data: updated });
};

export const deletePodcast = async (req, res) => {
  // Podcasts: hard delete acceptable — no public history concern like projects
  await Podcast.findByIdAndDelete(req.params.id);
  res.json({ success: true, message: 'Episode deleted.' });
};
