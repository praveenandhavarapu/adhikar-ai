// ============================================================================
// POST /api/route-ticket  { id, to_office, comment, actor_phone, from_office? }
// O3 — routes a ticket to another office. A NON-EMPTY comment is mandatory
// (validated here on the server as well as in the UI). Writes a ticket_events
// row (the tracking trail the citizen can see) and updates the holding office.
// ============================================================================
import type { Handler } from '@netlify/functions';
import { getSupabase, ok, bad, preflight } from './_shared';

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return bad('Method not allowed', 405);

  let id = '', toOffice = '', comment = '', actorPhone = '', fromOffice = '';
  try {
    const b = JSON.parse(event.body || '{}');
    id = (b.id || '').toString();
    toOffice = (b.to_office || '').toString().trim();
    comment = (b.comment || '').toString().trim();
    actorPhone = (b.actor_phone || '').toString().replace(/\D/g, '');
    fromOffice = (b.from_office || '').toString().trim();
  } catch {
    return bad('Invalid JSON body');
  }

  if (!id) return bad('Field "id" is required');
  if (!toOffice) return bad('Field "to_office" is required');
  // Mandatory comment — the officer must state a reason (or literally "N/A").
  if (!comment) return bad('A routing comment is required (type a reason or "N/A").');

  let supabase;
  try {
    supabase = getSupabase();
  } catch (err) {
    console.error('supabase config error:', err);
    return bad('Database is not configured.', 500);
  }

  // Prefer the recorded holding office as the "from" when the client didn't send it.
  if (!fromOffice) {
    const { data: cur } = await supabase
      .from('tickets').select('current_office').eq('id', id).single();
    fromOffice = (cur?.current_office || '').toString();
  }

  const nowIso = new Date().toISOString();
  const { data: inserted, error: evErr } = await supabase
    .from('ticket_events')
    .insert({
      ticket_id: id,
      from_office: fromOffice,
      to_office: toOffice,
      comment,
      actor_phone: actorPhone,
      created_at: nowIso,
    })
    .select()
    .single();
  if (evErr) {
    console.error('ticket_events insert error:', evErr);
    return bad('Could not record the routing event.', 500);
  }

  const { error: updErr } = await supabase
    .from('tickets')
    .update({ current_office: toOffice, status: 'progress' })
    .eq('id', id);
  if (updErr) {
    console.error('ticket current_office update error:', updErr);
    return bad('Routed event recorded but could not update the holding office.', 500);
  }

  return ok({ event: inserted, current_office: toOffice });
};
