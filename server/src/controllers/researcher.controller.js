import Researcher from '../models/Researcher.js';
import { paginate } from '../utils/paginate.js';
import { maskPhone, maskEmail } from '../utils/masking.js';

/**
 * Public serializer for approved researchers with public listing consent.
 * Masks personal contact information and redacts administrative audit fields.
 */
export function serializeResearcherPublic(doc) {
  const item = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    _id:                  item._id,
    name:                 item.name,
    phone:                maskPhone(item.phone),
    email:                maskEmail(item.email),
    institution:          item.institution,
    designation:          item.designation,
    highestQualification: item.highestQualification,
    researchInterests:    item.researchInterests || [],
    summary:              item.summary || '',
    publications:         item.publications || [],
    createdAt:            item.createdAt,
  };
}

/**
 * Admin serializer including protected documents and review history.
 */
export function serializeResearcherAdmin(doc) {
  const item = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  return {
    _id:                      item._id,
    name:                     item.name,
    email:                    item.email,
    phone:                    item.phone,
    institution:              item.institution,
    designation:              item.designation,
    highestQualification:     item.highestQualification,
    researchInterests:        item.researchInterests || [],
    summary:                  item.summary || '',
    publications:             item.publications || [],
    proposalUrl:              item.proposalUrl || null,
    isPublicListingConsented: Boolean(item.isPublicListingConsented),
    status:                   item.status,
    adminNotes:               item.adminNotes || '',
    reviewedBy:               item.reviewedBy,
    reviewedAt:               item.reviewedAt,
    createdAt:                item.createdAt,
    updatedAt:                item.updatedAt,
  };
}

// ─── PUBLIC ENDPOINTS ────────────────────────────────────────────────────────────

/**
 * POST /api/researchers/register
 * Public registration for civil researchers, academic scholars, and field collaborators.
 */
export const registerResearcher = async (req, res) => {
  const {
    name,
    email,
    phone,
    institution,
    designation,
    highestQualification,
    researchInterests,
    summary,
    publications,
    proposalUrl,
    isPublicListingConsented,
  } = req.body;

  if (!name?.trim()) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }
  if (!email?.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }
  if (!phone?.trim()) {
    return res.status(400).json({ success: false, error: 'Phone number is required.' });
  }
  if (!institution?.trim()) {
    return res.status(400).json({ success: false, error: 'Institutional affiliation or university is required.' });
  }
  if (!highestQualification?.trim()) {
    return res.status(400).json({ success: false, error: 'Highest qualification is required.' });
  }

  // Sanitize researchInterests
  let interests = [];
  if (Array.isArray(researchInterests)) {
    interests = researchInterests.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof researchInterests === 'string') {
    interests = researchInterests.split(',').map((s) => s.trim()).filter(Boolean);
  }

  if (interests.length === 0) {
    return res.status(400).json({ success: false, error: 'At least one research discipline / interest is required.' });
  }

  // Sanitize publications list if present
  let pubList = [];
  if (Array.isArray(publications)) {
    pubList = publications.map((p) => String(p).trim()).filter(Boolean);
  } else if (typeof publications === 'string' && publications.trim()) {
    pubList = publications.split('\n').map((p) => p.trim()).filter(Boolean);
  }

  const existing = await Researcher.findOne({
    email: email.trim().toLowerCase(),
    status: { $in: ['pending', 'under_review', 'approved'] },
  });

  if (existing) {
    return res.status(409).json({
      success: false,
      error: 'An active researcher profile with this email already exists. Our R&D team is in contact with you.',
    });
  }

  const researcher = await Researcher.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    institution: institution.trim(),
    designation: designation?.trim() || 'Research Scholar',
    highestQualification: highestQualification.trim(),
    researchInterests: interests,
    summary: summary?.trim() || '',
    publications: pubList,
    proposalUrl: proposalUrl?.trim() || '',
    isPublicListingConsented: Boolean(isPublicListingConsented),
    status: 'pending',
  });

  res.status(201).json({
    success: true,
    message: 'Researcher registration submitted successfully. Our R&D technical committee will review your profile within 3 business days.',
    data: { id: researcher._id, status: researcher.status },
  });
};

/**
 * GET /api/researchers/approved
 * Public listing of approved researchers who consented to public directory inclusion.
 */
export const getApprovedResearchersPublic = async (req, res) => {
  const query = { status: 'approved', isPublicListingConsented: true };
  if (req.query.discipline) {
    query.researchInterests = { $regex: req.query.discipline, $options: 'i' };
  }
  const data = await paginate(Researcher, query, req, { sort: { createdAt: -1 } });
  const serialized = (data.items || []).map(serializeResearcherPublic);
  data.items = serialized;
  data.docs = serialized;
  res.json({ success: true, ...data });
};

// ─── ADMIN ENDPOINTS (PROTECTED) ────────────────────────────────────────────────

/**
 * GET /api/researchers
 * Admin listing with filtering and pagination.
 */
export const getResearchersAdmin = async (req, res) => {
  const query = {};
  if (req.query.status) {
    query.status = req.query.status;
  }
  if (req.query.qualification) {
    query.highestQualification = req.query.qualification;
  }
  if (req.query.search) {
    const searchRegex = { $regex: req.query.search, $options: 'i' };
    query.$or = [
      { name: searchRegex },
      { email: searchRegex },
      { institution: searchRegex },
      { researchInterests: searchRegex },
    ];
  }

  const data = await paginate(Researcher, query, req, {
    sort: { createdAt: -1 },
    populate: { path: 'reviewedBy', select: 'name email' },
  });

  const serialized = (data.items || []).map(serializeResearcherAdmin);
  data.items = serialized;
  data.docs = serialized;
  res.json({ success: true, ...data });
};

/**
 * GET /api/researchers/:id
 * Single researcher detail with unmasked contacts and proposal document URL.
 */
export const getResearcherAdminById = async (req, res) => {
  const researcher = await Researcher.findById(req.params.id).populate('reviewedBy', 'name email');
  if (!researcher) {
    return res.status(404).json({ success: false, error: 'Researcher application not found.' });
  }
  res.json({ success: true, data: serializeResearcherAdmin(researcher) });
};

/**
 * PATCH /api/researchers/:id/status
 * Administrative review approval / rejection / review status update.
 */
export const updateResearcherStatus = async (req, res) => {
  const { status, adminNotes } = req.body;
  const ALLOWED_STATUSES = ['pending', 'under_review', 'approved', 'rejected'];

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      error: `Invalid status. Must be one of: ${ALLOWED_STATUSES.join(', ')}`,
    });
  }

  const updates = {
    status,
    reviewedBy: req.user._id,
    reviewedAt: new Date(),
  };

  if (adminNotes !== undefined) {
    updates.adminNotes = String(adminNotes).slice(0, 2000).trim();
  }

  const researcher = await Researcher.findByIdAndUpdate(
    req.params.id,
    { $set: updates },
    { returnDocument: 'after', runValidators: true }
  ).populate('reviewedBy', 'name email');

  if (!researcher) {
    return res.status(404).json({ success: false, error: 'Researcher application not found.' });
  }

  res.json({
    success: true,
    message: `Researcher status updated to "${status}".`,
    data: serializeResearcherAdmin(researcher),
  });
};

/**
 * DELETE /api/researchers/:id
 * Admin removal of a researcher record.
 */
export const deleteResearcherAdmin = async (req, res) => {
  const researcher = await Researcher.findByIdAndDelete(req.params.id);
  if (!researcher) {
    return res.status(404).json({ success: false, error: 'Researcher record not found.' });
  }
  res.json({ success: true, message: 'Researcher application deleted successfully.' });
};
