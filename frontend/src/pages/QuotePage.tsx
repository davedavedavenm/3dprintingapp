/**
 * QuotePage - Main Quote Configuration Interface
 * 
 * Orchestrates all quote-related components for seamless user experience
 * Critical MVP page for configuration and pricing workflow
 */

import React, { useEffect, useCallback, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Fab,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  ArrowForward as ForwardIcon,
  Calculate as CalculateIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  selectConfiguration,
  selectCurrentQuote,
  selectIsCalculating,
  selectQuoteErrors,
  calculateQuote,
  fetchMaterials,
  clearError,
  setUploadId,
} from '../store/slices/quoteSlice';
import { selectCompletedUploads } from '../store/slices/uploadSlice';

// Import Quote Components
import {
  MaterialSelector,
  PrintOptions,
  PriceBreakdown,
  QuoteSummary,
  QuantitySelector,
} from '../components/Quote';

interface QuotePageProps {}

const QuotePage: React.FC<QuotePageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  // State management
  const configuration = useAppSelector(selectConfiguration);
  const currentQuote = useAppSelector(selectCurrentQuote);
  const isCalculating = useAppSelector(selectIsCalculating);
  const completedUploads = useAppSelector(selectCompletedUploads);
  const quoteErrors = useAppSelector(selectQuoteErrors);

  // Derived state
  const canCalculateQuote = Boolean(
    configuration.material && 
    configuration.printOptions && 
    completedUploads.length > 0
  );
  const [currentStep, setCurrentStep] = useState(0);
  const [hasConfigurationChanged, setHasConfigurationChanged] = useState(false);
  const [autoCalculateEnabled, setAutoCalculateEnabled] = useState(true);

  // Steps configuration
  const steps = [
    { label: 'Upload Files', component: 'upload', required: true },
    { label: 'Select Material', component: 'material', required: true },
    { label: 'Configure Print', component: 'options', required: true },
    { label: 'Review & Pricing', component: 'summary', required: false },
  ];

  // Initialize on component mount
  useEffect(() => {
    dispatch(fetchMaterials());
    dispatch(clearError());

    // Check for URL state or completed uploads
    if (location.state?.uploadId) {
      // Set upload ID from URL state
      const uploadId = location.state.uploadId;
      dispatch(setUploadId(uploadId));
      
      // Skip to material selection if coming from upload
      setCurrentStep(1);
    } else if (completedUploads.length > 0) {
      // Set upload ID for first completed upload
      const uploadId = completedUploads[0].id;
      dispatch(setUploadId(uploadId));
      
      // Skip to material selection
      setCurrentStep(1);
    } else if (location.state?.fromUpload) {
      setCurrentStep(1); // Skip to material selection
    }
  }, [dispatch, location.state, completedUploads]);

  // Auto-calculate when configuration changes
  useEffect(() => {
    if (hasConfigurationChanged && autoCalculateEnabled && canCalculateQuote) {
      const timeoutId = setTimeout(() => {
        handleCalculateQuote();
        setHasConfigurationChanged(false);
      }, 1000); // Debounce for 1 second

      return () => clearTimeout(timeoutId);
    }
  }, [hasConfigurationChanged, autoCalculateEnabled, canCalculateQuote, configuration]);

  // Handle configuration changes
  const handleConfigurationChange = useCallback(() => {
    setHasConfigurationChanged(true);
  }, []);

  // Calculate quote
  const handleCalculateQuote = useCallback(async () => {
    if (!canCalculateQuote) {
      console.error('Cannot calculate quote, missing required data:', {
        material: configuration.material ? 'Present' : 'Missing',
        printOptions: configuration.printOptions ? 'Present' : 'Missing',
        uploadId: configuration.uploadId || 'Missing',
        completedUploads: completedUploads.length
      });
      return;
    }

    try {
      // Enhanced debugging: output complete configuration object
      console.log('Calculating quote with configuration:', JSON.stringify(configuration, null, 2));
      console.log('Material details:', configuration.material);
      console.log('Upload ID:', configuration.uploadId);
      console.log('Print options:', configuration.printOptions);
      
      await dispatch(calculateQuote({ 
        uploadId: configuration.uploadId || 'temp-upload-id',
        configuration 
      })).unwrap();
      // Auto-advance to summary step after successful calculation
      if (currentStep < 3) {
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Quote calculation failed:', error);
    }
  }, [dispatch, configuration, canCalculateQuote, currentStep, completedUploads]);

  // Navigation handlers
  const handleBackToUpload = () => {
    navigate('/upload');
  };

  const handleProceedToPayment = (quoteId: string) => {
    navigate(`/payment/${quoteId}`);
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  // Check if current step is complete
  const isStepComplete = (stepIndex: number): boolean => {
    switch (stepIndex) {
      case 0: // Upload
        return completedUploads.length > 0;
      case 1: // Material
        return !!configuration.material;
      case 2: // Options
        return !!configuration.printOptions;
      case 3: // Summary
        return !!currentQuote;
      default:
        return false;
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Upload
        return (
          <Alert severity="info" action={
            <Button onClick={handleBackToUpload} variant="outlined" size="small">
              Upload Files
            </Button>
          }>
            {completedUploads.length > 0 ? 
              `You've uploaded ${completedUploads.length} file(s). Click Next to continue.` :
              'Please upload your STL files first to continue with quote configuration.'}
          </Alert>
        );

      case 1: // Material Selection
        return (
          <MaterialSelector />
        );

      case 2: // Print Options
        return (
          <PrintOptions 
            showAdvanced={true}
          />
        );

      case 3: // Summary
        return (
          <QuoteSummary 
            showActions={true}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom>
          Configure Your Quote
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Customize your print settings and get instant pricing
        </Typography>
      </Box>

      {/* Progress Stepper */}
      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={currentStep} alternativeLabel>
          {steps.map((step, index) => (
            <Step 
              key={step.label}
              completed={isStepComplete(index)}
              sx={{ cursor: 'pointer' }}
              onClick={() => handleStepClick(index)}
            >
              <StepLabel 
                error={index === 0 && completedUploads.length === 0}
              >
                {step.label}
              </StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {/* Error Display */}
      {quoteErrors && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => dispatch(clearError())}>
          <Typography variant="subtitle2">Quote Calculation Error:</Typography>
          <Typography variant="body2">{quoteErrors}</Typography>
        </Alert>
      )}

      {/* Main Content */}
      <Grid container spacing={4}>
        {/* Left Column - Configuration */}
        <Grid item xs={12} lg={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                startIcon={<BackIcon />}
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                variant="outlined"
              >
                Previous
              </Button>

              <Box sx={{ display: 'flex', gap: 2 }}>
                {hasConfigurationChanged && canCalculateQuote && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<CalculateIcon />}
                    onClick={handleCalculateQuote}
                    disabled={isCalculating}
                  >
                    {isCalculating ? 'Calculating...' : 'Update Quote'}
                  </Button>
                )}

                <Button
                  endIcon={<ForwardIcon />}
                  onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
                  disabled={currentStep === steps.length - 1}
                  variant="contained"
                >
                  Next
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>

        {/* Right Column - Live Pricing & Summary */}
        <Grid item xs={12} lg={4}>
          <Box sx={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Price Breakdown */}
            <PriceBreakdown />

            {/* Quantity Selector */}
            {currentStep >= 2 && (
              <QuantitySelector 
                showPricingTiers={false}
              />
            )}

            {/* Upload Status */}
            {completedUploads.length === 0 && (
              <Alert severity="warning" action={
                <Button onClick={handleBackToUpload} size="small">
                  <UploadIcon sx={{ mr: 1 }} />
                  Upload
                </Button>
              }>
                No files uploaded yet
              </Alert>
            )}

            {/* Calculation Status */}
            {isCalculating && (
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <CircularProgress size={24} sx={{ mr: 2 }} />
                <Typography variant="body2">
                  Calculating your quote...
                </Typography>
              </Paper>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Floating Action Button - Quick Calculate */}
      {hasConfigurationChanged && canCalculateQuote && !isCalculating && (
        <Fab
          color="primary"
          aria-label="calculate"
          onClick={handleCalculateQuote}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <CalculateIcon />
        </Fab>
      )}
    </Container>
  );
};

export default QuotePage;
