// ============================================================================
// Shared helpers for Netlify Functions. Secrets are read from env at runtime
// and never reach the browser.
// ============================================================================
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

export const MODEL = 'claude-sonnet-4-6';

export function getAnthropic(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
  return new Anthropic({ apiKey });
}

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_KEY is not set');
  return createClient(url, key, { auth: { persistSession: false } });
}

export const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
};

export function ok(body: unknown) {
  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

export function bad(message: string, code = 400) {
  return { statusCode: code, headers: JSON_HEADERS, body: JSON.stringify({ error: message }) };
}

export function preflight() {
  return { statusCode: 204, headers: JSON_HEADERS, body: '' };
}

// Pull the first text block out of a Claude response and parse it as JSON,
// tolerating accidental markdown fences.
export function parseJsonFromClaude<T>(content: Anthropic.Messages.ContentBlock[]): T {
  const text = content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .replace(/```json|```/g, '')
    .trim();
  return JSON.parse(text) as T;
}
