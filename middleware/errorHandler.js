// middleware/errorHandler.js
// Centralized error handling middleware for clean error responses

/**
 * Global error handler middleware
 * Catches all errors and sends consistent error responses
 */
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let error = {
    success: false,
    message: 'Internal Server Error',
    statusCode: 500
  };

  // Handle different types of errors
  
  // Supabase errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique constraint violation
        error.statusCode = 409;
        error.message = 'Resource already exists';
        break;
      case '23503': // Foreign key constraint violation
        error.statusCode = 400;
        error.message = 'Invalid reference - related resource not found';
        break;
      case '23502': // Not null constraint violation
        error.statusCode = 400;
        error.message = 'Required field is missing';
        break;
      default:
        error.statusCode = 400;
        error.message = 'Database operation failed';
    }
  }

  // Validation errors (from express-validator)
  if (err.type === 'validation') {
    error.statusCode = 400;
    error.message = 'Validation failed';
    error.errors = err.errors;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.statusCode = 401;
    error.message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    error.statusCode = 401;
    error.message = 'Token expired';
  }

  // Custom errors (when we throw errors with statusCode)
  if (err.statusCode) {
    error.statusCode = err.statusCode;
    error.message = err.message;
  }

  // Send error response
  res.status(error.statusCode).json(error);
};

/**
 * Not Found middleware
 * Handles requests to non-existent endpoints
 */
const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  notFound,
  asyncHandler
};