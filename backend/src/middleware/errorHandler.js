const logger = require('../config/logger');

/**
 * Custom error class for API errors
 */
class ApiError extends Error {
  constructor(statusCode, message, messageKey = null, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.messageKey = messageKey;
    this.isOperational = isOperational;
    this.name = 'ApiError';

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error handler caught:', {
    name: error.name,
    message: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });

  // Prisma validation error
  if (err.code === 'P2002') {
    const field = err.meta?.target?.[0] || 'field';
    error = new ApiError(400, `${field} already exists`, 'validation.duplicate');
  }

  // Prisma record not found error
  if (err.code === 'P2025') {
    error = new ApiError(404, 'Record not found', 'error.not_found');
  }

  // Prisma foreign key constraint error
  if (err.code === 'P2003') {
    error = new ApiError(400, 'Invalid reference', 'validation.invalid_reference');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new ApiError(401, 'Invalid token', 'auth.token_invalid');
  }

  // JWT expired error
  if (err.name === 'TokenExpiredError') {
    error = new ApiError(401, 'Token expired', 'auth.token_expired');
  }

  // Validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new ApiError(400, message, 'validation.failed');
  }

  // MongoDB cast error
  if (err.name === 'CastError') {
    error = new ApiError(400, 'Invalid ID format', 'validation.invalid_id');
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ApiError(400, 'File too large', 'upload.file_too_large');
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = new ApiError(400, 'Too many files', 'upload.too_many_files');
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new ApiError(400, 'Unexpected file field', 'upload.unexpected_field');
  }

  // Default to 500 server error
  if (!error.statusCode) {
    error = new ApiError(500, 'Internal server error', 'error.internal');
  }

  // Send error response
  const response = {
    success: false,
    message: error.message,
  };

  // Add message key for frontend translations
  if (error.messageKey) {
    response.messageKey = error.messageKey;
  }

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.error = {
      name: error.name,
      stack: error.stack,
      code: error.code,
    };
  }

  res.status(error.statusCode || 500).json(response);
};

/**
 * Handle 404 errors
 */
const notFound = (req, res, next) => {
  const error = new ApiError(404, `Route ${req.originalUrl} not found`, 'error.route_not_found');
  next(error);
};

/**
 * Async error handler wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom API error
 */
const createError = (statusCode, message, messageKey = null) => {
  return new ApiError(statusCode, message, messageKey);
};

module.exports = {
  ApiError,
  errorHandler,
  notFound,
  asyncHandler,
  createError,
};