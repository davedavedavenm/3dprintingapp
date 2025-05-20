/**
 * PayPal Smart Button Component
 * 
 * Integrates PayPal Smart Checkout with the 3D print quoting system.
 * Handles order creation, approval, and payment capture flows.
 */

import React, { useCallback, useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { 
  Box, 
  Alert, 
  Typography, 
  CircularProgress,
  Backdrop,
} from '@mui/material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { 
  createPayPalOrder, 
  capturePayPalPayment,
  clearErrors,
  selectCurrentOrder,
  selectIsCreatingOrder,
  selectIsCapturingPayment,
  selectPaymentErrors,
  selectCanCreateOrder,
  selectCustomerInfo,
} from '../../store/slices/paymentSlice';
import { selectCurrentQuote } from '../../store/slices/quoteSlice';

export interface PayPalButtonProps {
  /** Called when payment is successfully completed */
  onSuccess?: (details: any) => void;
  /** Called when payment fails */
  onError?: (error: any) => void;
  /** Called when payment is cancelled */
  onCancel?: () => void;
  /** Disable the button */
  disabled?: boolean;
  /** Custom styling options */
  style?: {
    layout?: 'vertical' | 'horizontal';
    color?: 'gold' | 'blue' | 'silver' | 'white' | 'black';
    shape?: 'rect' | 'pill';
    label?: 'paypal' | 'checkout' | 'buynow' | 'pay' | 'installment';
    tagline?: boolean;
    height?: number;
  };
}

const PayPalButton: React.FC<PayPalButtonProps> = ({
  onSuccess,
  onError,
  onCancel,
  disabled = false,
  style = {
    layout: 'vertical',
    color: 'gold',
    shape: 'rect',
    label: 'paypal',
    tagline: false,
    height: 45,
  },
}) => {
  const dispatch = useAppDispatch();
  const currentQuote = useAppSelector(selectCurrentQuote);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const isCreatingOrder = useAppSelector(selectIsCreatingOrder);
  const isCapturingPayment = useAppSelector(selectIsCapturingPayment);
  const paymentErrors = useAppSelector(selectPaymentErrors);
  const canCreateOrder = useAppSelector(selectCanCreateOrder);
  const customerInfo = useAppSelector(selectCustomerInfo);

  // PayPal configuration
  const paypalOptions = {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID || '',
    currency: 'USD',
    intent: 'capture',
    components: 'buttons',
    'disable-funding': 'credit,card', // Only show PayPal button
  };

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearErrors());
  }, [dispatch]);

  // Create order handler
  const createOrder = useCallback(async (data: any, actions: any) => {
    if (!currentQuote || !customerInfo?.email) {
      const error = 'Missing quote or customer information';
      console.error('PayPal createOrder error:', error);
      onError?.(error);
      return Promise.reject(error);
    }

    try {
      // Dispatch order creation action
      const result = await dispatch(createPayPalOrder({
        quoteId: currentQuote.id,
        customerEmail: customerInfo.email,
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
        },
      })).unwrap();

      // Return PayPal order ID for frontend
      return result.order_id;
    } catch (error) {
      console.error('PayPal order creation failed:', error);
      onError?.(error);
      throw error;
    }
  }, [currentQuote, customerInfo, dispatch, onError]);

  // Approve order handler
  const onApprove = useCallback(async (data: any, actions: any) => {
    if (!data.orderID) {
      const error = 'Missing order ID from PayPal';
      console.error('PayPal onApprove error:', error);
      onError?.(error);
      return;
    }

    try {
      // Capture payment
      const result = await dispatch(capturePayPalPayment(data.orderID)).unwrap();
      
      // Call success callback
      onSuccess?.(result);
    } catch (error) {
      console.error('PayPal payment capture failed:', error);
      onError?.(error);
    }
  }, [dispatch, onSuccess, onError]);

  // Error handler
  const onPayPalError = useCallback((error: any) => {
    console.error('PayPal error:', error);
    onError?.(error);
  }, [onError]);

  // Cancel handler
  const onPayPalCancel = useCallback((data: any) => {
    console.log('PayPal payment cancelled:', data);
    onCancel?.();
  }, [onCancel]);

  // Validation checks
  if (!paypalOptions.clientId) {
    return (
      <Alert severity="error">
        PayPal client ID not configured. Please check environment variables.
      </Alert>
    );
  }

  if (!currentQuote) {
    return (
      <Alert severity="warning">
        No quote selected. Please configure your print options first.
      </Alert>
    );
  }

  if (!canCreateOrder) {
    return (
      <Alert severity="info">
        Please provide your email address and agree to terms to proceed with payment.
      </Alert>
    );
  }

  // Show loading backdrop during payment processing
  const showLoading = isCreatingOrder || isCapturingPayment;

  return (
    <Box>
      {/* Payment Errors */}
      {paymentErrors.length > 0 && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Payment Error:
          </Typography>
          {paymentErrors.map((error, index) => (
            <Typography key={index} variant="body2">
              {error}
            </Typography>
          ))}
        </Alert>
      )}

      {/* PayPal Button */}
      <PayPalScriptProvider options={paypalOptions}>
        <Box sx={{ position: 'relative' }}>
          <PayPalButtons
            style={style}
            disabled={disabled || showLoading}
            createOrder={createOrder}
            onApprove={onApprove}
            onError={onPayPalError}
            onCancel={onPayPalCancel}
          />
          
          {/* Loading overlay */}
          {showLoading && (
            <Backdrop
              open={true}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 1,
              }}
            >
              <Box textAlign="center">
                <CircularProgress size={40} color="primary" />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {isCreatingOrder && 'Creating order...'}
                  {isCapturingPayment && 'Processing payment...'}
                </Typography>
              </Box>
            </Backdrop>
          )}
        </Box>
      </PayPalScriptProvider>

      {/* Order Information */}
      {currentOrder && (
        <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Order ID: {currentOrder.orderId}
          </Typography>
          <Typography variant="body2">
            Total: {currentOrder.totalAmount} {currentOrder.currency}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default PayPalButton;
