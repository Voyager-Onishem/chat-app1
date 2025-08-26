import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase-client';

/**
 * Hook to monitor authentication and session state changes
 * This helps debug authentication issues when window focus changes
 */
export function useAuthDebug() {
  const [debugInfo, setDebugInfo] = useState({
    sessionValid: false,
    lastChecked: '',
    errors: [] as string[],
    sessionData: null as any,
  });

  const checkSessionStatus = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      const info = {
        sessionValid: !!session,
        lastChecked: new Date().toISOString(),
        errors: error ? [error.message] : [],
        sessionData: session ? {
          user_id: session.user.id,
          email: session.user.email,
          expires_at: session.expires_at,
          access_token: session.access_token ? 'present' : 'missing',
        } : null,
      };
      
      setDebugInfo(info);
      console.log('Auth Debug:', info);
      
      return info;
    } catch (error) {
      const errorInfo = {
        sessionValid: false,
        lastChecked: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        sessionData: null,
      };
      
      setDebugInfo(errorInfo);
      console.error('Auth Debug Error:', errorInfo);
      
      return errorInfo;
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    checkSessionStatus();
  }, [checkSessionStatus]);

  // Check session on window focus
  useEffect(() => {
    const handleFocus = () => {
      console.log('Window focus detected - checking auth session...');
      checkSessionStatus();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page visible - checking auth session...');
        checkSessionStatus();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkSessionStatus]);

  return {
    debugInfo,
    checkSessionStatus,
    refreshAuth: checkSessionStatus,
  };
}

export default useAuthDebug;
