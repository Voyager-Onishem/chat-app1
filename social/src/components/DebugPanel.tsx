import React, { useState } from 'react';
import { Box, Button, Typography, Card, Stack, Chip, Alert } from '@mui/joy';
import { supabase } from '../supabase-client';
import { robustQueries } from '../utils/robust-query';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { testUserDatabaseAccess } from '../utils/auth-bypass';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: Record<string, unknown>;
  timing?: number;
}

export const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const { user } = useSimpleAuth();

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Basic connection
    try {
      const start = Date.now();
      const response = await fetch(`${supabase.supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`
        }
      });
      const timing = Date.now() - start;
      
      diagnostics.push({
        test: 'Basic API Connection',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? `Connected successfully (${timing}ms)` : `HTTP ${response.status}: ${response.statusText}`,
        timing
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      const errorDetails: Record<string, unknown> = error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Unknown error' };
      diagnostics.push({
        test: 'Basic API Connection',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // Test 2: Authentication status
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      diagnostics.push({
        test: 'Authentication',
        status: session && !error ? 'success' : 'warning',
        message: session ? `Authenticated as ${session.user.email}` : 'Not authenticated',
        details: { hasSession: !!session, error }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Auth check failed';
      const errorDetails: Record<string, unknown> = error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Unknown error' };
      diagnostics.push({
        test: 'Authentication',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // Test 3: Profiles table access
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      const timing = Date.now() - start;

      diagnostics.push({
        test: 'Profiles Table Access',
        status: error ? 'error' : 'success',
        message: error ? `Error: ${error.message}` : `Access granted (${timing}ms)`,
        details: { data, error },
        timing
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Table access failed';
      const errorDetails: Record<string, unknown> = error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Unknown error' };
      diagnostics.push({
        test: 'Profiles Table Access',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // Test 4: Connections table access
    try {
      const start = Date.now();
      const { data, error } = await supabase
        .from('connections')
        .select('count', { count: 'exact', head: true })
        .limit(1);
      const timing = Date.now() - start;

      diagnostics.push({
        test: 'Connections Table Access',
        status: error ? 'error' : 'success',
        message: error ? `Error: ${error.message}` : `Access granted (${timing}ms)`,
        details: { data, error },
        timing
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Table access failed';
      const errorDetails: Record<string, unknown> = error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Unknown error' };
      diagnostics.push({
        test: 'Connections Table Access',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // Test 5: Admin table access (if user exists)
    if (user) {
      try {
        const start = Date.now();
        const { data, error } = await supabase
          .from('admins')
          .select('user_id')
          .eq('user_id', user.id)
          .single();
        const timing = Date.now() - start;

        diagnostics.push({
          test: 'Admin Table Access',
          status: error && error.code !== 'PGRST116' ? 'error' : 'success',
          message: error && error.code !== 'PGRST116' 
            ? `Error: ${error.message}` 
            : data 
            ? `User is admin (${timing}ms)` 
            : `User is not admin (${timing}ms)`,
          details: { data, error, isAdmin: !!data },
          timing
        });
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Admin check failed';
        const errorDetails: Record<string, unknown> = error instanceof Error 
          ? { message: error.message, name: error.name } 
          : { message: 'Unknown error' };
        diagnostics.push({
          test: 'Admin Table Access',
          status: 'error',
          message: errorMessage,
          details: errorDetails
        });
      }
    }

    // Test 6: RLS bypass system
    try {
      const start = Date.now();
      const accessTest = await testUserDatabaseAccess();
      const timing = Date.now() - start;

      diagnostics.push({
        test: 'RLS Bypass System',
        status: accessTest.hasProfileAccess && accessTest.hasConnectionAccess ? 'success' : 'warning',
        message: accessTest.hasProfileAccess && accessTest.hasConnectionAccess
          ? `Direct database access available (${timing}ms)`
          : `RLS blocking access, bypass will be used (${timing}ms)`,
        details: accessTest,
        timing
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'RLS bypass test failed';
      const errorDetails: Record<string, unknown> = error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Unknown error' };
      diagnostics.push({
        test: 'RLS Bypass System',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    // Test 7: Robust query system
    try {
      const start = Date.now();
      const result = await robustQueries.testConnection();
      const timing = Date.now() - start;

      diagnostics.push({
        test: 'Robust Query System',
        status: result.error && !result.fromFallback ? 'error' : result.fromFallback ? 'warning' : 'success',
        message: result.fromFallback 
          ? `Using fallback data (${timing}ms)` 
          : result.error 
          ? `Failed: ${result.error.message}` 
          : `Working correctly (${timing}ms)`,
        details: result,
        timing
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Robust query test failed';
      const errorDetails: Record<string, unknown> = error instanceof Error 
        ? { message: error.message, name: error.name } 
        : { message: 'Unknown error' };
      diagnostics.push({
        test: 'Robust Query System',
        status: 'error',
        message: errorMessage,
        details: errorDetails
      });
    }

    setResults(diagnostics);
    setIsRunning(false);
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'danger';
      default: return 'neutral';
    }
  };

  // Only show in development or if explicitly enabled
  if (!import.meta.env.DEV && !localStorage.getItem('debug-panel-enabled')) {
    return null;
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      {!isVisible ? (
        <Button
          size="sm"
          variant="outlined"
          color="neutral"
          onClick={() => setIsVisible(true)}
        >
          🔧 Debug
        </Button>
      ) : (
        <Card sx={{ width: 400, maxHeight: 600, overflow: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography level="title-md">System Diagnostics</Typography>
            <Button size="sm" variant="plain" onClick={() => setIsVisible(false)}>✕</Button>
          </Box>
          
          <Stack spacing={2}>
            <Button 
              onClick={runDiagnostics} 
              loading={isRunning}
              disabled={isRunning}
              fullWidth
            >
              Run Diagnostics
            </Button>

            {results.length > 0 && (
              <Box>
                <Typography level="body-sm" sx={{ mb: 1 }}>
                  Test Results ({results.length} tests)
                </Typography>
                
                {results.map((result, index) => (
                  <Alert 
                    key={index}
                    color={getStatusColor(result.status)}
                    sx={{ mb: 1 }}
                  >
                    <Box>
                      <Typography level="body-sm" fontWeight="bold">
                        {result.test}
                        {result.timing && (
                          <Chip size="sm" variant="soft" sx={{ ml: 1 }}>
                            {result.timing}ms
                          </Chip>
                        )}
                      </Typography>
                      <Typography level="body-xs">
                        {result.message}
                      </Typography>
                      {result.details && (
                        <details style={{ marginTop: 4 }}>
                          <summary style={{ cursor: 'pointer', fontSize: '0.75rem' }}>
                            Details
                          </summary>
                          <pre style={{ 
                            fontSize: '0.7rem', 
                            marginTop: 4, 
                            overflow: 'auto',
                            maxHeight: 100
                          }}>
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </Box>
                  </Alert>
                ))}
              </Box>
            )}
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default DebugPanel;