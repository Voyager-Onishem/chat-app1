import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, CircularProgress, Alert, Button, Card, Avatar, Input, Textarea, Modal, ModalDialog, ModalClose } from '@mui/joy';
import { Add as AddIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';

interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author: {
    full_name: string;
    profile_picture_url?: string;
    role: string;
  };
}

interface CreateAnnouncementForm {
  title: string;
  content: string;
}

export const Announcements = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateAnnouncementForm>();

  useEffect(() => {
    const fetchAnnouncements = async () => {
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

      // Fetch announcements with author information in a single query
      const { data: announcementsData, error } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_user_id_fkey (
            full_name,
            profile_picture_url,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      // Map announcements and handle missing profiles
      const announcementsWithAuthors = announcementsData?.map(announcement => ({
        ...announcement,
        author: announcement.author || {
          full_name: 'Unknown User',
          profile_picture_url: null,
          role: 'unknown'
        }
      })) || [];

      setAnnouncements(announcementsWithAuthors);
      setLoading(false);
    };

    fetchAnnouncements();
  }, []);

  const canCreateAnnouncement = () => {
    return ['admin', 'moderator'].includes(userRole);
  };

  const handleCreateAnnouncement = async (formData: CreateAnnouncementForm) => {
    try {
      const { error } = await supabase
        .from('announcements')
        .insert({
          user_id: currentUser.id,
          title: formData.title,
          content: formData.content
        });

      if (error) throw error;

      setSuccess('Announcement created successfully!');
      setShowCreateModal(false);
      reset();

      // Refresh announcements with author information
      const { data: announcementsData } = await supabase
        .from('announcements')
        .select(`
          *,
          author:profiles!announcements_user_id_fkey (
            full_name,
            profile_picture_url,
            role
          )
        `)
        .order('created_at', { ascending: false });

      // Map announcements and handle missing profiles
      const announcementsWithAuthors = announcementsData?.map(announcement => ({
        ...announcement,
        author: announcement.author || {
          full_name: 'Unknown User',
          profile_picture_url: null,
          role: 'unknown'
        }
      })) || [];

      setAnnouncements(announcementsWithAuthors);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', announcementId);

      if (error) throw error;

      setAnnouncements(prev => prev.filter(ann => ann.id !== announcementId));
      setSuccess('Announcement deleted successfully!');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography level="h3">Announcements</Typography>
        {canCreateAnnouncement() && (
          <Button
            startDecorator={<AddIcon />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Announcement
          </Button>
        )}
      </Box>

      {success && <Alert color="success" sx={{ mb: 2 }}>{success}</Alert>}

      {announcements.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography level="body-lg" color="neutral">
            No announcements yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {announcements.map((announcement) => (
            <Card key={announcement.id} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar
                  sx={{ width: 40, height: 40, bgcolor: 'primary.500' }}
                >
                  A
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography level="title-md">Admin</Typography>
                  <Typography level="body-sm" color="neutral">
                    Administrator • {new Date(announcement.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                {userRole === 'admin' && (
                  <Button
                    size="sm"
                    color="danger"
                    variant="outlined"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                  >
                    Delete
                  </Button>
                )}
              </Box>
              
              <Typography level="h4" sx={{ mb: 1 }}>
                {announcement.title}
              </Typography>
              
              <Typography level="body-md" sx={{ whiteSpace: 'pre-wrap' }}>
                {announcement.content}
              </Typography>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Announcement Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalDialog size="md">
          <ModalClose />
          <Typography level="h4" mb={2}>Create Announcement</Typography>
          
          <form onSubmit={handleSubmit(handleCreateAnnouncement)}>
            <Input
              {...register('title', { required: 'Title is required' })}
              placeholder="Announcement Title"
              sx={{ mb: 2 }}
            />
            {errors.title && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.title.message}
              </Typography>
            )}
            
            <Textarea
              {...register('content', { required: 'Content is required' })}
              placeholder="Announcement content..."
              minRows={4}
              sx={{ mb: 2 }}
            />
            {errors.content && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.content.message}
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
                Create Announcement
              </Button>
            </Box>
          </form>
        </ModalDialog>
      </Modal>
    </Box>
  );
}; 