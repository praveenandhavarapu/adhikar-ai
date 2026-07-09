// ============================================================================
// POST /api/regenerate-analysis  { id }
// The ONLY live-call path on the officer side (O1). Officer-triggered: re-runs
// the analyst on a stored ticket and overwrites the stored ai_* analysis fields.
// Normal dashboard views never call this — they read the fields saved at intake.
// ============================================================================
import type { Handler } from '@netlify/functions';
import {
  getAnthropic, getSupabase, MODEL, parseJsonFromClaude, ok, bad, preflight,
} from './_shared';
import { schemeLong } from '../../src/data/schemes';

const ANALYST_SYSTEM = `You are a senior welfare-grievance analyst advising an Indian district officer. Given a structured complaint, produce a tight, actionable analysis. Be concrete and specific to Indian welfare administration (Aadhaar, DBT, NPCI mapping, eKYC, LALA rule, biometric exception clauses, Jan Dhan, FPS/CSC). No fluff.

Respond with ONLY JSON, no markdown:
{
  "root_cause": "1-2 sentences naming the likely underlying cause",
  "suggested_resolution": "1-2 sentences of concrete officer action",
  "cross_scheme": ["scheme codes likely hit by the same root cause, from: pds,mgnrega,nsap,pmkisan,pmjay,ujjwala,awas — [] if none"]
}`;

interface AnalystOut {
  root_cause: string;
  suggested_resolution: string;
  cross_scheme: string[];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return bad('Method not allowed', 405);

  let id = '';
  try {
    id = (JSON.parse(event.body || '{}').id || '').toString();
  } catch {
    return bad('Invalid JSON body');
  }
  if (!id) return bad('Field "id" is required');

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('supabase config error:', err);
    return bad('Database is not configured.', 500);
  }

  const { data: t, error: readErr } = await supabase
    .from('tickets')
    .select('scheme, issue, district, state, english_summary, detail_rows')
    .eq('id', id)
    .single();
  if (readErr || !t) {
    console.error('regenerate read error:', readErr);
    return bad('Ticket not found', 404);
  }

  let analysis: AnalystOut;
  try {
    const client = getAnthropic();
    const detail = Array.isArray(t.detail_rows)
      ? t.detail_rows.map((r: [string, string]) => `${r[0]}: ${r[1]}`).join('\n')
      : '';
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 500,
      system: ANALYST_SYSTEM,
      messages: [{
        role: 'user',
        content:
          `Scheme: ${schemeLong(t.scheme)}\nIssue: ${t.issue}\n` +
          `District: ${t.district}, ${t.state}\n` +
          `Citizen said (English): ${t.english_summary}\n${detail}`,
      }],
    });
    analysis = parseJsonFromClaude<AnalystOut>(msg.content);
  } catch (err) {
    console.error('regenerate analyst error:', err);
    return bad('Could not regenerate the analysis. Please try again.', 502);
  }

  const patch = {
    ai_root_cause: analysis.root_cause || '',
    ai_suggested_resolution: analysis.suggested_resolution || '',
    ai_cross_scheme: Array.isArray(analysis.cross_scheme) ? analysis.cross_scheme : [],
    ai_generated_at: new Date().toISOString(),
  };
  const { error: updErr } = await supabase.from('tickets').update(patch).eq('id', id);
  if (updErr) {
    console.error('regenerate update error:', updErr);
    return bad('Could not save the regenerated analysis.', 500);
  }

  return ok({ id, ...patch });
};
