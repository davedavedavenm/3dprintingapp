/**
 * Not Found Page Component
 * 
 * 404 error page with helpful navigation and user-friendly messaging.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  ArrowBack as BackIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleUpload = () => {
    navigate('/upload');
  };

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box textAlign="center">
        <Typography
          variant="h1"
          component="h1"
          sx={{
            fontSize: '8rem',
            fontWeight: 'bold',
            color: 'primary.main',
            mb: 2,
          }}
        >
          404
        </Typography>
        
        <Typography variant="h4" component="h2" gutterBottom>
          Page Not Found
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Sorry, we couldn't find the page you're looking for.
        </Typography>
        
        <Typography variant="body2" color="text.disabled" sx={{ mb: 4 }}>
          Requested path: {location.pathname}
        </Typography>

        <Grid container spacing={2} justifyContent="center" sx={{ mb: 4 }}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<HomeIcon />}
              onClick={handleGoHome}
              size="large"
            >
              Go Home
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<BackIcon />}
              onClick={handleGoBack}
              size="large"
            >
              Go Back
            </Button>
          </Grid>
          <Grid item>
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={handleUpload}
              size="large"
            >
              Upload Files
            </Button>
          </Grid>
        </Grid>

        <Card variant="outlined" sx={{ mt: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              What can you do?
            </Typography>
            <Grid container spacing={2} textAlign="left">
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2 }}>
                  <SearchIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Check the URL
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Make sure the URL is spelled correctly
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2 }}>
                  <HomeIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Visit our homepage
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start fresh from the main page
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2 }}>
                  <UploadIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Upload STL files
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Start a new quote by uploading files
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ p: 2 }}>
                  <BackIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Go back
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Return to the previous page
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default NotFoundPage;
