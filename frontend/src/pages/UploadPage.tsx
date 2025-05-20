/**
 * Upload Page - STL Upload Interface Demo
 * 
 * Comprehensive demonstration of the upload interface components:
 * - STL file upload with drag-and-drop
 * - Real-time progress tracking
 * - 3D model preview
 * - Upload queue management
 * - File validation and error handling
 */

import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Alert,
  Fade,
  Divider,
  useTheme,
  useMediaQuery,
  Button,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

import {
  STLUploadZone,
  UploadProgress,
  STLPreview,
  UploadQueue,
  UploadUtils,
  UploadEventHandlers,
} from '../components/Upload';
import { useAppSelector } from '../store/hooks';
import {
  selectAllUploads,
  selectCompletedUploads,
  selectIsUploading,
  UploadItem,
} from '../store/slices/uploadSlice';

/**
 * Upload Statistics Component
 * 
 * Display real-time upload statistics and metrics
 */
const UploadStats: React.FC = () => {
  const uploadItems = useAppSelector(selectAllUploads);
  const completedUploads = useAppSelector(selectCompletedUploads);
  const isUploading = useAppSelector(selectIsUploading);

  const stats = React.useMemo(() => {
    const grouped = UploadUtils.groupByStatus(uploadItems);
    const totalSize = UploadUtils.calculateTotalSize(uploadItems.map(item => item.file));
    const completedSize = UploadUtils.calculateTotalSize(
      completedUploads.map(item => item.file)
    );

    return {
      total: uploadItems.length,
      completed: grouped.completed?.length || 0,
      failed: grouped.failed?.length || 0,
      uploading: grouped.uploading?.length || 0,
      pending: grouped.pending?.length || 0,
      totalSize: UploadUtils.formatFileSize(totalSize),
      completedSize: UploadUtils.formatFileSize(completedSize),
      isActive: isUploading,
    };
  }, [uploadItems, completedUploads, isUploading]);

  const statCards = [
    {
      label: 'Total Files',
      value: stats.total,
      color: 'primary',
      icon: '📁',
    },
    {
      label: 'Completed',
      value: stats.completed,
      color: 'success',
      icon: '✅',
    },
    {
      label: 'Uploading',
      value: stats.uploading,
      color: 'info',
      icon: '⬆️',
    },
    {
      label: 'Pending',
      value: stats.pending,
      color: 'warning',
      icon: '⏳',
    },
    {
      label: 'Failed',
      value: stats.failed,
      color: 'error',
      icon: '❌',
    },
    {
      label: 'Total Size',
      value: stats.totalSize,
      color: 'primary',
      icon: '💾',
    },
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      {statCards.map((stat, index) => (
        <Grid item xs={6} sm={4} md={2} key={stat.label}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              variant="outlined"
              sx={{
                textAlign: 'center',
                borderColor: `${stat.color}.main`,
                backgroundColor: (theme) => 
                  theme.palette.mode === 'light'
                    ? `${stat.color}.50`
                    : `${stat.color}.900`,
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Typography variant="h2" component="div" sx={{ mb: 1 }}>
                  {stat.icon}
                </Typography>
                <Typography
                  variant="h4"
                  component="div"
                  color={`${stat.color}.main`}
                  fontWeight="bold"
                >
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
    </Grid>
  );
};

/**
 * Selected File Preview Component
 * 
 * Shows preview of the currently selected/highlighted file
 */
const SelectedFilePreview: React.FC = () => {
  const uploadItems = useAppSelector(selectAllUploads);
  const [selectedItem, setSelectedItem] = useState<UploadItem | null>(null);

  // Auto-select the first completed upload for preview
  React.useEffect(() => {
    const completedItems = uploadItems.filter(item => item.status === 'completed');
    if (completedItems.length > 0 && !selectedItem) {
      setSelectedItem(completedItems[0]);
    }
  }, [uploadItems, selectedItem]);

  if (!selectedItem) {
    return (
      <Card variant="outlined" sx={{ height: 400 }}>
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            height="100%"
            flexDirection="column"
            gap={2}
          >
            <Typography variant="h6" color="textSecondary">
              No file selected for preview
            </Typography>
            <Typography variant="body2" color="textSecondary" textAlign="center">
              Upload and complete a 3D model file to see it here
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        3D Model Preview
      </Typography>
      <STLPreview
        uploadItem={selectedItem}
        height={400}
        showInfo={true}
        allowFullscreen={true}
        onLoad={(geometry) => {
          console.log('Preview loaded:', selectedItem.metadata.filename);
        }}
        onError={(error) => {
          console.error('Preview error:', error);
        }}
      />
      
      {/* File selection controls */}
      <Box mt={2}>
        <Typography variant="subtitle2" gutterBottom>
          Select file for preview:
        </Typography>
        <Box display="flex" gap={1} flexWrap="wrap">
          {uploadItems
            .filter(item => item.status === 'completed')
            .map(item => (
              <Card
                key={item.id}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  borderColor: selectedItem?.id === item.id ? 'primary.main' : 'divider',
                  backgroundColor: selectedItem?.id === item.id 
                    ? 'primary.50' 
                    : 'transparent',
                }}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent sx={{ py: 1, px: 2 }}>
                  <Typography variant="caption" noWrap>
                    {item.metadata.filename}
                  </Typography>
                </CardContent>
              </Card>
            ))}
        </Box>
      </Box>
    </Box>
  );
};

/**
 * Upload Page Component
 * 
 * Main page showcasing the complete upload interface
 */
export const UploadPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const uploadItems = useAppSelector(selectAllUploads);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [alertSeverity, setAlertSeverity] = useState<'success' | 'error' | 'info'>('info');

  // Handle upload success
  const handleUploadSuccess = useCallback((files: File[]) => {
    setAlertMessage(
      `Successfully added ${files.length} file${files.length > 1 ? 's' : ''} to upload queue`
    );
    setAlertSeverity('success');
    setTimeout(() => setAlertMessage(null), 5000);
  }, []);

  // Handle upload error
  const handleUploadError = useCallback((error: string) => {
    setAlertMessage(error);
    setAlertSeverity('error');
    setTimeout(() => setAlertMessage(null), 8000);
  }, []);

  // Handle queue completion
  const handleQueueComplete = useCallback(() => {
    const stats = UploadUtils.groupByStatus(uploadItems);
    UploadEventHandlers.handleQueueComplete(stats, (stats) => {
      setAlertMessage(
        `Upload queue completed! ${stats.completed || 0} files processed successfully.`
      );
      setAlertSeverity('success');
      setTimeout(() => setAlertMessage(null), 5000);
    });
  }, [uploadItems]);

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box mb={4} textAlign="center">
          <Typography variant="h3" component="h1" gutterBottom>
            3D Model Upload Interface
          </Typography>
          <Typography variant="h6" color="textSecondary" paragraph>
            Upload your STL, OBJ, or PLY files to get instant quotes
          </Typography>
        </Box>
      </motion.div>

      {/* Alert Messages */}
      <Fade in={!!alertMessage}>
        <Box mb={3}>
          {alertMessage && (
            <Alert
              severity={alertSeverity}
              onClose={() => setAlertMessage(null)}
              sx={{ borderRadius: 2 }}
            >
              {alertMessage}
            </Alert>
          )}
        </Box>
      </Fade>

      {/* Upload Statistics */}
      <UploadStats />

      <Grid container spacing={3}>
        {/* Upload Zone and Progress */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Box mb={3}>
              <Typography variant="h5" gutterBottom>
                Upload Files
              </Typography>
              <STLUploadZone
                maxFiles={10}
                multiple={true}
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
                sx={{ mb: 3 }}
              />
            </Box>

            {/* Upload Progress */}
            {uploadItems.length > 0 && (
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Upload Progress
                </Typography>
                <UploadProgress
                  showDetails={!isMobile}
                  showSummary={true}
                  compact={isMobile}
                />
              </Box>
            )}
          </motion.div>
        </Grid>

        {/* Preview and Queue */}
        <Grid item xs={12} md={6}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {/* 3D Preview */}
            <Box mb={3}>
              <SelectedFilePreview />
            </Box>
            
            {/* Add Quote Button for completed uploads */}
            {uploadItems.filter(item => item.status === 'completed').length > 0 && (
              <Box mt={3} mb={3} display="flex" justifyContent="center">
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  component={Link}
                  to="/quote"
                  state={{ fromUpload: true, uploadId: uploadItems.filter(item => item.status === 'completed')[0]?.id }}
                  startIcon={<CalculateIcon />}
                  sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                  Configure & Get Quote
                </Button>
              </Box>
            )}
          </motion.div>
        </Grid>

        {/* Upload Queue */}
        {uploadItems.length > 0 && (
          <Grid item xs={12}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Divider sx={{ my: 3 }} />
              <Typography variant="h5" gutterBottom>
                Upload Queue
              </Typography>
              <UploadQueue
                showPreviews={!isMobile}
                autoStart={true}
                maxConcurrent={3}
                showAdvancedControls={true}
                onQueueComplete={handleQueueComplete}
                onUploadComplete={(item) => {
                  UploadEventHandlers.handleUploadSuccess(item);
                }}
              />
            </motion.div>
          </Grid>
        )}
      </Grid>

      {/* Help Information */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Box mt={6}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Instructions
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                      📁
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Supported Formats
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      STL, OBJ, PLY files up to 100MB each
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                      ⬆️
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Drag & Drop
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Simply drag files into the upload zone
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                      👁️
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      3D Preview
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      View your models in 3D before processing
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Box textAlign="center" p={2}>
                    <Typography variant="h4" component="div" sx={{ mb: 1 }}>
                      ⚡
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Fast Processing
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Get instant quotes after upload
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      </motion.div>
    </Container>
  );
};

export default UploadPage;