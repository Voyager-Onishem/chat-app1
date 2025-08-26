import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, CircularProgress, Alert, Button, Card, Avatar, Chip } from '@mui/joy';
import { UserProfile } from '../types';

interface DbConnection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

interface Connection {
  id: string;
  requester: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
    role: string;
    company?: string;
    job_title?: string;
  };
  addressee: {
    id: string;
    full_name: string;
    profile_picture_url?: string;
    role: string;
    company?: string;
    job_title?: string;
  };
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
}

export const Connections = () => {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchConnections = async () => {
      setLoading(true);
      setError('');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Not logged in.');
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);

      // Fetch all connections where current user is involved
      const { data: connectionsData, error } = await supabase
        .from('connections')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Fetch profiles for all users involved in connections
      const userIds = new Set<string>();
      connectionsData?.forEach((conn: DbConnection) => {
        userIds.add(conn.requester_id);
        userIds.add(conn.addressee_id);
      });

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, profile_picture_url, role, company, job_title')
        .in('user_id', Array.from(userIds));

      // Create a map of user profiles
      const profilesMap = new Map();
      profilesData?.forEach((profile: UserProfile) => {
        profilesMap.set(profile.user_id, profile);
      });

      // Combine connections with profile data
      const enrichedConnections = connectionsData?.map((conn: DbConnection) => ({
        ...conn,
        requester: profilesMap.get(conn.requester_id),
        addressee: profilesMap.get(conn.addressee_id)
      })) || [];

      setConnections(enrichedConnections);
      setLoading(false);
    };

    fetchConnections();
  }, []);

  const handleConnectionAction = async (connectionId: string, action: 'accept' | 'reject') => {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'blocked',
          updated_at: new Date().toISOString()
        })
        .eq('requester_id', connectionId.split('-')[0])
        .eq('addressee_id', connectionId.split('-')[1]);

      if (error) throw error;

      // Update local state
      setConnections(prev => 
        prev.map(conn => {
          if (conn.requester.id === connectionId.split('-')[0] && 
              conn.addressee.id === connectionId.split('-')[1]) {
            return { ...conn, status: action === 'accept' ? 'accepted' : 'blocked' };
          }
          return conn;
        })
      );
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update connection"; setError(errorMessage);
    }
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;

  const pendingRequests = connections.filter(
    conn => conn.addressee.id === currentUser?.id && conn.status === 'pending'
  );
  const acceptedConnections = connections.filter(conn => conn.status === 'accepted');
  const sentRequests = connections.filter(
    conn => conn.requester.id === currentUser?.id && conn.status === 'pending'
  );

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8 }}>
      <Typography level="h3" mb={3}>My Network</Typography>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography level="h4" mb={2}>Pending Requests ({pendingRequests.length})</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {pendingRequests.map((conn) => (
              <Card key={`${conn.requester.id}-${conn.addressee.id}`} sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: { xs: 'stretch', sm: 'center' }, 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Avatar
                      src={conn.requester.profile_picture_url}
                      alt={conn.requester.full_name}
                      sx={{ width: 48, height: 48 }}
                    >
                      {conn.requester.full_name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography level="title-md">{conn.requester.full_name}</Typography>
                      <Typography level="body-sm" color="neutral">
                        {conn.requester.role.charAt(0).toUpperCase() + conn.requester.role.slice(1)}
                      </Typography>
                      {conn.requester.company && (
                        <Typography level="body-sm" color="neutral">
                          {conn.requester.job_title} at {conn.requester.company}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Button
                      size="sm"
                      color="success"
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                      onClick={() => handleConnectionAction(`${conn.requester.id}-${conn.addressee.id}`, 'accept')}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      color="danger"
                      variant="outlined"
                      sx={{ width: { xs: '100%', sm: 'auto' } }}
                      onClick={() => handleConnectionAction(`${conn.requester.id}-${conn.addressee.id}`, 'reject')}
                    >
                      Decline
                    </Button>
                  </Box>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Accepted Connections */}
      {acceptedConnections.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography level="h4" mb={2}>Connections ({acceptedConnections.length})</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {acceptedConnections.map((conn) => {
              const otherUser = conn.requester.id === currentUser?.id ? conn.addressee : conn.requester;
              return (
                <Card key={`${conn.requester.id}-${conn.addressee.id}`} sx={{ p: 2 }}>
                                  <Box sx={{ 
                  display: 'flex', 
                  alignItems: { xs: 'stretch', sm: 'center' }, 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Avatar
                      src={otherUser.profile_picture_url}
                      alt={otherUser.full_name}
                      sx={{ width: 48, height: 48 }}
                    >
                      {otherUser.full_name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography level="title-md">{otherUser.full_name}</Typography>
                      <Typography level="body-sm" color="neutral">
                        {otherUser.role.charAt(0).toUpperCase() + otherUser.role.slice(1)}
                      </Typography>
                      {otherUser.company && (
                        <Typography level="body-sm" color="neutral">
                          {otherUser.job_title} at {otherUser.company}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip color="success" size="sm" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>Connected</Chip>
                </Box>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      {/* Sent Requests */}
      {sentRequests.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography level="h4" mb={2}>Sent Requests ({sentRequests.length})</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {sentRequests.map((conn) => (
              <Card key={`${conn.requester.id}-${conn.addressee.id}`} sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: { xs: 'stretch', sm: 'center' }, 
                  gap: 2,
                  flexDirection: { xs: 'column', sm: 'row' }
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 2,
                    flexDirection: { xs: 'column', sm: 'row' },
                    width: { xs: '100%', sm: 'auto' }
                  }}>
                    <Avatar
                      src={conn.addressee.profile_picture_url}
                      alt={conn.addressee.full_name}
                      sx={{ width: 48, height: 48 }}
                    >
                      {conn.addressee.full_name[0]}
                    </Avatar>
                    <Box sx={{ flex: 1, textAlign: { xs: 'center', sm: 'left' } }}>
                      <Typography level="title-md">{conn.addressee.full_name}</Typography>
                      <Typography level="body-sm" color="neutral">
                        {conn.addressee.role.charAt(0).toUpperCase() + conn.addressee.role.slice(1)}
                      </Typography>
                      {conn.addressee.company && (
                        <Typography level="body-sm" color="neutral">
                          {conn.addressee.job_title} at {conn.addressee.company}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Chip color="warning" size="sm" sx={{ alignSelf: { xs: 'center', sm: 'flex-start' } }}>Pending</Chip>
                </Box>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {connections.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography level="body-lg" color="neutral">
            No connections yet. Start by browsing the directory and sending connection requests!
          </Typography>
        </Box>
      )}
    </Box>
  );
}; 