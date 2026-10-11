import TeamMember from '../models/TeamMember.js';
import { paginate } from '../utils/paginate.js';
import { incrementMediaUsage, decrementMediaUsage } from '../utils/mediaHelper.js';

export const getTeamMembers = async (req, res) => {
  const data = await paginate(TeamMember, { isActive: true }, req, { sort: { order: 1 } });
  res.json({ success: true, ...data });
};

export const getTeamMembersAdmin = async (req, res) => {
  const query = {};
  if (req.query.search) {
    query.name = { $regex: req.query.search, $options: 'i' };
  }
  const data = await paginate(TeamMember, query, req, { sort: { order: 1 } });
  res.json({ success: true, ...data });
};

export const getTeamMember = async (req, res) => {
  // Relax isActive: true so admin can load inactive members for editing
  const member = await TeamMember.findOne({ _id: req.params.id });
  if (!member) return res.status(404).json({ success: false, message: 'Team member not found.' });
  res.json({ success: true, data: member });
};

export const createTeamMember = async (req, res) => {
  const member = await TeamMember.create({ ...req.body, createdBy: req.user._id });
  if (member.image) incrementMediaUsage(member.image);
  res.status(201).json({ success: true, data: member });
};

export const updateTeamMember = async (req, res) => {
  const current = await TeamMember.findById(req.params.id);
  if (!current) return res.status(404).json({ success: false, message: 'Team member not found.' });
  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'Record was modified by another user.',
      updatedAt: current.updatedAt,
    });
  }
  const { lastKnownUpdatedAt, ...updateData } = req.body;
  
  const oldImage = current.image;
  const newImage = updateData.image;

  const updated = await TeamMember.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { new: true, runValidators: true }
  );

  if (newImage !== oldImage) {
    if (oldImage) decrementMediaUsage(oldImage);
    if (newImage) incrementMediaUsage(newImage);
  }

  res.json({ success: true, data: updated });
};

export const deactivateTeamMember = async (req, res) => {
  await TeamMember.findByIdAndUpdate(req.params.id, { isActive: false, updatedBy: req.user._id });
  res.json({ success: true, message: 'Team member deactivated.' });
};

export const activateTeamMember = async (req, res) => {
  await TeamMember.findByIdAndUpdate(req.params.id, { isActive: true, updatedBy: req.user._id });
  res.json({ success: true, message: 'Team member activated.' });
};
