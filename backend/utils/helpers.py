"""
Helper Functions

Common utility functions for the quote API.
"""

from flask import jsonify
from typing import List

def create_error_response(message: str, errors: List[str], status_code: int = 400) -> tuple:
    """
    Create a standardized error response
    
    Args:
        message: Main error message
        errors: List of detailed error explanations
        status_code: HTTP status code to return
        
    Returns:
        tuple: (flask.Response, int) tuple with JSON error and status code
    """
    response = {
        'success': False,
        'error': {
            'message': message,
            'details': errors
        }
    }
    return jsonify(response), status_code

def format_currency(amount: float) -> str:
    """Format a number as USD currency"""
    return f"${amount:.2f}"
