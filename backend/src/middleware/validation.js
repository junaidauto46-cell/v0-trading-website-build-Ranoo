const { z } = require('zod');
const logger = require('../config/logger');

/**
 * Generic validation middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Validation error:', { errors: errorMessages, body: req.body });

        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          messageKey: 'validation.failed',
          errors: errorMessages,
        });
      }

      logger.error('Validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Validation error',
        messageKey: 'validation.error'
      });
    }
  };
};

/**
 * Query parameter validation middleware factory
 */
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.query);
      req.query = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Query validation error:', { errors: errorMessages, query: req.query });

        return res.status(400).json({
          success: false,
          message: 'Query validation failed',
          messageKey: 'validation.query_failed',
          errors: errorMessages,
        });
      }

      logger.error('Query validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Query validation error',
        messageKey: 'validation.error'
      });
    }
  };
};

/**
 * Params validation middleware factory
 */
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const validated = schema.parse(req.params);
      req.params = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        logger.warn('Params validation error:', { errors: errorMessages, params: req.params });

        return res.status(400).json({
          success: false,
          message: 'Parameters validation failed',
          messageKey: 'validation.params_failed',
          errors: errorMessages,
        });
      }

      logger.error('Params validation middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Parameters validation error',
        messageKey: 'validation.error'
      });
    }
  };
};

// Common validation schemas
const commonSchemas = {
  email: z.string().email('Invalid email format'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  amount: z.number().positive('Amount must be positive'),
  uuid: z.string().uuid('Invalid ID format'),
  txid: z.string().min(10, 'Transaction ID must be at least 10 characters').max(100, 'Transaction ID too long'),
  wallet: z.string().min(20, 'Wallet address too short').max(100, 'Wallet address too long'),
  referralCode: z.string().regex(/^REF[A-Z0-9]{6}$/, 'Invalid referral code format'),
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  }).refine(data => data.page >= 1, { message: 'Page must be >= 1', path: ['page'] })
    .refine(data => data.limit >= 1 && data.limit <= 100, { message: 'Limit must be between 1 and 100', path: ['limit'] }),
};

// Auth validation schemas
const authSchemas = {
  register: z.object({
    name: commonSchemas.name,
    email: commonSchemas.email,
    password: commonSchemas.password,
    referralCode: z.string().optional(),
  }),

  login: z.object({
    email: commonSchemas.email,
    password: z.string().min(1, 'Password required'),
  }),

  forgotPassword: z.object({
    email: commonSchemas.email,
  }),

  resetPassword: z.object({
    token: z.string().min(1, 'Reset token required'),
    password: commonSchemas.password,
  }),

  refreshToken: z.object({
    refreshToken: z.string().min(1, 'Refresh token required'),
  }),
};

// Deposit validation schemas
const depositSchemas = {
  create: z.object({
    txid: commonSchemas.txid,
    chain: z.enum(['ERC20', 'TRC20', 'BTC', 'ETH']),
    amount_usd: z.number().positive('Amount must be positive').max(1000000, 'Amount too large'),
    coin: z.enum(['USDT', 'BTC', 'ETH']),
    note: z.string().max(500, 'Note too long').optional(),
  }),

  updateStatus: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    admin_notes: z.string().max(1000, 'Admin notes too long').optional(),
    approved_amount: z.number().positive('Approved amount must be positive').optional(),
  }),
};

// Withdrawal validation schemas
const withdrawalSchemas = {
  create: z.object({
    amount_usd: z.number().positive('Amount must be positive').min(10, 'Minimum withdrawal is $10'),
    destination_wallet: commonSchemas.wallet,
    coin: z.enum(['USDT', 'BTC', 'ETH']),
  }),

  updateStatus: z.object({
    status: z.enum(['APPROVED', 'REJECTED', 'PAID']),
    admin_notes: z.string().max(1000, 'Admin notes too long').optional(),
  }),
};

// Investment validation schemas
const investmentSchemas = {
  create: z.object({
    plan_id: commonSchemas.uuid,
    amount_usd: z.number().positive('Amount must be positive'),
  }),
};

// Admin validation schemas
const adminSchemas = {
  adjustBalance: z.object({
    amount: z.number().refine(val => val !== 0, 'Amount cannot be zero'),
    reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason too long'),
  }),

  createPlan: z.object({
    name: z.string().min(2, 'Plan name too short').max(50, 'Plan name too long'),
    daily_percentage: z.number().positive('Daily percentage must be positive').max(10, 'Daily percentage too high'),
    min_deposit_usd: z.number().positive('Minimum deposit must be positive'),
    duration_days: z.number().int().positive('Duration must be positive integer').max(365, 'Duration too long'),
  }),
};

module.exports = {
  validate,
  validateQuery,
  validateParams,
  commonSchemas,
  authSchemas,
  depositSchemas,
  withdrawalSchemas,
  investmentSchemas,
  adminSchemas,
};