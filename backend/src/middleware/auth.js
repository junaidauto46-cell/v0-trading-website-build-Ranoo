const jwt = require('jsonwebtoken');
const config = require('../config/config');
const logger = require('../config/logger');
const database = require('../config/database');

/**
 * Generate JWT access and refresh tokens
 */
const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });

  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

  return { accessToken, refreshToken };
};

/**
 * Verify JWT token
 */
const verifyToken = (token, secret) => {
  try {
    return jwt.verify(token, secret);
  } catch (error) {
    logger.warn(`Token verification failed: ${error.message}`);
    throw error;
  }
};

/**
 * Authentication middleware
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        messageKey: 'auth.token_required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the access token
    const decoded = verifyToken(token, config.jwt.accessSecret);

    // Check if user still exists
    const prisma = database.getClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance_usd: true,
        referral_code: true,
        created_at: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        messageKey: 'auth.user_not_found'
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token expired',
        messageKey: 'auth.token_expired'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid access token',
        messageKey: 'auth.token_invalid'
      });
    }

    logger.error('Authentication error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error',
      messageKey: 'auth.error'
    });
  }
};

/**
 * Admin authorization middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      messageKey: 'auth.required'
    });
  }

  if (req.user.role !== 'ADMIN') {
    logger.warn(`Access denied for non-admin user: ${req.user.email}`);
    return res.status(403).json({
      success: false,
      message: 'Admin access required',
      messageKey: 'auth.admin_required'
    });
  }

  next();
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token, config.jwt.accessSecret);

    const prisma = database.getClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance_usd: true,
        referral_code: true,
        created_at: true,
      },
    });

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Don't fail on optional auth, just log and continue
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

/**
 * Refresh token middleware
 */
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
        messageKey: 'auth.refresh_token_required'
      });
    }

    // Verify refresh token
    const decoded = verifyToken(refreshToken, config.jwt.refreshSecret);

    // Check if user still exists
    const prisma = database.getClient();
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
        messageKey: 'auth.user_not_found'
      });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      messageKey: 'auth.tokens_refreshed',
      data: tokens,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired',
        messageKey: 'auth.refresh_token_expired'
      });
    }

    logger.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      messageKey: 'auth.refresh_failed'
    });
  }
};

module.exports = {
  generateTokens,
  verifyToken,
  authenticate,
  requireAdmin,
  optionalAuth,
  refreshToken,
};