"""
Validators

Input validation utilities for API request data.
"""

def validate_quote_request(data: dict) -> dict:
    """
    Validate quote calculation request data
    
    Returns:
        dict: Validation result with keys:
            - valid (bool): Whether the data is valid
            - errors (list): List of error messages if invalid
    """
    errors = []
    
    # Check required fields
    if 'uploadId' not in data:
        errors.append("Missing required field: uploadId")
    
    if 'configuration' not in data:
        errors.append("Missing required field: configuration")
    else:
        config = data['configuration']
        if 'material' not in config:
            errors.append("Missing required field: configuration.material")
        
        # Validate material
        if 'material' in config and not config['material']:
            errors.append("Empty value for required field: configuration.material")
        
        # Validate print options if present
        if 'printOptions' in config:
            print_options = config['printOptions']
            
            if 'infillPercentage' in print_options:
                try:
                    infill = float(print_options['infillPercentage'])
                    if infill < 0 or infill > 100:
                        errors.append("Invalid infillPercentage: Must be between 0 and 100")
                except (ValueError, TypeError):
                    errors.append("Invalid infillPercentage: Must be a number")
                    
            if 'layerHeight' in print_options:
                try:
                    layer_height = float(print_options['layerHeight'])
                    if layer_height < 0.05 or layer_height > 0.4:
                        errors.append("Invalid layerHeight: Must be between 0.05 and 0.4 mm")
                except (ValueError, TypeError):
                    errors.append("Invalid layerHeight: Must be a number")
        
        # Validate quantity if present
        if 'quantity' in config:
            try:
                quantity = int(config['quantity'])
                if quantity < 1:
                    errors.append("Invalid quantity: Must be at least 1")
            except (ValueError, TypeError):
                errors.append("Invalid quantity: Must be an integer")
    
    # If we have more than 3 errors, just return the first 3 to avoid overwhelming
    if len(errors) > 3:
        errors = errors[:3]
            
    # Return validation result
    return {
        'valid': len(errors) == 0,
        'errors': errors
    }
