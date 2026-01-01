/**
 * Custom Error Classes for Unified Error Handling
 * These errors will be caught and formatted by the global error handler
 */

/**
 * Base API Error Class
 * All custom errors extend from this class
 */
class APIError extends Error {
  constructor(message, statusCode, code, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true; // Distinguishes operational errors from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Validation Error
 * Used for input validation failures
 */
class ValidationError extends APIError {
  constructor(message, codeOrDetails = null) {
    // If second parameter is a string, treat it as a custom code
    // If it's an object/array, treat it as details (backward compatibility)
    const isCustomCode = typeof codeOrDetails === 'string';
    const code = isCustomCode ? codeOrDetails : 'VALIDATION_ERROR';
    const details = isCustomCode ? null : codeOrDetails;
    
    super(message, 400, code, details);
  }
}

/**
 * 401 Unauthorized - Authentication Error
 * Used when authentication fails or is required
 */
class AuthenticationError extends APIError {
  constructor(message, code = 'AUTHENTICATION_REQUIRED') {
    super(message, 401, code);
  }
}

/**
 * 403 Forbidden - Authorization Error
 * Used when user lacks permission for the requested action
 */
class ForbiddenError extends APIError {
  constructor(message, code = 'FORBIDDEN') {
    super(message, 403, code);
  }
}

/**
 * 404 Not Found Error
 * Used when a requested resource doesn't exist
 */
class NotFoundError extends APIError {
  constructor(resource, code = null) {
    const resourceName = typeof resource === 'string' ? resource : 'Resource';
    super(
      `${resourceName} not found`,
      404,
      code || `${resourceName.toUpperCase().replace(/\s+/g, '_')}_NOT_FOUND`
    );
  }
}

/**
 * 409 Conflict Error
 * Used when a resource already exists or conflicts with existing data
 */
class ConflictError extends APIError {
  constructor(message, code = 'ALREADY_EXISTS') {
    super(message, 409, code);
  }
}

/**
 * 500 Internal Server Error
 * Used for unexpected server errors
 */
class InternalError extends APIError {
  constructor(message = 'Internal server error', code = 'INTERNAL_ERROR') {
    super(message, 500, code);
  }
}

module.exports = {
  APIError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalError
};
