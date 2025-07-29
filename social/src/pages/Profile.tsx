import { useEffect, useState } from 'react';
import { supabase } from '../supabase-client';
import { Box, Typography, CircularProgress, Alert, Button, Input, Textarea, Switch, Chip, Avatar } from '@mui/joy';
import Autocomplete from '@mui/joy/Autocomplete';
import { useForm, Controller } from 'react-hook-form';
import Fuse from 'fuse.js';

interface Skill {
  id: number;
  name: string;
}

const profileFields = [
  'full_name', 'graduation_year', 'company', 'job_title', 'linkedin_url', 'bio', 'is_mentor'
];

export const Profile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [success, setSuccess] = useState('');
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [fuse, setFuse] = useState<Fuse<Skill> | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const { register, handleSubmit, reset, setValue, control, formState: { errors } } = useForm();

  useEffect(() => {
    const fetchProfileAndSkills = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError('Not logged in.');
        setLoading(false);
        return;
      }
      // Fetch profile
      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }
      setProfile({ ...data, email: user.email });
      Object.entries(data).forEach(([key, value]) => setValue(key, value));
      // Fetch all skills
      const { data: skillsData } = await supabase.from('skills').select('*');
      setAllSkills(skillsData || []);
      setFuse(new Fuse(skillsData || [], { keys: ['name'], threshold: 0.3 }));
      // Fetch user's skills
      const { data: userSkills } = await supabase
        .from('profile_skills')
        .select('skill_id')
        .eq('user_id', user.id);
      
      if (userSkills && userSkills.length > 0) {
        const skillIds = userSkills.map((us: any) => us.skill_id);
        const { data: skillsData } = await supabase
          .from('skills')
          .select('id, name')
          .in('id', skillIds);
        const selected = (skillsData || []).map((skill: any) => ({ id: skill.id, name: skill.name }));
        setSelectedSkills(selected);
      } else {
        setSelectedSkills([]);
      }
      setLoading(false);
    };
    fetchProfileAndSkills();
  }, [setValue]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName);

      // Update profile with new photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, profile_picture_url: publicUrl });
      setSuccess('Profile photo updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const onSubmit = async (formData: any) => {
    setLoading(true);
    setError('');
    setSuccess('');
    if ('email' in formData) delete formData.email; // Remove email if present
    // Update profile fields
    const { error: updateError } = await supabase
      .from('profiles')
      .update(formData)
      .eq('user_id', profile.user_id);
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    // Update profile_skills
    const userId = profile.user_id;
    const skillIds = selectedSkills.map((skill) => skill.id);
    await supabase.from('profile_skills').delete().eq('user_id', userId);
    if (skillIds.length > 0) {
      const inserts = skillIds.map((skill_id: number) => ({ user_id: userId, skill_id }));
      await supabase.from('profile_skills').insert(inserts);
    }
    setSuccess('Profile updated successfully!');
    setProfile({ ...profile, ...formData });
    setEditMode(false);
    setLoading(false);
  };

  if (loading) return <Box sx={{ mt: 8, textAlign: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ mt: 8 }}><Alert color="danger">{error}</Alert></Box>;
  if (!profile) return null;

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto', mt: 8 }}>
      <Typography level="h3" mb={2}>Profile</Typography>
      {success && <Alert color="success" sx={{ mb: 2 }}>{success}</Alert>}
      
      {/* Profile Photo Section */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Avatar 
          src={profile.profile_picture_url} 
          alt={profile.full_name} 
          sx={{ width: 120, height: 120, mx: 'auto', mb: 2 }}
        >
          {profile.full_name[0]}
        </Avatar>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="photo-upload"
          type="file"
          onChange={handlePhotoUpload}
        />
        <label htmlFor="photo-upload">
          <Button
            component="span"
            variant="outlined"
            disabled={uploadingPhoto}
            sx={{ mb: 2 }}
          >
            {uploadingPhoto ? 'Uploading...' : 'Upload Photo'}
          </Button>
        </label>
      </Box>

      {!editMode ? (
        <>
          <Typography><b>Full Name:</b> {profile.full_name}</Typography>
          <Typography><b>Email:</b> {profile.email}</Typography>
          <Typography><b>Role:</b> {profile.role}</Typography>
          <Typography><b>Graduation Year:</b> {profile.graduation_year || '-'}</Typography>
          <Typography><b>Company:</b> {profile.company || '-'}</Typography>
          <Typography><b>Job Title:</b> {profile.job_title || '-'}</Typography>
          <Typography><b>LinkedIn:</b> {profile.linkedin_url ? <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer">{profile.linkedin_url}</a> : '-'}</Typography>
          <Typography><b>Bio:</b> {profile.bio || '-'}</Typography>
          {profile.role === 'alumni' && (
            <Typography><b>Mentor:</b> {profile.is_mentor ? 'Yes' : 'No'}</Typography>
          )}
          <Typography><b>Skills:</b> {selectedSkills.length > 0 ? selectedSkills.map((s, i) => <Chip key={i} sx={{ mr: 0.5 }}>{s.name}</Chip>) : '-'}</Typography>
          <Button sx={{ mt: 2 }} onClick={() => { setEditMode(true); reset(profile); }}>Edit</Button>
        </>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)}>
          <Input {...register('full_name', { required: 'Full name is required' })} placeholder="Full Name" sx={{ mb: 2 }} />
          {errors.full_name && <Typography color="danger">{errors.full_name.message as string}</Typography>}
          <Input {...register('graduation_year')} placeholder="Graduation Year" sx={{ mb: 2 }} type="number" />
          <Input {...register('company')} placeholder="Company" sx={{ mb: 2 }} />
          <Input {...register('job_title')} placeholder="Job Title" sx={{ mb: 2 }} />
          <Input {...register('linkedin_url')} placeholder="LinkedIn URL" sx={{ mb: 2 }} />
          <Textarea {...register('bio')} placeholder="Bio" sx={{ mb: 2 }} minRows={2} />
          {profile.role === 'alumni' && (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Switch {...register('is_mentor')} />
              <Typography sx={{ ml: 1 }}>Available as Mentor</Typography>
            </Box>
          )}
          <Controller
            name="skills"
            control={control}
            render={() => (
              <Autocomplete
                multiple
                options={allSkills}
                getOptionLabel={(option: Skill) => option.name}
                filterOptions={(options, { inputValue }) => {
                  if (!fuse || !inputValue) return options;
                  return fuse.search(inputValue).map((result) => result.item);
                }}
                value={selectedSkills}
                onChange={(_, newValue) => setSelectedSkills(newValue)}
                slotProps={{ input: { placeholder: 'Select skills', sx: { mb: 2 } } }}
              />
            )}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button type="submit" color="primary">Save</Button>
            <Button type="button" color="neutral" onClick={() => { setEditMode(false); reset(profile); }}>Cancel</Button>
          </Box>
        </form>
      )}
    </Box>
  );
}; 