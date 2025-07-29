import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client.ts';
import { Button, Input, Typography, Box, Card, Grid, Divider } from '@mui/joy';

export const Login = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const onSubmit = async (data: any) => {
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    setLoading(false);
    navigate('/profile');
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8, p: 2 }}>
      <Typography level="h2" sx={{ mb: 4, textAlign: 'center' }}>
        Welcome Back
      </Typography>
      
      <Grid container spacing={4}>
        {/* General Login Form */}
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography level="h4" mb={3}>General Login</Typography>
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
                placeholder="Email"
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
              {error && <Typography color="danger" mb={2}>{error}</Typography>}
              <Button type="submit" loading={loading} fullWidth sx={{ mb: 2 }}>
                Login
              </Button>
            </form>
          </Card>
        </Grid>

        {/* Role-Specific Login Buttons */}
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3 }}>
            <Typography level="h4" mb={3}>Role-Specific Login</Typography>
            <Typography level="body-sm" sx={{ mb: 3, color: 'neutral.500' }}>
              Choose your role for a tailored login experience
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Button 
                component={Link} 
                to="/admin-login" 
                fullWidth 
                variant="outlined"
                color="danger"
                size="lg"
              >
                Admin Login
              </Button>
              
              <Button 
                component={Link} 
                to="/alumni-login" 
                fullWidth 
                variant="outlined"
                color="success"
                size="lg"
              >
                Alumni Login
              </Button>
              
              <Button 
                component={Link} 
                to="/student-login" 
                fullWidth 
                variant="outlined"
                color="primary"
                size="lg"
              >
                Student Login
              </Button>
            </Box>

            <Divider sx={{ my: 3 }} />
            
            <Box sx={{ textAlign: 'center' }}>
              <Typography level="body-sm" sx={{ mb: 2 }}>
                New to the platform?
              </Typography>
              <Button component={Link} to="/register" variant="soft" fullWidth>
                Register
              </Button>
            </Box>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 