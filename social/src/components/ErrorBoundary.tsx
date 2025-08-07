import React from 'react';
import { Box, Typography, Button, Alert } from '@mui/joy';
import { Refresh, Home } from '@mui/icons-material';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error info
    this.setState({
      error,
      errorInfo
    });

    // If it's an auth-related error, clear auth state and redirect
    if (error.message.includes('useAuth must be used within an AuthProvider')) {
      console.log('Auth error detected, attempting cleanup...');
      
      // Clear any auth-related storage
      try {
        localStorage.removeItem('sb-efirzqcqkwdexhfeidkb-auth-token');
        localStorage.removeItem('alumni_network_session');
        localStorage.removeItem('alumni_network_profile');
        
        // Redirect to login after a short delay
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } catch (cleanupError) {
        console.error('Error during auth cleanup:', cleanupError);
      }
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // If a custom fallback is provided, use it
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
            textAlign: 'center'
          }}
        >
          <Alert
            variant="soft"
            color="danger"
            sx={{ mb: 3, maxWidth: 600 }}
          >
            <Typography level="h4" sx={{ mb: 1 }}>
              Oops! Something went wrong
            </Typography>
            <Typography level="body-md" sx={{ mb: 2 }}>
              {this.state.error?.message.includes('useAuth') 
                ? 'Authentication error detected. Redirecting to login...'
                : 'An unexpected error occurred. Please try refreshing the page.'
              }
            </Typography>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box sx={{ mt: 2, textAlign: 'left' }}>
                <Typography level="body-sm" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {this.state.error.message}
                </Typography>
              </Box>
            )}
          </Alert>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startDecorator={<Refresh />}
              onClick={this.resetError}
            >
              Try Again
            </Button>
            <Button
              variant="solid"
              startDecorator={<Home />}
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </Button>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;