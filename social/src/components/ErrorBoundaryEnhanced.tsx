import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Stack, Alert } from '@mui/joy';
import { RefreshRounded, BugReportRounded } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundaryEnhanced extends Component<Props, State> {
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

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // You could also send error to logging service here
    // logErrorToService(error, errorInfo);
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

      // Default error UI
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
            sx={{ maxWidth: 500, mb: 3 }}
          >
            <Stack spacing={2}>
              <Typography level="title-md">Something went wrong</Typography>
              <Typography level="body-sm">
                An unexpected error occurred. This has been logged and our team will investigate.
              </Typography>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box sx={{ mt: 2 }}>
                  <Typography level="body-xs" sx={{ fontFamily: 'monospace', wordBreak: 'break-word' }}>
                    {this.state.error.toString()}
                  </Typography>
                  {this.state.errorInfo && (
                    <Typography level="body-xs" sx={{ fontFamily: 'monospace', wordBreak: 'break-word', mt: 1 }}>
                      {this.state.errorInfo.componentStack}
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
