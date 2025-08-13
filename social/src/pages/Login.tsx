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
  IconButton,
  Divider,
  Checkbox,
  CssVarsProvider,
  extendTheme,
  useColorScheme,
  GlobalStyles,
  CssBaseline,
} from '@mui/joy';
import DarkModeRoundedIcon from '@mui/icons-material/DarkModeRounded';
import LightModeRoundedIcon from '@mui/icons-material/LightModeRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';

interface ColorSchemeToggleProps {
  onClick?: (event: React.MouseEvent) => void;
}

function ColorSchemeToggle(props: ColorSchemeToggleProps) {
  const { onClick, ...other } = props;
  const { mode, setMode } = useColorScheme();
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => setMounted(true), []);

  return (
    <IconButton
      aria-label="toggle light/dark mode"
      size="sm"
      variant="outlined"
      disabled={!mounted}
      onClick={(event) => {
        setMode(mode === 'light' ? 'dark' : 'light');
        onClick?.(event);
      }}
      {...other}
    >
      {mode === 'light' ? <DarkModeRoundedIcon /> : <LightModeRoundedIcon />}
    </IconButton>
  );
}

const customTheme = extendTheme({});

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
    <CssVarsProvider theme={customTheme} disableTransitionOnChange>
      <CssBaseline />
      <GlobalStyles
        styles={{
          ':root': {
            '--Form-maxWidth': '800px',
            '--Transition-duration': '0.4s',
          },
        }}
      />
      <Box
        sx={(theme) => ({
          width: { xs: '100%', md: '50vw' },
          transition: 'width var(--Transition-duration)',
          transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          justifyContent: 'flex-end',
          backdropFilter: 'blur(12px)',
          backgroundColor: 'rgba(255 255 255 / 0.2)',
          [theme.getColorSchemeSelector('dark')]: {
            backgroundColor: 'rgba(19 19 24 / 0.4)',
          },
        })}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100dvh',
            width: '100%',
            px: 2,
          }}
        >
          <Box
            component="header"
            sx={{ py: 3, display: 'flex', justifyContent: 'space-between' }}
          >
            <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
              <IconButton variant="soft" color="primary" size="sm">
                <BadgeRoundedIcon />
              </IconButton>
              <Typography level="title-lg">Alumni Network</Typography>
            </Box>
            <ColorSchemeToggle />
          </Box>
          <Box
            component="main"
            sx={{
              my: 'auto',
              py: 2,
              pb: 5,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              width: 400,
              maxWidth: '100%',
              mx: 'auto',
              borderRadius: 'sm',
              '& form': {
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              },
              [`& .MuiFormLabel-asterisk`]: {
                visibility: 'hidden',
              },
            }}
          >
            <Stack sx={{ gap: 4, mb: 2 }}>
              <Stack sx={{ gap: 1 }}>
                <Typography component="h1" level="h3">
                  Welcome Back
                </Typography>
                <Typography level="body-sm">
                  New to our platform?{' '}
                  <Link
                    component="button"
                    onClick={() => navigate('/register')}
                    level="title-sm"
                  >
                    Sign up!
                  </Link>
                </Typography>
              </Stack>
            </Stack>

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

            <Divider
              sx={(theme) => ({
                [theme.getColorSchemeSelector('light')]: {
                  color: { xs: '#FFF', md: 'text.tertiary' },
                },
              })}
            >
              Sign in to continue
            </Divider>

            <Stack sx={{ gap: 4, mt: 2 }}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <FormControl required error={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    {...register('email')}
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    autoComplete="email"
                  />
                  {errors.email && (
                    <Typography level="body-xs" color="danger">
                      {errors.email.message}
                    </Typography>
                  )}
                </FormControl>
                <FormControl required error={!!errors.password}>
                  <FormLabel>Password</FormLabel>
                  <Input
                    {...register('password')}
                    type="password"
                    name="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  {errors.password && (
                    <Typography level="body-xs" color="danger">
                      {errors.password.message}
                    </Typography>
                  )}
                </FormControl>
                <Stack sx={{ gap: 4, mt: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Checkbox size="sm" label="Remember me" name="persistent" />
                    <Link level="title-sm" href="#forgot-password">
                      Forgot your password?
                    </Link>
                  </Box>
                  <Button type="submit" fullWidth loading={loading}>
                    Sign in
                  </Button>
                </Stack>
              </form>

              {/* Role-specific login links */}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
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
            </Stack>
          </Box>
          <Box component="footer" sx={{ py: 3 }}>
            <Typography level="body-xs" sx={{ textAlign: 'center' }}>
              © Alumni Network {new Date().getFullYear()}
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        sx={(theme) => ({
          height: '100%',
          position: 'fixed',
          right: 0,
          top: 0,
          bottom: 0,
          left: { xs: 0, md: '50vw' },
          transition:
            'background-image var(--Transition-duration), left var(--Transition-duration) !important',
          transitionDelay: 'calc(var(--Transition-duration) + 0.1s)',
          backgroundColor: 'background.level1',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundImage:
            'url(https://images.unsplash.com/photo-1527181152855-fc03fc7949c8?auto=format&w=1000&dpr=2)',
          [theme.getColorSchemeSelector('dark')]: {
            backgroundImage:
              'url(https://images.unsplash.com/photo-1572072393749-3ca9c8ea0831?auto=format&w=1000&dpr=2)',
          },
        })}
      />
    </CssVarsProvider>
  );
}

// export { Login };
