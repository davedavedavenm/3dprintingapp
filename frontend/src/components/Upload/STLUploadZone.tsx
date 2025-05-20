/**
 * STL Upload Zone Component
 * 
 * Provides drag-and-drop file upload interface with:
 * - Visual feedback for drag operations
 * - Client-side file validation
 * - Integration with Redux upload state
 * - Accessibility compliance
 * - Material-UI styled interface
 */

import React, { useCallback, useMemo } from 'react';
import { useDropzone, FileRejection, DropzoneOptions } from 'react-dropzone';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Fade,
  alpha,
  useTheme,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Description as FileIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '../../store/store';
import {
  addFile,
  setDragActive,
  addError,
  selectDragActive,
  selectIsUploading,
  selectUploadErrors,
} from '../../store/slices/uploadSlice';
import { FileValidator } from '../../services/FileValidator';

// Component props interface
interface STLUploadZoneProps {
  /** Maximum number of files to accept */
  maxFiles?: number;
  /** Whether to accept multiple files */
  multiple?: boolean;
  /** Custom error handler */
  onError?: (error: string) => void;
  /** Custom success handler */
  onSuccess?: (files: File[]) => void;
  /** Whether upload zone is disabled */
  disabled?: boolean;
  /** Custom styling */
  sx?: any;
}

/**
 * STL Upload Zone Component
 * 
 * Implements comprehensive drag-and-drop file upload interface
 * with validation, progress tracking, and error handling.
 */
export const STLUploadZone: React.FC<STLUploadZoneProps> = ({
  maxFiles = 10,
  multiple = true,
  onError,
  onSuccess,
  disabled = false,
  sx = {},
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state selectors
  const dragActive = useAppSelector(selectDragActive);
  const isUploading = useAppSelector(selectIsUploading);
  const uploadErrors = useAppSelector(selectUploadErrors);

  // File validation service
  const fileValidator = useMemo(() => new FileValidator(), []);

  // File acceptance configuration
  const acceptedFileTypes = useMemo(
    () => ({
      'model/stl': ['.stl'],
      'model/obj': ['.obj'],
      'model/ply': ['.ply'],
      'application/octet-stream': ['.stl'], // Fallback for STL files
    }),
    []
  );

  // Handle file drop/selection
  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
      dispatch(setDragActive(false));

      // Handle rejection errors
      if (fileRejections.length > 0) {
        const errors = fileRejections.map(rejection => {
          const errors = rejection.errors.map(error => error.message).join(', ');
          return `${rejection.file.name}: ${errors}`;
        });
        
        errors.forEach(error => {
          dispatch(addError(error));
          onError?.(error);
        });
      }

      // Validate and process accepted files
      const validFiles: File[] = [];
      
      for (const file of acceptedFiles) {
        try {
          // Client-side validation
          const validationResult = await fileValidator.validateFile(file);
          
          if (validationResult.isValid) {
            validFiles.push(file);
            dispatch(addFile(file));
          } else {
            const error = `${file.name}: ${validationResult.errors.join(', ')}`;
            dispatch(addError(error));
            onError?.(error);
          }
        } catch (error) {
          const errorMessage = `${file.name}: Validation failed - ${(error as Error).message}`;
          dispatch(addError(errorMessage));
          onError?.(errorMessage);
        }
      }

      // Success callback
      if (validFiles.length > 0) {
        onSuccess?.(validFiles);
      }
    },
    [dispatch, fileValidator, onError, onSuccess]
  );

  // Handle drag enter
  const onDragEnter = useCallback(() => {
    dispatch(setDragActive(true));
  }, [dispatch]);

  // Handle drag leave
  const onDragLeave = useCallback(() => {
    dispatch(setDragActive(false));
  }, [dispatch]);

  // Dropzone configuration
  const dropzoneOptions: DropzoneOptions = {
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: acceptedFileTypes,
    maxFiles,
    multiple,
    disabled: disabled || isUploading,
    maxSize: 100 * 1024 * 1024, // 100MB
    minSize: 1, // 1 byte minimum
  };

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone(dropzoneOptions);

  // Dynamic styling based on state
  const containerStyles = useMemo(
    () => ({
      border: '2px dashed',
      borderColor: dragActive || isDragActive
        ? theme.palette.primary.main
        : theme.palette.divider,
      borderRadius: theme.spacing(2),
      backgroundColor: dragActive || isDragActive
        ? alpha(theme.palette.primary.main, 0.08)
        : alpha(theme.palette.action.hover, 0.02),
      transition: theme.transitions.create([
        'border-color',
        'background-color',
        'transform',
      ], {
        duration: theme.transitions.duration.short,
      }),
      '&:hover': {
        borderColor: theme.palette.primary.main,
        backgroundColor: alpha(theme.palette.primary.main, 0.04),
        transform: 'scale(1.02)',
      },
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
      ...sx,
    }),
    [theme, dragActive, isDragActive, disabled, sx]
  );

  // Animation variants
  const animationVariants = {
    idle: { scale: 1, y: 0 },
    drag: { scale: 1.05, y: -8 },
    uploading: { scale: 0.98 },
  };

  const currentVariant = useMemo(() => {
    if (isUploading) return 'uploading';
    if (dragActive || isDragActive) return 'drag';
    return 'idle';
  }, [isUploading, dragActive, isDragActive]);

  return (
    <motion.div
      variants={animationVariants}
      animate={currentVariant}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
    >
      <Paper
        {...getRootProps()}
        elevation={dragActive || isDragActive ? 4 : 1}
        sx={containerStyles}
      >
        <input {...getInputProps()} />
        
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          padding={4}
          minHeight={300}
          gap={2}
        >
          <AnimatePresence mode="wait">
            {isUploading ? (
              <motion.div
                key="uploading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <CircularProgress size={60} color="primary" />
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <CloudUploadIcon
                  sx={{
                    fontSize: 64,
                    color: dragActive || isDragActive
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    transition: theme.transitions.create('color'),
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <Box textAlign="center">
            <Typography
              variant="h6"
              color={dragActive || isDragActive ? 'primary' : 'textPrimary'}
              gutterBottom
            >
              {isUploading
                ? 'Processing files...'
                : dragActive || isDragActive
                ? 'Drop your STL files here!'
                : 'Drag & drop STL files here'}
            </Typography>
            
            <Typography
              variant="body2"
              color="textSecondary"
              paragraph
            >
              or click to browse from your computer
            </Typography>

            <Typography
              variant="caption"
              color="textSecondary"
              component="div"
            >
              Supported formats: STL, OBJ, PLY • Max size: 100MB per file
              {multiple && ` • Up to ${maxFiles} files`}
            </Typography>
          </Box>

          {!isUploading && (
            <Fade in={!dragActive && !isDragActive}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<FileIcon />}
                onClick={open}
                disabled={disabled}
                sx={{
                  borderRadius: theme.spacing(3),
                  textTransform: 'none',
                  minWidth: 200,
                }}
              >
                Select Files
              </Button>
            </Fade>
          )}

          {/* Error display */}
          {uploadErrors.length > 0 && (
            <Box
              mt={2}
              p={2}
              bgcolor={alpha(theme.palette.error.main, 0.1)}
              borderRadius={1}
              width="100%"
              maxHeight={120}
              overflow="auto"
            >
              {uploadErrors.slice(-3).map((error, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={index < uploadErrors.length - 1 ? 1 : 0}
                >
                  <WarningIcon
                    color="error"
                    sx={{ fontSize: 16 }}
                  />
                  <Typography
                    variant="caption"
                    color="error"
                  >
                    {error}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Paper>
    </motion.div>
  );
};

export default STLUploadZone;