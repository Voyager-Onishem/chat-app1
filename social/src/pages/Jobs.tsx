import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { useJobs, useCreateJob } from '../hooks/useApiQueries';
import { Box, Typography, CircularProgress, Alert, Button, Card, Avatar, Input, Textarea, Modal, ModalDialog, ModalClose, Chip } from '@mui/joy';
import { Add as AddIcon, Business as BusinessIcon, LocationOn as LocationIcon } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import type { Job as JobType, UserProfile } from '../types';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url?: string;
  created_at: string;
  posted_by_user_id: string;
  posted_by?: {
    full_name: string;
    profile_picture_url?: string;
    role: string;
  };
}

interface CreateJobForm {
  title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
}

const Jobs = () => {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateJobForm>();

  // Use React Query for jobs
  const { 
    data: jobs = [], 
    isLoading: loading, 
    error,
    refetch 
  } = useJobs();

  // Create job mutation
  const { 
    mutate: createJob, 
    isPending: isCreating, 
    error: createError 
  } = useCreateJob({
    onSuccess: () => {
      setShowCreateModal(false);
      reset();
    }
  });

  // Fetch current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) return;
        
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
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  const canPostJobs = () => {
    return ['alumni', 'admin', 'moderator'].includes(userRole);
  };

  const handleCreateJob = async (formData: CreateJobForm) => {
    if (!currentUser) return;
    
    createJob({
      title: formData.title,
      company: formData.company,
      location: formData.location || '',
      description: formData.description,
      apply_url: formData.apply_url || undefined,
      posted_by_user_id: currentUser.id,
    });
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;
      
      // Refetch jobs to update the list
      refetch();
    } catch (err: any) {
      console.error('Error deleting job:', err);
    }
  };

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.location && job.location.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error.message}</Alert></Box>;

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', mt: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography level="h3">Job Opportunities</Typography>
        {canPostJobs() && (
          <Button
            startDecorator={<AddIcon />}
            onClick={() => setShowCreateModal(true)}
          >
            Post Job
          </Button>
        )}
      </Box>

      {createError && <Alert color="danger" sx={{ mb: 2 }}>{createError.message}</Alert>}

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <Input
          placeholder="Search jobs by title, company, or location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ maxWidth: 400 }}
        />
      </Box>

      {filteredJobs.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography level="body-lg" color="neutral">
            {searchTerm ? 'No jobs match your search.' : 'No job opportunities posted yet.'}
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {filteredJobs.map((job) => (
            <Card key={job.id} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box sx={{ flex: 1 }}>
                  <Typography level="h4" sx={{ mb: 1 }}>
                    {job.title}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BusinessIcon sx={{ fontSize: 16 }} />
                      <Typography level="body-sm">{job.company}</Typography>
                    </Box>
                    {job.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon sx={{ fontSize: 16 }} />
                        <Typography level="body-sm">{job.location}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Chip size="sm" color="primary">
                    {job.posted_by?.role ? job.posted_by.role.charAt(0).toUpperCase() + job.posted_by.role.slice(1) : 'Unknown'}
                  </Chip>
                  {(userRole === 'admin' || (currentUser?.id === job.posted_by_user_id)) && (
                    <Button
                      size="sm"
                      color="danger"
                      variant="outlined"
                      onClick={() => handleDeleteJob(job.id)}
                    >
                      Delete
                    </Button>
                  )}
                </Box>
              </Box>
              
              <Typography level="body-md" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {job.description}
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar
                    src={job.posted_by?.profile_picture_url}
                    alt={job.posted_by?.full_name}
                    sx={{ width: 24, height: 24 }}
                  >
                    {job.posted_by?.full_name[0]}
                  </Avatar>
                  <Typography level="body-sm" color="neutral">
                    Posted by {job.posted_by?.full_name} • {new Date(job.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                
                {job.apply_url && (
                  <Button
                    size="sm"
                    component="a"
                    href={job.apply_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Apply Now
                  </Button>
                )}
              </Box>
            </Card>
          ))}
        </Box>
      )}

      {/* Create Job Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)}>
        <ModalDialog size="md">
          <ModalClose />
          <Typography level="h4" mb={2}>Post Job Opportunity</Typography>
          
          <form onSubmit={handleSubmit(handleCreateJob)}>
            <Input
              {...register('title', { required: 'Job title is required' })}
              placeholder="Job Title"
              sx={{ mb: 2 }}
            />
            {errors.title && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.title.message}
              </Typography>
            )}
            
            <Input
              {...register('company', { required: 'Company name is required' })}
              placeholder="Company Name"
              sx={{ mb: 2 }}
            />
            {errors.company && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.company.message}
              </Typography>
            )}
            
            <Input
              {...register('location')}
              placeholder="Location (optional)"
              sx={{ mb: 2 }}
            />
            
            <Textarea
              {...register('description', { required: 'Job description is required' })}
              placeholder="Job description..."
              minRows={4}
              sx={{ mb: 2 }}
            />
            {errors.description && (
              <Typography color="danger" level="body-sm" sx={{ mb: 1 }}>
                {errors.description.message}
              </Typography>
            )}
            
            <Input
              {...register('apply_url')}
              placeholder="Application URL (optional)"
              sx={{ mb: 2 }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button type="submit" color="primary">
                Post Job
              </Button>
            </Box>
          </form>
        </ModalDialog>
      </Modal>
    </Box>
  );
};

export { Jobs }; 