import pytest
import os
import json
from unittest.mock import patch, MagicMock

# Assuming conftest.py is in the same directory or discoverable
# and provides 'client', 'app', 'test_data_path'
from flask import current_app

# Import the actual service classes for type checking
from backend.services.file_service import FileService
from backend.services.slicer_service import SlicerService, SlicingResult, SlicerOutputFiles, ModelAnalysis
from backend.services.pricing_service import PricingService
from backend.services.payment_service import PaymentService # Real one

# Mock analysis data for our test STL files
# These values should be distinct enough to differentiate the files.
# Dimensions are in mm for PrusaSlicer typically. Volume in cm^3, filament in grams.
MOCK_ANALYSIS_SMALL_CUBE = ModelAnalysis(
    volume_cm3=1.0,  # 1mm x 1mm x 1mm cube is 0.001 cm^3, let's say it's a 1cm cube for simplicity
    surface_area_cm2=6.0,
    bounding_box={'x': 10.0, 'y': 10.0, 'z': 10.0}, # mm
    filament_used_grams=2.0, # Small amount for a 1cm cube
    print_time_minutes=5,
    support_volume_cm3=0.0,
    complexity_score=0.1
)

MOCK_ANALYSIS_LARGE_CUBE = ModelAnalysis(
    volume_cm3=1000.0, # 10cm x 10cm x 10cm cube
    surface_area_cm2=600.0,
    bounding_box={'x': 100.0, 'y': 100.0, 'z': 100.0}, # mm
    filament_used_grams=200.0, # Larger amount
    print_time_minutes=120,
    support_volume_cm3=0.0,
    complexity_score=0.2 # Slightly more complex due to size
)


def test_quote_with_specific_file_usage(client, app, test_data_path):
    """
    Tests that the quote calculation uses the specific file uploaded.
    Mocks the slicer service to control its output and verify input.
    """
    small_cube_filename = "small_cube.stl"
    large_cube_filename = "large_cube.stl"
    small_cube_path = os.path.join(test_data_path, small_cube_filename)
    large_cube_path = os.path.join(test_data_path, large_cube_filename)

    # Path where FileService will store the uploaded files (from app config)
    upload_folder = app.config['UPLOAD_FOLDER']

    # --- Mock SlicerService ---
    # This mock will check which file is being sliced and return corresponding data.
    mock_slicer_service_instance = MagicMock(spec=SlicerService)

    def mock_slice_stl_file(file_path, slicing_params):
        # We need to check the *actual* path given to the slicer,
        # which should be in the app's UPLOAD_FOLDER.
        # The 'upload_id' from the upload endpoint will be the filename part.
        
        # Construct expected paths in the upload folder
        expected_small_cube_uploaded_path = os.path.join(upload_folder, small_cube_filename)
        expected_large_cube_uploaded_path = os.path.join(upload_folder, large_cube_filename)

        if file_path == expected_small_cube_uploaded_path:
            return SlicingResult(success=True, analysis_data=MOCK_ANALYSIS_SMALL_CUBE, output_files=SlicerOutputFiles(gcode_path="dummy.gcode"))
        elif file_path == expected_large_cube_uploaded_path:
            return SlicingResult(success=True, analysis_data=MOCK_ANALYSIS_LARGE_CUBE, output_files=SlicerOutputFiles(gcode_path="dummy.gcode"))
        else:
            pytest.fail(f"mock_slice_stl_file called with unexpected file_path: {file_path}")
            return SlicingResult(success=False, error_message="Test mock: Unknown file path")

    mock_slicer_service_instance.slice_stl_file.side_effect = mock_slice_stl_file

    with app.app_context():
        # Replace the actual slicer_service with our mock *on the current_app*
        # This is a bit tricky because app.slicer_service is set during create_app.
        # We'll patch it where it's used or use a context manager if pytest-flask offers one.
        # For now, let's assume direct patching on current_app works for the test duration.
        # A better way might be to make services replaceable in the app factory for tests.
        # However, the services are already attached to 'app' from conftest.
        # We can re-attach a mock to the 'app' object passed to this test.
        original_slicer_service = app.slicer_service
        app.slicer_service = mock_slicer_service_instance
        
        # --- Test with small_cube.stl ---
        with open(small_cube_path, 'rb') as f_small:
            upload_resp_small = client.post('/api/v1/upload/stl', data={'file': (f_small, small_cube_filename)})
        
        assert upload_resp_small.status_code == 201
        upload_data_small = upload_resp_small.json
        assert upload_data_small['success']
        # The 'upload_id' in the previous subtask was assumed to be the filename itself.
        # The FileService in main.py generates a secure filename. We need to get that.
        # The upload route in routes/upload.py returns 'file_id' (secure_filename) and 'original_filename'.
        # Let's use 'file_id' which is the secure filename.
        small_cube_upload_id = upload_data_small['file_id'] 
        assert small_cube_filename in small_cube_upload_id # Secure name contains original with hash

        quote_payload_small = {
            "uploadId": small_cube_upload_id,
            "configuration": {
                "material": {"id": "pla_standard", "name": "PLA"},
                "printOptions": {"layerHeight": 0.2, "infillPercentage": 20}
            }
        }
        quote_resp_small = client.post('/api/v1/quote/calculate', json=quote_payload_small)
        assert quote_resp_small.status_code == 200, f"Small cube quote error: {quote_resp_small.text}"
        quote_data_small = quote_resp_small.json
        assert quote_data_small['success']
        
        # Check that slicer was called with the correct uploaded file path
        expected_small_cube_slicer_path = os.path.join(upload_folder, small_cube_upload_id)
        # mock_slicer_service_instance.slice_stl_file.assert_any_call(expected_small_cube_slicer_path, ANY) # ANY from unittest.mock
        # More precise check:
        found_call_small = False
        for call_args in mock_slicer_service_instance.slice_stl_file.call_args_list:
            if call_args[0][0] == expected_small_cube_slicer_path:
                found_call_small = True
                break
        assert found_call_small, f"Slicer not called with {expected_small_cube_slicer_path}"

        assert quote_data_small['modelAnalysis']['volume'] == MOCK_ANALYSIS_SMALL_CUBE.volume_cm3
        assert quote_data_small['modelAnalysis']['estimatedMaterial'] == MOCK_ANALYSIS_SMALL_CUBE.filament_used_grams

        # --- Test with large_cube.stl ---
        with open(large_cube_path, 'rb') as f_large:
            upload_resp_large = client.post('/api/v1/upload/stl', data={'file': (f_large, large_cube_filename)})
        
        assert upload_resp_large.status_code == 201
        upload_data_large = upload_resp_large.json
        assert upload_data_large['success']
        large_cube_upload_id = upload_data_large['file_id']
        assert large_cube_filename in large_cube_upload_id

        quote_payload_large = {
            "uploadId": large_cube_upload_id,
            "configuration": {
                "material": {"id": "pla_standard", "name": "PLA"},
                "printOptions": {"layerHeight": 0.2, "infillPercentage": 20}
            }
        }
        quote_resp_large = client.post('/api/v1/quote/calculate', json=quote_payload_large)
        assert quote_resp_large.status_code == 200, f"Large cube quote error: {quote_resp_large.text}"
        quote_data_large = quote_resp_large.json
        assert quote_data_large['success']

        expected_large_cube_slicer_path = os.path.join(upload_folder, large_cube_upload_id)
        found_call_large = False
        for call_args in mock_slicer_service_instance.slice_stl_file.call_args_list:
            if call_args[0][0] == expected_large_cube_slicer_path:
                found_call_large = True
                break
        assert found_call_large, f"Slicer not called with {expected_large_cube_slicer_path}"
        
        assert quote_data_large['modelAnalysis']['volume'] == MOCK_ANALYSIS_LARGE_CUBE.volume_cm3
        assert quote_data_large['modelAnalysis']['estimatedMaterial'] == MOCK_ANALYSIS_LARGE_CUBE.filament_used_grams
        
        # Restore original service if it matters for other tests (though app fixture re-creates app)
        app.slicer_service = original_slicer_service


def test_service_types_and_paypal_behavior(app, client):
    """
    Tests that the correct service types are loaded and
    that PaymentService behaves as expected (None) when not configured.
    """
    with app.app_context():
        # Verify service types
        assert isinstance(current_app.file_service, FileService), \
            f"Expected FileService, got {type(current_app.file_service)}"
        assert isinstance(current_app.slicer_service, SlicerService), \
            f"Expected SlicerService, got {type(current_app.slicer_service)}"
        assert isinstance(current_app.pricing_engine, PricingService), \
            f"Expected PricingService, got {type(current_app.pricing_engine)}"
        
        # Verify PaymentService is None due to lack of PayPal credentials in test config
        assert current_app.payment_service is None, \
            f"Expected PaymentService to be None, got {type(current_app.payment_service)}"

    # Test behavior of a payment endpoint when PaymentService is None
    # This depends on how backend/routes/payment.py handles a None payment_service.
    # Let's assume it should return a 503 or similar if service is unavailable.
    # (Need to inspect payment.py to confirm the expected error)
    
    # Example: Create Order endpoint
    # The payment routes in `main_simple.py` had checks for `app.config['PAYPAL_CLIENT_ID']`
    # The routes in `payment.py` should ideally check `current_app.payment_service`
    
    # Let's craft a minimal payload for create-order
    # Based on backend/routes/payment.py, it expects 'quote_id', 'amount', 'currency'
    create_order_payload = {
        "quote_id": "test-quote-123",
        "user_id": "test-user-456", # Assuming user_id is also needed by payment route
        "amount": "100.00", # Amount and currency might be from quote later
        "currency": "USD",
        "customer_details": { "email": "test@example.com" } # from PayPalOrderRequestSchema
    }
    
    # Before making the call, let's quickly check payment.py for its behavior.
    # Assuming payment.py has a check like:
    # if not current_app.payment_service:
    #     return jsonify({"error": "Payment service not available"}), 503
    
    response = client.post('/api/v1/payment/create-order', json=create_order_payload)
    
    # Based on backend/main.py, if payment_service is None, an attempt to use it
    # in a route should be guarded. The routes in backend/routes/payment.py
    # should check `if not current_app.payment_service:`
    # The default behavior if not guarded would be an AttributeError, leading to a 500.
    # The main.py setup logs a warning but doesn't prevent routes from being called.
    # The route itself must be robust.
    
    # Expected: The route in payment.py should detect payment_service is None and return an error.
    # Let's assume it returns 503 Service Unavailable or 400 Bad Request with specific error.
    # This requires payment.py to have such checks.
    # If payment.py doesn't have this check, this test might get a 500.
    
    # Let's check the actual error message from payment.py (if it has one)
    # For now, let's assume it's a 503 or a clear error message.
    # From looking at `backend/routes/payment.py`, it checks:
    # `if not current_app.payment_service: return jsonify(standard_error_response("Payment service not configured.")), 503`
    
    assert response.status_code == 503
    assert response.json is not None
    assert "error" in response.json
    assert "Payment service not configured" in response.json["error"]["message"]

def test_health_check_shows_service_status(client, app):
    """Test that the /health endpoint reflects service initialization status."""
    response = client.get('/health')
    assert response.status_code == 200
    health_data = response.json
    
    assert health_data['status'] == 'healthy'
    services_status = health_data['services_status']
    
    assert services_status['file_service'] == 'initialized'
    assert services_status['slicer_service'] == 'initialized'
    assert services_status['pricing_engine'] == 'initialized'
    # In our test setup (conftest.py), PayPal creds are empty, so payment_service is None
    assert 'not_initialized' in services_status['payment_service']

    # To test the "initialized" state for payment_service,
    # we'd need another app fixture with PayPal creds.
    # For this task, showing it's "not_initialized" when creds are missing is sufficient.

# To run these tests:
# 1. Ensure pytest and pytest-flask are installed.
# 2. Navigate to the root of the repository.
# 3. Run `PYTHONPATH=. pytest backend/tests/test_quote_api.py`
#    (PYTHONPATH=. ensures backend.main etc. can be found)
#    Alternatively, if your project is structured as a package, pytest might find it automatically.
#    Or configure pytest to find your backend package.
#
# Make sure the UPLOAD_FOLDER used in tests is cleaned up.
# The temp_upload_dir_session fixture in conftest.py should handle this.

# Further considerations for real-world testing:
# - Test SlicerService failure (e.g., if slicer executable is invalid or STL is corrupt).
# - Test PricingService with various inputs.
# - Test FileService validations (max size, file types).
# - More detailed tests for PaymentService if it were configured (mocking PayPal API calls).
# - Parameterize tests for different materials, print options, etc.
