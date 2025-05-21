from flask import Flask, jsonify

app = Flask(__name__)

# Configure CORS for cross-origin requests
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'http://localhost:3000')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization,Content-Disposition,X-Requested-With')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    return response

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "Service is running"}), 200

@app.route('/api/v1/materials/', methods=['GET'])
def get_materials():
    print('\n===== MATERIALS API ENDPOINT CALLED =====\n')
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
    # Return direct array format
    print('Returning direct array format from /api/v1/materials/')
    return jsonify(materials)

@app.route('/api/v1/upload/stl', methods=['POST'])
def upload_stl():
    """Handle file upload - placeholder for now"""
    print('\n===== UPLOAD ENDPOINT CALLED =====\n')
    return jsonify({
        'success': True,
        'upload_id': '123e4567-e89b-12d3-a456-426614174000',
        'file_name': 'test_cube.stl'
    }), 201

@app.route('/api/v1/quote/calculate', methods=['POST'])
def calculate_quote():
    """Simple placeholder for quote calculation"""
    print('\n===== QUOTE CALCULATION ENDPOINT CALLED =====\n')
    return jsonify({
        'success': True,
        'quote_id': '123e4567-e89b-12d3-a456-426614174000',
        'calculation': {
            'materialCost': 15.99,
            'laborCost': 100.00,
            'machineTime': 240,
            'setupCost': 15.00,
            'subtotal': 130.99,
            'taxes': 10.45,
            'total': 141.44
        }
    })

# Add a global OPTIONS route handler for preflight requests
@app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
@app.route('/<path:path>', methods=['OPTIONS'])
def options_handler(path):
    response = jsonify({})
    # CORS headers will be added by the after_request decorator
    return response

if __name__ == '__main__':
    print('\nStarting simple backend server...')
    print('API endpoints:')
    print('  GET  /api/v1/materials/')
    print('  POST /api/v1/quote/calculate')
    print('  POST /api/v1/upload/stl')
    app.run(host='0.0.0.0', port=5000, debug=True)
