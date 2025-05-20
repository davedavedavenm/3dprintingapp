"""
Simple Flask server for testing
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/v1/materials/', methods=['GET'])
def get_materials():
    """Get materials list"""
    materials = [
        {
            'id': 'pla',
            'name': 'PLA',
            'display_name': 'PLA - Standard',
            'cost_per_gram': 0.05,
            'density_g_cm3': 1.24,
            'colors': [
                {'name': 'White', 'hex': '#FFFFFF', 'availability': 'in-stock'},
                {'name': 'Black', 'hex': '#000000', 'availability': 'in-stock'},
            ],
            'specifications': {
                'layerHeight': { 'min': 0.1, 'max': 0.3, 'recommended': 0.2 },
                'infillRange': { 'min': 10, 'max': 100, 'recommended': 20 },
                'supportRequired': False,
                'printSpeed': 60,
                'bedTemperature': 60,
                'extruderTemperature': 210
            }
        }
    ]
    
    return jsonify({
        'success': True,
        'materials': materials,
        'last_updated': '2025-05-20T08:00:00',
        'default_material': 'PLA'
    })

@app.route('/api/v1/quote/calculate', methods=['POST'])
def calculate_quote():
    """Process quote calculation request"""
    try:
        data = request.get_json()
        print("Received quote calculation request:", data)
        
        # Generate simple response
        response = {
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
        }
        
        return jsonify(response)
    except Exception as e:
        print(f"Error processing quote: {str(e)}")
        return jsonify({
            'success': False,
            'error': {
                'message': 'Quote calculation failed',
                'details': [str(e)]
            }
        }), 500

@app.route('/api/v1/upload/stl', methods=['POST'])
def upload_stl():
    """Handle file upload"""
    print("File upload endpoint called")
    return jsonify({
        'success': True,
        'upload_id': '123e4567-e89b-12d3-a456-426614174000',
        'file_name': 'test_cube.stl'
    }), 201

if __name__ == '__main__':
    print("Starting simple test server...")
    print("API endpoints:")
    print("  GET  /api/v1/materials/")
    print("  POST /api/v1/quote/calculate")
    print("  POST /api/v1/upload/stl")
    app.run(host='0.0.0.0', port=5000)
