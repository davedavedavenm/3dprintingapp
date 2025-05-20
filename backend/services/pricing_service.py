"""
Pricing Engine

Calculates 3D printing costs based on material, print time, and complexity.
This is a minimal placeholder implementation that will be expanded.
"""

from dataclasses import dataclass
from typing import Dict, List, Any, Optional

@dataclass
class QuoteResult:
    success: bool = True
    material_cost: float = 0.0
    time_cost: float = 0.0
    complexity_adjustment: float = 0.0
    overhead_cost: float = 0.0
    profit_margin: float = 0.0
    subtotal: float = 0.0
    total_cost: float = 0.0
    breakdown_details: Optional[List[Dict[str, Any]]] = None
    error_message: Optional[str] = None

class PricingEngine:
    """
    Service for calculating 3D printing costs based on analysis data.
    This is a minimal placeholder implementation.
    """
    
    def __init__(self):
        # Material costs and properties (placeholder data)
        self._material_catalog = {
            'PLA': {
                'cost_per_gram': 0.05,
                'density': 1.24,
                'available': True,
                'machine_cost_multiplier': 1.0,
            },
            'ABS': {
                'cost_per_gram': 0.07,
                'density': 1.04,
                'available': True,
                'machine_cost_multiplier': 1.2,
            },
            'PETG': {
                'cost_per_gram': 0.08,
                'density': 1.27,
                'available': True,
                'machine_cost_multiplier': 1.15,
            },
            'TPU': {
                'cost_per_gram': 0.15,
                'density': 1.21,
                'available': True,
                'machine_cost_multiplier': 1.5,
            }
        }
        
        # Pricing configuration
        self._machine_cost_per_hour = 5.00  # Base machine time cost
        self._overhead_rate = 0.10  # 10% overhead
        self._profit_margin = 0.20  # 20% profit margin
        
    def get_material_catalog(self) -> Dict[str, Dict]:
        """Return the current material catalog"""
        return self._material_catalog
        
    def calculate_comprehensive_quote(self, 
                                       analysis_data: Dict[str, Any], 
                                       material_type: str, 
                                       additional_options: Dict[str, Any] = None) -> QuoteResult:
        """
        Calculate comprehensive quote based on analysis data and selected options.
        This is a placeholder implementation that calculates reasonable pricing.
        """
        try:
            # Default additional options if not provided
            if additional_options is None:
                additional_options = {}
                
            # Extract analysis data
            filament_grams = analysis_data.get('filament_used_grams', 50.0)
            print_time_minutes = analysis_data.get('print_time_minutes', 120.0)
            complexity_score = analysis_data.get('complexity_score', 50)  # Default to medium
            
            # Handle material type (can be a string like "PLA" or a material name like "PLA Basic")
            # Normalize material type to a key in our catalog
            material_key = self._normalize_material_type(material_type)
            
            # Get material info (default to PLA if not found)
            material_info = self._material_catalog.get(material_key, self._material_catalog['PLA'])
            
            # Calculate material cost
            material_cost = filament_grams * material_info['cost_per_gram']
            
            # Calculate machine time cost
            machine_cost_multiplier = material_info.get('machine_cost_multiplier', 1.0)
            time_cost = (print_time_minutes / 60.0) * self._machine_cost_per_hour * machine_cost_multiplier
            
            # Apply complexity adjustment
            complexity_factor = complexity_score / 50.0  # Normalize to 1.0 at medium complexity
            complexity_adjustment = time_cost * (complexity_factor - 1.0) * 0.2  # 20% impact
            
            # Quantity adjustments
            quantity = additional_options.get('quantity', 1)
            quantity_discount = 0
            if quantity >= 10:
                quantity_discount = 0.10  # 10% for 10+ units
            elif quantity >= 5:
                quantity_discount = 0.05  # 5% for 5+ units
                
            # Special options
            rush_multiplier = 1.5 if additional_options.get('rush_order', False) else 1.0
            
            # Calculate base cost
            base_cost = material_cost + time_cost + complexity_adjustment
            
            # Apply quantity discount
            subtotal = base_cost * quantity * (1 - quantity_discount)
            
            # Apply rush order multiplier (only to time cost component)
            rush_surcharge = (time_cost * quantity * (rush_multiplier - 1)) if additional_options.get('rush_order', False) else 0
            
            # Apply overhead
            overhead_cost = subtotal * self._overhead_rate
            
            # Apply profit margin
            subtotal_with_overhead = subtotal + overhead_cost + rush_surcharge
            profit_margin = subtotal_with_overhead * self._profit_margin
            
            # Total cost
            total_cost = subtotal_with_overhead + profit_margin
            
            # Create detailed breakdown
            breakdown_details = [
                {
                    'category': 'Materials',
                    'description': f'{material_type} filament ({filament_grams:.1f}g)',
                    'quantity': quantity,
                    'unitPrice': material_cost,
                    'total': material_cost * quantity,
                },
                {
                    'category': 'Production',
                    'description': f'Printing time ({print_time_minutes/60:.1f} hours)',
                    'quantity': quantity,
                    'unitPrice': time_cost,
                    'total': time_cost * quantity,
                }
            ]
            
            # Add rush order if applicable
            if additional_options.get('rush_order', False):
                breakdown_details.append({
                    'category': 'Surcharges',
                    'description': 'Rush order premium',
                    'quantity': 1,
                    'unitPrice': rush_surcharge,
                    'total': rush_surcharge,
                })
                
            # Add complexity adjustment if significant
            if abs(complexity_adjustment) > 0.5:
                breakdown_details.append({
                    'category': 'Adjustments',
                    'description': f'Complexity {complexity_score}/100',
                    'quantity': quantity,
                    'unitPrice': complexity_adjustment,
                    'total': complexity_adjustment * quantity,
                })
                
            # Add quantity discount if applicable
            if quantity_discount > 0:
                discount_amount = base_cost * quantity * quantity_discount
                breakdown_details.append({
                    'category': 'Discounts',
                    'description': f'Quantity discount ({int(quantity_discount*100)}%)',
                    'quantity': 1,
                    'unitPrice': -discount_amount,
                    'total': -discount_amount,
                })
                
            # Return comprehensive quote result
            return QuoteResult(
                success=True,
                material_cost=material_cost,
                time_cost=time_cost,
                complexity_adjustment=complexity_adjustment,
                overhead_cost=overhead_cost,
                profit_margin=profit_margin,
                subtotal=subtotal,
                total_cost=total_cost,
                breakdown_details=breakdown_details
            )
        except Exception as e:
            # Return error result
            return QuoteResult(
                success=False,
                error_message=f"Pricing calculation failed: {str(e)}"
            )
            
    def _normalize_material_type(self, material_type: str) -> str:
        """
        Normalize material type to a key in our catalog
        This handles material types that might be "PLA Basic" instead of just "PLA"
        """
        # Convert to uppercase for consistency
        material_upper = material_type.upper()
        
        # Check for exact match
        if material_upper in self._material_catalog:
            return material_upper
            
        # Check for partial match (e.g., "PLA Basic" -> "PLA")
        for catalog_key in self._material_catalog.keys():
            if catalog_key in material_upper:
                return catalog_key
                
        # Default to PLA if no match found
        return "PLA"
