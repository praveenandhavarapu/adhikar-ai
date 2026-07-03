// ============================================================================
// POST /api/upload-voice
// Receives a base64-encoded voice note, stores the audio in the "voice-clips"
// Supabase Storage bucket, records a row in voice_clips (with the silent
// transcript for the officer), and returns { id, url }. The returned id is
// later attached to the ticket via /api/create-ticket so the officer dashboard
// can play the citizen's actual voice.
// ============================================================================
import type { Handler } from '@netlify/functions';
import { getSupabase, ok, bad, preflight } from './_shared';

const BUCKET = 'voice-clips';

const EXT: Record<string, string> = {
  'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'audio/mpeg': 'mp3', 'audio/wav': 'wav',
};

function extFor(mime: string): string {
  const base = (mime || '').split(';')[0].trim();
  return EXT[base] || 'webm';
}

export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return preflight();
  if (event.httpMethod !== 'POST') return bad('Method not allowed', 405);

  let audioBase64 = '';
  let mime = 'audio/webm';
  let lang = 'en';
  let phone = '';
  let transcript = '';
  try {
    const body = JSON.parse(event.body || '{}');
    audioBase64 = (body.audioBase64 || '').toString();
    mime = (body.mime || 'audio/webm').toString();
    lang = (body.lang || 'en').toString();
    phone = (body.phone || '').toString();
    transcript = (body.transcript || '').toString();
  } catch {
    return bad('Invalid JSON body');
  }
  if (!audioBase64) return bad('Field "audioBase64" is required');

  const buffer = Buffer.from(audioBase64, 'base64');
  const path = `${lang}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extFor(mime)}`;

  try {
    const supabase = getSupabase();

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: (mime || '').split(';')[0] || 'audio/webm', upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const url = pub.publicUrl;

    const { data: row, error: insErr } = await supabase
      .from('voice_clips')
      .insert({ phone, lang, url, transcript })
      .select('id')
      .single();
    if (insErr) throw insErr;

    return ok({ id: row.id, url });
  } catch (err) {
    console.error('upload-voice error:', err);
    return bad('Could not save the voice note. Please try again.', 500);
  }
};
