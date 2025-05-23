"""
import sys
Quote API Routes

This module implements endpoints for 3D print quote generation based on STL files.
"""

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta
import uuid
import os
import json
import traceback
from services.slicer_service import SlicingParameters
from utils.validators import validate_quote_request

quote_bp = Blueprint('quote', __name__)

@quote_bp.route('/calculate', methods=['POST'])
def calculate_quote():
    """
    Generate comprehensive pricing quote from uploaded STL and configuration
    """
    try:
        # Get request data
        request_data = request.get_json()
        
        # Log received data for debugging
        print("Received quote calculation request:", json.dumps(request_data, indent=2))
        
        # VALIDATION: Check for required parameters
        if 'uploadId' not in request_data:
            raise ValueError("Missing required parameter: uploadId")
            
        if 'configuration' not in request_data:
            raise ValueError("Missing required parameter: configuration")
            
        configuration = request_data['configuration']
        if 'material' not in configuration:
            raise ValueError("Missing required parameter: configuration.material")
        
        # Extract configuration details
        upload_id = request_data['uploadId']
        material = configuration['material']
        material_id = material.get('id', 'unknown_material')
        material_type = material.get('name', 'PLA')  # Default to PLA if no name
        
        # Get print options or use defaults
        print_options = configuration.get('printOptions', {})
        layer_height = float(print_options.get('layerHeight', 0.2))  # mm
        infill_percentage = int(print_options.get('infillPercentage', 20))  # %
        support_material = print_options.get('supportMaterial', False)  # Boolean
        
        # Get quantity or use default
        quantity = int(configuration.get('quantity', 1))
        
        # Resolve the upload_id to an actual file path
        # We assume upload_id is the filename in the UPLOAD_FOLDER
        if not upload_id: # Should have been caught by previous validation, but good to double check
            raise ValueError("uploadId is missing or empty.")

        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], upload_id)
        
        # Check if file exists
        if not os.path.exists(file_path):
            # Attempt to find in test_files as a fallback for local dev, though this should ideally not be needed
            # and indicates an issue with the upload_id or file persistence.
            print(f"File not found in UPLOAD_FOLDER: {file_path}. Checking test_files as fallback.")
            fallback_path = os.path.join(os.path.dirname(__file__), '..', 'test_files', upload_id)
            if os.path.exists(fallback_path):
                file_path = fallback_path
                print(f"Found file in test_files: {file_path}")
            else:
                # If current_app.file_service and get_file_info are available, we could use them for more detailed info
                # For now, stick to a simple file existence check.
                # Example: file_info = current_app.file_service.get_file_info(file_path)
                # if not file_info or not file_info['exists']:
                #     raise ValueError(f"STL file not found for upload ID: {upload_id}. Path checked: {file_path}")
                raise ValueError(f"STL file not found for upload ID: {upload_id}. Path checked: {file_path}")
        
        # Create slicing parameters from configuration
        slicing_params = SlicingParameters(
            layer_height=layer_height,
            infill_percentage=infill_percentage,
            material_type=material_type,
            support_material=support_material
        )
        
        # Get the services from app context
        slicer_service = current_app.slicer_service
        pricing_engine = current_app.pricing_engine
        
        # Call slicer service to analyze STL file
        print("*"*50)
        print(f"Calling slicer service with file_path={file_path}")
        sys.stdout.flush()
        try:
            slicing_result = slicer_service.slice_stl_file(file_path, slicing_params)
            print(f"Slicing successful: {slicing_result.success}")
        except Exception as e:
            print(f"Slicing error: {str(e)}")
            raise
        
        # Check if slicing was successful
        if not slicing_result.success:
            raise ValueError(f"STL slicing failed: {slicing_result.error_message}")
            
        # Get analysis data from slicing result
        model_analysis = slicing_result.analysis_data
        
        # Call pricing engine to calculate comprehensive quote
        additional_options = {
            'quantity': quantity,
            'rush_order': print_options.get('rushOrder', False)
        }
        
        print(f"Calling pricing engine with material_type={material_type}")
        quote_result = pricing_engine.calculate_comprehensive_quote(
            model_analysis, 
            material_type,
            additional_options
        )
        
        # Generate quote ID and timestamps
        current_time = datetime.utcnow()
        quote_id = str(uuid.uuid4())
        
        # Convert model analysis to frontend format
        frontend_model_analysis = {
            'volume': model_analysis.get('volume_cm3', 0.0),
            'surfaceArea': model_analysis.get('surface_area_cm2', 0.0),
            'boundingBox': {
                'x': model_analysis.get('bounding_box', {}).get('x', 0.0),
                'y': model_analysis.get('bounding_box', {}).get('y', 0.0),
                'z': model_analysis.get('bounding_box', {}).get('z', 0.0)
            },
            'complexity': 'MEDIUM',  # This could be derived from complexity_score
            'requiredSupports': model_analysis.get('support_volume_cm3', 0.0) > 0,
            'estimatedMaterial': model_analysis.get('filament_used_grams', 0.0),
            'estimatedPrintTime': model_analysis.get('print_time_minutes', 0.0)
        }
        
        # Create breakdowns from quote result
        cost_breakdowns = []
        
        # Add material cost
        if hasattr(quote_result, 'breakdown_details'):
            cost_breakdowns = quote_result.breakdown_details
        else:
            # Fallback if breakdown_details is not available
            cost_breakdowns = [
                {
                    'category': 'Materials',
                    'description': f'{material_type} filament ({model_analysis["filament_used_grams"]}g)',
                    'quantity': quantity,
                    'unitPrice': round(quote_result.material_cost, 2),
                    'total': round(quote_result.material_cost * quantity, 2)
                },
                {
                    'category': 'Labor',
                    'description': f'Printing & Production ({model_analysis["print_time_minutes"] / 60:.1f} hours)',
                    'quantity': quantity,
                    'unitPrice': round(quote_result.time_cost, 2),
                    'total': round(quote_result.time_cost * quantity, 2)
                }
            ]
        
        # Generate the response
        response_data = {
            'id': quote_id,
            'success': True,
            'sessionId': request.cookies.get('session_id', 'default-session'),
            'timestamp': current_time.isoformat(),
            'valid_until': (current_time + timedelta(hours=24)).isoformat(),
            'material': material,
            'color': material.get('colors', [{'name': 'White'}])[0].get('name', 'White'),
            'printOptions': print_options,
            'quantity': quantity,
            'modelAnalysis': frontend_model_analysis,
            'calculation': {
                'materialCost': round(quote_result.material_cost, 2),
                'laborCost': round(quote_result.time_cost, 2),
                'machineTime': model_analysis['print_time_minutes'],
                'setupCost': round(quote_result.overhead_cost, 2),
                'postProcessingCost': 0.0,
                'rushOrderSurcharge': 0.0,
                'colorSurcharge': 0.0,
                'quantityDiscount': 0.0,  # This would come from quote_result in a full implementation
                'subtotal': round(quote_result.subtotal, 2),
                'taxes': 0.0,  # This would be calculated based on tax rate in a full implementation
                'total': round(quote_result.total_cost, 2),
                'estimatedDelivery': (current_time + timedelta(days=7)).isoformat(),
                'breakdown': cost_breakdowns
            },
            'status': 'DRAFT',
            'createdAt': current_time.isoformat(),
            'updatedAt': current_time.isoformat()
        }
        
        print("*"*50)
        print("QUOTE CALCULATION SUCCESS")
        print(f"Slicing Result: {slicing_result.success}")
        print(f"Analysis Data: {slicing_result.analysis_data}")
        print(f"Quote Result: {quote_result}")
        print("*"*50)
        print("Sending successful quote response")
        return jsonify(response_data), 200
        
    except ValueError as e:
        print(f"Validation error in quote calculation: {str(e)}")
        error_response = {
            'success': False,
            'error': {
                'message': str(e),
                'details': [str(e)]
            }
        }
        return jsonify(error_response), 400
        
    except Exception as e:
        print(f"Error in quote calculation: {str(e)}")
        traceback.print_exc()
        error_response = {
            'success': False,
            'error': {
                'message': "Quote calculation failed",
                'details': [str(e)]
            }
        }
        return jsonify(error_response), 500
