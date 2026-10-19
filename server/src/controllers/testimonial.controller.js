import Testimonial from '../models/Testimonial.js';
import { paginate } from '../utils/paginate.js';
import { claimDocMedia, syncDocMediaUsage, releaseDocMedia } from '../utils/mediaFields.js';

export const getTestimonials = async (req, res) => {
  const query = { isApproved: true, isDeleted: false };
  if (req.query.featured) query.isFeatured = true;
  const data = await paginate(Testimonial, query, req);
  res.json({ success: true, ...data });
};

export const getTestimonialsAdmin = async (req, res) => {
  const query = { isDeleted: false };
  if (req.query.search) {
    query.clientName = { $regex: req.query.search, $options: 'i' };
  }
  const data = await paginate(Testimonial, query, req);
  res.json({ success: true, ...data });
};

export const getTestimonialById = async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial || testimonial.isDeleted) return res.status(404).json({ success: false, message: 'Testimonial not found.' });
  res.json({ success: true, data: testimonial });
};

export const createTestimonial = async (req, res) => {
  const t = await Testimonial.create({ ...req.body, createdBy: req.user._id, isDeleted: false });
  await claimDocMedia('Testimonial', t);
  res.status(201).json({ success: true, data: t });
};

export const updateTestimonial = async (req, res) => {
  const current = await Testimonial.findById(req.params.id);
  if (!current || current.isDeleted) {
    return res.status(404).json({ success: false, message: 'Testimonial not found.' });
  }
  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'Record was modified by another user.',
      updatedAt: current.updatedAt,
    });
  }
  const { lastKnownUpdatedAt, ...updateData } = req.body;

  const updated = await Testimonial.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { returnDocument: 'after', runValidators: true }
  );

  await syncDocMediaUsage('Testimonial', current, updated);

  res.json({ success: true, data: updated });
};

export const deleteTestimonial = async (req, res) => {
  const t = await Testimonial.findById(req.params.id);
  if (!t || t.isDeleted) {
    return res.status(404).json({ success: false, message: 'Testimonial not found.' });
  }
  await Testimonial.findByIdAndUpdate(req.params.id, { isDeleted: true, updatedBy: req.user._id });
  await releaseDocMedia('Testimonial', t);
  res.json({ success: true, message: 'Testimonial soft-deleted.' });
};
