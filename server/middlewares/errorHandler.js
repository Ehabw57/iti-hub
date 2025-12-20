const { AppError } = require('../utils/errors/AppError');

/**
 * Global error handler middleware
 * Must be registered LAST in Express middleware chain
 * 
 * Handles:
 * - Custom AppError instances
 * - Mongoose ValidationError
 * - Mongoose CastError (invalid ObjectId)
 * - Mongoose Duplicate Key Error (11000)
 * - JWT Errors
 * - Multer Errors
 * - Generic server errors
 */
const errorHandler = (err, req, res, next) => {
  // Log error in development
  if (process.env.NODE_ENV !== 'test') {
    console.error(`[${new Date().toISOString()}] Error:`, {
      path: req.path,
      method: req.method,
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(err.toJSON());
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError' && err.errors) {
    const fields = {};
    Object.keys(err.errors).forEach(key => {
      fields[key] = err.errors[key].message;
    });
    
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { fields }
      }
    });
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format'
      }
    });
  }

  // Handle Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      error: {
        code: 'DUPLICATE_KEY',
        message: `${field} already exists`,
        details: { field }
      }
    });
  }

  // Handle JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid token'
      }
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token has expired'
      }
    });
  }

  // Handle Multer Errors
  if (err.name === 'MulterError') {
    const multerMessages = {
      LIMIT_FILE_SIZE: 'File size exceeds the allowed limit',
      LIMIT_FILE_COUNT: 'Too many files uploaded',
      LIMIT_UNEXPECTED_FILE: 'Unexpected field in file upload'
    };
    
    return res.status(400).json({
      success: false,
      error: {
        code: `UPLOAD_${err.code}`,
        message: multerMessages[err.code] || err.message
      }
    });
  }

  // Default server error
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'production' 
        ? 'An unexpected error occurred' 
        : err.message
    }
  });
};

module.exports = errorHandler;
