import crypto from 'crypto';
import Partner from '../models/Partner.js';
import PartnerIncentive from '../models/PartnerIncentive.js';
import PartnerSettings from '../models/PartnerSettings.js';
import Enquiry from '../models/Enquiry.js';
import sendEmail from '../utils/mailer.js';
import {
  normalizePhone,
  normalizeEmail,
  generateUniqueReferralCode,
  generateVerificationToken,
  verifyApprovedPartnerCode,
} from '../utils/referralAttribution.js';

// Feature flag helper
export function isPartnerFeatureEnabled() {
  return process.env.FEATURE_PARTNERS === 'true' || process.env.NODE_ENV === 'test';
}

/**
 * 1. Public Partner Registration
 * POST /api/partners/register
 */
export const registerPartner = async (req, res) => {
  if (!isPartnerFeatureEnabled()) {
    return res.status(503).json({
      success: false,
      code: 'PARTNERS_DISABLED',
      error: 'Marketing partner registration is currently offline.',
    });
  }

  const { name, phone, email, city, pin, partnerType, agreementAccepted } = req.body;

  if (!name || !phone || !email || !city || !pin) {
    return res.status(400).json({
      success: false,
      error: 'Full name, phone, email, city, and PIN code are required.',
    });
  }

  if (!agreementAccepted) {
    return res.status(400).json({
      success: false,
      error: 'You must accept the Partner Terms and Agreement to register.',
    });
  }

  const cleanPhone = String(phone).trim();
  const cleanEmail = String(email).trim().toLowerCase();
  const normPhone = normalizePhone(cleanPhone);
  const normEmail = normalizeEmail(cleanEmail);

  if (!/^[1-9][0-9]{5}$/.test(String(pin).trim())) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 6-digit Indian PIN code.',
    });
  }

  if (normPhone.length < 10) {
    return res.status(400).json({
      success: false,
      error: 'Please enter a valid 10-digit mobile number.',
    });
  }

  // Duplicate partner check (cannot register same phone or email if active or pending)
  const existingPartner = await Partner.findOne({
    $or: [{ normalizedEmail: normEmail }, { normalizedPhone: normPhone }],
    status: { $in: ['pending_email', 'pending_approval', 'approved'] },
  });

  if (existingPartner) {
    return res.status(409).json({
      success: false,
      error: 'A partner application with this email or phone number is already registered.',
    });
  }

  // Generate high-entropy one-time verification token
  const { rawToken, tokenHash, expiresAt } = generateVerificationToken();

  const partner = await Partner.create({
    name: name.trim(),
    phone: cleanPhone,
    normalizedPhone: normPhone,
    email: cleanEmail,
    normalizedEmail: normEmail,
    city: city.trim(),
    pin: String(pin).trim(),
    partnerType: ['individual', 'agency', 'professional', 'other'].includes(partnerType)
      ? partnerType
      : 'individual',
    status: 'pending_email',
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: expiresAt,
    agreementAcceptedAt: new Date(),
  });

  // Verification URL
  const baseUrl = process.env.CLIENT_URL || 'https://www.neevevara.com';
  const verifyUrl = `${baseUrl}/partners/verify?token=${rawToken}`;

  // Send verification email
  await sendEmail({
    to: cleanEmail,
    subject: 'Verify your Neevevera Marketing Partner application',
    text: `Hello ${partner.name},\n\nPlease verify your email to complete your marketing partner registration:\n${verifyUrl}\n\nThis link is valid for 24 hours.\n\nBest regards,\nNeevevera Directorate`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #07558F;">Welcome to Neevevera Marketing Partners</h2>
        <p>Dear ${partner.name},</p>
        <p>Thank you for registering. Please verify your email address to submit your application for review:</p>
        <div style="margin: 25px 0;">
          <a href="${verifyUrl}" style="background-color: #07558F; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #666; font-size: 12px;">This link will expire in 24 hours.</p>
      </div>
    `,
  });

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Please check your email to verify your address.',
    data: {
      partnerId: partner._id,
      email: partner.email,
    },
  });
};

/**
 * 2. Verify Partner Email
 * GET /api/partners/verify/:token
 */
export const verifyPartnerEmail = async (req, res) => {
  const { token } = req.params;

  if (!token || typeof token !== 'string') {
    return res.status(400).json({ success: false, error: 'Invalid verification token.' });
  }

  const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');

  const partner = await Partner.findOne({
    verificationTokenHash: tokenHash,
    verificationTokenExpiresAt: { $gt: new Date() },
  });

  if (!partner) {
    return res.status(400).json({
      success: false,
      error: 'Invalid or expired verification token. Please request a new verification link.',
    });
  }

  partner.status = 'pending_approval';
  partner.emailVerifiedAt = new Date();
  partner.verificationTokenHash = undefined;
  partner.verificationTokenExpiresAt = undefined;
  await partner.save();

  res.json({
    success: true,
    message: 'Email verified successfully. Your application has been submitted for admin directorate review.',
  });
};

/**
 * 3. Referral Tracking & First-Touch Cookie Issuance (Amendment A)
 * POST /api/partners/referral/track
 */
export const trackReferral = async (req, res) => {
  const refCode = (req.body?.refCode || req.query?.refCode || '').trim().toUpperCase();

  if (!refCode) {
    return res.status(400).json({ success: false, error: 'Referral code is required.' });
  }

  // First-touch wins: if user already has an active neeve_ref cookie, preserve it
  const existingCookieRef = req.cookies?.neeve_ref;
  if (existingCookieRef) {
    return res.json({
      success: true,
      valid: true,
      refCode: existingCookieRef,
      message: 'Existing first-touch referral attribution preserved.',
    });
  }

  const partner = await verifyApprovedPartnerCode(refCode);

  if (!partner) {
    return res.status(404).json({
      success: false,
      valid: false,
      error: 'Referral code is invalid or inactive.',
    });
  }

  // Issue 60-day secure HTTP-only cookie
  const maxAgeMs = 60 * 24 * 60 * 60 * 1000;
  res.cookie('neeve_ref', partner.referralCode, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAgeMs,
  });

  res.json({
    success: true,
    valid: true,
    refCode: partner.referralCode,
    partnerName: partner.name,
    attributionDays: 60,
  });
};

/**
 * 4. Admin: List Marketing Partners
 * GET /api/partners/admin
 */
export const getAdminPartners = async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  if (status && status !== 'all') {
    filter.status = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    filter.$or = [
      { name: new RegExp(s, 'i') },
      { email: new RegExp(s, 'i') },
      { phone: new RegExp(s, 'i') },
      { referralCode: new RegExp(s, 'i') },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [partners, total, pendingCount, approvedCount] = await Promise.all([
    Partner.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('approvedBy', 'name email')
      .lean(),
    Partner.countDocuments(filter),
    Partner.countDocuments({ status: 'pending_approval' }),
    Partner.countDocuments({ status: 'approved' }),
  ]);

  // Aggregate referred enquiries count per partner
  const partnerIds = partners.map((p) => p._id);
  const enquiryCounts = await Enquiry.aggregate([
    { $match: { partnerId: { $in: partnerIds } } },
    { $group: { _id: '$partnerId', total: { $sum: 1 }, converted: { $sum: { $cond: [{ $eq: ['$conversionStatus', 'converted'] }, 1, 0] } } } },
  ]);

  const countMap = {};
  enquiryCounts.forEach((c) => {
    countMap[String(c._id)] = { total: c.total, converted: c.converted };
  });

  const enriched = partners.map((p) => ({
    ...p,
    metrics: countMap[String(p._id)] || { total: 0, converted: 0 },
  }));

  res.json({
    success: true,
    partners: enriched,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum),
    },
    counts: {
      pendingApproval: pendingCount,
      approved: approvedCount,
    },
  });
};

/**
 * 5. Admin: Update Partner Status (Approve / Reject / Suspend)
 * PATCH /api/partners/admin/:id/status
 */
export const updatePartnerStatus = async (req, res) => {
  const { action, reason } = req.body;
  const partner = await Partner.findById(req.params.id);

  if (!partner) {
    return res.status(404).json({ success: false, error: 'Partner not found.' });
  }

  if (action === 'approve') {
    // Generate unique referral code with 64-bit randomness
    if (!partner.referralCode) {
      partner.referralCode = await generateUniqueReferralCode();
    }
    partner.status = 'approved';
    partner.approvedAt = new Date();
    partner.approvedBy = req.user._id;
    partner.rejectionReason = undefined;
    partner.suspendedReason = undefined;

    await partner.save();

    // Send welcome email with referral code and link
    const baseUrl = process.env.CLIENT_URL || 'https://www.neevevara.com';
    const refUrl = `${baseUrl}/?ref=${partner.referralCode}`;

    await sendEmail({
      to: partner.email,
      subject: 'Your Neevevera Marketing Partner application is approved!',
      text: `Hello ${partner.name},\n\nYour application has been approved.\nYour unique referral code is: ${partner.referralCode}\nYour referral link is: ${refUrl}\n\nShare this link with prospective construction and civil engineering clients to earn approved incentives upon verified project contract.\n\nBest regards,\nNeevevera Directorate`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #07558F;">Application Approved</h2>
          <p>Dear ${partner.name},</p>
          <p>Congratulations! Your marketing partner registration is approved.</p>
          <div style="background-color: #FAF9F6; border: 1px solid #DDDAD1; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #666;">YOUR UNIQUE REFERRAL CODE:</p>
            <strong style="font-size: 20px; color: #07558F; letter-spacing: 1px;">${partner.referralCode}</strong>
            <p style="margin: 15px 0 5px 0; font-size: 13px; color: #666;">YOUR REFERRAL LINK:</p>
            <a href="${refUrl}" style="color: #07558F; word-break: break-all;">${refUrl}</a>
          </div>
          <p style="font-size: 13px; color: #444;">Prospective clients who visit through your link will have their enquiries attributed to your partner profile for 60 days.</p>
        </div>
      `,
    });

    return res.json({
      success: true,
      message: 'Partner approved successfully.',
      partner,
    });
  }

  if (action === 'reject') {
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Rejection reason is required.' });
    }
    partner.status = 'rejected';
    partner.rejectedAt = new Date();
    partner.rejectedBy = req.user._id;
    partner.rejectionReason = reason.trim();
    await partner.save();

    return res.json({
      success: true,
      message: 'Partner application rejected.',
      partner,
    });
  }

  if (action === 'suspend') {
    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'Suspension reason is required.' });
    }
    partner.status = 'suspended';
    partner.suspendedAt = new Date();
    partner.suspendedBy = req.user._id;
    partner.suspendedReason = reason.trim();
    await partner.save();

    return res.json({
      success: true,
      message: 'Partner suspended.',
      partner,
    });
  }

  res.status(400).json({ success: false, error: 'Invalid action. Expected approve, reject, or suspend.' });
};

/**
 * 6. Admin: Get Partner Detail, Referrals & Incentives
 * GET /api/partners/admin/:id
 */
export const getAdminPartnerDetail = async (req, res) => {
  const partner = await Partner.findById(req.params.id)
    .populate('approvedBy', 'name email')
    .lean();

  if (!partner) {
    return res.status(404).json({ success: false, error: 'Partner not found.' });
  }

  const [enquiries, incentives] = await Promise.all([
    Enquiry.find({ partnerId: partner._id })
      .sort({ createdAt: -1 })
      .select('name email phone type status attributionStatus conversionStatus conversionValuePaise createdAt')
      .lean(),
    PartnerIncentive.find({ partnerId: partner._id })
      .sort({ createdAt: -1 })
      .populate('approvedBy', 'name email')
      .populate('paidBy', 'name email')
      .lean(),
  ]);

  res.json({
    success: true,
    partner,
    enquiries,
    incentives,
  });
};

/**
 * 7. Admin: Mark Conversion on Referred Enquiry
 * PATCH /api/partners/admin/enquiries/:id/conversion
 */
export const markEnquiryConversion = async (req, res) => {
  const { contractValuePaise, notes } = req.body;
  const enquiry = await Enquiry.findById(req.params.id);

  if (!enquiry) {
    return res.status(404).json({ success: false, error: 'Enquiry not found.' });
  }

  if (!enquiry.partnerId) {
    return res.status(400).json({
      success: false,
      error: 'Cannot record partner conversion on a direct (unattributed) enquiry.',
    });
  }

  if (enquiry.attributionStatus !== 'attributed') {
    return res.status(400).json({
      success: false,
      error: `Cannot convert enquiry with attribution status "${enquiry.attributionStatus}".`,
    });
  }

  const partner = await Partner.findById(enquiry.partnerId);
  if (!partner || partner.status !== 'approved') {
    return res.status(400).json({
      success: false,
      error: 'Associated partner is not currently in approved status.',
    });
  }

  enquiry.conversionStatus = 'converted';
  enquiry.convertedAt = new Date();
  if (contractValuePaise && Number.isInteger(contractValuePaise)) {
    enquiry.conversionValuePaise = contractValuePaise;
  }
  await enquiry.save();

  // Amendment D: Check if incentive calculations are active
  const settings = await PartnerSettings.findOne({ key: 'global_partner_settings' }).lean();
  let incentiveRecord = null;

  if (settings && settings.isIncentiveCalculationActive) {
    // Generate unique idempotency key for this conversion accrual (Amendment C)
    const idempotencyKey = `PI-${enquiry._id}-ACCRUAL-${Date.now()}`;
    const rule = settings.activeRule || {};
    let amountPaise = 0;

    if (rule.basis === 'fixed') {
      amountPaise = rule.value || 0;
    } else if (rule.basis === 'percentage' && enquiry.conversionValuePaise) {
      amountPaise = Math.round((enquiry.conversionValuePaise * (rule.value || 0)) / 100);
    }

    incentiveRecord = await PartnerIncentive.create({
      idempotencyKey,
      partnerId: partner._id,
      enquiryId: enquiry._id,
      eventType: 'accrual',
      amountPaise,
      status: 'pending_approval',
      ruleSnapshot: {
        ruleId: rule.version || 'v1.0',
        version: rule.version || 'v1.0',
        basis: rule.basis || 'fixed',
        basisValue: rule.value || 0,
        qualifyingTrigger: rule.qualifyingTrigger || 'contract_signed',
        calculatedAt: new Date(),
      },
      createdBy: req.user._id,
      notes: notes || 'Conversion marked by admin',
      auditTrail: [
        {
          action: 'conversion_accrual',
          performedBy: req.user._id,
          timestamp: new Date(),
          meta: { contractValuePaise, ruleSnapshot: rule },
        },
      ],
    });
  }

  res.json({
    success: true,
    message: settings?.isIncentiveCalculationActive
      ? 'Enquiry marked as converted and incentive accrual recorded.'
      : 'Enquiry marked as converted. Incentive financial calculation remains disabled pending client approval.',
    enquiry,
    incentive: incentiveRecord,
  });
};

/**
 * 8. Admin: Mark Incentive Paid (Manual Payout)
 * POST /api/partners/admin/incentives/:id/mark-paid
 */
export const markIncentivePaid = async (req, res) => {
  const { paymentReference, notes } = req.body;

  if (!paymentReference || !paymentReference.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Bank UTR / payment reference is required to mark incentive paid.',
    });
  }

  const incentive = await PartnerIncentive.findById(req.params.id);

  if (!incentive) {
    return res.status(404).json({ success: false, error: 'Incentive ledger record not found.' });
  }

  if (incentive.status === 'paid') {
    return res.status(400).json({ success: false, error: 'This incentive has already been marked as paid.' });
  }

  incentive.status = 'paid';
  incentive.paidAt = new Date();
  incentive.paidBy = req.user._id;
  incentive.paymentReference = paymentReference.trim();
  if (notes) incentive.notes = notes.trim();

  incentive.auditTrail.push({
    action: 'marked_paid',
    performedBy: req.user._id,
    timestamp: new Date(),
    meta: { paymentReference: paymentReference.trim() },
  });

  await incentive.save();

  res.json({
    success: true,
    message: 'Incentive marked as paid successfully.',
    incentive,
  });
};

/**
 * 9. Admin: Export Incentives CSV
 * GET /api/partners/admin/incentives/export
 */
export const exportIncentivesCsv = async (req, res) => {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename=Neevevera_Partner_Incentives_${new Date().toISOString().slice(0, 10)}.csv`);
  res.setHeader('Cache-Control', 'no-store, private');

  const incentives = await PartnerIncentive.find({})
    .sort({ createdAt: -1 })
    .populate('partnerId', 'name referralCode email phone')
    .populate('enquiryId', 'name email phone type status')
    .populate('paidBy', 'name email')
    .lean();

  const headers = [
    'Ledger Key',
    'Date Created',
    'Partner Name',
    'Referral Code',
    'Event Type',
    'Amount (INR)',
    'Status',
    'Payment Reference',
    'Paid Date',
    'Lead Name',
    'Lead Type',
  ];

  const rows = incentives.map((i) => {
    const amountInr = ((i.amountPaise || 0) / 100).toFixed(2);
    const dateStr = i.createdAt ? new Date(i.createdAt).toISOString().slice(0, 10) : '';
    const paidDate = i.paidAt ? new Date(i.paidAt).toISOString().slice(0, 10) : '';

    return [
      `"${i.idempotencyKey || ''}"`,
      `"${dateStr}"`,
      `"${i.partnerId?.name || 'N/A'}"`,
      `"${i.partnerId?.referralCode || 'N/A'}"`,
      `"${i.eventType}"`,
      amountInr,
      `"${i.status}"`,
      `"${i.paymentReference || ''}"`,
      `"${paidDate}"`,
      `"${i.enquiryId?.name || 'N/A'}"`,
      `"${i.enquiryId?.type || 'N/A'}"`,
    ].join(',');
  });

  const csv = [headers.join(','), ...rows].join('\n');
  res.send(csv);
};

/**
 * 10. Admin: Get & Update Settings
 * GET /api/partners/admin/settings
 * PUT /api/partners/admin/settings
 */
export const getPartnerSettings = async (req, res) => {
  let settings = await PartnerSettings.findOne({ key: 'global_partner_settings' });
  if (!settings) {
    settings = await PartnerSettings.create({ key: 'global_partner_settings' });
  }
  res.json({ success: true, settings });
};

export const updatePartnerSettings = async (req, res) => {
  const { attributionWindowDays, isIncentiveCalculationActive, activeRule, termsNotice } = req.body;

  let settings = await PartnerSettings.findOne({ key: 'global_partner_settings' });
  if (!settings) {
    settings = new PartnerSettings({ key: 'global_partner_settings' });
  }

  if (attributionWindowDays) settings.attributionWindowDays = Math.max(1, Math.min(365, parseInt(attributionWindowDays, 10)));
  if (typeof isIncentiveCalculationActive === 'boolean') settings.isIncentiveCalculationActive = isIncentiveCalculationActive;
  if (activeRule && typeof activeRule === 'object') {
    settings.activeRule = { ...settings.activeRule, ...activeRule };
  }
  if (termsNotice) settings.termsNotice = termsNotice.trim();
  settings.updatedBy = req.user._id;

  await settings.save();
  res.json({ success: true, settings });
};

