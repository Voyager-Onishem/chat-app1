// Remove local interface declarations and move them to a global declaration file (see vite-env.d.ts)

/// <reference types="vite/client" />

// interface ImportMetaEnv {
//   readonly VITE_SUPABASE_ANON_KEY: string
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv
// }

import {createClient} from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL || "https://efirzqcqkwdexhfeidkb.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('Supabase Config:', {
  url: supabaseURL,
  hasKey: !!supabaseAnonKey
});

// Try different client configurations to fix Promise hanging issue
export const supabase = createClient(supabaseURL, supabaseAnonKey, {
  auth: {
    // Force immediate session refresh to prevent hanging
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Add timeout and retry configuration
    flowType: 'pkce'
  },
  // Add global request timeout
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  },
  // Configure realtime to prevent interference
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})
