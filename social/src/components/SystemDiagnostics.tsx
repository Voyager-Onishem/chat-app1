import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  AlertTitle,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Paper,
  Divider
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  BugReport,
  Speed,
  ExpandMore,
  Info
} from '@mui/icons-material';
import {
  runQuickDiagnostics,
  runDiagnostics,
  getTroubleshootingTips,
  DiagnosticResult,
  DiagnosticSuite
} from '../utils/database-troubleshooter';

/**
 * SystemDiagnostics Component
 * Provides a user-friendly interface for running system diagnostics
 * and understanding system status with troubleshooting guidance
 */
const SystemDiagnostics: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticSuite | null>(null);
  const [troubleshootingTips, setTroubleshootingTips] = useState<string[]>([]);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);

  /**
   * Get status icon based on diagnostic result
   */
  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'error':
        return <Error sx={{ color: 'error.main' }} />;
      case 'warning':
        return <Warning sx={{ color: 'warning.main' }} />;
      default:
        return <Info sx={{ color: 'info.main' }} />;
    }
  };

  /**
   * Get status color for chips
   */
  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  /**
   * Run quick diagnostics (essential tests only)
   */
  const handleQuickDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await runQuickDiagnostics();
      setDiagnosticResults(results);
      setTroubleshootingTips(getTroubleshootingTips(results.results));
      setLastRunTime(new Date());
    } catch (error) {
      console.error('Quick diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Run comprehensive diagnostics
   */
  const handleFullDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await runDiagnostics();
      setDiagnosticResults(results);
      setTroubleshootingTips(getTroubleshootingTips(results.results));
      setLastRunTime(new Date());
    } catch (error) {
      console.error('Full diagnostics failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Auto-run quick diagnostics on component mount
   */
  useEffect(() => {
    handleQuickDiagnostics();
  }, []);

  /**
   * Format timestamp for display
   */
  const formatTimestamp = (date: Date) => {
    return date.toLocaleString();
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Diagnostics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor system health and troubleshoot connectivity issues
        </Typography>
      </Box>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          startIcon={isRunning ? <CircularProgress size={20} /> : <Speed />}
          onClick={handleQuickDiagnostics}
          disabled={isRunning}
        >
          Quick Diagnostics
        </Button>
        <Button
          variant="outlined"
          startIcon={isRunning ? <CircularProgress size={20} /> : <BugReport />}
          onClick={handleFullDiagnostics}
          disabled={isRunning}
        >
          Full Diagnostics
        </Button>
        {diagnosticResults && (
          <Button
            variant="text"
            startIcon={<Refresh />}
            onClick={handleQuickDiagnostics}
            disabled={isRunning}
          >
            Refresh
          </Button>
        )}
      </Box>

      {/* Last Run Info */}
      {lastRunTime && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary">
            Last run: {formatTimestamp(lastRunTime)}
          </Typography>
        </Box>
      )}

      {/* Results Summary */}
      {diagnosticResults && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="primary">
                {diagnosticResults.summary.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tests
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="success.main">
                {diagnosticResults.summary.passed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Passed
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="warning.main">
                {diagnosticResults.summary.warnings}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Warnings
              </Typography>
            </Paper>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h6" color="error.main">
                {diagnosticResults.summary.failed}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </Paper>
          </Box>
        </Box>
      )}

      {/* Diagnostic Results */}
      {diagnosticResults && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Diagnostic Results
            </Typography>
            <List>
              {diagnosticResults.results.map((result, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemIcon>
                      {getStatusIcon(result.status)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography variant="subtitle2">
                            {result.test}
                          </Typography>
                          <Chip
                            size="small"
                            label={result.status.toUpperCase()}
                            color={getStatusColor(result.status) as any}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ mt: 0.5 }}>
                            {result.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimestamp(result.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < diagnosticResults.results.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Troubleshooting Tips */}
      {troubleshootingTips.length > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <AlertTitle>Troubleshooting Tips</AlertTitle>
          <List dense>
            {troubleshootingTips.map((tip, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={tip}
                  primaryTypographyProps={{ variant: 'body2' }}
                />
              </ListItem>
            ))}
          </List>
        </Alert>
      )}

      {/* Detailed Results (Expandable) */}
      {diagnosticResults && diagnosticResults.results.some(r => r.details) && (
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="h6">Detailed Results</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <List>
              {diagnosticResults.results
                .filter(result => result.details)
                .map((result, index) => (
                  <ListItem key={index} sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      {getStatusIcon(result.status)}
                      <Typography variant="subtitle2">
                        {result.test}
                      </Typography>
                    </Box>
                    <Box
                      component="pre"
                      sx={{
                        backgroundColor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.75rem',
                        width: '100%'
                      }}
                    >
                      {JSON.stringify(result.details, null, 2)}
                    </Box>
                  </ListItem>
                ))}
            </List>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Help Information */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            About System Diagnostics
          </Typography>
          <Typography variant="body2" paragraph>
            This diagnostic tool helps identify and troubleshoot common issues with your application:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemText
                primary="Database Connection"
                secondary="Tests basic connectivity to the Supabase database"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Authentication"
                secondary="Verifies user session and authentication status"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Row Level Security"
                secondary="Checks if RLS policies are working correctly"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Real-time Connection"
                secondary="Tests WebSocket connectivity for real-time features"
              />
            </ListItem>
            <ListItem>
              <ListItemText
                primary="Table Access"
                secondary="Verifies access to critical database tables"
              />
            </ListItem>
          </List>
          <Typography variant="body2" sx={{ mt: 2, fontStyle: 'italic' }}>
            Run Quick Diagnostics for essential tests, or Full Diagnostics for comprehensive analysis.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SystemDiagnostics;

