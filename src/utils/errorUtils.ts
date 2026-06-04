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

/**
 * Extract a human-readable error message from an axios error, with
 * fallback. Specifically tuned for NestJS backends, which return
 * validation failures as `{ message: string[] }` and other errors as
 * `{ message: string }`. Calling `toast.error()` directly with an
 * array silently renders nothing (or "[object Object]"), which is
 * the root cause of "I clicked submit and nothing happened" reports.
 *
 * Use this everywhere a backend message is forwarded to the user.
 */
export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const raw = (error as {
    response?: { data?: { message?: string | string[] } };
  })?.response?.data?.message;
  if (Array.isArray(raw)) return raw.join('. ') || fallback;
  if (typeof raw === 'string' && raw.length > 0) return raw;
  return fallback;
}
