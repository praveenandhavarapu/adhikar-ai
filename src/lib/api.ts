// ============================================================================
// Front-end API client. Talks to the Netlify Functions via /api/* (mapped in
// netlify.toml). Never touches the Anthropic key — that lives server-side.
// ============================================================================
import type { ClassifyResult, CreateTicketInput, Ticket } from './types';

const CONFIDENCE_FLOOR = 0.6;

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
    if (result._fallback || result.confidence < CONFIDENCE_FLOOR) return null;
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

export async function fetchTickets(): Promise<Ticket[]> {
  const res = await fetch('/api/tickets');
  if (!res.ok) throw new Error(`/api/tickets -> ${res.status}`);
  const data = (await res.json()) as { tickets: Ticket[] };
  return data.tickets;
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
