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
  bank?: string;          // free-text bank name (which_bank question)
  which_bank?: string;
  person_age?: string;
  occupation?: string;
  paid?: string;
  bank_linked?: string;
  detail_field?: string;
  // deeper diagnostics added for richer officer context:
  ekyc_done?: string;
  reason_given?: string;
  docs_status?: string;
  attempts?: string;
  alt_auth_offered?: string;
  recent_bank_change?: string;
  repeat_demand?: string;
  official_role?: string;
  denial_reason?: string;  // free-text
  card_status?: string;
  docs_available?: string;
}

// ---- /api/classify response ------------------------------------------------
export interface ClassifyResult {
  scheme: SchemeCode;
  issue: IssueCode;
  confidence: number;        // 0..1 — below CONFIDENCE_FLOOR we fall back to menus
  english_summary: string;   // one-sentence officer-facing translation
  citizen_ack: string;       // warm one-sentence ack, written in citizen's language
  extracted: ExtractedFields;
  missing: string[];         // field keys the citizen still needs to provide
  priority: boolean;         // true for bribe / corruption — fast lane
}

// ---- Voice clip stored in Supabase Storage + voice_clips table --------------
export interface VoiceClip {
  id: string;
  ticket_id: string | null;
  phone: string | null;
  lang: string;
  url: string;               // public URL to the audio file
  transcript: string;        // silent on-device transcript, used for classify
  created_at: string;
}

// ---- /api/create-ticket request --------------------------------------------
export interface CreateTicketInput {
  name: string;
  phone: string;              // self-declared device phone, used as user id
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
  voice_clip_id?: string;     // links an uploaded voice note to this ticket
  confidence?: number;        // classifier confidence, stored as ai_confidence
}

// One entry in a ticket's status-change history.
export interface TicketUpdate {
  ts: string;                 // ISO timestamp
  status: TicketStatus;
}

// ---- A ticket as stored + returned -----------------------------------------
export interface Ticket {
  id: string;                 // ADH-2026-#####
  name: string;
  phone: string;              // self-declared device phone (user id)
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
  // Phase 3 (O1) — structured analysis stored at intake, read without any API call:
  ai_summary: string;         // officer-facing one-line summary (= english_summary)
  ai_category: string;        // classified scheme code
  ai_issue_family: string;    // classified issue code
  ai_recommended_office: string; // owning office (English name)
  ai_confidence: number;      // classifier confidence 0..1
  ai_generated_at: string | null;
  current_office: string;     // office currently holding the ticket (tracking)
  resolved_at: string | null; // set when status → resolved
  target_month_key: string;   // YYYY-MM for monthly aggregates
  updates: TicketUpdate[];    // status-change history (timeline)
  events?: TicketEvent[];     // routing hops with comments (tracking trail, O3)
  voice_clips?: VoiceClip[];  // embedded voice notes (officer can play)
  created_at: string;         // ISO timestamp
  age_days: number;           // derived for SLA display
}

// ---- ticket_events: routing hops with mandatory comments (O3) ---------------
export interface TicketEvent {
  id: string;
  ticket_id: string;
  from_office: string;
  to_office: string;
  comment: string;
  actor_phone: string;
  created_at: string;
}
