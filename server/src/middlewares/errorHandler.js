const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Global Express error-handling middleware.
 * Normalises all error types into a consistent { success, error } response.
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';
  let field = err.field || null;

  // Mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = Object.values(err.errors).map((e) => e.message).join(', ');
    field = Object.keys(err.errors)[0];
  }

  // Mongoose cast error (invalid ObjectId)
  if (err instanceof mongoose.Error.CastError) {
    statusCode = 404;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const keyField = Object.keys(err.keyValue || {})[0];
    message = `${keyField ? keyField.charAt(0).toUpperCase() + keyField.slice(1) : 'Value'} already exists.`;
    field = keyField || null;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid token.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'TOKEN_EXPIRED';
    message = 'Token has expired.';
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    code = 'FILE_TOO_LARGE';
    message = 'File size exceeds the 10MB limit.';
  }

  // Log unexpected server errors
  if (statusCode >= 500) {
    logger.error(`[${req.method} ${req.originalUrl}] ${err.message}`, { stack: err.stack });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      ...(field && { field }),
    },
  });
};

module.exports = errorHandler;
