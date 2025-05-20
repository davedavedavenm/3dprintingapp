/**
 * Quote Summary Component
 * 
 * Provides comprehensive quote presentation with:
 * - Complete configuration overview
 * - Visual model and material preview
 * - Delivery timeline and options
 * - Action buttons for proceeding
 * - Quote history and comparison
 * - Export and sharing capabilities
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Chip,
  Button,
  Divider,
  Paper,
  Avatar,
  IconButton,
  Tooltip,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/lab';
import {
  ShoppingCart as CartIcon,
  Share as ShareIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  History as HistoryIcon,
  LocalShipping as ShippingIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Print as PrintIcon,
  Email as EmailIcon,
  FileCopy as CopyIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import QRCode from 'react-qr-code';

import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectCurrentQuote,
  selectQuoteConfiguration,
  selectSelectedMaterial,
  selectQuoteHistory,
  selectConfigurationSummary,
  saveQuote,
  Quote,
  QuoteStatus,
} from '../../store/slices/quoteSlice';
import { selectAllUploads } from '../../store/slices/uploadSlice';

// Component props interface
interface QuoteSummaryProps {
  /** Quote to display */
  quote?: Quote;
  /** Whether to show action buttons */
  showActions?: boolean;
  /** Whether to show comparison options */
  showComparison?: boolean;
  /** Custom action handlers */
  onProceedToCheckout?: (quote: Quote) => void;
  onEditConfiguration?: () => void;
  onShareQuote?: (quote: Quote) => void;
  /** Custom styling */
  sx?: any;
}

// Delivery milestone interface
interface DeliveryMilestone {
  title: string;
  description: string;
  estimatedDate: Date;
  status: 'pending' | 'in-progress' | 'completed';
  icon: React.ReactNode;
}

// Share option interface
interface ShareOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
}

/**
 * Configuration Summary Card
 */
const ConfigurationSummaryCard: React.FC<{
  configuration: any;
  material: any;
  uploadFile?: File;
}> = ({ configuration, material, uploadFile }) => {
  const theme = useTheme();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Configuration Summary
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Material
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {material?.name || 'Not selected'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Color
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {configuration.selectedColor && material && (
                    <Box
                      sx={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: material.colors.find((c: any) => c.id === configuration.selectedColor)?.hexCode || '#ccc',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    />
                  )}
                  <Typography variant="body2" fontWeight="bold">
                    {configuration.selectedColor || 'Default'}
                  </Typography>
                </Stack>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Quantity
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {configuration.quantity}
                </Typography>
              </Box>
            </Stack>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Stack spacing={1}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Layer Height
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {configuration.printOptions.layerHeight}mm
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Infill
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {configuration.printOptions.infillPercentage}%
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Support
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {configuration.printOptions.supportGeneration}
                </Typography>
              </Box>
            </Stack>
          </Grid>
        </Grid>

        {uploadFile && (
          <Box mt={2} pt={2} borderTop={1} borderColor="divider">
            <Typography variant="caption" color="textSecondary">
              File
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <PrintIcon fontSize="small" />
              <Typography variant="body2" fontWeight="bold">
                {uploadFile.name}
              </Typography>
              <Chip
                label={`${(uploadFile.size / 1024 / 1024).toFixed(1)}MB`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Delivery Timeline Component
 */
const DeliveryTimeline: React.FC<{
  milestones: DeliveryMilestone[];
}> = ({ milestones }) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Delivery Timeline
        </Typography>
        
        <Timeline>
          {milestones.map((milestone, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent>
                <Typography variant="caption" color="textSecondary">
                  {milestone.estimatedDate.toLocaleDateString()}
                </Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot 
                  color={
                    milestone.status === 'completed' ? 'success' :
                    milestone.status === 'in-progress' ? 'primary' : 'grey'
                  }
                >
                  {milestone.icon}
                </TimelineDot>
                {index < milestones.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="body2" fontWeight="bold">
                  {milestone.title}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {milestone.description}
                </Typography>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
};

/**
 * Share Dialog Component
 */
const ShareDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  quote: Quote;
}> = ({ open, onClose, quote }) => {
  const [shareUrl] = useState(() => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/quote/${quote.id}`;
  });

  const shareOptions: ShareOption[] = [
    {
      id: 'email',
      label: 'Email',
      icon: <EmailIcon />,
      action: () => {
        window.location.href = `mailto:?subject=3D Print Quote&body=Check out this quote: ${shareUrl}`;
      },
    },
    {
      id: 'copy',
      label: 'Copy Link',
      icon: <CopyIcon />,
      action: () => {
        navigator.clipboard.writeText(shareUrl);
        // Show success message
      },
    },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Share Quote</DialogTitle>
      <DialogContent>
        <Stack spacing={3} alignItems="center">
          <Box textAlign="center">
            <QRCode value={shareUrl} size={150} />
            <Typography variant="caption" color="textSecondary" mt={1} display="block">
              Scan QR code to view quote
            </Typography>
          </Box>
          
          <Paper
            variant="outlined"
            sx={{ p: 2, width: '100%', backgroundColor: 'background.default' }}
          >
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              {shareUrl}
            </Typography>
          </Paper>
          
          <Stack direction="row" spacing={2}>
            {shareOptions.map(option => (
              <Button
                key={option.id}
                variant="outlined"
                startIcon={option.icon}
                onClick={option.action}
              >
                {option.label}
              </Button>
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Quote Summary Component
 * 
 * Main component implementing comprehensive quote presentation
 * with configuration overview, delivery timeline, and action options.
 */
export const QuoteSummary: React.FC<QuoteSummaryProps> = ({
  quote: externalQuote,
  showActions = true,
  showComparison = false,
  onProceedToCheckout,
  onEditConfiguration,
  onShareQuote,
  sx = {},
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const currentQuote = useAppSelector(selectCurrentQuote);
  const configuration = useAppSelector(selectQuoteConfiguration);
  const selectedMaterial = useAppSelector(selectSelectedMaterial);
  const quoteHistory = useAppSelector(selectQuoteHistory);
  const configSummary = useAppSelector(selectConfigurationSummary);
  const uploadItems = useAppSelector(selectAllUploads);

  // Local state
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Use external quote or current quote
  const quote = externalQuote || currentQuote;
  const uploadFile = uploadItems.find(item => item.id === configuration.uploadId)?.file;

  // Generate delivery milestones
  const deliveryMilestones = useMemo((): DeliveryMilestone[] => {
    if (!quote) return [];

    const now = new Date();
    const orderDate = new Date();
    const productionStart = new Date(orderDate);
    productionStart.setDate(productionStart.getDate() + 1);
    
    const printingComplete = new Date(productionStart);
    printingComplete.setDate(printingComplete.getDate() + 3);
    
    const postProcessingComplete = new Date(printingComplete);
    postProcessingComplete.setDate(postProcessingComplete.getDate() + 1);
    
    const shippingStart = new Date(postProcessingComplete);
    shippingStart.setDate(shippingStart.getDate() + 1);

    return [
      {
        title: 'Order Confirmed',
        description: 'Payment processed and order confirmed',
        estimatedDate: orderDate,
        status: quote.status === QuoteStatus.DRAFT ? 'pending' : 'completed',
        icon: <CheckIcon />,
      },
      {
        title: 'Production Started',
        description: 'File processed and printing begun',
        estimatedDate: productionStart,
        status: quote.status === QuoteStatus.IN_PRODUCTION ? 'in-progress' : 
               quote.status === QuoteStatus.COMPLETED ? 'completed' : 'pending',
        icon: <PrintIcon />,
      },
      {
        title: 'Printing Complete',
        description: '3D printing finished',
        estimatedDate: printingComplete,
        status: quote.status === QuoteStatus.COMPLETED ? 'completed' : 'pending',
        icon: <CheckIcon />,
      },
      {
        title: 'Post-Processing',
        description: 'Support removal and finishing',
        estimatedDate: postProcessingComplete,
        status: quote.status === QuoteStatus.COMPLETED ? 'completed' : 'pending',
        icon: <EditIcon />,
      },
      {
        title: 'Shipped',
        description: 'Package dispatched for delivery',
        estimatedDate: shippingStart,
        status: 'pending',
        icon: <ShippingIcon />,
      },
      {
        title: 'Delivered',
        description: 'Package delivered to your address',
        estimatedDate: quote.calculation.estimatedDelivery,
        status: 'pending',
        icon: <CheckIcon />,
      },
    ];
  }, [quote]);

  // Handle save quote
  const handleSaveQuote = useCallback(async () => {
    if (!quote) return;

    setIsSaving(true);
    try {
      await dispatch(saveQuote(quote)).unwrap();
      // Show success message
    } catch (error) {
      // Show error message
    } finally {
      setIsSaving(false);
    }
  }, [quote, dispatch]);

  // Handle share
  const handleShare = useCallback(() => {
    if (quote) {
      onShareQuote?.(quote);
      setShareDialogOpen(true);
    }
  }, [quote, onShareQuote]);

  // Handle export
  const handleExport = useCallback(() => {
    if (!quote) return;

    const exportData = {
      quote,
      configuration,
      material: selectedMaterial,
      generatedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quote-${quote.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [quote, configuration, selectedMaterial]);

  if (!quote) {
    return (
      <Alert severity="info" sx={sx}>
        No quote available. Please configure your print options and calculate a quote.
      </Alert>
    );
  }

  return (
    <Box sx={sx}>
      {/* Quote header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h4">
              Quote Summary
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Chip
                label={quote.status}
                color={
                  quote.status === QuoteStatus.APPROVED ? 'success' :
                  quote.status === QuoteStatus.PENDING ? 'warning' :
                  quote.status === QuoteStatus.REJECTED ? 'error' : 'default'
                }
                variant="outlined"
              />
              
              {showActions && (
                <>
                  <Tooltip title="Edit configuration">
                    <IconButton onClick={onEditConfiguration}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Share quote">
                    <IconButton onClick={handleShare}>
                      <ShareIcon />
                    </IconButton>
                  </Tooltip>
                  
                  <Tooltip title="Export quote">
                    <IconButton onClick={handleExport}>
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </>
              )}
            </Stack>
          </Stack>

          {/* Price overview */}
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="caption" color="textSecondary">
                  Total Price
                </Typography>
                <Typography variant="h3" color="primary">
                  ${quote.calculation.total.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Includes tax and delivery
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <ScheduleIcon color="action" />
                  <Typography variant="body2">
                    Estimated delivery: {quote.calculation.estimatedDelivery.toLocaleDateString()}
                  </Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <InfoIcon color="action" />
                  <Typography variant="body2">
                    Quote ID: {quote.id}
                  </Typography>
                </Stack>
                
                <Stack direction="row" alignItems="center" spacing={1}>
                  <HistoryIcon color="action" />
                  <Typography variant="body2">
                    Created: {quote.createdAt.toLocaleDateString()}
                  </Typography>
                </Stack>
              </Stack>
            </Grid>
          </Grid>

          {/* Action buttons */}
          {showActions && (
            <Stack direction="row" spacing={2} mt={3}>
              <Button
                variant="contained"
                size="large"
                startIcon={<CartIcon />}
                onClick={() => onProceedToCheckout?.(quote)}
                disabled={quote.status !== QuoteStatus.DRAFT && quote.status !== QuoteStatus.APPROVED}
              >
                Proceed to Checkout
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                onClick={handleSaveQuote}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Quote'}
              </Button>
              
              <Button
                variant="outlined"
                size="large"
                startIcon={<EditIcon />}
                onClick={onEditConfiguration}
              >
                Modify
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      {/* Content grid */}
      <Grid container spacing={3}>
        {/* Configuration summary */}
        <Grid item xs={12} md={6}>
          <ConfigurationSummaryCard
            configuration={configuration}
            material={selectedMaterial}
            uploadFile={uploadFile}
          />
        </Grid>

        {/* Delivery timeline */}
        <Grid item xs={12} md={6}>
          <DeliveryTimeline milestones={deliveryMilestones} />
        </Grid>

        {/* Price breakdown (existing PriceBreakdown component could be embedded here) */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Price Breakdown
              </Typography>
              
              <Stack spacing={1}>
                {quote.calculation.breakdown.map((item, index) => (
                  <Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2">
                        {item.category}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {item.description}
                      </Typography>
                    </Box>
                    <Typography variant="body2" fontWeight="bold">
                      ${item.total.toFixed(2)}
                    </Typography>
                  </Stack>
                ))}
                
                <Divider sx={{ my: 1 }} />
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Subtotal</Typography>
                  <Typography variant="body2">
                    ${quote.calculation.subtotal.toFixed(2)}
                  </Typography>
                </Stack>
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="body2">Tax</Typography>
                  <Typography variant="body2">
                    ${quote.calculation.taxes.toFixed(2)}
                  </Typography>
                </Stack>
                
                <Divider sx={{ my: 1 }} />
                
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="h6">Total</Typography>
                  <Typography variant="h6" color="primary">
                    ${quote.calculation.total.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Quote history comparison */}
        {showComparison && quoteHistory.length > 1 && (
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Quotes
                </Typography>
                
                <Stack spacing={1}>
                  {quoteHistory.slice(0, 3).map((historyQuote, index) => (
                    <Paper
                      key={historyQuote.id}
                      variant="outlined"
                      sx={{
                        p: 2,
                        backgroundColor: historyQuote.id === quote.id 
                          ? alpha(theme.palette.primary.main, 0.1)
                          : 'transparent',
                      }}
                    >
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {historyQuote.material.name} - {historyQuote.quantity}x
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {historyQuote.createdAt.toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight="bold">
                          ${historyQuote.calculation.total.toFixed(2)}
                        </Typography>
                      </Stack>
                    </Paper>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Share dialog */}
      <ShareDialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        quote={quote}
      />
    </Box>
  );
};

export default QuoteSummary;