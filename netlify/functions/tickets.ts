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

    let query = supabase
      .from('tickets')
      .select('*, voice_clips(*)');

    query = phone
      ? query.eq('phone', phone).order('created_at', { ascending: false })
      : query.order('priority', { ascending: false }).order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('tickets list error:', error);
      return bad('Could not load tickets', 500);
    }
    const tickets: Ticket[] = (data || []).map((t) => ({
      ...t,
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
  const history = Array.isArray(existing?.updates) ? existing.updates : [];
  const updates = [...history, { ts: new Date().toISOString(), status }];

  const { error } = await supabase.from('tickets').update({ status, updates }).eq('id', id);
  if (error) {
    console.error('tickets update error:', error);
    return bad('Could not update the ticket', 500);
  }
  return ok({ id, status });
};
