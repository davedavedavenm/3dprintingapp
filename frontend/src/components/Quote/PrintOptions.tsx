/**
 * Print Options Component
 * 
 * Provides comprehensive print settings configuration with:
 * - Layer height selection and preview
 * - Infill percentage with visual representation
 * - Support generation options
 * - Advanced printing parameters
 * - Preset configurations
 * - Real-time quality and cost impact indicators
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Button,
  Chip,
  IconButton,
  Tooltip,
  Collapse,
  Alert,
  Stack,
  Divider,
  Paper,
  LinearProgress,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Tune as TuneIcon,
  Speed as SpeedIcon,
  Timeline as TimelineIcon,
  Palette as PaletteIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Save as SaveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setPrintOptions,
  applyPreset,
  addCustomPreset,
  selectPrintOptions,
  selectSelectedMaterial,
  selectPresets,
  PrintOptions as PrintOptionsType,
  SupportType,
  PrintOptionsPreset,
} from '../../store/slices/quoteSlice';

// Component props interface
interface PrintOptionsProps {
  /** Whether to show advanced options */
  showAdvanced?: boolean;
  /** Custom change handler */
  onChange?: (options: PrintOptionsType) => void;
  /** Whether to show preset management */
  showPresets?: boolean;
  /** Custom styling */
  sx?: any;
}

// Quality impact calculation
interface QualityImpact {
  printTime: 'faster' | 'standard' | 'slower';
  surfaceQuality: 'low' | 'medium' | 'high' | 'ultra';
  strength: 'low' | 'medium' | 'high';
  cost: 'lower' | 'standard' | 'higher';
  recommendation: string;
}

// Infill patterns
interface InfillPattern {
  id: string;
  name: string;
  description: string;
  strength: number;
  printTime: number;
  materialUsage: number;
  icon: string;
}

const infillPatterns: InfillPattern[] = [
  {
    id: 'grid',
    name: 'Grid',
    description: 'Simple crosshatch pattern, good for general use',
    strength: 7,
    printTime: 8,
    materialUsage: 8,
    icon: '⊞',
  },
  {
    id: 'triangular',
    name: 'Triangular',
    description: 'Strong triangular pattern for structural parts',
    strength: 9,
    printTime: 7,
    materialUsage: 7,
    icon: '△',
  },
  {
    id: 'cubic',
    name: 'Cubic',
    description: '3D pattern with excellent strength in all directions',
    strength: 10,
    printTime: 6,
    materialUsage: 6,
    icon: '⬜',
  },
  {
    id: 'gyroid',
    name: 'Gyroid',
    description: 'Organic pattern with minimal material usage',
    strength: 6,
    printTime: 9,
    materialUsage: 9,
    icon: '〰',
  },
  {
    id: 'honeycomb',
    name: 'Honeycomb',
    description: 'Hexagonal pattern balancing strength and material usage',
    strength: 8,
    printTime: 7,
    materialUsage: 8,
    icon: '⬢',
  },
];

/**
 * Visual Layer Height Indicator
 */
const LayerHeightIndicator: React.FC<{ layerHeight: number }> = ({ layerHeight }) => {
  const theme = useTheme();
  
  // Calculate visual representation
  const layerCount = Math.round(10 / layerHeight);
  const layers = Array.from({ length: Math.min(layerCount, 20) }, (_, i) => i);
  
  return (
    <Box
      sx={{
        width: 60,
        height: 80,
        position: 'relative',
        backgroundColor: alpha(theme.palette.primary.main, 0.1),
        borderRadius: 1,
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      }}
    >
      {layers.map((layer) => (
        <Box
          key={layer}
          sx={{
            position: 'absolute',
            bottom: layer * (layerHeight * 8),
            left: 0,
            right: 0,
            height: Math.max(1, layerHeight * 8),
            backgroundColor: layer % 2 === 0 
              ? theme.palette.primary.main 
              : alpha(theme.palette.primary.main, 0.7),
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        />
      ))}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 4,
          left: 4,
          color: 'white',
          fontWeight: 'bold',
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
        }}
      >
        {layerHeight}mm
      </Typography>
    </Box>
  );
};

/**
 * Visual Infill Indicator
 */
const InfillIndicator: React.FC<{ 
  percentage: number; 
  pattern: string;
}> = ({ percentage, pattern }) => {
  const theme = useTheme();
  const selectedPattern = infillPatterns.find(p => p.id === pattern) || infillPatterns[0];
  
  return (
    <Box
      sx={{
        width: 60,
        height: 60,
        position: 'relative',
        backgroundColor: alpha(theme.palette.background.paper, 0.5),
        border: `2px solid ${theme.palette.divider}`,
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Background pattern representation */}
      <Box
        sx={{
          position: 'absolute',
          width: `${percentage}%`,
          height: `${percentage}%`,
          backgroundColor: alpha(theme.palette.primary.main, 0.7),
          borderRadius: 1,
        }}
      />
      
      {/* Pattern icon */}
      <Typography
        variant="h6"
        sx={{
          color: theme.palette.primary.main,
          fontWeight: 'bold',
          zIndex: 1,
        }}
      >
        {selectedPattern.icon}
      </Typography>
      
      {/* Percentage label */}
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 2,
          right: 4,
          color: theme.palette.text.secondary,
          fontWeight: 'bold',
          fontSize: '0.7rem',
        }}
      >
        {percentage}%
      </Typography>
    </Box>
  );
};

/**
 * Quality Impact Visualization
 */
const QualityImpactCard: React.FC<{ impact: QualityImpact }> = ({ impact }) => {
  const theme = useTheme();
  
  const getImpactColor = (value: string, positive: string[]) => {
    if (positive.includes(value)) return theme.palette.success.main;
    if (value === 'standard' || value === 'medium') return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        borderRadius: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
      }}
    >
      <Typography variant="subtitle2" gutterBottom>
        Quality Impact
      </Typography>
      
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TimelineIcon
              fontSize="small"
              sx={{ color: getImpactColor(impact.printTime, ['faster']) }}
            />
            <Typography variant="caption">
              Print Time: {impact.printTime}
            </Typography>
          </Stack>
        </Grid>
        
        <Grid item xs={6}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PaletteIcon
              fontSize="small"
              sx={{ color: getImpactColor(impact.surfaceQuality, ['high', 'ultra']) }}
            />
            <Typography variant="caption">
              Quality: {impact.surfaceQuality}
            </Typography>
          </Stack>
        </Grid>
        
        <Grid item xs={6}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SpeedIcon
              fontSize="small"
              sx={{ color: getImpactColor(impact.strength, ['high']) }}
            />
            <Typography variant="caption">
              Strength: {impact.strength}
            </Typography>
          </Stack>
        </Grid>
        
        <Grid item xs={6}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <TuneIcon
              fontSize="small"
              sx={{ color: getImpactColor(impact.cost, ['lower', 'standard']) }}
            />
            <Typography variant="caption">
              Cost: {impact.cost}
            </Typography>
          </Stack>
        </Grid>
      </Grid>
      
      <Typography
        variant="caption"
        color="textSecondary"
        sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}
      >
        {impact.recommendation}
      </Typography>
    </Paper>
  );
};

// Default presets if the Redux state presets are not available
const defaultPresets: PrintOptionsPreset[] = [
  {
    id: 'high-quality',
    name: 'High Quality',
    description: 'Best surface finish and detail resolution',
    category: 'quality',
    options: {
      layerHeight: 0.1,
      infillPercentage: 30,
      supportGeneration: SupportType.STANDARD,
      printSpeed: 30,
      shellThickness: 4,
      topBottomLayers: 6,
      brimWidth: 5,
      raftEnabled: false,
      adaptiveLayers: true,
    },
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced quality and speed',
    category: 'quality',
    options: {
      layerHeight: 0.2,
      infillPercentage: 20,
      supportGeneration: SupportType.STANDARD,
      printSpeed: 50,
      shellThickness: 3,
      topBottomLayers: 4,
      brimWidth: 5,
      raftEnabled: false,
      adaptiveLayers: false,
    },
    isDefault: true,
  },
  {
    id: 'fast-print',
    name: 'Fast Print',
    description: 'Quick turnaround, good quality',
    category: 'speed',
    options: {
      layerHeight: 0.3,
      infillPercentage: 15,
      supportGeneration: SupportType.MINIMAL,
      printSpeed: 80,
      shellThickness: 2,
      topBottomLayers: 3,
      brimWidth: 5,
      raftEnabled: false,
      adaptiveLayers: false,
    },
  },
];

/**
 * Print Options Component
 * 
 * Main component implementing comprehensive print options configuration
 * with real-time quality impact analysis and preset management.
 */
export const PrintOptions: React.FC<PrintOptionsProps> = ({
  showAdvanced = false,
  onChange,
  showPresets = true,
  sx = {},
}) => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  
  // Redux state
  const printOptions = useAppSelector(selectPrintOptions);
  const selectedMaterial = useAppSelector(selectSelectedMaterial);
  const reduxPresets = useAppSelector(selectPresets);

  // Use default presets if Redux presets are not available
  const presets = reduxPresets || defaultPresets;

  // Local state
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(showAdvanced);
  const [selectedInfillPattern, setSelectedInfillPattern] = useState('grid');
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [customPresetName, setCustomPresetName] = useState('');

  // Calculate quality impact based on current settings
  const qualityImpact = useMemo((): QualityImpact => {
    const { layerHeight, infillPercentage, printSpeed } = printOptions;
    
    // Calculate print time impact
    let printTime: QualityImpact['printTime'] = 'standard';
    if (layerHeight >= 0.25 && printSpeed >= 60) printTime = 'faster';
    else if (layerHeight <= 0.15 && printSpeed <= 40) printTime = 'slower';
    
    // Calculate surface quality
    let surfaceQuality: QualityImpact['surfaceQuality'] = 'medium';
    if (layerHeight <= 0.1) surfaceQuality = 'ultra';
    else if (layerHeight <= 0.15) surfaceQuality = 'high';
    else if (layerHeight >= 0.3) surfaceQuality = 'low';
    
    // Calculate strength
    let strength: QualityImpact['strength'] = 'medium';
    if (infillPercentage >= 50 && printOptions.shellThickness >= 4) strength = 'high';
    else if (infillPercentage <= 15 || printOptions.shellThickness <= 2) strength = 'low';
    
    // Calculate cost impact
    let cost: QualityImpact['cost'] = 'standard';
    if (layerHeight >= 0.25 && infillPercentage <= 20) cost = 'lower';
    else if (layerHeight <= 0.1 || infillPercentage >= 40) cost = 'higher';
    
    // Generate recommendation
    let recommendation = 'Balanced settings for general purposes.';
    if (surfaceQuality === 'ultra') {
      recommendation = 'Excellent for detailed models and prototypes.';
    } else if (printTime === 'faster') {
      recommendation = 'Good for rapid prototyping and testing.';
    } else if (strength === 'high') {
      recommendation = 'Ideal for functional and mechanical parts.';
    } else if (cost === 'lower') {
      recommendation = 'Cost-effective option for large or simple prints.';
    }
    
    return {
      printTime,
      surfaceQuality,
      strength,
      cost,
      recommendation,
    };
  }, [printOptions]);

  // Handle option changes
  const handleOptionChange = useCallback((
    key: keyof PrintOptionsType,
    value: any
  ) => {
    const newOptions = { ...printOptions, [key]: value };
    dispatch(setPrintOptions({ [key]: value }));
    onChange?.(newOptions);
  }, [printOptions, dispatch, onChange]);

  // Handle preset application
  const handleApplyPreset = useCallback((presetId: string) => {
    dispatch(applyPreset(presetId));
  }, [dispatch]);

  // Handle custom preset save
  const handleSavePreset = useCallback(() => {
    if (customPresetName.trim()) {
      const newPreset: PrintOptionsPreset = {
        id: `custom-${Date.now()}`,
        name: customPresetName.trim(),
        description: 'Custom preset',
        category: 'custom',
        options: { ...printOptions },
      };
      
      dispatch(addCustomPreset(newPreset));
      setCustomPresetName('');
      setShowPresetDialog(false);
    }
  }, [printOptions, customPresetName, dispatch]);

  // Validate options against material constraints
  const validationMessages = useMemo(() => {
    const messages: string[] = [];
    
    if (selectedMaterial) {
      const { specifications } = selectedMaterial;
      
      if (printOptions.layerHeight < specifications.layerHeight.min ||
          printOptions.layerHeight > specifications.layerHeight.max) {
        messages.push(
          `Layer height should be between ${specifications.layerHeight.min}mm and ${specifications.layerHeight.max}mm for this material.`
        );
      }
      
      if (printOptions.infillPercentage < specifications.infillRange.min ||
          printOptions.infillPercentage > specifications.infillRange.max) {
        messages.push(
          `Infill should be between ${specifications.infillRange.min}% and ${specifications.infillRange.max}% for this material.`
        );
      }
      
      if (!specifications.supportRequired && printOptions.supportGeneration !== SupportType.NONE) {
        messages.push('This material typically does not require support structures.');
      }
    }
    
    return messages;
  }, [printOptions, selectedMaterial]);

  return (
    <Box sx={sx}>
      {/* Preset selection */}
      {showPresets && presets && presets.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" spacing={2} mb={2}>
              <Typography variant="h6">Print Presets</Typography>
              <Tooltip title="Save current settings as preset">
                <IconButton
                  size="small"
                  onClick={() => setShowPresetDialog(true)}
                >
                  <SaveIcon />
                </IconButton>
              </Tooltip>
            </Stack>
            
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {presets.map(preset => (
                <Chip
                  key={preset.id}
                  label={preset.name}
                  onClick={() => handleApplyPreset(preset.id)}
                  variant="outlined"
                  color={preset.isDefault ? 'primary' : 'default'}
                  icon={preset.category === 'quality' ? <PaletteIcon /> :
                       preset.category === 'speed' ? <SpeedIcon /> :
                       preset.category === 'economy' ? <TuneIcon /> : undefined}
                />
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Validation messages */}
      {validationMessages.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Material Compatibility Warnings:
          </Typography>
          {validationMessages.map((message, index) => (
            <Typography key={index} variant="body2">
              • {message}
            </Typography>
          ))}
        </Alert>
      )}

      {/* Quality impact preview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <QualityImpactCard impact={qualityImpact} />
        </Grid>
        
        <Grid item xs={12} md={8}>
          <Stack direction="row" spacing={2} alignItems="center" height="100%">
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Layer Height Preview
              </Typography>
              <LayerHeightIndicator layerHeight={printOptions.layerHeight} />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                Infill Preview
              </Typography>
              <InfillIndicator 
                percentage={printOptions.infillPercentage}
                pattern={selectedInfillPattern}
              />
            </Box>
          </Stack>
        </Grid>
      </Grid>

      {/* Main options */}
      <Card>
        <CardContent>
          <Grid container spacing={3}>
            {/* Layer Height */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Layer Height: {printOptions.layerHeight}mm
                </Typography>
                <Slider
                  value={printOptions.layerHeight}
                  onChange={(_, value) => handleOptionChange('layerHeight', value)}
                  min={selectedMaterial ? selectedMaterial.specifications.layerHeight.min : 0.05}
                  max={selectedMaterial ? selectedMaterial.specifications.layerHeight.max : 0.4}
                  step={0.05}
                  marks={[
                    { value: 0.1, label: '0.1mm (Ultra)' },
                    { value: 0.2, label: '0.2mm (Standard)' },
                    { value: 0.3, label: '0.3mm (Fast)' },
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="textSecondary">
                  Lower values = better quality, longer print time
                </Typography>
              </Box>
            </Grid>

            {/* Infill Percentage */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Infill: {printOptions.infillPercentage}%
                </Typography>
                <Slider
                  value={printOptions.infillPercentage}
                  onChange={(_, value) => handleOptionChange('infillPercentage', value)}
                  min={selectedMaterial ? selectedMaterial.specifications.infillRange.min : 0}
                  max={selectedMaterial ? selectedMaterial.specifications.infillRange.max : 100}
                  step={5}
                  marks={[
                    { value: 10, label: '10%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                    { value: 75, label: '75%' },
                    { value: 100, label: '100%' },
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="textSecondary">
                  Higher values = stronger parts, more material usage
                </Typography>
              </Box>
            </Grid>

            {/* Support Generation */}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Support Generation</InputLabel>
                <Select
                  value={printOptions.supportGeneration}
                  onChange={(e) => handleOptionChange('supportGeneration', e.target.value)}
                >
                  <MenuItem value={SupportType.NONE}>None</MenuItem>
                  <MenuItem value={SupportType.MINIMAL}>Minimal</MenuItem>
                  <MenuItem value={SupportType.STANDARD}>Standard</MenuItem>
                  <MenuItem value={SupportType.EXTENSIVE}>Extensive</MenuItem>
                  <MenuItem value={SupportType.SOLUBLE}>Soluble</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Print Speed */}
            <Grid item xs={12} sm={6}>
              <Box>
                <Typography variant="subtitle1" gutterBottom>
                  Print Speed: {printOptions.printSpeed} mm/s
                </Typography>
                <Slider
                  value={printOptions.printSpeed}
                  onChange={(_, value) => handleOptionChange('printSpeed', value)}
                  min={15}
                  max={100}
                  step={5}
                  marks={[
                    { value: 30, label: 'Slow' },
                    { value: 50, label: 'Medium' },
                    { value: 80, label: 'Fast' },
                  ]}
                  valueLabelDisplay="auto"
                />
                <Typography variant="caption" color="textSecondary">
                  Higher speeds = faster printing, may reduce quality
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Advanced options toggle */}
          <Box mt={3}>
            <Button
              startIcon={showAdvancedOptions ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              variant="outlined"
              fullWidth
            >
              Advanced Options
            </Button>
          </Box>

          {/* Advanced options */}
          <Collapse in={showAdvancedOptions}>
            <Box mt={3}>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                {/* Shell Thickness */}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Shell Thickness: {printOptions.shellThickness} perimeters
                    </Typography>
                    <Slider
                      value={printOptions.shellThickness}
                      onChange={(_, value) => handleOptionChange('shellThickness', value)}
                      min={1}
                      max={8}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>

                {/* Top/Bottom Layers */}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Top/Bottom Layers: {printOptions.topBottomLayers}
                    </Typography>
                    <Slider
                      value={printOptions.topBottomLayers}
                      onChange={(_, value) => handleOptionChange('topBottomLayers', value)}
                      min={2}
                      max={10}
                      step={1}
                      marks
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>

                {/* Brim Width */}
                <Grid item xs={12} sm={6}>
                  <Box>
                    <Typography variant="subtitle1" gutterBottom>
                      Brim Width: {printOptions.brimWidth}mm
                    </Typography>
                    <Slider
                      value={printOptions.brimWidth}
                      onChange={(_, value) => handleOptionChange('brimWidth', value)}
                      min={0}
                      max={20}
                      step={1}
                      marks={[
                        { value: 0, label: 'None' },
                        { value: 5, label: '5mm' },
                        { value: 10, label: '10mm' },
                        { value: 20, label: '20mm' },
                      ]}
                      valueLabelDisplay="auto"
                    />
                  </Box>
                </Grid>

                {/* Infill Pattern */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Infill Pattern</InputLabel>
                    <Select
                      value={selectedInfillPattern}
                      onChange={(e) => setSelectedInfillPattern(e.target.value)}
                    >
                      {infillPatterns.map(pattern => (
                        <MenuItem key={pattern.id} value={pattern.id}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Typography>{pattern.icon}</Typography>
                            <Box>
                              <Typography>{pattern.name}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {pattern.description}
                              </Typography>
                            </Box>
                          </Stack>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Toggle options */}
                <Grid item xs={12}>
                  <Stack spacing={1}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={printOptions.raftEnabled}
                          onChange={(e) => handleOptionChange('raftEnabled', e.target.checked)}
                        />
                      }
                      label="Enable Raft (recommended for large prints)"
                    />
                    
                    <FormControlLabel
                      control={
                        <Switch
                          checked={printOptions.adaptiveLayers}
                          onChange={(e) => handleOptionChange('adaptiveLayers', e.target.checked)}
                        />
                      }
                      label="Adaptive Layers (optimize for geometry)"
                    />
                  </Stack>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Custom preset dialog - would typically be a separate dialog component */}
      {showPresetDialog && (
        <Card sx={{ mt: 3, p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Save Custom Preset
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <input
              type="text"
              placeholder="Preset name"
              value={customPresetName}
              onChange={(e) => setCustomPresetName(e.target.value)}
              style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
            />
            <Button
              variant="contained"
              onClick={handleSavePreset}
              disabled={!customPresetName.trim()}
            >
              Save
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowPresetDialog(false)}
            >
              Cancel
            </Button>
          </Stack>
        </Card>
      )}
    </Box>
  );
};

export default PrintOptions;