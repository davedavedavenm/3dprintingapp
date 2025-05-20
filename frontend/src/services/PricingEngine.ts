/**
 * Pricing Engine Service - Quote Calculation API Integration
 * 
 * Handles real-time quote calculations with PrusaSlicer integration
 * Critical service for MVP quote generation and pricing accuracy
 */

import { QuoteConfiguration, Quote } from '../store/slices/quoteSlice';

interface ProcessingResult {
  success: boolean;
  data?: any;
  error?: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

class PricingEngineService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  }

  /**
   * Calculate comprehensive quote from configuration
   * @param files - Uploaded STL files
   * @param configuration - Print configuration parameters
   * @returns Promise<Quote> - Complete quote with pricing breakdown
   */
  async calculateQuote(
    files: File[],
    configuration: QuoteConfiguration
  ): Promise<Quote> {
    try {
      // Prepare form data for file upload and configuration
      const formData = new FormData();
      
      // Add files to form data
      files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });

      // Add configuration as JSON
      formData.append('configuration', JSON.stringify({
        material_type: configuration.material?.name || 'PLA',
        infill_percentage: configuration.printOptions.infillPercentage,
        layer_height: configuration.printOptions.layerHeight,
        support_material: configuration.printOptions.supportGeneration !== 'none',
        rush_order: configuration.urgency === 'rush' || configuration.urgency === 'urgent',
        post_processing: configuration.postProcessing || [],
        quantity: configuration.quantity || 1,
        multi_color: false,
      }));

      const response = await fetch(`${this.baseUrl}/quote/calculate`, {
        method: 'POST',
        body: formData,
        headers: {
          // Don't set Content-Type for FormData
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Quote calculation failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Quote calculation error:', error);
      throw error;
    }
  }

  /**
   * Validate configuration before calculation
   * @param configuration - Print configuration to validate
   * @returns Promise<ValidationResult> - Validation status and messages
   */
  async validateConfiguration(
    configuration: QuoteConfiguration
  ): Promise<ValidationResult> {
    try {
      const response = await fetch(`${this.baseUrl}/quote/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          material_type: configuration.material?.name || 'PLA',
          infill_percentage: configuration.printOptions.infillPercentage,
          layer_height: configuration.printOptions.layerHeight,
          support_material: configuration.printOptions.supportGeneration !== 'none',
          quantity: configuration.quantity,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          isValid: false,
          errors: [errorData.error?.message || 'Validation failed'],
          warnings: [],
        };
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Configuration validation error:', error);
      return {
        isValid: false,
        errors: ['Network error during validation'],
        warnings: [],
      };
    }
  }

  /**
   * Get quick estimate before full calculation
   * @param dimensions - Estimated part dimensions
   * @param materialType - Selected material
   * @param infillPercentage - Infill density
   * @param layerHeight - Layer height setting
   * @returns Promise<EstimatedQuote> - Price range and specifications
   */
  async getQuoteEstimate(
    dimensions: { length: number; width: number; height: number },
    materialType: string,
    infillPercentage: number,
    layerHeight: number
  ): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/quote/estimate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dimensions,
          material_type: materialType,
          infill_percentage: infillPercentage,
          layer_height: layerHeight,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Estimate calculation failed');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Quote estimate error:', error);
      throw error;
    }
  }

  /**
   * Get real-time material pricing
   * @param materialId - Material identifier
   * @param volume - Estimated volume in cubic cm
   * @returns Promise<MaterialPricing> - Current material pricing
   */
  async getMaterialPricing(
    materialId: string,
    volume: number
  ): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/materials/${materialId}/pricing?volume=${volume}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to get material pricing');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Material pricing error:', error);
      throw error;
    }
  }

  /**
   * Process file for quick analysis
   * @param file - STL file to analyze
   * @returns Promise<ProcessingResult> - File analysis results
   */
  async processFileAnalysis(file: File): Promise<ProcessingResult> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/files/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.error?.message || 'File analysis failed',
        };
      }

      const result = await response.json();
      return {
        success: true,
        data: result.data,
      };
    } catch (error) {
      console.error('File analysis error:', error);
      return {
        success: false,
        error: 'Network error during file analysis',
      };
    }
  }

  /**
   * Get available materials with properties
   * @returns Promise<Material[]> - List of available materials
   */
  async getAvailableMaterials(): Promise<any[]> {
    try {
      const response = await fetch(`${this.baseUrl}/materials`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch materials');
      }

      const result = await response.json();
      return result.data.materials;
    } catch (error) {
      console.error('Materials fetch error:', error);
      throw error;
    }
  }

  /**
   * Save quote for later reference
   * @param quote - Quote object to save
   * @returns Promise<string> - Saved quote ID
   */
  async saveQuote(quote: Quote): Promise<string> {
    try {
      const response = await fetch(`${this.baseUrl}/quote/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(quote),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to save quote');
      }

      const result = await response.json();
      return result.data.quote_id;
    } catch (error) {
      console.error('Quote save error:', error);
      throw error;
    }
  }

  /**
   * Load previously saved quote
   * @param quoteId - Quote identifier
   * @returns Promise<Quote> - Retrieved quote
   */
  async loadQuote(quoteId: string): Promise<Quote> {
    try {
      const response = await fetch(`${this.baseUrl}/quote/${quoteId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to load quote');
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Quote load error:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const pricingEngineService = new PricingEngineService();
export default pricingEngineService;
