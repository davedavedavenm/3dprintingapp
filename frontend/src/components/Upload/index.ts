/**
 * Upload Components Module Index
 * 
 * Centralized export interface for all upload-related components
 * and services. Follows modular architecture principles with
 * clear separation of concerns and efficient component composition.
 * 
 * @fileoverview Upload interface components for 3D Print Quoting System
 * @version 1.0.0
 * @author Development Team
 */

// Core Upload Components
export { default as STLUploadZone } from './STLUploadZone';
export { default as UploadProgress } from './UploadProgress';
export { default as STLPreview } from './STLPreview';
export { default as UploadQueue } from './UploadQueue';

// Service Exports
export { default as FileValidator } from '../../services/FileValidator';

// Type Exports for External Consumption
export type {
  ValidationResult,
  FileMetadata,
  ValidationConfig,
} from '../../services/FileValidator';

export type {
  UploadItem,
  UploadProgress as UploadProgressType,
  UploadState,
} from '../../store/slices/uploadSlice';

/**
 * Upload Interface Configuration
 * 
 * Default configuration values for upload components
 * implementing best practices for user experience.
 */
export const UploadConfig = {
  /** Maximum file size in bytes (100MB) */
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  
  /** Supported file extensions */
  SUPPORTED_EXTENSIONS: ['.stl', '.obj', '.ply'],
  
  /** Maximum concurrent uploads */
  MAX_CONCURRENT_UPLOADS: 3,
  
  /** Upload chunk size for large files */
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks
  
  /** Preview rendering dimensions */
  PREVIEW_CONFIG: {
    defaultHeight: 400,
    thumbnailHeight: 200,
    maxTextureSize: 2048,
  },
  
  /** Auto-retry configuration */
  RETRY_CONFIG: {
    maxRetries: 3,
    retryDelay: 2000, // 2 seconds
    exponentialBackoff: true,
  },
} as const;

/**
 * Upload Component Composition Utilities
 * 
 * Higher-order components and utilities for complex upload
 * interface compositions and workflow management.
 */
export const UploadUtils = {
  /**
   * Validate multiple files
   * @param files - Array of files to validate
   * @returns Promise resolving to validation results
   */
  validateFiles: async (files: File[]) => {
    const { default: FileValidator } = await import('../../services/FileValidator');
    const validator = new FileValidator();
    return await validator.validateFiles(files);
  },
  
  /**
   * Calculate total upload size
   * @param files - Array of files
   * @returns Total size in bytes
   */
  calculateTotalSize: (files: File[]): number => {
    return files.reduce((total, file) => total + file.size, 0);
  },
  
  /**
   * Group files by status
   * @param items - Upload items array
   * @returns Grouped items by status
   */
  groupByStatus: (items: any[]) => {
    return items.reduce((groups, item) => {
      const status = item.status;
      if (!groups[status]) groups[status] = [];
      groups[status].push(item);
      return groups;
    }, {} as Record<string, any[]>);
  },
  
  /**
   * Format file size for display
   * @param bytes - Size in bytes
   * @returns Formatted string
   */
  formatFileSize: (bytes: number): string => {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
  },
} as const;

/**
 * Upload Event Handlers
 * 
 * Standardized event handlers for common upload scenarios
 * implementing best practices for error handling and user feedback.
 */
export const UploadEventHandlers = {
  /**
   * Handle successful upload completion
   * @param item - Completed upload item
   * @param callback - Optional success callback
   */
  handleUploadSuccess: (item: any, callback?: (item: any) => void) => {
    console.log('Upload completed successfully:', item.metadata.filename);
    callback?.(item);
  },
  
  /**
   * Handle upload failure with retry logic
   * @param item - Failed upload item
   * @param retryFn - Retry function
   * @param maxRetries - Maximum retry attempts
   */
  handleUploadError: (
    item: any,
    retryFn: (id: string) => void,
    maxRetries: number = UploadConfig.RETRY_CONFIG.maxRetries
  ) => {
    const retryCount = item.retryCount || 0;
    
    if (retryCount < maxRetries) {
      console.log(`Upload failed, retrying (${retryCount + 1}/${maxRetries}):`, item.error);
      setTimeout(() => retryFn(item.id), UploadConfig.RETRY_CONFIG.retryDelay);
    } else {
      console.error('Upload failed after maximum retries:', item.error);
    }
  },
  
  /**
   * Handle queue completion
   * @param stats - Queue statistics
   * @param callback - Completion callback
   */
  handleQueueComplete: (stats: any, callback?: (stats: any) => void) => {
    console.log('Upload queue completed:', {
      total: stats.total,
      completed: stats.completed,
      failed: stats.failed,
    });
    callback?.(stats);
  },
} as const;
