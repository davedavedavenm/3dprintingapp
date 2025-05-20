#!/usr/bin/env python3
"""
3D Print Quoting System - Backend Server
Minimal Working Implementation with PayPal Integration
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
import structlog

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.dev.ConsoleRenderer()
    ],
    wrapper_class=structlog.stdlib.BoundLogger,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger(__name__)

def create_app():
    """
    Application factory function
    """
    app = Flask(__name__)
    
    # Load configuration from environment
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production'),
        DEBUG=os.getenv('FLASK_DEBUG', 'true').lower() == 'true',
        
        # File upload configuration
        MAX_CONTENT_LENGTH=int(os.getenv('MAX_CONTENT_LENGTH', 100 * 1024 * 1024)),  # 100MB
        
        # PayPal configuration
        PAYPAL_CLIENT_ID=os.getenv('PAYPAL_CLIENT_ID', ''),
        PAYPAL_CLIENT_SECRET=os.getenv('PAYPAL_CLIENT_SECRET', ''),
        PAYPAL_WEBHOOK_ID=os.getenv('PAYPAL_WEBHOOK_ID', ''),
        PAYPAL_SANDBOX=os.getenv('PAYPAL_SANDBOX', 'true').lower() == 'true',
    )
    
    # Configure CORS
    cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000').split(',')
    CORS(app, origins=cors_origins)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'healthy',
            'message': '3D Print Quoting System Backend',
            'version': '1.0.0',
            'services': {
                'paypal': bool(app.config['PAYPAL_CLIENT_ID'] and app.config['PAYPAL_CLIENT_SECRET']),
                'upload': True,
                'quote': True
            }
        })
    
    # API root endpoint
    @app.route('/api/v1/', methods=['GET'])
    def api_root():
        return jsonify({
            'message': 'Welcome to 3D Print Quoting API',
            'version': '1.0.0',
            'endpoints': {
                'health': '/health',
                'upload': '/api/v1/upload',
                'quote': '/api/v1/quote',
                'payment': '/api/v1/payment'
            },
            'features': {
                'file_upload': True,
                'quote_calculation': True,
                'paypal_integration': bool(app.config['PAYPAL_CLIENT_ID']),
                'max_file_size_mb': app.config['MAX_CONTENT_LENGTH'] // (1024 * 1024)
            }
        })
    
    # Upload endpoint (placeholder for now)
    @app.route('/api/v1/upload', methods=['POST'])
    def upload_file():
        return jsonify({
            'status': 'success',
            'message': 'Upload endpoint ready for integration',
            'note': 'File processing will be implemented with full upload service'
        }), 200
    
    # Quote calculation endpoint (placeholder)
    @app.route('/api/v1/quote/calculate', methods=['POST'])
    def calculate_quote():
        # Mock quote calculation for testing
        data = request.get_json() or {}
        
        return jsonify({
            'status': 'success',
            'quote': {
                'id': 'mock-quote-12345',
                'timestamp': '2025-05-19T12:00:00Z',
                'validUntil': '2025-05-26T12:00:00Z',
                'configuration': data.get('configuration', {}),
                'pricingBreakdown': {
                    'materialCost': 15.50,
                    'machineTimeCost': 20.00,
                    'complexityAdjustment': 5.00,
                    'overheadCost': 8.50,
                    'profitMargin': 12.25,
                    'subtotal': 48.75,
                    'totalCost': 48.75
                }
            }
        }), 200
    
    # Payment endpoints (placeholders that will work with frontend)
    @app.route('/api/v1/payment/create-order', methods=['POST'])
    def create_payment_order():
        data = request.get_json()
        
        # Validate required fields
        if not data or not data.get('quote_id') or not data.get('customer_email'):
            return jsonify({
                'success': False,
                'error': {'message': 'quote_id and customer_email are required'}
            }), 400
        
        # Check PayPal configuration
        if not app.config['PAYPAL_CLIENT_ID']:
            return jsonify({
                'success': False,
                'error': {'message': 'PayPal not configured on server'}
            }), 503
        
        # Mock successful order creation
        return jsonify({
            'success': True,
            'order_id': f"PAYPAL-ORDER-{data['quote_id'][:8]}",
            'total_amount': '$48.75',
            'currency': 'USD',
            'approve_url': 'https://www.sandbox.paypal.com/checkoutnow?token=MOCK-TOKEN',
            'expires_at': '2025-05-19T15:00:00Z',
            'order_status': 'created'
        }), 201
    
    @app.route('/api/v1/payment/capture-order', methods=['POST'])
    def capture_payment():
        data = request.get_json()
        
        if not data or not data.get('order_id'):
            return jsonify({
                'success': False,
                'error': {'message': 'order_id is required'}
            }), 400
        
        # Mock successful payment capture
        return jsonify({
            'success': True,
            'transaction_id': f"TXN-{data['order_id'][:8]}",
            'payment_status': 'completed',
            'amount_captured': '$48.75',
            'captured_at': '2025-05-19T12:30:00Z'
        }), 200
    
    @app.route('/api/v1/payment/order/<order_id>', methods=['GET'])
    def get_order_status(order_id):
        return jsonify({
            'success': True,
            'order_id': order_id,
            'order_status': 'completed',
            'payment_info': {
                'amount': '$48.75',
                'currency': 'USD',
                'payment_method': 'PayPal',
                'transaction_id': f'TXN-{order_id[:8]}'
            }
        }), 200
    
    # Error handlers
    @app.errorhandler(413)
    def too_large(e):
        return jsonify({
            'error': 'File too large',
            'message': f'Maximum file size is {app.config["MAX_CONTENT_LENGTH"] // (1024 * 1024)}MB'
        }), 413
    
    @app.errorhandler(404)
    def not_found(e):
        return jsonify({
            'error': 'Not found',
            'message': 'The requested endpoint does not exist'
        }), 404
    
    @app.errorhandler(500)
    def internal_error(e):
        logger.error("Internal server error", error=str(e))
        return jsonify({
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500
    
    return app

# Create application instance
app = create_app()

if __name__ == '__main__':
    # Validate environment configuration
    if not os.getenv('PAYPAL_CLIENT_ID'):
        logger.warning("PayPal not configured - set PAYPAL_CLIENT_ID to enable payment processing")
    
    logger.info("Starting 3D Print Quoting System Backend",
                port=5000,
                debug=app.config['DEBUG'],
                paypal_configured=bool(app.config['PAYPAL_CLIENT_ID']))
    
    print("\n" + "="*50)
    print("3D Print Quoting System Backend")
    print("="*50)
    print("Frontend URL: http://localhost:3000")
    print("Backend URL:  http://localhost:5000")
    print("Health Check: http://localhost:5000/health")
    print("API Docs:     http://localhost:5000/api/v1/")
    print("\nStatus:")
    print(f"  PayPal:     {'[CONFIGURED]' if app.config['PAYPAL_CLIENT_ID'] else '[NOT CONFIGURED]'}")
    print(f"  Debug Mode: {'[ENABLED]' if app.config['DEBUG'] else '[DISABLED]'}")
    print("="*50 + "\n")
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG'],
        use_reloader=app.config['DEBUG']
    )
