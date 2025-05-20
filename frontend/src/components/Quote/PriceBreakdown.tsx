/**
 * Price Breakdown Component
 * 
 * Provides real-time cost calculation display with:
 * - Detailed cost breakdown by category
 * - Visual price composition charts
 * - Dynamic pricing updates
 * - Quantity discounts and surcharges
 * - Comparison with different configurations
 * - Export capabilities for quotes
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
  Alert,
  Collapse,
  Grid,
  alpha,
  useTheme,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Download as DownloadIcon,
  Compare as CompareIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppSelector, useAppDispatch } from '../../store/hooks';
import {
  selectCurrentQuote,
  selectQuoteConfiguration,
  selectSelectedMaterial,
  selectQuantity,
  selectUrgency,
  selectPostProcessing,
  selectIsCalculating,
  selectQuoteErrors,
  calculateQuote,
  QuoteCalculation,
  UrgencyLevel,
  PostProcessingService,
} from '../../store/slices/quoteSlice';

// Component props interface
interface PriceBreakdownProps {
  /** Whether to show detailed breakdown */
  showDetailed?: boolean;
  /** Whether to show charts */
  showCharts?: boolean;
  /** Whether to auto-calculate on changes */
  autoCalculate?: boolean;
  /** Custom change handler */
  onCalculate?: (calculation: QuoteCalculation) => void;
  /** Custom styling */
  sx?: any;
}

// Cost category interface for visualization
interface CostCategory {
  name: string;
  value: number;
  percentage: number;
  color: string;
  icon: React.ReactNode;
  description: string;
}

/**
 * Price Comparison Chart
 */
const PriceComparisonChart: React.FC<{
  currentPrice: number;
  quantities: number[];
  getPrice: (quantity: number) => number;
}> = ({ currentPrice, quantities, getPrice }) => {
  const data = quantities.map(qty => ({
    quantity: qty,
    price: getPrice(qty),
    savings: qty === 1 ? 0 : (getPrice(1) * qty - getPrice(qty)),
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <XAxis dataKey="quantity" />
        <YAxis />
        <RechartsTooltip 
          formatter={(value, name) => [
            name === 'price' ? `$${value}` : `$${value} saved`,
            name === 'price' ? 'Total Price' : 'Savings'
          ]}
        />
        <Bar dataKey="price" fill="#2196f3" />
        <Bar dataKey="savings" fill="#4caf50" />
      </BarChart>
    </ResponsiveContainer>
  );
};

/**
 * Cost Breakdown Pie Chart
 */
const CostBreakdownChart: React.FC<{ categories: CostCategory[] }> = ({ categories }) => {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={categories}
          cx="50%"
          cy="50%"
          innerRadius={40}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {categories.map((category, index) => (
            <Cell key={`cell-${index}`} fill={category.color} />
          ))}
        </Pie>
        <RechartsTooltip 
          formatter={(value) => [`$${value}`, 'Cost']}
          labelFormatter={(label) => categories.find(c => c.name === label)?.name}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * Price Breakdown Component
 * 
 * Main component implementing comprehensive price calculation display
 * with interactive charts, detailed breakdowns, and comparison tools.
 */
export const PriceBreakdown: React.FC<PriceBreakdownProps> = ({
  showDetailed = true,
  showCharts = true,
  autoCalculate = true,
  onCalculate,
  sx = {},
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const currentQuote = useAppSelector(selectCurrentQuote);
  const configuration = useAppSelector(selectQuoteConfiguration);
  const selectedMaterial = useAppSelector(selectSelectedMaterial);
  const quantity = useAppSelector(selectQuantity);
  const urgency = useAppSelector(selectUrgency);
  const postProcessing = useAppSelector(selectPostProcessing);
  const isCalculating = useAppSelector(selectIsCalculating);
  const calculationError = useAppSelector(selectQuoteErrors);

  // Local state
  const [showDetailedBreakdown, setShowDetailedBreakdown] = useState(showDetailed);

  // Generate cost categories for chart
  const costCategories = useMemo((): CostCategory[] => {
    if (!currentQuote || !currentQuote.calculation) return [];

    const calc = currentQuote.calculation;
    const total = calc.subtotal;
    
    // Create categories based on the actual breakdown from the quote
    const categories: CostCategory[] = [];
    
    // Map breakdown items to categories
    if (calc.materialCost > 0) {
      categories.push({
        name: 'Material',
        value: calc.materialCost * quantity,
        percentage: (calc.materialCost * quantity / total) * 100,
        color: theme.palette.primary.main,
        icon: <span>🧱</span>,
        description: 'Raw material costs',
      });
    }
    
    if (calc.laborCost > 0) {
      categories.push({
        name: 'Labor',
        value: calc.laborCost * quantity,
        percentage: (calc.laborCost * quantity / total) * 100,
        color: theme.palette.secondary.main,
        icon: <span>👨‍🔧</span>,
        description: 'Printing and handling',
      });
    }
    
    if (calc.setupCost > 0) {
      categories.push({
        name: 'Setup',
        value: calc.setupCost,
        percentage: (calc.setupCost / total) * 100,
        color: theme.palette.warning.main,
        icon: <span>⚙️</span>,
        description: 'Machine preparation',
      });
    }
    
    if (calc.postProcessingCost > 0) {
      categories.push({
        name: 'Post-Processing',
        value: calc.postProcessingCost,
        percentage: (calc.postProcessingCost / total) * 100,
        color: theme.palette.info.main,
        icon: <span>🔧</span>,
        description: 'Finishing touches',
      });
    }
    
    return categories;
  }, [currentQuote, quantity, theme]);

  // Handle manual calculation trigger
  const handleCalculate = useCallback(async () => {
    if (!configuration.uploadId || !selectedMaterial) {
      return;
    }

    try {
      const result = await dispatch(calculateQuote({
        uploadId: configuration.uploadId,
        configuration,
      })).unwrap();
      
      onCalculate?.(result.calculation);
    } catch (error) {
      console.error('Error calculating quote:', error);
    }
  }, [configuration, selectedMaterial, dispatch, onCalculate]);

  // Auto-calculate when configuration changes
  useEffect(() => {
    if (autoCalculate && configuration.uploadId && selectedMaterial) {
      handleCalculate();
    }
  }, [autoCalculate, configuration, selectedMaterial, handleCalculate]);

  // Export quote data
  const handleExport = useCallback(() => {
    if (!currentQuote) return;

    const exportData = {
      material: selectedMaterial?.name,
      quantity,
      calculation: currentQuote.calculation,
      configuration,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `quote-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [currentQuote, selectedMaterial, quantity, configuration]);

  if (!selectedMaterial) {
    return (
      <Alert severity="info" sx={sx}>
        Please select a material to see pricing information.
      </Alert>
    );
  }

  return (
    <Box sx={sx}>
      {/* Price summary */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h5">
              Price Estimate
            </Typography>
            
            <Stack direction="row" spacing={1}>
              <Tooltip title="Export quote">
                <IconButton onClick={handleExport} disabled={!currentQuote}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Recalculate">
                <IconButton onClick={handleCalculate} disabled={isCalculating}>
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          {isCalculating && (
            <Box mb={2}>
              <LinearProgress />
              <Typography variant="caption" color="textSecondary" mt={1}>
                Calculating precise quote...
              </Typography>
            </Box>
          )}

          {calculationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {calculationError}
            </Alert>
          )}

          {currentQuote && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="h3" color="primary">
                      ${currentQuote.calculation.total.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total for {quantity} item{quantity > 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={2}>
                    <Chip
                      label={`Subtotal: $${currentQuote.calculation.subtotal.toFixed(2)}`}
                      variant="outlined"
                    />
                    <Chip
                      label={`Tax: $${currentQuote.calculation.taxes.toFixed(2)}`}
                      variant="outlined"
                    />
                  </Stack>

                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography variant="body2" color="textSecondary">
                      Estimated delivery:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {new Date(currentQuote.calculation.estimatedDelivery).toLocaleDateString()}
                    </Typography>
                  </Stack>

                  {currentQuote.calculation.quantityDiscount > 0 && (
                    <Alert severity="success" icon={<SavingsIcon />}>
                      You're saving ${(currentQuote.calculation.quantityDiscount * quantity).toFixed(2)} with quantity discount!
                    </Alert>
                  )}
                </Stack>
              </Grid>

              {showCharts && costCategories.length > 0 && (
                <Grid item xs={12} md={6}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Cost Breakdown
                    </Typography>
                    <CostBreakdownChart categories={costCategories} />
                    <Stack spacing={1} mt={2}>
                      {costCategories.map(category => (
                        <Stack key={category.name} direction="row" alignItems="center" spacing={1}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: category.color,
                            }}
                          />
                          <Typography variant="caption" flex={1}>
                            {category.name}: ${category.value.toFixed(2)} ({category.percentage.toFixed(1)}%)
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}

          {!currentQuote && !isCalculating && (
            <Alert severity="info">
              Configure your print options and calculate a quote to see pricing details.
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Detailed breakdown */}
      {currentQuote && currentQuote.calculation && (
        <Card>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <Typography variant="h6">
                Detailed Breakdown
              </Typography>
              <IconButton
                size="small"
                onClick={() => setShowDetailedBreakdown(!showDetailedBreakdown)}
              >
                {showDetailedBreakdown ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Stack>

            <Collapse in={showDetailedBreakdown}>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Category</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentQuote.calculation.breakdown.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell component="th" scope="row">
                          {item.category}
                        </TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell align="right">
                          {item.quantity}
                        </TableCell>
                        <TableCell align="right">
                          ${item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: item.total < 0 ? 'success.main' : 'inherit',
                            fontWeight: item.total < 0 ? 'bold' : 'inherit',
                          }}
                        >
                          ${(item.total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Subtotal
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold">
                          ${currentQuote.calculation.subtotal.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4}>Tax</TableCell>
                      <TableCell align="right">
                        ${currentQuote.calculation.taxes.toFixed(2)}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell colSpan={4}>
                        <Typography variant="h6" fontWeight="bold">
                          Total
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="h6" fontWeight="bold" color="primary">
                          ${currentQuote.calculation.total.toFixed(2)}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default PriceBreakdown;