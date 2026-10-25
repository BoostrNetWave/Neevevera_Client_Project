/**
 * Normalizes text for matching:
 * - Lowercase
 * - Replaces non-alphanumeric punctuation with spaces
 * - Collapses repeated spaces
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
 * Checks if a skill keyword/phrase exists in the text.
 * Supports multi-word expressions like "AutoCAD", "STAAD Pro", "RCC Design".
 */
export function matchesSkill(candidateTextNormalized, skill) {
  if (!skill || typeof skill !== 'string') return false;
  const normalizedSkill = normalizeText(skill);
  if (!normalizedSkill) return false;

  const escaped = normalizedSkill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(?:^|\\s)${escaped}(?:\\s|$)`, 'i');
  return regex.test(candidateTextNormalized);
}

/**
 * Calculates skill match score based on user specification:
 * Overall Score = 0.70 * (Required Match) + 0.30 * (Preferred Match)
 * 
 * @param {string} candidateText - Combined candidate resume / notes text
 * @param {string[]} requiredSkills - Required skill keywords
 * @param {string[]} preferredSkills - Preferred skill keywords
 * @returns {object} Detailed score breakdown and matched/missing skill lists
 */
export function calculateSkillMatch(candidateText = '', requiredSkills = [], preferredSkills = []) {
  const normText = normalizeText(candidateText);

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

  let overallRatio;
  if (reqTotal > 0 && prefTotal > 0) {
    overallRatio = (0.70 * reqRatio) + (0.30 * prefRatio);
  } else if (reqTotal > 0) {
    overallRatio = reqRatio;
  } else if (prefTotal > 0) {
    overallRatio = prefRatio;
  } else {
    overallRatio = 0;
  }

  const overallScore = Math.round(overallRatio * 100);
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
    hasSkills: reqTotal > 0 || prefTotal > 0,
    formula: 'Overall Score = 0.70 * (Required Match) + 0.30 * (Preferred Match)',
    explanation: reqTotal > 0 && prefTotal > 0
      ? `70% × (${matchedRequired.length}/${reqTotal} Req) + 30% × (${matchedPreferred.length}/${prefTotal} Pref) = ${overallScore}%`
      : reqTotal > 0
      ? `100% Required Match: ${matchedRequired.length}/${reqTotal} (${overallScore}%)`
      : prefTotal > 0
      ? `100% Preferred Match: ${matchedPreferred.length}/${prefTotal} (${overallScore}%)`
      : 'No required/preferred skills defined for this position.',
  };
}
