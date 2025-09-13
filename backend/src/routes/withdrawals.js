const express = require('express');
const { 
  createWithdrawal, 
  getUserWithdrawals, 
  getWithdrawal, 
  checkWithdrawalEligibility 
} = require('../controllers/withdrawalController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams, withdrawalSchemas, commonSchemas } = require('../middleware/validation');
const { financialLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   GET /api/withdrawals/eligibility
 * @desc    Check user's withdrawal eligibility
 * @access  Private
 */
router.get('/eligibility', 
  authenticate,
  checkWithdrawalEligibility
);

/**
 * @route   POST /api/withdrawals
 * @desc    Submit a new withdrawal request
 * @access  Private
 */
router.post('/', 
  authenticate,
  financialLimiter,
  validate(withdrawalSchemas.create),
  createWithdrawal
);

/**
 * @route   GET /api/withdrawals
 * @desc    Get user's withdrawals with pagination
 * @access  Private
 */
router.get('/', 
  authenticate,
  validateQuery(require('zod').object({
    ...commonSchemas.pagination.shape,
    status: require('zod').enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
  })),
  getUserWithdrawals
);

/**
 * @route   GET /api/withdrawals/:id
 * @desc    Get a specific withdrawal by ID
 * @access  Private
 */
router.get('/:id', 
  authenticate,
  validateParams(require('zod').object({
    id: commonSchemas.uuid,
  })),
  getWithdrawal
);

module.exports = router;