// ============================================================================
// Device identity — a self-declared phone number + name kept in localStorage.
//
// There is no SMS/OTP provider wired into this project, so the phone number is
// NOT verified; it simply acts as a stable user id that ties every ticket from
// this device together, and lets a returning citizen reuse their name and look
// up past complaints. (Swap point: add OTP verification here if a provider is
// introduced later.)
// ============================================================================

const KEY = 'adhikar.identity.v1';
const LANG_KEY = 'adhikar.lang.v1';

export interface DeviceIdentity {
  phone: string;
  name: string;
}

export function getDeviceIdentity(): DeviceIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DeviceIdentity>;
    if (!parsed || !parsed.phone) return null;
    return { phone: parsed.phone, name: parsed.name || '' };
  } catch {
    return null;
  }
}

export function saveDeviceIdentity(id: DeviceIdentity): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(id));
  } catch {
    /* storage unavailable (private mode) — flow still works for this session */
  }
}

// Update just the stored name (used when a returning citizen picks a new name).
export function updateStoredName(name: string): void {
  const cur = getDeviceIdentity();
  if (cur) saveDeviceIdentity({ ...cur, name });
}

// Keep only the digits of whatever the citizen typed, so a variety of formats
// (+91, spaces, dashes) normalise to a single comparable id.
export function normalizePhone(raw: string): string {
  return (raw || '').replace(/\D/g, '');
}

// ---- Preferred language (persisted so we only ask once) --------------------
// Stored separately from the identity because the citizen chooses a language
// before giving a phone number, and it must survive across sessions. The
// top-right toggle in the chat header updates this via saveStoredLang().
export function getStoredLang(): string | null {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v || null;
  } catch {
    return null;
  }
}

export function saveStoredLang(lang: string): void {
  try {
    if (lang) localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* storage unavailable — language still applies for this session */
  }
}

// ---- Spoken-name extraction ------------------------------------------------
// A voice/typed answer to "what's your name?" often arrives as a sentence like
// "my name is Praveen" / "मेरा नाम प्रवीण है" / "నా పేరు రవి". Strip the common
// lead-in and trailing copula across the supported languages so we store just
// the name. If nothing recognisable is stripped, the input is returned as-is.
const NAME_LEADINS: string[] = [
  // English
  'my name is', 'name is', 'i am called', 'they call me', 'i am', "i'm",
  'this is', 'myself', 'call me',
  // Hindi / Urdu (Devanagari + roman)
  'मेरा नाम है', 'मेरा नाम', 'हमारा नाम है', 'हमारा नाम', 'मेरा नाम है ',
  'mera naam hai', 'mera naam', 'naam hai', 'main hoon', 'main',
  'میرا نام ہے', 'میرا نام',
  // Telugu
  'నా పేరు', 'నా పేరు ',
  // Tamil
  'என் பெயர்', 'எனது பெயர்',
  // Bengali / Assamese
  'আমার নাম', 'মোৰ নাম',
  // Marathi
  'माझे नाव', 'माझं नाव',
  // Gujarati
  'મારું નામ', 'મારુ નામ',
  // Punjabi
  'ਮੇਰਾ ਨਾਮ',
  // Kannada
  'ನನ್ನ ಹೆಸರು',
  // Malayalam
  'എന്റെ പേര്', 'എന്റെ പേരു',
  // Odia
  'ମୋ ନାମ',
].sort((a, b) => b.length - a.length);

const NAME_TRAILERS = new Set([
  'है', 'हूँ', 'हूं', 'हैं', 'hai', 'hoon', 'hu', 'ہے',
  'ఉంది', 'ఆకున', 'ஆகும்', 'ਹੈ', 'আছে', 'ছে', 'आहे',
]);

export function parseSpokenName(raw: string): string {
  let s = (raw || '').trim().replace(/[।.,!?]+$/g, '').trim();
  if (!s) return '';

  // Strip a recognised lead-in phrase from the start (case-insensitive).
  const lower = s.toLowerCase();
  for (const lead of NAME_LEADINS) {
    if (lower.startsWith(lead)) {
      s = s.slice(lead.length).replace(/^[\s:,-]+/, '').trim();
      break;
    }
  }

  // Drop a trailing copula ("...प्रवीण है" → "...प्रवीण").
  let tokens = s.split(/\s+/).filter(Boolean);
  while (tokens.length > 1) {
    const last = tokens[tokens.length - 1].replace(/[।.,!?]/g, '').toLowerCase();
    if (NAME_TRAILERS.has(last)) tokens.pop();
    else break;
  }
  s = tokens.join(' ').trim();

  if (!s) return (raw || '').trim();

  // Tidy Latin-script names to Title Case (speech usually returns lowercase).
  if (/^[\x20-\x7E]+$/.test(s)) {
    s = s.replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return s;
}
