/**
 * Material Selector Component
 * 
 * Provides dynamic material selection interface with:
 * - Material library with properties and pricing
 * - Visual material previews and information
 * - Real-time price calculation integration
 * - Search and filtering capabilities
 * - Material comparison features
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Stack,
  Avatar,
  IconButton,
  Tooltip,
  Collapse,
  Alert,
  alpha,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Compare as CompareIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setMaterial,
  selectSelectedMaterial,
  selectQuoteConfiguration,
  fetchMaterials,
} from '../../store/slices/quoteSlice';

// Material properties interface
export interface Material {
  id: string;
  name: string;
  category: MaterialCategory;
  type: MaterialType;
  properties: MaterialProperties;
  pricing: MaterialPricing;
  colors: MaterialColor[];
  description: string;
  advantages: string[];
  disadvantages: string[];
  applications: string[];
  specifications: MaterialSpecifications;
  popularity: number;
  isRecommended: boolean;
  image?: string;
}

export interface MaterialProperties {
  strength: number; // 1-10 scale
  flexibility: number; // 1-10 scale
  detail: number; // 1-10 scale
  durability: number; // 1-10 scale
  temperature: number; // Max temperature in °C
  postProcessing: PostProcessingOptions[];
}

export interface MaterialPricing {
  basePrice: number; // Price per gram
  minimumQuantity: number; // Minimum order quantity in grams
  volumeDiscounts: VolumeDiscount[];
  rushSurcharge: number; // Percentage
  colorSurcharge: Record<string, number>; // Color-specific surcharges
}

export interface MaterialColor {
  id: string;
  name: string;
  hexCode: string;
  availability: 'in-stock' | 'low-stock' | 'out-of-stock' | 'custom';
  surcharge: number;
}

export interface MaterialSpecifications {
  layerHeight: {
    min: number;
    max: number;
    recommended: number;
  };
  infillRange: {
    min: number;
    max: number;
    recommended: number;
  };
  supportRequired: boolean;
  printSpeed: number; // mm/s
  bedTemperature: number; // °C
  extruderTemperature: number; // °C;
}

export interface VolumeDiscount {
  minimumQuantity: number; // in grams
  discountPercentage: number;
}

export enum MaterialCategory {
  PLASTIC = 'plastic',
  RESIN = 'resin',
  METAL = 'metal',
  COMPOSITE = 'composite',
  SPECIALTY = 'specialty',
}

export enum MaterialType {
  PLA = 'pla',
  ABS = 'abs',
  PETG = 'petg',
  TPU = 'tpu',
  ASA = 'asa',
  WOOD_FILL = 'wood-fill',
  METAL_FILL = 'metal-fill',
  STANDARD_RESIN = 'standard-resin',
  TOUGH_RESIN = 'tough-resin',
  FLEXIBLE_RESIN = 'flexible-resin',
  TRANSPARENT_RESIN = 'transparent-resin',
}

export enum PostProcessingOptions {
  SANDING = 'sanding',
  PAINTING = 'painting',
  SMOOTHING = 'smoothing',
  DRILLING = 'drilling',
  THREADING = 'threading',
  SUPPORT_REMOVAL = 'support-removal',
}

// Component props interface
interface MaterialSelectorProps {
  /** Whether to show comparison mode */
  showComparison?: boolean;
  /** Maximum number of materials to compare */
  maxComparisons?: number;
  /** Custom filter options */
  customFilters?: string[];
  /** Callback when material is selected */
  onMaterialSelect?: (material: Material) => void;
  /** Callback when comparison is requested */
  onCompare?: (materials: Material[]) => void;
}

// Filter interface
interface MaterialFilters {
  search: string;
  category: MaterialCategory | 'all';
  type: MaterialType | 'all';
  priceRange: [number, number];
  strengthRange: [number, number];
  flexibilityRange: [number, number];
  detailRange: [number, number];
  showRecommended: boolean;
  inStockOnly: boolean;
}

/**
 * Material Selector Component
 * 
 * Provides comprehensive material selection interface with filtering,
 * search, comparison, and detailed material information.
 */
export const MaterialSelector: React.FC<MaterialSelectorProps> = ({
  showComparison = false,
  maxComparisons = 3,
  customFilters = [],
  onMaterialSelect,
  onCompare,
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const selectedMaterial = useAppSelector(selectSelectedMaterial);
  const quoteConfiguration = useAppSelector(selectQuoteConfiguration);

  // Local state
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<MaterialFilters>({
    search: '',
    category: 'all',
    type: 'all',
    priceRange: [0, 0.1],
    strengthRange: [1, 10],
    flexibilityRange: [1, 10],
    detailRange: [1, 10],
    showRecommended: false,
    inStockOnly: false,
  });
  const [comparisonMaterials, setComparisonMaterials] = useState<Material[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  
  // Fetch materials from API
  useEffect(() => {
    const fetchMaterialsData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('MaterialSelector: Fetching materials via Redux');
        // Dispatch the fetchMaterials thunk action to get materials from the API
        const resultAction = await dispatch(fetchMaterials());
        const result = resultAction.payload;
        
        if (result && Array.isArray(result)) {
          console.log('MaterialSelector: Materials fetched successfully:', result.length);
          // Set materials directly from API response
          setMaterials(result);
          
          // If no material is selected yet and we have materials, select the first one
          if (!selectedMaterial && result.length > 0) {
            dispatch(setMaterial(result[0]));
          }
        } else {
          console.warn('MaterialSelector: Unexpected API response format');
          setError('Failed to get materials. The API response format is incorrect.');
          setMaterials([]);
        }
      } catch (err) {
        console.error('MaterialSelector: Error fetching materials:', err);
        setError('Failed to fetch materials from the API. Please try again later.');
        setMaterials([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialsData();
  }, [dispatch, selectedMaterial]);

  // Filter materials based on current filters
  const filteredMaterials = useMemo(() => {
    return materials.filter(material => {
      // Search filter
      if (filters.search && !material.name.toLowerCase().includes(filters.search.toLowerCase()) &&
          !material.description.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category !== 'all' && material.category !== filters.category) {
        return false;
      }

      // Type filter
      if (filters.type !== 'all' && material.type !== filters.type) {
        return false;
      }

      // Price range filter
      if (material.pricing && material.pricing.basePrice) {
        if (material.pricing.basePrice < filters.priceRange[0] || 
            material.pricing.basePrice > filters.priceRange[1]) {
          return false;
        }
      }

      // Property range filters
      if (material.properties) {
        if (material.properties.strength && (
            material.properties.strength < filters.strengthRange[0] || 
            material.properties.strength > filters.strengthRange[1])) {
          return false;
        }

        if (material.properties.flexibility && (
            material.properties.flexibility < filters.flexibilityRange[0] || 
            material.properties.flexibility > filters.flexibilityRange[1])) {
          return false;
        }

        if (material.properties.detail && (
            material.properties.detail < filters.detailRange[0] || 
            material.properties.detail > filters.detailRange[1])) {
          return false;
        }
      }

      // Recommended filter
      if (filters.showRecommended && !material.isRecommended) {
        return false;
      }

      // In-stock filter
      if (filters.inStockOnly && material.colors && Array.isArray(material.colors) && 
          !material.colors.some(color => color.availability === 'in-stock')) {
        return false;
      }

      return true;
    });
  }, [materials, filters]);

  // Handle material selection
  const handleMaterialSelect = useCallback((material: Material) => {
    dispatch(setMaterial(material));
    onMaterialSelect?.(material);
  }, [dispatch, onMaterialSelect]);

  // Handle adding to comparison
  const handleAddToComparison = useCallback((material: Material) => {
    if (comparisonMaterials.length < maxComparisons && 
        !comparisonMaterials.find(m => m.id === material.id)) {
      setComparisonMaterials(prev => [...prev, material]);
    }
  }, [comparisonMaterials, maxComparisons]);

  // Handle removing from comparison
  const handleRemoveFromComparison = useCallback((materialId: string) => {
    setComparisonMaterials(prev => prev.filter(m => m.id !== materialId));
  }, []);

  // Handle comparison
  const handleCompare = useCallback(() => {
    if (comparisonMaterials.length >= 2) {
      onCompare?.(comparisonMaterials);
    }
  }, [comparisonMaterials, onCompare]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback((materialId: string) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  }, []);

  // Format price for display
  const formatPrice = useCallback((price: number): string => {
    return `$${price.toFixed(3)}/g`;
  }, []);

  // Get property color
  const getPropertyColor = useCallback((value: number): string => {
    if (value >= 8) return theme.palette.success.main;
    if (value >= 6) return theme.palette.warning.main;
    return theme.palette.error.main;
  }, [theme]);

  // Get availability color
  const getAvailabilityColor = useCallback((availability: string): string => {
    switch (availability) {
      case 'in-stock': return theme.palette.success.main;
      case 'low-stock': return theme.palette.warning.main;
      case 'out-of-stock': return theme.palette.error.main;
      default: return theme.palette.info.main;
    }
  }, [theme]);

  // Create placeholders for materials with partial data
  const renderMaterialCard = (material: Material) => {
    const materialColors = material.colors && Array.isArray(material.colors) ? material.colors : [];
    const materialProperties = material.properties || { strength: 5, flexibility: 5, detail: 5, durability: 5 };
    
    return (
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          border: selectedMaterial?.id === material.id 
            ? `2px solid ${theme.palette.primary.main}` 
            : '1px solid',
          borderColor: selectedMaterial?.id === material.id 
            ? theme.palette.primary.main 
            : 'divider',
          '&:hover': {
            borderColor: theme.palette.primary.main,
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[6],
          },
          transition: theme.transitions.create([
            'border-color',
            'transform',
            'box-shadow',
          ]),
        }}
        onClick={() => handleMaterialSelect(material)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          {/* Header */}
          <Stack direction="row" alignItems="flex-start" spacing={1} mb={2}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 40,
                height: 40,
              }}
            >
              {material.name.substring(0, 2)}
            </Avatar>
            
            <Box flexGrow={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="h6">
                  {material.name}
                </Typography>
                {material.isRecommended && (
                  <Chip 
                    label="Recommended" 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                )}
              </Stack>
              <Typography variant="body2" color="textSecondary">
                {material.category} {material.pricing && material.pricing.basePrice ? `· ${formatPrice(material.pricing.basePrice)}` : ''}
              </Typography>
            </Box>

            <Stack direction="row" spacing={0.5}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleFavoriteToggle(material.id);
                }}
              >
                {favoriteIds.has(material.id) ? (
                  <StarIcon color="primary" fontSize="small" />
                ) : (
                  <StarBorderIcon fontSize="small" />
                )}
              </IconButton>

              {showComparison && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToComparison(material);
                  }}
                  disabled={comparisonMaterials.length >= maxComparisons ||
                           comparisonMaterials.some(m => m.id === material.id)}
                >
                  <CompareIcon fontSize="small" />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {/* Description */}
          <Typography variant="body2" color="textSecondary" paragraph>
            {material.description || `${material.name} for 3D printing with good quality and reliability.`}
          </Typography>

          {/* Properties */}
          {materialProperties && (
            <Box mb={2}>
              <Grid container spacing={1}>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption">Strength</Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getPropertyColor(materialProperties.strength || 5),
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {materialProperties.strength || 5}/10
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption">Flexibility</Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getPropertyColor(materialProperties.flexibility || 5),
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {materialProperties.flexibility || 5}/10
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption">Detail</Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getPropertyColor(materialProperties.detail || 5),
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {materialProperties.detail || 5}/10
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={6}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Typography variant="caption">Durability</Typography>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: getPropertyColor(materialProperties.durability || 5),
                      }}
                    />
                    <Typography variant="caption" fontWeight="bold">
                      {materialProperties.durability || 5}/10
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Colors */}
          <Box>
            <Typography variant="caption" color="textSecondary" gutterBottom>
              Available Colors:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {materialColors.slice(0, 5).map(color => (
                <Tooltip 
                  key={color.id} 
                  title={`${color.name} - ${color.availability.replace('-', ' ')}`}
                >
                  <Box
                    sx={{
                      width: 20,
                      height: 20,
                      borderRadius: '50%',
                      bgcolor: color.hexCode,
                      border: `2px solid ${alpha(getAvailabilityColor(color.availability), 0.5)}`,
                      cursor: 'pointer',
                    }}
                  />
                </Tooltip>
              ))}
              {materialColors.length === 0 && (
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    bgcolor: '#ccc',
                    border: '2px solid #aaa',
                  }}
                />
              )}
              {materialColors.length > 5 && (
                <Typography variant="caption" color="textSecondary">
                  +{materialColors.length - 5} more
                </Typography>
              )}
            </Stack>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Search bar */}
            <TextField
              fullWidth
              placeholder="Search materials..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />

            {/* Quick filters */}
            <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
              <Chip
                label="Recommended"
                variant={filters.showRecommended ? 'filled' : 'outlined'}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  showRecommended: !prev.showRecommended 
                }))}
                color="primary"
              />
              <Chip
                label="In Stock"
                variant={filters.inStockOnly ? 'filled' : 'outlined'}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  inStockOnly: !prev.inStockOnly 
                }))}
                color="success"
              />
              <Chip
                label={`${filteredMaterials.length} materials`}
                variant="outlined"
              />
              
              <Box flexGrow={1} />
              
              <Button
                startIcon={<FilterIcon />}
                endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                onClick={() => setShowFilters(!showFilters)}
                variant="outlined"
              >
                Filters
              </Button>
            </Stack>

            {/* Advanced filters */}
            <Collapse in={showFilters}>
              <Box pt={2}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={filters.category}
                        onChange={(e) => setFilters(prev => ({ 
                          ...prev, 
                          category: e.target.value as MaterialCategory | 'all' 
                        }))}
                      >
                        <MenuItem value="all">All Categories</MenuItem>
                        {Object.values(MaterialCategory).map(category => (
                          <MenuItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" gutterBottom>
                      Price Range: {formatPrice(filters.priceRange[0])} - {formatPrice(filters.priceRange[1])}
                    </Typography>
                    <Slider
                      value={filters.priceRange}
                      onChange={(_, newValue) => setFilters(prev => ({ 
                        ...prev, 
                        priceRange: newValue as [number, number] 
                      }))}
                      valueLabelDisplay="auto"
                      min={0}
                      max={0.1}
                      step={0.005}
                      valueLabelFormat={formatPrice}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" gutterBottom>
                      Strength: {filters.strengthRange[0]} - {filters.strengthRange[1]}
                    </Typography>
                    <Slider
                      value={filters.strengthRange}
                      onChange={(_, newValue) => setFilters(prev => ({ 
                        ...prev, 
                        strengthRange: newValue as [number, number] 
                      }))}
                      valueLabelDisplay="auto"
                      min={1}
                      max={10}
                      step={1}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" gutterBottom>
                      Detail: {filters.detailRange[0]} - {filters.detailRange[1]}
                    </Typography>
                    <Slider
                      value={filters.detailRange}
                      onChange={(_, newValue) => setFilters(prev => ({ 
                        ...prev, 
                        detailRange: newValue as [number, number] 
                      }))}
                      valueLabelDisplay="auto"
                      min={1}
                      max={10}
                      step={1}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Collapse>
          </Stack>
        </CardContent>
      </Card>

      {/* Loading state */}
      {loading && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          minHeight={300}
        >
          <CircularProgress />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading materials...
          </Typography>
        </Box>
      )}

      {/* Error message */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Comparison panel */}
      {showComparison && comparisonMaterials.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Typography variant="h6">
                Material Comparison ({comparisonMaterials.length}/{maxComparisons})
              </Typography>
              <Button
                variant="contained"
                startIcon={<CompareIcon />}
                onClick={handleCompare}
                disabled={comparisonMaterials.length < 2}
              >
                Compare
              </Button>
              <Button
                variant="outlined"
                onClick={() => setComparisonMaterials([])}
              >
                Clear All
              </Button>
            </Stack>
            
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {comparisonMaterials.map(material => (
                <Chip
                  key={material.id}
                  label={material.name}
                  onDelete={() => handleRemoveFromComparison(material.id)}
                  color="primary"
                  variant="outlined"
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Materials grid */}
      <Grid container spacing={3}>
        <AnimatePresence>
          {filteredMaterials.map(material => (
            <Grid item xs={12} sm={6} md={4} key={material.id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderMaterialCard(material)}
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {/* No results message */}
      {!loading && filteredMaterials.length === 0 && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight={300}
        >
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No materials found
          </Typography>
          <Typography variant="body2" color="textSecondary" textAlign="center">
            Try adjusting your search criteria or filters to find materials.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setFilters({
              search: '',
              category: 'all',
              type: 'all',
              priceRange: [0, 0.1],
              strengthRange: [1, 10],
              flexibilityRange: [1, 10],
              detailRange: [1, 10],
              showRecommended: false,
              inStockOnly: false,
            })}
            sx={{ mt: 2 }}
          >
            Clear Filters
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MaterialSelector;