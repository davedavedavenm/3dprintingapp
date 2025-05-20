"""
Materials API

Provides material data for the quote system.
This is a minimal implementation that will eventually be replaced with a database-backed solution.
"""

from flask import Blueprint, jsonify
from datetime import datetime

# Create blueprint for materials API
materials_bp = Blueprint('materials', __name__)

@materials_bp.route('/', methods=['GET'])
def get_materials():
    """
    Return minimal list of materials with proper structure for frontend
    """
    materials = [
        {
            'id': 'pla_basic',
            'name': 'PLA',
            'display_name': 'PLA Basic',
            'cost_per_gram': 0.03,
            'density_g_cm3': 1.24,
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
                {'name': 'White', 'id': 'white', 'hexCode': '#FFFFFF', 'availability': 'in-stock', 'surcharge': 0},
                {'name': 'Black', 'id': 'black', 'hexCode': '#000000', 'availability': 'in-stock', 'surcharge': 0}
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
    
    return jsonify({
        'success': True,
        'materials': materials,
        'last_updated': datetime.utcnow().isoformat(),
        'default_material': 'PLA'
    }), 200
