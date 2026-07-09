// ============================================================================
// POST /api/translate
// Display-only translation / transliteration for the citizen chat (C4). When a
// citizen switches language mid-session, their previously typed free text is
// re-rendered in the new script: sentences are translated by meaning, proper
// nouns (names, places) are transliterated. ONE batched call per switch; the
// client caches per (text, targetLang) so switching back costs nothing.
//
// This never changes the canonical stored value on a ticket — that stays the
// normalized English summary + the original text. This is a view layer only.
// ============================================================================
import type { Handler } from '@netlify/functions';
import { getAnthropic, MODEL, parseJsonFromClaude, ok, bad, preflight } from './_shared';

const SYSTEM = `You convert short citizen-chat messages into a target Indian language for DISPLAY only.

Rules:
- Translate ordinary words/sentences by MEANING into the target language's script.
- For proper nouns (people's names, village/town/place names), TRANSLITERATE the sounds into the target script — do not translate their meaning.
- Keep phone numbers, ticket IDs, and digits unchanged.
- Preserve the message's meaning and tone; do not add or omit information.
- Return the SAME number of items, in the SAME order as the input.

Respond with ONLY a JSON object, no prose, no markdown:
{"translations": ["...", "..."]}`;

const LANG_NAME: Record<string, string> = {
  hi: 'Hindi', ta: 'Tamil', te: 'Telugu', bn: 'Bengali', or: 'Odia', mr: 'Marathi',
  gu: 'Gujarati', pa: 'Punjabi', kn: 'Kannada', ml: 'Malayalam', ur: 'Urdu',
  as: 'Assamese', bh: 'Bhojpuri', mai: 'Maithili', en: 'English',
};

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return bad('Method not allowed', 405);

  let texts: string[] = [];
  let target = 'en';
  try {
    const body = JSON.parse(event.body || '{}');
    texts = Array.isArray(body.texts) ? body.texts.map((t: unknown) => String(t)) : [];
    target = (body.targetLang || 'en').toString();
  } catch {
    return bad('Invalid JSON body');
  }
  if (!texts.length) return ok({ translations: [] });

  const targetName = LANG_NAME[target] || 'English';

  try {
    const client = getAnthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM,
      messages: [{
        role: 'user',
        content:
          `Target language: ${targetName}\n` +
          `Convert each item for display in ${targetName}:\n` +
          JSON.stringify(texts),
      }],
    });
    const parsed = parseJsonFromClaude<{ translations: string[] }>(msg.content);
    let out = Array.isArray(parsed.translations) ? parsed.translations : [];
    // Never return fewer items than asked — pad with the originals so the client
    // can map 1:1 safely.
    if (out.length < texts.length) {
      out = texts.map((t, i) => out[i] ?? t);
    }
    return ok({ translations: out.slice(0, texts.length) });
  } catch (err) {
    console.error('translate error:', err);
    // Fall back to the originals — display just stays in the old script.
    return ok({ translations: texts });
  }
};
