import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { profileService, connectionService } from '../services/api';
import { useQuery, useMutation } from '../hooks/useQuery';
import { mockProfiles } from '../utils/mockData';
import { ProfileCardSkeleton } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../utils/errorHandling';
import type { UserProfile } from '../types';
import {
  Autocomplete,
  Avatar,
  Box,
  Chip,
  Typography,
  Button,
  Stack,
  Divider,
  RadioGroup,
  Radio,
  Slider,
  Card,
  CardContent,
  Grid,
  Input,
  Alert,
} from '@mui/joy';
import {
  SearchRounded as SearchIcon,
  FilterListRounded as FilterIcon,
  LocationOnRounded as LocationIcon,
  WorkRounded as WorkIcon,
  SchoolRounded as SchoolIcon,
  ConnectWithoutContactRounded as ConnectIcon,
} from '@mui/icons-material';

export const Directory: React.FC = () => {
  const { user } = useAuth();
  const [filteredProfiles, setFilteredProfiles] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<string>('all');
  const [graduationYearRange, setGraduationYearRange] = useState<[number, number]>([1990, 2024]);
  const [locations, setLocations] = useState<string[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);

  // Fetch profiles with error handling and fallback
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
      refetchOnWindowFocus: true,
    }
  );

  // Connection request mutation
  const {
    mutate: sendConnectionRequest,
    loading: connectionLoading,
    error: connectionError,
  } = useMutation(
    ({ addresseeId }: { addresseeId: string }) =>
      connectionService.sendConnectionRequest(user!.id, addresseeId),
    {
      onSuccess: () => {
        console.log('Connection request sent successfully');
      },
      onError: (error) => {
        console.error('Failed to send connection request:', error);
      },
    }
  );

  // Extract filter options when profiles data changes
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
    
    let filtered = profiles;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(profile =>
        profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.major?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by role
    if (selectedRole !== 'all') {
      filtered = filtered.filter(profile => profile.role === selectedRole);
    }

    // Filter by location
    if (selectedLocation !== 'all') {
      filtered = filtered.filter(profile => profile.location === selectedLocation);
    }

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(profile => profile.company === selectedCompany);
    }

    // Filter by graduation year range
    filtered = filtered.filter(profile => {
      if (!profile.graduation_year) return true;
      return profile.graduation_year >= graduationYearRange[0] && 
             profile.graduation_year <= graduationYearRange[1];
    });

    // Exclude current user
    if (user) {
      filtered = filtered.filter(profile => profile.user_id !== user.id);
    }

    setFilteredProfiles(filtered);
  }, [profiles, searchQuery, selectedRole, selectedLocation, selectedCompany, graduationYearRange, user]);

  const handleConnect = useCallback((addresseeId: string) => {
    if (!user) return;
    sendConnectionRequest({ addresseeId });
  }, [user, sendConnectionRequest]);

  const ProfileCard: React.FC<{ profile: UserProfile }> = React.memo(({ profile }) => (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Avatar
            src={profile.profile_picture_url}
            alt={profile.full_name}
            sx={{ width: 60, height: 60 }}
          >
            {profile.full_name[0]}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography level="title-md" sx={{ mb: 0.5 }}>
              {profile.full_name}
            </Typography>
            <Chip size="sm" color="primary" variant="soft">
              {profile.role}
            </Chip>
          </Box>
        </Box>

        {profile.bio && (
          <Typography level="body-sm" sx={{ mb: 2, color: 'text.secondary' }}>
            {profile.bio}
          </Typography>
        )}

        <Stack spacing={1} sx={{ mb: 2 }}>
          {(profile.job_title || profile.company) && (
            <Stack direction="row" spacing={1} alignItems="center">
              <WorkIcon fontSize="small" />
              <Typography level="body-sm">
                {profile.job_title} at {profile.company}
              </Typography>
            </Stack>
          )}
          {profile.location && (
            <Stack direction="row" spacing={1} alignItems="center">
              <LocationIcon fontSize="small" />
              <Typography level="body-sm">{profile.location}</Typography>
            </Stack>
          )}
          {profile.graduation_year && (
            <Stack direction="row" spacing={1} alignItems="center">
              <SchoolIcon fontSize="small" />
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
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
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
            </Box>
          </Box>
        )}

        <Button
          startDecorator={<ConnectIcon />}
          onClick={() => handleConnect(profile.user_id)}
          loading={connectionLoading}
          disabled={!user}
          fullWidth
        >
          Connect
        </Button>
      </CardContent>
    </Card>
  ));

  if (loading) {
    return (
      <Box sx={{ flex: 1, width: '100%' }}>
        <Box sx={{ px: { xs: 2, md: 6 }, mb: 4 }}>
          <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
            Alumni Directory
          </Typography>
        </Box>
        <Box sx={{ px: { xs: 2, md: 6 } }}>
          <ProfileCardSkeleton count={6} />
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, width: '100%' }}>
      <Box sx={{ px: { xs: 2, md: 6 } }}>
        <Typography level="h2" component="h1" sx={{ mt: 1, mb: 2 }}>
          Alumni Directory
        </Typography>
        <Typography level="body-lg" sx={{ mb: 4, color: 'text.secondary' }}>
          Connect with fellow alumni and expand your professional network.
        </Typography>

        {fromFallback && (
          <Alert color="warning" sx={{ mb: 3 }}>
            Using sample data. Please check your internet connection and try refreshing.
            <Button variant="plain" size="sm" onClick={refetch} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

        {error && (
          <Alert color="danger" sx={{ mb: 3 }}>
            {getErrorMessage(error)}
            <Button variant="plain" size="sm" onClick={refetch} sx={{ ml: 2 }}>
              Retry
            </Button>
          </Alert>
        )}

        {connectionError && (
          <Alert color="danger" sx={{ mb: 3 }}>
            Failed to send connection request: {getErrorMessage(connectionError)}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Filters Sidebar */}
          <Grid xs={12} md={3}>
            <Card sx={{ position: 'sticky', top: 20 }}>
              <Box sx={{ p: 2 }}>
                <Typography level="title-md" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FilterIcon sx={{ mr: 1 }} />
                  Filters
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <Stack spacing={3} sx={{ px: 2, pb: 2 }}>
                {/* Search */}
                <Box>
                  <Typography level="body-sm" sx={{ mb: 1 }}>
                    Search
                  </Typography>
                  <Input
                    placeholder="Search alumni..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    startDecorator={<SearchIcon />}
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
                    valueLabelDisplay="auto"
                    min={1990}
                    max={2030}
                    marks={[
                      { value: 1990, label: '1990' },
                      { value: 2030, label: '2030' },
                    ]}
                  />
                </Box>
              </Stack>
            </Card>
          </Grid>

          {/* Results */}
          <Grid xs={12} md={9}>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography level="body-md">
                {filteredProfiles.length} {filteredProfiles.length === 1 ? 'profile' : 'profiles'} found
              </Typography>
            </Box>

            {filteredProfiles.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography level="body-lg" color="neutral">
                  No profiles match your search criteria.
                </Typography>
                <Typography level="body-sm" color="neutral" sx={{ mt: 1 }}>
                  Try adjusting your filters or search terms.
                </Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
                {filteredProfiles.map((profile) => (
                  <ProfileCard key={profile.user_id} profile={profile} />
                ))}
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};
