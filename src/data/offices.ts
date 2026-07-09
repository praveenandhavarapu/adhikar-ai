// ============================================================================
// Offices — the owning government office/cell for each grievance category.
//
// A ticket's *category* (scheme, or a corruption issue) maps to exactly one
// owning office. The officer dashboard entry flow filters by office; routing
// (O3) recommends and records the holding office; the citizen tracking trail
// shows where a ticket currently sits — all keyed by these stable OFFICE codes.
//
// Labels are localized so the same office name renders in the citizen's script
// on the tracking trail and in the officer's chosen dashboard language. English
// is the fallback for any language/office not explicitly translated.
// ============================================================================
import type { SchemeCode, IssueCode } from '../lib/types';

export type OfficeCode =
  | 'CIVIL_SUPPLIES'   // PDS / ration — Civil Supplies (FPS/CSC)
  | 'RURAL_DEV'        // MGNREGA — Rural Development
  | 'PENSION'          // NSAP — Pension Cell
  | 'PM_KISAN'         // PM-KISAN PMU
  | 'HEALTH'           // PM-JAY — District Health / Grievance
  | 'SUPPLY_LPG'       // Ujjwala — District Supply / Oil Marketing
  | 'HOUSING'          // PMAY — Housing
  | 'PWD'              // Roads / public works
  | 'URBAN_DEV'        // Urban development
  | 'ANTI_CORRUPTION'  // State Anti-Corruption Cell (any bribe case)
  | 'GRIEVANCE';       // Generic district grievance cell (fallback)

// Every office that can own a ticket. Order = display order in filters.
export const OFFICES: OfficeCode[] = [
  'CIVIL_SUPPLIES', 'RURAL_DEV', 'PENSION', 'PM_KISAN', 'HEALTH',
  'SUPPLY_LPG', 'HOUSING', 'PWD', 'URBAN_DEV', 'ANTI_CORRUPTION', 'GRIEVANCE',
];

// scheme → owning office (before issue-based overrides).
const SCHEME_OFFICE: Record<SchemeCode, OfficeCode> = {
  pds: 'CIVIL_SUPPLIES',
  mgnrega: 'RURAL_DEV',
  nsap: 'PENSION',
  pmkisan: 'PM_KISAN',
  pmjay: 'HEALTH',
  ujjwala: 'SUPPLY_LPG',
  awas: 'HOUSING',
  other: 'GRIEVANCE',
};

// The office that OWNS a (scheme, issue) pair. A bribe/corruption case always
// goes to the Anti-Corruption Cell regardless of scheme.
export function officeForCategory(scheme: SchemeCode, issue: IssueCode): OfficeCode {
  if (issue === 'bribe') return 'ANTI_CORRUPTION';
  return SCHEME_OFFICE[scheme] || 'GRIEVANCE';
}

// ---- localized office names -------------------------------------------------
type OfficeLabels = Record<OfficeCode, string>;

const EN: OfficeLabels = {
  CIVIL_SUPPLIES: 'Civil Supplies (PDS)',
  RURAL_DEV: 'Rural Development (MGNREGA)',
  PENSION: 'Pension Cell (NSAP)',
  PM_KISAN: 'PM-KISAN PMU',
  HEALTH: 'Health / PM-JAY Grievance',
  SUPPLY_LPG: 'District Supply / LPG',
  HOUSING: 'Housing (PMAY)',
  PWD: 'Public Works (PWD)',
  URBAN_DEV: 'Urban Development',
  ANTI_CORRUPTION: 'State Anti-Corruption Cell',
  GRIEVANCE: 'District Grievance Cell',
};

const HI: OfficeLabels = {
  CIVIL_SUPPLIES: 'नागरिक आपूर्ति (राशन)',
  RURAL_DEV: 'ग्रामीण विकास (मनरेगा)',
  PENSION: 'पेंशन कक्ष (NSAP)',
  PM_KISAN: 'पीएम-किसान PMU',
  HEALTH: 'स्वास्थ्य / PM-JAY शिकायत',
  SUPPLY_LPG: 'जिला आपूर्ति / गैस',
  HOUSING: 'आवास (PMAY)',
  PWD: 'लोक निर्माण (PWD)',
  URBAN_DEV: 'शहरी विकास',
  ANTI_CORRUPTION: 'राज्य भ्रष्टाचार निरोधक कक्ष',
  GRIEVANCE: 'जिला शिकायत कक्ष',
};

const TE: OfficeLabels = {
  CIVIL_SUPPLIES: 'పౌర సరఫరాలు (రేషన్)',
  RURAL_DEV: 'గ్రామీణాభివృద్ధి (MGNREGA)',
  PENSION: 'పింఛను విభాగం (NSAP)',
  PM_KISAN: 'పీఎం-కిసాన్ PMU',
  HEALTH: 'ఆరోగ్యం / PM-JAY ఫిర్యాదు',
  SUPPLY_LPG: 'జిల్లా సరఫరా / గ్యాస్',
  HOUSING: 'గృహనిర్మాణం (PMAY)',
  PWD: 'ప్రజా పనులు (PWD)',
  URBAN_DEV: 'పట్టణాభివృద్ధి',
  ANTI_CORRUPTION: 'రాష్ట్ర అవినీతి నిరోధక విభాగం',
  GRIEVANCE: 'జిల్లా ఫిర్యాదుల విభాగం',
};

const OFFICE_L10N: Record<string, OfficeLabels> = { en: EN, hi: HI, te: TE };

// Localized office name (English fallback for any missing language).
export function officeLabel(lang: string, code: OfficeCode): string {
  const table = OFFICE_L10N[lang] || EN;
  return table[code] || EN[code] || code;
}

// English office name — for stored/officer-canonical values and the ticket route.
export const officeName = (code: OfficeCode): string => EN[code] || code;
