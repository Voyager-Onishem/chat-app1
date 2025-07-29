import { useState, useEffect } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, Button, Alert } from '@mui/joy';

export const AuthDebug = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkCurrentUser = async () => {
    try {
      // Get current auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        setError(`Auth error: ${userError.message}`);
        return;
      }

      setUser(user);

      if (user) {
        console.log('Looking for profile with user_id:', user.id);
        
        // Get profile for this user - let's check what we get
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);

        console.log('Profile query result:', { profileData, profileError });

        if (profileError) {
          setError(`Profile error: ${profileError.message}`);
        } else if (!profileData || profileData.length === 0) {
          setError(`No profile found for user ID: ${user.id}`);
        } else if (profileData.length > 1) {
          setError(`Multiple profiles found for user ID: ${user.id}`);
          setProfile(profileData);
        } else {
          setProfile(profileData[0]);
        }
      }
    } catch (err: any) {
      setError(`Unexpected error: ${err.message}`);
    }
  };

  const testLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Test login with a known email
      const testEmail = 'student@college.edu'; // Change this to one of your test emails
      const testPassword = 'password123'; // Change this to the actual password
      
      const { error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        setError(`Login failed: ${error.message}`);
      } else {
        setError('Login successful! Check user info below.');
        await checkCurrentUser();
      }
    } catch (err: any) {
      setError(`Test login error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setError('');
  };

  useEffect(() => {
    checkCurrentUser();
  }, []);

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', mt: 2, p: 2, border: '1px solid #ccc', borderRadius: 2 }}>
      <Typography level="h4">Auth Debug Component</Typography>
      
      <Box sx={{ mt: 2 }}>
        <Button onClick={testLogin} loading={loading} sx={{ mr: 2 }}>
          Test Login (student@college.edu)
        </Button>
        <Button onClick={checkCurrentUser} sx={{ mr: 2 }}>
          Check Current User
        </Button>
        <Button onClick={signOut} color="danger">
          Sign Out
        </Button>
      </Box>

      {error && (
        <Alert color={error.includes('successful') ? 'success' : 'danger'} sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ mt: 2 }}>
        <Typography level="body-lg">Auth User:</Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {user ? JSON.stringify(user, null, 2) : 'No user logged in'}
        </pre>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography level="body-lg">Profile Data:</Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {profile ? JSON.stringify(profile, null, 2) : 'No profile found'}
        </pre>
      </Box>
    </Box>
  );
};
