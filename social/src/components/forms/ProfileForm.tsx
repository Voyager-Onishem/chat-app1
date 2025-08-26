import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSimpleAuth } from '../../context/SimpleAuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { profileService } from '../../services/api';
import { supabase } from '../../supabase-client';

import { sanitizeAndValidate, ValidationRules, FileValidation } from '../../utils/validation';
import { getErrorMessage } from '../../utils/errorHandling';
import type { ProfileFormData, UserProfile } from '../../types';
import type { ProfileFormProps } from '../../types/props';
import {
  Box,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Card,
  CardContent,
  Typography,
  Divider,
  Grid,
  Avatar,
  IconButton,
} from '@mui/joy';
import {
  PhotoCamera,
  Save,
  Cancel,
} from '@mui/icons-material';

export const ProfileForm: React.FC<ProfileFormProps> = ({
  profile,
  onSave,
  onCancel,
}) => {
  const { user } = useSimpleAuth();
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError: setFieldError,
    // setValue,
    watch,
  } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
      company: profile?.company || '',
      job_title: profile?.job_title || '',
      graduation_year: profile?.graduation_year?.toString() || '',
      major: profile?.major || '',
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setLoading(true);

    try {
      // Sanitize and validate input
      const { sanitizedData, validation } = sanitizeAndValidate(data, {
        full_name: ValidationRules.fullName,
        bio: ValidationRules.bio,
        location: ValidationRules.location,
        company: ValidationRules.company,
        job_title: ValidationRules.jobTitle,
        graduation_year: ValidationRules.graduationYear,
        major: ValidationRules.major,
      });

      if (!validation.isValid) {
        Object.entries(validation.errors).forEach(([field, message]) => {
          setFieldError(field as any, {
            type: 'manual',
            message,
          });
        });
        setLoading(false);
        return;
      }

      // Prepare update data
      const updateData: Partial<UserProfile> = {
        full_name: sanitizedData.full_name,
        bio: sanitizedData.bio || undefined,
        location: sanitizedData.location || undefined,
        company: sanitizedData.company || undefined,
        job_title: sanitizedData.job_title || undefined,
        major: sanitizedData.major || undefined,
        graduation_year: sanitizedData.graduation_year 
          ? parseInt(sanitizedData.graduation_year, 10) 
          : undefined,
        updated_at: new Date().toISOString(),
      };

      // Update profile
      const updatedProfile = await profileService.updateProfile(user.id, updateData);
      
      success('Profile updated successfully!');
      onSave(updatedProfile);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      notifyError(errorMessage, 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setPhotoUploading(true);

    try {
      // Validate file
      const validation = FileValidation.validateImage(file);
      if (!validation.isValid) {
        notifyError(validation.message!, 'Invalid file');
        return;
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with new photo URL
      const updateData = {
        profile_picture_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      };

      const updatedProfile = await profileService.updateProfile(user.id, updateData);
      
      success('Profile photo updated successfully!');
      onSave(updatedProfile);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      notifyError(errorMessage, 'Failed to upload photo');
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography level="title-lg" sx={{ mb: 3 }}>
          Edit Profile
        </Typography>

        {/* Profile Photo Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
          <Avatar
            src={profile?.profile_picture_url}
            alt={profile?.full_name}
            sx={{ width: 100, height: 100 }}
          >
            {profile?.full_name?.charAt(0)}
          </Avatar>
          <Box>
            <Typography level="body-md" sx={{ mb: 1 }}>
              Profile Photo
            </Typography>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <IconButton
                component="span"
                loading={photoUploading}
                variant="outlined"
              >
                <PhotoCamera />
              </IconButton>
            </label>
            <Typography level="body-xs" color="neutral" sx={{ mt: 1 }}>
              JPG, PNG, GIF up to 5MB
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Basic Information */}
            <Grid xs={12}>
              <Typography level="title-md" sx={{ mb: 2 }}>
                Basic Information
              </Typography>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl error={!!errors.full_name}>
                <FormLabel>Full Name *</FormLabel>
                <Input
                  {...register('full_name')}
                  placeholder="Enter your full name"
                />
                {errors.full_name && (
                  <Typography level="body-xs" color="danger">
                    {errors.full_name.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl error={!!errors.location}>
                <FormLabel>Location</FormLabel>
                <Input
                  {...register('location')}
                  placeholder="City, State/Country"
                />
                {errors.location && (
                  <Typography level="body-xs" color="danger">
                    {errors.location.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid xs={12}>
              <FormControl error={!!errors.bio}>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  {...register('bio')}
                  placeholder="Tell us about yourself..."
                  minRows={3}
                  maxRows={5}
                />
                {errors.bio && (
                  <Typography level="body-xs" color="danger">
                    {errors.bio.message}
                  </Typography>
                )}
                <Typography level="body-xs" color="neutral">
                  {watchedValues.bio?.length || 0}/500 characters
                </Typography>
              </FormControl>
            </Grid>

            {/* Professional Information */}
            <Grid xs={12}>
              <Typography level="title-md" sx={{ mb: 2, mt: 2 }}>
                Professional Information
              </Typography>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl error={!!errors.company}>
                <FormLabel>Company</FormLabel>
                <Input
                  {...register('company')}
                  placeholder="Current or previous company"
                />
                {errors.company && (
                  <Typography level="body-xs" color="danger">
                    {errors.company.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl error={!!errors.job_title}>
                <FormLabel>Job Title</FormLabel>
                <Input
                  {...register('job_title')}
                  placeholder="Your current or previous role"
                />
                {errors.job_title && (
                  <Typography level="body-xs" color="danger">
                    {errors.job_title.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            {/* Educational Information */}
            <Grid xs={12}>
              <Typography level="title-md" sx={{ mb: 2, mt: 2 }}>
                Educational Information
              </Typography>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl error={!!errors.major}>
                <FormLabel>Major/Field of Study</FormLabel>
                <Input
                  {...register('major')}
                  placeholder="Your field of study"
                />
                {errors.major && (
                  <Typography level="body-xs" color="danger">
                    {errors.major.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl error={!!errors.graduation_year}>
                <FormLabel>Graduation Year</FormLabel>
                <Input
                  {...register('graduation_year')}
                  type="number"
                  placeholder="YYYY"
                  slotProps={{
                    input: {
                      min: 1950,
                      max: new Date().getFullYear() + 10,
                    },
                  }}
                />
                {errors.graduation_year && (
                  <Typography level="body-xs" color="danger">
                    {errors.graduation_year.message}
                  </Typography>
                )}
              </FormControl>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading || photoUploading}
            >
              <Cancel sx={{ mr: 1 }} />
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={photoUploading}
            >
              <Save sx={{ mr: 1 }} />
              Save Changes
            </Button>
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};
