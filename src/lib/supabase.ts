import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

/** Set when the env vars are missing; main.tsx shows it instead of a blank page. */
export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Locally, copy .env.example to .env.local and fill both values from Supabase → Project Settings → API, then restart `npm run dev`. On Vercel/Netlify, add both as environment variables and redeploy.'
    : null;

// Only created when configured; the app is never rendered otherwise (see main.tsx).
export const supabase = (
  supabaseConfigError
    ? null
    : createClient(supabaseUrl!, supabaseAnonKey!, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
) as SupabaseClient;
