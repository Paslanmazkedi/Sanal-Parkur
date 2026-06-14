import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Ensure a single Supabase client instance across the app to avoid
// "Multiple GoTrueClient instances" warnings in the browser.
if (!globalThis.supabaseProductionClient) {
  globalThis.supabaseProductionClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: { schema: 'production' },
  });
}

export const supabase = globalThis.supabaseProductionClient;
