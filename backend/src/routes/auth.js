const express = require('express');
const { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  getProfile, 
  updateProfile 
} = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { refreshToken } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');
const { authLimiter, passwordResetLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  validate(authSchemas.register),
  register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', 
  authLimiter,
  validate(authSchemas.login),
  login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', 
  validate(authSchemas.refreshToken),
  refreshToken
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', 
  passwordResetLimiter,
  validate(authSchemas.forgotPassword),
  forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', 
  passwordResetLimiter,
  validate(authSchemas.resetPassword),
  resetPassword
);

/**
 * @route   GET /api/auth/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get('/profile', 
  authenticate,
  getProfile
);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', 
  authenticate,
  validate({
    name: require('zod').string().min(2).max(100).optional(),
    wallet_addresses: require('zod').object({}).optional(),
  }),
  updateProfile
);

module.exports = router;