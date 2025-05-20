"""
File Service Fallback

Provides basic file operations for the quote system.
This is a minimal fallback implementation that will eventually be replaced.
"""

import os

class FileService:
    """Simple file service for interacting with uploaded STL files"""
    
    def __init__(self, base_directory: str):
        """Initialize with the base directory for file operations"""
        self.base_directory = base_directory
        
    def get_file_info(self, file_path: str) -> dict:
        """Get basic file information"""
        # Ensure path is within base directory
        full_path = os.path.join(self.base_directory, file_path)
        
        return {
            'exists': os.path.exists(full_path),
            'size': os.path.getsize(full_path) if os.path.exists(full_path) else 0,
            'path': full_path,
            'filename': os.path.basename(full_path)
        }
    
    def _cleanup_file(self, file_path: str) -> bool:
        """Remove a temporary file"""
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                return True
        except Exception:
            pass
        return False
