/**
 * Error handling utilities
 */

interface ApiError {
  response?: {
    status?: number;
    data?: unknown;
  };
  message?: string;
}

/**
 * Safely extract error message from unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    if (apiError.message) {
      return apiError.message;
    }
    if (apiError.response?.data) {
      return String(apiError.response.data);
    }
  }
  return 'An unknown error occurred';
}

/**
 * Log API error with structured info
 */
export function logApiError(context: string, error: unknown): void {
  if (error && typeof error === 'object') {
    const apiError = error as ApiError;
    console.error(
      `[${context}]`,
      apiError.response?.status,
      apiError.response?.data,
      apiError.message
    );
  } else {
    console.error(`[${context}]`, error);
  }
}

/**
 * Check if error is an API error with response
 */
export function isApiError(error: unknown): error is ApiError {
  return error !== null && typeof error === 'object' && 'response' in error;
}
