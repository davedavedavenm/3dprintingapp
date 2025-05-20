/**
 * Material-UI Theme Configuration
 * 
 * Defines the application's design system including:
 * - Color palette and typography
 * - Component defaults and styling
 * - Breakpoints and spacing
 * - Dark/light mode configurations
 */

import { createTheme, ThemeOptions } from '@mui/material/styles';

// Color palette definitions
const lightPalette = {
  primary: {
    main: '#1976d2',
    light: '#42a5f5',
    dark: '#1565c0',
    contrastText: '#ffffff',
  },
  secondary: {
    main: '#dc004e',
    light: '#e8336d',
    dark: '#9a0036',
    contrastText: '#ffffff',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ff9800',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#000000',
  },
  info: {
    main: '#2196f3',
    light: '#64b5f6',
    dark: '#1976d2',
    contrastText: '#ffffff',
  },
  success: {
    main: '#4caf50',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: '#ffffff',
  },
  background: {
    default: '#fafafa',
    paper: '#ffffff',
  },
  text: {
    primary: 'rgba(0, 0, 0, 0.87)',
    secondary: 'rgba(0, 0, 0, 0.6)',
    disabled: 'rgba(0, 0, 0, 0.38)',
  },
  divider: 'rgba(0, 0, 0, 0.12)',
};

const darkPalette = {
  primary: {
    main: '#90caf9',
    light: '#bbdefb',
    dark: '#42a5f5',
    contrastText: '#000000',
  },
  secondary: {
    main: '#f48fb1',
    light: '#f8bbd9',
    dark: '#e91e63',
    contrastText: '#000000',
  },
  error: {
    main: '#f44336',
    light: '#e57373',
    dark: '#d32f2f',
    contrastText: '#ffffff',
  },
  warning: {
    main: '#ffa726',
    light: '#ffb74d',
    dark: '#f57c00',
    contrastText: '#000000',
  },
  info: {
    main: '#29b6f6',
    light: '#4fc3f7',
    dark: '#0288d1',
    contrastText: '#000000',
  },
  success: {
    main: '#66bb6a',
    light: '#81c784',
    dark: '#388e3c',
    contrastText: '#000000',
  },
  background: {
    default: '#121212',
    paper: '#1e1e1e',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.7)',
    disabled: 'rgba(255, 255, 255, 0.5)',
  },
  divider: 'rgba(255, 255, 255, 0.12)',
};

// Typography configuration
const typography = {
  fontFamily: [
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    '"Helvetica Neue"',
    'Arial',
    'sans-serif',
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
    '"Segoe UI Symbol"',
  ].join(','),
  h1: {
    fontSize: '2.5rem',
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: '-0.01562em',
  },
  h2: {
    fontSize: '2rem',
    fontWeight: 300,
    lineHeight: 1.2,
    letterSpacing: '-0.00833em',
  },
  h3: {
    fontSize: '1.75rem',
    fontWeight: 400,
    lineHeight: 1.167,
    letterSpacing: '0em',
  },
  h4: {
    fontSize: '1.5rem',
    fontWeight: 400,
    lineHeight: 1.235,
    letterSpacing: '0.00735em',
  },
  h5: {
    fontSize: '1.25rem',
    fontWeight: 400,
    lineHeight: 1.334,
    letterSpacing: '0em',
  },
  h6: {
    fontSize: '1.125rem',
    fontWeight: 500,
    lineHeight: 1.6,
    letterSpacing: '0.0075em',
  },
  subtitle1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.75,
    letterSpacing: '0.00938em',
  },
  subtitle2: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.57,
    letterSpacing: '0.00714em',
  },
  body1: {
    fontSize: '1rem',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0.00938em',
  },
  body2: {
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: 1.43,
    letterSpacing: '0.01071em',
  },
  button: {
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: 1.75,
    letterSpacing: '0.02857em',
    textTransform: 'uppercase' as const,
  },
  caption: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 1.66,
    letterSpacing: '0.03333em',
  },
  overline: {
    fontSize: '0.75rem',
    fontWeight: 400,
    lineHeight: 2.66,
    letterSpacing: '0.08333em',
    textTransform: 'uppercase' as const,
  },
};

// Component overrides and defaults
const components = {
  MuiCssBaseline: {
    styleOverrides: {
      body: {
        scrollbarColor: '#6b6b6b #2b2b2b',
        '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
          backgroundColor: 'transparent',
          width: 8,
        },
        '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
          borderRadius: 8,
          backgroundColor: '#6b6b6b',
          minHeight: 24,
          border: '2px solid transparent',
        },
        '&::-webkit-scrollbar-thumb:focus, & *::-webkit-scrollbar-thumb:focus': {
          backgroundColor: '#959595',
        },
        '&::-webkit-scrollbar-thumb:active, & *::-webkit-scrollbar-thumb:active': {
          backgroundColor: '#959595',
        },
        '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
          backgroundColor: '#959595',
        },
        '&::-webkit-scrollbar-corner, & *::-webkit-scrollbar-corner': {
          backgroundColor: '#2b2b2b',
        },
      },
    },
  },
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        textTransform: 'none' as const,
        fontWeight: 500,
        boxShadow: 'none',
        '&:hover': {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
      contained: {
        '&:hover': {
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        },
      },
    },
    defaultProps: {
      disableElevation: true,
    },
  },
  MuiCard: {
    styleOverrides: {
      root: {
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        border: '1px solid rgba(0,0,0,0.08)',
        backgroundImage: 'none',
      },
    },
  },
  MuiCardContent: {
    styleOverrides: {
      root: {
        padding: 24,
        '&:last-child': {
          paddingBottom: 24,
        },
      },
    },
  },
  MuiTextField: {
    styleOverrides: {
      root: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 8,
        },
      },
    },
    defaultProps: {
      variant: 'outlined' as const,
      fullWidth: true,
      margin: 'normal' as const,
    },
  },
  MuiPaper: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        backgroundImage: 'none',
      },
    },
  },
  MuiChip: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        fontWeight: 500,
      },
    },
  },
  MuiAlert: {
    styleOverrides: {
      root: {
        borderRadius: 8,
        border: '1px solid',
      },
      standardSuccess: {
        borderColor: '#4caf50',
      },
      standardError: {
        borderColor: '#f44336',
      },
      standardWarning: {
        borderColor: '#ff9800',
      },
      standardInfo: {
        borderColor: '#2196f3',
      },
    },
  },
  MuiLinearProgress: {
    styleOverrides: {
      root: {
        borderRadius: 4,
        backgroundColor: 'rgba(0,0,0,0.1)',
      },
      bar: {
        borderRadius: 4,
      },
    },
  },
  MuiTabs: {
    styleOverrides: {
      root: {
        minHeight: 48,
      },
      indicator: {
        height: 3,
        borderRadius: '3px 3px 0 0',
      },
    },
  },
  MuiTab: {
    styleOverrides: {
      root: {
        minHeight: 48,
        textTransform: 'none' as const,
        fontWeight: 500,
        '&.Mui-selected': {
          fontWeight: 600,
        },
      },
    },
  },
  MuiTooltip: {
    styleOverrides: {
      tooltip: {
        borderRadius: 6,
        fontSize: '0.875rem',
        backgroundColor: 'rgba(0,0,0,0.9)',
      },
      arrow: {
        color: 'rgba(0,0,0,0.9)',
      },
    },
  },
  MuiAppBar: {
    styleOverrides: {
      root: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      },
    },
  },
  MuiDrawer: {
    styleOverrides: {
      paper: {
        borderRight: '1px solid rgba(0,0,0,0.08)',
      },
    },
  },
  MuiStepIcon: {
    styleOverrides: {
      root: {
        '&.Mui-active': {
          color: '#1976d2',
        },
        '&.Mui-completed': {
          color: '#4caf50',
        },
      },
    },
  },
};

// Breakpoints configuration
const breakpoints = {
  values: {
    xs: 0,
    sm: 600,
    md: 960,
    lg: 1280,
    xl: 1920,
  },
};

// Spacing configuration
const spacing = 8;

// Shape configuration
const shape = {
  borderRadius: 8,
};

// Shadows configuration
const shadows = [
  'none',
  '0 1px 2px rgba(0,0,0,0.1)',
  '0 2px 4px rgba(0,0,0,0.1)',
  '0 4px 8px rgba(0,0,0,0.1)',
  '0 8px 16px rgba(0,0,0,0.1)',
  '0 12px 24px rgba(0,0,0,0.1)',
  '0 16px 32px rgba(0,0,0,0.1)',
  '0 20px 40px rgba(0,0,0,0.1)',
  '0 24px 48px rgba(0,0,0,0.1)',
  '0 28px 56px rgba(0,0,0,0.1)',
  '0 32px 64px rgba(0,0,0,0.1)',
  '0 36px 72px rgba(0,0,0,0.1)',
  '0 40px 80px rgba(0,0,0,0.1)',
  '0 44px 88px rgba(0,0,0,0.1)',
  '0 48px 96px rgba(0,0,0,0.1)',
  '0 52px 104px rgba(0,0,0,0.1)',
  '0 56px 112px rgba(0,0,0,0.1)',
  '0 60px 120px rgba(0,0,0,0.1)',
  '0 64px 128px rgba(0,0,0,0.1)',
  '0 68px 136px rgba(0,0,0,0.1)',
  '0 72px 144px rgba(0,0,0,0.1)',
  '0 76px 152px rgba(0,0,0,0.1)',
  '0 80px 160px rgba(0,0,0,0.1)',
  '0 84px 168px rgba(0,0,0,0.1)',
  '0 88px 176px rgba(0,0,0,0.1)',
] as any;

// Theme configurations
const lightThemeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    ...lightPalette,
  },
  typography,
  components,
  breakpoints,
  spacing,
  shape,
  shadows,
};

const darkThemeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    ...darkPalette,
  },
  typography,
  components: {
    ...components,
    MuiCard: {
      styleOverrides: {
        root: {
          ...components.MuiCard.styleOverrides.root,
          border: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid rgba(255,255,255,0.08)',
        },
      },
    },
  },
  breakpoints,
  spacing,
  shape,
  shadows,
};

// Create theme instances
export const lightTheme = createTheme(lightThemeOptions);
export const darkTheme = createTheme(darkThemeOptions);

// Default theme (light)
export const theme = lightTheme;

// Theme utilities
export const getTheme = (mode: 'light' | 'dark') => {
  return mode === 'dark' ? darkTheme : lightTheme;
};

// Custom theme augmentation for TypeScript
declare module '@mui/material/styles' {
  interface Theme {
    status: {
      danger: string;
    };
  }

  interface ThemeOptions {
    status?: {
      danger?: string;
    };
  }
}

// Custom color palette extension
export const customColors = {
  gradient: {
    primary: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
    secondary: 'linear-gradient(45deg, #dc004e 30%, #e8336d 90%)',
    info: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
    success: 'linear-gradient(45deg, #4caf50 30%, #81c784 90%)',
    warning: 'linear-gradient(45deg, #ff9800 30%, #ffb74d 90%)',
    error: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
  },
  surface: {
    light: '#ffffff',
    medium: '#f5f5f5',
    dark: '#eeeeee',
  },
  border: {
    light: 'rgba(0, 0, 0, 0.08)',
    medium: 'rgba(0, 0, 0, 0.12)',
    dark: 'rgba(0, 0, 0, 0.16)',
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.8)',
    medium: 'rgba(255, 255, 255, 0.9)',
    dark: 'rgba(0, 0, 0, 0.5)',
  },
};

export default theme;
