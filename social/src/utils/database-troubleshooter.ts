import { supabase } from '../supabase-client';

/**
 * Database connection and functionality diagnostic tools
 * Provides comprehensive testing of database-related functionality
 */

export interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
  timestamp: Date;
}

export interface DiagnosticSuite {
  results: DiagnosticResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

/**
 * Test basic database connectivity
 */
export const testConnection = async (): Promise<DiagnosticResult> => {
  try {
    const startTime = Date.now();
    
    // Simple query to test connection
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      return {
        test: 'Database Connection',
        status: 'error',
        message: `Connection failed: ${error.message}`,
        details: { error, duration },
        timestamp: new Date()
      };
    }
    
    return {
      test: 'Database Connection',
      status: 'success',
      message: `Connection successful (${duration}ms)`,
      details: { duration, data },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      test: 'Database Connection',
      status: 'error',
      message: `Connection test failed: ${error}`,
      details: { error },
      timestamp: new Date()
    };
  }
};

/**
 * Test authentication functionality
 */
export const testAuth = async (): Promise<DiagnosticResult> => {
  try {
    const startTime = Date.now();
    
    // Test getting current session
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      return {
        test: 'Authentication',
        status: 'error',
        message: `Auth session error: ${sessionError.message}`,
        details: { error: sessionError },
        timestamp: new Date()
      };
    }
    
    // Test getting current user
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    const duration = Date.now() - startTime;
    
    if (userError) {
      return {
        test: 'Authentication',
        status: 'warning',
        message: `User data error: ${userError.message}`,
        details: { error: userError, session: sessionData.session, duration },
        timestamp: new Date()
      };
    }
    
    const hasSession = !!sessionData.session;
    const hasUser = !!userData.user;
    
    if (hasSession && hasUser) {
      return {
        test: 'Authentication',
        status: 'success',
        message: `Authenticated user: ${userData.user.email} (${duration}ms)`,
        details: { 
          user: userData.user, 
          session: sessionData.session,
          duration 
        },
        timestamp: new Date()
      };
    } else if (hasSession && !hasUser) {
      return {
        test: 'Authentication',
        status: 'warning',
        message: 'Session exists but user data unavailable',
        details: { session: sessionData.session, duration },
        timestamp: new Date()
      };
    } else {
      return {
        test: 'Authentication',
        status: 'warning',
        message: 'No active session',
        details: { duration },
        timestamp: new Date()
      };
    }
  } catch (error) {
    return {
      test: 'Authentication',
      status: 'error',
      message: `Auth test failed: ${error}`,
      details: { error },
      timestamp: new Date()
    };
  }
};

/**
 * Test Row Level Security policies
 */
export const testRLS = async (): Promise<DiagnosticResult> => {
  try {
    const startTime = Date.now();
    
    // Test reading from profiles table (should respect RLS)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5);
    
    // Test reading from connections table (should respect RLS)
    const { data: connectionsData, error: connectionsError } = await supabase
      .from('connections')
      .select('id, status')
      .limit(5);
    
    const duration = Date.now() - startTime;
    
    const results = {
      profiles: { data: profileData, error: profileError },
      connections: { data: connectionsData, error: connectionsError }
    };
    
    // Analyze results
    let status: 'success' | 'error' | 'warning' = 'success';
    let message = 'RLS policies working correctly';
    
    if (profileError && profileError.code === 'PGRST116') {
      // No rows returned due to RLS - this is expected behavior
      message += ' (Profiles: RLS active)';
    } else if (profileError) {
      status = 'error';
      message = `Profiles RLS error: ${profileError.message}`;
    } else if (profileData && profileData.length > 0) {
      message += ` (Profiles: ${profileData.length} accessible)`;
    }
    
    if (connectionsError && connectionsError.code === 'PGRST116') {
      message += ' (Connections: RLS active)';
    } else if (connectionsError) {
      status = 'error';
      message = `Connections RLS error: ${connectionsError.message}`;
    } else if (connectionsData && connectionsData.length > 0) {
      message += ` (Connections: ${connectionsData.length} accessible)`;
    }
    
    return {
      test: 'Row Level Security',
      status,
      message: `${message} (${duration}ms)`,
      details: { results, duration },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      test: 'Row Level Security',
      status: 'error',
      message: `RLS test failed: ${error}`,
      details: { error },
      timestamp: new Date()
    };
  }
};

/**
 * Test real-time connections
 */
export const testRealtime = async (): Promise<DiagnosticResult> => {
  return new Promise((resolve) => {
    try {
      const startTime = Date.now();
      let resolved = false;
      
      // Set timeout for test
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve({
            test: 'Real-time Connection',
            status: 'error',
            message: 'Real-time connection timeout (10s)',
            details: { timeout: true },
            timestamp: new Date()
          });
        }
      }, 10000);
      
      // Test real-time subscription
      const channel = supabase
        .channel('diagnostic-test')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'profiles'
        }, () => {
          // Event received (though we won't trigger any)
        })
        .subscribe((status) => {
          if (!resolved) {
            const duration = Date.now() - startTime;
            resolved = true;
            clearTimeout(timeout);
            
            if (status === 'SUBSCRIBED') {
              // Clean up subscription
              supabase.removeChannel(channel);
              
              resolve({
                test: 'Real-time Connection',
                status: 'success',
                message: `Real-time connection established (${duration}ms)`,
                details: { status, duration },
                timestamp: new Date()
              });
            } else if (status === 'CHANNEL_ERROR') {
              resolve({
                test: 'Real-time Connection',
                status: 'error',
                message: `Real-time connection failed: ${status}`,
                details: { status, duration },
                timestamp: new Date()
              });
            } else if (status === 'TIMED_OUT') {
              resolve({
                test: 'Real-time Connection',
                status: 'warning',
                message: 'Real-time connection timed out',
                details: { status, duration },
                timestamp: new Date()
              });
            }
          }
        });
        
    } catch (error) {
      resolve({
        test: 'Real-time Connection',
        status: 'error',
        message: `Real-time test failed: ${error}`,
        details: { error },
        timestamp: new Date()
      });
    }
  });
};

/**
 * Test specific table accessibility
 */
export const testTableAccess = async (tableName: string): Promise<DiagnosticResult> => {
  try {
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    const duration = Date.now() - startTime;
    
    if (error) {
      return {
        test: `Table Access: ${tableName}`,
        status: 'error',
        message: `Cannot access table ${tableName}: ${error.message}`,
        details: { error, tableName, duration },
        timestamp: new Date()
      };
    }
    
    return {
      test: `Table Access: ${tableName}`,
      status: 'success',
      message: `Table ${tableName} accessible (${duration}ms)`,
      details: { data, tableName, duration },
      timestamp: new Date()
    };
  } catch (error) {
    return {
      test: `Table Access: ${tableName}`,
      status: 'error',
      message: `Table access test failed: ${error}`,
      details: { error, tableName },
      timestamp: new Date()
    };
  }
};

/**
 * Run quick diagnostics (essential tests only)
 */
export const runQuickDiagnostics = async (): Promise<DiagnosticSuite> => {
  const results: DiagnosticResult[] = [];
  
  // Run essential tests in parallel
  const [connectionResult, authResult] = await Promise.all([
    testConnection(),
    testAuth()
  ]);
  
  results.push(connectionResult, authResult);
  
  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    warnings: results.filter(r => r.status === 'warning').length
  };
  
  return { results, summary };
};

/**
 * Run comprehensive diagnostic suite
 */
export const runDiagnostics = async (): Promise<DiagnosticSuite> => {
  const results: DiagnosticResult[] = [];
  
  // Run basic tests first
  const [connectionResult, authResult] = await Promise.all([
    testConnection(),
    testAuth()
  ]);
  
  results.push(connectionResult, authResult);
  
  // Run additional tests
  const [rlsResult, realtimeResult] = await Promise.all([
    testRLS(),
    testRealtime()
  ]);
  
  results.push(rlsResult, realtimeResult);
  
  // Test key tables
  const tableTests = await Promise.all([
    testTableAccess('profiles'),
    testTableAccess('connections'),
    testTableAccess('messages'),
    testTableAccess('announcements')
  ]);
  
  results.push(...tableTests);
  
  // Calculate summary
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    warnings: results.filter(r => r.status === 'warning').length
  };
  
  return { results, summary };
};

/**
 * Get troubleshooting tips based on diagnostic results
 */
export const getTroubleshootingTips = (results: DiagnosticResult[]): string[] => {
  const tips: string[] = [];
  
  // Check for common issues
  const connectionFailed = results.some(r => r.test === 'Database Connection' && r.status === 'error');
  const authFailed = results.some(r => r.test === 'Authentication' && r.status === 'error');
  const rlsFailed = results.some(r => r.test === 'Row Level Security' && r.status === 'error');
  const realtimeFailed = results.some(r => r.test === 'Real-time Connection' && r.status === 'error');
  
  if (connectionFailed) {
    tips.push('Database connection failed. Check your Supabase URL and API key in environment variables.');
    tips.push('Verify your network connection and Supabase project status.');
  }
  
  if (authFailed) {
    tips.push('Authentication issues detected. Try logging out and back in.');
    tips.push('Check if your session has expired or been invalidated.');
  }
  
  if (rlsFailed) {
    tips.push('Row Level Security issues detected. Verify your RLS policies are configured correctly.');
    tips.push('Ensure your user has the proper permissions for the tables being accessed.');
  }
  
  if (realtimeFailed) {
    tips.push('Real-time connection failed. Check if real-time is enabled in your Supabase project.');
    tips.push('Verify your network allows WebSocket connections.');
  }
  
  // Add general tips if any tests failed
  const anyFailed = results.some(r => r.status === 'error');
  if (anyFailed) {
    tips.push('Clear browser cache and cookies if issues persist.');
    tips.push('Check browser console for additional error details.');
    tips.push('Verify your Supabase project is active and properly configured.');
  }
  
  return tips;
};

