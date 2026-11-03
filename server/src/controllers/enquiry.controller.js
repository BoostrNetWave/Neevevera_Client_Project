import Enquiry from '../models/Enquiry.js';
import { paginate } from '../utils/paginate.js';
import { resolveReferralAttribution } from '../utils/referralAttribution.js';

// POST / — public, unauthenticated submission
export const submitEnquiry = async (req, res) => {
  const cookieRef = req.cookies?.neeve_ref;
  const passedRefCode = req.body?.refCode;

  // Server-authoritative referral attribution check
  const attribution = await resolveReferralAttribution({
    refCode: passedRefCode,
    cookieRef,
    phone: req.body?.phone,
    email: req.body?.email,
  });

  const payload = {
    ...req.body,
    ...attribution,
    service: req.body.service ? String(req.body.service).slice(0, 120).trim() : undefined,
    module: req.body.module ? String(req.body.module).slice(0, 120).trim() : undefined,
    ipAddress: req.ip || req.connection?.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
  const enquiry = await Enquiry.create(payload);
  res.status(201).json({
    success: true,
    message: 'Enquiry submitted successfully. Our team will respond within 24 hours.',
    data: { id: enquiry._id, type: enquiry.type },
  });
};

// GET / — admin inbox with pagination + filtering
export const getEnquiries = async (req, res) => {
  const filter = {};
  if (req.query.type)   filter.type   = req.query.type;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.attributionStatus) filter.attributionStatus = req.query.attributionStatus;
  if (req.query.partnerId) filter.partnerId = req.query.partnerId;

  const data = await paginate(
    Enquiry,
    filter,
    req,
    { populate: { path: 'partnerId', select: 'name email phone referralCode partnerType status' } }
  );
  res.json({ success: true, ...data });
};

// PATCH /:id — admin status / assignment update
// Field whitelist prevents accidental overwrite of sensitive fields
export const updateEnquiry = async (req, res) => {
  const ALLOWED = ['status', 'assignedTo', 'internalNote', 'conversionStatus', 'conversionValuePaise'];
  const update  = Object.fromEntries(
    Object.entries(req.body).filter(([k]) => ALLOWED.includes(k))
  );

  if (update.conversionStatus === 'converted' && !update.convertedAt) {
    update.convertedAt = new Date();
  }

  const enquiry = await Enquiry.findByIdAndUpdate(req.params.id, update, {
    returnDocument: 'after', runValidators: true,
  }).populate('partnerId', 'name email phone referralCode partnerType status');

  if (!enquiry) return res.status(404).json({ success: false, message: 'Enquiry not found.' });
  res.json({ success: true, data: enquiry });
};
