"""
Fallback File Type Detector

Provides a minimal implementation to replace python-magic which
requires libmagic, which is often not available on Windows systems.
"""

class Magic:
    """Simplified fallback for libmagic functionality"""
    
    def __init__(self, *args, **kwargs):
        pass
    
    def from_file(self, filename, mime=True):
        """
        Detect the MIME type from a file
        Falls back to extension-based detection
        """
        import os
        ext = os.path.splitext(filename.lower())[1]
        
        # Map common extensions to MIME types
        mime_map = {
            '.stl': 'model/stl',
            '.obj': 'model/obj',
            '.ply': 'model/ply',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.zip': 'application/zip',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
        
        return mime_map.get(ext, 'application/octet-stream')
    
    def from_buffer(self, buffer, mime=True):
        """
        Detect the MIME type from a buffer
        Always returns application/octet-stream as fallback
        """
        return 'application/octet-stream'

# Create a module level instance
magic = Magic()
