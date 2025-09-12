/**
 * Error Types - Standard error interfaces
 * AIDEV-NOTE: error-types; centralized error type definitions
 */

export class UploaderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly retryable: boolean = false
  ) {
    super(message);
    this.name = 'UploaderError';
  }
}

export class AuthenticationError extends UploaderError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', false);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends UploaderError {
  constructor(message: string, public readonly retryAfter: number) {
    super(message, 'RATE_LIMIT', true);
    this.name = 'RateLimitError';
  }
}