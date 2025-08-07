/**
 * Centralized error handling utilities
 */

export class AppError extends Error {
  code: string;
  statusCode?: number;
  details?: any;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', statusCode?: number, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const ErrorCodes = {
  // Auth errors
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  CONNECTION_FAILED: 'CONNECTION_FAILED',
  
  // Data errors
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Permission errors
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_FORBIDDEN: 'RESOURCE_FORBIDDEN',
  
  // Server errors
  SERVER_ERROR: 'SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * Parse Supabase errors into user-friendly messages
 */
export function parseSupabaseError(error: any): AppError {
  if (!error) {
    return new AppError('An unknown error occurred', ErrorCodes.SERVER_ERROR);
  }

  // Handle different types of Supabase errors
  switch (error.code) {
    case 'invalid_credentials':
    case 'email_not_confirmed':
    case 'invalid_grant':
      return new AppError(
        'Invalid email or password. Please check your credentials.',
        ErrorCodes.INVALID_CREDENTIALS,
        401,
        error
      );

    case 'signup_disabled':
      return new AppError(
        'Registration is currently disabled. Please contact support.',
        ErrorCodes.UNAUTHORIZED,
        403,
        error
      );

    case 'email_address_invalid':
      return new AppError(
        'Please enter a valid email address.',
        ErrorCodes.VALIDATION_ERROR,
        400,
        error
      );

    case 'weak_password':
      return new AppError(
        'Password is too weak. Please choose a stronger password.',
        ErrorCodes.VALIDATION_ERROR,
        400,
        error
      );

    case 'PGRST116': // Row not found
      return new AppError(
        'The requested resource was not found.',
        ErrorCodes.NOT_FOUND,
        404,
        error
      );

    case 'PGRST301': // Permission denied
      return new AppError(
        'You do not have permission to perform this action.',
        ErrorCodes.INSUFFICIENT_PERMISSIONS,
        403,
        error
      );

    case '23505': // Unique constraint violation
      return new AppError(
        'This record already exists. Please check your input.',
        ErrorCodes.DUPLICATE_ENTRY,
        409,
        error
      );

    case '23503': // Foreign key constraint violation
      return new AppError(
        'This action cannot be completed due to data dependencies.',
        ErrorCodes.VALIDATION_ERROR,
        400,
        error
      );

    case '08006': // Connection failure
    case '08001': // Unable to connect
    case '08004': // Server rejected connection
      return new AppError(
        'Unable to connect to the server. Please check your internet connection.',
        ErrorCodes.CONNECTION_FAILED,
        503,
        error
      );

    case '57014': // Statement timeout
    case 'PGRST504': // Gateway timeout
      return new AppError(
        'The request took too long to complete. Please try again.',
        ErrorCodes.TIMEOUT,
        504,
        error
      );

    case '53300': // Too many connections
    case '54001': // Configuration limit exceeded
      return new AppError(
        'The service is temporarily overloaded. Please try again in a moment.',
        ErrorCodes.SERVICE_UNAVAILABLE,
        503,
        error
      );

    default:
      // Check for common error patterns in the message
      const message = error.message?.toLowerCase() || '';
      
      if (message.includes('timeout') || message.includes('timed out')) {
        return new AppError(
          'The request timed out. Please try again.',
          ErrorCodes.TIMEOUT,
          504,
          error
        );
      }

      if (message.includes('network') || message.includes('fetch')) {
        return new AppError(
          'Network error. Please check your internet connection.',
          ErrorCodes.NETWORK_ERROR,
          503,
          error
        );
      }

      if (message.includes('permission') || message.includes('unauthorized')) {
        return new AppError(
          'You do not have permission to perform this action.',
          ErrorCodes.INSUFFICIENT_PERMISSIONS,
          403,
          error
        );
      }

      // Default error
      return new AppError(
        error.message || 'An unexpected error occurred. Please try again.',
        ErrorCodes.SERVER_ERROR,
        500,
        error
      );
  }
}

/**
 * Get user-friendly error message for display
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error instanceof Error) {
    return parseSupabaseError(error).message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Log error to console with additional context
 */
export function logError(error: unknown, context?: string, additionalData?: any): void {
  const timestamp = new Date().toISOString();
  const prefix = context ? `[${context}]` : '[Error]';
  
  console.error(`${prefix} ${timestamp}:`, error);
  
  if (additionalData) {
    console.error('Additional context:', additionalData);
  }

  // In a production app, you might want to send this to an error tracking service
  // like Sentry, LogRocket, or Bugsnag
}

/**
 * Handle async operations with error catching
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: AppError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (error) {
    const appError = error instanceof AppError ? error : parseSupabaseError(error);
    logError(appError, context);
    return { data: null, error: appError };
  }
}

/**
 * Retry an operation with exponential backoff
 */
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        throw parseSupabaseError(error);
      }

      // Check if error is retryable
      const appError = parseSupabaseError(error);
      const retryableCodes = [
        ErrorCodes.TIMEOUT,
        ErrorCodes.NETWORK_ERROR,
        ErrorCodes.CONNECTION_FAILED,
        ErrorCodes.SERVICE_UNAVAILABLE,
      ];

      if (!retryableCodes.includes(appError.code as any)) {
        throw appError;
      }

      // Wait before retry with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw parseSupabaseError(lastError);
}
