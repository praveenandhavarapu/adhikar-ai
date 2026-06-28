// ============================================================================
// POST /api/classify
// Live NLU. Takes a citizen's free-text or transcribed grievance in any Indian
// language and returns a structured, routed classification for the guided flow.
// ============================================================================
import type { Handler } from '@netlify/functions';
import { getAnthropic, MODEL, parseJsonFromClaude, ok, bad, preflight } from './_shared';
import type { ClassifyResult } from '../../src/lib/types';

const SYSTEM = `You are the classification engine for AdhikarAI, an Indian government welfare grievance system. You receive a citizen's complaint in any Indian language (text or transcribed speech, often colloquial or misspelt). Classify it precisely so a district officer can act.

SCHEMES (pick exactly one "scheme"):
- pds: ration / food grains (PDS)
- mgnrega: employment wages (MGNREGA)
- nsap: pension — old age / widow / disability (NSAP)
- pmkisan: farmer income support (PM-KISAN)
- pmjay: health coverage (Ayushman Bharat PM-JAY)
- ujjwala: LPG gas connection (PM Ujjwala)
- awas: housing assistance (PM Awas Yojana)
- other: anything else / unclear

ISSUES (pick exactly one "issue"):
- stopped: benefit stopped or never arrived
- biometric: fingerprint / iris authentication fails
- payment: payment missing or to the wrong account
- denied: turned away at shop / hospital / office
- bribe: a bribe or unofficial payment was demanded
- details: personal details recorded incorrectly
- other

Set "priority": true ONLY for bribe / corruption.

Extract any of these into "extracted" (omit if absent): duration, location, amount, bank, person_age, occupation, paid, bank_linked, detail_field.

"missing": list which of [duration, location, amount, person_age, occupation, bank_linked, detail_field] are relevant to this issue type but NOT present in the message, so the app can ask follow-ups. Keep it short.

"english_summary": ONE clear English sentence an officer can read.

"confidence": 0..1 — your certainty in the scheme+issue classification. Use < 0.6 only when genuinely ambiguous.

Respond with ONLY a JSON object, no prose, no markdown:
{"scheme","issue","confidence","english_summary","extracted":{},"missing":[],"priority"}`;

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return bad('Method not allowed', 405);

  let text = '';
  let langCode = 'en';
  try {
    const body = JSON.parse(event.body || '{}');
    text = (body.text || '').toString().trim();
    langCode = (body.lang || 'en').toString();
  } catch {
    return bad('Invalid JSON body');
  }
  if (!text) return bad('Field "text" is required');

  try {
    const client = getAnthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Citizen language hint: ${langCode}\nComplaint: "${text}"` }],
    });

    const result = parseJsonFromClaude<ClassifyResult>(msg.content);

    // Defensive defaults so the front-end always gets a complete object.
    result.scheme = result.scheme || 'other';
    result.issue = result.issue || 'other';
    result.confidence = typeof result.confidence === 'number' ? result.confidence : 0.5;
    result.english_summary = result.english_summary || text;
    result.extracted = result.extracted || {};
    result.missing = Array.isArray(result.missing) ? result.missing : [];
    result.priority = result.issue === 'bribe' ? true : !!result.priority;

    return ok(result);
  } catch (err) {
    console.error('classify error:', err);
    // Signal the front-end to fall back to the manual menu path.
    return ok({
      scheme: 'other', issue: 'other', confidence: 0,
      english_summary: text, extracted: {}, missing: [], priority: false,
      _fallback: true,
    });
  }
};
