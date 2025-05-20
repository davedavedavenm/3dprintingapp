/**
 * Upload Progress Component
 * 
 * Provides real-time upload progress visualization with:
 * - Individual file progress tracking
 * - Overall upload queue progress
 * - File metadata display
 * - Cancellation capability
 * - Error state handling
 * - Responsive design for mobile compatibility
 */

import React, { useMemo } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  Chip,
  Tooltip,
  Stack,
  Divider,
  Collapse,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Cancel as CancelIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Description as FileIcon,
  Upload as UploadIcon,
  Refresh as RetryIcon,
  ExpandMore as ExpandIcon,
  ExpandLess as CollapseIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  removeFile,
  setUploadStatus,
  selectAllUploads,
  selectUploadProgress,
  selectIsUploading,
  UploadItem,
} from '../../store/slices/uploadSlice';

// Component props interface
interface UploadProgressProps {
  /** Show detailed progress for individual files */
  showDetails?: boolean;
  /** Show overall progress summary */
  showSummary?: boolean;
  /** Compact mode for limited space */
  compact?: boolean;
  /** Custom styling */
  sx?: any;
  /** Callback when upload is cancelled */
  onCancel?: (fileId: string) => void;
  /** Callback when retry is requested */
  onRetry?: (fileId: string) => void;
}

/**
 * Upload Progress Component
 * 
 * Implements comprehensive upload progress visualization
 * with real-time updates and user interaction capabilities.
 */
export const UploadProgress: React.FC<UploadProgressProps> = ({
  showDetails = true,
  showSummary = true,
  compact = false,
  sx = {},
  onCancel,
  onRetry,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state selectors
  const uploadItems = useAppSelector(selectAllUploads);
  const totalProgress = useAppSelector(selectUploadProgress);
  const isUploading = useAppSelector(selectIsUploading);

  // Computed values
  const uploadStats = useMemo(() => {
    const completed = uploadItems.filter(item => item.status === 'completed').length;
    const failed = uploadItems.filter(item => item.status === 'failed').length;
    const uploading = uploadItems.filter(item => item.status === 'uploading').length;
    const pending = uploadItems.filter(item => item.status === 'pending').length;
    
    return {
      total: uploadItems.length,
      completed,
      failed,
      uploading,
      pending,
      inProgress: uploading + pending,
    };
  }, [uploadItems]);

  // Handle file cancellation
  const handleCancel = (fileId: string) => {
    dispatch(removeFile(fileId));
    onCancel?.(fileId);
  };

  // Handle retry request
  const handleRetry = (fileId: string) => {
    dispatch(setUploadStatus({ id: fileId, status: 'pending' }));
    onRetry?.(fileId);
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  // Get status color for different upload states
  const getStatusColor = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return theme.palette.success.main;
      case 'failed':
        return theme.palette.error.main;
      case 'uploading':
        return theme.palette.primary.main;
      case 'pending':
        return theme.palette.warning.main;
      case 'cancelled':
        return theme.palette.text.disabled;
      default:
        return theme.palette.text.secondary;
    }
  };

  // Get status icon for different upload states
  const getStatusIcon = (status: UploadItem['status']) => {
    switch (status) {
      case 'completed':
        return <SuccessIcon color="success" />;
      case 'failed':
        return <ErrorIcon color="error" />;
      case 'uploading':
        return <UploadIcon color="primary" />;
      case 'pending':
        return <FileIcon color="action" />;
      case 'cancelled':
        return <CancelIcon color="disabled" />;
      default:
        return <FileIcon color="action" />;
    }
  };

  // Individual file progress component
  const FileProgressItem: React.FC<{ item: UploadItem; index: number }> = ({
    item,
    index,
  }) => {
    const [expanded, setExpanded] = React.useState(false);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: index * 0.1 }}
      >
        <Card
          variant="outlined"
          sx={{
            mb: 1,
            borderColor: alpha(getStatusColor(item.status), 0.3),
            backgroundColor: alpha(getStatusColor(item.status), 0.02),
          }}
        >
          <CardContent sx={{ pb: compact ? 1 : 2 }}>
            <Box display="flex" alignItems="center" gap={2}>
              {getStatusIcon(item.status)}
              
              <Box flex={1} minWidth={0}>
                <Typography
                  variant={compact ? 'body2' : 'subtitle2'}
                  noWrap
                  title={item.metadata.filename}
                  sx={{ fontWeight: 500 }}
                >
                  {item.metadata.filename}
                </Typography>
                
                <Box display="flex" alignItems="center" gap={1} mt={0.5}>
                  <Typography variant="caption" color="textSecondary">
                    {formatFileSize(item.metadata.size)}
                  </Typography>
                  
                  <Chip
                    label={item.status}
                    size="small"
                    variant="outlined"
                    sx={{
                      height: 20,
                      fontSize: '0.7rem',
                      borderColor: getStatusColor(item.status),
                      color: getStatusColor(item.status),
                    }}
                  />
                  
                  {item.progress.percentage > 0 && item.status === 'uploading' && (
                    <Typography variant="caption" color="primary">
                      {Math.round(item.progress.percentage)}%
                    </Typography>
                  )}
                </Box>
              </Box>

              {!compact && (
                <IconButton
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  sx={{ ml: 1 }}
                >
                  {expanded ? <CollapseIcon /> : <ExpandIcon />}
                </IconButton>
              )}
            </Box>

            {/* Progress bar */}
            {(item.status === 'uploading' || item.status === 'pending') && (
              <Box mt={2}>
                <LinearProgress
                  variant={item.status === 'uploading' ? 'determinate' : 'indeterminate'}
                  value={item.status === 'uploading' ? item.progress.percentage : 0}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      backgroundColor: theme.palette.primary.main,
                    },
                  }}
                />
              </Box>
            )}

            {/* Expanded details */}
            <Collapse in={expanded && !compact}>
              <Box mt={2} pt={2} borderTop={1} borderColor="divider">
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary">
                      Type:
                    </Typography>
                    <Typography variant="caption">
                      {item.metadata.type || 'Unknown'}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary">
                      Modified:
                    </Typography>
                    <Typography variant="caption">
                      {new Date(item.metadata.lastModified).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {item.progress.total > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="caption" color="textSecondary">
                        Progress:
                      </Typography>
                      <Typography variant="caption">
                        {formatFileSize(item.progress.loaded)} / {formatFileSize(item.progress.total)}
                      </Typography>
                    </Box>
                  )}
                  
                  {item.error && (
                    <Box>
                      <Typography variant="caption" color="error">
                        Error: {item.error}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </Box>
            </Collapse>
          </CardContent>

          {/* Action buttons */}
          {(item.status === 'failed' || item.status === 'pending' || item.status === 'uploading') && (
            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
              <Stack direction="row" spacing={1}>
                {item.status === 'failed' && (
                  <Tooltip title="Retry upload">
                    <IconButton
                      size="small"
                      onClick={() => handleRetry(item.id)}
                      color="primary"
                    >
                      <RetryIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Tooltip title="Cancel upload">
                  <IconButton
                    size="small"
                    onClick={() => handleCancel(item.id)}
                    color="error"
                  >
                    <CancelIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </CardActions>
          )}
        </Card>
      </motion.div>
    );
  };

  // Don't render if no uploads
  if (uploadItems.length === 0) {
    return null;
  }

  return (
    <Box sx={{ width: '100%', ...sx }}>
      {/* Overall progress summary */}
      {showSummary && uploadItems.length > 1 && (
        <Card variant="outlined" sx={{ mb: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6" component="h3">
                Upload Progress
              </Typography>
              <Chip
                label={`${uploadStats.completed}/${uploadStats.total} completed`}
                variant="outlined"
                color={uploadStats.inProgress > 0 ? 'primary' : 'success'}
              />
            </Box>

            <LinearProgress
              variant="determinate"
              value={totalProgress}
              sx={{
                height: 8,
                borderRadius: 4,
                mb: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                '& .MuiLinearProgress-bar': {
                  borderRadius: 4,
                },
              }}
            />

            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="textSecondary">
                {Math.round(totalProgress)}% complete
              </Typography>
              
              <Stack direction="row" spacing={2}>
                {uploadStats.uploading > 0 && (
                  <Typography variant="caption" color="primary">
                    {uploadStats.uploading} uploading
                  </Typography>
                )}
                {uploadStats.failed > 0 && (
                  <Typography variant="caption" color="error">
                    {uploadStats.failed} failed
                  </Typography>
                )}
                {uploadStats.pending > 0 && (
                  <Typography variant="caption" color="warning.main">
                    {uploadStats.pending} pending
                  </Typography>
                )}
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Individual file progress */}
      {showDetails && (
        <AnimatePresence mode="popLayout">
          {uploadItems.map((item, index) => (
            <FileProgressItem
              key={item.id}
              item={item}
              index={index}
            />
          ))}
        </AnimatePresence>
      )}

      {/* Upload status summary for compact mode */}
      {compact && !showDetails && uploadItems.length > 0 && (
        <Box textAlign="center" py={1}>
          <Typography variant="caption" color="textSecondary">
            {isUploading
              ? `Uploading ${uploadStats.uploading} of ${uploadStats.total} files...`
              : `${uploadStats.completed} of ${uploadStats.total} files complete`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UploadProgress;