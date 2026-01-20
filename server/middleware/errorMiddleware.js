/**
 * Global Error Handling Middleware
 * Catches and processes all errors in the application
 * Returns consistent error responses to clients
 */

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error to console (in production, use proper logging service)
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString(),
  });

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: messages,
    });
  }

  // Mongoose Duplicate Key Error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      success: false,
      message: `${field} already exists. Please use a different ${field}.`,
    });
  }

  // Mongoose Cast Error
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format.',
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired.',
    });
  }

  // Custom Application Error
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
  }

  // Default Error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong. Please try again later.',
  });
};

/**
 * Async error wrapper for route handlers
 * Wraps async functions to catch errors and pass to error handler
 * @param {function} fn - Async function to wrap
 * @returns {function} - Wrapped function
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  errorHandler,
  asyncHandler,
};
