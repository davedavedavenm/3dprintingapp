/**
 * Layout Component
 * 
 * Provides the main application layout structure including:
 * - Header navigation with logo and menu
 * - Responsive sidebar navigation
 * - Main content area with proper spacing
 * - Footer with company information
 * - Global loading and error overlays
 */

import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container,
  useTheme,
  useMediaQuery,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Divider,
  Backdrop,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  Calculate as CalculateIcon,
  Payment as PaymentIcon,
  Info as InfoIcon,
  ContactMail as ContactIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  toggleSidebar,
  setSidebarOpen,
  setScreenDimensions,
  selectSidebarOpen,
  selectGlobalLoading,
  selectPageTitle,
} from '../../store/slices/uiSlice';

// Components
import LoadingSpinner from '../UI/LoadingSpinner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const dispatch = useAppDispatch();
  const location = useLocation();
  
  // Redux state
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const globalLoading = useAppSelector(selectGlobalLoading);
  const pageTitle = useAppSelector(selectPageTitle);

  // Navigation items
  const navigationItems = [
    { label: 'Home', path: '/', icon: <HomeIcon /> },
    { label: 'Upload Files', path: '/upload', icon: <UploadIcon /> },
    { label: 'Configure Quote', path: '/quote', icon: <CalculateIcon /> },
    { label: 'About', path: '/about', icon: <InfoIcon /> },
    { label: 'Contact', path: '/contact', icon: <ContactIcon /> },
  ];

  // Handle screen resize
  useEffect(() => {
    const handleResize = () => {
      dispatch(setScreenDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      }));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial call

    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      dispatch(setSidebarOpen(false));
    }
  }, [location.pathname, isMobile, sidebarOpen, dispatch]);

  // Handle sidebar toggle
  const handleSidebarToggle = () => {
    dispatch(toggleSidebar());
  };

  // Handle navigation
  const handleNavigate = (path: string) => {
    window.location.href = path;
  };

  // Sidebar content
  const sidebarContent = (
    <Box sx={{ width: 280, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Sidebar Header */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
          3D Print Quoting
        </Typography>
        {isMobile && (
          <IconButton
            onClick={handleSidebarToggle}
            edge="end"
            aria-label="close sidebar"
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      <Divider />

      {/* Navigation Links */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                borderRadius: 1,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                  '& .MuiListItemIcon-root': {
                    color: theme.palette.primary.contrastText,
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Footer in Sidebar */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          © 2024 3D Print Quoting
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.background.paper,
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="toggle sidebar"
            onClick={handleSidebarToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {pageTitle}
          </Typography>

          {/* Additional header actions could go here */}
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="left"
        open={sidebarOpen}
        onClose={handleSidebarToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: 280,
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        {sidebarContent}
      </Drawer>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen && !isMobile && {
            marginLeft: 280,
            transition: theme.transitions.create(['margin'], {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        {/* Toolbar spacer */}
        <Toolbar />

        {/* Page Content */}
        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            py: 3,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </Container>

        {/* Footer */}
        <Box
          component="footer"
          sx={{
            backgroundColor: theme.palette.background.paper,
            borderTop: `1px solid ${theme.palette.divider}`,
            py: 2,
            mt: 'auto',
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                © 2024 3D Print Quoting System. All rights reserved.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Powered by advanced slicing technology
              </Typography>
            </Box>
          </Container>
        </Box>
      </Box>

      {/* Global Loading Overlay */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1000,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
        open={globalLoading.isLoading}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <LoadingSpinner size="large" />
          {globalLoading.message && (
            <Typography variant="h6" component="div" sx={{ color: 'white' }}>
              {globalLoading.message}
            </Typography>
          )}
          {globalLoading.progress !== undefined && (
            <Typography variant="body2" sx={{ color: 'white' }}>
              {Math.round(globalLoading.progress)}% complete
            </Typography>
          )}
        </Box>
      </Backdrop>
    </Box>
  );
};

export default Layout;