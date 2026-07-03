import type { SchemeCode, IssueCode } from '../lib/types';

// ---- Welfare schemes (ported from the prototype) ---------------------------
export interface Scheme {
  value: SchemeCode;
  label: string;
  sub: string;
  mono: string;
  tint: string;
  fg: string;
}

export const SCHEMES: Scheme[] = [
  { value: 'pds', label: 'Ration / Food grains', sub: 'PDS', mono: 'PD', tint: '#fdeede', fg: '#c2660a' },
  { value: 'mgnrega', label: 'Employment wages', sub: 'MGNREGA', mono: 'MG', tint: '#e7f0fb', fg: '#1F84D6' },
  { value: 'nsap', label: 'Pension (old age / widow / disability)', sub: 'NSAP', mono: 'PE', tint: '#efeaf6', fg: '#6E3FA3' },
  { value: 'pmkisan', label: 'Farmer income support', sub: 'PM-KISAN', mono: 'KI', tint: '#e6f5ec', fg: '#1E9E4A' },
  { value: 'pmjay', label: 'Health coverage', sub: 'Ayushman Bharat PM-JAY', mono: 'JA', tint: '#fdecec', fg: '#c0392b' },
  { value: 'ujjwala', label: 'LPG connection', sub: 'PM Ujjwala', mono: 'UJ', tint: '#fff4e0', fg: '#b9770a' },
  { value: 'awas', label: 'Housing assistance', sub: 'PM Awas Yojana', mono: 'AW', tint: '#e9eef4', fg: '#0B3C6B' },
  { value: 'other', label: 'Something else', sub: '', mono: '…', tint: '#eef1f5', fg: '#5b7488' },
];

export const schemeLabel = (v: string) => {
  const s = SCHEMES.find((x) => x.value === v);
  return s ? s.sub || s.label : '—';
};
export const schemeLong = (v: string) => {
  const s = SCHEMES.find((x) => x.value === v);
  return s ? s.label : '—';
};

// ---- Issue categories ------------------------------------------------------
export interface Issue {
  value: IssueCode;
  label: string;
}

export const ISSUES: Issue[] = [
  { value: 'stopped', label: 'Benefit has stopped or never arrived' },
  { value: 'biometric', label: 'Fingerprint / iris authentication fails' },
  { value: 'payment', label: 'Payment missing or going to wrong account' },
  { value: 'denied', label: 'I was denied access at the shop / hospital / office' },
  { value: 'bribe', label: 'A bribe or unofficial payment was demanded' },
  { value: 'details', label: 'My personal details are recorded incorrectly' },
  { value: 'other', label: 'Other' },
];

export const issueLabel = (v: string) => {
  const i = ISSUES.find((x) => x.value === v);
  return i ? i.label : '—';
};

// ---- Citizen-facing localized labels ---------------------------------------
// The English SCHEMES/ISSUES tables above stay as-is for the officer dashboard.
// These parallel tables give the citizen chat scheme + issue labels in their own
// language. Any language not listed (or any value missing) falls back to English
// via the helpers, so a label never silently drops out of the chosen language.

type LabelMap = Record<string, string>;

const SCHEME_L10N: Record<string, LabelMap> = {
  hi: { pds: 'राशन / अनाज', mgnrega: 'रोज़गार मज़दूरी', nsap: 'पेंशन (वृद्धावस्था / विधवा / दिव्यांग)', pmkisan: 'किसान आय सहायता', pmjay: 'स्वास्थ्य कवरेज', ujjwala: 'गैस कनेक्शन', awas: 'आवास सहायता', other: 'कुछ और' },
  te: { pds: 'రేషన్ / ఆహార ధాన్యాలు', mgnrega: 'ఉపాధి వేతనం', nsap: 'పింఛను (వృద్ధాప్య / వితంతు / వికలాంగ)', pmkisan: 'రైతు ఆదాయ సహాయం', pmjay: 'ఆరోగ్య కవరేజ్', ujjwala: 'గ్యాస్ కనెక్షన్', awas: 'గృహ సహాయం', other: 'మరేదైనా' },
  ta: { pds: 'ரேஷன் / உணவு தானியம்', mgnrega: 'வேலைவாய்ப்பு ஊதியம்', nsap: 'ஓய்வூதியம் (முதியோர் / விதவை / மாற்றுத்திறனாளி)', pmkisan: 'விவசாயி வருமான உதவி', pmjay: 'சுகாதார காப்பீடு', ujjwala: 'எரிவாயு இணைப்பு', awas: 'வீட்டு உதவி', other: 'வேறு ஏதேனும்' },
  bn: { pds: 'রেশন / খাদ্যশস্য', mgnrega: 'কর্মসংস্থান মজুরি', nsap: 'পেনশন (বার্ধক্য / বিধবা / প্রতিবন্ধী)', pmkisan: 'কৃষক আয় সহায়তা', pmjay: 'স্বাস্থ্য কভারেজ', ujjwala: 'গ্যাস সংযোগ', awas: 'আবাসন সহায়তা', other: 'অন্য কিছু' },
  mr: { pds: 'रेशन / धान्य', mgnrega: 'रोजगार मजुरी', nsap: 'निवृत्तीवेतन (वृद्ध / विधवा / दिव्यांग)', pmkisan: 'शेतकरी उत्पन्न मदत', pmjay: 'आरोग्य कवच', ujjwala: 'गॅस जोडणी', awas: 'घरकुल मदत', other: 'दुसरे काही' },
  gu: { pds: 'રેશન / અનાજ', mgnrega: 'રોજગાર વેતન', nsap: 'પેન્શન (વૃદ્ધ / વિધવા / દિવ્યાંગ)', pmkisan: 'ખેડૂત આવક સહાય', pmjay: 'આરોગ્ય કવચ', ujjwala: 'ગેસ જોડાણ', awas: 'આવાસ સહાય', other: 'બીજું કંઈક' },
  pa: { pds: 'ਰਾਸ਼ਨ / ਅਨਾਜ', mgnrega: 'ਰੁਜ਼ਗਾਰ ਮਜ਼ਦੂਰੀ', nsap: 'ਪੈਨਸ਼ਨ (ਬਜ਼ੁਰਗ / ਵਿਧਵਾ / ਦਿਵਯਾਂਗ)', pmkisan: 'ਕਿਸਾਨ ਆਮਦਨ ਸਹਾਇਤਾ', pmjay: 'ਸਿਹਤ ਕਵਰੇਜ', ujjwala: 'ਗੈਸ ਕੁਨੈਕਸ਼ਨ', awas: 'ਆਵਾਸ ਸਹਾਇਤਾ', other: 'ਕੁਝ ਹੋਰ' },
  kn: { pds: 'ರೇಷನ್ / ಆಹಾರ ಧಾನ್ಯ', mgnrega: 'ಉದ್ಯೋಗ ವೇತನ', nsap: 'ಪಿಂಚಣಿ (ವೃದ್ಧಾಪ್ಯ / ವಿಧವೆ / ಅಂಗವಿಕಲ)', pmkisan: 'ರೈತ ಆದಾಯ ನೆರವು', pmjay: 'ಆರೋಗ್ಯ ರಕ್ಷಣೆ', ujjwala: 'ಗ್ಯಾಸ್ ಸಂಪರ್ಕ', awas: 'ವಸತಿ ನೆರವು', other: 'ಬೇರೇನಾದರೂ' },
  ml: { pds: 'റേഷൻ / ധാന്യം', mgnrega: 'തൊഴിൽ വേതനം', nsap: 'പെൻഷൻ (വാർധക്യ / വിധവ / ഭിന്നശേഷി)', pmkisan: 'കർഷക വരുമാന സഹായം', pmjay: 'ആരോഗ്യ പരിരക്ഷ', ujjwala: 'ഗ്യാസ് കണക്ഷൻ', awas: 'ഭവന സഹായം', other: 'മറ്റെന്തെങ്കിലും' },
  ur: { pds: 'راشن / اناج', mgnrega: 'روزگار مزدوری', nsap: 'پنشن (بزرگ / بیوہ / معذور)', pmkisan: 'کسان آمدنی امداد', pmjay: 'صحت کوریج', ujjwala: 'گیس کنکشن', awas: 'رہائش امداد', other: 'کچھ اور' },
  or: { pds: 'ରାସନ / ଖାଦ୍ୟଶସ୍ୟ', mgnrega: 'ନିଯୁକ୍ତି ମଜୁରି', nsap: 'ପେନସନ (ବୃଦ୍ଧ / ବିଧବା / ଦିବ୍ୟାଙ୍ଗ)', pmkisan: 'କୃଷକ ଆୟ ସହାୟତା', pmjay: 'ସ୍ୱାସ୍ଥ୍ୟ କଭରେଜ', ujjwala: 'ଗ୍ୟାସ ସଂଯୋଗ', awas: 'ଆବାସ ସହାୟତା', other: 'ଅନ୍ୟ କିଛି' },
  as: { pds: 'ৰেচন / খাদ্যশস্য', mgnrega: 'নিয়োগ মজুৰি', nsap: 'পেঞ্চন (বৃদ্ধ / বিধৱা / দিব্যাংগ)', pmkisan: 'কৃষক আয় সহায়', pmjay: 'স্বাস্থ্য কভাৰেজ', ujjwala: 'গেছ সংযোগ', awas: 'বাসগৃহ সহায়', other: 'আন কিবা' },
};

const ISSUE_L10N: Record<string, LabelMap> = {
  hi: { stopped: 'लाभ बंद हो गया या कभी नहीं आया', biometric: 'फिंगरप्रिंट / आइरिस प्रमाणीकरण विफल', payment: 'भुगतान गायब या गलत खाते में', denied: 'दुकान / अस्पताल / कार्यालय में मना किया', bribe: 'रिश्वत या अनौपचारिक भुगतान माँगा गया', details: 'मेरी जानकारी गलत दर्ज है', other: 'अन्य' },
  te: { stopped: 'ప్రయోజనం ఆగింది లేదా రాలేదు', biometric: 'వేలిముద్ర / ఐరిస్ ధృవీకరణ విఫలం', payment: 'చెల్లింపు తప్పిపోయింది లేదా తప్పు ఖాతాకు', denied: 'దుకాణం / ఆసుపత్రి / కార్యాలయంలో నిరాకరణ', bribe: 'లంచం లేదా అనధికారిక చెల్లింపు అడిగారు', details: 'నా వివరాలు తప్పుగా నమోదయ్యాయి', other: 'ఇతర' },
  ta: { stopped: 'நலன் நின்றது அல்லது வரவில்லை', biometric: 'கைரேகை / கண்விழி சரிபார்ப்பு தோல்வி', payment: 'பணம் காணவில்லை அல்லது தவறான கணக்கு', denied: 'கடை / மருத்துவமனை / அலுவலகத்தில் மறுப்பு', bribe: 'லஞ்சம் அல்லது முறைகேடான பணம் கேட்டனர்', details: 'என் விவரம் தவறாக பதிவு', other: 'மற்றவை' },
  bn: { stopped: 'সুবিধা বন্ধ বা আসেনি', biometric: 'আঙুলের ছাপ / আইরিস যাচাই ব্যর্থ', payment: 'পেমেন্ট নিখোঁজ বা ভুল অ্যাকাউন্টে', denied: 'দোকান / হাসপাতাল / অফিসে প্রত্যাখ্যান', bribe: 'ঘুষ বা অনানুষ্ঠানিক অর্থ দাবি', details: 'আমার তথ্য ভুল নথিভুক্ত', other: 'অন্যান্য' },
  mr: { stopped: 'लाभ बंद झाला किंवा आलाच नाही', biometric: 'बोटांचे ठसे / आयरिस पडताळणी अयशस्वी', payment: 'पेमेंट गहाळ किंवा चुकीच्या खात्यात', denied: 'दुकान / रुग्णालय / कार्यालयात नकार', bribe: 'लाच किंवा अनधिकृत पैसे मागितले', details: 'माझी माहिती चुकीची नोंदली', other: 'इतर' },
  gu: { stopped: 'લાભ બંધ થયો કે આવ્યો જ નહીં', biometric: 'ફિંગરપ્રિન્ટ / આઇરિસ ચકાસણી નિષ્ફળ', payment: 'ચુકવણી ગુમ કે ખોટા ખાતામાં', denied: 'દુકાન / હોસ્પિટલ / કચેરીમાં ના પાડી', bribe: 'લાંચ કે અનૌપચારિક ચુકવણી માંગી', details: 'મારી વિગત ખોટી નોંધાઈ', other: 'અન્ય' },
  pa: { stopped: 'ਲਾਭ ਬੰਦ ਹੋ ਗਿਆ ਜਾਂ ਕਦੇ ਨਹੀਂ ਆਇਆ', biometric: 'ਫਿੰਗਰਪ੍ਰਿੰਟ / ਆਇਰਿਸ ਪ੍ਰਮਾਣੀਕਰਨ ਫੇਲ੍ਹ', payment: 'ਭੁਗਤਾਨ ਗੁੰਮ ਜਾਂ ਗਲਤ ਖਾਤੇ ਵਿੱਚ', denied: 'ਦੁਕਾਨ / ਹਸਪਤਾਲ / ਦਫ਼ਤਰ ਵਿੱਚ ਇਨਕਾਰ', bribe: 'ਰਿਸ਼ਵਤ ਜਾਂ ਗੈਰ-ਰਸਮੀ ਭੁਗਤਾਨ ਮੰਗਿਆ', details: 'ਮੇਰੀ ਜਾਣਕਾਰੀ ਗਲਤ ਦਰਜ', other: 'ਹੋਰ' },
  kn: { stopped: 'ಸೌಲಭ್ಯ ನಿಂತಿದೆ ಅಥವಾ ಬಂದಿಲ್ಲ', biometric: 'ಫಿಂಗರ್‌ಪ್ರಿಂಟ್ / ಐರಿಸ್ ದೃಢೀಕರಣ ವಿಫಲ', payment: 'ಪಾವತಿ ಕಾಣೆ ಅಥವಾ ತಪ್ಪು ಖಾತೆಗೆ', denied: 'ಅಂಗಡಿ / ಆಸ್ಪತ್ರೆ / ಕಚೇರಿಯಲ್ಲಿ ನಿರಾಕರಣೆ', bribe: 'ಲಂಚ ಅಥವಾ ಅನಧಿಕೃತ ಪಾವತಿ ಕೇಳಿದರು', details: 'ನನ್ನ ವಿವರ ತಪ್ಪಾಗಿ ದಾಖಲು', other: 'ಇತರೆ' },
  ml: { stopped: 'ആനുകൂല്യം നിന്നു അല്ലെങ്കിൽ വന്നില്ല', biometric: 'വിരലടയാളം / ഐറിസ് പരിശോധന പരാജയം', payment: 'പണം നഷ്ടം അല്ലെങ്കിൽ തെറ്റായ അക്കൗണ്ടിൽ', denied: 'കട / ആശുപത്രി / ഓഫീസിൽ നിരസിച്ചു', bribe: 'കൈക്കൂലി അല്ലെങ്കിൽ അനൗദ്യോഗിക പണം ചോദിച്ചു', details: 'എന്റെ വിവരം തെറ്റായി രേഖപ്പെടുത്തി', other: 'മറ്റുള്ളവ' },
  ur: { stopped: 'فائدہ بند ہو گیا یا کبھی نہیں آیا', biometric: 'فنگرپرنٹ / آئرس تصدیق ناکام', payment: 'ادائیگی غائب یا غلط اکاؤنٹ میں', denied: 'دکان / ہسپتال / دفتر میں انکار', bribe: 'رشوت یا غیر رسمی ادائیگی مانگی گئی', details: 'میری معلومات غلط درج', other: 'دیگر' },
  or: { stopped: 'ସୁବିଧା ବନ୍ଦ ହେଲା କିମ୍ବା ଆସିଲା ନାହିଁ', biometric: 'ଆଙ୍ଗୁଠି ଚିହ୍ନ / ଆଇରିସ୍ ପ୍ରମାଣୀକରଣ ବିଫଳ', payment: 'ଦେୟ ହଜିଲା କିମ୍ବା ଭୁଲ ଖାତାକୁ', denied: 'ଦୋକାନ / ଡାକ୍ତରଖାନା / କାର୍ଯ୍ୟାଳୟରେ ମନା', bribe: 'ଲାଞ୍ଚ କିମ୍ବା ଅନଧିକୃତ ଦେୟ ମଗାଗଲା', details: 'ମୋ ବିବରଣୀ ଭୁଲ ଦାଖଲ', other: 'ଅନ୍ୟ' },
  as: { stopped: 'সুবিধা বন্ধ হ’ল বা নাহে', biometric: 'আঙুলিৰ ছাপ / আইৰিছ প্ৰমাণীকৰণ ব্যৰ্থ', payment: 'পৰিশোধ নোহোৱা বা ভুল একাউণ্টত', denied: 'দোকান / চিকিৎসালয় / কাৰ্যালয়ত অস্বীকাৰ', bribe: 'ঘুষ বা অনানুষ্ঠানিক ধন বিচৰা হ’ল', details: 'মোৰ তথ্য ভুলকৈ দাখিল', other: 'অন্য' },
};

// Localized scheme label for the citizen chat (English fallback).
export const schemeLabelLocalized = (lang: string, v: string): string =>
  (SCHEME_L10N[lang] && SCHEME_L10N[lang][v]) || schemeLong(v);

// Localized issue label for the citizen chat (English fallback).
export const issueLabelLocalized = (lang: string, v: string): string =>
  (ISSUE_L10N[lang] && ISSUE_L10N[lang][v]) || issueLabel(v);

// Which government cell handles a (scheme, issue) — used to set ticket route.
export function routeFor(scheme: SchemeCode, issue: IssueCode, district: string): string {
  if (issue === 'bribe') return 'State Anti-Corruption Cell';
  const cell: Record<SchemeCode, string> = {
    pds: 'FPS / CSC',
    mgnrega: 'MGNREGA Cell',
    nsap: 'Pension Cell',
    pmkisan: 'PM-KISAN PMU',
    pmjay: 'PM-JAY District Grievance',
    ujjwala: 'Oil Marketing Co. / District Supply',
    awas: 'PMAY Cell',
    other: 'District Grievance Cell',
  };
  return `${cell[scheme]}, ${district}`;
}
