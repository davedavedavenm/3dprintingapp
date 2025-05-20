"""
Simplified Upload Routes

Provides basic file upload functionality without complex dependencies.
"""

import os
import uuid
import time
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

# Create blueprint for upload routes
upload_bp = Blueprint('upload', __name__)

def create_error_response(message, errors, status_code):
    """Create a standardized error response"""
    print(f"ERROR RESPONSE: {message} - {errors}")
    return jsonify({
        'success': False,
        'error': {
            'message': message,
            'details': errors
        }
    }), status_code

@upload_bp.route('/stl', methods=['POST'])
def upload_stl_file():
    """
    Basic file upload handler
    """
    try:
        # Print request details for debugging
        print("Upload request received")
        print(f"Content-Type: {request.content_type}")
        print(f"Files: {list(request.files.keys())}")
        print(f"Form data: {list(request.form.keys())}")
        
        # Extract file from request with more flexible handling
        uploaded_file = None
        file_keys = ['file', 'stl_file', 'files[]', 'upload']
        
        for key in file_keys:
            if key in request.files:
                uploaded_file = request.files[key]
                print(f"Found file with key: {key}")
                break
        
        if not uploaded_file:
            return create_error_response(
                "No file provided",
                ["Missing file field in request. Use 'file', 'stl_file', or 'files[]'."],
                400
            )
        
        # Validate file
        if uploaded_file.filename == '':
            return create_error_response(
                "No file selected",
                ["Empty filename provided"],
                400
            )
        
        # Get file extension
        filename = secure_filename(uploaded_file.filename)
        _, file_ext = os.path.splitext(filename.lower())
        
        # More permissive validation - accept any extension for testing
        # Just log a warning for non-standard extensions
        if file_ext not in ['.stl', '.obj', '.ply']:
            print(f"Warning: Non-standard file extension: {file_ext}")
        
        # Create upload directory if it doesn't exist
        upload_dir = os.path.join(current_app.root_path, 'uploads')
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate a unique filename
        timestamp = int(time.time())
        random_id = uuid.uuid4().hex[:8]
        new_filename = f"{os.path.splitext(filename)[0]}_{timestamp}_{random_id}{file_ext}"
        
        # Save the file
        file_path = os.path.join(upload_dir, new_filename)
        uploaded_file.save(file_path)
        
        # Get file size
        file_size = os.path.getsize(file_path)
        
        # Return success response
        return jsonify({
            'success': True,
            'message': 'File uploaded successfully',
            'file_id': f"file-{os.path.basename(file_path)}",
            'filename': uploaded_file.filename,
            'size_bytes': file_size,
            'upload_time': datetime.now().isoformat(),
            'file_path': file_path
        }), 201
        
    except Exception as e:
        print(f"Upload error: {str(e)}")
        return create_error_response(
            "Internal server error",
            [str(e)],
            500
        )

@upload_bp.route('/validate', methods=['POST'])
def validate_stl_file():
    """
    Simplified file validation endpoint
    """
    try:
        # Print request details for debugging
        print("Validation request received")
        print(f"Content-Type: {request.content_type}")
        print(f"Files: {list(request.files.keys())}")
        print(f"Form data: {list(request.form.keys())}")
        
        # Extract file from request with more flexible handling
        uploaded_file = None
        file_keys = ['file', 'stl_file', 'files[]', 'upload']
        
        for key in file_keys:
            if key in request.files:
                uploaded_file = request.files[key]
                print(f"Found file with key: {key}")
                break
        
        if not uploaded_file:
            return jsonify({
                'validation_result': False,
                'file_info': {},
                'errors': ["No file found in request. Expected keys: file, stl_file, files[]"],
                'message': 'File validation failed'
            }), 400
        
        # Validate file
        if uploaded_file.filename == '':
            return create_error_response(
                "No file selected",
                ["Empty filename provided"],
                400
            )
        
        # Get file extension
        filename = secure_filename(uploaded_file.filename)
        _, file_ext = os.path.splitext(filename.lower())
        
        # More permissive validation - for testing, accept any extension but log a warning
        warnings = []
        if file_ext not in ['.stl', '.obj', '.ply']:
            warning = f"Non-standard file extension: {file_ext}. Recommended: .stl, .obj, or .ply"
            warnings.append(warning)
            print(f"Warning: {warning}")
        
        # Return success response
        return jsonify({
            'validation_result': True,
            'file_info': {
                'filename': uploaded_file.filename,
                'content_type': uploaded_file.content_type,
                'size': uploaded_file.content_length or 0
            },
            'warnings': warnings,
            'errors': [],
            'message': 'File validation successful'
        }), 200
        
    except Exception as e:
        print(f"Validation error: {str(e)}")
        return create_error_response(
            "Internal server error",
            [str(e)],
            500
        )

@upload_bp.route('/status/<session_id>', methods=['GET'])
def get_upload_status(session_id):
    """
    Get upload status for session (mock implementation)
    """
    return jsonify({
        'session_id': session_id,
        'status': 'completed',
        'progress': {
            'stage': 'upload_complete',
            'percentage': 100,
            'message': 'File upload completed'
        },
        'timestamp': datetime.now().isoformat(),
        'next_actions': [
            'Configure print settings',
            'Generate quote'
        ]
    }), 200
