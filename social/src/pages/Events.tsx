import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, CircularProgress, Alert, Button, Card, Avatar, Input, Textarea, Modal, ModalDialog, ModalClose, Chip, Select, Option } from '@mui/joy';
import { Add as AddIcon, Event as EventIcon, LocationOn as LocationIcon, CalendarToday as CalendarIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';

interface Event {
  id: string;
  title: string;
  description?: string;
  location?: string;
  event_time: string;
  created_at: string;
  created_by: {
    full_name: string;
    profile_picture_url?: string;
    role: string;
  };
  rsvps: {
    user_id: string;
    status: 'attending' | 'not_attending' | 'interested';
    user: {
      full_name: string;
      profile_picture_url?: string;
    };
  }[];
}

interface CreateEventForm {
  title: string;
  description: string;
  location: string;
  event_time: string;
}

export const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'not_attending' | 'interested'>('attending');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateEventForm>();

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError('');
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Not logged in.');
        setLoading(false);
        return;
      }
      
      setCurrentUser(user);

      // Fetch user's role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserRole(profile.role);
      }

      // Fetch events
      const { data: eventsData, error } = await supabase
        .from('events')
        .select('*')
        .order('event_time', { ascending: true });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (eventsData && eventsData.length > 0) {
        // Fetch creator profiles
        const creatorIds = [...new Set(eventsData.map(event => event.created_by_user_id))];
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url, role')
          .in('user_id', creatorIds);

        // Fetch RSVPs for all events
        const eventIds = eventsData.map(event => event.id);
        const { data: rsvpsData } = await supabase
          .from('event_rsvps')
          .select('*')
          .in('event_id', eventIds);

        // Fetch user profiles for RSVPs
        const rsvpUserIds = [...new Set(rsvpsData?.map(rsvp => rsvp.user_id) || [])];
        const { data: rsvpUserProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url')
          .in('user_id', rsvpUserIds);

        // Create maps
        const creatorProfilesMap = new Map();
        creatorProfiles?.forEach(profile => {
          creatorProfilesMap.set(profile.user_id, profile);
        });

        const rsvpUserProfilesMap = new Map();
        rsvpUserProfiles?.forEach(profile => {
          rsvpUserProfilesMap.set(profile.user_id, profile);
        });

        // Group RSVPs by event
        const rsvpsByEvent = new Map();
        rsvpsData?.forEach(rsvp => {
          if (!rsvpsByEvent.has(rsvp.event_id)) {
            rsvpsByEvent.set(rsvp.event_id, []);
          }
          rsvpsByEvent.get(rsvp.event_id).push({
            ...rsvp,
            user: rsvpUserProfilesMap.get(rsvp.user_id)
          });
        });

        // Add creator and RSVP info to events
        const eventsWithDetails = eventsData.map(event => ({
          ...event,
          created_by: creatorProfilesMap.get(event.created_by_user_id),
          rsvps: rsvpsByEvent.get(event.id) || []
        }));

        setEvents(eventsWithDetails);
      } else {
        setEvents([]);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  const canCreateEvents = () => {
    return ['admin', 'moderator'].includes(userRole);
  };

  const handleCreateEvent = async (formData: CreateEventForm) => {
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          created_by_user_id: currentUser.id,
          title: formData.title,
          description: formData.description || null,
          location: formData.location || null,
          event_time: formData.event_time
        });

      if (error) throw error;

      setSuccess('Event created successfully!');
      setShowCreateModal(false);
      reset();

      // Refresh events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_time', { ascending: true });

      if (eventsData && eventsData.length > 0) {
        // Fetch creator profiles
        const creatorIds = [...new Set(eventsData.map(event => event.created_by_user_id))];
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url, role')
          .in('user_id', creatorIds);

        // Fetch RSVPs for all events
        const eventIds = eventsData.map(event => event.id);
        const { data: rsvpsData } = await supabase
          .from('event_rsvps')
          .select('*')
          .in('event_id', eventIds);

        // Fetch user profiles for RSVPs
        const rsvpUserIds = [...new Set(rsvpsData?.map(rsvp => rsvp.user_id) || [])];
        const { data: rsvpUserProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url')
          .in('user_id', rsvpUserIds);

        // Create maps
        const creatorProfilesMap = new Map();
        creatorProfiles?.forEach(profile => {
          creatorProfilesMap.set(profile.user_id, profile);
        });

        const rsvpUserProfilesMap = new Map();
        rsvpUserProfiles?.forEach(profile => {
          rsvpUserProfilesMap.set(profile.user_id, profile);
        });

        // Group RSVPs by event
        const rsvpsByEvent = new Map();
        rsvpsData?.forEach(rsvp => {
          if (!rsvpsByEvent.has(rsvp.event_id)) {
            rsvpsByEvent.set(rsvp.event_id, []);
          }
          rsvpsByEvent.get(rsvp.event_id).push({
            ...rsvp,
            user: rsvpUserProfilesMap.get(rsvp.user_id)
          });
        });

        // Add creator and RSVP info to events
        const eventsWithDetails = eventsData.map(event => ({
          ...event,
          created_by: creatorProfilesMap.get(event.created_by_user_id),
          rsvps: rsvpsByEvent.get(event.id) || []
        }));

        setEvents(eventsWithDetails);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRSVP = async (eventId: string, status: 'attending' | 'not_attending' | 'interested') => {
    try {
      // Check if RSVP already exists
      const { data: existingRsvp } = await supabase
        .from('event_rsvps')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('event_id', eventId)
        .single();

      if (existingRsvp) {
        // Update existing RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .update({ status })
          .eq('user_id', currentUser.id)
          .eq('event_id', eventId);

        if (error) throw error;
      } else {
        // Create new RSVP
        const { error } = await supabase
          .from('event_rsvps')
          .insert({
            user_id: currentUser.id,
            event_id: eventId,
            status
          });

        if (error) throw error;
      }

      setSuccess(`RSVP updated to ${status}!`);
      
      // Refresh events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('event_time', { ascending: true });

      if (eventsData && eventsData.length > 0) {
        // Fetch creator profiles
        const creatorIds = [...new Set(eventsData.map(event => event.created_by_user_id))];
        const { data: creatorProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url, role')
          .in('user_id', creatorIds);

        // Fetch RSVPs for all events
        const eventIds = eventsData.map(event => event.id);
        const { data: rsvpsData } = await supabase
          .from('event_rsvps')
          .select('*')
          .in('event_id', eventIds);

        // Fetch user profiles for RSVPs
        const rsvpUserIds = [...new Set(rsvpsData?.map(rsvp => rsvp.user_id) || [])];
        const { data: rsvpUserProfiles } = await supabase
          .from('profiles')
          .select('user_id, full_name, profile_picture_url')
          .in('user_id', rsvpUserIds);

        // Create maps
        const creatorProfilesMap = new Map();
        creatorProfiles?.forEach(profile => {
          creatorProfilesMap.set(profile.user_id, profile);
        });

        const rsvpUserProfilesMap = new Map();
        rsvpUserProfiles?.forEach(profile => {
          rsvpUserProfilesMap.set(profile.user_id, profile);
        });

        // Group RSVPs by event
        const rsvpsByEvent = new Map();
        rsvpsData?.forEach(rsvp => {
          if (!rsvpsByEvent.has(rsvp.event_id)) {
            rsvpsByEvent.set(rsvp.event_id, []);
          }
          rsvpsByEvent.get(rsvp.event_id).push({
            ...rsvp,
            user: rsvpUserProfilesMap.get(rsvp.user_id)
          });
        });

        // Add creator and RSVP info to events
        const eventsWithDetails = eventsData.map(event => ({
          ...event,
          created_by: creatorProfilesMap.get(event.created_by_user_id),
          rsvps: rsvpsByEvent.get(event.id) || []
        }));

        setEvents(eventsWithDetails);
      } else {
        setEvents([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      setEvents(prev => prev.filter(event => event.id !== eventId));
      setSuccess('Event deleted successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getUserRSVPStatus = (event: Event) => {
    const userRsvp = event.rsvps.find(rsvp => rsvp.user_id === currentUser?.id);
    return userRsvp?.status || null;
  };

  const getRSVPCount = (event: Event, status: 'attending' | 'not_attending' | 'interested') => {
    return event.rsvps.filter(rsvp => rsvp.status === status).length;
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography level="h3">Events</Typography>
        {canCreateEvents() && (
          <Button
            startDecorator={<AddIcon />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Event
          </Button>
        )}
      </Box>

      {success && <Alert color="success" sx={{ mb: 2 }}>{success}</Alert>}

      {events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography level="body-lg" color="neutral">
            No events scheduled yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {events.map((event) => {
            const userRsvpStatus = getUserRSVPStatus(event);
            const isPastEvent = new Date(event.event_time) < new Date();
            
            return (
              <Card key={event.id} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography level="h4" sx={{ mb: 1 }}>
                      {event.title}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarIcon sx={{ fontSize: 16 }} />
                        <Typography level="body-sm">
                          {new Date(event.event_time).toLocaleDateString()} at {new Date(event.event_time).toLocaleTimeString()}
                        </Typography>
                      </Box>
                      {event.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationIcon sx={{ fontSize: 16 }} />
                          <Typography level="body-sm">{event.location}</Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {isPastEvent && <Chip size="sm" color="neutral">Past Event</Chip>}
                    {(userRole === 'admin' || (currentUser?.id === event.created_by_user_id)) && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="outlined"
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {event.description && (
                  <Typography level="body-md" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                    {event.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={event.created_by.profile_picture_url}
                      alt={event.created_by.full_name}
                      sx={{ width: 24, height: 24 }}
                    >
                      {event.created_by.full_name[0]}
                    </Avatar>
                    <Typography level="body-sm" color="neutral">
                      Created by {event.created_by.full_name} • {new Date(event.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip size="sm" color="success">
                      {getRSVPCount(event, 'attending')} Attending
                    </Chip>
                    <Chip size="sm" color="warning">
                      {getRSVPCount(event, 'interested')} Interested
                    </Chip>
                    <Chip size="sm" color="danger">
                      {getRSVPCount(event, 'not_attending')} Not Attending
                    </Chip>
                  </Box>
                </Box>
                
                {!isPastEvent && (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="sm"
                      color={userRsvpStatus === 'attending' ? 'success' : 'neutral'}
                      variant={userRsvpStatus === 'attending' ? 'solid' : 'outlined'}
                      onClick={() => handleRSVP(event.id, 'attending')}
                    >
                      Attending
                    </Button>
                    <Button
                      size="sm"
                      color={userRsvpStatus === 'interested' ? 'warning' : 'neutral'}
                      variant={userRsvpStatus === 'interested' ? 'solid' : 'outlined'}
                      onClick={() => handleRSVP(event.id, 'interested')}
                    >
                      Interested
                    </Button>
                    <Button
                      size="sm"
                      color={userRsvpStatus === 'not_attending' ? 'danger' : 'neutral'}
                      variant={userRsvpStatus === 'not_attending' ? 'solid' : 'outlined'}
                      onClick={() => handleRSVP(event.id, 'not_attending')}
                    >
                      Not Attending
                    </Button>
                  </Box>
                )}
              </Card>
            );
          })}
        </Box>
      )}

      {/* Create Event Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalDialog size="md">
          <ModalClose />
          <Typography level="h4" mb={2}>Create Event</Typography>
          
          <form onSubmit={handleSubmit(handleCreateEvent)}>
            <Input
              {...register('title', { required: 'Event title is required' })}
              placeholder="Event Title"
              sx={{ mb: 2 }}
            />
            {errors.title && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.title.message}
              </Typography>
            )}
            
            <Textarea
              {...register('description')}
              placeholder="Event description (optional)..."
              minRows={3}
              sx={{ mb: 2 }}
            />
            
            <Input
              {...register('location')}
              placeholder="Location (optional)"
              sx={{ mb: 2 }}
            />
            
            <Input
              {...register('event_time', { required: 'Event time is required' })}
              type="datetime-local"
              sx={{ mb: 2 }}
            />
            {errors.event_time && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.event_time.message}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" color="primary">
                Create Event
              </Button>
            </Box>
          </form>
        </ModalDialog>
      </Modal>
    </Box>
  );
}; 