import Career from '../models/Career.js';

// Admin: GET /api/careers/applications/count — aggregated counts across all jobs
export const getApplicationsCount = async (req, res) => {
  const rows = await Career.aggregate([
    { $unwind: '$applications' },
    { $group: { _id: '$applications.status', count: { $sum: 1 } } },
  ]);
  const byStatus = Object.fromEntries(rows.map((r) => [r._id, r.count]));
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  res.json({ success: true, total, byStatus });
};

export const getCareers = async (req, res) => {
  const jobs = await Career.find({ isActive: true }).select('-applications').sort({ createdAt: -1 });
  res.json({ success: true, data: jobs });
};

export const getCareerBySlug = async (req, res) => {
  const job = await Career.findOne({ slug: req.params.slug, isActive: true }).select('-applications');
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, data: job });
};

// Rate-limited at route level (careerApplyLimiter)
export const applyToCareer = async (req, res) => {
  const job = await Career.findOne({ slug: req.params.slug, isActive: true });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  job.applications.push(req.body);
  await job.save();
  res.status(201).json({ success: true, message: 'Application submitted successfully' });
};

// Admin: GET /api/careers/:slug/applications — list all applications for a job
export const getApplications = async (req, res) => {
  const job = await Career.findOne({ slug: req.params.slug });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, count: job.applications.length, data: job.applications });
};

// Admin: PATCH /api/careers/:slug/applications/:appId — update application status
// Uses MongoDB positional $ operator for atomic subdocument update.
// Status enum: received → reviewed → shortlisted → rejected
export const updateApplicationStatus = async (req, res) => {
  const VALID_STATUSES = ['received', 'reviewed', 'shortlisted', 'rejected'];
  const { status } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `status must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  const job = await Career.findOneAndUpdate(
    {
      slug: req.params.slug,
      'applications._id': req.params.appId,
    },
    {
      $set: { 'applications.$.status': status },
    },
    { new: true }
  );

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job or application not found.' });
  }

  const updated = job.applications.id(req.params.appId);
  res.json({ success: true, data: updated });
};

// ── Admin: Job CRUD ───────────────────────────────────────────

export const getCareersAdmin = async (req, res) => {
  const query = {};
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  // Career list doesn't use paginate in public route currently, but let's just return all for admin
  const jobs = await Career.find(query).select('-applications').sort({ createdAt: -1 });
  // Wrap in a mock pagination envelope to match the UI pattern exactly
  res.json({ success: true, items: jobs, total: jobs.length, page: 1, pages: 1 });
};

export const getCareerById = async (req, res) => {
  const job = await Career.findById(req.params.id).select('-applications');
  if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
  res.json({ success: true, data: job });
};

export const createCareer = async (req, res) => {
  const job = await Career.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json({ success: true, data: job });
};

export const updateCareer = async (req, res) => {
  const current = await Career.findById(req.params.id);
  if (!current) return res.status(404).json({ success: false, message: 'Job not found.' });
  if (req.body.lastKnownUpdatedAt &&
      new Date(current.updatedAt).getTime() !== new Date(req.body.lastKnownUpdatedAt).getTime()) {
    return res.status(409).json({
      success: false,
      error: 'Record was modified by another user.',
      updatedAt: current.updatedAt,
    });
  }
  const { lastKnownUpdatedAt, ...updateData } = req.body;
  const updated = await Career.findByIdAndUpdate(
    req.params.id,
    { ...updateData, updatedBy: req.user._id },
    { new: true, runValidators: true }
  ).select('-applications');
  res.json({ success: true, data: updated });
};

export const deactivateCareer = async (req, res) => {
  await Career.findByIdAndUpdate(req.params.id, { isActive: false, updatedBy: req.user._id });
  res.json({ success: true, message: 'Job deactivated.' });
};

export const activateCareer = async (req, res) => {
  await Career.findByIdAndUpdate(req.params.id, { isActive: true, updatedBy: req.user._id });
  res.json({ success: true, message: 'Job activated.' });
};

