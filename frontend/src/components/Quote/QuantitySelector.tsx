/**
 * Quantity Selector Component
 * 
 * Provides batch pricing and quantity selection with:
 * - Visual quantity controls with increment/decrement
 * - Batch pricing tiers with discount visualization
 * - Savings calculator and comparison
 * - Bulk order recommendations
 * - Custom quantity input with validation
 * - Real-time price updates per quantity
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  IconButton,
  TextField,
  Slider,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Tooltip,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  ShoppingCart as CartIcon,
  Savings as SavingsIcon,
  TrendingDown as DiscountIcon,
  Info as InfoIcon,
  Calculate as CalculateIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setQuantity,
  selectQuantity,
  selectSelectedMaterial,
  selectCurrentQuote,
  Material,
} from '../../store/slices/quoteSlice';

// Component props interface
interface QuantitySelectorProps {
  /** Minimum quantity allowed */
  minQuantity?: number;
  /** Maximum quantity allowed */
  maxQuantity?: number;
  /** Predefined quantity options */
  quickOptions?: number[];
  /** Whether to show pricing tiers */
  showPricingTiers?: boolean;
  /** Whether to show savings calculator */
  showSavings?: boolean;
  /** Custom change handler */
  onChange?: (quantity: number) => void;
  /** Base price per unit calculation */
  calculateUnitPrice?: (quantity: number) => number;
  /** Custom styling */
  sx?: any;
}

// Pricing tier interface
interface PricingTier {
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountPercentage: number;
  savings: number;
  recommendationLevel: 'low' | 'medium' | 'high';
}

// Savings comparison interface
interface SavingsComparison {
  singleUnitPrice: number;
  currentQuantityPrice: number;
  totalSavings: number;
  discountPercentage: number;
  breakEvenQuantity?: number;
}

/**
 * Quantity Input Control
 */
const QuantityControl: React.FC<{
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  disabled?: boolean;
}> = ({ value, onChange, min = 1, max = 1000, disabled = false }) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(value.toString());
    }
  }, [value, isEditing]);

  const handleDecrement = useCallback(() => {
    if (value > min) {
      onChange(value - 1);
    }
  }, [value, min, onChange]);

  const handleIncrement = useCallback(() => {
    if (value < max) {
      onChange(value + 1);
    }
  }, [value, max, onChange]);

  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  }, []);

  const handleInputBlur = useCallback(() => {
    const numValue = parseInt(inputValue, 10);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
    setIsEditing(false);
  }, [inputValue, min, max, onChange]);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleKeyPress = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleInputBlur();
    }
  }, [handleInputBlur]);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <IconButton
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        size="small"
        sx={{ border: 1, borderColor: 'divider' }}
      >
        <RemoveIcon />
      </IconButton>
      
      <TextField
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={handleInputFocus}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        size="small"
        inputProps={{
          min,
          max,
          type: 'number',
          style: { textAlign: 'center', width: 60 },
        }}
        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1 } }}
      />
      
      <IconButton
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        size="small"
        sx={{ border: 1, borderColor: 'divider' }}
      >
        <AddIcon />
      </IconButton>
    </Stack>
  );
};

/**
 * Pricing Tier Visualization
 */
const PricingTierCard: React.FC<{
  tier: PricingTier;
  isSelected: boolean;
  isRecommended?: boolean;
  onClick: () => void;
}> = ({ tier, isSelected, isRecommended, onClick }) => {
  const theme = useTheme();

  const getRecommendationColor = (level: string) => {
    switch (level) {
      case 'high': return theme.palette.success.main;
      case 'medium': return theme.palette.warning.main;
      case 'low': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const getRecommendationLabel = (level: string) => {
    switch (level) {
      case 'high': return 'Best Value';
      case 'medium': return 'Good Value';
      case 'low': return 'Standard';
      default: return '';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        sx={{
          cursor: 'pointer',
          border: isSelected ? `2px solid ${theme.palette.primary.main}` : '1px solid',
          borderColor: isSelected ? theme.palette.primary.main : 'divider',
          position: 'relative',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            boxShadow: theme.shadows[4],
          },
          transition: theme.transitions.create(['border-color', 'box-shadow']),
        }}
        onClick={onClick}
      >
        {isRecommended && (
          <Chip
            label={getRecommendationLabel(tier.recommendationLevel)}
            color="success"
            size="small"
            sx={{
              position: 'absolute',
              top: -8,
              right: 16,
              zIndex: 1,
            }}
          />
        )}
        
        <CardContent sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold">
            {tier.quantity}
          </Typography>
          
          <Typography variant="caption" color="textSecondary">
            Units
          </Typography>
          
          <Box my={2}>
            <Typography variant="h6" color="primary">
              ${tier.totalPrice.toFixed(2)}
            </Typography>
            
            <Typography variant="body2" color="textSecondary">
              ${tier.unitPrice.toFixed(2)} each
            </Typography>
          </Box>
          
          {tier.discountPercentage > 0 && (
            <Stack alignItems="center" spacing={1}>
              <Chip
                label={`${tier.discountPercentage}% off`}
                color="success"
                size="small"
                icon={<DiscountIcon />}
              />
              
              <Typography variant="caption" color="success.main">
                Save ${tier.savings.toFixed(2)}
              </Typography>
            </Stack>
          )}
          
          {tier.discountPercentage === 0 && tier.quantity === 1 && (
            <Typography variant="caption" color="textSecondary">
              Base price
            </Typography>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

/**
 * Savings Calculator
 */
const SavingsCalculator: React.FC<{
  comparison: SavingsComparison;
  currentQuantity: number;
}> = ({ comparison, currentQuantity }) => {
  const theme = useTheme();

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Savings Calculator
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Single unit price:
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                ${comparison.singleUnitPrice.toFixed(2)}
              </Typography>
            </Stack>
            
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2">
                Current price per unit:
              </Typography>
              <Typography variant="body2" fontWeight="bold" color="primary">
                ${comparison.currentQuantityPrice.toFixed(2)}
              </Typography>
            </Stack>
          </Box>
          
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              backgroundColor: alpha(theme.palette.success.main, 0.1),
              border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
            }}
          >
            <Stack alignItems="center" spacing={1}>
              <SavingsIcon color="success" />
              <Typography variant="h6" color="success.main">
                ${comparison.totalSavings.toFixed(2)}
              </Typography>
              <Typography variant="body2" color="success.main">
                Total savings ({comparison.discountPercentage.toFixed(1)}% off)
              </Typography>
            </Stack>
          </Box>
          
          {comparison.breakEvenQuantity && comparison.breakEvenQuantity > currentQuantity && (
            <Alert severity="info" icon={<InfoIcon />}>
              Order {comparison.breakEvenQuantity} or more units to unlock the next discount tier.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

/**
 * Bulk Order Recommendations
 */
const BulkOrderRecommendations: React.FC<{
  material: Material;
  currentQuantity: number;
  onQuantitySelect: (quantity: number) => void;
}> = ({ material, currentQuantity, onQuantitySelect }) => {
  const recommendations = useMemo(() => {
    return material.pricing.volumeDiscounts.map(discount => ({
      quantity: discount.minimumQuantity,
      discountPercentage: discount.discountPercentage,
      recommendation: currentQuantity < discount.minimumQuantity ? 'upgrade' : 'current',
    }));
  }, [material, currentQuantity]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Order Discounts
      </Typography>
      
      <Stack spacing={1}>
        {recommendations.map((rec, index) => (
          <Paper
            key={index}
            variant="outlined"
            sx={{
              p: 2,
              backgroundColor: rec.recommendation === 'current' 
                ? alpha(rec.discountPercentage > 0 ? 'success.main' : 'primary.main', 0.05)
                : 'transparent',
              borderColor: rec.recommendation === 'current' 
                ? rec.discountPercentage > 0 ? 'success.main' : 'primary.main'
                : 'divider',
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Box>
                <Typography variant="body2" fontWeight="bold">
                  {rec.quantity}+ units
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {rec.discountPercentage}% discount
                </Typography>
              </Box>
              
              <Stack direction="row" alignItems="center" spacing={1}>
                {rec.recommendation === 'current' && rec.discountPercentage > 0 && (
                  <Chip
                    label="Applied"
                    color="success"
                    size="small"
                  />
                )}
                
                {rec.recommendation === 'upgrade' && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => onQuantitySelect(rec.quantity)}
                  >
                    Upgrade
                  </Button>
                )}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Box>
  );
};

/**
 * Quantity Selector Component
 * 
 * Main component implementing comprehensive quantity selection
 * with batch pricing, discounts, and savings visualization.
 */
export const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  minQuantity = 1,
  maxQuantity = 100,
  quickOptions = [1, 5, 10, 25, 50],
  showPricingTiers = true,
  showSavings = true,
  onChange,
  calculateUnitPrice,
  sx = {},
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const quantity = useAppSelector(selectQuantity);
  const selectedMaterial = useAppSelector(selectSelectedMaterial);
  const currentQuote = useAppSelector(selectCurrentQuote);

  // Local state
  const [customQuantity, setCustomQuantity] = useState(quantity);

  // Calculate unit price based on quantity
  const getUnitPrice = useCallback((qty: number): number => {
    if (calculateUnitPrice) {
      return calculateUnitPrice(qty);
    }

    if (!selectedMaterial) return 0;

    // Base calculation - would be more sophisticated in production
    const basePrice = 25.00; // Base price per unit
    
    // Apply volume discounts
    const applicableDiscounts = selectedMaterial.pricing.volumeDiscounts
      .filter(discount => qty >= discount.minimumQuantity)
      .sort((a, b) => b.discountPercentage - a.discountPercentage);
    
    if (applicableDiscounts.length > 0) {
      const discount = applicableDiscounts[0].discountPercentage;
      return basePrice * (1 - discount / 100);
    }
    
    return basePrice;
  }, [calculateUnitPrice, selectedMaterial]);

  // Generate pricing tiers
  const pricingTiers = useMemo((): PricingTier[] => {
    if (!selectedMaterial) return [];

    return quickOptions.map(qty => {
      const unitPrice = getUnitPrice(qty);
      const totalPrice = unitPrice * qty;
      const baseUnitPrice = getUnitPrice(1);
      const baseTotalPrice = baseUnitPrice * qty;
      const savings = baseTotalPrice - totalPrice;
      const discountPercentage = qty > 1 ? ((baseTotalPrice - totalPrice) / baseTotalPrice) * 100 : 0;
      
      // Determine recommendation level based on savings
      let recommendationLevel: PricingTier['recommendationLevel'] = 'low';
      if (discountPercentage >= 15) recommendationLevel = 'high';
      else if (discountPercentage >= 8) recommendationLevel = 'medium';

      return {
        quantity: qty,
        unitPrice,
        totalPrice,
        discountPercentage,
        savings,
        recommendationLevel,
      };
    });
  }, [selectedMaterial, quickOptions, getUnitPrice]);

  // Calculate savings comparison
  const savingsComparison = useMemo((): SavingsComparison => {
    const singleUnitPrice = getUnitPrice(1);
    const currentQuantityPrice = getUnitPrice(quantity);
    const totalSavings = (singleUnitPrice - currentQuantityPrice) * quantity;
    const discountPercentage = totalSavings > 0 ? ((totalSavings / (singleUnitPrice * quantity)) * 100) : 0;
    
    // Find next discount tier
    let breakEvenQuantity;
    if (selectedMaterial) {
      const nextDiscount = selectedMaterial.pricing.volumeDiscounts
        .find(discount => discount.minimumQuantity > quantity);
      breakEvenQuantity = nextDiscount?.minimumQuantity;
    }

    return {
      singleUnitPrice,
      currentQuantityPrice,
      totalSavings,
      discountPercentage,
      breakEvenQuantity,
    };
  }, [getUnitPrice, quantity, selectedMaterial]);

  // Handle quantity change
  const handleQuantityChange = useCallback((newQuantity: number) => {
    const clampedQuantity = Math.max(minQuantity, Math.min(maxQuantity, newQuantity));
    dispatch(setQuantity(clampedQuantity));
    onChange?.(clampedQuantity);
  }, [minQuantity, maxQuantity, dispatch, onChange]);

  // Handle custom quantity change
  const handleCustomQuantityChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(event.target.value, 10);
    if (!isNaN(value)) {
      setCustomQuantity(value);
    }
  }, []);

  // Handle custom quantity submit
  const handleCustomQuantitySubmit = useCallback(() => {
    handleQuantityChange(customQuantity);
  }, [customQuantity, handleQuantityChange]);

  if (!selectedMaterial) {
    return (
      <Alert severity="info" sx={sx}>
        Please select a material to configure quantity and pricing.
      </Alert>
    );
  }

  return (
    <Box sx={sx}>
      {/* Quantity control */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Select Quantity
          </Typography>
          
          <Stack spacing={3}>
            {/* Main quantity control */}
            <Box display="flex" alignItems="center" justifyContent="center">
              <QuantityControl
                value={quantity}
                onChange={handleQuantityChange}
                min={minQuantity}
                max={maxQuantity}
              />
            </Box>

            {/* Quantity slider for visual selection */}
            <Box>
              <Typography variant="body2" gutterBottom>
                Or drag to select: {quantity}
              </Typography>
              <Slider
                value={quantity}
                onChange={(_, value) => handleQuantityChange(value as number)}
                min={minQuantity}
                max={Math.min(maxQuantity, 100)}
                marks={quickOptions.slice(0, 5).map(opt => ({ value: opt, label: opt.toString() }))}
                valueLabelDisplay="auto"
              />
            </Box>

            {/* Quick options */}
            <Box>
              <Typography variant="body2" gutterBottom>
                Quick select:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {quickOptions.map(option => (
                  <Chip
                    key={option}
                    label={`${option}x`}
                    onClick={() => handleQuantityChange(option)}
                    variant={quantity === option ? 'filled' : 'outlined'}
                    color={quantity === option ? 'primary' : 'default'}
                    clickable
                  />
                ))}
              </Stack>
            </Box>

            {/* Custom quantity input */}
            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <TextField
                  label="Custom quantity"
                  type="number"
                  value={customQuantity}
                  onChange={handleCustomQuantityChange}
                  inputProps={{ min: minQuantity, max: maxQuantity }}
                  size="small"
                  sx={{ width: 150 }}
                />
                <Button
                  variant="outlined"
                  onClick={handleCustomQuantitySubmit}
                  startIcon={<CalculateIcon />}
                >
                  Apply
                </Button>
              </Stack>
            </Box>
          </Stack>
        </CardContent>
      </Card>

      {/* Pricing tiers */}
      {showPricingTiers && pricingTiers.length > 0 && (
        <Box mb={3}>
          <Typography variant="h6" gutterBottom>
            Pricing Tiers
          </Typography>
          
          <Grid container spacing={2}>
            {pricingTiers.map((tier, index) => (
              <Grid item xs={6} sm={4} md={2.4} key={tier.quantity}>
                <PricingTierCard
                  tier={tier}
                  isSelected={quantity === tier.quantity}
                  isRecommended={tier.recommendationLevel === 'high'}
                  onClick={() => handleQuantityChange(tier.quantity)}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* Content grid */}
      <Grid container spacing={3}>
        {/* Savings calculator */}
        {showSavings && savingsComparison.totalSavings > 0 && (
          <Grid item xs={12} md={6}>
            <SavingsCalculator
              comparison={savingsComparison}
              currentQuantity={quantity}
            />
          </Grid>
        )}

        {/* Bulk order recommendations */}
        <Grid item xs={12} md={6}>
          <BulkOrderRecommendations
            material={selectedMaterial}
            currentQuantity={quantity}
            onQuantitySelect={handleQuantityChange}
          />
        </Grid>

        {/* Order summary */}
        <Grid item xs={12}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      {quantity}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Units
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      ${getUnitPrice(quantity).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Per Unit
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <Box textAlign="center">
                    <Typography variant="h4" color="primary">
                      ${(getUnitPrice(quantity) * quantity).toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      Total
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              
              {savingsComparison.totalSavings > 0 && (
                <Alert severity="success" sx={{ mt: 2 }} icon={<SavingsIcon />}>
                  You're saving ${savingsComparison.totalSavings.toFixed(2)} compared to individual pricing!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuantitySelector;