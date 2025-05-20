/**
 * Payment Error Component
 * 
 * Handles display of payment failures with actionable recovery options,
 * error analysis, and customer support information.
 */

import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RetryIcon,
  Support as SupportIcon,
  ExpandMore as ExpandMoreIcon,
  CreditCard as CardIcon,
  AccountBalance as BankIcon,
  Help as HelpIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectPaymentErrors,
  selectCurrentOrder,
  clearErrors,
  resetToOrderCreation,
} from '../../store/slices/paymentSlice';
import { selectCurrentQuote } from '../../store/slices/quoteSlice';

export interface PaymentErrorProps {
  /** Additional error message to display */
  error?: string | Error;
  /** Called when user clicks retry payment */
  onRetry?: () => void;
  /** Called when user clicks contact support */
  onContactSupport?: () => void;
  /** Called when user wants to modify quote */
  onModifyQuote?: () => void;
  /** Show detailed error information */
  showDetails?: boolean;
}

interface ErrorSolution {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const PaymentError: React.FC<PaymentErrorProps> = ({
  error,
  onRetry,
  onContactSupport,
  onModifyQuote,
  showDetails = false,
}) => {
  const dispatch = useAppDispatch();
  const paymentErrors = useAppSelector(selectPaymentErrors);
  const currentOrder = useAppSelector(selectCurrentOrder);
  const currentQuote = useAppSelector(selectCurrentQuote);

  // Combine all error sources
  const allErrors = React.useMemo(() => {
    const errors: string[] = [...paymentErrors];
    
    if (error) {
      if (error instanceof Error) {
        errors.push(error.message);
      } else {
        errors.push(error);
      }
    }
    
    return errors;
  }, [paymentErrors, error]);

  // Error categorization and solutions
  const getErrorSolutions = (errorMessages: string[]): ErrorSolution[] => {
    const solutions: ErrorSolution[] = [];

    // Check for common error patterns
    for (const errorMsg of errorMessages) {
      const lowerError = errorMsg.toLowerCase();

      if (lowerError.includes('insufficient') || lowerError.includes('declined')) {
        solutions.push({
          title: 'Insufficient Funds or Card Declined',
          description: 'Your payment method may not have sufficient funds or your card was declined.',
          action: {
            label: 'Use Different Payment Method',
            onClick: handleRetryPayment,
          },
        });
      } else if (lowerError.includes('expired') || lowerError.includes('invalid')) {
        solutions.push({
          title: 'Invalid Payment Information',
          description: 'The payment information provided may be invalid or expired.',
          action: {
            label: 'Update Payment Info',
            onClick: handleRetryPayment,
          },
        });
      } else if (lowerError.includes('network') || lowerError.includes('timeout')) {
        solutions.push({
          title: 'Network Connection Issue',
          description: 'There was a problem connecting to the payment service.',
          action: {
            label: 'Retry Payment',
            onClick: handleRetryPayment,
          },
        });
      } else if (lowerError.includes('quota') || lowerError.includes('limit')) {
        solutions.push({
          title: 'Payment Limit Exceeded',
          description: 'This transaction exceeds your payment limits.',
          action: {
            label: 'Contact Support',
            onClick: handleContactSupport,
          },
        });
      }
    }

    // Default solutions if no specific ones found
    if (solutions.length === 0) {
      solutions.push({
        title: 'Payment Processing Failed',
        description: 'An unexpected error occurred during payment processing.',
        action: {
          label: 'Retry Payment',
          onClick: handleRetryPayment,
        },
      });
    }

    return solutions;
  };

  const solutions = getErrorSolutions(allErrors);

  // Handlers
  const handleRetryPayment = () => {
    dispatch(clearErrors());
    dispatch(resetToOrderCreation());
    onRetry?.();
  };

  const handleContactSupport = () => {
    onContactSupport?.();
  };

  const handleModifyQuote = () => {
    dispatch(clearErrors());
    onModifyQuote?.();
  };

  return (
    <Box>
      {/* Error Header */}
      <Alert
        severity="error"
        icon={<ErrorIcon />}
        sx={{ mb: 3 }}
      >
        <Typography variant="h6" gutterBottom>
          Payment Failed
        </Typography>
        <Typography variant="body2">
          We encountered an issue processing your payment. Please review the details
          below and try again.
        </Typography>
      </Alert>

      {/* Error Details */}
      {allErrors.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Error Details
            </Typography>
            
            {allErrors.map((errorMsg, index) => (
              <Alert key={index} severity="warning" sx={{ mb: 1 }}>
                {errorMsg}
              </Alert>
            ))}

            {currentOrder && (
              <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Order Information:
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  Order ID: {currentOrder.orderId}
                </Typography>
                <Typography variant="body2" fontFamily="monospace">
                  Amount: {currentOrder.totalAmount} {currentOrder.currency}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      {/* Solutions */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Suggested Solutions
          </Typography>
          
          <Stack spacing={2}>
            {solutions.map((solution, index) => (
              <Box key={index}>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      {solution.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {solution.description}
                    </Typography>
                  </Box>
                  {solution.action && (
                    <Button
                      variant="outlined"
                      onClick={solution.action.onClick}
                    >
                      {solution.action.label}
                    </Button>
                  )}
                </Box>
                {index < solutions.length - 1 && <Divider sx={{ mt: 2 }} />}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            What would you like to do?
          </Typography>
          
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              variant="contained"
              startIcon={<RetryIcon />}
              onClick={handleRetryPayment}
              color="primary"
            >
              Retry Payment
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleModifyQuote}
            >
              Modify Quote
            </Button>
            
            <Button
              variant="outlined"
              startIcon={<SupportIcon />}
              onClick={handleContactSupport}
            >
              Contact Support
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Additional Help */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Need Additional Help?
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Common Payment Issues</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CardIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Card Issues"
                    secondary="Check that your card is valid, has sufficient funds, and isn't expired"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <BankIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Bank Restrictions"
                    secondary="Some banks block online payments - contact your bank if needed"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <HelpIcon />
                  </ListItemIcon>
                  <ListItemText
                    primary="Browser Issues"
                    secondary="Clear your browser cache, disable ad blockers, or try a different browser"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">Contact Information</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Stack spacing={2}>
                <Box display="flex" alignItems="center" gap={1}>
                  <EmailIcon color="primary" />
                  <Typography variant="body1">
                    Email: support@3dprintservice.com
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon color="primary" />
                  <Typography variant="body1">
                    Phone: +1 (555) 123-4567
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Our support team is available Monday-Friday, 9 AM - 5 PM EST
                </Typography>
              </Stack>
            </AccordionDetails>
          </Accordion>

          {showDetails && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle1">Technical Details</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box fontFamily="monospace" fontSize="0.875rem" color="text.secondary">
                  <Typography variant="body2" gutterBottom>
                    Debug Information:
                  </Typography>
                  {currentQuote && (
                    <Box mb={1}>
                      Quote ID: {currentQuote.id}
                    </Box>
                  )}
                  {currentOrder && (
                    <Box mb={1}>
                      Order ID: {currentOrder.orderId}
                    </Box>
                  )}
                  <Box mb={1}>
                    Timestamp: {new Date().toISOString()}
                  </Box>
                  <Box mb={1}>
                    Error Count: {allErrors.length}
                  </Box>
                </Box>
              </AccordionDetails>
            </Accordion>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PaymentError;
