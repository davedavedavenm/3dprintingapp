/**
 * File Validation Service
 * 
 * Provides comprehensive client-side file validation for 3D model uploads:
 * - File type and extension validation
 * - File size constraints enforcement
 * - MIME type verification
 * - Basic file structure integrity checks
 * - Detailed error reporting for user feedback
 */

// Types and interfaces
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metadata?: FileMetadata;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  extension: string;
  lastModified: Date;
  hash?: string;
}

export interface ValidationConfig {
  maxFileSize: number; // bytes
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  strictMimeValidation: boolean;
}

/**
 * FileValidator Class
 * 
 * Implements comprehensive file validation logic with configurable
 * parameters and detailed error reporting capabilities.
 */
export class FileValidator {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      maxFileSize: 100 * 1024 * 1024, // 100MB default
      allowedExtensions: ['.stl', '.obj', '.ply'],
      allowedMimeTypes: [
        'model/stl',
        'model/obj',
        'model/ply',
        'application/octet-stream',
        'text/plain', // Some STL files are text-based
      ],
      strictMimeValidation: false,
      ...config,
    };
  }

  /**
   * Validate a single file against all configured rules
   * @param file - File object to validate
   * @returns ValidationResult with detailed feedback
   */
  async validateFile(file: File): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
      metadata: this.extractMetadata(file),
    };

    // Run all validation checks
    await Promise.all([
      this.validateFileSize(file, result),
      this.validateFileExtension(file, result),
      this.validateMimeType(file, result),
      this.validateFileStructure(file, result),
    ]);

    // Set overall validity
    result.isValid = result.errors.length === 0;

    return result;
  }

  /**
   * Validate multiple files in batch
   * @param files - Array of files to validate
   * @returns Array of validation results
   */
  async validateFiles(files: File[]): Promise<ValidationResult[]> {
    const results = await Promise.all(
      files.map(file => this.validateFile(file))
    );

    return results;
  }

  /**
   * Extract basic metadata from file
   * @param file - File object
   * @returns FileMetadata object
   */
  private extractMetadata(file: File): FileMetadata {
    const extension = this.getFileExtension(file.name);
    
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      extension,
      lastModified: new Date(file.lastModified),
    };
  }

  /**
   * Validate file size against maximum allowed
   * @param file - File to validate
   * @param result - ValidationResult to update
   */
  private validateFileSize(file: File, result: ValidationResult): void {
    if (file.size === 0) {
      result.errors.push('File is empty (0 bytes)');
      return;
    }

    if (file.size > this.config.maxFileSize) {
      const maxSizeMB = Math.round(this.config.maxFileSize / (1024 * 1024));
      const fileSizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
      result.errors.push(
        `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`
      );
    }

    // Warning for large files (>50MB)
    const warningThreshold = this.config.maxFileSize * 0.5;
    if (file.size > warningThreshold) {
      const sizeMB = Math.round((file.size / (1024 * 1024)) * 100) / 100;
      result.warnings.push(
        `Large file detected (${sizeMB}MB). Processing may take longer.`
      );
    }
  }

  /**
   * Validate file extension
   * @param file - File to validate
   * @param result - ValidationResult to update
   */
  private validateFileExtension(file: File, result: ValidationResult): void {
    const extension = this.getFileExtension(file.name);
    
    if (!extension) {
      result.errors.push('File has no extension');
      return;
    }

    const normalizedExtension = extension.toLowerCase();
    const allowedExtensions = this.config.allowedExtensions.map(ext => ext.toLowerCase());

    if (!allowedExtensions.includes(normalizedExtension)) {
      result.errors.push(
        `Unsupported file format "${extension}". Supported formats: ${this.config.allowedExtensions.join(', ')}`
      );
    }
  }

  /**
   * Validate MIME type
   * @param file - File to validate
   * @param result - ValidationResult to update
   */
  private validateMimeType(file: File, result: ValidationResult): void {
    if (!file.type && this.config.strictMimeValidation) {
      result.errors.push('Unable to determine file type');
      return;
    }

    if (file.type && !this.config.allowedMimeTypes.includes(file.type)) {
      if (this.config.strictMimeValidation) {
        result.errors.push(
          `Unsupported MIME type "${file.type}". Expected one of: ${this.config.allowedMimeTypes.join(', ')}`
        );
      } else {
        result.warnings.push(
          `Unexpected MIME type "${file.type}". File will be validated by server.`
        );
      }
    }
  }

  /**
   * Perform basic file structure validation
   * @param file - File to validate
   * @param result - ValidationResult to update
   */
  private async validateFileStructure(file: File, result: ValidationResult): Promise<void> {
    try {
      // Read first few bytes to check basic structure
      const headerBytes = await this.readFileHeader(file, 512);
      const extension = this.getFileExtension(file.name).toLowerCase();

      switch (extension) {
        case '.stl':
          this.validateSTLStructure(headerBytes, result);
          break;
        case '.obj':
          this.validateOBJStructure(headerBytes, result);
          break;
        case '.ply':
          this.validatePLYStructure(headerBytes, result);
          break;
        default:
          // Generic validation for unknown types
          if (headerBytes.length === 0) {
            result.errors.push('File appears to be empty or corrupted');
          }
      }
    } catch (error) {
      result.warnings.push('Unable to validate file structure - will be verified by server');
    }
  }

  /**
   * Validate STL file structure
   * @param headerBytes - First bytes of the file
   * @param result - ValidationResult to update
   */
  private validateSTLStructure(headerBytes: Uint8Array, result: ValidationResult): void {
    if (headerBytes.length < 5) {
      result.errors.push('File too small to be a valid STL');
      return;
    }

    // Check for ASCII STL header
    const headerText = new TextDecoder('utf-8').decode(headerBytes.slice(0, 5));
    const isAsciiSTL = headerText.toLowerCase().startsWith('solid');
    
    // Check for binary STL (80-byte header + 4-byte triangle count)
    const isBinarySTL = headerBytes.length >= 84;

    if (!isAsciiSTL && !isBinarySTL) {
      result.warnings.push('STL file format could not be verified. Server will perform additional validation.');
    }

    // Additional checks for binary STL
    if (!isAsciiSTL && isBinarySTL) {
      // Check if triangle count is reasonable
      const triangleCount = new DataView(headerBytes.buffer).getUint32(80, true);
      const expectedFileSize = 80 + 4 + (triangleCount * 50); // 50 bytes per triangle
      
      // Allow some tolerance for file size differences
      const fileSizeTolerance = 1024; // 1KB tolerance
      if (Math.abs(headerBytes.length - expectedFileSize) > fileSizeTolerance) {
        result.warnings.push('Binary STL file size inconsistent with triangle count');
      }
    }
  }

  /**
   * Validate OBJ file structure
   * @param headerBytes - First bytes of the file
   * @param result - ValidationResult to update
   */
  private validateOBJStructure(headerBytes: Uint8Array, result: ValidationResult): void {
    const headerText = new TextDecoder('utf-8').decode(headerBytes);
    
    // Check for common OBJ keywords
    const objKeywords = ['v ', 'vt ', 'vn ', 'f ', '#', 'o ', 'g ', 'mtllib'];
    const hasObjKeywords = objKeywords.some(keyword => headerText.includes(keyword));

    if (!hasObjKeywords) {
      result.warnings.push('OBJ file format could not be verified. Server will perform additional validation.');
    }
  }

  /**
   * Validate PLY file structure
   * @param headerBytes - First bytes of the file
   * @param result - ValidationResult to update
   */
  private validatePLYStructure(headerBytes: Uint8Array, result: ValidationResult): void {
    const headerText = new TextDecoder('utf-8').decode(headerBytes.slice(0, 3));
    
    if (!headerText.startsWith('ply')) {
      result.warnings.push('PLY file format could not be verified. Server will perform additional validation.');
    }
  }

  /**
   * Read the first N bytes of a file
   * @param file - File to read
   * @param bytes - Number of bytes to read
   * @returns Promise<Uint8Array> - First bytes of the file
   */
  private readFileHeader(file: File, bytes: number): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      const blob = file.slice(0, bytes);

      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(new Uint8Array(reader.result));
        } else {
          reject(new Error('Unexpected result type'));
        }
      };

      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * Extract file extension from filename
   * @param filename - Name of the file
   * @returns File extension with dot, or empty string if none
   */
  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return '';
    }
    return filename.substring(lastDotIndex);
  }

  /**
   * Update validation configuration
   * @param config - Partial configuration to merge
   */
  updateConfig(config: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current validation configuration
   * @returns Current ValidationConfig
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Get supported file types summary
   * @returns Object with supported extensions and MIME types
   */
  getSupportedTypes(): { extensions: string[]; mimeTypes: string[] } {
    return {
      extensions: [...this.config.allowedExtensions],
      mimeTypes: [...this.config.allowedMimeTypes],
    };
  }
}

// Export singleton instance for convenience
export const fileValidator = new FileValidator();

export default FileValidator;