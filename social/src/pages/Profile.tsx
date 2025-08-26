import * as React from 'react';
import { useState, useEffect } from 'react';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import { supabase } from '../supabase-client';
import AspectRatio from '@mui/joy/AspectRatio';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Divider from '@mui/joy/Divider';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import Input from '@mui/joy/Input';
import IconButton from '@mui/joy/IconButton';
import Textarea from '@mui/joy/Textarea';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Card from '@mui/joy/Card';
import CardActions from '@mui/joy/CardActions';
import CardOverflow from '@mui/joy/CardOverflow';
import Avatar from '@mui/joy/Avatar';
import Alert from '@mui/joy/Alert';
import EditRoundedIcon from '@mui/icons-material/EditRounded';
import SaveRoundedIcon from '@mui/icons-material/SaveRounded';
import type { ProfileFormData } from '../types';

interface MessageState {
  type: 'success' | 'error';
  text: string;
}

export const Profile = () => {
  const { user, profile, refreshProfile } = useSimpleAuth();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    full_name: '',
    bio: '',
    location: '',
    company: '',
    job_title: '',
    graduation_year: '',
    major: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        graduation_year: profile.graduation_year?.toString() || '',
        major: profile.major || '',
      });
    }
  }, [profile]);

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    setMessage(null);

    try {
      let error;
      
      if (profile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            bio: formData.bio,
            location: formData.location,
            company: formData.company,
            job_title: formData.job_title,
            graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
            major: formData.major,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);
        error = updateError;
      } else {
        // Create new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            full_name: formData.full_name,
            bio: formData.bio,
            location: formData.location,
            company: formData.company,
            job_title: formData.job_title,
            graduation_year: formData.graduation_year ? parseInt(formData.graduation_year) : null,
            major: formData.major,
            role: 'user', // Default role
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        error = insertError;
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      await refreshProfile();
      setIsEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
        location: profile.location || '',
        company: profile.company || '',
        job_title: profile.job_title || '',
        graduation_year: profile.graduation_year?.toString() || '',
        major: profile.major || '',
      });
    }
    setIsEditing(false);
    setMessage(null);
  };

  if (!profile) {
    return (
      <Box sx={{ flex: 1, width: '100%' }}>
        <Box sx={{ px: { xs: 2, md: 6 } }}>
          <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
            Create Profile
          </Typography>
          <Typography level="body-lg" sx={{ mb: 4, color: 'text.secondary' }}>
            Welcome! Let's set up your profile to get started.
          </Typography>
        </Box>

        <Box sx={{ px: { xs: 2, md: 6 } }}>
          <Card>
            <Box sx={{ mb: 1 }}>
              <Typography level="title-md">Profile Information</Typography>
              <Typography level="body-sm" color="neutral">
                Create your profile information and settings.
              </Typography>
            </Box>
            <Divider />
            <Stack spacing={2} sx={{ my: 1 }}>
              <Stack spacing={2}>
                <FormControl>
                  <FormLabel>Full Name *</FormLabel>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => handleInputChange('full_name', e.target.value)}
                    placeholder="Enter your full name"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Bio</FormLabel>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself"
                    minRows={3}
                    maxRows={5}
                  />
                </FormControl>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Location</FormLabel>
                    <Input
                      value={formData.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      placeholder="City, State"
                    />
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Company</FormLabel>
                    <Input
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Your company"
                    />
                  </FormControl>
                </Stack>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Job Title</FormLabel>
                    <Input
                      value={formData.job_title}
                      onChange={(e) => handleInputChange('job_title', e.target.value)}
                      placeholder="Your job title"
                    />
                  </FormControl>

                  <FormControl sx={{ flex: 1 }}>
                    <FormLabel>Graduation Year</FormLabel>
                    <Input
                      value={formData.graduation_year}
                      onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                      type="number"
                      placeholder="YYYY"
                    />
                  </FormControl>
                </Stack>

                <FormControl>
                  <FormLabel>Major</FormLabel>
                  <Input
                    value={formData.major}
                    onChange={(e) => handleInputChange('major', e.target.value)}
                    placeholder="Your major/field of study"
                  />
                </FormControl>
              </Stack>
            </Stack>
            <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
              <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
                <Button
                  size="sm"
                  color="primary"
                  onClick={handleSave}
                  loading={loading}
                  disabled={!formData.full_name.trim()}
                  startDecorator={<SaveRoundedIcon />}
                >
                  Create Profile
                </Button>
              </CardActions>
            </CardOverflow>
          </Card>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, width: '100%' }}>
      <Box sx={{ px: { xs: 2, md: 6 } }}>
        <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
          My Profile
        </Typography>
      </Box>

      {message && (
        <Box sx={{ px: { xs: 2, md: 6 }, mb: 2 }}>
          <Alert color={message.type === 'error' ? 'danger' : 'success'} variant="soft">
            {message.text}
          </Alert>
        </Box>
      )}

      <Box sx={{ px: { xs: 2, md: 6 } }}>
        <Card>
          <Box sx={{ mb: 1 }}>
            <Typography level="title-md">Profile Information</Typography>
            <Typography level="body-sm" color="neutral">
              Update your profile information and settings.
            </Typography>
          </Box>
          <Divider />
          <Stack spacing={2} sx={{ my: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <AspectRatio
                ratio="1"
                maxHeight={200}
                sx={{ minWidth: 120, borderRadius: '100%' }}
              >
                <Avatar
                  src={profile.profile_picture_url}
                  alt={profile.full_name}
                  sx={{ width: '100%', height: '100%' }}
                />
              </AspectRatio>
              <Box sx={{ flex: 1 }}>
                <Typography level="title-lg">{profile.full_name}</Typography>
                <Typography level="body-sm" color="neutral">
                  {profile.role}
                </Typography>
                <Typography level="body-sm" color="neutral">
                  {user?.email}
                </Typography>
              </Box>
              {!isEditing && (
                <IconButton
                  onClick={() => setIsEditing(true)}
                  variant="outlined"
                  color="primary"
                >
                  <EditRoundedIcon />
                </IconButton>
              )}
            </Box>

            <Stack spacing={2}>
              <FormControl>
                <FormLabel>Full Name</FormLabel>
                <Input
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  disabled={!isEditing}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  minRows={3}
                  maxRows={5}
                />
              </FormControl>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Location</FormLabel>
                  <Input
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Company</FormLabel>
                  <Input
                    value={formData.company}
                    onChange={(e) => handleInputChange('company', e.target.value)}
                    disabled={!isEditing}
                  />
                </FormControl>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Job Title</FormLabel>
                  <Input
                    value={formData.job_title}
                    onChange={(e) => handleInputChange('job_title', e.target.value)}
                    disabled={!isEditing}
                  />
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                  <FormLabel>Graduation Year</FormLabel>
                  <Input
                    value={formData.graduation_year}
                    onChange={(e) => handleInputChange('graduation_year', e.target.value)}
                    disabled={!isEditing}
                    type="number"
                  />
                </FormControl>
              </Stack>

              <FormControl>
                <FormLabel>Major</FormLabel>
                <Input
                  value={formData.major}
                  onChange={(e) => handleInputChange('major', e.target.value)}
                  disabled={!isEditing}
                />
              </FormControl>
            </Stack>
          </Stack>
          <CardOverflow sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            <CardActions sx={{ alignSelf: 'flex-end', pt: 2 }}>
              {isEditing ? (
                <>
                  <Button
                    size="sm"
                    variant="outlined"
                    color="neutral"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    onClick={handleSave}
                    loading={loading}
                    startDecorator={<SaveRoundedIcon />}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  size="sm"
                  color="primary"
                  onClick={() => setIsEditing(true)}
                  startDecorator={<EditRoundedIcon />}
                >
                  Edit Profile
                </Button>
              )}
            </CardActions>
          </CardOverflow>
        </Card>
      </Box>
    </Box>
  );
}; 