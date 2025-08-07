import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { supabase } from '../supabase-client';
import { useNotifications } from '../context/NotificationContext';
import { parseSupabaseError } from '../utils/errorHandling';
import { sanitizeAndValidate, ValidationRules } from '../utils/validation';
import type { LoginFormData } from '../types';
import {
  Box,
  Button,
  Input,
  Typography,
  Link,
  FormControl,
  FormLabel,
  Stack,
  Sheet,
} from '@mui/joy';

export function Login() {
  const navigate = useNavigate();
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(false);
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
        display: 'flex',
        minHeight: '100vh',
        width: '100%',
      }}
    >
      {/* Left side - Login Form */}
      <Sheet
        sx={{
          flex: { xs: 1, md: 1 },
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          bgcolor: 'background.surface',
        }}
      >
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <Typography level="h2" component="h1" sx={{ mb: 1, textAlign: 'center' }}>
            Welcome Back
          </Typography>
          <Typography level="body-md" color="neutral" sx={{ mb: 4, textAlign: 'center' }}>
            Sign in to your account to continue
          </Typography>

          {error && (
            <Box
              sx={{
                p: 2,
                mb: 3,
                border: '1px solid',
                borderColor: 'danger.300',
                borderRadius: 'md',
                bgcolor: 'danger.50',
              }}
            >
              <Typography level="body-sm" color="danger">
                {error}
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={3}>
              <FormControl error={!!errors.email}>
                <FormLabel>Email</FormLabel>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Enter your email"
                  autoComplete="email"
                  size="lg"
                />
                {errors.email && (
                  <Typography level="body-xs" color="danger">
                    {errors.email.message}
                  </Typography>
                )}
              </FormControl>

              <FormControl error={!!errors.password}>
                <FormLabel>Password</FormLabel>
                <Input
                  {...register('password')}
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  size="lg"
                />
                {errors.password && (
                  <Typography level="body-xs" color="danger">
                    {errors.password.message}
                  </Typography>
                )}
              </FormControl>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                fullWidth
                sx={{ mt: 2 }}
              >
                Sign In
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography level="body-sm" color="neutral">
              Don't have an account?{' '}
              <Link
                component="button"
                onClick={() => navigate('/register')}
                sx={{ fontWeight: 'md' }}
              >
                Sign up here
              </Link>
            </Typography>
          </Box>

          {/* Role-specific login links */}
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography level="body-xs" color="neutral" sx={{ mb: 1 }}>
              Or sign in as:
            </Typography>
            <Stack direction="row" spacing={1} justifyContent="center">
              <Link
                component="button"
                onClick={() => navigate('/student-login')}
                level="body-xs"
              >
                Student
              </Link>
              <Typography level="body-xs" color="neutral">•</Typography>
              <Link
                component="button"
                onClick={() => navigate('/alumni-login')}
                level="body-xs"
              >
                Alumni
              </Link>
              <Typography level="body-xs" color="neutral">•</Typography>
              <Link
                component="button"
                onClick={() => navigate('/admin-login')}
                level="body-xs"
              >
                Admin
              </Link>
            </Stack>
          </Box>
        </Box>
      </Sheet>

      {/* Right side - Image/Branding */}
      <Sheet
        sx={{
          display: { xs: 'none', md: 'flex' },
          flex: 1,
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          p: 4,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'url(/api/placeholder/800/600) center/cover',
            opacity: 0.1,
          }}
        />
        <Box sx={{ position: 'relative', textAlign: 'center', zIndex: 1 }}>
          <Typography level="h1" sx={{ mb: 2, fontSize: '3rem', fontWeight: 'bold' }}>
            Alumni Network
          </Typography>
          <Typography level="body-lg" sx={{ mb: 4, opacity: 0.9 }}>
            Connect with fellow alumni, discover opportunities, and build meaningful professional relationships.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🎓
              </Box>
              <Typography level="body-md">Connect with Alumni</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                💼
              </Box>
              <Typography level="body-md">Discover Job Opportunities</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                🤝
              </Box>
              <Typography level="body-md">Build Professional Network</Typography>
            </Box>
          </Box>
        </Box>
      </Sheet>
    </Box>
  );
}
