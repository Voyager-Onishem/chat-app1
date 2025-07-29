import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, CircularProgress, Alert, Card, Chip, Avatar, Button } from '@mui/joy';
import './Directory.css';

export const Directory = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    const checkAuthAndFetch = async () => {
      setLoading(true);
      setError('');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setAuthenticated(false);
        setLoading(false);
        return;
      }
      setAuthenticated(true);
      setCurrentUser(user);
      
      // Fetch profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, full_name, role, graduation_year, company, job_title, linkedin_url, bio, is_mentor, skills, profile_picture_url')
        .neq('role', 'admin')
        .neq('user_id', user.id);
      
      if (error) {
        setError(error.message);
      } else {
        setProfiles(data || []);
      }
      
      // Fetch user's connections
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      setConnections(connectionsData || []);
      setLoading(false);
    };
    checkAuthAndFetch();
  }, []);

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (authenticated === false) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Alert color="warning" sx={{ mb: 2 }}>You must be logged in to view the directory.</Alert>
      </Box>
    );
  }
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;

  const getConnectionStatus = (profileUserId: string) => {
    const connection = connections.find(conn => 
      (conn.requester_id === currentUser?.id && conn.addressee_id === profileUserId) ||
      (conn.requester_id === profileUserId && conn.addressee_id === currentUser?.id)
    );
    return connection?.status || null;
  };

  const handleSendConnection = async (targetUserId: string) => {
    try {
      // Check if user is authenticated
      if (!currentUser || !currentUser.id) {
        setError('User not authenticated');
        return;
      }

      // Check if trying to connect to self
      if (currentUser.id === targetUserId) {
        setError('Cannot connect to yourself');
        return;
      }

      // Check if connection already exists
      const existingConnection = connections.find(conn => 
        (conn.requester_id === currentUser.id && conn.addressee_id === targetUserId) ||
        (conn.requester_id === targetUserId && conn.addressee_id === currentUser.id)
      );

      if (existingConnection) {
        setError('Connection already exists');
        return;
      }

      // Check if user has a profile (required by RLS policy)
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, role')
        .eq('user_id', currentUser.id)
        .single();

      console.log('User profile check:', { userProfile, profileError });

      if (profileError || !userProfile) {
        setError('Profile not found. Please complete your profile first.');
        return;
      }

      console.log('User profile found:', userProfile);

      console.log('Sending connection request:', {
        requester_id: currentUser.id,
        addressee_id: targetUserId,
        status: 'pending'
      });

      // Debug: Check current auth state
      const { data: { user: currentAuthUser } } = await supabase.auth.getUser();
      console.log('Current auth user:', currentAuthUser);
      console.log('auth.uid() should be:', currentAuthUser?.id);

      const { error } = await supabase
        .from('connections')
        .insert({
          requester_id: currentUser.id,
          addressee_id: targetUserId,
          status: 'pending'
        });

      if (error) {
        console.error('Connection insert error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // Refresh connections
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${currentUser.id},addressee_id.eq.${currentUser.id}`);
      
      setConnections(connectionsData || []);
    } catch (err: any) {
      console.error('Connection error:', err);
      setError(err.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', mt: 8, height: 600, overflowY: 'auto', overflowX: 'hidden', pr: 1 }}>
      <Typography level="h3" mb={2}>Alumni Directory</Typography>
      {profiles.length === 0 ? (
        <Typography>No users found.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {profiles.map((profile, idx) => {
            const connectionStatus = getConnectionStatus(profile.user_id);
            
            return (
            <Card
              key={idx}
              className="directory-card"
              sx={{
                transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
                cursor: 'pointer',
                overflow: 'hidden',
                p: 2,
                '&:hover': {
                  boxShadow: 'lg',
                  transform: 'scale(1.03)',
                  maxHeight: 400,
                  minHeight: 180,
                },
                maxHeight: 120,
                minHeight: 80,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                position: 'relative',
              }}
            >
              <Avatar 
                src={profile.profile_picture_url} 
                alt={profile.full_name} 
                sx={{ width: 56, height: 56, mr: 2 }}
              >
                {profile.full_name[0]}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography level="title-lg">{profile.full_name}</Typography>
                <Typography level="body-sm" color="neutral">{profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}</Typography>
                <Box className="directory-card-details" sx={{ mt: 1, opacity: 0, maxHeight: 0, transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}>
                  {profile.company && <Typography><b>Company:</b> {profile.company}</Typography>}
                  {profile.job_title && <Typography><b>Job Title:</b> {profile.job_title}</Typography>}
                  {profile.graduation_year && <Typography><b>Graduation Year:</b> {profile.graduation_year}</Typography>}
                  {profile.linkedin_url && (
                    <Typography><b>LinkedIn:</b> <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">{profile.linkedin_url}</a></Typography>
                  )}
                  {profile.bio && <Typography><b>Bio:</b> {profile.bio}</Typography>}
                  {profile.role === 'alumni' && (
                    <Typography><b>Mentor:</b> {profile.is_mentor ? 'Yes' : 'No'}</Typography>
                  )}
                  {profile.skills && profile.skills.length > 0 && (
                    <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <b>Skills:</b>
                      {profile.skills.map((s: string, i: number) => <Chip key={i} sx={{ ml: 0.5 }}>{s}</Chip>)}
                    </Box>
                  )}
                </Box>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {!connectionStatus && (
                  <Button
                    size="sm"
                    onClick={() => handleSendConnection(profile.user_id)}
                  >
                    Connect
                  </Button>
                )}
                {connectionStatus === 'pending' && (
                  <Chip size="sm" color="warning">Pending</Chip>
                )}
                {connectionStatus === 'accepted' && (
                  <Chip size="sm" color="success">Connected</Chip>
                )}
              </Box>
            </Card>
          );
        })}
        </Box>
      )}
    </Box>
  );
}; 