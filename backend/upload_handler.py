
@app.route('/api/v1/upload/stl', methods=['POST'])
def upload_stl():
    """Handle STL file uploads"""
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': {'message': 'No file part in the request'}
        }), 400
    
    uploaded_file = request.files['file']
    
    if uploaded_file.filename == '':
        return jsonify({
            'success': False,
            'error': {'message': 'No selected file'}
        }), 400
    
    # For now, just save to a temporary uploads folder
    # In production, this would go to a secure storage service
    upload_path = os.path.join(os.path.dirname(__file__), 'uploads')
    
    if not os.path.exists(upload_path):
        os.makedirs(upload_path)
    
    # Save the file
    try:
        file_path = os.path.join(upload_path, uploaded_file.filename)
        uploaded_file.save(file_path)
        
        return jsonify({
            'success': True,
            'file_id': f"file-{os.path.basename(file_path)}",
            'filename': uploaded_file.filename,
            'size_bytes': os.path.getsize(file_path),
            'upload_time': '2025-05-19T12:00:00Z',  # Mock timestamp
            'message': 'File uploaded successfully'
        }), 201
    except Exception as e:
        logger.error(f"Error saving file: {str(e)}")
        return jsonify({
            'success': False,
            'error': {'message': 'Error saving uploaded file'}
        }), 500
