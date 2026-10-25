import { createRequire } from 'module';
import axios from 'axios';

const require = createRequire(import.meta.url);
// pdf-parse is CommonJS-only; use createRequire so Node can load it in an ESM context.
// It exports a single default async function: pdfParse(buffer) → { text, numpages, ... }
let pdfParse;
try {
  pdfParse = require('pdf-parse');
} catch {
  pdfParse = null;
}

/**
 * Normalizes text for keyword matching:
 * - Lowercase
 * - Replaces non-alphanumeric separators (e.g., dots, dashes, slashes) with spaces
 * - Collapses multiple whitespace
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .replace(/[._\-/\\,;:()[\]{}]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if a skill keyword/phrase is present in the candidate text.
 * Handles both single-word terms and multi-word phrases (e.g. "AutoCAD", "STAAD Pro", "RCC Design").
 */
export function matchesSkill(candidateTextNormalized, skill) {
  if (!skill || typeof skill !== 'string') return false;
  const normalizedSkill = normalizeText(skill);
  if (!normalizedSkill) return false;

  // Exact phrase search in normalized text with word-boundary awareness
  const escaped = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i');
  return regex.test(candidateTextNormalized);
}

/**
 * Evaluates candidate text against required and preferred skills.
 * Formula:
 *   Overall Score = 0.70 * (Required Match Ratio) + 0.30 * (Preferred Match Ratio)
 * 
 * @param {string} candidateText - Plain text extracted from resume or cover letter/notes
 * @param {string[]} requiredSkills - List of required skill strings
 * @param {string[]} preferredSkills - List of preferred skill strings
 * @returns {object} Evaluation breakdown with scores, matched, missing, and formula explanation
 */
export function evaluateSkills(candidateText = '', requiredSkills = [], preferredSkills = []) {
  const normText = normalizeText(candidateText);

  // Filter out any empty skill strings
  const reqList = (Array.isArray(requiredSkills) ? requiredSkills : [])
    .map(s => String(s).trim())
    .filter(Boolean);

  const prefList = (Array.isArray(preferredSkills) ? preferredSkills : [])
    .map(s => String(s).trim())
    .filter(Boolean);

  const matchedRequired = [];
  const missingRequired = [];
  for (const skill of reqList) {
    if (matchesSkill(normText, skill)) {
      matchedRequired.push(skill);
    } else {
      missingRequired.push(skill);
    }
  }

  const matchedPreferred = [];
  const missingPreferred = [];
  for (const skill of prefList) {
    if (matchesSkill(normText, skill)) {
      matchedPreferred.push(skill);
    } else {
      missingPreferred.push(skill);
    }
  }

  const reqTotal = reqList.length;
  const prefTotal = prefList.length;

  const reqRatio = reqTotal > 0 ? (matchedRequired.length / reqTotal) : 1;
  const prefRatio = prefTotal > 0 ? (matchedPreferred.length / prefTotal) : 1;

  let overallScoreRatio;
  if (reqTotal > 0 && prefTotal > 0) {
    overallScoreRatio = (0.70 * reqRatio) + (0.30 * prefRatio);
  } else if (reqTotal > 0) {
    overallScoreRatio = reqRatio;
  } else if (prefTotal > 0) {
    overallScoreRatio = prefRatio;
  } else {
    overallScoreRatio = 0;
  }

  const overallScore = Math.round(overallScoreRatio * 100);
  const requiredScore = Math.round(reqRatio * 100);
  const preferredScore = Math.round(prefRatio * 100);

  return {
    overallScore,
    requiredScore,
    preferredScore,
    matchedRequired,
    missingRequired,
    matchedPreferred,
    missingPreferred,
    totalRequired: reqTotal,
    totalPreferred: prefTotal,
    formula: 'Overall Score = 0.70 * (Required Match) + 0.30 * (Preferred Match)',
    explanation: reqTotal > 0 && prefTotal > 0
      ? `Overall: ${overallScore}% [Required: 70% × (${matchedRequired.length}/${reqTotal}) = ${Math.round(0.70 * reqRatio * 100)}% + Preferred: 30% × (${matchedPreferred.length}/${prefTotal}) = ${Math.round(0.30 * prefRatio * 100)}%]`
      : reqTotal > 0
      ? `Overall: ${overallScore}% [Required Match: ${matchedRequired.length}/${reqTotal}]`
      : prefTotal > 0
      ? `Overall: ${overallScore}% [Preferred Match: ${matchedPreferred.length}/${prefTotal}]`
      : 'No skills specified for comparison.',
  };
}

/**
 * Extracts raw text from a PDF Buffer using pdf-parse.
 * pdfParse(buffer) resolves to { text, numpages, numrender, info, metadata, version }
 */
export async function extractTextFromPdfBuffer(buffer) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error('Valid PDF Buffer is required for extraction.');
  }
  if (!pdfParse) {
    console.warn('[extractTextFromPdfBuffer] pdf-parse not available; skipping extraction.');
    return '';
  }
  try {
    const result = await pdfParse(buffer);
    return result?.text || '';
  } catch (err) {
    console.warn('[extractTextFromPdfBuffer] Parse warning:', err.message);
    return '';
  }
}

/**
 * Fetches remote PDF URL and extracts text.
 */
export async function extractTextFromUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 20000,
  });
  return extractTextFromPdfBuffer(Buffer.from(response.data));
}
