/**
 * Payment Page Component
 * 
 * Handles the complete payment flow including:
 * - Quote review and confirmation
 * - Customer information collection
 * - PayPal Smart Checkout integration
 * - Payment confirmation and error handling
 * - Order confirmation display
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Button,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Receipt as ReceiptIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

import { useAppSelector, useAppDispatch } from '../store/hooks';
import { selectCurrentQuote } from '../store/slices/quoteSlice';
import {
  selectPaymentCapture,
  selectCurrentOrder,
  selectPaymentErrors,
  selectIsProcessingPayment,
  resetPayment,
} from '../store/slices/paymentSlice';
import {
  PayPalButton,
  PaymentForm,
  OrderConfirmation,
  PaymentError,
} from '../components/Payment';

type PaymentStep = 'review' | 'payment' | 'confirmation' | 'error';

const PaymentPage: React.FC = () => {
  const { quoteId } = useParams<{ quoteId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  const currentQuote = useAppSelector(selectCurrentQuote);
  const paymentCapture = useAppSelector(selectPaymentCapture);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const paymentErrors = useAppSelector(selectPaymentErrors);
  const isProcessingPayment = useAppSelector(selectIsProcessingPayment);

  const [currentStep, setCurrentStep] = useState<PaymentStep>('review');
  const [isFormValid, setIsFormValid] = useState(false);

  const steps = [
    { key: 'review', label: 'Review Quote' },
    { key: 'payment', label: 'Payment' },
    { key: 'confirmation', label: 'Confirmation' },
  ];

  const getActiveStepIndex = () => {
    switch (currentStep) {
      case 'review': return 0;
      case 'payment': return 1;
      case 'confirmation': return 2;
      case 'error': return 1; // Show error at payment step
      default: return 0;
    }
  };

  // Handle payment success
  const handlePaymentSuccess = (details: any) => {
    console.log('Payment successful:', details);
    setCurrentStep('confirmation');
  };

  // Handle payment error
  const handlePaymentError = (error: any) => {
    console.error('Payment error:', error);
    setCurrentStep('error');
  };

  // Handle retry payment
  const handleRetryPayment = () => {
    setCurrentStep('payment');
  };

  // Handle back to quote
  const handleBackToQuote = () => {
    navigate('/quote');
  };

  // Handle new order
  const handleNewOrder = () => {
    dispatch(resetPayment());
    navigate('/');
  };

  // Handle form validation
  const handleFormChange = (isValid: boolean, data: any) => {
    setIsFormValid(isValid);
  };

  // Check for existing payment capture on mount
  useEffect(() => {
    if (paymentCapture) {
      setCurrentStep('confirmation');
    } else if (paymentErrors.length > 0) {
      setCurrentStep('error');
    } else if (currentOrder) {
      setCurrentStep('payment');
    }
  }, [paymentCapture, paymentErrors, currentOrder]);

  // Redirect if no quote is available
  if (!currentQuote) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="warning">
          <Typography variant="h6" gutterBottom>
            No Quote Found
          </Typography>
          <Typography variant="body1" paragraph>
            Please configure your print options first to generate a quote.
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/quote')}
          >
            Configure Quote
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <Button
          startIcon={<BackIcon />}
          onClick={handleBackToQuote}
          sx={{ mr: 2 }}
        >
          Back to Quote
        </Button>
        <Typography variant="h3" component="h1">
          Payment & Checkout
        </Typography>
      </Box>

      {/* Progress Stepper */}
      {currentStep !== 'error' && (
        <Stepper activeStep={getActiveStepIndex()} sx={{ mb: 4 }}>
          {steps.map((step) => (
            <Step key={step.key}>
              <StepLabel>{step.label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {/* Step Content */}
      {currentStep === 'review' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <PaymentForm
              onChange={handleFormChange}
              showShipping={false}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Order Summary
                </Typography>
                
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Quote ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace" gutterBottom>
                    {currentQuote.id.slice(-8).toUpperCase()}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ${currentQuote.calculation.total.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Breakdown
                  </Typography>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Material Cost</Typography>
                    <Typography variant="body2">
                      ${currentQuote.calculation.materialCost.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Machine Time Cost</Typography>
                    <Typography variant="body2">
                      ${currentQuote.calculation.machineTime.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Overhead Cost</Typography>
                    <Typography variant="body2">
                      ${currentQuote.calculation.setupCost.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => setCurrentStep('payment')}
                  disabled={!isFormValid}
                >
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>

            {/* Security Notice */}
            <Alert severity="info" icon={<SecurityIcon />} sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Secure Payment:</strong> All transactions are protected with
                256-bit SSL encryption and processed securely through PayPal.
              </Typography>
            </Alert>
          </Grid>
        </Grid>
      )}

      {currentStep === 'payment' && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Complete Your Payment
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Click the PayPal button below to securely complete your payment.
                  You'll be redirected to PayPal to approve the transaction.
                </Typography>

                <PayPalButton
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  onCancel={() => setCurrentStep('review')}
                  style={{
                    layout: 'vertical',
                    color: 'gold',
                    shape: 'rect',
                    label: 'paypal',
                    tagline: false,
                    height: 55,
                  }}
                />

                <Alert severity="info" sx={{ mt: 3 }}>
                  <Typography variant="body2">
                    <strong>Note:</strong> By proceeding with payment, you acknowledge that
                    your order will begin production immediately and cannot be cancelled
                    once printing has started.
                  </Typography>
                </Alert>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Final Order Review
                </Typography>
                
                <Box mb={2}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Print Configuration
                  </Typography>
                  <Box>
                    <Chip label={currentQuote.material.name} size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label={`${currentQuote.printOptions.layerHeight}mm layers`} size="small" sx={{ mr: 1, mb: 1 }} />
                    <Chip label={`${currentQuote.printOptions.infillPercentage}% infill`} size="small" sx={{ mr: 1, mb: 1 }} />
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Total to Pay
                  </Typography>
                  <Typography variant="h4" color="primary">
                    ${currentQuote.calculation.total.toFixed(2)}
                  </Typography>
                </Box>

                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    <ReceiptIcon sx={{ fontSize: 16, mr: 0.5, verticalAlign: 'middle' }} />
                    A detailed receipt will be provided after payment
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {currentStep === 'confirmation' && (
        <OrderConfirmation
          onNewOrder={handleNewOrder}
          showTracking={true}
        />
      )}

      {currentStep === 'error' && (
        <PaymentError
          onRetry={handleRetryPayment}
          onContactSupport={() => window.open('mailto:support@3dprintservice.com')}
          onModifyQuote={handleBackToQuote}
          showDetails={true}
        />
      )}
    </Container>
  );
};

export default PaymentPage;
