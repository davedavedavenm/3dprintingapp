/**
 * Error Handling Utilities
 * 
 * Provides consistent error handling patterns for API calls and UI feedback.
 */

/**
 * Standard API error format
 */
export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * Format error from API response
 * 
 * @param error - Error object caught from fetch/axios call
 * @returns Formatted API error with standard structure
 */
export const formatApiError = (error: unknown): ApiError => {
  console.error('Raw error:', error);

  // Handle Response objects from fetch API
  if (error instanceof Response) {
    return {
      status: error.status,
      message: error.statusText || 'Unknown API error',
    };
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return {
      status: 500,
      message: error.message || 'Unknown error',
      details: error.stack,
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      status: 500,
      message: error,
    };
  }

  // Handle specific API error formats that might be returned
  if (
    typeof error === 'object' && 
    error !== null && 
    'message' in error &&
    typeof (error as any).message === 'string'
  ) {
    const apiError = error as any;
    return {
      status: apiError.status || apiError.statusCode || 500,
      message: apiError.message,
      code: apiError.code,
      details: apiError.details || apiError.data,
    };
  }

  // Default unknown error
  return {
    status: 500,
    message: 'An unknown error occurred',
    details: error,
  };
};

/**
 * Helper to extract user-friendly message from API error
 * 
 * @param error - API error object
 * @returns User-friendly error message
 */
export const getUserFriendlyErrorMessage = (error: ApiError): string => {
  // Common HTTP status codes
  if (error.status === 400) {
    return 'The request was invalid. Please check your inputs and try again.';
  }
  
  if (error.status === 401) {
    return 'Authentication required. Please log in again.';
  }
  
  if (error.status === 403) {
    return 'You do not have permission to perform this action.';
  }
  
  if (error.status === 404) {
    return 'The requested resource was not found.';
  }
  
  if (error.status === 409) {
    return 'The request conflicts with the current state of the server.';
  }
  
  if (error.status === 429) {
    return 'Too many requests. Please try again later.';
  }
  
  if (error.status >= 500) {
    return 'A server error occurred. Please try again later.';
  }
  
  // Use the error message if available
  return error.message || 'An unknown error occurred.';
};

/**
 * Generic async function wrapper for error handling
 * 
 * @param fn - Async function to execute
 * @param errorCallback - Function to call with the error if it occurs
 * @returns Result of the async function or null if error
 */
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  errorCallback?: (error: ApiError) => void
): Promise<T | null> => {
  try {
    return await fn();
  } catch (error) {
    const formattedError = formatApiError(error);
    console.error('Error caught by withErrorHandling:', formattedError);
    
    if (errorCallback) {
      errorCallback(formattedError);
    }
    
    return null;
  }
};

/**
 * Parse error from Redux action rejection
 * 
 * @param action - Rejected action from Redux
 * @returns Formatted API error
 */
export const parseReduxError = (action: any): ApiError => {
  if (action && action.payload) {
    if (typeof action.payload === 'string') {
      return {
        status: 500,
        message: action.payload,
      };
    }
    
    if (typeof action.payload === 'object') {
      return action.payload as ApiError;
    }
  }
  
  return {
    status: 500,
    message: 'An unknown error occurred in the application.',
  };
};

/**
 * Get error color for MUI components based on error level
 * 
 * @param statusCode - HTTP status code or custom level
 * @returns MUI color string
 */
export const getErrorSeverity = (statusCode: number): 'error' | 'warning' | 'info' => {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warning';
  return 'info';
};
