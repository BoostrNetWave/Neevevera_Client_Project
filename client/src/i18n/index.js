import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enCommon from '../locales/en/common.json';
import hiCommon from '../locales/hi/common.json';
import orCommon from '../locales/or/common.json';
import bnCommon from '../locales/bn/common.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'EN', fullName: 'English', nativeName: 'English' },
  { code: 'hi', label: 'HI', fullName: 'Hindi',   nativeName: 'हिन्दी' },
  { code: 'or', label: 'OD', fullName: 'Odia',    nativeName: 'ଓଡ଼ିଆ' },
  { code: 'bn', label: 'BN', fullName: 'Bengali', nativeName: 'বাংলা' },
];

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
