import { createClient } from "@supabase/supabase-js";

const supabaseURL = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseURL) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable!');
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable!');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

console.log('✅ Supabase Config:', {
  url: supabaseURL,
  hasKey: !!supabaseAnonKey
});

// Single, well-configured Supabase client
export const supabase = createClient(supabaseURL, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    
    // Secure storage configuration
    storage: {
      getItem: (key: string) => {
        try {
          return localStorage.getItem(key);
        } catch {
          return null;
        }
      },
      setItem: (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
        } catch {
          // Silently fail if storage is unavailable
        }
      },
      removeItem: (key: string) => {
        try {
          localStorage.removeItem(key);
        } catch {
          // Silently fail
        }
      },
    },
  },
  
  // Optimized realtime configuration
  realtime: {
    params: {
      eventsPerSecond: 5,
    },
  },
  
  // Global request configuration
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
});
