/**
 * Loading Screen Component
 * 
 * Full-screen loading indicator for application initialization
 * and major state transitions.
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  Container,
  alpha,
  useTheme,
} from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  showProgress = false,
  progress = 0,
}) => {
  const theme = useTheme();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: alpha(theme.palette.background.default, 0.9),
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
      }}
    >
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            p: 4,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: theme.shadows[8],
          }}
        >
          {/* Logo or Brand */}
          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                fontWeight: 600,
                color: 'primary.main',
                mb: 1,
              }}
            >
              3D Print Quoting
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Professional 3D Printing Services
            </Typography>
          </Box>

          {/* Loading Animation */}
          <Box sx={{ mb: 3 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <CircularProgress
                size={60}
                thickness={4}
                variant={showProgress ? 'determinate' : 'indeterminate'}
                value={showProgress ? progress : undefined}
                sx={{
                  color: 'primary.main',
                }}
              />
            </motion.div>
          </Box>

          {/* Loading Message */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mb: showProgress ? 1 : 0 }}
          >
            {message}
          </Typography>

          {/* Progress Text */}
          {showProgress && (
            <Typography variant="caption" color="text.secondary">
              {Math.round(progress)}% complete
            </Typography>
          )}

          {/* Loading Dots Animation */}
          <Box sx={{ display: 'flex', gap: 0.5, mt: 2 }}>
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: index * 0.2,
                }}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.primary.main,
                }}
              />
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LoadingScreen;
