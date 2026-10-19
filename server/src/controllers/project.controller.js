import Project from '../models/Project.js';
import { paginate } from '../utils/paginate.js';
import { claimDocMedia, syncDocMediaUsage, releaseDocMedia } from '../utils/mediaFields.js';

export const getProjects = async (req, res) => {
  const query = { isDeleted: false };
  if (req.query.category) query.category = req.query.category;
  if (req.query.region)   query.region   = req.query.region;
  if (req.query.status)   query.status   = req.query.status;
  if (req.query.featured) query.isFeatured = true;
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }

  const data = await paginate(Project, query, req);
  res.json({ success: true, ...data });
};

export const getProjectBySlug = async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug, isDeleted: false });
  if (!project) return res.status(404).json({ success: false, message: 'Project not found.' });
  res.json({ success: true, data: project });
};

export const getProjectById = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project || project.isDeleted) return res.status(404).json({ success: false, message: 'Project not found.' });
  res.json({ success: true, data: project });
};

export const createProject = async (req, res) => {
  const project = await Project.create({ ...req.body, createdBy: req.user._id, isDeleted: false });
  await claimDocMedia('Project', project);
  res.status(201).json({ success: true, data: project });
};

export const updateProject = async (req, res) => {
  const current = await Project.findById(req.params.id);
  if (!current || current.isDeleted) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }

  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'This record was modified by another user since you loaded it.',
      updatedBy: current.updatedBy,
      updatedAt: current.updatedAt,
    });
  }

  const { lastKnownUpdatedAt, ...updateData } = req.body;

  const updated = await Project.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { returnDocument: 'after', runValidators: true }
  );

  await syncDocMediaUsage('Project', current, updated);

  res.json({ success: true, data: updated });
};

export const deleteProject = async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project || project.isDeleted) {
    return res.status(404).json({ success: false, message: 'Project not found.' });
  }
  await Project.findByIdAndUpdate(req.params.id, {
    isDeleted: true,
    updatedBy: req.user._id,
  });

  await releaseDocMedia('Project', project);

  res.json({ success: true, message: 'Project soft-deleted.' });
};
