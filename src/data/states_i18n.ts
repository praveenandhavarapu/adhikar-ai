// ============================================================================
// Localized Indian state / UT names (C1).
//
// State names are proper nouns → transliteration into the target script. Keyed
// by the canonical English name used in data/geography.ts (which stays the
// stable submitted VALUE). Only the DISPLAY label is localized.
//
// Fully covered: Hindi, Telugu, Tamil, Bengali, Marathi (largest populations +
// the demo languages). Any other language falls back to the English name for
// that state — consistently, so a chip list never mixes scripts. Add a language
// by dropping in another table below; districts stay English (700+ per state,
// transliterated at display time is out of scope here).
// ============================================================================

type StateMap = Record<string, string>;

const HI: StateMap = {
  'Andhra Pradesh': 'आंध्र प्रदेश', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Assam': 'असम',
  'Bihar': 'बिहार', 'Chhattisgarh': 'छत्तीसगढ़', 'Goa': 'गोवा', 'Gujarat': 'गुजरात',
  'Haryana': 'हरियाणा', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Jharkhand': 'झारखंड',
  'Karnataka': 'कर्नाटक', 'Kerala': 'केरल', 'Madhya Pradesh': 'मध्य प्रदेश',
  'Maharashtra': 'महाराष्ट्र', 'Manipur': 'मणिपुर', 'Meghalaya': 'मेघालय', 'Mizoram': 'मिज़ोरम',
  'Nagaland': 'नागालैंड', 'Odisha': 'ओडिशा', 'Punjab': 'पंजाब', 'Rajasthan': 'राजस्थान',
  'Sikkim': 'सिक्किम', 'Tamil Nadu': 'तमिलनाडु', 'Telangana': 'तेलंगाना', 'Tripura': 'त्रिपुरा',
  'Uttar Pradesh': 'उत्तर प्रदेश', 'Uttarakhand': 'उत्तराखंड', 'West Bengal': 'पश्चिम बंगाल',
  'Andaman & Nicobar Islands': 'अंडमान और निकोबार द्वीप', 'Chandigarh': 'चंडीगढ़',
  'Dadra & NH and Daman & Diu': 'दादरा एवं नगर हवेली और दमन एवं दीव', 'Delhi': 'दिल्ली',
  'Jammu & Kashmir': 'जम्मू और कश्मीर', 'Ladakh': 'लद्दाख', 'Lakshadweep': 'लक्षद्वीप',
  'Puducherry': 'पुडुचेरी',
};

const TE: StateMap = {
  'Andhra Pradesh': 'ఆంధ్రప్రదేశ్', 'Arunachal Pradesh': 'అరుణాచల్ ప్రదేశ్', 'Assam': 'అస్సాం',
  'Bihar': 'బీహార్', 'Chhattisgarh': 'ఛత్తీస్‌గఢ్', 'Goa': 'గోవా', 'Gujarat': 'గుజరాత్',
  'Haryana': 'హర్యానా', 'Himachal Pradesh': 'హిమాచల్ ప్రదేశ్', 'Jharkhand': 'ఝార్ఖండ్',
  'Karnataka': 'కర్ణాటక', 'Kerala': 'కేరళ', 'Madhya Pradesh': 'మధ్యప్రదేశ్',
  'Maharashtra': 'మహారాష్ట్ర', 'Manipur': 'మణిపూర్', 'Meghalaya': 'మేఘాలయ', 'Mizoram': 'మిజోరం',
  'Nagaland': 'నాగాలాండ్', 'Odisha': 'ఒడిశా', 'Punjab': 'పంజాబ్', 'Rajasthan': 'రాజస్థాన్',
  'Sikkim': 'సిక్కిం', 'Tamil Nadu': 'తమిళనాడు', 'Telangana': 'తెలంగాణ', 'Tripura': 'త్రిపుర',
  'Uttar Pradesh': 'ఉత్తరప్రదేశ్', 'Uttarakhand': 'ఉత్తరాఖండ్', 'West Bengal': 'పశ్చిమ బెంగాల్',
  'Andaman & Nicobar Islands': 'అండమాన్ & నికోబార్ దీవులు', 'Chandigarh': 'చండీగఢ్',
  'Dadra & NH and Daman & Diu': 'దాద్రా & నగర్ హవేలీ మరియు డామన్ & డయ్యూ', 'Delhi': 'ఢిల్లీ',
  'Jammu & Kashmir': 'జమ్మూ & కశ్మీర్', 'Ladakh': 'లదాఖ్', 'Lakshadweep': 'లక్షద్వీప్',
  'Puducherry': 'పుదుచ్చేరి',
};

const TA: StateMap = {
  'Andhra Pradesh': 'ஆந்திரப் பிரதேசம்', 'Arunachal Pradesh': 'அருணாசலப் பிரதேசம்', 'Assam': 'அசாம்',
  'Bihar': 'பீகார்', 'Chhattisgarh': 'சத்தீஸ்கர்', 'Goa': 'கோவா', 'Gujarat': 'குஜராத்',
  'Haryana': 'ஹரியானா', 'Himachal Pradesh': 'இமாசலப் பிரதேசம்', 'Jharkhand': 'ஜார்க்கண்ட்',
  'Karnataka': 'கர்நாடகா', 'Kerala': 'கேரளா', 'Madhya Pradesh': 'மத்தியப் பிரதேசம்',
  'Maharashtra': 'மகாராஷ்டிரா', 'Manipur': 'மணிப்பூர்', 'Meghalaya': 'மேகாலயா', 'Mizoram': 'மிசோரம்',
  'Nagaland': 'நாகாலாந்து', 'Odisha': 'ஒடிசா', 'Punjab': 'பஞ்சாப்', 'Rajasthan': 'ராஜஸ்தான்',
  'Sikkim': 'சிக்கிம்', 'Tamil Nadu': 'தமிழ்நாடு', 'Telangana': 'தெலங்கானா', 'Tripura': 'திரிபுரா',
  'Uttar Pradesh': 'உத்தரப் பிரதேசம்', 'Uttarakhand': 'உத்தராகண்ட்', 'West Bengal': 'மேற்கு வங்காளம்',
  'Andaman & Nicobar Islands': 'அந்தமான் & நிக்கோபார் தீவுகள்', 'Chandigarh': 'சண்டிகர்',
  'Dadra & NH and Daman & Diu': 'தாத்ரா & நகர் ஹவேலி மற்றும் தமன் & தியூ', 'Delhi': 'தில்லி',
  'Jammu & Kashmir': 'ஜம்மு & காஷ்மீர்', 'Ladakh': 'லடாக்', 'Lakshadweep': 'லட்சத்தீவு',
  'Puducherry': 'புதுச்சேரி',
};

const BN: StateMap = {
  'Andhra Pradesh': 'অন্ধ্রপ্রদেশ', 'Arunachal Pradesh': 'অরুণাচল প্রদেশ', 'Assam': 'অসম',
  'Bihar': 'বিহার', 'Chhattisgarh': 'ছত্তিশগড়', 'Goa': 'গোয়া', 'Gujarat': 'গুজরাট',
  'Haryana': 'হরিয়ানা', 'Himachal Pradesh': 'হিমাচল প্রদেশ', 'Jharkhand': 'ঝাড়খণ্ড',
  'Karnataka': 'কর্ণাটক', 'Kerala': 'কেরল', 'Madhya Pradesh': 'মধ্যপ্রদেশ',
  'Maharashtra': 'মহারাষ্ট্র', 'Manipur': 'মণিপুর', 'Meghalaya': 'মেঘালয়', 'Mizoram': 'মিজোরাম',
  'Nagaland': 'নাগাল্যান্ড', 'Odisha': 'ওড়িশা', 'Punjab': 'পাঞ্জাব', 'Rajasthan': 'রাজস্থান',
  'Sikkim': 'সিকিম', 'Tamil Nadu': 'তামিলনাড়ু', 'Telangana': 'তেলঙ্গানা', 'Tripura': 'ত্রিপুরা',
  'Uttar Pradesh': 'উত্তরপ্রদেশ', 'Uttarakhand': 'উত্তরাখণ্ড', 'West Bengal': 'পশ্চিমবঙ্গ',
  'Andaman & Nicobar Islands': 'আন্দামান ও নিকোবর দ্বীপপুঞ্জ', 'Chandigarh': 'চণ্ডীগড়',
  'Dadra & NH and Daman & Diu': 'দাদরা ও নগর হাভেলি এবং দমন ও দিউ', 'Delhi': 'দিল্লি',
  'Jammu & Kashmir': 'জম্মু ও কাশ্মীর', 'Ladakh': 'লাদাখ', 'Lakshadweep': 'লক্ষদ্বীপ',
  'Puducherry': 'পুদুচেরি',
};

const MR: StateMap = {
  'Andhra Pradesh': 'आंध्र प्रदेश', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Assam': 'आसाम',
  'Bihar': 'बिहार', 'Chhattisgarh': 'छत्तीसगड', 'Goa': 'गोवा', 'Gujarat': 'गुजरात',
  'Haryana': 'हरियाणा', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Jharkhand': 'झारखंड',
  'Karnataka': 'कर्नाटक', 'Kerala': 'केरळ', 'Madhya Pradesh': 'मध्य प्रदेश',
  'Maharashtra': 'महाराष्ट्र', 'Manipur': 'मणिपूर', 'Meghalaya': 'मेघालय', 'Mizoram': 'मिझोराम',
  'Nagaland': 'नागालँड', 'Odisha': 'ओडिशा', 'Punjab': 'पंजाब', 'Rajasthan': 'राजस्थान',
  'Sikkim': 'सिक्किम', 'Tamil Nadu': 'तमिळनाडू', 'Telangana': 'तेलंगणा', 'Tripura': 'त्रिपुरा',
  'Uttar Pradesh': 'उत्तर प्रदेश', 'Uttarakhand': 'उत्तराखंड', 'West Bengal': 'पश्चिम बंगाल',
  'Andaman & Nicobar Islands': 'अंदमान व निकोबार बेटे', 'Chandigarh': 'चंदीगड',
  'Dadra & NH and Daman & Diu': 'दादरा व नगर हवेली आणि दमण व दीव', 'Delhi': 'दिल्ली',
  'Jammu & Kashmir': 'जम्मू व काश्मीर', 'Ladakh': 'लडाख', 'Lakshadweep': 'लक्षद्वीप',
  'Puducherry': 'पुदुच्चेरी',
};

const STATE_L10N: Record<string, StateMap> = { hi: HI, te: TE, ta: TA, bn: BN, mr: MR };

// Localized state name (English name is the fallback and the stable value).
export function stateLabelLocalized(lang: string, state: string): string {
  return (STATE_L10N[lang] && STATE_L10N[lang][state]) || state;
}
