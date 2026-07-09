// ============================================================================
// GET   /api/tickets            -> list all tickets (officer dashboard)
// PATCH /api/tickets            -> { id, status } update a ticket's status
// ============================================================================
import type { Handler } from '@netlify/functions';
import { getSupabase, ok, bad, preflight } from './_shared';
import type { Ticket, TicketStatus } from '../../src/lib/types';

function ageDays(createdAt: string): number {
  const diff = Date.now() - new Date(createdAt).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'PATCH') {
    return bad('Method not allowed', 405);
  }

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('supabase config error:', err);
    return bad('Database is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.', 500);
  }

  if (event.httpMethod === 'GET') {
    // Optional ?phone= filter: a citizen tracking their own complaints, newest
    // first (no priority sort — they want chronological). Without it, this is
    // the officer dashboard: priority first, then newest.
    const phone = (event.queryStringParameters?.phone || '').replace(/\D/g, '');

    // Base ticket query. voice_clips is part of the base schema, so it is safe to
    // embed. ticket_events (v2) is fetched SEPARATELY below so that a database
    // still on the old schema (no ticket_events table) cannot break the whole
    // dashboard load — that regression is exactly the "Could not load tickets".
    let query = supabase
      .from('tickets')
      .select('*, voice_clips(*)');

    query = phone
      ? query.eq('phone', phone).order('created_at', { ascending: false })
      : query.order('priority', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      // Surface the real Postgres error (message + code) rather than a generic one.
      console.error('tickets list error:', { message: error.message, code: (error as any).code, details: (error as any).details });
      return bad(`Could not load tickets: ${error.message || 'query failed'}`, 500);
    }

    // Best-effort routing trail. If ticket_events is missing (old schema) we log
    // a warning and return tickets with empty trails instead of failing the load.
    const eventsByTicket: Record<string, any[]> = {};
    try {
      const ids = (data || []).map((t) => t.id);
      if (ids.length) {
        const { data: evs, error: evErr } = await supabase
          .from('ticket_events').select('*').in('ticket_id', ids);
        if (evErr) {
          console.warn('ticket_events unavailable (run the v2 migration):', evErr.message);
        } else {
          for (const e of evs || []) (eventsByTicket[e.ticket_id] ||= []).push(e);
        }
      }
    } catch (e) {
      console.warn('ticket_events fetch skipped:', e);
    }

    const tickets: Ticket[] = (data || []).map((t) => ({
      ...t,
      events: eventsByTicket[t.id] || [],
      age_days: ageDays(t.created_at),
    })) as Ticket[];
    return ok({ tickets });
  }

  // PATCH (method already validated above)
  let id = '';
  let status: TicketStatus = 'open';
  try {
    const body = JSON.parse(event.body || '{}');
    id = (body.id || '').toString();
    status = body.status;
  } catch {
    return bad('Invalid JSON body');
  }
  const allowed: TicketStatus[] = ['open', 'progress', 'escalated', 'resolved'];
  if (!id || !allowed.includes(status)) return bad('Valid id and status are required');

  // Append this change to the ticket's update history (timeline) so both the
  // officer and the citizen's tracking view can see what happened and when.
  const { data: existing, error: readErr } = await supabase
    .from('tickets')
    .select('updates')
    .eq('id', id)
    .single();
  if (readErr) {
    console.error('tickets read-before-update error:', readErr);
    return bad('Could not update the ticket', 500);
  }
  const nowIso = new Date().toISOString();
  const history = Array.isArray(existing?.updates) ? existing.updates : [];
  const updates = [...history, { ts: nowIso, status }];

  // Stamp resolved_at on resolution (powers monthly Home aggregates); clear it if
  // a resolved ticket is reopened to another status.
  const patch: Record<string, unknown> = { status, updates };
  patch.resolved_at = status === 'resolved' ? nowIso : null;

  const { error } = await supabase.from('tickets').update(patch).eq('id', id);
  if (error) {
    console.error('tickets update error:', error);
    return bad('Could not update the ticket', 500);
  }
  return ok({ id, status });
};
