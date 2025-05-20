/**
 * Error Fallback Component
 * 
 * Provides graceful error handling for React Error Boundaries:
 * - User-friendly error display
 * - Error reporting functionality
 * - Recovery action options
 * - Accessibility compliance
 */

import React from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Alert,
  Collapse,
  useTheme,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface ErrorFallbackProps {
  error: Error;
  errorInfo?: any;
  resetError?: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  resetError,
}) => {
  const theme = useTheme();
  const [showDetails, setShowDetails] = React.useState(false);

  const handleReset = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  const handleReportError = () => {
    // In production, this would send error to monitoring service
    // Example: Send to error reporting service
    // errorReportingService.captureException(error, {
    //   extra: errorInfo,
    //   tags: { component: 'ErrorFallback' }
    // });
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Box
      role="alert"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        padding: 3,
        bgcolor: 'background.default',
      }}
    >
      <Card
        sx={{
          maxWidth: 600,
          width: '100%',
          textAlign: 'center',
          boxShadow: 3,
        } as any}
      >
        <CardContent sx={{ p: 4 }}>
          {/* Error Icon */}
          <Box sx={{ mb: 3 }}>
            <ErrorIcon
              sx={{
                fontSize: 64,
                color: theme.palette.error.main,
                opacity: 0.8,
              }}
            />
          </Box>

          {/* Error Title */}
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              fontWeight: 600,
              color: theme.palette.error.main,
              mb: 2,
            }}
          >
            Oops! Something went wrong
          </Typography>

          {/* Error Description */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            We encountered an unexpected error. Don't worry, our team has been notified
            and we're working to fix this issue.
          </Typography>

          {/* Action Buttons */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' } as any,
              gap: 2,
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              size="large"
              sx={{ minWidth: 140 }}
            >
              Try Again
            </Button>

            <Button
              variant="outlined"
              startIcon={<BugReportIcon />}
              onClick={handleReportError}
              size="large"
              sx={{ minWidth: 140 }}
            >
              Report Issue
            </Button>
          </Box>

          {/* Toggle Details Button */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Button
              onClick={toggleDetails}
              endIcon={
                <ExpandMoreIcon
                  sx={{
                    transform: showDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: theme.transitions.create('transform'),
                  }}
                />
              }
              sx={{ textTransform: 'none' }}
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
          </Box>

          {/* Error Details */}
          <Collapse in={showDetails}>
            <Alert severity="error" sx={{ textAlign: 'left', mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Error Message:
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  wordBreak: 'break-word',
                  mb: 2,
                }}
              >
                {error.message}
              </Typography>

              {error.stack && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                    Stack Trace:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[100],
                      border: `1px solid ${theme.palette.grey[300]}`,
                      borderRadius: 1,
                      p: 1,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                      }}
                    >
                      {error.stack}
                    </Typography>
                  </Box>
                </>
              )}

              {errorInfo && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, mt: 2 }}>
                    Component Stack:
                  </Typography>
                  <Box
                    sx={{
                      backgroundColor: theme.palette.grey[100],
                      border: `1px solid ${theme.palette.grey[300]}`,
                      borderRadius: 1,
                      p: 1,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    <Typography
                      variant="caption"
                      component="pre"
                      sx={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        margin: 0,
                      }}
                    >
                      {errorInfo.componentStack}
                    </Typography>
                  </Box>
                </>
              )}
            </Alert>
          </Collapse>

          {/* Help Text */}
          <Typography variant="caption" color="text.secondary">
            If this problem persists, please contact our support team with the error details above.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ErrorFallback;
