// ============================================================================
// Localized UI strings for the citizen chat.
//
// STR  — full sentences the bot speaks (one table per language).
// OPT  — short labels for multiple-choice chip *values* (shared across
//        questions), so no chip ever falls back to English mid-conversation.
// ROW  — summary-card row headers.
//
// Every language listed in data/languages.ts has an entry. Bhojpuri (bh) and
// Maithili (mai) intentionally reuse the Hindi tables — they are close enough
// that Hindi is the natural default when a distinct word isn't available.
// Anything genuinely missing falls back to English via the helpers at the end.
// ============================================================================

export type StrKey = keyof typeof STR_EN;

const STR_EN = {
  greet: "Namaste! I'm AdhikarAI, your welfare grievance assistant. Let's raise your complaint together.",
  askPhone: "First, please share your phone number. We'll use it to keep all your complaints in one place.",
  phonePh: "Enter your 10-digit phone number",
  askName: "Thank you. And what's your name?",
  namePh: "Type your name",
  askContinueName: "Welcome back, {n}. Shall we continue with this name?",
  keepName: "Yes, continue as {n}",
  changeName: "No, use a different name",
  askFlowChoice: "What would you like to do today?",
  optNewTicket: "Raise a new complaint",
  optTrackTicket: "Track an old complaint",
  noTickets: "You don't have any earlier complaints yet. Let's raise your first one.",
  trackSelectTitle: "Select a complaint to see its status",
  tStatusLabel: "Current status",
  tOfficeLabel: "Currently with",
  tUpdatesLabel: "Updates so far",
  tNoUpdates: "No updates yet — your complaint is in the queue.",
  tOpenedOn: "Raised on",
  stOpen: "Open — awaiting officer",
  stProgress: "In progress",
  stEscalated: "Escalated to senior officer",
  stResolved: "Resolved",
  askState: "Which state are you in?",
  askDistrict: "And which district?",
  askScheme: "Which benefit are you having difficulty with?",
  askIssue: "What issue are you facing?",
  voicePrompt: "Tell me in your own words — what happened, when and where, and what you'd like resolved. Type, or tap the mic to send a voice note.",
  micHint: "Tap the mic to record a voice note instead of typing.",
  askVoiceConsent: "Shall I record this as a voice note in your language?",
  vYes: "Yes, record my voice",
  vNo: "No, I'll type it",
  recTap: "Tap the button and speak. Tap again when you're done.",
  recStop: "Recording… tap to stop",
  recSending: "Saving your voice note…",
  recFail: "I couldn't catch that. Please type your complaint instead.",
  summaryTitle: "Here's what I understood",
  confirmQ: "Is this correct?",
  yes: "Yes, that's right",
  noFix: "No, fix something",
  ticketStd: "Complaint registered. A district officer will respond within 2 working days.",
  ticketPri: "Escalated to a senior officer. You'll get a response within 24 hours.",
  thanks: "Thank you for coming to us and raising your problem. Our team will take care of the issue and will get back to you if we need any further information.",
  restartHint: 'Say "hi" anytime to start again.',
  fallbackRoute: "Let me make sure I route this correctly — a couple of quick taps:",
  saveError: "Something went wrong saving your complaint. Please try again in a moment.",
  ackFallback: "Understood. A few quick questions to help the officer.",
  askDur: "How long has this been happening?",
  askBank: "Do you have a bank account linked to Aadhaar?",
  askEkyc: "Has the Aadhaar eKYC for this benefit been completed?",
  askReason: "Were you told any reason for it stopping?",
  askDocs: "Which documents do you currently have?",
  askBioLoc: "Where did the authentication fail?",
  askBioAge: "What is the age of the person facing this?",
  askBioOcc: "What is their main occupation?",
  askAttempts: "How many times has the authentication been tried?",
  askAltAuth: "Were you offered any alternative way to verify (OTP, iris, manual)?",
  askPayNew: "Did you recently link a new bank account to your Aadhaar?",
  askPayBank: "Which bank should receive the payment?",
  payBankPh: "e.g. SBI, Grameena Bank",
  askBribeAmt: "How much was demanded?",
  askBribePaid: "Did you end up paying?",
  askRepeat: "Has this money been demanded more than once?",
  askRole: "Who demanded the money?",
  askDenReason: "What were you told when you were turned away?",
  denReasonPh: "Briefly, what they said",
  askCard: "What is the status of your card / entitlement?",
  askDetWhat: "Which detail is recorded incorrectly?",
  askDetDocs: "Which correct documents do you have to fix it?",
};

const STR_HI = {
  greet: "नमस्ते! मैं अधिकारAI हूँ, आपका कल्याण शिकायत सहायक। आइए मिलकर आपकी शिकायत दर्ज करें।",
  askPhone: "सबसे पहले, अपना फ़ोन नंबर बताएं। इससे हम आपकी सभी शिकायतें एक जगह रखेंगे।",
  phonePh: "अपना 10 अंकों का फ़ोन नंबर लिखें",
  askName: "धन्यवाद। और आपका नाम क्या है?",
  namePh: "अपना नाम लिखें",
  askContinueName: "वापसी पर स्वागत है, {n}। क्या हम इसी नाम से जारी रखें?",
  keepName: "हाँ, {n} के रूप में जारी रखें",
  changeName: "नहीं, दूसरा नाम इस्तेमाल करें",
  askFlowChoice: "आज आप क्या करना चाहेंगे?",
  optNewTicket: "नई शिकायत दर्ज करें",
  optTrackTicket: "पुरानी शिकायत देखें",
  noTickets: "अभी आपकी कोई पुरानी शिकायत नहीं है। आइए पहली दर्ज करें।",
  trackSelectTitle: "स्थिति देखने के लिए शिकायत चुनें",
  tStatusLabel: "वर्तमान स्थिति",
  tOfficeLabel: "अभी किसके पास है",
  tUpdatesLabel: "अब तक के अपडेट",
  tNoUpdates: "अभी कोई अपडेट नहीं — आपकी शिकायत कतार में है।",
  tOpenedOn: "दर्ज की गई",
  stOpen: "खुली — अधिकारी की प्रतीक्षा",
  stProgress: "प्रगति पर",
  stEscalated: "वरिष्ठ अधिकारी को भेजी गई",
  stResolved: "हल हो गई",
  askState: "आप किस राज्य में हैं?",
  askDistrict: "और कौन-सा जिला?",
  askScheme: "आपको किस लाभ में दिक्कत हो रही है?",
  askIssue: "आपको क्या समस्या है?",
  voicePrompt: "अपने शब्दों में बताइए — क्या हुआ, कब और कहाँ, और आप क्या समाधान चाहते हैं। लिखें, या वॉइस नोट भेजने के लिए माइक दबाएँ।",
  micHint: "लिखने के बजाय वॉइस नोट रिकॉर्ड करने के लिए माइक दबाएँ।",
  askVoiceConsent: "क्या मैं इसे आपकी भाषा में वॉइस नोट के रूप में रिकॉर्ड करूँ?",
  vYes: "हाँ, मेरी आवाज़ रिकॉर्ड करें",
  vNo: "नहीं, मैं लिखूँगा",
  recTap: "बटन दबाकर बोलें। पूरा होने पर फिर दबाएँ।",
  recStop: "रिकॉर्ड हो रहा है… रोकने के लिए दबाएँ",
  recSending: "आपका वॉइस नोट सहेजा जा रहा है…",
  recFail: "मैं सुन नहीं पाया। कृपया अपनी शिकायत लिखकर बताएं।",
  summaryTitle: "मैंने यह समझा",
  confirmQ: "क्या यह सही है?",
  yes: "हाँ, सही है",
  noFix: "नहीं, सुधारें",
  ticketStd: "शिकायत दर्ज हो गई। जिला अधिकारी 2 कार्यदिवस में जवाब देंगे।",
  ticketPri: "वरिष्ठ अधिकारी को भेजा गया। 24 घंटे में जवाब मिलेगा।",
  thanks: "हमारे पास आकर अपनी समस्या बताने के लिए धन्यवाद। हमारी टीम इस मुद्दे का ध्यान रखेगी और ज़रूरत होने पर आपसे संपर्क करेगी।",
  restartHint: 'फिर से शुरू करने के लिए कभी भी "hi" लिखें।',
  fallbackRoute: "सही जगह भेजने के लिए — बस कुछ त्वरित चयन:",
  saveError: "शिकायत सहेजने में कुछ गड़बड़ी हुई। कृपया थोड़ी देर बाद पुनः प्रयास करें।",
  ackFallback: "समझ गया। अधिकारी की मदद के लिए कुछ त्वरित प्रश्न।",
  askDur: "यह समस्या कब से चल रही है?",
  askBank: "क्या आपका बैंक खाता आधार से जुड़ा है?",
  askEkyc: "क्या इस लाभ के लिए आधार eKYC पूरा हो चुका है?",
  askReason: "क्या आपको रुकने का कोई कारण बताया गया था?",
  askDocs: "आपके पास इस समय कौन-से दस्तावेज़ हैं?",
  askBioLoc: "प्रमाणीकरण कहाँ विफल हुआ?",
  askBioAge: "इस व्यक्ति की उम्र क्या है?",
  askBioOcc: "उनका मुख्य काम क्या है?",
  askAttempts: "प्रमाणीकरण कितनी बार आज़माया गया?",
  askAltAuth: "क्या आपको सत्यापन का कोई और तरीका दिया गया (OTP, आइरिस, मैनुअल)?",
  askPayNew: "क्या आपने हाल ही में आधार से नया बैंक खाता जोड़ा था?",
  askPayBank: "भुगतान किस बैंक में आना चाहिए?",
  payBankPh: "जैसे SBI, ग्रामीण बैंक",
  askBribeAmt: "कितनी राशि माँगी गई?",
  askBribePaid: "क्या आपने पैसे दिए?",
  askRepeat: "क्या यह पैसा एक से अधिक बार माँगा गया?",
  askRole: "पैसे किसने माँगे?",
  askDenReason: "जब आपको लौटाया गया तो क्या कहा गया?",
  denReasonPh: "संक्षेप में बताएं",
  askCard: "आपके कार्ड / पात्रता की स्थिति क्या है?",
  askDetWhat: "कौन-सी जानकारी गलत दर्ज है?",
  askDetDocs: "इसे ठीक करने के लिए आपके पास कौन-से सही दस्तावेज़ हैं?",
};

// ---- option-value labels (chips) -------------------------------------------
// Keyed by the value strings used across all follow-up questions.
type OptTable = Record<string, string>;

const OPT_EN: OptTable = {
  // duration
  '<1m': 'Less than 1 month', '1-3m': '1–3 months', '3-6m': '3–6 months', '>6m': 'More than 6 months',
  // shared
  ns: 'Not sure', yes: 'Yes', no: 'No', other: 'Other',
  // location
  fps: 'Ration shop', bank: 'Bank', csc: 'CSC / Aadhaar centre', hosp: 'Hospital', office: 'Govt office',
  // amount
  '<100': 'Under ₹100', '100-500': '₹100–500', '500-1000': '₹500–1000', '>1000': 'Over ₹1000',
  // age
  u60: 'Below 60', '60-70': '60–70', a70: 'Above 70',
  // occupation
  agri: 'Agricultural labour', domestic: 'Domestic work', trade: 'Trade / shop',
  // paid
  refused: 'I refused',
  // eKYC / reason / alt-auth / recent / repeat done via yes/no/ns
  // docs
  aadhaar_only: 'Aadhaar only', ration_card: 'Ration card', job_card: 'Job card', none: 'None of these',
  aadhaar: 'Aadhaar card', bank_passbook: 'Bank passbook', pan: 'PAN card',
  // "all of the above" / not-sure tail options (C3)
  all_docs: 'All of the above', all: 'All of the above',
  // attempts
  once: 'Once', few: 'A few times', many: 'Many times',
  // card status
  valid: 'Valid', expired: 'Expired',
  // official role
  dealer: 'Ration dealer', operator: 'CSC operator', official: 'Govt official',
  // detail field
  fld_name: 'Name', fld_dob: 'Date of birth', fld_address: 'Address', fld_bank: 'Bank details', fld_aadhaar: 'Aadhaar number',
};

const OPT_HI: OptTable = {
  '<1m': '1 महीने से कम', '1-3m': '1–3 महीने', '3-6m': '3–6 महीने', '>6m': '6 महीने से अधिक',
  ns: 'पता नहीं', yes: 'हाँ', no: 'नहीं', other: 'अन्य',
  fps: 'राशन दुकान', bank: 'बैंक', csc: 'CSC / आधार केंद्र', hosp: 'अस्पताल', office: 'सरकारी कार्यालय',
  '<100': '₹100 से कम', '100-500': '₹100–500', '500-1000': '₹500–1000', '>1000': '₹1000 से अधिक',
  u60: '60 से कम', '60-70': '60–70', a70: '70 से अधिक',
  agri: 'खेत मज़दूरी', domestic: 'घरेलू काम', trade: 'व्यापार / दुकान',
  refused: 'मैंने मना किया',
  aadhaar_only: 'केवल आधार', ration_card: 'राशन कार्ड', job_card: 'जॉब कार्ड', none: 'इनमें से कोई नहीं',
  aadhaar: 'आधार कार्ड', bank_passbook: 'बैंक पासबुक', pan: 'पैन कार्ड',
  all_docs: 'सभी उपरोक्त', all: 'सभी उपरोक्त',
  once: 'एक बार', few: 'कुछ बार', many: 'कई बार',
  valid: 'वैध', expired: 'समाप्त',
  dealer: 'राशन डीलर', operator: 'CSC ऑपरेटर', official: 'सरकारी अधिकारी',
  fld_name: 'नाम', fld_dob: 'जन्म तिथि', fld_address: 'पता', fld_bank: 'बैंक विवरण', fld_aadhaar: 'आधार संख्या',
};

// ---- summary-card row headers ----------------------------------------------
type RowTable = Record<string, string>;

const ROW_EN: RowTable = {
  issue: 'Issue', scheme: 'Scheme', duration: 'Duration', location: 'Location',
  person_age: 'Person age', occupation: 'Occupation', bank_linked: 'Bank account',
  ekyc_done: 'Aadhaar eKYC', reason_given: 'Reason given', docs_status: 'Documents',
  attempts: 'Attempts', alt_auth_offered: 'Alternative offered', recent_bank_change: 'New bank linked',
  which_bank: 'Intended bank', amount: 'Amount', paid: 'Paid?', repeat_demand: 'Repeated demand',
  official_role: 'Demanded by', denial_reason: 'Reason for denial', card_status: 'Card status',
  detail_field: 'Wrong detail', docs_available: 'Documents to fix', original_text: 'In their words',
};

const ROW_HI: RowTable = {
  issue: 'समस्या', scheme: 'योजना', duration: 'अवधि', location: 'स्थान',
  person_age: 'व्यक्ति की उम्र', occupation: 'व्यवसाय', bank_linked: 'बैंक खाता',
  ekyc_done: 'आधार eKYC', reason_given: 'बताया गया कारण', docs_status: 'दस्तावेज़',
  attempts: 'प्रयास', alt_auth_offered: 'विकल्प दिया गया', recent_bank_change: 'नया बैंक जुड़ा',
  which_bank: 'इच्छित बैंक', amount: 'राशि', paid: 'भुगतान किया?', repeat_demand: 'बार-बार माँग',
  official_role: 'किसने माँगा', denial_reason: 'मना करने का कारण', card_status: 'कार्ड स्थिति',
  detail_field: 'गलत जानकारी', docs_available: 'सुधार हेतु दस्तावेज़', original_text: 'उनके शब्दों में',
};

// ---- registries (languages added below via extendI18n) ----------------------
export const STR: Record<string, typeof STR_EN> = { en: STR_EN, hi: STR_HI };
const OPT: Record<string, OptTable> = { en: OPT_EN, hi: OPT_HI };
const ROW: Record<string, RowTable> = { en: ROW_EN, hi: ROW_HI };

// Internal: register a language's three tables in one call.
export function __register(
  code: string, str: typeof STR_EN, opt: OptTable, row: RowTable,
): void {
  STR[code] = str; OPT[code] = opt; ROW[code] = row;
}

// Internal: point a language code at an already-registered one (e.g. Bhojpuri /
// Maithili reuse Hindi — the natural default when no distinct word exists).
export function __alias(code: string, from: string): void {
  if (STR[from]) STR[code] = STR[from];
  if (OPT[from]) OPT[code] = OPT[from];
  if (ROW[from]) ROW[code] = ROW[from];
}

// Exported so the shared type is reusable by the companion language tables.
export type StrTable = typeof STR_EN;
export type { OptTable, RowTable };

// ---- extra strings (Phase 2) -----------------------------------------------
// Kept separate from the typed StrTable so new copy doesn't force an edit to all
// 15 language tables — en/hi/te are provided, everything else falls back to en.
type XTable = Record<string, string>;
const XSTR_EN: XTable = {
  voiceReview: "Here's what I heard — check it, edit if needed, then send. Or tap 🎤 to record again.",
  voiceRetry: "I couldn't catch that clearly. Tap 🎤 to try again, or just type your complaint below.",
  trailLabel: 'Tracking trail',
};
const XSTR_HI: XTable = {
  voiceReview: 'मैंने यह सुना — जाँच लें, ज़रूरत हो तो सुधारें, फिर भेजें। या दोबारा रिकॉर्ड करने के लिए 🎤 दबाएँ।',
  voiceRetry: 'मैं स्पष्ट रूप से सुन नहीं पाया। दोबारा के लिए 🎤 दबाएँ, या नीचे अपनी शिकायत लिखें।',
  trailLabel: 'ट्रैकिंग विवरण',
};
const XSTR_TE: XTable = {
  voiceReview: 'నేను ఇది విన్నాను — సరిచూసి, అవసరమైతే మార్చి, పంపండి. లేదా మళ్ళీ రికార్డ్ చేయడానికి 🎤 నొక్కండి.',
  voiceRetry: 'నాకు స్పష్టంగా వినిపించలేదు. మళ్ళీ కోసం 🎤 నొక్కండి, లేదా కింద మీ ఫిర్యాదు టైప్ చేయండి.',
  trailLabel: 'ట్రాకింగ్ వివరాలు',
};
const XSTR: Record<string, XTable> = { en: XSTR_EN, hi: XSTR_HI, te: XSTR_TE };

// Extra localized string with English fallback (for Phase 2 additions).
export function xstr(lang: string, key: string): string {
  return (XSTR[lang] && XSTR[lang][key]) || XSTR_EN[key] || '';
}

export const WELCOME =
  'Welcome to AdhikarAI. We are here to assist you with any issue related to your government welfare benefits. Please select your preferred language to continue.';

export function strings(lang: string): typeof STR_EN {
  return STR[lang] || STR.en;
}

// Chip label for an option value in the citizen's language, English fallback.
export function optLabel(lang: string, value: string): string {
  return (OPT[lang] && OPT[lang][value]) || OPT.en[value] || value;
}

// Summary-card row header in the citizen's language, English fallback.
export function rowLabel(lang: string, key: string): string {
  return (ROW[lang] && ROW[lang][key]) || ROW.en[key] || key;
}

// Fill {n}-style placeholders.
export function fmt(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);
}
