/**
 * Base application error class
 * Provides standardized error structure for the API
 */
class AppError extends Error {
  constructor(code, message, statusCode = 500, details = null) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.details && { details: this.details })
      }
    };
  }
}

/**
 * Validation Error - 400
 * Used for field validation failures
 */
class ValidationError extends AppError {
  constructor(message, fields = {}) {
    super('VALIDATION_ERROR', message, 400, Object.keys(fields).length > 0 ? { fields } : null);
  }
}

/**
 * Not Found Error - 404
 * Used when a resource doesn't exist
 */
class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`, `${resource} not found`, 404);
  }
}

/**
 * Unauthorized Error - 401
 * Used for authentication failures
 */
class UnauthorizedError extends AppError {
  constructor(code = 'UNAUTHORIZED', message = 'Authentication required') {
    super(code, message, 401);
  }
}

/**
 * Forbidden Error - 403
 * Used when user lacks permission
 */
class ForbiddenError extends AppError {
  constructor(code = 'FORBIDDEN', message = 'Access denied') {
    super(code, message, 403);
  }
}

/**
 * Conflict Error - 409
 * Used for duplicate resources or conflicts
 */
class ConflictError extends AppError {
  constructor(code, message) {
    super(code, message, 409);
  }
}

/**
 * Bad Request Error - 400
 * Used for general bad requests
 */
class BadRequestError extends AppError {
  constructor(code = 'BAD_REQUEST', message = 'Invalid request') {
    super(code, message, 400);
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  BadRequestError
};
