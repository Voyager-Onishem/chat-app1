import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Alert, 
  Card, 
  Button, 
  Grid, 
  Chip,
  Table,
  Modal,
  Input,
  Textarea,
  Select,
  Option,
  IconButton
} from '@mui/joy';
import { Delete, Edit, Visibility } from '@mui/icons-material';

export const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  // Data states
  const [users, setUsers] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [pendingRegistrations, setPendingRegistrations] = useState<any[]>([]);

  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showJobModal, setShowJobModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    content: '',
    priority: 'normal'
  });
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    description: '',
    location: '',
    salary_range: '',
    requirements: ''
  });
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    date: '',
    location: '',
    max_participants: ''
  });

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

      // Check if user is admin
      const { data: adminCheck, error: adminError } = await supabase
        .from('admins')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (adminError || !adminCheck) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      // Check profile role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      setIsAdmin(true);
      await fetchAllData();
      setLoading(false);
    };

    checkAuthAndFetch();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch announcements
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch events
      const { data: eventsData } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch connections
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('*')
        .order('created_at', { ascending: false });

      // Fetch pending registrations
      const { data: pendingData } = await supabase
        .from('pending_registrations')
        .select('*')
        .eq('status', 'pending')
        .order('requested_at', { ascending: false });

      setUsers(usersData || []);
      setAnnouncements(announcementsData || []);
      setJobs(jobsData || []);
      setEvents(eventsData || []);
      setConnections(connectionsData || []);
      setPendingRegistrations(pendingData || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          title: announcementForm.title,
          content: announcementForm.content,
          priority: announcementForm.priority,
          posted_by: currentUser.id
        });

      if (error) throw error;

      setShowAnnouncementModal(false);
      setAnnouncementForm({ title: '', content: '', priority: 'normal' });
      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateJob = async () => {
    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          title: jobForm.title,
          company: jobForm.company,
          description: jobForm.description,
          location: jobForm.location,
          salary_range: jobForm.salary_range,
          requirements: jobForm.requirements,
          posted_by: currentUser.id
        });

      if (error) throw error;

      setShowJobModal(false);
      setJobForm({ title: '', company: '', description: '', location: '', salary_range: '', requirements: '' });
      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreateEvent = async () => {
    try {
      const { error } = await supabase
        .from('events')
        .insert({
          title: eventForm.title,
          description: eventForm.description,
          date: eventForm.date,
          location: eventForm.location,
          max_participants: parseInt(eventForm.max_participants),
          created_by: currentUser.id
        });

      if (error) throw error;

      setShowEventModal(false);
      setEventForm({ title: '', description: '', date: '', location: '', max_participants: '' });
      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteItem = async (table: string, id: string) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleApproveRegistration = async (registration: any) => {
    try {
      // Create profile for the approved user
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: registration.user_id,
          full_name: registration.full_name,
          email: registration.email,
          role: registration.role,
          is_mentor: false,
          bio: '',
          location: '',
          company: '',
          job_title: '',
          graduation_year: null,
          skills: '[]',
          profile_photo_url: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) throw profileError;

      // Update registration status to approved
      const { error: updateError } = await supabase
        .from('pending_registrations')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDenyRegistration = async (registration: any) => {
    try {
      // Update registration status to denied
      const { error: updateError } = await supabase
        .from('pending_registrations')
        .update({
          status: 'denied',
          reviewed_at: new Date().toISOString(),
          reviewed_by: currentUser.id
        })
        .eq('id', registration.id);

      if (updateError) throw updateError;

      await fetchAllData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (authenticated === false) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Alert color="warning" sx={{ mb: 2 }}>You must be logged in to access the admin dashboard.</Alert>
      </Box>
    );
  }
  if (!isAdmin) {
    return (
      <Box sx={{ mt: 8, textAlign: 'center' }}>
        <Alert color="danger" sx={{ mb: 2 }}>{error}</Alert>
      </Box>
    );
  }
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', mt: 8, p: 2 }}>
      <Typography level="h2" mb={3}>Admin Dashboard</Typography>
      
      {/* Quick Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Typography level="h4">{users.length}</Typography>
            <Typography level="body-sm">Total Users</Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Typography level="h4">{announcements.length}</Typography>
            <Typography level="body-sm">Announcements</Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Typography level="h4">{jobs.length}</Typography>
            <Typography level="body-sm">Job Postings</Typography>
          </Card>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Card>
            <Typography level="h4">{events.length}</Typography>
            <Typography level="body-sm">Events</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Registrations */}
      {pendingRegistrations.length > 0 && (
        <Card sx={{ mb: 4 }}>
          <Typography level="h4" mb={2}>Pending Registrations ({pendingRegistrations.length})</Typography>
          <Table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingRegistrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{registration.full_name}</td>
                  <td>{registration.email}</td>
                  <td>
                    <Chip color={registration.role === 'alumni' ? 'success' : 'primary'}>
                      {registration.role}
                    </Chip>
                  </td>
                  <td>{new Date(registration.requested_at).toLocaleDateString()}</td>
                  <td>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button 
                        size="sm" 
                        color="success" 
                        onClick={() => handleApproveRegistration(registration)}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        color="danger" 
                        onClick={() => handleDenyRegistration(registration)}
                      >
                        Deny
                      </Button>
                    </Box>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      {/* Action Buttons */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button onClick={() => setShowAnnouncementModal(true)}>Create Announcement</Button>
        <Button onClick={() => setShowJobModal(true)}>Post Job</Button>
        <Button onClick={() => setShowEventModal(true)}>Create Event</Button>
      </Box>

      {/* Users Table */}
      <Card sx={{ mb: 4 }}>
        <Typography level="h4" mb={2}>Users</Typography>
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.user_id}>
                <td>{user.full_name}</td>
                <td>{user.email}</td>
                <td>
                  <Chip color={user.role === 'admin' ? 'danger' : user.role === 'alumni' ? 'success' : 'primary'}>
                    {user.role}
                  </Chip>
                </td>
                <td>
                  <Chip color={user.is_mentor ? 'success' : 'neutral'}>
                    {user.is_mentor ? 'Mentor' : 'Regular'}
                  </Chip>
                </td>
                <td>
                  <IconButton size="sm">
                    <Visibility />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Announcements */}
      <Card sx={{ mb: 4 }}>
        <Typography level="h4" mb={2}>Announcements</Typography>
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((announcement) => (
              <tr key={announcement.id}>
                <td>{announcement.title}</td>
                <td>
                  <Chip color={announcement.priority === 'high' ? 'danger' : 'neutral'}>
                    {announcement.priority}
                  </Chip>
                </td>
                <td>{new Date(announcement.created_at).toLocaleDateString()}</td>
                <td>
                  <IconButton size="sm" onClick={() => handleDeleteItem('announcements', announcement.id)}>
                    <Delete />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Jobs */}
      <Card sx={{ mb: 4 }}>
        <Typography level="h4" mb={2}>Job Postings</Typography>
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Company</th>
              <th>Location</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.title}</td>
                <td>{job.company}</td>
                <td>{job.location}</td>
                <td>{new Date(job.created_at).toLocaleDateString()}</td>
                <td>
                  <IconButton size="sm" onClick={() => handleDeleteItem('jobs', job.id)}>
                    <Delete />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Events */}
      <Card sx={{ mb: 4 }}>
        <Typography level="h4" mb={2}>Events</Typography>
        <Table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id}>
                <td>{event.title}</td>
                <td>{new Date(event.date).toLocaleDateString()}</td>
                <td>{event.location}</td>
                <td>{new Date(event.created_at).toLocaleDateString()}</td>
                <td>
                  <IconButton size="sm" onClick={() => handleDeleteItem('events', event.id)}>
                    <Delete />
                  </IconButton>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card>

      {/* Announcement Modal */}
      <Modal open={showAnnouncementModal} onClose={() => setShowAnnouncementModal(false)}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 400, 
          bgcolor: 'background.paper', 
          boxShadow: 24, 
          p: 4, 
          borderRadius: 2 
        }}>
          <Typography level="h4" mb={2}>Create Announcement</Typography>
          <Input
            placeholder="Title"
            value={announcementForm.title}
            onChange={(e) => setAnnouncementForm({...announcementForm, title: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Textarea
            placeholder="Content"
            value={announcementForm.content}
            onChange={(e) => setAnnouncementForm({...announcementForm, content: e.target.value})}
            sx={{ mb: 2 }}
            minRows={3}
          />
          <Select
            value={announcementForm.priority}
            onChange={(e, value) => setAnnouncementForm({...announcementForm, priority: value || 'normal'})}
            sx={{ mb: 2 }}
          >
            <Option value="normal">Normal</Option>
            <Option value="high">High</Option>
          </Select>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCreateAnnouncement}>Create</Button>
            <Button variant="outlined" onClick={() => setShowAnnouncementModal(false)}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      {/* Job Modal */}
      <Modal open={showJobModal} onClose={() => setShowJobModal(false)}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 500, 
          bgcolor: 'background.paper', 
          boxShadow: 24, 
          p: 4, 
          borderRadius: 2 
        }}>
          <Typography level="h4" mb={2}>Post Job</Typography>
          <Input
            placeholder="Job Title"
            value={jobForm.title}
            onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Input
            placeholder="Company"
            value={jobForm.company}
            onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Input
            placeholder="Location"
            value={jobForm.location}
            onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Input
            placeholder="Salary Range"
            value={jobForm.salary_range}
            onChange={(e) => setJobForm({...jobForm, salary_range: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Textarea
            placeholder="Description"
            value={jobForm.description}
            onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
            sx={{ mb: 2 }}
            minRows={3}
          />
          <Textarea
            placeholder="Requirements"
            value={jobForm.requirements}
            onChange={(e) => setJobForm({...jobForm, requirements: e.target.value})}
            sx={{ mb: 2 }}
            minRows={2}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCreateJob}>Post Job</Button>
            <Button variant="outlined" onClick={() => setShowJobModal(false)}>Cancel</Button>
          </Box>
        </Box>
      </Modal>

      {/* Event Modal */}
      <Modal open={showEventModal} onClose={() => setShowEventModal(false)}>
        <Box sx={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: 500, 
          bgcolor: 'background.paper', 
          boxShadow: 24, 
          p: 4, 
          borderRadius: 2 
        }}>
          <Typography level="h4" mb={2}>Create Event</Typography>
          <Input
            placeholder="Event Title"
            value={eventForm.title}
            onChange={(e) => setEventForm({...eventForm, title: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Input
            placeholder="Location"
            value={eventForm.location}
            onChange={(e) => setEventForm({...eventForm, location: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Input
            type="datetime-local"
            value={eventForm.date}
            onChange={(e) => setEventForm({...eventForm, date: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Input
            placeholder="Max Participants"
            type="number"
            value={eventForm.max_participants}
            onChange={(e) => setEventForm({...eventForm, max_participants: e.target.value})}
            sx={{ mb: 2 }}
          />
          <Textarea
            placeholder="Description"
            value={eventForm.description}
            onChange={(e) => setEventForm({...eventForm, description: e.target.value})}
            sx={{ mb: 2 }}
            minRows={3}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleCreateEvent}>Create Event</Button>
            <Button variant="outlined" onClick={() => setShowEventModal(false)}>Cancel</Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
}; 