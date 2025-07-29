import { Link } from 'react-router-dom';
import { Box, Typography, Button, Card, Grid } from '@mui/joy';

export const Home = () => {
  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8, p: 2 }}>
      <Typography level="h1" sx={{ mb: 4, textAlign: 'center' }}>
        Alumni Networking Platform
      </Typography>
      
      <Typography level="body-lg" sx={{ mb: 4, textAlign: 'center' }}>
        Connect with fellow alumni, find job opportunities, and stay updated with college events.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography level="h4" sx={{ mb: 2 }}>Students</Typography>
            <Typography level="body-sm" sx={{ mb: 2 }}>
              Current students can connect with alumni, find mentors, and explore job opportunities.
            </Typography>
            <Button component={Link} to="/student-login" fullWidth>
              Student Login
            </Button>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={4}>
          <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography level="h4" sx={{ mb: 2 }}>Alumni</Typography>
            <Typography level="body-sm" sx={{ mb: 2 }}>
              Alumni can mentor students, share job opportunities, and network with fellow graduates.
            </Typography>
            <Button component={Link} to="/alumni-login" fullWidth>
              Alumni Login
            </Button>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={4}>
          <Card sx={{ p: 3, textAlign: 'center', height: '100%' }}>
            <Typography level="h4" sx={{ mb: 2 }}>Administrators</Typography>
            <Typography level="body-sm" sx={{ mb: 2 }}>
              College administration can manage the platform, post announcements, and oversee events.
            </Typography>
            <Button component={Link} to="/admin-login" fullWidth>
              Admin Login
            </Button>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ textAlign: 'center' }}>
        <Typography level="body-sm" sx={{ mb: 2 }}>
          New to the platform? Register here:
        </Typography>
        <Button component={Link} to="/register" variant="outlined">
          Register
        </Button>
      </Box>
    </Box>
  );
};