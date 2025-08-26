import { useState } from 'react';
import { supabase } from '../supabase-client';
import { authenticateUser } from '../utils/auth-helpers';
import { Button, Input, Typography, Box, Alert } from '@mui/joy';

export const SimpleAuthTest = () => {
  const [email, setEmail] = useState('sowmithatwork@gmail.com');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const testAuth = async () => {
    console.log('=== Starting simple auth test ===');
    setLoading(true);
    setResult('Starting authentication...');
    
    try {
      console.log('1. About to call signInWithPassword');
      console.log('Environment variables:', {
        hasUrl: !!import.meta.env.VITE_SUPABASE_URL,
        hasKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
      });
      setResult('Calling Supabase auth...');
      
      // Add manual promise debugging
      const authPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('1.5. Promise created:', authPromise);
      console.log('1.6. Promise state:', authPromise);
      
      // Set up a timer to check if promise is hanging
      const checkTimer = setInterval(() => {
        console.log('Promise still pending...', new Date().toISOString());
        setResult(`Auth call still pending... ${new Date().toLocaleTimeString()}`);
      }, 2000);
      
      // Also add then/catch directly to see what happens
      authPromise
        .then(result => console.log('Promise resolved with:', result))
        .catch(error => console.log('Promise rejected with:', error));
      
      const authResult = await authPromise;
      
      clearInterval(checkTimer);
      console.log('2. Auth call completed:', authResult);
      
      if (authResult.error) {
        console.log('3. Auth error detected:', authResult.error);
        setResult(`Auth failed: ${authResult.error.message}`);
      } else {
        console.log('4. Auth successful, user:', authResult.data.user?.id);
        setResult(`Auth successful! User ID: ${authResult.data.user?.id}`);
      }
      
    } catch (error: unknown) {
      console.log('5. Exception caught:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setResult(`Exception: ${errorMessage}`);
    }
    
    console.log('6. Setting loading to false');
    setLoading(false);
    console.log('7. Auth test complete');
  };

  const testConnection = async () => {
    console.log('=== Testing basic connection ===');
    setLoading(true);
    setResult('Testing connection...');
    
    try {
      // Test basic connection to Supabase
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        setResult(`Connection failed: ${error.message}`);
        console.log('Connection error:', error);
      } else {
        setResult('Connection successful! Database accessible.');
        console.log('Connection successful:', data);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      setResult(`Connection exception: ${errorMessage}`);
      console.log('Connection exception:', error);
    }
    
    setLoading(false);
  };

  const testDirectFetch = async () => {
    console.log('=== Testing direct fetch ===');
    setLoading(true);
    setResult('Testing direct fetch...');
    
    try {
      const response = await fetch('https://efirzqcqkwdexhfeidkb.supabase.co/auth/v1/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          email,
          password,
          grant_type: 'password'
        })
      });
      
      console.log('Direct fetch response:', response);
      const data = await response.json();
      console.log('Direct fetch data:', data);
      setResult(`Direct fetch: ${response.status} - ${JSON.stringify(data).substring(0, 100)}...`);
    } catch (error: unknown) {
      console.log('Direct fetch error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Direct fetch failed';
      setResult(`Direct fetch error: ${errorMessage}`);
    }
    
    setLoading(false);
  };

  const testEnhancedAuth = async () => {
    console.log('=== Testing enhanced authentication ===');
    setLoading(true);
    setResult('Testing enhanced auth...');
    
    try {
      const { user, error } = await authenticateUser(email, password, 30000);
      
      if (error) {
        setResult(`Enhanced auth failed: ${error.message}`);
        console.log('Enhanced auth error:', error);
      } else if (user) {
        setResult(`Enhanced auth successful! User: ${user.id}`);
        console.log('Enhanced auth successful:', user);
      } else {
        setResult('Enhanced auth failed: No user returned');
      }
    } catch (error: unknown) {
      console.log('Enhanced auth exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Enhanced auth failed';
      setResult(`Enhanced auth exception: ${errorMessage}`);
    }
    
    setLoading(false);
  };

  const testWorkaround = async () => {
    console.log('=== Testing workaround ===');
    setLoading(true);
    setResult('Testing workaround...');
    
    try {
      // Since the HTTP request works but Supabase client hangs, let's bypass it
      const response = await fetch('https://efirzqcqkwdexhfeidkb.supabase.co/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'X-Client-Info': 'supabase-js-web/2.52.0'
        },
        body: JSON.stringify({
          email,
          password
        })
      });
      
      if (response.ok) {
        const authData = await response.json();
        console.log('Workaround auth data:', authData);
        
        if (authData.access_token) {
          // Manually set the session in Supabase
          const { data, error } = await supabase.auth.setSession({
            access_token: authData.access_token,
            refresh_token: authData.refresh_token
          });
          
          if (error) {
            setResult(`Session error: ${error.message}`);
          } else {
            setResult(`Workaround successful! User: ${data.user?.id}`);
            console.log('Session set successfully:', data);
          }
        } else {
          setResult(`Auth failed: ${authData.error_description || 'Unknown error'}`);
        }
      } else {
        const errorData = await response.json();
        setResult(`HTTP ${response.status}: ${errorData.error_description || 'Unknown error'}`);
      }
    } catch (error: unknown) {
      console.log('Workaround error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Workaround failed';
      setResult(`Workaround error: ${errorMessage}`);
    }
    
    setLoading(false);
  };

  const clearTest = () => {
    setResult('');
    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 4, p: 3, border: '1px solid #ccc' }}>
      <Typography level="h3" mb={2}>Simple Auth Test</Typography>
      
      <Input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        sx={{ mb: 2 }}
        fullWidth
      />
      
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        sx={{ mb: 2 }}
        fullWidth
      />
      
      <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
        <Button 
          onClick={testAuth} 
          loading={loading}
          disabled={!email || !password}
        >
          Test Auth
        </Button>
        <Button 
          onClick={testConnection} 
          loading={loading}
          variant="outlined"
        >
          Test Connection
        </Button>
        <Button 
          onClick={testDirectFetch} 
          loading={loading}
          disabled={!email || !password}
          color="warning"
        >
          Direct Fetch
        </Button>
        <Button 
          onClick={testEnhancedAuth} 
          loading={loading}
          disabled={!email || !password}
          color="success"
        >
          Enhanced Auth
        </Button>
        <Button 
          onClick={testWorkaround} 
          loading={loading}
          disabled={!email || !password}
          color="warning"
        >
          Workaround
        </Button>
        <Button onClick={clearTest} variant="outlined">
          Clear
        </Button>
      </Box>

      {result && (
        <Alert color={result.includes('successful') ? 'success' : 'warning'}>
          {result}
        </Alert>
      )}
      
      <Typography level="body-sm" sx={{ mt: 2 }}>
        Check the browser console for detailed logs.
      </Typography>
    </Box>
  );
};
