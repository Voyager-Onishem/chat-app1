import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { supabase } from '../supabase-client';
import Box from '@mui/joy/Box';
import Breadcrumbs from '@mui/joy/Breadcrumbs';
import Link from '@mui/joy/Link';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Grid from '@mui/joy/Grid';
import Stack from '@mui/joy/Stack';
import Chip from '@mui/joy/Chip';
import Table from '@mui/joy/Table';
import Sheet from '@mui/joy/Sheet';
import HomeRoundedIcon from '@mui/icons-material/HomeRounded';
import ChevronRightRoundedIcon from '@mui/icons-material/ChevronRightRounded';
import PeopleRoundedIcon from '@mui/icons-material/PeopleRounded';
import MessageRoundedIcon from '@mui/icons-material/MessageRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import EventRoundedIcon from '@mui/icons-material/EventRounded';
import AnnouncementRoundedIcon from '@mui/icons-material/AnnouncementRounded';
import TrendingUpRoundedIcon from '@mui/icons-material/TrendingUpRounded';

export const AdminDashboard = () => {
  const { profile } = useSimpleAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConnections: 0,
    totalMessages: 0,
    totalJobs: 0,
    totalEvents: 0,
    totalAnnouncements: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role !== 'admin') {
      return;
    }

    const fetchDashboardData = async () => {
      try {
        // Fetch statistics
        const [
          { count: usersCount },
          { count: connectionsCount },
          { count: messagesCount },
          { count: jobsCount },
          { count: eventsCount },
          { count: announcementsCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('connections').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('jobs').select('*', { count: 'exact', head: true }),
          supabase.from('events').select('*', { count: 'exact', head: true }),
          supabase.from('announcements').select('*', { count: 'exact', head: true }),
        ]);

        setStats({
          totalUsers: usersCount || 0,
          totalConnections: connectionsCount || 0,
          totalMessages: messagesCount || 0,
          totalJobs: jobsCount || 0,
          totalEvents: eventsCount || 0,
          totalAnnouncements: announcementsCount || 0,
        });

        // Fetch recent users
        const { data: recentUsersData } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5);

        setRecentUsers(recentUsersData || []);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile]);

  if (profile?.role !== 'admin') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Access denied. Admin privileges required.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Loading dashboard...</Typography>
      </Box>
    );
  }

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center">
          <Box
            sx={{
              p: 1,
              borderRadius: '50%',
              bgcolor: `${color}.100`,
              color: `${color}.600`,
            }}
          >
            {icon}
          </Box>
          <Box>
            <Typography level="h4">{value}</Typography>
            <Typography level="body-sm" color="neutral">
              {title}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flex: 1, width: '100%' }}>
      <Box sx={{ px: { xs: 2, md: 6 } }}>
        <Breadcrumbs
          size="sm"
          aria-label="breadcrumbs"
          separator={<ChevronRightRoundedIcon fontSize="small" />}
          sx={{ pl: 0 }}
        >
          <Link
            underline="none"
            color="neutral"
            href="#some-link"
            aria-label="Home"
          >
            <HomeRoundedIcon />
          </Link>
          <Link
            underline="hover"
            color="neutral"
            href="#some-link"
            sx={{ fontSize: 12, fontWeight: 500 }}
          >
            Dashboard
          </Link>
          <Typography color="primary" sx={{ fontWeight: 500, fontSize: 12 }}>
            Admin
          </Typography>
        </Breadcrumbs>
        <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
          Admin Dashboard
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 } }}>
        {/* Statistics Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid xs={12} sm={6} md={4}>
            <StatCard
              title="Total Users"
              value={stats.totalUsers}
              icon={<PeopleRoundedIcon />}
              color="primary"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <StatCard
              title="Total Connections"
              value={stats.totalConnections}
              icon={<TrendingUpRoundedIcon />}
              color="success"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <StatCard
              title="Total Messages"
              value={stats.totalMessages}
              icon={<MessageRoundedIcon />}
              color="info"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <StatCard
              title="Total Jobs"
              value={stats.totalJobs}
              icon={<WorkRoundedIcon />}
              color="warning"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <StatCard
              title="Total Events"
              value={stats.totalEvents}
              icon={<EventRoundedIcon />}
              color="danger"
            />
          </Grid>
          <Grid xs={12} sm={6} md={4}>
            <StatCard
              title="Total Announcements"
              value={stats.totalAnnouncements}
              icon={<AnnouncementRoundedIcon />}
              color="neutral"
            />
          </Grid>
        </Grid>

        {/* Recent Users Table */}
        <Card>
          <Box sx={{ mb: 1 }}>
            <Typography level="title-md">Recent Users</Typography>
            <Typography level="body-sm" color="neutral">
              Latest registered users on the platform.
            </Typography>
          </Box>
          <Sheet
            sx={{
              '--TableCell-height': '40px',
              '--TableHeader-height': '48px',
              overflow: 'auto',
              background: (theme) =>
                `linear-gradient(${theme.vars.palette.background.level1} 30%, ${theme.vars.palette.background.level1} 30%)`,
            }}
          >
            <Table
              aria-label="recent users table"
              stickyHeader
              hoverRow
              sx={{
                '--TableCell-headBackground': (theme) => theme.vars.palette.background.level1,
                '--TableCell-selectedBackground': (theme) => theme.vars.palette.primary.softBg,
                '& thead th:nth-child(1)': { width: '40px' },
                '& thead th:nth-child(2)': { width: '200px' },
                '& thead th:nth-child(3)': { width: '120px' },
                '& thead th:nth-child(4)': { width: '120px' },
                '& thead th:nth-child(5)': { width: '120px' },
                '& thead th:nth-child(6)': { width: '120px' },
              }}
            >
              <thead>
                <tr>
                  <th>Avatar</th>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Company</th>
                  <th>Location</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <img
                          src={user.profile_picture_url || '/static/images/avatar/default.jpg'}
                          alt={user.full_name}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            objectFit: 'cover',
                          }}
                        />
                      </Box>
                    </td>
                    <td>
                      <Typography level="body-sm" fontWeight="lg">
                        {user.full_name}
                      </Typography>
                    </td>
                    <td>
                      <Chip
                        size="sm"
                        variant="soft"
                        color={
                          user.role === 'admin' ? 'danger' :
                          user.role === 'alumni' ? 'success' :
                          user.role === 'student' ? 'primary' : 'neutral'
                        }
                      >
                        {user.role}
                      </Chip>
                    </td>
                    <td>
                      <Typography level="body-sm">
                        {user.company || '-'}
                      </Typography>
                    </td>
                    <td>
                      <Typography level="body-sm">
                        {user.location || '-'}
                      </Typography>
                    </td>
                    <td>
                      <Typography level="body-sm">
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Sheet>
        </Card>
      </Box>
    </Box>
  );
}; 