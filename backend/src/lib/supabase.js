import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Without these, createClient throws "supabaseKey is required" at import time,
// which crashes the entire serverless function (every route returns 500), not
// just the Google route. Guard with placeholders and log loudly instead so the
// rest of the API stays up and the misconfiguration is visible in the logs.
export const isSupabaseConfigured = Boolean(url && key);
if (!isSupabaseConfigured) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY — Google sign-in will not work');
}

const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder-key',
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export default supabase;
