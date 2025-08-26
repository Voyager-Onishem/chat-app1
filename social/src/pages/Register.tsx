import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { supabase } from '../supabase-client';
import { Button, Input, Typography, Box, Select, Option, Alert } from '@mui/joy';
import type { RegisterFormData, UserRole } from '../types';

export const Register = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormData>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);
  const [role, setRole] = useState<UserRole>('student');

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      // Create user in auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Insert into pending_registrations
      const { error: pendingError } = await supabase
        .from('pending_registrations')
        .insert({
          user_id: authData.user.id,
          email: data.email,
          full_name: data.full_name,
          role,
          status: 'pending',
          requested_at: new Date().toISOString()
        });
      if (pendingError) throw pendingError;
      setSuccess(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
        <Alert color="primary" sx={{ mb: 2 }}>
          Registration submitted! An admin will verify your registration. You will be notified by email if approved.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 8 }}>
      <Typography level="h3" mb={2}>Register</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          {...register('full_name', { required: 'Full name is required' })}
          type="text"
          placeholder="Full Name"
          error={!!errors.full_name}
          fullWidth
          sx={{ mb: 2 }}
        />
        {errors.full_name && <Typography color="danger">{errors.full_name.message as string}</Typography>}
        <Input
          {...register('email', { required: 'Email is required' })}
          type="email"
          placeholder="Email"
          error={!!errors.email}
          fullWidth
          sx={{ mb: 2 }}
        />
        {errors.email && <Typography color="danger">{errors.email.message as string}</Typography>}
        <Input
          {...register('password', { required: 'Password is required' })}
          type="password"
          placeholder="Password"
          error={!!errors.password}
          fullWidth
          sx={{ mb: 2 }}
        />
        {errors.password && <Typography color="danger">{errors.password.message as string}</Typography>}
        <Select
          value={role}
          onChange={(_e, value) => setRole((value as UserRole) || 'student')}
          sx={{ mb: 2 }}
        >
          <Option value="student">Student</Option>
          <Option value="alumni">Alumni</Option>
        </Select>
        <Button type="submit" loading={loading} fullWidth>Register</Button>
        {error && <Alert color="danger" sx={{ mt: 2 }}>{error}</Alert>}
      </form>
    </Box>
  );
}; 