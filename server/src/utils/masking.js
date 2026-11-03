/**
 * server/src/utils/masking.js
 *
 * Safe phone-number masking utility for public API responses.
 *
 * Security & Privacy Rules:
 *  1. Indian mobile numbers (10 digits starting with 6-9, with optional +91, 91, or 0 prefix)
 *     are consistently formatted as: `+91 XX••••••YY` (e.g. `+91 98••••••45`).
 *  2. International numbers (e.g. +1, +44) preserve country prefix and last 2 digits,
 *     masking intermediate digits with bullet characters.
 *  3. Missing / empty / null / undefined inputs safely return an empty string ('').
 *  4. Malformed, incomplete, or short strings (< 7 digits) NEVER leak raw digits;
 *     they return a safe redacted placeholder ('••••••••••').
 *  5. This utility is for display privacy on public endpoints only; it must never be
 *     used as proof of identity, authentication, or location verification.
 */

const DEFAULT_MASK_CHAR = '•';

/**
 * Mask a telephone number safely.
 *
 * @param {string|number|null|undefined} input - Phone number string or numeric input.
 * @param {Object} [options]
 * @param {string} [options.maskChar='•'] - Character used for masking.
 * @returns {string} Masked phone number or empty string.
 */
export function maskPhone(input, options = {}) {
  if (input === null || input === undefined) return '';

  const str = String(input).trim();
  if (!str) return '';

  const maskChar = options.maskChar || DEFAULT_MASK_CHAR;

  // Extract purely digits
  const digitsOnly = str.replace(/\D/g, '');

  // If input contains too few digits to mask safely, do not leak raw input
  if (digitsOnly.length < 7) {
    return maskChar.repeat(10);
  }

  // Check for Indian mobile number patterns:
  // 1) Exactly 10 digits starting with [6-9]
  // 2) 11 digits starting with 0 followed by [6-9]
  // 3) 12 digits starting with 91 followed by [6-9]
  let indianTenDigit = null;

  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    indianTenDigit = digitsOnly;
  } else if (digitsOnly.length === 11 && digitsOnly.startsWith('0') && /^[6-9]/.test(digitsOnly.slice(1))) {
    indianTenDigit = digitsOnly.slice(1);
  } else if (digitsOnly.length === 12 && digitsOnly.startsWith('91') && /^[6-9]/.test(digitsOnly.slice(2))) {
    indianTenDigit = digitsOnly.slice(2);
  }

  if (indianTenDigit) {
    const first2 = indianTenDigit.slice(0, 2);
    const last2 = indianTenDigit.slice(-2);
    const middleMask = maskChar.repeat(6);
    return `+91 ${first2}${middleMask}${last2}`;
  }

  // International numbers or non-standard lengths (>= 7 digits)
  // Check if original had a '+' sign
  const hasPlus = str.startsWith('+');

  if (hasPlus) {
    // E.g. +1 415 555 2671 -> digits: 14155552671
    // Keep first 2-3 digits after + and last 2 digits
    const prefixLen = digitsOnly.length > 10 ? 3 : 2;
    const prefix = digitsOnly.slice(0, prefixLen);
    const suffix = digitsOnly.slice(-2);
    const maskLen = Math.max(4, digitsOnly.length - prefixLen - 2);
    return `+${prefix}${maskChar.repeat(maskLen)}${suffix}`;
  }

  // Generic numeric sequence without '+' prefix
  const prefix = digitsOnly.slice(0, 2);
  const suffix = digitsOnly.slice(-2);
  const maskLen = Math.max(4, digitsOnly.length - 4);
  return `${prefix}${maskChar.repeat(maskLen)}${suffix}`;
}

/**
 * Mask an object's phone properties shallowly.
 *
 * @param {Object} obj - Source object.
 * @param {string[]} [fields=['phone', 'customerPhone', 'mobile', 'contactPhone']]
 * @returns {Object} Clone of object with masked phone fields.
 */
export function maskSensitivePhoneFields(obj, fields = ['phone', 'customerPhone', 'mobile', 'contactPhone']) {
  if (!obj || typeof obj !== 'object') return obj;

  const result = { ...obj };
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(result, field) && result[field] !== undefined) {
      result[field] = maskPhone(result[field]);
    }
  }
  return result;
}

/**
 * Mask an email address safely for public API serializers.
 *
 * Examples:
 *   maskEmail('ramesh.das@example.com') => 'r••••••s@example.com'
 *   maskEmail('ab@domain.com')         => 'a•@domain.com'
 *   maskEmail('')                      => ''
 */
export function maskEmail(input, options = {}) {
  if (input === null || input === undefined) return '';
  const str = String(input).trim();
  if (!str) return '';

  const maskChar = options.maskChar || DEFAULT_MASK_CHAR;
  const atIndex = str.indexOf('@');
  if (atIndex <= 0) return maskChar.repeat(8);

  const localPart = str.slice(0, atIndex);
  const domainPart = str.slice(atIndex);

  if (localPart.length === 1) {
    return `${localPart}${maskChar}${domainPart}`;
  }
  if (localPart.length === 2) {
    return `${localPart[0]}${maskChar}${domainPart}`;
  }

  const firstChar = localPart[0];
  const lastChar = localPart[localPart.length - 1];
  const maskCount = Math.min(6, Math.max(2, localPart.length - 2));
  return `${firstChar}${maskChar.repeat(maskCount)}${lastChar}${domainPart}`;
}

export default {
  maskPhone,
  maskEmail,
  maskSensitivePhoneFields,
};
