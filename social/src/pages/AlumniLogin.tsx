import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';
import { Button, Input, Typography, Box, Alert } from '@mui/joy';
import { useForm } from 'react-hook-form';

export const AlumniLogin = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    
    try {
      // Direct authentication with Supabase
      const { data: authResponse, error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authResponse.user) {
        setError('Authentication failed');
        setLoading(false);
        return;
      }

      // Check if user has a profile with alumni role
      console.log('Looking for alumni profile for user:', authResponse.user.id);
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('user_id', authResponse.user.id)
        .single();

      console.log('Alumni profile query result:', { profile, profileError });

      if (profileError) {
        console.error('Alumni profile query error:', profileError);
        setError(`Profile lookup failed: ${profileError.message}`);
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (!profile) {
        setError('Profile not found. Please contact support.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      if (profile.role !== 'alumni') {
        setError('Access denied. This login is for alumni only.');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // Success - redirect to main app
      console.log('Alumni login successful, navigating to profile...');
      setLoading(false);
      navigate('/profile');
    } catch (err: any) {
      console.error('Alumni login error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography level="h3" mb={2}>Alumni Login</Typography>
      <Alert color="primary" sx={{ mb: 2 }}>
        This login is for alumni members only.
      </Alert>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          type="email"
          placeholder="Alumni Email"
          error={!!errors.email}
          fullWidth
          sx={{ mb: 2 }}
        />
        {errors.email && <Typography color="danger" level="body-sm">{errors.email.message as string}</Typography>}
        <Input
          {...register('password', { required: 'Password is required' })}
          type="password"
          placeholder="Password"
          error={!!errors.password}
          fullWidth
          sx={{ mb: 2 }}
        />
        {errors.password && <Typography color="danger" level="body-sm">{errors.password.message as string}</Typography>}
        {error && <Alert color="danger" sx={{ mb: 2 }}>{error}</Alert>}
        <Button type="submit" loading={loading} fullWidth>Alumni Login</Button>
      </form>
    </Box>
  );
}; 