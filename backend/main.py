import os
from flask import Flask, jsonify
from flask_cors import CORS
import structlog

# Import services
from services.file_service import FileService, FileValidationConfig
from services.slicer_service import SlicerService
from services.pricing_service import PricingService
from services.payment_service import PaymentService # Using the real PaymentService

# Import blueprints
from routes.quote import quote_bp
from routes.upload import upload_bp
from routes.payment import payment_bp
from routes.materials import materials_bp

logger = structlog.get_logger(__name__)

def create_app(config_object=None):
    """
    Application factory function.
    Initializes and configures the Flask application, services, and blueprints.
    """
    app = Flask(__name__)

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

    # Load configuration
    # Order of precedence: config_object > environment variables > defaults
    if isinstance(config_object, dict):
        app.config.from_mapping(config_object)
    elif config_object: # If it's an object (e.g. a class)
        app.config.from_object(config_object)

    # Environment variable configurations with defaults
    app.config.update(
        SECRET_KEY=os.getenv('SECRET_KEY', 'a-very-secret-key-that-should-be-changed'),
        DEBUG=os.getenv('FLASK_DEBUG', 'false').lower() in ['true', '1', 't'],
        
        # File upload configuration
        UPLOAD_FOLDER=os.getenv('UPLOAD_FOLDER', os.path.join(os.path.dirname(__file__), 'uploads')),
        MAX_CONTENT_LENGTH=int(os.getenv('MAX_CONTENT_LENGTH', 100 * 1024 * 1024)),  # 100MB
        
        # Slicer configuration (if any specific needed by SlicerService)
        SLICER_ENGINE_PATH=os.getenv('SLICER_ENGINE_PATH', '/usr/bin/prusa-slicer'), # Example

        # PayPal configuration
        PAYPAL_CLIENT_ID=os.getenv('PAYPAL_CLIENT_ID', ''),
        PAYPAL_CLIENT_SECRET=os.getenv('PAYPAL_CLIENT_SECRET', ''),
        PAYPAL_WEBHOOK_ID=os.getenv('PAYPAL_WEBHOOK_ID', ''),
        PAYPAL_SANDBOX=os.getenv('PAYPAL_SANDBOX', 'true').lower() in ['true', '1', 't'],
        
        # Pricing configuration (example, if PricingService needs it)
        DEFAULT_CURRENCY=os.getenv('DEFAULT_CURRENCY', 'USD'),
    )

    # Ensure upload folder exists
    if not os.path.exists(app.config['UPLOAD_FOLDER']):
        os.makedirs(app.config['UPLOAD_FOLDER'])
        logger.info(f"Created upload folder: {app.config['UPLOAD_FOLDER']}")

    # Configure CORS
    CORS(app, origins=os.getenv('CORS_ORIGINS', "http://localhost:3000").split(','), supports_credentials=True)

    # Initialize services
    logger.info("Initializing services...")
    try:
        # FileService
        file_validation_config = FileValidationConfig(
            max_file_size=app.config['MAX_CONTENT_LENGTH'],
            # allowed_extensions can be left to default or configured via env
        )
        app.file_service = FileService(
            upload_directory=app.config['UPLOAD_FOLDER'],
            validation_config=file_validation_config
        )
        logger.info("FileService initialized.", upload_dir=app.config['UPLOAD_FOLDER'])

        # SlicerService
        # Assuming SlicerService might take path to slicer executable or other config
        app.slicer_service = SlicerService(slicer_path=app.config.get('SLICER_ENGINE_PATH'))
        logger.info("SlicerService initialized.")

        # PricingService
        # Assuming PricingService might take currency or other config
        app.pricing_engine = PricingService(currency=app.config.get('DEFAULT_CURRENCY')) # Renamed to pricing_engine as used in quote.py
        logger.info("PricingService (as pricing_engine) initialized.")
        
        # PaymentService (using the real one)
        if app.config['PAYPAL_CLIENT_ID'] and app.config['PAYPAL_CLIENT_SECRET']:
            app.payment_service = PaymentService(
                client_id=app.config['PAYPAL_CLIENT_ID'],
                client_secret=app.config['PAYPAL_CLIENT_SECRET'],
                webhook_id=app.config['PAYPAL_WEBHOOK_ID'],
                sandbox_mode=app.config['PAYPAL_SANDBOX']
            )
            logger.info("PaymentService initialized.", sandbox=app.config['PAYPAL_SANDBOX'])
        else:
            app.payment_service = None # Or a fallback if we decide to use one explicitly here
            logger.warning("PaymentService not initialized due to missing PayPal credentials. Payment features will be disabled.")

    except Exception as e:
        logger.error("Error initializing services", error=str(e), exc_info=True)
        # Depending on severity, might want to raise the exception or exit
        # For now, log and continue, some routes might fail

    # Register Blueprints
    logger.info("Registering blueprints...")
    app.register_blueprint(quote_bp, url_prefix='/api/v1/quote')
    app.register_blueprint(upload_bp, url_prefix='/api/v1/upload')
    app.register_blueprint(payment_bp, url_prefix='/api/v1/payment')
    app.register_blueprint(materials_bp, url_prefix='/api/v1/materials')
    logger.info("Blueprints registered.")

    # Basic health check endpoint (can be expanded)
    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "healthy", 
            "message": "3D Print Quoting System Backend is running.",
            "services_status": {
                "file_service": "initialized" if hasattr(app, 'file_service') and app.file_service else "not_initialized",
                "slicer_service": "initialized" if hasattr(app, 'slicer_service') and app.slicer_service else "not_initialized",
                "pricing_engine": "initialized" if hasattr(app, 'pricing_engine') and app.pricing_engine else "not_initialized",
                "payment_service": "initialized" if hasattr(app, 'payment_service') and app.payment_service else "not_initialized (PayPal credentials missing or other issue)"
            }
        }), 200
        
    # Global OPTIONS route handler for preflight requests
    # This might be redundant if CORS is set up correctly for all blueprints
    @app.route('/', defaults={'path': ''}, methods=['OPTIONS'])
    @app.route('/<path:path>', methods=['OPTIONS'])
    def options_handler(path):
        response = jsonify({})
        # CORS headers are usually added by Flask-CORS globally or per-blueprint
        return response

    logger.info("Application creation complete.")
    return app

# Create the Flask app instance for Gunicorn or direct run
app = create_app()

if __name__ == '__main__':
    is_debug_mode = app.config.get('DEBUG', False)
    server_port = int(os.getenv('PORT', 5000))
    logger.info(f"Starting server on port {server_port} in {'debug' if is_debug_mode else 'production'} mode...")
    
    # Basic startup validation messages
    if not app.config.get('PAYPAL_CLIENT_ID') or not app.config.get('PAYPAL_CLIENT_SECRET'):
        logger.warning("PayPal environment variables (PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET) are not set. Payment processing will be disabled.")
    
    if not os.path.exists(app.config.get('SLICER_ENGINE_PATH', '')):
         logger.warning(f"Slicer engine path not found or not configured: {app.config.get('SLICER_ENGINE_PATH')}. Slicing will fail.")

    app.run(host='0.0.0.0', port=server_port, debug=is_debug_mode)
