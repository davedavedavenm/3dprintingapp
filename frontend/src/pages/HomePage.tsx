/**
 * Home Page Component
 * 
 * Landing page showcasing the 3D print quoting service:
 * - Hero section with call-to-action
 * - Service features and benefits
 * - How it works process flow
 * - Customer testimonials
 * - Quick start guide
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Step,
  Stepper,
  StepLabel,
  StepContent,
  useTheme,
  useMediaQuery,
  IconButton,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Settings as SettingsIcon,
  Payment as PaymentIcon,
  LocalShipping as ShippingIcon,
  Speed as SpeedIcon,
  TrendingUp as PrecisionIcon,
  Security as SecurityIcon,
  Support as SupportIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';

import { useAppDispatch } from '../store/hooks';
import { setPageTitle } from '../store/slices/uiSlice';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Set page title
  React.useEffect(() => {
    dispatch(setPageTitle('3D Print Quoting System'));
  }, [dispatch]);

  const handleGetStarted = () => {
    navigate('/upload');
  };

  const handleStartQuoting = () => {
    navigate('/upload');
  };

  const features = [
    {
      icon: <SpeedIcon sx={{ fontSize: 48 }} />,
      title: 'Lightning Fast',
      description: 'Get accurate quotes in seconds with our advanced PrusaSlicer integration',
    },
    {
      icon: <PrecisionIcon sx={{ fontSize: 48 }} />,
      title: 'Precision Pricing',
      description: 'Real G-code analysis ensures accurate material and time estimates',
    },
    {
      icon: <SecurityIcon sx={{ fontSize: 48 }} />,
      title: 'Secure & Private',
      description: 'Your files are processed securely and deleted after quoting',
    },
    {
      icon: <SupportIcon sx={{ fontSize: 48 }} />,
      title: '24/7 Support',
      description: 'Professional support team available to help with any questions',
    },
  ];

  const processSteps = [
    {
      label: 'Upload STL File',
      description: 'Simply drag and drop your STL file or browse to select it',
      icon: <UploadIcon />,
    },
    {
      label: 'Configure Options',
      description: 'Choose material, infill, layer height, and other print settings',
      icon: <SettingsIcon />,
    },
    {
      label: 'Get Instant Quote',
      description: 'Our system analyzes your file and provides accurate pricing',
      icon: <PrecisionIcon />,
    },
    {
      label: 'Secure Payment',
      description: 'Pay securely with PayPal or credit card integration',
      icon: <PaymentIcon />,
    },
    {
      label: 'Fast Delivery',
      description: 'Track your order and receive your parts quickly',
      icon: <ShippingIcon />,
    },
  ];

  return (
    <>
      <Helmet>
        <title>3D Print Quoting System - Instant STL File Quotes</title>
        <meta
          name="description"
          content="Get instant, accurate quotes for your 3D printing projects. Upload STL files, choose materials, and receive professional-quality prints delivered fast."
        />
        <meta
          name="keywords"
          content="3D printing, STL files, instant quotes, PrusaSlicer, 3D print service"
        />
      </Helmet>

      <Box>
        {/* Hero Section */}
        <Box
          sx={{
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            color: 'white',
            py: { xs: 8, md: 12 },
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography
                  variant="h2"
                  component="h1"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '2.5rem', md: '3.5rem' },
                    mb: 2,
                    lineHeight: 1.2,
                  }}
                >
                  Instant 3D Print Quotes
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 300,
                    lineHeight: 1.4,
                  }}
                >
                  Upload your STL file and get accurate pricing in seconds.
                  Professional quality prints delivered fast.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleGetStarted}
                    sx={{
                      backgroundColor: 'white',
                      color: theme.palette.primary.main,
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: theme.palette.grey[100],
                      },
                    }}
                    endIcon={<ArrowForwardIcon />}
                  >
                    Upload Files Now
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 600,
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  sx={{
                    position: 'relative',
                    textAlign: 'center',
                    display: { xs: 'none', md: 'block' },
                  }}
                >
                  {/* Placeholder for 3D animation or illustration */}
                  <Box
                    sx={{
                      width: '100%',
                      height: 400,
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography variant="h6" sx={{ opacity: 0.7 }}>
                      3D Model Preview
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>

        {/* Features Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            align="center"
            sx={{ mb: 6, fontWeight: 600 }}
          >
            Why Choose Our Service?
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    textAlign: 'center',
                    transition: 'transform 0.3s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ color: theme.palette.primary.main, mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>

        {/* How It Works Section */}
        <Box sx={{ backgroundColor: theme.palette.background.paper, py: 8 }}>
          <Container maxWidth="lg">
            <Typography
              variant="h3"
              component="h2"
              align="center"
              sx={{ mb: 6, fontWeight: 600 }}
            >
              How It Works
            </Typography>
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Stepper
                orientation={isMobile ? 'vertical' : 'horizontal'}
                activeStep={-1}
                sx={{
                  '& .MuiStepLabel-root': {
                    cursor: 'pointer',
                  },
                }}
              >
                {processSteps.map((step, index) => (
                  <Step key={index} completed={false}>
                    <StepLabel
                      icon={
                        <Box
                          sx={{
                            backgroundColor: theme.palette.primary.main,
                            color: 'white',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {step.icon}
                        </Box>
                      }
                    >
                      <Typography variant="h6" component="h3">
                        {step.label}
                      </Typography>
                    </StepLabel>
                    {isMobile && (
                      <StepContent>
                        <Typography color="text.secondary">
                          {step.description}
                        </Typography>
                      </StepContent>
                    )}
                    {!isMobile && (
                      <Box sx={{ mt: 1 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          align="center"
                        >
                          {step.description}
                        </Typography>
                      </Box>
                    )}
                  </Step>
                ))}
              </Stepper>
            </Box>
          </Container>
        </Box>

        {/* Call to Action Section */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Box
            sx={{
              textAlign: 'center',
              backgroundColor: theme.palette.primary.main,
              color: 'white',
              py: 6,
              px: 4,
              borderRadius: 3,
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
            }}
          >
            <Typography variant="h4" component="h2" sx={{ mb: 2, fontWeight: 600 }}>
              Ready to Get Started?
            </Typography>
            <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
              Upload your STL file now and get an instant quote
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleStartQuoting}
              sx={{
                backgroundColor: 'white',
                color: theme.palette.primary.main,
                fontWeight: 600,
                px: 4,
                py: 1.5,
                '&:hover': {
                  backgroundColor: theme.palette.grey[100],
                },
              }}
              endIcon={<ArrowForwardIcon />}
            >
              Start Quoting Now
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
};

export default HomePage;