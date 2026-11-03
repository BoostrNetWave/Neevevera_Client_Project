import Career from '../models/Career.js';
import { incrementMediaUsage } from '../utils/mediaHelper.js';
import { evaluateSkills, extractTextFromUrl } from '../utils/skillMatcher.js';

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

  // Wave 0: Prevent orphan cleanup from purging candidate resume after 48h
  if (req.body.resumeUrl) {
    await incrementMediaUsage(req.body.resumeUrl);
  }
  // Feature G: Claim optional supporting document asset
  if (req.body.supportingDocUrl) {
    await incrementMediaUsage(req.body.supportingDocUrl);
  }

  res.status(201).json({ success: true, message: 'Application submitted successfully' });
};

// Admin: GET /api/careers/applications/all — list all applications across all jobs
export const getAllApplications = async (req, res) => {
  const jobs = await Career.find({}).sort({ createdAt: -1 });
  const allApps = [];
  for (const job of jobs) {
    if (Array.isArray(job.applications)) {
      for (const app of job.applications) {
        allApps.push({
          _id: app._id,
          name: app.name,
          email: app.email,
          phone: app.phone,
          resumeUrl: app.resumeUrl,
          supportingDocUrl: app.supportingDocUrl,
          coverLetter: app.coverLetter,
          appliedAt: app.appliedAt,
          status: app.status || 'received',
          evaluation: app.evaluation,
          jobId: job._id,
          jobTitle: job.title,
          jobSlug: job.slug,
          jobDepartment: job.department,
          jobLocation: job.location,
          requiredSkills: job.requiredSkills || [],
          preferredSkills: job.preferredSkills || [],
          requirements: job.requirements || [],
        });
      }
    }
  }
  allApps.sort((a, b) => new Date(b.appliedAt || 0) - new Date(a.appliedAt || 0));
  res.json({ success: true, count: allApps.length, data: allApps });
};

// Admin: GET /api/careers/:slug/applications — list all applications for a job
export const getApplications = async (req, res) => {
  const job = await Career.findOne({ slug: req.params.slug });
  if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
  res.json({ success: true, count: job.applications.length, data: job.applications });
};

// Admin: PATCH /api/careers/:slug/applications/:appId or /api/careers/applications/:appId — update application status
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

  const query = req.params.slug
    ? { slug: req.params.slug, 'applications._id': req.params.appId }
    : { 'applications._id': req.params.appId };

  const job = await Career.findOneAndUpdate(
    query,
    {
      $set: { 'applications.$.status': status },
    },
    { returnDocument: 'after' }
  );

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job or application not found.' });
  }

  const updated = job.applications.id(req.params.appId);
  res.json({ success: true, data: updated });
};

// Admin: POST /api/careers/:slug/applications/:appId/evaluate or /api/careers/applications/:appId/evaluate
// Evaluates candidate credentials/resume against job required and preferred skills
export const evaluateApplication = async (req, res) => {
  const query = req.params.slug
    ? { slug: req.params.slug, 'applications._id': req.params.appId }
    : { 'applications._id': req.params.appId };

  const job = await Career.findOne(query);
  if (!job) {
    return res.status(404).json({ success: false, message: 'Job or application not found.' });
  }

  const app = job.applications.id(req.params.appId);
  if (!app) {
    return res.status(404).json({ success: false, message: 'Application not found.' });
  }

  // Extract text from resumeUrl if available; combine with coverLetter/notes
  let extractedResumeText = '';
  if (app.resumeUrl) {
    try {
      extractedResumeText = await extractTextFromUrl(app.resumeUrl);
    } catch (err) {
      console.warn(`[evaluateApplication] Text extraction failed for ${app.resumeUrl}:`, err.message);
    }
  }

  const combinedCandidateText = [extractedResumeText, app.coverLetter || ''].filter(Boolean).join('\n\n');

  // Match against job required and preferred skills (or fallback to requirements)
  const reqSkills = (job.requiredSkills && job.requiredSkills.length > 0)
    ? job.requiredSkills
    : (job.requirements || []);
  const prefSkills = job.preferredSkills || [];

  const evaluationResult = evaluateSkills(combinedCandidateText, reqSkills, prefSkills);

  app.evaluation = {
    overallScore: evaluationResult.overallScore,
    requiredScore: evaluationResult.requiredScore,
    preferredScore: evaluationResult.preferredScore,
    matchedRequired: evaluationResult.matchedRequired,
    missingRequired: evaluationResult.missingRequired,
    matchedPreferred: evaluationResult.matchedPreferred,
    missingPreferred: evaluationResult.missingPreferred,
    evaluatedAt: new Date(),
  };

  await job.save();

  res.json({
    success: true,
    data: {
      ...evaluationResult,
      evaluatedAt: app.evaluation.evaluatedAt,
      extractedTextLength: combinedCandidateText.length,
      candidateTextSample: combinedCandidateText.slice(0, 300),
    },
  });
};

// Admin: POST /api/careers/evaluate-text
export const evaluateTextDirect = async (req, res) => {
  const { text, requiredSkills, preferredSkills } = req.body;
  const result = evaluateSkills(text || '', requiredSkills || [], preferredSkills || []);
  res.json({ success: true, data: result });
};

// ── Admin: Job CRUD ───────────────────────────────────────────

export const getCareersAdmin = async (req, res) => {
  const query = {};
  if (req.query.search) {
    query.title = { $regex: req.query.search, $options: 'i' };
  }
  const jobs = await Career.find(query).sort({ createdAt: -1 });
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
    { returnDocument: 'after', runValidators: true }
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

