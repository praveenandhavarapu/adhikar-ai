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
  // Mask the self-declared phone for officer display (keep last 4 visible).
  const phone = (input.phone || '').replace(/\D/g, '');
  const masked = phone
    ? '•••• ••' + phone.slice(-4, -2) + ' ' + phone.slice(-2)
    : '•••• ••' + Math.floor(10 + Math.random() * 89) + ' ' + Math.floor(10 + Math.random() * 89);
  const row = {
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
    route: routeFor(input.scheme, input.issue, input.district),
    original_text: input.original_text || '',
    english_summary: input.english_summary || '',
    detail_rows: input.detail_rows || [],
    ai_root_cause: analysis.root_cause || '',
    ai_suggested_resolution: analysis.suggested_resolution || '',
    ai_cross_scheme: Array.isArray(analysis.cross_scheme) ? analysis.cross_scheme : [],
    updates: [{ ts: new Date().toISOString(), status }],
  };

  try {
    const supabase = getSupabase();
    const { error } = await supabase.from('tickets').insert(row);
    if (error) throw error;

    // Link an uploaded voice note to this ticket (best-effort — ticket already saved).
    if (input.voice_clip_id) {
      const { error: linkErr } = await supabase
        .from('voice_clips')
        .update({ ticket_id: id })
        .eq('id', input.voice_clip_id);
      if (linkErr) console.error('voice clip link error (ticket still saved):', linkErr);
    }
  } catch (err) {
    console.error('supabase insert error:', err);
    return bad('Could not save the complaint. Please try again.', 500);
  }

  return ok({ id, priority: input.priority });
};
