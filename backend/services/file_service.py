"""
File Management Service

This module implements comprehensive file handling capabilities for
STL upload, validation, storage, and lifecycle management within the
3D print quoting system architecture.

Technical Architecture:
- Secure multipart file upload processing
- STL file validation and sanitization protocols
- Temporary storage with automated cleanup procedures
- Virus scanning integration for production security
"""

import os
import shutil
import tempfile
import hashlib
import mimetypes
import structlog
from pathlib import Path
from typing import Dict, Optional, Tuple, List
from dataclasses import dataclass
from datetime import datetime, timedelta
try:
    import magic
except ImportError:
    # Use our fallback implementation
    from services.magic_fallback import magic
import aiofiles

# Configure module logger
logger = structlog.get_logger(__name__)


@dataclass
class FileValidationConfig:
    """File validation configuration parameters"""
    max_file_size: int = 100 * 1024 * 1024  # 100MB
    allowed_extensions: List[str] = None
    allowed_mime_types: List[str] = None
    virus_scan_enabled: bool = False
    quarantine_suspicious: bool = True
    
    def __post_init__(self):
        if self.allowed_extensions is None:
            self.allowed_extensions = ['.stl', '.obj', '.ply']
        
        if self.allowed_mime_types is None:
            self.allowed_mime_types = [
                'application/octet-stream',
                'application/sla',
                'model/stl',
                'model/mesh',
                'text/plain'
            ]


@dataclass
class FileMetadata:
    """Comprehensive file metadata structure"""
    filename: str
    file_path: str
    file_size: int
    mime_type: str
    file_hash: str
    upload_timestamp: datetime
    validation_status: str
    virus_scan_result: Optional[str] = None


@dataclass
class FileProcessingResult:
    """File processing operation result"""
    success: bool
    metadata: Optional[FileMetadata] = None
    error_message: Optional[str] = None
    validation_errors: Optional[List[str]] = None


class FileService:
    """
    Advanced File Management Service
    
    Implements secure file handling with comprehensive validation,
    virus scanning, and lifecycle management for production environments.
    """
    
    def __init__(self, 
                 upload_directory: str,
                 validation_config: Optional[FileValidationConfig] = None):
        """
        Initialize file service with configuration
        
        Args:
            upload_directory: Base directory for file storage
            validation_config: File validation configuration
        """
        self.upload_directory = Path(upload_directory)
        self.config = validation_config or FileValidationConfig()
        self.temp_directory = Path(tempfile.gettempdir()) / "3d_print_uploads"
        
        # Ensure directories exist
        self._initialize_directories()
        
        logger.info("FileService initialized successfully",
                   upload_dir=str(self.upload_directory),
                   max_size=f"{self.config.max_file_size // (1024*1024)}MB")
    
    def _initialize_directories(self) -> None:
        """Initialize required directories with proper permissions"""
        directories = [self.upload_directory, self.temp_directory]
        
        for directory in directories:
            directory.mkdir(parents=True, exist_ok=True)
            # Set appropriate permissions (owner: rwx, group: rx, other: -)
            directory.chmod(0o750)
            
            logger.debug("Directory initialized", path=str(directory))
    
    async def process_upload(self, 
                           uploaded_file,
                           filename: str,
                           session_id: str) -> FileProcessingResult:
        """
        Process uploaded file with comprehensive validation
        
        Implements secure file processing pipeline including validation,
        virus scanning, and temporary storage management.
        
        Args:
            uploaded_file: File-like object from upload
            filename: Original filename from client
            session_id: User session identifier for organization
            
        Returns:
            FileProcessingResult: Processing results with metadata
        """
        try:
            # Generate secure filename and path
            secure_filename = self._generate_secure_filename(filename, session_id)
            temp_path = self.temp_directory / secure_filename
            final_path = self.upload_directory / secure_filename
            
            # Stream file to temporary location
            file_size = await self._save_uploaded_file(uploaded_file, temp_path)
            
            # Validate file
            validation_result = await self._validate_file(temp_path, filename, file_size)
            if not validation_result['valid']:
                # Clean up temporary file
                self._cleanup_file(temp_path)
                return FileProcessingResult(
                    success=False,
                    validation_errors=validation_result['errors']
                )
            
            # Perform virus scan if enabled
            if self.config.virus_scan_enabled:
                virus_scan_result = await self._perform_virus_scan(temp_path)
                if virus_scan_result['threat_detected']:
                    logger.warning("Virus detected in upload",
                                 filename=secure_filename,
                                 threat=virus_scan_result['threat_name'])
                    
                    if self.config.quarantine_suspicious:
                        await self._quarantine_file(temp_path)
                    else:
                        self._cleanup_file(temp_path)
                    
                    return FileProcessingResult(
                        success=False,
                        error_message=f"File rejected: {virus_scan_result['threat_name']}"
                    )
            
            # Move from temporary to final location
            shutil.move(str(temp_path), str(final_path))
            
            # Generate file metadata
            metadata = await self._generate_metadata(final_path, filename, file_size)
            
            logger.info("File upload processed successfully",
                       filename=secure_filename,
                       size=file_size,
                       session_id=session_id)
            
            return FileProcessingResult(
                success=True,
                metadata=metadata
            )
            
        except Exception as e:
            error_message = f"File processing failed: {str(e)}"
            logger.error("File upload processing error", error=error_message)
            
            # Cleanup any temporary files
            if 'temp_path' in locals():
                self._cleanup_file(temp_path)
            
            return FileProcessingResult(
                success=False,
                error_message=error_message
            )
    
    async def _save_uploaded_file(self, uploaded_file, file_path: Path) -> int:
        """
        Stream uploaded file to disk with size tracking
        
        Args:
            uploaded_file: File-like object from upload
            file_path: Destination path for file
            
        Returns:
            int: Total bytes written
            
        Raises:
            ValueError: If file exceeds maximum size limit
        """
        total_size = 0
        chunk_size = 8192  # 8KB chunks for efficient processing
        
        async with aiofiles.open(file_path, 'wb') as f:
            while chunk := await uploaded_file.read(chunk_size):
                if isinstance(chunk, str):
                    chunk = chunk.encode('utf-8')
                
                total_size += len(chunk)
                
                # Check size limit during upload
                if total_size > self.config.max_file_size:
                    # Remove partial file
                    await f.close()
                    self._cleanup_file(file_path)
                    raise ValueError(f"File exceeds maximum size limit of {self.config.max_file_size // (1024*1024)}MB")
                
                await f.write(chunk)
        
        return total_size
    
    async def _validate_file(self, 
                           file_path: Path,
                           original_filename: str,
                           file_size: int) -> Dict:
        """
        Comprehensive file validation implementation
        
        Validates file extension, MIME type, file size, and basic
        structural integrity for STL files.
        
        Args:
            file_path: Path to uploaded file
            original_filename: Original filename from client
            file_size: File size in bytes
            
        Returns:
            Dict: Validation result with errors list
        """
        errors = []
        
        # Validate file extension
        file_extension = Path(original_filename).suffix.lower()
        if file_extension not in self.config.allowed_extensions:
            errors.append(f"Unsupported file extension: {file_extension}")
        
        # Validate MIME type
        try:
            mime_type = magic.from_file(str(file_path), mime=True)
            if mime_type not in self.config.allowed_mime_types:
                # Additional check for STL files (often detected as octet-stream)
                if file_extension == '.stl' and mime_type == 'application/octet-stream':
                    # Perform basic STL structure validation
                    is_valid_stl = await self._validate_stl_structure(file_path)
                    if not is_valid_stl:
                        errors.append("File does not appear to be a valid STL")
                else:
                    errors.append(f"Unsupported file type: {mime_type}")
        except Exception as e:
            logger.warning("MIME type detection failed", error=str(e))
            errors.append("Unable to determine file type")
        
        # Validate file size
        if file_size == 0:
            errors.append("Empty file uploaded")
        elif file_size > self.config.max_file_size:
            errors.append(f"File too large: {file_size // (1024*1024)}MB (max: {self.config.max_file_size // (1024*1024)}MB)")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    async def _validate_stl_structure(self, file_path: Path) -> bool:
        """
        Basic STL file structure validation
        
        Performs lightweight validation to ensure file has STL-like structure
        without full parsing for performance optimization.
        
        Args:
            file_path: Path to STL file
            
        Returns:
            bool: True if file appears to be valid STL
        """
        try:
            async with aiofiles.open(file_path, 'rb') as f:
                # Read first 80 bytes (STL header)
                header = await f.read(80)
                
                if len(header) < 80:
                    return False
                
                # Check for ASCII STL signature
                if header.startswith(b'solid '):
                    # ASCII STL format
                    await f.seek(0)
                    content = await f.read(1024)  # Read first 1KB
                    content_str = content.decode('utf-8', errors='ignore')
                    
                    # Look for STL keywords
                    return any(keyword in content_str.lower() 
                             for keyword in ['facet', 'normal', 'vertex', 'endsolid'])
                else:
                    # Binary STL format
                    # Read triangle count (next 4 bytes)
                    triangle_count_bytes = await f.read(4)
                    if len(triangle_count_bytes) < 4:
                        return False
                    
                    # Basic sanity check on triangle count
                    triangle_count = int.from_bytes(triangle_count_bytes, 'little')
                    return 0 <= triangle_count <= 10_000_000  # Reasonable limit
                    
        except Exception as e:
            logger.debug("STL validation error", error=str(e))
            return False
    
    async def _perform_virus_scan(self, file_path: Path) -> Dict:
        """
        Perform virus scanning on uploaded file
        
        Note: This is a placeholder implementation. Production environments
        should integrate with enterprise antivirus solutions like ClamAV.
        
        Args:
            file_path: Path to file for scanning
            
        Returns:
            Dict: Scan results with threat information
        """
        # Placeholder implementation
        # In production, integrate with ClamAV or similar:
        # result = clamav.scan_file(str(file_path))
        
        logger.debug("Virus scan performed", file_path=str(file_path))
        
        return {
            'threat_detected': False,
            'threat_name': None,
            'scan_time': datetime.utcnow().isoformat()
        }
    
    async def _quarantine_file(self, file_path: Path) -> None:
        """Move suspicious file to quarantine directory"""
        quarantine_dir = self.temp_directory / "quarantine"
        quarantine_dir.mkdir(exist_ok=True)
        
        quarantine_path = quarantine_dir / f"{file_path.name}.quarantined"
        shutil.move(str(file_path), str(quarantine_path))
        
        logger.info("File quarantined", 
                   original_path=str(file_path),
                   quarantine_path=str(quarantine_path))
    
    def _generate_secure_filename(self, original_filename: str, session_id: str) -> str:
        """
        Generate secure filename with timestamp and session identifier
        
        Args:
            original_filename: Original uploaded filename
            session_id: User session identifier
            
        Returns:
            str: Secure filename for storage
        """
        # Extract file extension
        file_extension = Path(original_filename).suffix.lower()
        
        # Generate timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        
        # Generate short hash from original filename and session
        hash_input = f"{original_filename}_{session_id}_{timestamp}"
        file_hash = hashlib.md5(hash_input.encode()).hexdigest()[:8]
        
        # Construct secure filename
        secure_filename = f"{timestamp}_{file_hash}{file_extension}"
        
        return secure_filename
    
    async def _generate_metadata(self, 
                                file_path: Path,
                                original_filename: str,
                                file_size: int) -> FileMetadata:
        """
        Generate comprehensive file metadata
        
        Args:
            file_path: Path to stored file
            original_filename: Original uploaded filename
            file_size: File size in bytes
            
        Returns:
            FileMetadata: Complete file metadata
        """
        # Calculate file hash for integrity verification
        file_hash = await self._calculate_file_hash(file_path)
        
        # Determine MIME type
        mime_type = magic.from_file(str(file_path), mime=True)
        
        metadata = FileMetadata(
            filename=original_filename,
            file_path=str(file_path),
            file_size=file_size,
            mime_type=mime_type,
            file_hash=file_hash,
            upload_timestamp=datetime.utcnow(),
            validation_status="validated"
        )
        
        return metadata
    
    async def _calculate_file_hash(self, file_path: Path) -> str:
        """
        Calculate SHA-256 hash of file for integrity verification
        
        Args:
            file_path: Path to file
            
        Returns:
            str: SHA-256 hash of file contents
        """
        hash_sha256 = hashlib.sha256()
        
        async with aiofiles.open(file_path, 'rb') as f:
            while chunk := await f.read(8192):
                hash_sha256.update(chunk)
        
        return hash_sha256.hexdigest()
    
    def _cleanup_file(self, file_path: Path) -> None:
        """
        Safe file cleanup with error handling
        
        Args:
            file_path: Path to file for deletion
        """
        try:
            if file_path.exists():
                file_path.unlink()
                logger.debug("File cleaned up", path=str(file_path))
        except Exception as e:
            logger.warning("File cleanup failed", 
                         path=str(file_path),
                         error=str(e))
    
    def cleanup_expired_files(self, max_age_hours: int = 24) -> Dict:
        """
        Clean up expired temporary files
        
        Implements automatic cleanup of old files to prevent
        storage accumulation in production environments.
        
        Args:
            max_age_hours: Maximum age of files to retain
            
        Returns:
            Dict: Cleanup operation results
        """
        cutoff_time = datetime.utcnow() - timedelta(hours=max_age_hours)
        
        cleaned_count = 0
        error_count = 0
        
        try:
            for file_path in self.temp_directory.iterdir():
                if file_path.is_file():
                    # Check file modification time
                    file_mtime = datetime.fromtimestamp(file_path.stat().st_mtime)
                    
                    if file_mtime < cutoff_time:
                        try:
                            file_path.unlink()
                            cleaned_count += 1
                            logger.debug("Expired file cleaned", path=str(file_path))
                        except Exception as e:
                            error_count += 1
                            logger.warning("Failed to clean expired file",
                                         path=str(file_path),
                                         error=str(e))
            
            logger.info("File cleanup completed",
                       cleaned_count=cleaned_count,
                       error_count=error_count)
            
            return {
                'success': True,
                'cleaned_count': cleaned_count,
                'error_count': error_count
            }
            
        except Exception as e:
            logger.error("File cleanup operation failed", error=str(e))
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_file_info(self, file_path: str) -> Optional[Dict]:
        """
        Retrieve file information for validation
        
        Args:
            file_path: Path to file
            
        Returns:
            Dict: File information or None if not found
        """
        path = Path(file_path)
        
        if not path.exists():
            return None
        
        try:
            stat = path.stat()
            return {
                'exists': True,
                'size': stat.st_size,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'is_readable': os.access(path, os.R_OK)
            }
        except Exception as e:
            logger.error("Failed to get file info", 
                        path=file_path,
                        error=str(e))
            return None
