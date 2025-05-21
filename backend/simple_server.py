"""
Simple Flask server for testing
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os

# Add the backend directory to the path to find routes
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Print the current path and available modules for debugging
print(f"System path: {sys.path}")
print(f"Current directory: {os.getcwd()}")

# Import and register the materials blueprint
from routes.materials import materials_bp

app = Flask(__name__)

# Register blueprints
app.register_blueprint(materials_bp, url_prefix='/api/v1/materials')

# Add a global OPTIONS route handler for preflight requests
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    response = jsonify({})
    # CORS headers will be added by the after_request decorator
    return response

# Configure proper CORS for credentials support
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Content-Disposition,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response


@app.route('/api/v1/materials-array/', methods=['GET'])
def get_materials_array():
    """Get materials list as direct array"""
    print("\n===== MATERIALS ARRAY API CALLED =====\n")
    materials = [
        {
            'id': 'pla_basic',
            'name': 'PLA',
            'category': 'plastic',
            'type': 'pla',
            'properties': {
                'strength': 6,
                'flexibility': 4,
                'detail': 8,
                'durability': 6,
                'temperature': 60,
                'postProcessing': ['sanding', 'painting']
            },
            'pricing': {
                'basePrice': 0.03,
                'minimumQuantity': 50,
                'volumeDiscounts': [
                    {'minimumQuantity': 500, 'discountPercentage': 5},
                    {'minimumQuantity': 1000, 'discountPercentage': 10}
                ],
                'rushSurcharge': 50,
                'colorSurcharge': {'white': 0, 'black': 0}
            },
            'colors': [
                {'id': 'white', 'name': 'White', 'hexCode': '#FFFFFF', 'availability': 'in-stock', 'surcharge': 0},
                {'id': 'black', 'name': 'Black', 'hexCode': '#000000', 'availability': 'in-stock', 'surcharge': 0}
            ],
            'description': 'Biodegradable thermoplastic ideal for beginners and general-purpose printing.',
            'advantages': ['Easy to print', 'Biodegradable', 'Low odor'],
            'disadvantages': ['Lower temperature resistance'],
            'applications': ['Prototypes', 'Models', 'Low-stress parts'],
            'specifications': {
                'layerHeight': {'min': 0.1, 'max': 0.3, 'recommended': 0.2},
                'infillRange': {'min': 10, 'max': 100, 'recommended': 20},
                'supportRequired': False,
                'printSpeed': 60,
                'bedTemperature': 60,
                'extruderTemperature': 210
            },
            'popularity': 95,
            'isRecommended': True
        }
    ]
    
    print("Returning direct array format from new endpoint")
    # Return just the materials array directly
    result = jsonify(materials)
    print(f"Response type: {type(result)}")
    print(f"Response data: {result.data[:100]}...")
    return result



@app.route('/api/v1/quote/calculate', methods=['POST'])
def calculate_quote():
    """Process quote calculation request"""
    try:
        data = request.get_json()
        print("Received quote calculation request:", data)
        
        # Generate simple response
        response = jsonify({
            'success': True,
            'quote_id': '123e4567-e89b-12d3-a456-426614174000',
            'calculation': {
                'materialCost': 15.99,
                'laborCost': 100.00,
                'machineTime': 240,
                'setupCost': 15.00,
                'subtotal': 130.99,
                'taxes': 10.45,
                'total': 141.44,
                'breakdown': [
                    {
                        'category': 'Materials',
                        'description': 'PLA filament (50g)',
                        'quantity': 1,
                        'unitPrice': 15.99,
                        'total': 15.99
                    },
                    {
                        'category': 'Labor',
                        'description': 'Printing service',
                        'quantity': 1,
                        'unitPrice': 100.00,
                        'total': 100.00
                    }
                ]
            }
        })
        return response
    except Exception as e:
        print(f"Error processing quote: {str(e)}")
        response = jsonify({
            'success': False,
            'error': {
                'message': 'Quote calculation failed',
                'details': [str(e)]
            }
        })
        return response, 500

@app.route('/api/v1/upload/stl', methods=['POST'])
def upload_stl():
    """Handle file upload"""
    print("===== File upload endpoint called =====")
    print(f"Content-Type: {request.content_type}")
    print(f"Request headers: {dict(request.headers)}")
    print(f"Files: {list(request.files.keys())}")
    print(f"Form data: {dict(request.form)}")
    
    # Check if any file is in the request
    has_file = False
    file_key = None
    file_keys = ['file', 'stl_file', 'files[]', 'upload']
    
    for key in file_keys:
        if key in request.files:
            file_key = key
            has_file = True
            print(f"Found file with key: {key}, filename: {request.files[key].filename}")
            break
    
    if not has_file:
        print("No file found in request")
        return jsonify({
            'success': False,
            'error': 'No file found in request'
        }), 400
    
    # Create response - CORS headers are added by after_request
    print("Creating successful response")
    response = jsonify({
        'success': True,
        'upload_id': '123e4567-e89b-12d3-a456-426614174000',
        'file_name': request.files[file_key].filename if has_file else 'unknown.stl'
    })
    return response, 201

if __name__ == '__main__':
    print("\nStarting simple test server...")
    print("API endpoints:")
    print("  GET  /api/v1/materials/")
    print("  GET  /api/v1/materials-array/")
    print("  POST /api/v1/quote/calculate")
    print("  POST /api/v1/upload/stl")
    # Explicitly list all registered routes
    print("\nAll registered routes:")
    for rule in app.url_map.iter_rules():
        print(f"  {rule.endpoint}: {rule}")
    print()
    app.run(host='0.0.0.0', port=5000)
