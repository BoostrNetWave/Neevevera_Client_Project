import crypto from 'crypto';
import Partner from '../models/Partner.js';
import Enquiry from '../models/Enquiry.js';

/**
 * Normalizes phone numbers for deterministic collision & self-referral checking.
 * Strips formatting, extracts last 10 digits for Indian standard numbers.
 */
export function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return '';
  const cleaned = rawPhone.replace(/[^\d+]/g, '');
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits;
}

/**
 * Normalizes email address for deterministic collision checking.
 */
export function normalizeEmail(rawEmail) {
  if (!rawEmail || typeof rawEmail !== 'string') return '';
  return rawEmail.trim().toLowerCase();
}

/**
 * Generates high-entropy referral code: 'NV-' + 16 hex chars (64 bits).
 * Includes collision check with retry loop.
 */
export async function generateUniqueReferralCode() {
  const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // 31 unambiguous uppercase chars (no 0, O, 1, I)
  const maxAttempts = 10;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const bytes = crypto.randomBytes(6);
    let codeBody = '';
    for (let i = 0; i < 6; i++) {
      codeBody += ALPHABET[bytes[i] % ALPHABET.length];
    }
    const candidateCode = `NV-${codeBody}`;
    const exists = await Partner.findOne({ referralCode: candidateCode }).lean();
    if (!exists) {
      return candidateCode;
    }
  }
  // Fallback with timestamp salt if collision occurs repeatedly
  return `NV-${crypto.randomBytes(3).toString('hex').toUpperCase()}${Date.now().toString(36).slice(-3).toUpperCase()}`;
}

/**
 * Generates a high-entropy one-time verification token.
 * Returns raw token (sent once via email) and its SHA-256 hash (stored in DB).
 */
export function generateVerificationToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return { rawToken, tokenHash, expiresAt };
}

/**
 * Verifies a referral code against approved partners.
 * Returns partner document if approved, null otherwise.
 */
export async function verifyApprovedPartnerCode(code) {
  if (!code || typeof code !== 'string') return null;
  const cleanCode = code.trim().toUpperCase();
  return Partner.findOne({ referralCode: cleanCode, status: 'approved' });
}

/**
 * Server-Side Attribution Resolver (Amendment A & E)
 *
 * Rules:
 *  1. First-touch wins: Valid cookieRef takes precedence over client-supplied refCode.
 *  2. Self-referral prevention: Partner cannot refer themselves.
 *  3. Duplicate prevention: Existing lead cannot generate a second partner attribution.
 *  4. Returns clean, validated fields ready to assign to Enquiry.
 */
export async function resolveReferralAttribution({ refCode, cookieRef, phone, email }) {
  // First touch wins: prefer established server-validated cookie
  const candidateCode = (cookieRef || refCode || '').trim().toUpperCase();

  if (!candidateCode) {
    return {
      refCode: undefined,
      partnerId: null,
      referralCapturedAt: undefined,
      attributionStatus: 'direct',
    };
  }

  const partner = await Partner.findOne({ referralCode: candidateCode });

  // Code does not exist or partner is not currently approved
  if (!partner || partner.status !== 'approved') {
    return {
      refCode: candidateCode,
      partnerId: partner ? partner._id : null,
      referralCapturedAt: new Date(),
      attributionStatus: 'direct',
    };
  }

  const normLeadPhone = normalizePhone(phone);
  const normLeadEmail = normalizeEmail(email);

  // Self-referral check
  const isSelfPhone = normLeadPhone && partner.normalizedPhone && normLeadPhone === partner.normalizedPhone;
  const isSelfEmail = normLeadEmail && partner.normalizedEmail && normLeadEmail === partner.normalizedEmail;

  if (isSelfPhone || isSelfEmail) {
    return {
      refCode: partner.referralCode,
      partnerId: partner._id,
      referralCapturedAt: new Date(),
      attributionStatus: 'self_referral_blocked',
    };
  }

  // Duplicate lead check: Check if phone or email already exists in prior enquiries
  const leadQuery = [];
  if (normLeadEmail) leadQuery.push({ email: normLeadEmail });
  if (normLeadPhone) leadQuery.push({ phone: new RegExp(`${normLeadPhone}$`) });

  if (leadQuery.length > 0) {
    const existingEnquiry = await Enquiry.findOne({ $or: leadQuery }).lean();
    if (existingEnquiry) {
      return {
        refCode: partner.referralCode,
        partnerId: partner._id,
        referralCapturedAt: new Date(),
        attributionStatus: 'duplicate_blocked',
      };
    }
  }

  // Attribution verified
  return {
    refCode: partner.referralCode,
    partnerId: partner._id,
    referralCapturedAt: new Date(),
    attributionStatus: 'attributed',
  };
}

