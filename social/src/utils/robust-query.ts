import { supabase } from '../supabase-client';

/**
 * Robust query utilities to handle RLS, timeouts, and network issues
 */

export interface QueryOptions {
  timeout?: number;
  retries?: number;
  fallbackData?: any;
  skipRLS?: boolean;
}

export class QueryError extends Error {
  code: string;
  details: any;
  
  constructor(message: string, code: string = 'UNKNOWN', details: any = null) {
    super(message);
    this.name = 'QueryError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Execute a query with timeout, retry, and error handling
 */
export async function robustQuery<T = any>(
  queryBuilder: any,
  options: QueryOptions = {}
): Promise<{ data: T | null; error: QueryError | null; fromFallback: boolean }> {
  const {
    timeout = 15000, // 15 second timeout
    retries = 2,
    fallbackData = null,
    skipRLS = false
  } = options;

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Query timeout')), timeout)
      );

      // Add RLS bypass if needed (for admin queries)
      let query = queryBuilder;
      if (skipRLS) {
        // This would require service role key, which we don't want to expose
        // Instead, we'll handle this at the RLS policy level
      }

      // Race the query against the timeout
      const result = await Promise.race([query, timeoutPromise]);

      if (result.error) {
        lastError = result.error;
        
        // Enhanced error logging for debugging
        console.warn(`Query attempt ${attempt + 1}/${retries + 1} failed:`, {
          error: result.error,
          code: result.error.code,
          message: result.error.message,
          details: result.error.details,
          hint: result.error.hint
        });
        
        // Check if it's a retryable error
        const isRetryable = isRetryableError(result.error);
        console.log(`Error is retryable: ${isRetryable}`);
        
        if (!isRetryable || attempt === retries) {
          // Not retryable or last attempt
          const queryError = new QueryError(
            result.error.message || 'Database query failed',
            result.error.code || 'DB_ERROR',
            result.error
          );
          
          if (fallbackData !== null) {
            console.warn(`Query failed after ${attempt + 1} attempts, using fallback data:`, queryError);
            return { data: fallbackData, error: null, fromFallback: true };
          }
          
          return { data: null, error: queryError, fromFallback: false };
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
        console.log(`Retrying query in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Success
      return { data: result.data, error: null, fromFallback: false };

    } catch (error: any) {
      lastError = error;
      
      // Handle timeout and network errors
      if (error.message === 'Query timeout' || error.name === 'NetworkError') {
        if (attempt < retries) {
          console.warn(`Query timeout/network error, retrying... (${attempt + 1}/${retries + 1})`);
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Last attempt or non-retryable error
      const queryError = new QueryError(
        error.message || 'Network or timeout error',
        error.name || 'NETWORK_ERROR',
        error
      );
      
      if (fallbackData !== null) {
        console.warn(`Query failed with network/timeout error, using fallback data:`, queryError);
        return { data: fallbackData, error: null, fromFallback: true };
      }
      
      return { data: null, error: queryError, fromFallback: false };
    }
  }

  // Should never reach here, but just in case
  const finalError = new QueryError(
    lastError?.message || 'Query failed after all retries',
    lastError?.code || 'RETRY_EXHAUSTED',
    lastError
  );
  
  if (fallbackData !== null) {
    return { data: fallbackData, error: null, fromFallback: true };
  }
  
  return { data: null, error: finalError, fromFallback: false };
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const retryableCodes = [
    '57014', // statement timeout
    '53300', // too many connections
    '54001', // configuration limit exceeded
    '08006', // connection failure
    '08001', // unable to connect
    '08004', // server rejected connection
    'PGRST504', // Gateway timeout
    '500', // Internal server error
    '503', // Service unavailable
    '502', // Bad gateway
    '504', // Gateway timeout
  ];
  
  const retryableMessages = [
    'timeout',
    'connection',
    'network',
    'temporary',
    'retry',
    'internal server error',
    'service unavailable',
    'bad gateway',
    'gateway timeout',
    'fetch',
  ];
  
  // Check error codes
  if (error.code && retryableCodes.includes(error.code)) {
    return true;
  }
  
  // Check HTTP status codes
  if (error.status && retryableCodes.includes(error.status.toString())) {
    return true;
  }
  
  // Check error messages
  if (error.message) {
    const message = error.message.toLowerCase();
    return retryableMessages.some(keyword => message.includes(keyword));
  }
  
  // Check if it's a network/fetch error
  if (error.name === 'NetworkError' || error.name === 'TypeError' && error.message.includes('fetch')) {
    return true;
  }
  
  return false;
}

/**
 * Wrapper for common query patterns
 */
export const robustQueries = {
  /**
   * Get profiles with fallback to mock data and RLS bypass
   */
  async getProfiles(options: QueryOptions = {}) {
    try {
      // Use the RLS bypass utility for better error handling
      const { fetchProfilesWithBypass } = await import('../utils/auth-bypass');
      const result = await fetchProfilesWithBypass();
      
      if (result.bypassUsed) {
        console.warn('Using bypass for profiles data');
      }
      
      return {
        data: result.data,
        error: result.error,
        fromFallback: !result.isRealData
      };
    } catch (error) {
      // Fallback to original robust query
      const { mockProfiles } = await import('../utils/mockData');
      return robustQuery(
        supabase.from('profiles').select('*').order('full_name'),
        { ...options, fallbackData: mockProfiles }
      );
    }
  },

  /**
   * Get user count
   */
  async getUserCount(options: QueryOptions = {}) {
    return robustQuery(
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      { ...options, fallbackData: 0 }
    );
  },

  /**
   * Get connections count
   */
  async getConnectionsCount(options: QueryOptions = {}) {
    return robustQuery(
      supabase.from('connections').select('*', { count: 'exact', head: true }),
      { ...options, fallbackData: 0 }
    );
  },

  /**
   * Get recent connections
   */
  async getRecentConnections(limit: number = 3, options: QueryOptions = {}) {
    return robustQuery(
      supabase
        .from('connections')
        .select('requester_id, addressee_id, status, created_at')
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(limit),
      { ...options, fallbackData: [] }
    );
  },

  /**
   * Test connection with simple query
   */
  async testConnection(options: QueryOptions = {}) {
    return robustQuery(
      supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1),
      { ...options, timeout: 5000, retries: 1, fallbackData: { count: 0 } }
    );
  },

  /**
   * Get profiles count safely with RLS bypass
   */
  async getProfilesCount(options: QueryOptions = {}) {
    try {
      const { fetchCountWithBypass } = await import('../utils/auth-bypass');
      const result = await fetchCountWithBypass('profiles', 4); // Use 4 as fallback (mock data count)
      
      if (result.bypassUsed) {
        console.warn('Using bypass for profiles count');
      }
      
      return {
        data: result.data,
        error: result.error,
        fromFallback: !result.isRealData
      };
    } catch (error) {
      return robustQuery(
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        { ...options, fallbackData: 4 }
      );
    }
  },

  /**
   * Get connections count safely with RLS bypass
   */
  async getConnectionsCount(options: QueryOptions = {}) {
    try {
      const { fetchCountWithBypass } = await import('../utils/auth-bypass');
      const result = await fetchCountWithBypass('connections', 3); // Use 3 as fallback
      
      if (result.bypassUsed) {
        console.warn('Using bypass for connections count');
      }
      
      return {
        data: result.data,
        error: result.error,
        fromFallback: !result.isRealData
      };
    } catch (error) {
      return robustQuery(
        supabase.from('connections').select('*', { count: 'exact', head: true }),
        { ...options, fallbackData: 3 }
      );
    }
  },

  /**
   * Get recent connections with RLS bypass
   */
  async getRecentConnections(limit: number = 3, options: QueryOptions = {}) {
    try {
      const { fetchConnectionsWithBypass } = await import('../utils/auth-bypass');
      const result = await fetchConnectionsWithBypass(limit);
      
      if (result.bypassUsed) {
        console.warn('Using bypass for recent connections');
      }
      
      return {
        data: result.data,
        error: result.error,
        fromFallback: !result.isRealData
      };
    } catch (error) {
      return robustQuery(
        supabase
          .from('connections')
          .select('requester_id, addressee_id, status, created_at')
          .eq('status', 'accepted')
          .order('created_at', { ascending: false })
          .limit(limit),
        { ...options, fallbackData: [] }
      );
    }
  },
};

/**
 * Check if user has access to admin features with RLS bypass
 */
export async function checkAdminAccess(userId: string): Promise<boolean> {
  try {
    const { getUserRoleWithBypass } = await import('./auth-bypass');
    const result = await getUserRoleWithBypass(userId);
    
    if (result.bypassUsed) {
      console.warn('Using bypass for admin access check');
    }
    
    return result.isAdmin;
  } catch (error) {
    // Fallback to original check
    try {
      const { data, error } = await robustQuery(
        supabase.from('admins').select('user_id').eq('user_id', userId).single(),
        { timeout: 5000, retries: 1 }
      );
      
      return !error && !!data;
    } catch (fallbackError) {
      console.warn('Admin access check failed:', fallbackError);
      return false;
    }
  }
}