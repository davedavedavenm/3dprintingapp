/**
 * Loading Spinner Component
 * 
 * Reusable loading indicator with customizable appearance:
 * - Multiple size variations
 * - Optional message display
 * - Smooth animations
 * - Accessibility support
 */

import React from 'react';
import {
  Box,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  color?: 'primary' | 'secondary' | 'inherit';
  variant?: 'determinate' | 'indeterminate';
  value?: number;
  thickness?: number;
  centered?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  message,
  color = 'primary',
  variant = 'indeterminate',
  value,
  thickness = 4,
  centered = true,
}) => {
  const theme = useTheme();

  // Size mapping
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 56,
  };

  const spinnerSize = sizeMap[size];

  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <CircularProgress
        size={spinnerSize}
        color={color}
        variant={variant}
        value={value}
        thickness={thickness}
        sx={{
          animation: variant === 'indeterminate' ? 'spin 1s linear infinite' : undefined,
          '@keyframes spin': {
            '0%': {
              transform: 'rotate(0deg)',
            },
            '100%': {
              transform: 'rotate(360deg)',
            },
          },
        }}
      />
      {message && (
        <Typography
          variant={size === 'large' ? 'body1' : 'body2'}
          color="text.secondary"
          align="center"
          sx={{
            maxWidth: 300,
            animation: 'fadeIn 0.3s ease-in-out',
            '@keyframes fadeIn': {
              '0%': {
                opacity: 0,
                transform: 'translateY(10px)',
              },
              '100%': {
                opacity: 1,
                transform: 'translateY(0)',
              },
            },
          }}
        >
          {message}
        </Typography>
      )}
      {variant === 'determinate' && value !== undefined && (
        <Typography variant="caption" color="text.secondary">
          {Math.round(value)}%
        </Typography>
      )}
    </Box>
  );

  if (centered) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 120,
          width: '100%',
        }}
        role="status"
        aria-label={message || 'Loading'}
      >
        {content}
      </Box>
    );
  }

  return (
    <Box role="status" aria-label={message || 'Loading'}>
      {content}
    </Box>
  );
};

export default LoadingSpinner;
