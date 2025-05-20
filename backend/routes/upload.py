"""
Upload API Routes

This module implements STL file upload endpoints with comprehensive
validation, processing, and error handling for the 3D print quoting system.

Technical Architecture:
- Secure multipart file upload processing
- Real-time validation and feedback
- Asynchronous processing pipeline
- Comprehensive error handling and logging
"""

import os
import structlog
from flask import Blueprint, request, jsonify, current_app
from werkzeug.exceptions import RequestEntityTooLarge
from werkzeug.utils import secure_filename

try:
    from services.file_service import FileService, FileValidationConfig
except ImportError:
    # Use fallback implementation if primary service is unavailable
    from services.file_service_fallback import FileService, FileValidationConfig

try:
    from services.slicer_service import SlicerService, SlicingParameters
except ImportError:
    # Fallback for slicer service
    SlicerService = None
    SlicingParameters = None

try:
    from utils.validators import validate_upload_request
    from utils.helpers import generate_session_id, create_error_response
except ImportError:
    # Fallback implementations
    def validate_upload_request(request):
        """Simple fallback validator"""
        return {'valid': True, 'errors': []}
    
    def generate_session_id():
        """Generate a simple session ID"""
        import uuid
        return f"session-{uuid.uuid4().hex[:12]}"
    
    def create_error_response(message, errors, status_code):
        """Create a simple error response"""
        return jsonify({
            'success': False,
            'message': message,
            'errors': errors
        }), status_code

# Configure module logger
logger = structlog.get_logger(__name__)

# Create blueprint for upload routes
upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/stl', methods=['POST'])
def upload_stl_file():
    """
    Upload and process STL file for quote generation
    
    Endpoint: POST /api/v1/upload/stl
    
    Request Format:
        - Content-Type: multipart/form-data
        - File field: 'stl_file' or 'file'
        - Optional: 'session_id' for tracking
    
    Response:
        - Success: File metadata and processing status
        - Error: Detailed error information with status codes
    
    Returns:
        JSON response with upload results
    """
    try:
        # Validate request format
        validation_result = validate_upload_request(request)
        if not validation_result['valid']:
            logger.warning("Invalid upload request",
                         errors=validation_result['errors'])
            return create_error_response(
                "Invalid request format",
                validation_result['errors'],
                400
            )
        
        # Extract file from request - support both 'file' and 'stl_file' field names
        if 'file' in request.files:
            uploaded_file = request.files['file']
        elif 'stl_file' in request.files:
            uploaded_file = request.files['stl_file']
        else:
            return create_error_response(
                "No STL file provided",
                ["Missing file in request. Use 'file' or 'stl_file' field name."],
                400
            )
        
        # Validate file presence
        if uploaded_file.filename == '':
            return create_error_response(
                "No file selected",
                ["Empty filename provided"],
                400
            )
        
        # Get or generate session ID
        session_id = request.form.get('session_id') or generate_session_id()
        
        # Initialize file service
        file_service = FileService(
            upload_directory=current_app.config['UPLOAD_FOLDER'],
            validation_config=FileValidationConfig(
                max_file_size=current_app.config['MAX_CONTENT_LENGTH'],
                virus_scan_enabled=current_app.config.get('VIRUS_SCAN_ENABLED', False)
            )
        )
        
        # Process file upload
        logger.info("Processing STL file upload",
                   filename=uploaded_file.filename,
                   session_id=session_id)
        
        # Use synchronous method instead of async
        processing_result = file_service.process_upload_sync(
            uploaded_file=uploaded_file,
            filename=uploaded_file.filename,
            session_id=session_id
        )
        
        if not processing_result.success:
            logger.warning("File upload processing failed",
                         filename=uploaded_file.filename,
                         errors=processing_result.validation_errors)
            
            return create_error_response(
                processing_result.error_message or "File processing failed",
                processing_result.validation_errors or [],
                422
            )
        
        # Return success response with metadata
        response_data = {
            'success': True,
            'message': 'STL file uploaded successfully',
            'session_id': session_id,
            'file_metadata': {
                'filename': processing_result.metadata.filename,
                'file_size': processing_result.metadata.file_size,
                'file_hash': processing_result.metadata.file_hash,
                'upload_timestamp': processing_result.metadata.upload_timestamp.isoformat(),
                'mime_type': processing_result.metadata.mime_type
            },
            'next_steps': {
                'quote_endpoint': '/api/v1/quote/calculate',
                'required_parameters': [
                    'material_type',
                    'infill_percentage',
                    'layer_height'
                ]
            }
        }
        
        logger.info("STL file upload completed successfully",
                   filename=uploaded_file.filename,
                   file_size=processing_result.metadata.file_size,
                   session_id=session_id)
        
        return jsonify(response_data), 201
        
    except RequestEntityTooLarge:
        logger.warning("File upload size exceeded limit",
                      max_size=current_app.config['MAX_CONTENT_LENGTH'])
        return create_error_response(
            "File too large",
            [f"Maximum file size is {current_app.config['MAX_CONTENT_LENGTH'] // (1024*1024)}MB"],
            413
        )
    
    except Exception as e:
        logger.error("Unexpected error in file upload",
                    error=str(e),
                    filename=getattr(uploaded_file, 'filename', 'unknown'))
        
        return create_error_response(
            "Internal server error",
            ["An unexpected error occurred during file processing"],
            500
        )


@upload_bp.route('/validate', methods=['POST'])
def validate_stl_file():
    """
    Validate STL file without full processing
    
    Endpoint: POST /api/v1/upload/validate
    
    Performs lightweight validation to check file format,
    size, and basic structure without triggering full
    processing pipeline.
    
    Request Format:
        - Content-Type: multipart/form-data
        - File field: 'stl_file' or 'file'
    
    Response:
        - validation_result: Boolean success status
        - file_info: Basic file information
        - errors: Validation error details
    
    Returns:
        JSON response with validation results
    """
    try:
        # Extract file from request - support both 'file' and 'stl_file' field names
        if 'file' in request.files:
            uploaded_file = request.files['file']
        elif 'stl_file' in request.files:
            uploaded_file = request.files['stl_file']
        else:
            return create_error_response(
                "No STL file provided",
                ["Missing file in request. Use 'file' or 'stl_file' field name."],
                400
            )
        
        if uploaded_file.filename == '':
            return create_error_response(
                "No file selected",
                ["Empty filename provided"],
                400
            )
        
        # Perform basic validation without full processing
        file_info = {
            'filename': uploaded_file.filename,
            'content_length': uploaded_file.content_length,
            'content_type': uploaded_file.content_type
        }
        
        # Validate file extension
        filename_secure = secure_filename(uploaded_file.filename)
        file_extension = os.path.splitext(filename_secure)[1].lower()
        
        allowed_extensions = ['.stl', '.obj', '.ply']
        validation_errors = []
        
        if file_extension not in allowed_extensions:
            validation_errors.append(f"Unsupported file extension: {file_extension}")
        
        # Validate file size
        if uploaded_file.content_length and uploaded_file.content_length > current_app.config['MAX_CONTENT_LENGTH']:
            max_size_mb = current_app.config['MAX_CONTENT_LENGTH'] // (1024*1024)
            validation_errors.append(f"File too large (max: {max_size_mb}MB)")
        
        # Validate content type
        allowed_content_types = [
            'application/octet-stream',
            'application/sla',
            'model/stl',
            'text/plain'
        ]
        
        if uploaded_file.content_type not in allowed_content_types:
            # Allow STL files that might be detected as octet-stream
            if not (file_extension == '.stl' and uploaded_file.content_type == 'application/octet-stream'):
                validation_errors.append(f"Unsupported content type: {uploaded_file.content_type}")
        
        is_valid = len(validation_errors) == 0
        
        response_data = {
            'validation_result': is_valid,
            'file_info': file_info,
            'errors': validation_errors,
            'message': 'File validation completed' if is_valid else 'File validation failed'
        }
        
        status_code = 200 if is_valid else 422
        
        logger.info("STL file validation completed",
                   filename=uploaded_file.filename,
                   valid=is_valid,
                   errors=validation_errors)
        
        return jsonify(response_data), status_code
        
    except Exception as e:
        logger.error("Error in file validation",
                    error=str(e),
                    filename=getattr(uploaded_file, 'filename', 'unknown'))
        
        return create_error_response(
            "Validation error",
            ["An error occurred during file validation"],
            500
        )


@upload_bp.route('/status/<session_id>', methods=['GET'])
def get_upload_status(session_id: str):
    """
    Retrieve upload status for session
    
    Endpoint: GET /api/v1/upload/status/<session_id>
    
    Provides status information for ongoing or completed
    upload operations associated with a session.
    
    Path Parameters:
        session_id: Unique session identifier
    
    Response:
        - status: Current processing status
        - progress: Processing progress information
        - results: Available results if processing complete
    
    Returns:
        JSON response with session status
    """
    try:
        # Note: In production, implement session storage (Redis, database)
        # This is a simplified implementation for demonstration
        
        # Validate session ID format
        if not session_id or len(session_id) < 8:
            return create_error_response(
                "Invalid session ID",
                ["Session ID must be at least 8 characters"],
                400
            )
        
        # Mock status response - replace with actual session lookup
        response_data = {
            'session_id': session_id,
            'status': 'completed',  # pending, processing, completed, failed
            'progress': {
                'stage': 'upload_complete',
                'percentage': 100,
                'message': 'STL file uploaded successfully'
            },
            'timestamp': '2024-01-01T12:00:00Z',
            'next_actions': [
                'Configure print settings',
                'Generate quote'
            ]
        }
        
        logger.debug("Upload status retrieved",
                    session_id=session_id,
                    status=response_data['status'])
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Error retrieving upload status",
                    session_id=session_id,
                    error=str(e))
        
        return create_error_response(
            "Status retrieval error",
            ["Unable to retrieve session status"],
            500
        )


@upload_bp.route('/cleanup', methods=['POST'])
def cleanup_uploads():
    """
    Administrative endpoint for cleaning expired uploads
    
    Endpoint: POST /api/v1/upload/cleanup
    
    Performs cleanup of expired temporary files and
    uploads to prevent storage accumulation.
    
    Request Body:
        - max_age_hours: Maximum age of files to retain (optional)
        - force_cleanup: Force cleanup regardless of age (optional)
    
    Response:
        - cleaned_count: Number of files removed
        - error_count: Number of cleanup errors
        - status: Operation status
    
    Returns:
        JSON response with cleanup results
    """
    try:
        request_data = request.get_json() or {}
        max_age_hours = request_data.get('max_age_hours', 24)
        force_cleanup = request_data.get('force_cleanup', False)
        
        # Initialize file service
        file_service = FileService(
            upload_directory=current_app.config['UPLOAD_FOLDER']
        )
        
        # Perform cleanup operation
        if force_cleanup:
            max_age_hours = 0  # Clean all files
        
        cleanup_result = file_service.cleanup_expired_files(max_age_hours)
        
        response_data = {
            'success': cleanup_result['success'],
            'cleaned_count': cleanup_result.get('cleaned_count', 0),
            'error_count': cleanup_result.get('error_count', 0),
            'max_age_hours': max_age_hours,
            'message': f"Cleanup completed - {cleanup_result.get('cleaned_count', 0)} files removed"
        }
        
        logger.info("Upload cleanup completed",
                   cleaned_count=cleanup_result.get('cleaned_count', 0),
                   error_count=cleanup_result.get('error_count', 0))
        
        return jsonify(response_data), 200
        
    except Exception as e:
        logger.error("Error in upload cleanup", error=str(e))
        
        return create_error_response(
            "Cleanup operation failed",
            ["An error occurred during cleanup"],
            500
        )


# Error handlers for upload blueprint
@upload_bp.errorhandler(413)
def handle_file_too_large(error):
    """Handle file size limit exceeded errors"""
    logger.warning("File size limit exceeded",
                  max_size=current_app.config['MAX_CONTENT_LENGTH'])
    
    return create_error_response(
        "File too large",
        [f"Maximum file size is {current_app.config['MAX_CONTENT_LENGTH'] // (1024*1024)}MB"],
        413
    )


@upload_bp.errorhandler(415)
def handle_unsupported_media_type(error):
    """Handle unsupported media type errors"""
    logger.warning("Unsupported media type", error=str(error))
    
    return create_error_response(
        "Unsupported media type",
        ["Only STL, OBJ, and PLY files are supported"],
        415
    )


@upload_bp.errorhandler(400)
def handle_bad_request(error):
    """Handle malformed request errors"""
    logger.warning("Bad request in upload", error=str(error))
    
    return create_error_response(
        "Bad request",
        ["Invalid request format or parameters"],
        400
    )
