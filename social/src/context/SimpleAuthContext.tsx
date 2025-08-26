import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../supabase-client';
import type { UserProfile } from '../types';

// Import query client for cache cleanup
let queryClient: any = null;
try {
  // Dynamically import to avoid circular dependency
  import('../main').then(({ queryClient: qc }) => {
    queryClient = qc;
  });
} catch (error) {
  // Silently fail - not critical
}

interface SimpleAuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export function SimpleAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // One-time cleanup of old auth data (non over-engineered approach)
    const cleanupOldAuthData = () => {
      const oldKeys = [
        'alumni_network_session',
        'alumni_network_profile', 
        'alumni_network_last_activity',
        'alumni_network_notifications',
        'alumni_network_connections'
      ];
      
      try {
        oldKeys.forEach(key => {
          if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
          }
        });
      } catch (error) {
        // Silently fail - not critical
      }
    };

    // Clean up old data once
    cleanupOldAuthData();
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
      }
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes - Supabase handles all the complexity
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event, session ? 'Session active' : 'No session');
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Fetch profile only when needed
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Simple cross-tab sync (non over-engineered approach)
    const handleStorageChange = (event: StorageEvent) => {
      // Only respond to Supabase auth changes
      if (event.key?.startsWith('sb-') && event.key.includes('auth-token')) {
        // Refresh session when auth changes in another tab
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user !== user) {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
              fetchProfile(session.user.id);
            } else {
              setProfile(null);
            }
          }
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Simple window visibility handling (non over-engineered approach)
    const handleVisibilityChange = () => {
      // Only act when page becomes visible again
      if (!document.hidden && user) {
        console.log('Page visible again - verifying session...');
        
        // Simple session verification (trust Supabase's token refresh)
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            console.log('Session verification failed:', error);
            // Let Supabase auth state change handle the rest
            return;
          }
          
          // Only update if session state actually changed
          if (session?.user?.id !== user?.id) {
            console.log('Session changed while window was hidden');
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              fetchProfile(session.user.id);
            } else {
              setProfile(null);
            }
          }
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error);
      }
      
      // Simple cookie cleanup (non over-engineered approach)
      try {
        // Clear any auth-related cookies
        document.cookie.split(";").forEach(cookie => {
          const eqPos = cookie.indexOf("=");
          const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
          if (name.includes('sb-') || name.includes('auth') || name.includes('supabase')) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      } catch (cookieError) {
        // Silently fail - not critical
      }
      
      // Clear React Query cache (simple approach)
      try {
        if (queryClient) {
          queryClient.clear();
        }
      } catch (cacheError) {
        // Silently fail - not critical
      }
      
      // Supabase will automatically trigger onAuthStateChange
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signOut,
    refreshProfile,
  };

  return (
    <SimpleAuthContext.Provider value={value}>
      {children}
    </SimpleAuthContext.Provider>
  );
}

export function useSimpleAuth() {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
}
