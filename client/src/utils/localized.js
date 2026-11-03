import i18n from '../i18n';

/**
 * Returns localized text for a dynamic entity field if available in current language,
 * otherwise safely falls back to default English property.
 *
 * @param {Object} entity - The CMS data object (e.g. Service, Project, Article)
 * @param {string} field - Property name (e.g. 'title', 'description', 'shortDescription')
 * @param {string} [langOverride] - Optional explicit language code
 * @returns {string} - Localized or fallback string
 */
export function getLocalized(entity, field, langOverride) {
  if (!entity) return '';
  const currentLang = langOverride || i18n.language || 'en';
  
  if (currentLang !== 'en' && entity.translations && entity.translations[currentLang]) {
    const val = entity.translations[currentLang][field];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      return val;
    }
  }
  
  return entity[field] || '';
}

export default getLocalized;
