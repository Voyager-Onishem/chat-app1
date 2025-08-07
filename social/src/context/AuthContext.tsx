import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../supabase-client';
import type { UserProfile } from '../types';
import { logError } from '../utils/errorHandling';
import { 
  performCompleteLogout, 
  clearAllStorage, 
  clearAllCookies, 
  validateSessionOnStart,
  setupPageUnloadCleanup 
} from '../utils/auth-cleanup';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearLocalStorage: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const STORAGE_KEYS = {
  SESSION: 'alumni_network_session',
  PROFILE: 'alumni_network_profile',
  LAST_ACTIVITY: 'alumni_network_last_activity',
};

// Session timeout (24 hours)
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Clear all local storage data
  const clearLocalStorage = () => {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    // Also clear any other app-related storage
    localStorage.removeItem('alumni_network_notifications');
    localStorage.removeItem('alumni_network_connections');
    sessionStorage.clear();
  };

  // Check if session is expired
  const isSessionExpired = () => {
    const lastActivity = localStorage.getItem(STORAGE_KEYS.LAST_ACTIVITY);
    if (!lastActivity) return true;
    
    const lastActivityTime = parseInt(lastActivity, 10);
    const now = Date.now();
    return (now - lastActivityTime) > SESSION_TIMEOUT;
  };

  // Update last activity timestamp
  const updateLastActivity = () => {
    localStorage.setItem(STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString());
  };

  // Save session data to local storage
  const saveSessionData = (userData: User | null, profileData: UserProfile | null) => {
    if (userData) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(userData));
      updateLastActivity();
    } else {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
      localStorage.removeItem(STORAGE_KEYS.LAST_ACTIVITY);
    }
    
    if (profileData) {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profileData));
    } else {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
    }
  };

  // Load session data from local storage
  const loadSessionData = () => {
    try {
      const sessionData = localStorage.getItem(STORAGE_KEYS.SESSION);
      const profileData = localStorage.getItem(STORAGE_KEYS.PROFILE);
      
      if (sessionData && !isSessionExpired()) {
        const userData = JSON.parse(sessionData);
        const profile = profileData ? JSON.parse(profileData) : null;
        
        setUser(userData);
        setProfile(profile);
        updateLastActivity();
        return { user: userData, profile };
      } else {
        // Session expired or no session data
        clearLocalStorage();
        return { user: null, profile: null };
      }
    } catch (error) {
      console.error('Error loading session data:', error);
      clearLocalStorage();
      return { user: null, profile: null };
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, return null instead of throwing
        if (error.code === 'PGRST116') {
          console.log('Profile not found for user:', userId);
          return null;
        }
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
      saveSessionData(user, profileData);
    }
  };

  const signOut = async () => {
    try {
      console.log('Starting user sign out process...');
      await performCompleteLogout();
      setUser(null);
      setProfile(null);
      console.log('Sign out completed successfully');
    } catch (error) {
      console.error('SignOut error:', error);
      logError(error, 'AuthContext.signOut');
      
      // Fallback cleanup even if signOut fails
      try {
        await clearAllStorage();
        clearAllCookies();
        setUser(null);
        setProfile(null);
        console.log('Fallback cleanup completed');
      } catch (fallbackError) {
        console.error('Fallback cleanup failed:', fallbackError);
        logError(fallbackError, 'AuthContext.signOut.fallback');
        
        // Last resort - force page reload
        window.location.reload();
      }
    }
  };

  // Handle page visibility change (tab close/switch)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Page is being hidden (tab switch or close)
        updateLastActivity();
      }
    };

    const handleBeforeUnload = () => {
      // Page is being unloaded (refresh or close)
      updateLastActivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Handle session timeout
  useEffect(() => {
    const checkSessionTimeout = () => {
      if (user && isSessionExpired()) {
        console.log('Session expired, signing out user');
        signOut();
      }
    };

    const timeoutInterval = setInterval(checkSessionTimeout, 60000); // Check every minute

    return () => clearInterval(timeoutInterval);
  }, [user]);

  useEffect(() => {
    let mounted = true;
    
    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Check if Supabase is properly configured
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseAnonKey || supabaseAnonKey === "placeholder_key") {
      console.error('🚫 Supabase not configured properly!');
      console.error('💡 Create a .env file in your project root with your Supabase credentials');
      if (mounted) {
        setLoading(false);
        clearTimeout(timeoutId);
      }
      return;
    }

    // Load cached session data first
    const cachedData = loadSessionData();
    if (cachedData.user) {
      setUser(cachedData.user);
      setProfile(cachedData.profile);
      setLoading(false);
    }

    // Get initial session from Supabase with validation
    const getInitialSession = async () => {
      try {
        // Validate session on startup
        const isValid = await validateSessionOnStart();
        if (!isValid) {
          if (mounted) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            clearTimeout(timeoutId);
          }
          return;
        }
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            saveSessionData(session.user, null);
            
            const profileData = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
              saveSessionData(session.user, profileData);
            }
          } else {
            // No active session, clear any cached data
            clearLocalStorage();
          }
          
          setLoading(false);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        if (mounted) {
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            saveSessionData(session.user, null);
            
            const profileData = await fetchProfile(session.user.id);
            if (mounted) {
              setProfile(profileData);
              saveSessionData(session.user, profileData);
            }
          } else {
            setUser(null);
            setProfile(null);
            clearLocalStorage();
          }
          
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  // Setup page unload cleanup
  useEffect(() => {
    const cleanup = setupPageUnloadCleanup();
    return cleanup;
  }, []);

  const value = {
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
    clearLocalStorage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 