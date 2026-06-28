// ============================================================================
// Browser-side Supabase client (anon key, RLS-protected). The app currently
// reads tickets through the /api/tickets function; this client is here for
// when you want direct reads or realtime subscriptions on the dashboard.
// ============================================================================
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const supabase =
  url && anonKey ? createClient(url, anonKey, { auth: { persistSession: false } }) : null;
