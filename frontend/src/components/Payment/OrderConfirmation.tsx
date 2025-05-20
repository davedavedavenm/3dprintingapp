/**
 * Order Confirmation Component
 * 
 * Displays payment success confirmation with order details,
 * receipt download, and next steps for the customer.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Divider,
  Grid,
  Chip,
  Alert,
  Stack,
  Paper,
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  Receipt as ReceiptIcon,
  Email as EmailIcon,
  LocalShipping as TrackIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import {
  selectPaymentCapture,
  selectCurrentOrder,
  downloadReceipt,
} from '../../store/slices/paymentSlice';

export interface OrderConfirmationProps {
  /** Show order tracking button */
  showTracking?: boolean;
  /** Custom success message */
  successMessage?: string;
  /** Additional actions to display */
  extraActions?: React.ReactNode;
  /** Called when user wants to start new order */
  onNewOrder?: () => void;
}

const OrderConfirmation: React.FC<OrderConfirmationProps> = ({
  showTracking = true,
  successMessage,
  extraActions,
  onNewOrder,
}) => {
  const navigate = useNavigate();
  const paymentCapture = useAppSelector(selectPaymentCapture);
  const currentOrder = useAppSelector(selectCurrentOrder);

  // Handle receipt download
  const handleDownloadReceipt = async () => {
    if (paymentCapture?.transactionId) {
      try {
        await downloadReceipt(paymentCapture.transactionId);
      } catch (error) {
        // Error handled in component
      }
    }
  };

  // Handle order tracking navigation
  const handleTrackOrder = () => {
    if (currentOrder?.orderId) {
      navigate(`/order/${currentOrder.orderId}`);
    }
  };

  // Handle new order
  const handleNewOrder = () => {
    onNewOrder?.();
    navigate('/');
  };

  // Format payment details
  const formatPaymentDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMMM d, yyyy \'at\' h:mm a');
    } catch {
      return dateString;
    }
  };

  if (!paymentCapture || !currentOrder) {
    return (
      <Alert severity="error">
        Payment confirmation details are not available.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Success Header */}
      <Paper
        elevation={0}
        sx={{
          p: 4,
          textAlign: 'center',
          bgcolor: 'success.light',
          color: 'success.contrastText',
          borderRadius: 2,
          mb: 3,
        }}
      >
        <SuccessIcon sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h4" component="h1" gutterBottom>
          Payment Successful!
        </Typography>
        <Typography variant="h6">
          {successMessage || 'Your order has been confirmed and is now being processed.'}
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {/* Order Details */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Stack spacing={2}>
                {/* Transaction Info */}
                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Transaction ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {paymentCapture.transactionId}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="subtitle2" color="text.secondary">
                    Order ID
                  </Typography>
                  <Typography variant="body1" fontFamily="monospace">
                    {paymentCapture.orderId}
                  </Typography>
                </Box>

                {paymentCapture.fulfillmentInfo?.orderNumber && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Order Number
                    </Typography>
                    <Typography variant="body1" fontFamily="monospace">
                      {paymentCapture.fulfillmentInfo.orderNumber}
                    </Typography>
                  </Box>
                )}

                <Divider />

                {/* Payment Details */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Payment Information
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Amount Paid
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        {paymentCapture.amountCaptured}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Payment Method
                      </Typography>
                      <Typography variant="body1">
                        {paymentCapture.orderSummary.paymentMethod}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Payment Date
                      </Typography>
                      <Typography variant="body1">
                        {formatPaymentDate(paymentCapture.capturedAt)}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Status
                      </Typography>
                      <Chip
                        label={paymentCapture.paymentStatus}
                        color="success"
                        size="small"
                      />
                    </Grid>
                  </Grid>
                </Box>

                <Divider />

                {/* Order Description */}
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Order Details
                  </Typography>
                  <Typography variant="body1">
                    {paymentCapture.orderSummary.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quote ID: {paymentCapture.orderSummary.quoteId}
                  </Typography>
                </Box>

                {/* Fulfillment Info */}
                {paymentCapture.fulfillmentInfo && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle1" gutterBottom>
                        Production Status
                      </Typography>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Chip
                          label={paymentCapture.fulfillmentInfo.status}
                          color="primary"
                          size="small"
                        />
                        {paymentCapture.fulfillmentInfo.productionStarted && (
                          <Typography variant="body2" color="text.secondary">
                            Started: {formatPaymentDate(paymentCapture.fulfillmentInfo.productionStarted)}
                          </Typography>
                        )}
                      </Box>
                      {paymentCapture.fulfillmentInfo.estimatedCompletion && (
                        <Typography variant="body2">
                          <strong>Estimated Completion:</strong>{' '}
                          {formatPaymentDate(paymentCapture.fulfillmentInfo.estimatedCompletion)}
                        </Typography>
                      )}
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Actions Panel */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Next Steps
              </Typography>
              
              <Stack spacing={2}>
                {/* Download Receipt */}
                <Button
                  variant="outlined"
                  startIcon={<ReceiptIcon />}
                  onClick={handleDownloadReceipt}
                  fullWidth
                >
                  Download Receipt
                </Button>

                {/* Track Order */}
                {showTracking && (
                  <Button
                    variant="outlined"
                    startIcon={<TrackIcon />}
                    onClick={handleTrackOrder}
                    fullWidth
                  >
                    Track Order Status
                  </Button>
                )}

                {/* Print Order */}
                <Button
                  variant="outlined"
                  startIcon={<PrintIcon />}
                  onClick={() => window.print()}
                  fullWidth
                >
                  Print Confirmation
                </Button>

                <Divider />

                {/* Start New Order */}
                <Button
                  variant="contained"
                  onClick={handleNewOrder}
                  fullWidth
                >
                  Start New Order
                </Button>

                {/* Custom Actions */}
                {extraActions}
              </Stack>
            </CardContent>
          </Card>

          {/* Important Notes */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Important Information
              </Typography>
              
              <Stack spacing={2}>
                <Alert severity="info" icon={<EmailIcon />}>
                  <Typography variant="body2">
                    A confirmation email has been sent to{' '}
                    <strong>{paymentCapture.orderSummary.customerEmail}</strong>
                  </Typography>
                </Alert>

                <Box>
                  <Typography variant="body2" paragraph>
                    <strong>Production Timeline:</strong> Your order is now in the
                    production queue. You will receive updates on the progress via
                    email and can track the status using the order tracking link.
                  </Typography>
                  
                  <Typography variant="body2" paragraph>
                    <strong>Customer Support:</strong> If you have any questions
                    about your order, please contact us with your transaction ID.
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default OrderConfirmation;
