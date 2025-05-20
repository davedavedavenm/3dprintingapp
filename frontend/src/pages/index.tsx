// Export all pages for React Router
import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

// Import pages
export { default as UploadPage } from './UploadPage';
export { default as HomePage } from './HomePage';
export { default as QuotePage } from './QuotePage';

export const PaymentPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" gutterBottom>Payment Page</Typography>
      <Typography variant="body1" color="text.secondary">
        PayPal integration and payment processing interface will be implemented here.
      </Typography>
    </Box>
  );
};

export const OrderStatusPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" gutterBottom>Order Status</Typography>
      <Typography variant="body1" color="text.secondary">
        Order tracking and status updates will be displayed here.
      </Typography>
    </Box>
  );
};

export const AboutPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" gutterBottom>About Us</Typography>
      <Typography variant="body1" color="text.secondary">
        Company information and service details will be displayed here.
      </Typography>
    </Box>
  );
};

export const ContactPage: React.FC = () => {
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" gutterBottom>Contact Us</Typography>
      <Typography variant="body1" color="text.secondary">
        Contact form and business information will be implemented here.
      </Typography>
    </Box>
  );
};

export const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <Box sx={{ textAlign: 'center', py: 8 }}>
      <Typography variant="h3" gutterBottom>404 - Page Not Found</Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        The page you're looking for doesn't exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/')}>
        Return Home
      </Button>
    </Box>
  );
};
