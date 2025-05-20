/**
 * Order Page Component
 * 
 * Displays order status and tracking information for completed orders.
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Alert,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineOppositeContent,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
} from '@mui/lab';
import {
  ShoppingCart as OrderIcon,
  Build as ProductionIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CompleteIcon,
} from '@mui/icons-material';

const OrderPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom>
        Order Tracking
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Order tracking system is currently in development. Once implemented, 
        you'll be able to track your 3D print orders in real-time.
      </Alert>

      <Card>
        <CardContent>
          <Box textAlign="center" py={4}>
            <OrderIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Order #{orderId}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Order tracking functionality coming soon
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default OrderPage;
