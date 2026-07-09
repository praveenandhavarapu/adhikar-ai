// ============================================================================
// POST /api/create-ticket
// Persists a grievance to Supabase. BEFORE storing, it runs the officer-side
// AI ONCE (root cause, suggested resolution, cross-scheme risk) and saves the
// output — so the officer dashboard is instant, stable, and auditable.
// ============================================================================
import type { Handler } from '@netlify/functions';
import {
  getAnthropic, getSupabase, MODEL, parseJsonFromClaude, ok, bad, preflight,
} from './_shared';
import type { CreateTicketInput } from '../../src/lib/types';
import { routeFor, schemeLong } from '../../src/data/schemes';
import { langLabel } from '../../src/data/languages';
import { officeForCategory, officeName } from '../../src/data/offices';

const ANALYST_SYSTEM = `You are a senior welfare-grievance analyst advising an Indian district officer. Given a structured complaint, produce a tight, actionable analysis. Be concrete and specific to Indian welfare administration (Aadhaar, DBT, NPCI mapping, eKYC, LALA rule, biometric exception clauses, Jan Dhan, FPS/CSC). No fluff.

Respond with ONLY JSON, no markdown:
{
  "root_cause": "1-2 sentences naming the likely underlying cause",
  "suggested_resolution": "1-2 sentences of concrete officer action",
  "cross_scheme": ["scheme codes likely hit by the same root cause, from: pds,mgnrega,nsap,pmkisan,pmjay,ujjwala,awas — [] if none"]
}`;

function genId(): string {
  const n = 440 + Math.floor(Math.random() * 559); // 00440–00998
  return `ADH-2026-00${n}`;
}

interface AnalystOut {
  root_cause: string;
  suggested_resolution: string;
  cross_scheme: string[];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return bad('Method not allowed', 405);

  let input: CreateTicketInput;
  try {
    input = JSON.parse(event.body || '{}');
  } catch {
    return bad('Invalid JSON body');
  }
  if (!input.name || !input.scheme || !input.issue) {
    return bad('name, scheme and issue are required');
  }

  // ---- Run officer-side AI once -------------------------------------------
  let analysis: AnalystOut = { root_cause: '', suggested_resolution: '', cross_scheme: [] };
  try {
    const client = getAnthropic();
    const detail = input.detail_rows.map(([k, v]) => `${k}: ${v}`).join('\n');
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: ANALYST_SYSTEM,
      messages: [{
        role: 'user',
        content:
          `Scheme: ${schemeLong(input.scheme)}\nIssue: ${input.issue}\n` +
          `District: ${input.district}, ${input.state}\n` +
          `Citizen said (English): ${input.english_summary}\n${detail}`,
      }],
    });
    analysis = parseJsonFromClaude<AnalystOut>(msg.content);
  } catch (err) {
    console.error('analyst error (ticket still saved):', err);
  }

  // ---- Persist -------------------------------------------------------------
  const id = genId();
  const status = input.priority ? 'escalated' : 'open';
  const nowIso = new Date().toISOString();
  // O1 — structured analysis fields, all derived from the SINGLE classify call
  // that already ran in the citizen flow (no extra LLM call here). The owning
  // office is both the recommendation and the initial holding office.
  const recOffice = officeName(officeForCategory(input.scheme, input.issue));
  const monthKey = nowIso.slice(0, 7); // YYYY-MM
  // Mask the self-declared phone for officer display (keep last 4 visible).
  const phone = (input.phone || '').replace(/\D/g, '');
  const masked = phone
    ? '•••• ••' + phone.slice(-4, -2) + ' ' + phone.slice(-2)
    : '•••• ••' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89);
  // The route (holding desk) is always resolvable — routeFor / officeForCategory
  // fall back to a valid default for any (scheme, issue, district), so a broken
  // routing lookup can never be the thing that blocks ticket creation.
  const route = routeFor(input.scheme, input.issue, input.district);

  // BASE row: only columns that exist in every deployed schema version. This is
  // what actually creates the ticket, so create-ticket succeeds even if the v2
  // migration has not been applied to this database yet.
  const baseRow = {
    id,
    name: input.name,
    phone,
    lang: input.lang,
    lang_label: langLabel(input.lang),
    state: input.state,
    district: input.district,
    scheme: input.scheme,
    issue: input.issue,
    status,
    priority: input.priority,
    sla: input.priority ? 'pri' : 'std',
    contact_masked: masked,
    route,
    original_text: input.original_text || '',
    english_summary: input.english_summary || '',
    detail_rows: input.detail_rows || [],
    ai_root_cause: analysis.root_cause || '',
    ai_suggested_resolution: analysis.suggested_resolution || '',
    ai_cross_scheme: Array.isArray(analysis.cross_scheme) ? analysis.cross_scheme : [],
    updates: [{ ts: nowIso, status }],
  };

  // EXTENDED columns added by the v2 migration. Applied as a best-effort follow-up
  // update so a database still on the old schema does not block ticket creation.
  const extendedPatch = {
    ai_summary: input.english_summary || '',
    ai_category: input.scheme,
    ai_issue_family: input.issue,
    ai_recommended_office: recOffice,
    ai_confidence: typeof input.confidence === 'number' ? input.confidence : 0,
    ai_generated_at: nowIso,
    current_office: recOffice,
    resolved_at: null as string | null,
    target_month_key: monthKey,
  };

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('create-ticket: supabase config error:', err);
    return bad('Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.', 500);
  }

  // 1) Create the ticket with the always-present base columns.
  const { error: insErr } = await supabase.from('tickets').insert(baseRow);
  if (insErr) {
    // Surface the ACTUAL database error (message + code + details) instead of a
    // generic failure, so routing/schema problems are diagnosable from the logs
    // and the client response.
    console.error('create-ticket: base insert failed', {
      message: insErr.message, code: (insErr as any).code,
      details: (insErr as any).details, hint: (insErr as any).hint,
      scheme: input.scheme, issue: input.issue, district: input.district, route,
    });
    return bad(`Could not save the complaint: ${insErr.message || 'database insert failed'}`, 500);
  }

  // 2) Best-effort: enrich with the v2 columns. If they don't exist yet (old
  //    schema), the ticket is already saved — log and carry on rather than fail.
  const { error: updErr } = await supabase.from('tickets').update(extendedPatch).eq('id', id);
  if (updErr) {
    console.warn('create-ticket: extended columns not applied (ticket still saved). Run the v2 migration.', {
      message: updErr.message, code: (updErr as any).code,
    });
  }

  // 3) Best-effort: link an uploaded voice note to this ticket.
  if (input.voice_clip_id) {
    const { error: linkErr } = await supabase
      .from('voice_clips')
      .update({ ticket_id: id })
      .eq('id', input.voice_clip_id);
    if (linkErr) console.error('create-ticket: voice clip link error (ticket still saved):', linkErr.message);
  }

  return ok({ id, priority: input.priority, route });
};
