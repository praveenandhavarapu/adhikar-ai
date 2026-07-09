// ============================================================================
// Officer-dashboard i18n (O4). A single t(key) dictionary for all dashboard
// chrome — reused from the same enum-key idea as the citizen chat. English is
// complete and the fallback; Hindi + Telugu are provided as representative
// full translations (add a language by dropping in another table).
//
// Dynamic ticket content (citizen grievance text) is NOT translated here — that
// goes through the cached translate layer (see lib/api.translateText / C4).
// ============================================================================
import { createContext, useContext } from 'react';

// Stable UI keys. Keep flat + kebab/dot-free so tables stay readable.
const EN = {
  // chrome / nav
  appTitle: 'AdhikarAI · District Desk',
  navHome: 'Home',
  navTickets: 'Tickets',
  back: 'Roles',
  refresh: 'Refresh',
  language: 'Language',
  change: 'Change',
  // entry flow (O2)
  selectOfficeTitle: 'Select your office',
  selectOfficeSub: 'Choose the office you are triaging for.',
  allOffices: 'All offices',
  officerPhoneTitle: 'Your phone number',
  officerPhoneSub: 'Identifies you for leaderboard attribution.',
  officerPhonePh: 'Enter your 10-digit phone number',
  continue: 'Continue',
  selectCategoryTitle: 'Filter by scheme / category',
  selectCategorySub: 'Narrow the ticket list, or view all.',
  allCategories: 'All categories',
  scope: 'Scope',
  // ticket workspace
  searchPh: 'Search name, district, ID…',
  all: 'All',
  open: 'Open',
  inProgress: 'In progress',
  escalated: 'Escalated',
  resolved: 'Resolved',
  noMatch: 'No tickets match this filter.',
  loading: 'Loading tickets…',
  loadError: 'Could not load tickets. Check that the database is configured.',
  selectTicket: 'Select a ticket to view details.',
  citizenWords: 'Citizen’s words',
  officerSummary: 'Officer summary (English)',
  structured: 'Structured details',
  aiAnalysis: 'AI ANALYSIS',
  rootCause: 'Likely root cause',
  suggestedAction: 'Suggested action',
  crossScheme: 'Other benefits likely affected',
  noAnalysis: 'No analysis was generated for this ticket.',
  regenerate: 'Regenerate analysis',
  regenerating: 'Regenerating…',
  regenError: 'Could not regenerate analysis. Try again.',
  voiceNote: 'Citizen voice note',
  statusHistory: 'Status history',
  currentlyWith: 'Currently with',
  routedTo: 'Routed to',
  contact: 'Contact',
  // actions
  markProgress: 'Mark in progress',
  resolve: 'Resolve',
  escalate: 'Escalate to state',
  route: 'Route ticket',
  // routing (O3)
  routeTitle: 'Route this ticket',
  recommended: 'Recommended',
  recommendedRoute: 'Recommended: route to {office}',
  acceptRec: 'Accept recommendation',
  overrideOffice: 'Or route to a different office',
  commentLabel: 'Reason / comment (required)',
  commentPh: 'Why are you routing this? (type “N/A” if none)',
  commentRequired: 'A comment is required — type a reason or “N/A”.',
  confirmRoute: 'Confirm route',
  cancel: 'Cancel',
  trail: 'Tracking trail',
  // home (O5)
  monthlyTarget: 'Monthly target',
  resolvedOfTarget: '{n} of {target} resolved',
  remaining: '{n} remaining',
  officeLeaderboard: 'Office leaderboard',
  raised: 'Raised',
  resolutionRate: 'Resolution rate',
  yourOffice: 'Your office',
  rank: 'Rank',
  streak: 'Streak',
  streakDays: '{n}-day streak',
  avgResolution: 'Avg resolution time',
  resolvedThisMonth: 'Resolved this month',
  trend30: 'Resolved · last 30 days',
  badges: 'Milestones',
  slaAging: 'Ageing tickets',
  slaAgingNudge: '{n} tickets past the age threshold — act soon.',
  days: 'days',
  hours: 'h',
};

export type UiKey = keyof typeof EN;

const HI: Partial<Record<UiKey, string>> = {
  appTitle: 'अधिकारAI · जिला डेस्क',
  navHome: 'होम', navTickets: 'शिकायतें', back: 'भूमिकाएँ', refresh: 'रिफ्रेश',
  language: 'भाषा', change: 'बदलें',
  selectOfficeTitle: 'अपना कार्यालय चुनें',
  selectOfficeSub: 'जिस कार्यालय के लिए आप ट्राइएज कर रहे हैं उसे चुनें।',
  allOffices: 'सभी कार्यालय',
  officerPhoneTitle: 'आपका फ़ोन नंबर',
  officerPhoneSub: 'लीडरबोर्ड के लिए आपकी पहचान।',
  officerPhonePh: 'अपना 10 अंकों का फ़ोन नंबर लिखें',
  continue: 'आगे बढ़ें',
  selectCategoryTitle: 'योजना / श्रेणी से छाँटें',
  selectCategorySub: 'सूची सीमित करें, या सभी देखें।',
  allCategories: 'सभी श्रेणियाँ', scope: 'दायरा',
  searchPh: 'नाम, जिला, ID खोजें…',
  all: 'सभी', open: 'खुली', inProgress: 'प्रगति पर', escalated: 'एस्केलेट', resolved: 'हल',
  noMatch: 'इस फ़िल्टर से कोई शिकायत नहीं मिली।', loading: 'शिकायतें लोड हो रही हैं…',
  loadError: 'शिकायतें लोड नहीं हो सकीं। डेटाबेस कॉन्फ़िगरेशन जाँचें।',
  selectTicket: 'विवरण देखने के लिए शिकायत चुनें।',
  citizenWords: 'नागरिक के शब्द', officerSummary: 'अधिकारी सारांश (अंग्रेज़ी)',
  structured: 'संरचित विवरण', aiAnalysis: 'AI विश्लेषण', rootCause: 'संभावित मूल कारण',
  suggestedAction: 'सुझाई गई कार्रवाई', crossScheme: 'अन्य प्रभावित लाभ',
  noAnalysis: 'इस शिकायत के लिए विश्लेषण नहीं बना।', regenerate: 'विश्लेषण फिर बनाएँ',
  regenerating: 'बना रहे हैं…', regenError: 'विश्लेषण दोबारा नहीं बना। फिर प्रयास करें।',
  voiceNote: 'नागरिक वॉइस नोट', statusHistory: 'स्थिति इतिहास', currentlyWith: 'अभी किसके पास',
  routedTo: 'भेजा गया', contact: 'संपर्क',
  markProgress: 'प्रगति पर चिह्नित करें', resolve: 'हल करें', escalate: 'राज्य को भेजें',
  route: 'शिकायत भेजें', routeTitle: 'यह शिकायत भेजें', recommended: 'अनुशंसित',
  recommendedRoute: 'अनुशंसा: {office} को भेजें', acceptRec: 'अनुशंसा स्वीकारें',
  overrideOffice: 'या किसी अन्य कार्यालय को भेजें', commentLabel: 'कारण / टिप्पणी (आवश्यक)',
  commentPh: 'इसे क्यों भेज रहे हैं? (कोई नहीं तो “N/A” लिखें)',
  commentRequired: 'टिप्पणी आवश्यक है — कारण या “N/A” लिखें।', confirmRoute: 'भेजना पुष्टि करें',
  cancel: 'रद्द करें', trail: 'ट्रैकिंग ट्रेल',
  monthlyTarget: 'मासिक लक्ष्य', resolvedOfTarget: '{target} में से {n} हल',
  remaining: '{n} शेष', officeLeaderboard: 'कार्यालय लीडरबोर्ड', raised: 'दर्ज',
  resolutionRate: 'समाधान दर', yourOffice: 'आपका कार्यालय', rank: 'रैंक', streak: 'लगातार',
  streakDays: '{n} दिन लगातार', avgResolution: 'औसत समाधान समय', resolvedThisMonth: 'इस माह हल',
  trend30: 'हल · पिछले 30 दिन', badges: 'उपलब्धियाँ', slaAging: 'पुरानी शिकायतें',
  slaAgingNudge: '{n} शिकायतें अवधि सीमा पार — जल्द कार्रवाई करें।', days: 'दिन', hours: 'घं',
};

const TE: Partial<Record<UiKey, string>> = {
  appTitle: 'అధికార్AI · జిల్లా డెస్క్',
  navHome: 'హోమ్', navTickets: 'ఫిర్యాదులు', back: 'పాత్రలు', refresh: 'రిఫ్రెష్',
  language: 'భాష', change: 'మార్చు',
  selectOfficeTitle: 'మీ కార్యాలయాన్ని ఎంచుకోండి',
  selectOfficeSub: 'మీరు ట్రయాజ్ చేస్తున్న కార్యాలయాన్ని ఎంచుకోండి.',
  allOffices: 'అన్ని కార్యాలయాలు',
  officerPhoneTitle: 'మీ ఫోన్ నంబర్',
  officerPhoneSub: 'లీడర్‌బోర్డ్ కోసం మీ గుర్తింపు.',
  officerPhonePh: 'మీ 10 అంకెల ఫోన్ నంబర్ నమోదు చేయండి',
  continue: 'కొనసాగించు',
  selectCategoryTitle: 'పథకం / వర్గం ద్వారా వడపోత',
  selectCategorySub: 'జాబితాను తగ్గించండి, లేదా అన్నీ చూడండి.',
  allCategories: 'అన్ని వర్గాలు', scope: 'పరిధి',
  searchPh: 'పేరు, జిల్లా, ID వెతకండి…',
  all: 'అన్నీ', open: 'తెరిచి', inProgress: 'ప్రగతిలో', escalated: 'ఎస్కలేట్', resolved: 'పరిష్కృతం',
  noMatch: 'ఈ వడపోతకు ఫిర్యాదులు లేవు.', loading: 'ఫిర్యాదులు లోడ్ అవుతున్నాయి…',
  loadError: 'ఫిర్యాదులు లోడ్ కాలేదు. డేటాబేస్ కాన్ఫిగరేషన్ తనిఖీ చేయండి.',
  selectTicket: 'వివరాలు చూడటానికి ఫిర్యాదును ఎంచుకోండి.',
  citizenWords: 'పౌరుని మాటలు', officerSummary: 'అధికారి సారాంశం (ఇంగ్లీష్)',
  structured: 'నిర్మాణాత్మక వివరాలు', aiAnalysis: 'AI విశ్లేషణ', rootCause: 'సంభావ్య మూల కారణం',
  suggestedAction: 'సూచించిన చర్య', crossScheme: 'ప్రభావిత ఇతర ప్రయోజనాలు',
  noAnalysis: 'ఈ ఫిర్యాదుకు విశ్లేషణ రూపొందలేదు.', regenerate: 'విశ్లేషణ మళ్ళీ రూపొందించు',
  regenerating: 'రూపొందిస్తోంది…', regenError: 'విశ్లేషణ మళ్ళీ రాలేదు. మళ్ళీ ప్రయత్నించండి.',
  voiceNote: 'పౌర వాయిస్ నోట్', statusHistory: 'స్థితి చరిత్ర', currentlyWith: 'ప్రస్తుతం ఎవరి వద్ద',
  routedTo: 'పంపబడింది', contact: 'సంప్రదింపు',
  markProgress: 'ప్రగతిలో గుర్తించు', resolve: 'పరిష్కరించు', escalate: 'రాష్ట్రానికి పంపు',
  route: 'ఫిర్యాదు పంపు', routeTitle: 'ఈ ఫిర్యాదును పంపు', recommended: 'సిఫార్సు',
  recommendedRoute: 'సిఫార్సు: {office}కు పంపండి', acceptRec: 'సిఫార్సును అంగీకరించు',
  overrideOffice: 'లేదా వేరే కార్యాలయానికి పంపు', commentLabel: 'కారణం / వ్యాఖ్య (తప్పనిసరి)',
  commentPh: 'దీన్ని ఎందుకు పంపుతున్నారు? (ఏమీ లేకపోతే “N/A”)',
  commentRequired: 'వ్యాఖ్య తప్పనిసరి — కారణం లేదా “N/A” రాయండి.', confirmRoute: 'పంపడాన్ని ధృవీకరించు',
  cancel: 'రద్దు', trail: 'ట్రాకింగ్ ట్రెయిల్',
  monthlyTarget: 'నెలవారీ లక్ష్యం', resolvedOfTarget: '{target}లో {n} పరిష్కృతం',
  remaining: '{n} మిగిలి', officeLeaderboard: 'కార్యాలయ లీడర్‌బోర్డ్', raised: 'నమోదు',
  resolutionRate: 'పరిష్కార రేటు', yourOffice: 'మీ కార్యాలయం', rank: 'ర్యాంక్', streak: 'వరుస',
  streakDays: '{n} రోజుల వరుస', avgResolution: 'సగటు పరిష్కార సమయం', resolvedThisMonth: 'ఈ నెల పరిష్కృతం',
  trend30: 'పరిష్కృతం · గత 30 రోజులు', badges: 'మైలురాళ్ళు', slaAging: 'పాత ఫిర్యాదులు',
  slaAgingNudge: '{n} ఫిర్యాదులు గడువు దాటాయి — త్వరగా చర్య తీసుకోండి.', days: 'రోజులు', hours: 'గం',
};

const UI: Record<string, Partial<Record<UiKey, string>>> = { en: EN, hi: HI, te: TE };

// Translate a UI key into `lang` with English fallback + {var} interpolation.
export function t(lang: string, key: UiKey, vars?: Record<string, string | number>): string {
  const table = UI[lang] || EN;
  let s = table[key] ?? EN[key] ?? key;
  if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
  return s;
}

// ---- officer language persistence + context --------------------------------
const OFF_LANG_KEY = 'adhikar.officer.lang.v1';

export function getOfficerLang(): string {
  try { return localStorage.getItem(OFF_LANG_KEY) || 'en'; } catch { return 'en'; }
}
export function saveOfficerLang(lang: string): void {
  try { localStorage.setItem(OFF_LANG_KEY, lang); } catch { /* no-op */ }
}

export interface LocaleCtx {
  lang: string;
  setLang: (l: string) => void;
  t: (key: UiKey, vars?: Record<string, string | number>) => string;
}

export const LocaleContext = createContext<LocaleCtx>({
  lang: 'en',
  setLang: () => {},
  t: (key, vars) => t('en', key, vars),
});

export const useLocale = (): LocaleCtx => useContext(LocaleContext);
