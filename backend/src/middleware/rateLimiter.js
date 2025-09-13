const rateLimit = require('express-rate-limit');
const config = require('../config/config');
const logger = require('../config/logger');

/**
 * Create rate limiter with custom configuration
 */
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: config.security.rateLimitWindowMs,
    max: config.security.rateLimitMaxRequests,
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later',
      messageKey: 'rate_limit.exceeded'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}, URL: ${req.originalUrl}`);
      res.status(429).json(options.message || defaultOptions.message);
    },
    ...options
  };

  return rateLimit(defaultOptions);
};

/**
 * General API rate limiter
 */
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    messageKey: 'rate_limit.general'
  }
});

/**
 * Auth endpoints rate limiter (more restrictive)
 */
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later',
    messageKey: 'rate_limit.auth'
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Password reset rate limiter
 */
const passwordResetLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset requests per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again later',
    messageKey: 'rate_limit.password_reset'
  }
});

/**
 * Financial operations rate limiter
 */
const financialLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 financial operations per 5 minutes
  message: {
    success: false,
    message: 'Too many financial operations, please wait before trying again',
    messageKey: 'rate_limit.financial'
  }
});

/**
 * Admin operations rate limiter
 */
const adminLimiter = createRateLimiter({
  windowUs: 1 * 60 * 1000, // 1 minute
  max: 50, // 50 admin operations per minute
  message: {
    success: false,
    message: 'Too many admin operations, please slow down',
    messageKey: 'rate_limit.admin'
  }
});

/**
 * API documentation rate limiter (more lenient)
 */
const docsLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  message: {
    success: false,
    message: 'Too many documentation requests',
    messageKey: 'rate_limit.docs'
  }
});

/**
 * Health check rate limiter (very lenient)
 */
const healthLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: {
    success: false,
    message: 'Too many health check requests',
    messageKey: 'rate_limit.health'
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 file uploads per window
  message: {
    success: false,
    message: 'Too many file uploads, please try again later',
    messageKey: 'rate_limit.upload'
  }
});

/**
 * Export rate limiter
 */
const exportLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 exports per hour
  message: {
    success: false,
    message: 'Too many export requests, please try again later',
    messageKey: 'rate_limit.export'
  }
});

module.exports = {
  createRateLimiter,
  generalLimiter,
  authLimiter,
  passwordResetLimiter,
  financialLimiter,
  adminLimiter,
  docsLimiter,
  healthLimiter,
  uploadLimiter,
  exportLimiter,
};