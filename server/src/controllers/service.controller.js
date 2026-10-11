import Service from '../models/Service.js';
import { paginate } from '../utils/paginate.js';
import { incrementMediaUsage, decrementMediaUsage } from '../utils/mediaHelper.js';
import sendEmail from '../utils/mailer.js';

export const getServices = async (req, res) => {
  const query = { isActive: true };
  if (req.query.category) query.category = req.query.category;
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  const data = await paginate(Service, query, req, { sort: { order: 1, createdAt: -1 } });
  res.json({ success: true, ...data });
};

// Admin list — includes inactive services (protected route)
export const getServicesAdmin = async (req, res) => {
  const query = {};
  if (req.query.category) query.category = req.query.category;
  if (req.query.search)   query.title    = { $regex: req.query.search, $options: 'i' };
  const data = await paginate(Service, query, req, { sort: { order: 1, createdAt: -1 } });
  res.json({ success: true, ...data });
};

// Fetch single service by _id (for admin editor load)
export const getServiceById = async (req, res) => {
  const service = await Service.findById(req.params.id);
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, data: service });
};

export const getServiceBySlug = async (req, res) => {
  const service = await Service.findOne({ slug: req.params.slug, isActive: true });
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, data: service });
};

// Re-activate a previously deactivated service
export const activateService = async (req, res) => {
  const service = await Service.findByIdAndUpdate(
    req.params.id,
    { isActive: true, updatedBy: req.user._id },
    { new: true }
  );
  if (!service) return res.status(404).json({ success: false, message: 'Service not found.' });
  res.json({ success: true, message: 'Service activated.', data: service });
};

export const createService = async (req, res) => {
  const service = await Service.create({ ...req.body, createdBy: req.user._id });
  if (service.image) incrementMediaUsage(service.image);

  sendEmail({
    to: "ayankhan987456@gmail.com",
    subject: `New Service Added: ${service.title}`,
    text: `We just added a new service: ${service.title}!`,
    html: `<p>We just added a new service: <strong>${service.title}</strong>! Check it out: <a href="http://localhost:5173/services/${service.slug}">Read More</a></p>`
  });

  res.status(201).json({ success: true, data: service });
};

export const updateService = async (req, res) => {
  const current = await Service.findById(req.params.id);
  if (!current) return res.status(404).json({ success: false, message: 'Service not found.' });
  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'Record was modified by another user.',
      updatedAt: current.updatedAt,
    });
  }
  const { lastKnownUpdatedAt, ...updateData } = req.body;
  
  const oldCover = current.image;
  const newCover = updateData.image;
  
  const updated = await Service.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );
  
  if (newCover !== oldCover) {
    if (oldCover) decrementMediaUsage(oldCover);
    if (newCover) incrementMediaUsage(newCover);
  }
  
  res.json({ success: true, data: updated });
};

export const deactivateService = async (req, res) => {
  await Service.findByIdAndUpdate(req.params.id, { isActive: false, updatedBy: req.user._id });
  res.json({ success: true, message: 'Service deactivated.' });
};
