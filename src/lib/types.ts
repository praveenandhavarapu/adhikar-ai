// ============================================================================
// Shared domain types. Imported by both the React front-end and the Netlify
// Functions so the API contract is enforced by the compiler on both sides.
// ============================================================================

export type SchemeCode =
  | 'pds'
  | 'mgnrega'
  | 'nsap'
  | 'pmkisan'
  | 'pmjay'
  | 'ujjwala'
  | 'awas'
  | 'other';

export type IssueCode =
  | 'stopped'
  | 'biometric'
  | 'payment'
  | 'denied'
  | 'bribe'
  | 'details'
  | 'other';

export type TicketStatus =
  | 'open'
  | 'progress'
  | 'escalated'
  | 'resolved';

export type LangCode =
  | 'hi' | 'ta' | 'te' | 'bn' | 'or' | 'mr' | 'gu' | 'pa'
  | 'kn' | 'ml' | 'ur' | 'as' | 'bh' | 'mai' | 'en';

// Structured fields the NLU may extract from free text. All optional —
// whatever the model couldn't find is asked via the guided follow-up.
export interface ExtractedFields {
  duration?: string;
  location?: string;
  amount?: string;
  bank?: string;
  person_age?: string;
  occupation?: string;
  paid?: string;
  bank_linked?: string;
  detail_field?: string;
}

// ---- /api/classify response ------------------------------------------------
export interface ClassifyResult {
  scheme: SchemeCode;
  issue: IssueCode;
  confidence: number;        // 0..1 — below CONFIDENCE_FLOOR we fall back to menus
  english_summary: string;   // one-sentence officer-facing translation
  extracted: ExtractedFields;
  missing: string[];         // field keys the citizen still needs to provide
  priority: boolean;         // true for bribe / corruption — fast lane
}

// ---- /api/create-ticket request --------------------------------------------
export interface CreateTicketInput {
  name: string;
  lang: LangCode;
  state: string;
  district: string;
  scheme: SchemeCode;
  issue: IssueCode;
  priority: boolean;
  original_text: string;      // citizen's words, original language
  english_summary: string;    // NLU translation
  extracted: ExtractedFields;
  detail_rows: Array<[string, string]>; // [label, value] for officer display
}

// ---- A ticket as stored + returned -----------------------------------------
export interface Ticket {
  id: string;                 // ADH-2026-#####
  name: string;
  lang: LangCode;
  lang_label: string;
  state: string;
  district: string;
  scheme: SchemeCode;
  issue: IssueCode;
  status: TicketStatus;
  priority: boolean;
  sla: 'std' | 'pri';
  contact_masked: string;
  route: string;              // which government cell handles it
  original_text: string;
  english_summary: string;
  detail_rows: Array<[string, string]>;
  // Officer-side AI, generated once at intake and persisted:
  ai_root_cause: string;      // plain-language root-cause analysis
  ai_suggested_resolution: string; // recommended officer action
  ai_cross_scheme: string[];  // other schemes likely hit by same root cause
  created_at: string;         // ISO timestamp
  age_days: number;           // derived for SLA display
}
