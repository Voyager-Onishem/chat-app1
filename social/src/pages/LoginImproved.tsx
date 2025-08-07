import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../supabase-client';
import { useNotifications } from '../context/NotificationContext';
import { parseSupabaseError, withErrorHandling } from '../utils/errorHandling';
import { sanitizeAndValidate, ValidationRules } from '../utils/validation';
import type { LoginFormData } from '../types';
import {
  Box,
  Button,
  Input,
  Typography,
  Card,
  FormControl,
  FormLabel,
  Alert,
  Link,
  Divider,
  IconButton,
} from '@mui/joy';
import {
  Visibility,
  VisibilityOff,
  PersonRounded,
  LockRounded,
} from '@mui/icons-material';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError,
  } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError(null);

    // Sanitize and validate input
    const { sanitizedData, validation } = sanitizeAndValidate(data, {
      email: ValidationRules.email,
      password: { required: true, minLength: 1 },
    });

    if (!validation.isValid) {
      Object.entries(validation.errors).forEach(([field, message]) => {
        setFieldError(field as keyof LoginFormData, { 
          type: 'manual', 
          message 
        });
      });
      setLoading(false);
      return;
    }

    try {
      const { data: result, error: authError } = await supabase.auth.signInWithPassword({
        email: sanitizedData.email,
        password: sanitizedData.password,
      });

      setLoading(false);

      if (authError) {
        const parsedError = parseSupabaseError(authError);
        setError(parsedError.message);
        notifyError(parsedError.message, 'Login Failed');
        return;
      }

      if (result?.user) {
        success('Welcome back!', 'Login Successful');
        navigate('/', { replace: true });
      } else {
        setError('Login failed. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      const parsedError = parseSupabaseError(error);
      setError(parsedError.message);
      notifyError(parsedError.message, 'Login Failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.surface',
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 400,
          width: '100%',
          p: 4,
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <PersonRounded sx={{ fontSize: 40, color: 'primary.500', mb: 1 }} />
          <Typography level="h3" sx={{ mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography level="body-md" color="neutral">
            Sign in to your Alumni Network account
          </Typography>
        </Box>

        {error && (
          <Alert color="danger" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <FormControl sx={{ mb: 2 }} error={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input
              {...register('email')}
              type="email"
              placeholder="Enter your email"
              startDecorator={<PersonRounded />}
              autoComplete="email"
              autoFocus
            />
            {errors.email && (
              <Typography level="body-xs" color="danger">
                {errors.email.message}
              </Typography>
            )}
          </FormControl>

          <FormControl sx={{ mb: 3 }} error={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              startDecorator={<LockRounded />}
              endDecorator={
                <IconButton
                  variant="plain"
                  onClick={() => setShowPassword(!showPassword)}
                  size="sm"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              }
              autoComplete="current-password"
            />
            {errors.password && (
              <Typography level="body-xs" color="danger">
                {errors.password.message}
              </Typography>
            )}
          </FormControl>

          <Button
            type="submit"
            loading={loading}
            fullWidth
            sx={{ mb: 3 }}
          >
            Sign In
          </Button>
        </form>

        <Divider sx={{ my: 2 }}>or</Divider>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography level="body-sm">
            Don't have an account?{' '}
            <Link href="/register" level="title-sm">
              Sign up
            </Link>
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Typography level="body-sm">
            Different login types:
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 1 }}>
            <Link href="/admin-login" level="body-xs">
              Admin
            </Link>
            <Typography level="body-xs">•</Typography>
            <Link href="/alumni-login" level="body-xs">
              Alumni
            </Link>
            <Typography level="body-xs">•</Typography>
            <Link href="/student-login" level="body-xs">
              Student
            </Link>
          </Box>
        </Box>
      </Card>
    </Box>
  );
};
