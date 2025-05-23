import pytest
import tempfile
import shutil
import os

# Make sure backend.main can be imported
# This might require adding backend to sys.path or setting PYTHONPATH
# For now, assume it's discoverable or adjust as needed.
# If running pytest from the root of the repository, this should work:
from backend.main import create_app
from backend.services.file_service import FileService, FileValidationConfig
from backend.services.slicer_service import SlicerService
from backend.services.pricing_service import PricingService
# PaymentService will be tested for its absence when not configured

@pytest.fixture(scope='session')
def temp_upload_dir_session():
    """Creates a temporary directory for uploads for the entire test session."""
    temp_dir = tempfile.mkdtemp(prefix="pytest_uploads_")
    print(f"Created temporary upload directory for session: {temp_dir}")
    yield temp_dir
    print(f"Removing temporary upload directory for session: {temp_dir}")
    shutil.rmtree(temp_dir)

@pytest.fixture
def app(temp_upload_dir_session):
    """Create and configure a new app instance for each test."""
    
    # Create a specific subdirectory for this test app instance if needed,
    # or use the session-wide one directly. For simplicity, using session-wide.
    test_upload_folder = temp_upload_dir_session

    # Ensure the test upload folder exists for each test run using this fixture
    # (though temp_upload_dir_session should handle creation)
    if not os.path.exists(test_upload_folder):
        os.makedirs(test_upload_folder)

    app_config = {
        'TESTING': True,
        'DEBUG': False,  # Keep debug off for tests unless specifically needed
        'SECRET_KEY': 'pytest-secret-key',
        
        # File upload configuration
        'UPLOAD_FOLDER': test_upload_folder,
        'MAX_CONTENT_LENGTH': 10 * 1024 * 1024,  # 10MB for tests
        
        # Slicer configuration (use a mock or non-existent path for most tests)
        'SLICER_ENGINE_PATH': '/path/to/mock/slicer', # This won't be called if slicer is mocked

        # PayPal configuration - explicitly set to empty to test "no credentials" scenario
        'PAYPAL_CLIENT_ID': '',
        'PAYPAL_CLIENT_SECRET': '',
        'PAYPAL_WEBHOOK_ID': '',
        'PAYPAL_SANDBOX': True, # Doesn't matter if client_id/secret are empty
        
        'DEFAULT_CURRENCY': 'USD',
    }
    
    # Create app with test config
    app_instance = create_app(config_object=app_config)
    
    # Log service status from within the app context if possible (for debugging tests)
    with app_instance.app_context():
        from flask import current_app
        print(f"Test app UPLOAD_FOLDER: {current_app.config['UPLOAD_FOLDER']}")
        print(f"Test app FileService: {type(current_app.file_service)}")
        print(f"Test app SlicerService: {type(current_app.slicer_service)}")
        print(f"Test app PricingEngine: {type(current_app.pricing_engine)}")
        print(f"Test app PaymentService: {type(current_app.payment_service)} (Expected None due to no PayPal creds)")


    yield app_instance


@pytest.fixture
def client(app):
    """A test client for the app."""
    return app.test_client()

@pytest.fixture
def runner(app):
    """A test CLI runner for the app."""
    return app.test_cli_runner()

# Example of how to get the test data path
@pytest.fixture
def test_data_path():
    return os.path.join(os.path.dirname(__file__), 'test_data')
