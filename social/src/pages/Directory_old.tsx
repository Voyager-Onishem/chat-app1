import * as React from 'react';
import { useState, useEffec  // Extract filter options when profiles data changes
  useEffect(() => {
    if (profiles) {
      setFilteredProfiles(profiles);
      
      // Extract unique locations and companies for filters
      const uniqueLocations = [...new Set(profiles.map(p => p.location).filter(Boolean))] as string[];
      const uniqueCompanies = [...new Set(profiles.map(p => p.company).filter(Boolean))] as string[];
      setLocations(uniqueLocations);
      setCompanies(uniqueCompanies);
    }
  }, [profiles]);

  // Filter profiles based on search and filter criteria
  useEffect(() => {
    if (!profiles) return;
    
    let filtered = profiles;k } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService } from '../services/api';
import { useQuery } from '../hooks/useQuery';
import { mockProfiles } from '../utils/mockData';
import { LoadingSpinner, ProfileCardSkeleton } from '../components/common/LoadingSpinner';
import type { UserProfile } from '../types';
import Autocomplete from '@mui/joy/Autocomplete';
import Avatar from '@mui/joy/Avatar';
import Box from '@mui/joy/Box';
import Chip from '@mui/joy/Chip';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Divider from '@mui/joy/Divider';
import RadioGroup from '@mui/joy/RadioGroup';
import Radio from '@mui/joy/Radio';
import Slider from '@mui/joy/Slider';
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import Grid from '@mui/joy/Grid';
import Input from '@mui/joy/Input';
import Alert from '@mui/joy/Alert';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import FilterListRoundedIcon from '@mui/icons-material/FilterListRounded';
import LocationOnRoundedIcon from '@mui/icons-material/LocationOnRounded';
import WorkRoundedIcon from '@mui/icons-material/WorkRounded';
import SchoolRoundedIcon from '@mui/icons-material/SchoolRounded';
import ConnectWithoutContactRoundedIcon from '@mui/icons-material/ConnectWithoutContactRounded';

export const Directory = () => {
  const { user } = useAuth();
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [graduationYearRange, setGraduationYearRange] = useState<[number, number]>([1990, 2024]);
  const [locations, setLocations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  // Use the new query hook for data fetching
  const {
    data: profiles,
    loading,
    error,
    refetch,
    fromFallback
  } = useQuery<UserProfile[]>(
    'profiles',
    () => profileService.getProfiles(),
    {
      fallbackData: mockProfiles,
      enabled: true,
      retry: 3,
      timeout: 15000,
    }
  );
      const uniqueCompanies = [...new Set(profilesData.map((p: any) => p.company).filter(Boolean))] as string[];
      setLocations(uniqueLocations);
      setCompanies(uniqueCompanies);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      console.log('Using mock data as fallback');
      setProfiles(mockProfiles);
      setFilteredProfiles(mockProfiles);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const applyFilters = useCallback(() => {
    let filtered = profiles;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.major?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(profile => profile.role === selectedRole);
    }

    // Location filter
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(profile => profile.location === selectedLocation);
    }

    // Company filter
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(profile => profile.company === selectedCompany);
    }

    // Graduation year range filter
    filtered = filtered.filter(profile => {
      if (!profile.graduation_year) return true;
      return profile.graduation_year >= graduationYearRange[0] && 
             profile.graduation_year <= graduationYearRange[1];
    });

    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, selectedRole, selectedLocation, selectedCompany, graduationYearRange]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleConnect = async (profileId: string) => {
    if (!user) return;

    try {
      // Check if connection already exists
      const { data: existingConnection } = await supabase
        .from('connections')
        .select('*')
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${user.id})`)
        .single();

      if (existingConnection) {
        alert('Connection request already exists!');
        return;
      }

      // Create connection request
      const { data: connection, error: connectionError } = await supabase
        .from('connections')
        .insert({
          requester_id: user.id,
          addressee_id: profileId,
          status: 'pending',
        })
        .select()
        .single();

      if (connectionError) {
        console.error('Error sending connection request:', connectionError);
        alert('Failed to send connection request. Please try again.');
        return;
      }

      // Get requester profile for notification
      const { data: requesterProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', user.id)
        .single();

      // Create notification for the recipient
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: profileId,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${requesterProfile?.full_name || 'Someone'} wants to connect with you`,
          data: {
            connection_id: connection.id,
            requester_id: user.id,
            recipient_id: profileId,
            requester_name: requesterProfile?.full_name || 'Unknown User'
          },
          read: false,
        });

      if (notificationError) {
        console.error('Error creating notification:', notificationError);
      }

      // Update the profiles to show connection status
      setProfiles(prev => prev.map(p => 
        p.user_id === profileId ? { ...p, connectionStatus: 'pending' } : p
      ));

      // Show success message
      alert('Connection request sent successfully!');
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  const ProfileCard = ({ profile }: { profile: Profile }) => (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Avatar
            src={profile.profile_picture_url}
            alt={profile.full_name}
            size="lg"
          />
          <Box sx={{ flex: 1 }}>
            <Typography level="title-lg">{profile.full_name}</Typography>
            <Typography level="body-sm" color="neutral">
              {profile.role}
            </Typography>
          </Box>
          <Chip
            size="sm"
            variant="soft"
            color={
              profile.role === 'admin' ? 'danger' :
              profile.role === 'alumni' ? 'success' :
              profile.role === 'student' ? 'primary' : 'neutral'
            }
          >
            {profile.role}
          </Chip>
        </Stack>

        {profile.bio && (
          <Typography level="body-sm" sx={{ mb: 2 }}>
            {profile.bio}
          </Typography>
        )}

        <Stack spacing={1} sx={{ mb: 2 }}>
          {profile.company && (
            <Stack direction="row" spacing={1} alignItems="center">
              <WorkRoundedIcon fontSize="small" />
              <Typography level="body-sm">
                {profile.job_title} at {profile.company}
              </Typography>
            </Stack>
          )}
          {profile.location && (
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationOnRoundedIcon fontSize="small" />
              <Typography level="body-sm">{profile.location}</Typography>
            </Stack>
          )}
          {profile.graduation_year && (
            <Stack direction="row" spacing={1} alignItems="center">
              <SchoolRoundedIcon fontSize="small" />
              <Typography level="body-sm">
                Class of {profile.graduation_year}
                {profile.major && ` - ${profile.major}`}
              </Typography>
            </Stack>
          )}
        </Stack>

        {profile.skills && profile.skills.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography level="body-sm" sx={{ mb: 1 }}>
              Skills:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {profile.skills.slice(0, 3).map((skill, index) => (
                <Chip key={index} size="sm" variant="outlined">
                  {skill}
                </Chip>
              ))}
              {profile.skills.length > 3 && (
                <Chip size="sm" variant="outlined">
                  +{profile.skills.length - 3} more
                </Chip>
              )}
            </Stack>
          </Box>
        )}

        {user && user.id !== profile.user_id && (
          <Button
            size="sm"
            variant="outlined"
            startDecorator={<ConnectWithoutContactRoundedIcon />}
            onClick={() => handleConnect(profile.user_id)}
            fullWidth
            sx={{
              mt: 2,
              minHeight: { xs: '40px', sm: '32px' },
              fontSize: { xs: '0.875rem', sm: '0.75rem' }
            }}
          >
            Connect
          </Button>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography>Loading directory...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, width: '100%' }}>
      <Box sx={{ px: { xs: 2, md: 6 } }}>
        <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
          Alumni Directory
        </Typography>
        <Typography level="body-sm" color="neutral" sx={{ mb: 3 }}>
          Connect with fellow alumni and discover professional opportunities.
        </Typography>
      </Box>

      <Box sx={{ px: { xs: 2, md: 6 } }}>
        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid xs={12} md={3}>
            <Card>
              <Box sx={{ mb: 2 }}>
                <Typography level="title-md">
                  <FilterListRoundedIcon sx={{ mr: 1 }} />
                  Filters
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={3}>
                {/* Search */}
                <Box>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Search
                  </Typography>
                  <Input
                    placeholder="Search alumni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startDecorator={<SearchRoundedIcon />}
                  />
                </Box>

                {/* Role Filter */}
                <Box>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Role
                  </Typography>
                  <RadioGroup
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                  >
                    <Radio value="all" label="All" />
                    <Radio value="alumni" label="Alumni" />
                    <Radio value="student" label="Student" />
                    <Radio value="admin" label="Admin" />
                  </RadioGroup>
                </Box>

                {/* Location Filter */}
                <Box>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Location
                  </Typography>
                  <Autocomplete
                    options={['all', ...locations]}
                    value={selectedLocation}
                    onChange={(_, value) => setSelectedLocation(value || 'all')}
                    placeholder="Select location"
                  />
                </Box>

                {/* Company Filter */}
                <Box>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Company
                  </Typography>
                  <Autocomplete
                    options={['all', ...companies]}
                    value={selectedCompany}
                    onChange={(_, value) => setSelectedCompany(value || 'all')}
                    placeholder="Select company"
                  />
                </Box>

                {/* Graduation Year Range */}
                <Box>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Graduation Year: {graduationYearRange[0]} - {graduationYearRange[1]}
                  </Typography>
                  <Slider
                    value={graduationYearRange}
                    onChange={(_, value) => setGraduationYearRange(value as [number, number])}
                    min={1990}
                    max={2024}
                    step={1}
                    valueLabelDisplay="auto"
                  />
                </Box>
              </Stack>
            </Card>
          </Grid>

          {/* Profiles Grid */}
          <Grid xs={12} md={9}>
            <Box sx={{ mb: 2 }}>
              <Typography level="title-md">
                {filteredProfiles.length} alumni found
              </Typography>
            </Box>
            <Grid container spacing={2}>
              {filteredProfiles.map((profile) => (
                <Grid xs={12} sm={6} lg={4} key={profile.user_id}>
                  <ProfileCard profile={profile} />
                </Grid>
              ))}
            </Grid>
            {filteredProfiles.length === 0 && (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Typography level="body-sm" color="neutral">
                  No alumni found matching your criteria.
                </Typography>
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}; 