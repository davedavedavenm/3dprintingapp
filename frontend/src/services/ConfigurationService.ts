/**
 * Configuration Service - Quote Persistence & Preset Management
 * 
 * Handles configuration storage, retrieval, and preset management
 * Essential service for user experience optimization and data persistence
 */

import { QuoteConfiguration, UrgencyLevel, PostProcessingService, SupportType } from '../store/slices/quoteSlice';

// For now, just use undefined for material since we don't have access to full Material objects
// In production, this would fetch real materials from the API

interface ConfigurationPreset {
  id: string;
  name: string;
  description: string;
  configuration: Partial<QuoteConfiguration>;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SavedConfiguration {
  id: string;
  name: string;
  configuration: QuoteConfiguration;
  timestamp: string;
  metadata: {
    version: string;
    source: 'user' | 'auto-save' | 'shared';
  };
}

class ConfigurationService {
  private baseUrl: string;
  private localStorageKey = 'quote_configurations';
  private presetsKey = 'quote_presets';

  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
  }

  /**
   * Save configuration to local storage and optionally to server
   * @param configuration - Configuration to save
   * @param name - Optional name for the configuration
   * @param syncToServer - Whether to synchronize with server
   * @returns Promise<string> - Configuration ID
   */
  async saveConfiguration(
    configuration: QuoteConfiguration,
    name?: string,
    syncToServer: boolean = false
  ): Promise<string> {
    try {
      const configId = `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const savedConfig: SavedConfiguration = {
        id: configId,
        name: name || `Configuration ${new Date().toLocaleDateString()}`,
        configuration,
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0',
          source: 'user',
        },
      };

      // Save to local storage
      const existingConfigs = this.getLocalConfigurations();
      existingConfigs.push(savedConfig);
      
      // Keep only the last 20 configurations
      const limitedConfigs = existingConfigs.slice(-20);
      localStorage.setItem(this.localStorageKey, JSON.stringify(limitedConfigs));

      // Optionally sync to server
      if (syncToServer) {
        try {
          await this.syncConfigurationToServer(savedConfig);
        } catch (error) {
          console.warn('Failed to sync configuration to server:', error);
          // Don't fail the local save if server sync fails
        }
      }

      return configId;
    } catch (error) {
      console.error('Configuration save error:', error);
      throw new Error('Failed to save configuration');
    }
  }

  /**
   * Load configuration by ID
   * @param configId - Configuration identifier
   * @returns Promise<QuoteConfiguration> - Retrieved configuration
   */
  async loadConfiguration(configId: string): Promise<QuoteConfiguration> {
    try {
      // Try local storage first
      const localConfigs = this.getLocalConfigurations();
      const localConfig = localConfigs.find(config => config.id === configId);
      
      if (localConfig) {
        return localConfig.configuration;
      }

      // If not found locally, try server
      const response = await fetch(`${this.baseUrl}/quote/configuration/${configId}`);
      
      if (!response.ok) {
        throw new Error('Configuration not found');
      }

      const result = await response.json();
      return result.data.configuration;
    } catch (error) {
      console.error('Configuration load error:', error);
      throw new Error('Failed to load configuration');
    }
  }

  /**
   * Get all locally saved configurations
   * @returns SavedConfiguration[] - List of saved configurations
   */
  getLocalConfigurations(): SavedConfiguration[] {
    try {
      const stored = localStorage.getItem(this.localStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading local configurations:', error);
      return [];
    }
  }

  /**
   * Delete configuration by ID
   * @param configId - Configuration identifier
   * @returns Promise<boolean> - Success status
   */
  async deleteConfiguration(configId: string): Promise<boolean> {
    try {
      // Remove from local storage
      const localConfigs = this.getLocalConfigurations();
      const filteredConfigs = localConfigs.filter(config => config.id !== configId);
      localStorage.setItem(this.localStorageKey, JSON.stringify(filteredConfigs));

      // Try to remove from server (best effort)
      try {
        await fetch(`${this.baseUrl}/quote/configuration/${configId}`, {
          method: 'DELETE',
        });
      } catch (error) {
        console.warn('Failed to delete configuration from server:', error);
      }

      return true;
    } catch (error) {
      console.error('Configuration deletion error:', error);
      return false;
    }
  }

  /**
   * Get available presets
   * @returns Promise<ConfigurationPreset[]> - List of available presets
   */
  async getPresets(): Promise<ConfigurationPreset[]> {
    try {
      // Load from server
      const response = await fetch(`${this.baseUrl}/quote/presets`);
      
      if (response.ok) {
        const result = await response.json();
        return result.data.presets;
      }

      // Fallback to local defaults if server is unavailable
      return this.getDefaultPresets();
    } catch (error) {
      console.error('Presets fetch error:', error);
      return this.getDefaultPresets();
    }
  }

  /**
   * Create custom preset
   * @param name - Preset name
   * @param description - Preset description
   * @param configuration - Configuration to save as preset
   * @returns Promise<ConfigurationPreset> - Created preset
   */
  async createPreset(
    name: string,
    description: string,
    configuration: Partial<QuoteConfiguration>
  ): Promise<ConfigurationPreset> {
    try {
      const preset: ConfigurationPreset = {
        id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description,
        configuration,
        isDefault: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Save locally
      const localPresets = this.getLocalPresets();
      localPresets.push(preset);
      localStorage.setItem(this.presetsKey, JSON.stringify(localPresets));

      // Try to save to server
      try {
        await fetch(`${this.baseUrl}/quote/presets`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(preset),
        });
      } catch (error) {
        console.warn('Failed to save preset to server:', error);
      }

      return preset;
    } catch (error) {
      console.error('Preset creation error:', error);
      throw new Error('Failed to create preset');
    }
  }

  /**
   * Get local presets
   * @returns ConfigurationPreset[] - List of local presets
   */
  private getLocalPresets(): ConfigurationPreset[] {
    try {
      const stored = localStorage.getItem(this.presetsKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error reading local presets:', error);
      return [];
    }
  }

  /**
   * Get default system presets
   * @returns ConfigurationPreset[] - Default preset configurations
   */
  private getDefaultPresets(): ConfigurationPreset[] {
    return [
      {
        id: 'preset_economy',
        name: 'Economy Print',
        description: 'Fast, cost-effective settings with standard quality',
        configuration: {
          material: undefined,
          quantity: 1,
          urgency: UrgencyLevel.STANDARD,
          postProcessing: [],
          customRequirements: '',
          printOptions: {
            layerHeight: 0.3,
            infillPercentage: 15,
            supportGeneration: SupportType.NONE,
            printSpeed: 50,
            shellThickness: 2,
            topBottomLayers: 3,
            brimWidth: 0,
            raftEnabled: false,
            adaptiveLayers: false,
          },
        },
        isDefault: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'preset_standard',
        name: 'Standard Quality',
        description: 'Balanced quality and speed for most applications',
        configuration: {
          material: undefined,
          quantity: 1,
          urgency: UrgencyLevel.STANDARD,
          postProcessing: [],
          customRequirements: '',
          printOptions: {
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
        },
        isDefault: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'preset_high_quality',
        name: 'High Quality',
        description: 'Premium quality with fine details and strength',
        configuration: {
          material: undefined,
          quantity: 1,
          urgency: UrgencyLevel.STANDARD,
          postProcessing: [PostProcessingService.SANDING],
          customRequirements: '',
          printOptions: {
            layerHeight: 0.15,
            infillPercentage: 30,
            supportGeneration: SupportType.STANDARD,
            printSpeed: 40,
            shellThickness: 4,
            topBottomLayers: 6,
            brimWidth: 5,
            raftEnabled: false,
            adaptiveLayers: true,
          },
        },
        isDefault: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'preset_functional',
        name: 'Functional Parts',
        description: 'Durable settings for mechanical components',
        configuration: {
          material: undefined,
          quantity: 1,
          urgency: UrgencyLevel.STANDARD,
          postProcessing: [PostProcessingService.DRILLING],
          customRequirements: '',
          printOptions: {
            layerHeight: 0.2,
            infillPercentage: 40,
            supportGeneration: SupportType.STANDARD,
            printSpeed: 40,
            shellThickness: 4,
            topBottomLayers: 5,
            brimWidth: 5,
            raftEnabled: false,
            adaptiveLayers: false,
          },
        },
        isDefault: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
      {
        id: 'preset_prototype',
        name: 'Rapid Prototype',
        description: 'Quick iteration for design validation',
        configuration: {
          material: undefined,
          quantity: 1,
          urgency: UrgencyLevel.RUSH,
          postProcessing: [],
          customRequirements: '',
          printOptions: {
            layerHeight: 0.25,
            infillPercentage: 10,
            supportGeneration: SupportType.NONE,
            printSpeed: 60,
            shellThickness: 2,
            topBottomLayers: 3,
            brimWidth: 0,
            raftEnabled: false,
            adaptiveLayers: false,
          },
        },
        isDefault: true,
        createdAt: '2025-01-01T00:00:00.000Z',
        updatedAt: '2025-01-01T00:00:00.000Z',
      },
    ];
  }

  /**
   * Auto-save current configuration
   * @param configuration - Current configuration state
   * @returns Promise<void>
   */
  async autoSaveConfiguration(configuration: QuoteConfiguration): Promise<void> {
    try {
      const autoSaveConfig: SavedConfiguration = {
        id: 'auto_save',
        name: 'Auto-saved Configuration',
        configuration,
        timestamp: new Date().toISOString(),
        metadata: {
          version: '1.0',
          source: 'auto-save',
        },
      };

      localStorage.setItem('auto_save_config', JSON.stringify(autoSaveConfig));
    } catch (error) {
      console.error('Auto-save error:', error);
      // Don't throw error for auto-save failures
    }
  }

  /**
   * Load auto-saved configuration
   * @returns QuoteConfiguration | null - Auto-saved configuration or null
   */
  loadAutoSavedConfiguration(): QuoteConfiguration | null {
    try {
      const stored = localStorage.getItem('auto_save_config');
      if (stored) {
        const autoSaved: SavedConfiguration = JSON.parse(stored);
        return autoSaved.configuration;
      }
      return null;
    } catch (error) {
      console.error('Auto-save load error:', error);
      return null;
    }
  }

  /**
   * Sync configuration to server
   * @param configuration - Configuration to sync
   * @returns Promise<void>
   */
  private async syncConfigurationToServer(
    configuration: SavedConfiguration
  ): Promise<void> {
    const response = await fetch(`${this.baseUrl}/quote/configuration/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(configuration),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Server sync failed');
    }
  }

  /**
   * Export configuration as JSON
   * @param configuration - Configuration to export
   * @returns string - JSON string of configuration
   */
  exportConfiguration(configuration: QuoteConfiguration): string {
    const exportData = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      configuration,
      metadata: {
        exportedBy: 'QuoteApp',
        format: 'json',
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Import configuration from JSON
   * @param jsonString - JSON string to import
   * @returns QuoteConfiguration - Imported configuration
   */
  importConfiguration(jsonString: string): QuoteConfiguration {
    try {
      const importData = JSON.parse(jsonString);
      
      if (!importData.configuration) {
        throw new Error('Invalid configuration format');
      }

      return importData.configuration;
    } catch (error) {
      console.error('Configuration import error:', error);
      throw new Error('Failed to import configuration');
    }
  }
}

// Create singleton instance
export const configurationService = new ConfigurationService();
export default configurationService;
