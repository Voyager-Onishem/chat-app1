import { useState } from 'react';
import { supabase } from '../supabase-client';
import { Button, Input, Typography, Box, Alert } from '@mui/joy';

export const AuthTest = () => {
  const [email, setEmail] = useState('student@college.edu');
  const [password, setPassword] = useState('password123');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing authentication with:', { email, password: '[HIDDEN]' });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('Auth result:', { data, error });
      
      if (error) {
        setResult({
          success: false,
          error: error.message,
          code: error.status || 'unknown'
        });
      } else {
        setResult({
          success: true,
          user: data.user,
          session: !!data.session
        });
        
        // Also test profile fetch
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          setResult((prev: any) => ({
            ...prev,
            profile: profile,
            profileError: profileError?.message
          }));
        }
      }
    } catch (err: any) {
      console.error('Test error:', err);
      setResult({
        success: false,
        error: err.message,
        code: 'exception'
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count(*)')
        .limit(1);
        
      setResult({
        connectionTest: true,
        canConnectToDb: !error,
        error: error?.message
      });
    } catch (err: any) {
      setResult({
        connectionTest: true,
        canConnectToDb: false,
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4, p: 3 }}>
      <Typography level="h3" mb={2}>Authentication Test</Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography level="body-sm" mb={1}>Test Email:</Typography>
        <Input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <Typography level="body-sm" mb={1}>Test Password:</Typography>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          sx={{ mb: 2 }}
        />
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button onClick={testAuth} loading={loading}>
            Test Authentication
          </Button>
          <Button onClick={testConnection} loading={loading} variant="outlined">
            Test DB Connection
          </Button>
        </Box>
      </Box>

      {result && (
        <Box sx={{ mt: 3 }}>
          <Typography level="h4" mb={2}>Test Result:</Typography>
          <Alert color={result.success ? 'success' : 'danger'}>
            <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </Alert>
        </Box>
      )}
    </Box>
  );
};
