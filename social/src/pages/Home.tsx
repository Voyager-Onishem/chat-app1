import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { supabase } from '../supabase-client';
import { Box, Typography, Button, Card, Grid, Avatar, Stack, Divider } from '@mui/joy';
import { PeopleRounded, WorkRounded, EventRounded, AnnouncementRounded, TrendingUpRounded } from '@mui/icons-material';

interface RecentActivity {
  type: 'connection' | 'job' | 'event' | 'announcement';
  title: string;
  description: string;
  timestamp: string;
  user?: {
    full_name: string;
    profile_picture_url?: string;
  };
}

interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  profile_picture_url?: string;
  role: string;
}

interface Job {
  title: string;
  created_at: string;
}

interface Event {
  title: string;
  created_at: string;
}

interface Announcement {
  title: string;
  created_at: string;
}

export const Home = () => {
  const { user, profile } = useSimpleAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalConnections: 0,
    totalJobs: 0,
    totalEvents: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Add a small delay to ensure user is fully loaded
      const timer = setTimeout(() => {
        fetchDashboardData();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user?.id) {
      console.warn('No user ID available, skipping dashboard data fetch');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Starting to fetch dashboard data for user:', user.id);
      
      // Check if Supabase is properly configured
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (!supabaseAnonKey || supabaseAnonKey === "placeholder_key") {
        console.warn('Supabase not configured - using fallback data');
        setStats({
          totalUsers: 150,
          totalConnections: 45,
          totalJobs: 12,
          totalEvents: 8,
        });
        setRecentActivity([
          {
            type: 'connection',
            title: 'New Connection',
            description: 'John Doe joined the network',
            timestamp: new Date().toISOString(),
            user: {
              full_name: 'John Doe',
              profile_picture_url: undefined,
            },
          },
          {
            type: 'job',
            title: 'New Job Posted',
            description: 'Software Engineer at Tech Corp',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            type: 'event',
            title: 'New Event',
            description: 'Alumni Networking Meetup',
            timestamp: new Date(Date.now() - 172800000).toISOString(),
          },
        ]);
        setIsLoading(false);
        return;
      }
      
      // Fetch basic statistics
      const [
        { count: usersCount, error: usersError },
        { count: connectionsCount, error: connectionsError },
        { count: jobsCount, error: jobsError },
        { count: eventsCount, error: eventsError },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('connections').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }),
        supabase.from('events').select('*', { count: 'exact', head: true }),
      ]);

      // Log any errors
      if (usersError) console.error('Error fetching users count:', usersError);
      if (connectionsError) console.error('Error fetching connections count:', connectionsError);
      if (jobsError) console.error('Error fetching jobs count:', jobsError);
      if (eventsError) console.error('Error fetching events count:', eventsError);

      console.log('Statistics fetched:', { usersCount, connectionsCount, jobsCount, eventsCount });

      setStats({
        totalUsers: usersCount || 0,
        totalConnections: connectionsCount || 0,
        totalJobs: jobsCount || 0,
        totalEvents: eventsCount || 0,
      });

      // Fetch recent activity
      const activities: RecentActivity[] = [];

      // Recent connections
      console.log('Fetching recent connections...');
      const { data: recentConnections, error: connectionsDataError } = await supabase
        .from('connections')
        .select(`
          id,
          requester_id,
          addressee_id,
          status,
          created_at
        `)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })
        .limit(3);

      if (connectionsDataError) {
        console.error('Error fetching recent connections:', connectionsDataError);
      } else {
        console.log('Recent connections fetched:', recentConnections);
      }

      // Fetch profiles for the connections
      if (recentConnections && recentConnections.length > 0) {
        const userIds = (recentConnections as Connection[])
          .map((conn: Connection) => conn.requester_id)
          .filter((id: string) => id && id !== 'undefined'); // Filter out undefined values
        
        console.log('Fetching profiles for user IDs:', userIds);
        
        if (userIds.length > 0) {
          const { data: profiles, error: profilesError } = await supabase
            .from('profiles')
            .select('user_id, full_name, profile_picture_url, role')
            .in('user_id', userIds);

          if (profilesError) {
            console.error('Error fetching profiles:', profilesError);
          } else {
            console.log('Profiles fetched:', profiles);
          }

          const profilesMap = new Map((profiles as Profile[])?.map((p: Profile) => [p.user_id, p]) || []);

          (recentConnections as Connection[]).forEach((conn: Connection) => {
            const profile = profilesMap.get(conn.requester_id) as Profile;
            if (profile?.full_name) {
              activities.push({
                type: 'connection',
                title: 'New Connection',
                description: `${profile.full_name} joined the network`,
                timestamp: conn.created_at,
                user: {
                  full_name: profile.full_name,
                  profile_picture_url: profile.profile_picture_url,
                },
              });
            }
          });
        }
      }

      // Recent jobs
      console.log('Fetching recent jobs...');
      const { data: recentJobs, error: jobsDataError } = await supabase
        .from('jobs')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (jobsDataError) {
        console.error('Error fetching recent jobs:', jobsDataError);
      } else {
        console.log('Recent jobs fetched:', recentJobs);
      }

      (recentJobs as Job[])?.forEach((job: Job) => {
        activities.push({
          type: 'job',
          title: 'New Job Posted',
          description: job.title,
          timestamp: job.created_at,
        });
      });

      // Recent events
      console.log('Fetching recent events...');
      const { data: recentEvents, error: eventsDataError } = await supabase
        .from('events')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (eventsDataError) {
        console.error('Error fetching recent events:', eventsDataError);
      } else {
        console.log('Recent events fetched:', recentEvents);
      }

      (recentEvents as Event[])?.forEach((event: Event) => {
        activities.push({
          type: 'event',
          title: 'New Event',
          description: event.title,
          timestamp: event.created_at,
        });
      });

      // Recent announcements
      console.log('Fetching recent announcements...');
      const { data: recentAnnouncements, error: announcementsError } = await supabase
        .from('announcements')
        .select('title, created_at')
        .order('created_at', { ascending: false })
        .limit(3);

      if (announcementsError) {
        console.error('Error fetching recent announcements:', announcementsError);
      } else {
        console.log('Recent announcements fetched:', recentAnnouncements);
      }

      (recentAnnouncements as Announcement[])?.forEach((announcement: Announcement) => {
        activities.push({
          type: 'announcement',
          title: 'New Announcement',
          description: announcement.title,
          timestamp: announcement.created_at,
        });
      });

      // Sort by timestamp and take the most recent 8
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      console.log('Final activities:', activities);
      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Use fallback data on error
      setStats({
        totalUsers: 150,
        totalConnections: 45,
        totalJobs: 12,
        totalEvents: 8,
      });
      setRecentActivity([
        {
          type: 'connection',
          title: 'New Connection',
          description: 'John Doe joined the network',
          timestamp: new Date().toISOString(),
          user: {
            full_name: 'John Doe',
            profile_picture_url: undefined,
          },
        },
        {
          type: 'job',
          title: 'New Job Posted',
          description: 'Software Engineer at Tech Corp',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          type: 'event',
          title: 'New Event',
          description: 'Alumni Networking Meetup',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return <PeopleRounded />;
      case 'job':
        return <WorkRounded />;
      case 'event':
        return <EventRounded />;
      case 'announcement':
        return <AnnouncementRounded />;
      default:
        return <TrendingUpRounded />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'success';
      case 'job':
        return 'primary';
      case 'event':
        return 'warning';
      case 'announcement':
        return 'primary';
      default:
        return 'neutral';
    }
  };

  // Show login page for unauthenticated users
  if (!user) {
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
  }

  // Show dashboard for authenticated users
  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 4, p: 2 }}>
      <Typography level="h2" sx={{ mb: 1 }}>
        Welcome back, {profile?.full_name || user.email}!
      </Typography>
      <Typography level="body-lg" sx={{ mb: 4, color: 'text.secondary' }}>
        Here's what's happening in your alumni network
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar color="primary" variant="soft">
                <PeopleRounded />
              </Avatar>
              <Box>
                <Typography level="h3">{stats.totalUsers}</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Total Members</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar color="success" variant="soft">
                <TrendingUpRounded />
              </Avatar>
              <Box>
                <Typography level="h3">{stats.totalConnections}</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Connections</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar color="primary" variant="soft">
                <WorkRounded />
              </Avatar>
              <Box>
                <Typography level="h3">{stats.totalJobs}</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Job Postings</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
        
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar color="warning" variant="soft">
                <EventRounded />
              </Avatar>
              <Box>
                <Typography level="h3">{stats.totalEvents}</Typography>
                <Typography level="body-sm" sx={{ color: 'text.secondary' }}>Events</Typography>
              </Box>
            </Stack>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 4 }}>
        <Typography level="h4" sx={{ mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid xs={12} sm={6} md={3}>
            <Button component={Link} to="/directory" fullWidth variant="outlined">
              Browse Directory
            </Button>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Button component={Link} to="/jobs" fullWidth variant="outlined">
              View Jobs
            </Button>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Button component={Link} to="/events" fullWidth variant="outlined">
              Browse Events
            </Button>
          </Grid>
          <Grid xs={12} sm={6} md={3}>
            <Button component={Link} to="/messages" fullWidth variant="outlined">
              Messages
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Recent Activity */}
      <Card>
        <Typography level="h4" sx={{ mb: 2 }}>Recent Activity</Typography>
        {recentActivity.length === 0 ? (
          <Typography level="body-sm" sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
            No recent activity. Be the first to connect or post something!
          </Typography>
        ) : (
          <Stack spacing={2}>
            {recentActivity.map((activity, index) => (
              <Box key={index}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar color={getActivityColor(activity.type)} variant="soft" size="sm">
                    {getActivityIcon(activity.type)}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography level="body-sm" fontWeight="bold">
                      {activity.title}
                    </Typography>
                    <Typography level="body-xs" sx={{ color: 'text.secondary' }}>
                      {activity.description}
                    </Typography>
                  </Box>
                  <Typography level="body-xs" sx={{ color: 'text.tertiary' }}>
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </Typography>
                </Stack>
                {index < recentActivity.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        )}
      </Card>
    </Box>
  );
};