import { supabase } from '../supabase-client';
import type { AuthError, User } from '@supabase/supabase-js';

interface AuthResult {
  user: User | null;
  error: AuthError | null;
}

/**
 * Enhanced authentication function that addresses Promise hanging issues
 * with proper timeout, retry logic, and fallback mechanisms
 */
export const authenticateUser = async (
  email: string, 
  password: string,
  timeoutMs: number = 30000
): Promise<AuthResult> => {
  console.log('🔐 Starting enhanced authentication process...');
  
  try {
    // Create a promise with proper timeout handling
    const authPromise = supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Create a timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Authentication timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Race the auth promise against timeout
    console.log('⏱️ Starting auth with timeout protection...');
    const result = await Promise.race([authPromise, timeoutPromise]);
    
    console.log('✅ Authentication completed successfully');
    return {
      user: result.data.user,
      error: result.error
    };

  } catch (error: unknown) {
    console.error('❌ Authentication failed:', error);
    
    // Type guard for error with message
    const getErrorMessage = (err: unknown): string => {
      if (err instanceof Error) return err.message;
      if (typeof err === 'object' && err !== null && 'message' in err) {
        return String((err as { message: unknown }).message);
      }
      return 'Unknown authentication error';
    };
    
    const errorMessage = getErrorMessage(error);
    
    // If it's a timeout error, try a direct approach
    if (errorMessage.includes('timeout')) {
      console.log('🔄 Attempting direct authentication fallback...');
      return await directAuthFallback(email, password);
    }
    
    return {
      user: null,
      error: error as AuthError
    };
  }
};

/**
 * Direct authentication fallback when Supabase client hangs
 * This bypasses the client and uses direct HTTP calls
 */
async function directAuthFallback(email: string, password: string): Promise<AuthResult> {
  try {
    console.log('🌐 Using direct HTTP authentication...');
    
    const response = await fetch('https://efirzqcqkwdexhfeidkb.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'X-Client-Info': 'supabase-js-web/fallback'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        user: null,
        error: {
          message: errorData.error_description || `HTTP ${response.status}`,
          name: 'AuthError',
          status: response.status
        } as AuthError
      };
    }

    const authData = await response.json();
    
    if (authData.access_token) {
      // Set the session in Supabase client
      const { data, error } = await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token
      });
      
      console.log('✅ Direct authentication successful, session set');
      return {
        user: data.user,
        error: error
      };
    }
    
    return {
      user: null,
      error: {
        message: 'No access token received',
        name: 'AuthError'
      } as AuthError
    };
    
  } catch (error: unknown) {
    console.error('❌ Direct authentication failed:', error);
    
    // Convert unknown error to AuthError
    const authError: AuthError = {
      message: error instanceof Error ? error.message : 'Direct authentication failed',
      name: 'AuthError'
    } as AuthError;
    
    return {
      user: null,
      error: authError
    };
  }
}

/**
 * Check if user session is valid and refresh if needed
 */
export const validateSession = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session validation error:', error);
      return false;
    }
    
    if (!session) {
      console.log('No active session found');
      return false;
    }
    
    // Check if token is expired or about to expire (within 1 minute)
    const expiresAt = session.expires_at;
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = expiresAt ? expiresAt - now : 0;
    
    if (timeUntilExpiry < 60) {
      console.log('Token expiring soon, refreshing...');
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Token refresh failed:', refreshError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Session validation exception:', error);
    return false;
  }
};

/**
 * Enhanced sign out with cleanup
 */
export const signOutUser = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Sign out error:', error);
      return false;
    }
    console.log('✅ User signed out successfully');
    return true;
  } catch (error) {
    console.error('Sign out exception:', error);
    return false;
  }
};
