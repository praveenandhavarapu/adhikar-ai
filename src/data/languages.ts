// Languages offered in the citizen flow (ported from prototype).
export interface Lang { code: string; native: string; roman: string; }

export const LANGS: Lang[] = [
  { code: 'hi', native: 'हिंदी', roman: 'Hindi' },
  { code: 'ta', native: 'தமிழ்', roman: 'Tamil' },
  { code: 'te', native: 'తెలుగు', roman: 'Telugu' },
  { code: 'bn', native: 'বাংলা', roman: 'Bengali' },
  { code: 'or', native: 'ଓଡ଼ିଆ', roman: 'Odia' },
  { code: 'mr', native: 'मराठी', roman: 'Marathi' },
  { code: 'gu', native: 'ગુજરાતી', roman: 'Gujarati' },
  { code: 'pa', native: 'ਪੰਜਾਬੀ', roman: 'Punjabi' },
  { code: 'kn', native: 'ಕನ್ನಡ', roman: 'Kannada' },
  { code: 'ml', native: 'മലയാളം', roman: 'Malayalam' },
  { code: 'ur', native: 'اردو', roman: 'Urdu' },
  { code: 'as', native: 'অসমীয়া', roman: 'Assamese' },
  { code: 'bh', native: 'भोजपुरी', roman: 'Bhojpuri' },
  { code: 'mai', native: 'मैथिली', roman: 'Maithili' },
  { code: 'en', native: 'English', roman: 'English' },
  { code: 'other', native: 'Other', roman: 'Not listed here' },
];

export const langLabel = (code: string): string => {
  const l = LANGS.find((x) => x.code === code);
  return l ? l.roman : 'English';
};

export const langCodeShort = (code: string): string => {
  const m: Record<string, string> = {
    hi: 'HI', te: 'TE', ta: 'TA', bn: 'BN', en: 'EN', or: 'OR', mr: 'MR',
    gu: 'GU', pa: 'PA', kn: 'KN', ml: 'ML', ur: 'UR', as: 'AS', bh: 'BH', mai: 'MAI',
  };
  return m[code] || 'EN';
};

// Languages with full localized copy. Others fall back to Hindi for UI copy
// while the AI still understands and replies in the citizen's actual language.
export const resolveLang = (code: string): string => {
  if (code === 'other' || code === 'en') return 'en';
  return ['hi', 'te', 'ta', 'bn'].includes(code) ? code : 'hi';
};
