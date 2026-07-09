// ============================================================================
// Front-end API client. Talks to the Netlify Functions via /api/* (mapped in
// netlify.toml). Never touches the Anthropic key — that lives server-side.
// ============================================================================
import type { ClassifyResult, CreateTicketInput, Ticket, TicketEvent } from './types';

// Below this the classification is too shaky to route automatically and we fall
// back to the guided menus. Kept deliberately low: when the model has committed
// to a concrete scheme/issue we'd rather route it than send a citizen who spoke
// a perfectly clear complaint back through the manual taps.
const CONFIDENCE_FLOOR = 0.4;

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json() as Promise<T>;
}

// Live NLU. Returns null when the model is unsure or unavailable, which the
// citizen flow treats as a cue to fall back to the guided menus.
export async function classifyGrievance(
  text: string,
  lang: string,
): Promise<ClassifyResult | null> {
  try {
    const result = await postJson<ClassifyResult & { _fallback?: boolean }>(
      '/api/classify',
      { text, lang },
    );
    // The classifier errored server-side — fall back to the guided menus.
    if (result._fallback) return null;
    // Nothing concrete was identified — let the citizen pick from the menus.
    if (result.scheme === 'other' && result.issue === 'other') return null;
    // A concrete scheme/issue was found but the model is genuinely unsure.
    if (result.confidence < CONFIDENCE_FLOOR) return null;
    return result;
  } catch (err) {
    console.error('classifyGrievance failed:', err);
    return null;
  }
}

export async function createTicket(
  input: CreateTicketInput,
): Promise<{ id: string; priority: boolean }> {
  return postJson('/api/create-ticket', input);
}

// ---- C4: display-only translation with a per-(text,lang) cache --------------
// Switching language re-renders prior free text in the new script. Each unique
// (text → targetLang) result is cached in-memory so switching back, or switching
// again to a seen language, costs zero extra API calls / tokens.
const translateCache = new Map<string, string>();
const ckey = (text: string, lang: string) => `${lang}::${text}`;

export async function translateTexts(texts: string[], targetLang: string): Promise<string[]> {
  // Serve what we can from cache; only request the misses.
  const missIdx: number[] = [];
  const misses: string[] = [];
  const result = texts.map((t, i) => {
    const hit = translateCache.get(ckey(t, targetLang));
    if (hit !== undefined) return hit;
    missIdx.push(i);
    misses.push(t);
    return t; // placeholder, filled below
  });
  if (!misses.length) return result;

  try {
    const { translations } = await postJson<{ translations: string[] }>(
      '/api/translate',
      { texts: misses, targetLang },
    );
    missIdx.forEach((origIdx, k) => {
      const val = translations[k] ?? texts[origIdx];
      translateCache.set(ckey(texts[origIdx], targetLang), val);
      result[origIdx] = val;
    });
  } catch (err) {
    console.error('translateTexts failed:', err);
    // Leave the placeholders (originals) — display just stays as-is.
  }
  return result;
}

// Upload a recorded voice note; returns the clip id to attach to the ticket.
// Returns null on failure so the flow can continue without the audio.
export async function uploadVoiceClip(input: {
  audioBase64: string;
  mime: string;
  lang: string;
  phone: string;
  transcript: string;
}): Promise<{ id: string; url: string } | null> {
  try {
    return await postJson<{ id: string; url: string }>('/api/upload-voice', input);
  } catch (err) {
    console.error('uploadVoiceClip failed:', err);
    return null;
  }
}

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch('/api/tickets');
  if (!res.ok) throw new Error(`/api/tickets -> ${res.status}`);
  const data = (await res.json()) as { tickets: Ticket[] };
  return data.tickets;
}

// A citizen's own complaints (by self-declared phone), newest first.
export async function fetchTicketsByPhone(phone: string): Promise<Ticket[]> {
  const res = await fetch(`/api/tickets?phone=${encodeURIComponent(phone)}`);
  if (!res.ok) throw new Error(`/api/tickets?phone -> ${res.status}`);
  const data = (await res.json()) as { tickets: Ticket[] };
  return data.tickets;
}

// O1 — officer-triggered regeneration of a ticket's stored AI analysis. The only
// live-call path on the officer side; surfaces errors so the UI can show them.
export async function regenerateAnalysis(id: string): Promise<{
  ai_root_cause: string;
  ai_suggested_resolution: string;
  ai_cross_scheme: string[];
  ai_generated_at: string;
}> {
  return postJson('/api/regenerate-analysis', { id });
}

// O3 — route a ticket to another office with a mandatory comment. Validated on
// the client (fast feedback) and again on the server (authoritative).
export async function routeTicket(input: {
  id: string;
  to_office: string;
  comment: string;
  actor_phone: string;
  from_office?: string;
}): Promise<{ event: TicketEvent; current_office: string }> {
  if (!input.comment.trim()) {
    throw new Error('A routing comment is required (type a reason or "N/A").');
  }
  return postJson('/api/route-ticket', input);
}

export async function updateTicketStatus(
  id: string,
  status: Ticket['status'],
): Promise<void> {
  const res = await fetch('/api/tickets', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error(`PATCH /api/tickets -> ${res.status}`);
}
