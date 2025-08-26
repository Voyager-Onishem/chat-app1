import React from 'react';
import { Box, Typography, Card, CardContent, Button, Chip, Stack } from '@mui/joy';
import { useSimpleAuth } from '../context/SimpleAuthContext';
import useAuthDebug from '../hooks/useAuthDebug';
import { RefreshRounded, BugReportRounded } from '@mui/icons-material';

/**
 * Component for debugging authentication and session issues
 * Especially useful for testing window focus problems
 */
export function AuthDebugPanel() {
  const { user, profile, session, loading } = useSimpleAuth();
  const { debugInfo, refreshAuth } = useAuthDebug();

  const handleRefreshAuth = () => {
    refreshAuth();
  };

  const handleTestWindowFocus = () => {
    console.log('Testing window focus behavior...');
    console.log('1. Current user:', user?.id);
    console.log('2. Current profile:', profile?.full_name);
    console.log('3. Page visibility:', document.visibilityState);
    console.log('4. Document hidden:', document.hidden);
    
    // Simulate window blur and focus
    const event = new Event('visibilitychange');
    document.dispatchEvent(event);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography level="h2" sx={{ mb: 3 }}>
        Authentication Debug Panel
      </Typography>
      
      {/* Auth Context Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>
            Auth Context Status
          </Typography>
          <Stack spacing={1}>
            <Typography level="body-sm">
              <strong>Loading:</strong> <Chip color={loading ? 'warning' : 'success'}>{loading ? 'True' : 'False'}</Chip>
            </Typography>
            <Typography level="body-sm">
              <strong>User ID:</strong> {user?.id || 'Not logged in'}
            </Typography>
            <Typography level="body-sm">
              <strong>User Email:</strong> {user?.email || 'N/A'}
            </Typography>
            <Typography level="body-sm">
              <strong>Profile Name:</strong> {profile?.full_name || 'N/A'}
            </Typography>
            <Typography level="body-sm">
              <strong>User Role:</strong> {profile?.role || 'N/A'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Session Debug Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>
            Session Debug Info
          </Typography>
          <Stack spacing={1}>
            <Typography level="body-sm">
              <strong>Session Valid:</strong> <Chip color={debugInfo.sessionValid ? 'success' : 'danger'}>
                {debugInfo.sessionValid ? 'Yes' : 'No'}
              </Chip>
            </Typography>
            <Typography level="body-sm">
              <strong>Last Checked:</strong> {debugInfo.lastChecked || 'Never'}
            </Typography>
            {debugInfo.sessionData && (
              <>
                <Typography level="body-sm">
                  <strong>Session User ID:</strong> {debugInfo.sessionData.user_id}
                </Typography>
                <Typography level="body-sm">
                  <strong>Session Email:</strong> {debugInfo.sessionData.email}
                </Typography>
                <Typography level="body-sm">
                  <strong>Access Token:</strong> <Chip color="primary">{debugInfo.sessionData.access_token}</Chip>
                </Typography>
                <Typography level="body-sm">
                  <strong>Expires At:</strong> {debugInfo.sessionData.expires_at ? new Date(debugInfo.sessionData.expires_at * 1000).toLocaleString() : 'N/A'}
                </Typography>
              </>
            )}
            {debugInfo.errors.length > 0 && (
              <Box>
                <Typography level="body-sm" color="danger">
                  <strong>Errors:</strong>
                </Typography>
                {debugInfo.errors.map((error, index) => (
                  <Typography key={index} level="body-xs" color="danger" sx={{ ml: 2 }}>
                    • {error}
                  </Typography>
                ))}
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Local Storage Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>
            Local Storage Info
          </Typography>
          <Stack spacing={1}>
            <Typography level="body-sm">
              <strong>Supabase Session:</strong> <Chip color={session ? 'success' : 'neutral'}>
                {session ? 'Active' : 'None'}
              </Chip>
            </Typography>
            <Typography level="body-sm">
              <strong>Profile Data:</strong> <Chip color={profile ? 'success' : 'neutral'}>
                {profile ? 'Loaded' : 'Missing'}
              </Chip>
            </Typography>
            <Typography level="body-sm">
              <strong>Session Expires:</strong> {session?.expires_at ? 
                new Date(session.expires_at * 1000).toLocaleString() : 'N/A'}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Page Status */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>
            Page Status
          </Typography>
          <Stack spacing={1}>
            <Typography level="body-sm">
              <strong>Visibility State:</strong> <Chip color={document.visibilityState === 'visible' ? 'success' : 'warning'}>
                {document.visibilityState}
              </Chip>
            </Typography>
            <Typography level="body-sm">
              <strong>Document Hidden:</strong> <Chip color={document.hidden ? 'warning' : 'success'}>
                {document.hidden ? 'Yes' : 'No'}
              </Chip>
            </Typography>
            <Typography level="body-sm">
              <strong>Window Focus:</strong> <Chip color={document.hasFocus() ? 'success' : 'warning'}>
                {document.hasFocus() ? 'Focused' : 'Not Focused'}
              </Chip>
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>
            Debug Actions
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button
              startDecorator={<RefreshRounded />}
              onClick={handleRefreshAuth}
              variant="outlined"
            >
              Refresh Auth
            </Button>
            <Button
              startDecorator={<BugReportRounded />}
              onClick={handleTestWindowFocus}
              variant="outlined"
              color="neutral"
            >
              Test Window Focus
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography level="h4" sx={{ mb: 2 }}>
            Testing Instructions
          </Typography>
          <Stack spacing={1}>
            <Typography level="body-sm">
              1. <strong>Minimize/Maximize Test:</strong> Minimize the browser window, wait 10 seconds, then restore it.
            </Typography>
            <Typography level="body-sm">
              2. <strong>Tab Switch Test:</strong> Switch to another tab, wait 10 seconds, then switch back.
            </Typography>
            <Typography level="body-sm">
              3. <strong>Alt-Tab Test:</strong> Alt-Tab to another application, wait 10 seconds, then Alt-Tab back.
            </Typography>
            <Typography level="body-sm">
              4. <strong>Check Console:</strong> Open Developer Tools and monitor console logs for auth debug messages.
            </Typography>
            <Typography level="body-sm">
              5. <strong>Check Data Loading:</strong> Navigate to Directory or Messages and see if data refreshes on focus.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}

export default AuthDebugPanel;
