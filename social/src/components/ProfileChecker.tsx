import { useState } from 'react';
import { supabase } from '../supabase-client';
import { Button, Typography, Box, Alert } from '@mui/joy';

export const ProfileChecker = () => {
  const [result, setResult] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const checkProfiles = async () => {
    setLoading(true);
    setResult('Checking profiles...');
    
    // User IDs from the logs
    const userIds = [
      '6ef38c52-63a6-49c3-a24e-418d3e75b52b', // sowmithatwork@gmail.com
      '205920d8-70c3-4841-a94c-844fda403a46', // student@college.edu
      '8ad9fa60-cb9b-456c-9233-1cf40bcd240a', // treelonmusk69@gmail.com
      '68bd1e80-5d00-4b7d-b2d5-b758c1ab88f4'  // sowmith1810@gmail.com
    ];

    let output = 'Profile Check Results:\n\n';

    try {
      for (const userId of userIds) {
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId);

        if (error) {
          output += `❌ Error checking ${userId}: ${error.message}\n`;
        } else if (!profiles || profiles.length === 0) {
          output += `⚠️  No profile found for user: ${userId}\n`;
        } else {
          output += `✅ Profile found for ${userId}: Role = ${profiles[0].role}, Name = ${profiles[0].full_name}\n`;
        }
      }

      // Also check total profiles count
      const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (countError) {
        output += `\n❌ Error getting total count: ${countError.message}`;
      } else {
        output += `\nTotal profiles in database: ${count}`;
      }

    } catch (error: any) {
      output += `\n❌ Exception: ${error.message}`;
    }

    setResult(output);
    setLoading(false);
  };

  const createMissingProfiles = async () => {
    setLoading(true);
    setResult('Creating missing profiles...');

    try {
      // Create profiles for users that are missing them
      const profiles = [
        {
          user_id: '6ef38c52-63a6-49c3-a24e-418d3e75b52b',
          full_name: 'Sowmitha Work',
          role: 'student',
          major: 'Computer Science',
          graduation_year: 2025
        },
        {
          user_id: '205920d8-70c3-4841-a94c-844fda403a46',
          full_name: 'Student User',
          role: 'student',
          major: 'Engineering',
          graduation_year: 2025
        },
        {
          user_id: '8ad9fa60-cb9b-456c-9233-1cf40bcd240a',
          full_name: 'Tree Lon Musk',
          role: 'alumni',
          major: 'Business',
          graduation_year: 2020
        },
        {
          user_id: '68bd1e80-5d00-4b7d-b2d5-b758c1ab88f4',
          full_name: 'Sowmith Student',
          role: 'student',
          major: 'Computer Science',
          graduation_year: 2025
        }
      ];

      let output = 'Creating profiles:\n\n';

      for (const profile of profiles) {
        const { error } = await supabase
          .from('profiles')
          .upsert(profile, { onConflict: 'user_id' });

        if (error) {
          output += `❌ Failed to create profile for ${profile.full_name}: ${error.message}\n`;
        } else {
          output += `✅ Created/updated profile for ${profile.full_name} (${profile.role})\n`;
        }
      }

      setResult(output);
    } catch (error: any) {
      setResult(`Exception: ${error.message}`);
    }

    setLoading(false);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, p: 3, border: '1px solid #ccc' }}>
      <Typography level="h3" mb={2}>Profile Checker & Creator</Typography>
      
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Button onClick={checkProfiles} loading={loading}>
          Check Profiles
        </Button>
        <Button onClick={createMissingProfiles} loading={loading} color="success">
          Create Missing Profiles
        </Button>
      </Box>

      {result && (
        <Alert sx={{ mb: 2 }}>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>
            {result}
          </pre>
        </Alert>
      )}
    </Box>
  );
};
