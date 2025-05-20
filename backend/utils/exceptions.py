"""
Custom Exception Classes

This module defines custom exceptions for the 3D print quoting system
to provide clear error handling and improved debugging capabilities.

Technical Architecture:
- Hierarchical exception structure for categorization
- Detailed error information with context
- Integration with structured logging system
- Standardized error codes for API responses
"""

import structlog
from typing import Dict, Any, Optional

# Configure module logger
logger = structlog.get_logger(__name__)


class BaseQuotingError(Exception):
    """
    Base exception class for all 3D print quoting system errors
    
    Provides common functionality for error handling including
    error codes, context information, and logging integration.
    """
    
    def __init__(self, 
                 message: str,
                 error_code: str = None,
                 context: Dict[str, Any] = None,
                 original_exception: Exception = None):
        """
        Initialize base exception
        
        Args:
            message: Human-readable error message
            error_code: Unique error identifier
            context: Additional error context information
            original_exception: Original exception that caused this error
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code or self._get_default_error_code()
        self.context = context or {}
        self.original_exception = original_exception
        
        # Log exception occurrence
        logger.error(
            "Exception raised",
            exception_type=self.__class__.__name__,
            message=message,
            error_code=self.error_code,
            context=self.context
        )
    
    def _get_default_error_code(self) -> str:
        """Generate default error code from class name"""
        class_name = self.__class__.__name__
        # Convert CamelCase to snake_case
        import re
        return re.sub(r'(?<!^)(?=[A-Z])', '_', class_name).lower()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API responses"""
        return {
            'error_type': self.__class__.__name__,
            'error_code': self.error_code,
            'message': self.message,
            'context': self.context
        }
    
    def __str__(self) -> str:
        """String representation of exception"""
        return f"{self.__class__.__name__}: {self.message}"


# File processing exceptions

class FileProcessingError(BaseQuotingError):
    """Base exception for file processing errors"""
    pass


class FileUploadError(FileProcessingError):
    """Exception raised during file upload operations"""
    
    def __init__(self, message: str, filename: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if filename:
            self.context['filename'] = filename


class FileValidationError(FileProcessingError):
    """Exception raised when file validation fails"""
    
    def __init__(self, message: str, validation_errors: list = None, **kwargs):
        super().__init__(message, **kwargs)
        if validation_errors:
            self.context['validation_errors'] = validation_errors


class FileSizeExceededError(FileProcessingError):
    """Exception raised when uploaded file exceeds size limit"""
    
    def __init__(self, message: str, file_size: int = None, max_size: int = None, **kwargs):
        super().__init__(message, **kwargs)
        if file_size:
            self.context['file_size'] = file_size
        if max_size:
            self.context['max_size'] = max_size


class UnsupportedFileTypeError(FileProcessingError):
    """Exception raised for unsupported file types"""
    
    def __init__(self, message: str, file_type: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if file_type:
            self.context['file_type'] = file_type


class VirusDetectedError(FileProcessingError):
    """Exception raised when virus is detected in uploaded file"""
    
    def __init__(self, message: str, threat_name: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if threat_name:
            self.context['threat_name'] = threat_name


# STL processing exceptions

class STLProcessingError(BaseQuotingError):
    """Base exception for STL file processing errors"""
    pass


class STLParsingError(STLProcessingError):
    """Exception raised when STL file cannot be parsed"""
    
    def __init__(self, message: str, stl_file: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if stl_file:
            self.context['stl_file'] = stl_file


class SlicingError(STLProcessingError):
    """Exception raised during PrusaSlicer operations"""
    
    def __init__(self, message: str, 
                 slicer_command: list = None,
                 return_code: int = None,
                 output: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if slicer_command:
            self.context['slicer_command'] = ' '.join(slicer_command)
        if return_code is not None:
            self.context['return_code'] = return_code
        if output:
            self.context['slicer_output'] = output


class SlicerNotFoundError(STLProcessingError):
    """Exception raised when PrusaSlicer executable is not found"""
    
    def __init__(self, message: str, slicer_path: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if slicer_path:
            self.context['slicer_path'] = slicer_path


class GCodeAnalysisError(STLProcessingError):
    """Exception raised during G-code analysis"""
    
    def __init__(self, message: str, gcode_file: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if gcode_file:
            self.context['gcode_file'] = gcode_file


# Pricing exceptions

class PricingError(BaseQuotingError):
    """Base exception for pricing calculation errors"""
    pass


class InvalidMaterialError(PricingError):
    """Exception raised for invalid material specifications"""
    
    def __init__(self, message: str, material_type: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if material_type:
            self.context['material_type'] = material_type


class PricingConfigurationError(PricingError):
    """Exception raised for pricing configuration issues"""
    
    def __init__(self, message: str, configuration_key: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if configuration_key:
            self.context['configuration_key'] = configuration_key


class QuoteCalculationError(PricingError):
    """Exception raised during quote calculation"""
    
    def __init__(self, message: str, 
                 analysis_data: dict = None,
                 material_type: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if analysis_data:
            self.context['analysis_data'] = analysis_data
        if material_type:
            self.context['material_type'] = material_type


class QuoteNotFoundError(PricingError):
    """Exception raised when quote cannot be found"""
    
    def __init__(self, message: str, quote_id: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if quote_id:
            self.context['quote_id'] = quote_id


class QuoteExpiredError(PricingError):
    """Exception raised when quote has expired"""
    
    def __init__(self, message: str, 
                 quote_id: str = None,
                 expiry_date: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if quote_id:
            self.context['quote_id'] = quote_id
        if expiry_date:
            self.context['expiry_date'] = expiry_date


# Payment processing exceptions

class PaymentProcessingError(BaseQuotingError):
    """Base exception for payment processing errors"""
    pass


class PayPalAPIError(PaymentProcessingError):
    """Exception raised for PayPal API errors"""
    
    def __init__(self, message: str,
                 api_response: dict = None,
                 status_code: int = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if api_response:
            self.context['api_response'] = api_response
        if status_code:
            self.context['status_code'] = status_code


class OrderCreationError(PaymentProcessingError):
    """Exception raised during order creation"""
    
    def __init__(self, message: str, 
                 quote_id: str = None,
                 customer_email: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if quote_id:
            self.context['quote_id'] = quote_id
        if customer_email:
            self.context['customer_email'] = customer_email


class PaymentCaptureError(PaymentProcessingError):
    """Exception raised during payment capture"""
    
    def __init__(self, message: str, 
                 order_id: str = None,
                 capture_response: dict = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if order_id:
            self.context['order_id'] = order_id
        if capture_response:
            self.context['capture_response'] = capture_response


class WebhookValidationError(PaymentProcessingError):
    """Exception raised during webhook validation"""
    
    def __init__(self, message: str,
                 transmission_id: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if transmission_id:
            self.context['transmission_id'] = transmission_id


class PaymentAuthenticationError(PaymentProcessingError):
    """Exception raised for payment authentication failures"""
    
    def __init__(self, message: str, auth_method: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if auth_method:
            self.context['auth_method'] = auth_method


# Validation exceptions

class ValidationError(BaseQuotingError):
    """Base exception for validation errors"""
    pass


class RequestValidationError(ValidationError):
    """Exception raised for invalid API requests"""
    
    def __init__(self, message: str, 
                 validation_errors: list = None,
                 request_data: dict = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if validation_errors:
            self.context['validation_errors'] = validation_errors
        if request_data:
            # Sanitize sensitive data before storing in context
            sanitized_data = self._sanitize_request_data(request_data)
            self.context['request_data'] = sanitized_data
    
    def _sanitize_request_data(self, data: dict) -> dict:
        """Remove sensitive information from request data"""
        sensitive_keys = {'password', 'token', 'secret', 'credit_card', 'cvv'}
        sanitized = {}
        
        for key, value in data.items():
            if any(sensitive_key in key.lower() for sensitive_key in sensitive_keys):
                sanitized[key] = '[REDACTED]'
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_request_data(value)
            else:
                sanitized[key] = value
        
        return sanitized


class ParameterValidationError(ValidationError):
    """Exception raised for invalid parameters"""
    
    def __init__(self, message: str, 
                 parameter_name: str = None,
                 parameter_value: Any = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if parameter_name:
            self.context['parameter_name'] = parameter_name
        if parameter_value is not None:
            self.context['parameter_value'] = str(parameter_value)


# Configuration exceptions

class ConfigurationError(BaseQuotingError):
    """Base exception for configuration errors"""
    pass


class MissingConfigurationError(ConfigurationError):
    """Exception raised for missing configuration values"""
    
    def __init__(self, message: str, 
                 config_key: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if config_key:
            self.context['config_key'] = config_key


class InvalidConfigurationError(ConfigurationError):
    """Exception raised for invalid configuration values"""
    
    def __init__(self, message: str,
                 config_key: str = None,
                 config_value: Any = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if config_key:
            self.context['config_key'] = config_key
        if config_value is not None:
            self.context['config_value'] = str(config_value)


# Service exceptions

class ServiceError(BaseQuotingError):
    """Base exception for service-level errors"""
    pass


class ServiceUnavailableError(ServiceError):
    """Exception raised when a service is unavailable"""
    
    def __init__(self, message: str, service_name: str = None, **kwargs):
        super().__init__(message, **kwargs)
        if service_name:
            self.context['service_name'] = service_name


class ServiceTimeoutError(ServiceError):
    """Exception raised when a service operation times out"""
    
    def __init__(self, message: str,
                 service_name: str = None,
                 timeout_seconds: float = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if service_name:
            self.context['service_name'] = service_name
        if timeout_seconds:
            self.context['timeout_seconds'] = timeout_seconds


class ExternalServiceError(ServiceError):
    """Exception raised for external service failures"""
    
    def __init__(self, message: str,
                 service_name: str = None,
                 service_response: dict = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if service_name:
            self.context['service_name'] = service_name
        if service_response:
            self.context['service_response'] = service_response


# Database exceptions

class DatabaseError(BaseQuotingError):
    """Base exception for database-related errors"""
    pass


class DatabaseConnectionError(DatabaseError):
    """Exception raised for database connection failures"""
    
    def __init__(self, message: str, 
                 database_url: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if database_url:
            # Sanitize database URL to remove credentials
            sanitized_url = self._sanitize_database_url(database_url)
            self.context['database_url'] = sanitized_url
    
    def _sanitize_database_url(self, url: str) -> str:
        """Remove credentials from database URL"""
        import re
        return re.sub(r'://[^:]+:[^@]+@', '://***:***@', url)


class RecordNotFoundError(DatabaseError):
    """Exception raised when database record is not found"""
    
    def __init__(self, message: str,
                 table_name: str = None,
                 record_id: Any = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if table_name:
            self.context['table_name'] = table_name
        if record_id:
            self.context['record_id'] = str(record_id)


class DataIntegrityError(DatabaseError):
    """Exception raised for data integrity violations"""
    
    def __init__(self, message: str,
                 constraint_name: str = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if constraint_name:
            self.context['constraint_name'] = constraint_name


# Rate limiting exceptions

class RateLimitError(BaseQuotingError):
    """Base exception for rate limiting errors"""
    pass


class RateLimitExceededError(RateLimitError):
    """Exception raised when rate limit is exceeded"""
    
    def __init__(self, message: str,
                 limit: int = None,
                 window: str = None,
                 reset_time: int = None,
                 **kwargs):
        super().__init__(message, **kwargs)
        if limit:
            self.context['limit'] = limit
        if window:
            self.context['window'] = window
        if reset_time:
            self.context['reset_time'] = reset_time


# Exception handling utilities

def handle_exception(exception: Exception, 
                    default_message: str = "An unexpected error occurred") -> BaseQuotingError:
    """
    Convert generic exceptions to custom quoting system exceptions
    
    Args:
        exception: Original exception
        default_message: Default error message if none can be determined
        
    Returns:
        BaseQuotingError: Converted exception
    """
    # If already a custom exception, return as-is
    if isinstance(exception, BaseQuotingError):
        return exception
    
    # Map common exception types to custom exceptions
    exception_mapping = {
        FileNotFoundError: FileProcessingError,
        PermissionError: FileProcessingError,
        ValueError: ValidationError,
        TypeError: ValidationError,
        ConnectionError: ServiceUnavailableError,
        TimeoutError: ServiceTimeoutError,
    }
    
    exception_type = type(exception)
    custom_exception_class = exception_mapping.get(exception_type, BaseQuotingError)
    
    # Create custom exception with original as context
    return custom_exception_class(
        message=str(exception) or default_message,
        original_exception=exception,
        context={'original_exception_type': exception_type.__name__}
    )


def log_exception_context(exception: Exception, 
                         additional_context: Dict[str, Any] = None) -> None:
    """
    Log exception with additional context
    
    Args:
        exception: Exception to log
        additional_context: Additional context information
    """
    context = additional_context or {}
    
    if isinstance(exception, BaseQuotingError):
        context.update(exception.context)
    
    logger.exception(
        "Exception occurred",
        exception_type=type(exception).__name__,
        exception_message=str(exception),
        context=context
    )
