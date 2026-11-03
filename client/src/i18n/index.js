import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import hiCommon from '../locales/hi/common.json';
import orCommon from '../locales/or/common.json';
import bnCommon from '../locales/bn/common.json';

/**
 * Technical Translation Review Guard:
 * Machine-translated technical, civil engineering, and legal text presents commercial liability.
 * By default in production, only human-reviewed languages (English) are exposed in the UI.
 * Regional translations (Hindi, Odia, Bengali) remain preserved in the codebase and can be
 * enabled for internal testing via VITE_ENABLE_UNREVIEWED_LANGUAGES=true once approved by client editors.
 */
const enableUnreviewed = typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_UNREVIEWED_LANGUAGES === 'true';

export const ALL_LANGUAGES = [
  { code: 'en', label: 'EN', fullName: 'English', nativeName: 'English', reviewed: true },
  { code: 'hi', label: 'HI', fullName: 'Hindi',   nativeName: 'हिन्दी', reviewed: false },
  { code: 'or', label: 'OD', fullName: 'Odia',    nativeName: 'ଓଡ଼ିଆ',   reviewed: false },
  { code: 'bn', label: 'BN', fullName: 'Bengali', nativeName: 'বাংলা',   reviewed: false },
];

export const SUPPORTED_LANGUAGES = enableUnreviewed
  ? ALL_LANGUAGES
  : ALL_LANGUAGES.filter(l => l.reviewed);

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('neevevera-language') : null;
const initialLang = SUPPORTED_LANGUAGES.some(l => l.code === savedLang) ? savedLang : 'en';

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLang;
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { common: enCommon },
      hi: { common: hiCommon },
      or: { common: orCommon },
      bn: { common: bnCommon },
    },
    lng: initialLang,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

export const selectLanguage = async (code) => {
  if (!SUPPORTED_LANGUAGES.some(l => l.code === code)) return;
  await i18n.changeLanguage(code);
  if (typeof window !== 'undefined') {
    localStorage.setItem('neevevera-language', code);
    document.documentElement.lang = code;
  }
};

export default i18n;
