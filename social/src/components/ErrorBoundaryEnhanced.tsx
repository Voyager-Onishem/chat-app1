import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Stack, Alert } from '@mui/joy';
import { RefreshRounded, BugReportRounded } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Enhanced error logging
    console.group('🚨 ErrorBoundary caught an error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you'd send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys } = this.props;
    const { hasError } = this.state;
    
    // Reset error boundary when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Enhanced default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            p: 4,
          }}
        >
          <Alert
            variant="outlined"
            color="danger"
            startDecorator={<BugReportRounded />}
            sx={{ maxWidth: 600, mb: 3 }}
          >
            <Stack spacing={2}>
              <Typography level="title-md">Something went wrong</Typography>
              <Typography level="body-sm">
                An unexpected error occurred. You can try refreshing the page or contact support if the problem persists.
              </Typography>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'neutral.50', borderRadius: 'sm' }}>
                  <Typography level="body-xs" sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                    <strong>Error:</strong> {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography level="body-xs" sx={{ fontFamily: 'monospace', wordBreak: 'break-word', mt: 1 }}>
                      <strong>Component Stack:</strong> {this.state.errorInfo.componentStack}
                    </Typography>
                  )}
                </Box>
              )}
              
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="neutral"
                  startDecorator={<RefreshRounded />}
                  onClick={this.handleRetry}
                >
                  Try Again
                </Button>
                <Button
                  variant="solid"
                  color="primary"
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>
              </Stack>
            </Stack>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}

// HOC wrapper for easier usage
export const withErrorBoundary = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) => {
  const ComponentWithErrorBoundary = (props: P) => (
    <ErrorBoundaryEnhanced fallback={fallback} onError={onError}>
      <WrappedComponent {...props} />
    </ErrorBoundaryEnhanced>
  );

  ComponentWithErrorBoundary.displayName = `withErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`;

  return ComponentWithErrorBoundary;
};

export default ErrorBoundaryEnhanced;
