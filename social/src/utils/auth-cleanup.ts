import { supabase } from '../supabase-client';

/**
 * Comprehensive authentication cleanup utility
 * Ensures complete data cleanup on logout and session validation
 */

/**
 * Clear all localStorage data
 */
export const clearLocalStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

/**
 * Clear all sessionStorage data
 */
export const clearSessionStorage = (): void => {
  try {
    sessionStorage.clear();
  } catch (error) {
    console.warn('Failed to clear sessionStorage:', error);
  }
};

/**
 * Clear IndexedDB data
 */
export const clearIndexedDB = async (): Promise<void> => {
  try {
    if ('indexedDB' in window && indexedDB.databases) {
      const databases = await indexedDB.databases();
      await Promise.all(
        databases.map(db => {
          if (db.name) {
            return new Promise<void>((resolve, reject) => {
              const deleteReq = indexedDB.deleteDatabase(db.name!);
              deleteReq.onsuccess = () => resolve();
              deleteReq.onerror = () => reject(deleteReq.error);
              deleteReq.onblocked = () => {
                console.warn(`IndexedDB deletion blocked for ${db.name}`);
                resolve(); // Continue anyway
              };
            });
          }
          return Promise.resolve();
        })
      );
    }
  } catch (error) {
    console.warn('Failed to clear IndexedDB:', error);
  }
};

/**
 * Clear all storage (localStorage, sessionStorage, IndexedDB)
 */
export const clearAllStorage = async (): Promise<void> => {
  clearLocalStorage();
  clearSessionStorage();
  await clearIndexedDB();
};

/**
 * Clear all cookies programmatically
 */
export const clearAllCookies = (): void => {
  try {
    // Get all cookies
    const cookies = document.cookie.split(';');
    
    // Clear each cookie
    cookies.forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      
      if (name) {
        // Clear for current domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
        // Clear for parent domain
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${window.location.hostname}`;
        // Clear for root domain
        const rootDomain = window.location.hostname.split('.').slice(-2).join('.');
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=${rootDomain}`;
      }
    });
  } catch (error) {
    console.warn('Failed to clear cookies:', error);
  }
};

/**
 * Disconnect Supabase realtime connections
 */
export const disconnectRealtime = (): void => {
  try {
    // Remove all subscriptions
    supabase.removeAllChannels();
  } catch (error) {
    console.warn('Failed to disconnect realtime:', error);
  }
};

/**
 * Perform complete logout with comprehensive cleanup
 */
export const performCompleteLogout = async (): Promise<void> => {
  try {
    console.log('Starting complete logout...');
    
    // 1. Disconnect realtime connections first
    disconnectRealtime();
    
    // 2. Sign out from Supabase with retry mechanism for better reliability
    let signOutAttempts = 0;
    const maxSignOutAttempts = 3;
    
    while (signOutAttempts < maxSignOutAttempts) {
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        if (!error) break; // Success
        
        if (signOutAttempts === maxSignOutAttempts - 1) {
          console.warn('Final signOut attempt failed:', error);
        } else {
          console.warn(`SignOut attempt ${signOutAttempts + 1} failed, retrying...`, error);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
        }
      } catch (signOutError) {
        console.warn(`SignOut attempt ${signOutAttempts + 1} threw error:`, signOutError);
        if (signOutAttempts === maxSignOutAttempts - 1) {
          console.warn('All signOut attempts failed');
        }
      }
      signOutAttempts++;
    }
    
    // 3. Clear all storage
    await clearAllStorage();
    
    // 4. Clear all cookies
    clearAllCookies();
    
    console.log('Complete logout finished');
  } catch (error) {
    console.error('Error during complete logout:', error);
    // Even if there's an error, try to clear storage
    await clearAllStorage();
    clearAllCookies();
    throw error;
  }
};

/**
 * Validate session on application startup
 */
export const validateSessionOnStart = async (): Promise<boolean> => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.warn('Session validation error:', error);
      await clearAllStorage();
      clearAllCookies();
      return false;
    }
    
    if (!session) {
      // No session found, clear any leftover data
      await clearAllStorage();
      clearAllCookies();
      return false;
    }
    
    // Check if session is expired
    if (session.expires_at && session.expires_at * 1000 < Date.now()) {
      console.log('Session expired, cleaning up...');
      await performCompleteLogout();
      return false;
    }
    
    // Verify session is still valid with server
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.warn('User validation failed:', userError);
      await performCompleteLogout();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    await clearAllStorage();
    clearAllCookies();
    return false;
  }
};

/**
 * Setup cleanup on page unload (browser close/refresh)
 */
export const setupPageUnloadCleanup = (): (() => void) => {
  const handleBeforeUnload = () => {
    // Quick cleanup on page unload
    clearLocalStorage();
    clearSessionStorage();
    clearAllCookies();
  };
  
  const handleUnload = () => {
    // Additional cleanup on actual unload
    disconnectRealtime();
  };
  
  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  window.addEventListener('unload', handleUnload);
  
  // Cleanup function to remove listeners
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    window.removeEventListener('unload', handleUnload);
  };
};

/**
 * Force clean application state
 * Use this as a last resort when normal logout fails
 */
export const forceCleanState = async (): Promise<void> => {
  try {
    // Force disconnect everything
    disconnectRealtime();
    
    // Clear all data aggressively
    await clearAllStorage();
    clearAllCookies();
    
    // Reload the page to ensure clean state
    window.location.reload();
  } catch (error) {
    console.error('Force clean state failed:', error);
    // Last resort - redirect to login
    window.location.href = '/login';
  }
};

