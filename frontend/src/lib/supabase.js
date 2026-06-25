import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY — Google sign-in will not work');
}

// Fall back to harmless placeholders when env vars are missing. Without these,
// createClient throws synchronously at import time and white-screens any page
// (e.g. /login) that imports this module.
const supabase = createClient(url ?? 'https://placeholder.supabase.co', key ?? 'placeholder', {
  auth: {
    flowType: 'implicit',
    detectSessionInUrl: true,
    persistSession: true,
    storage: window.localStorage,
  },
});

export default supabase;
