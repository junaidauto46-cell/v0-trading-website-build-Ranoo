const express = require('express');
const { 
  createDeposit, 
  getUserDeposits, 
  getDepositAddresses, 
  getDeposit 
} = require('../controllers/depositController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams, depositSchemas, commonSchemas } = require('../middleware/validation');
const { financialLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   GET /api/deposits/addresses
 * @desc    Get deposit addresses for all supported coins
 * @access  Private
 */
router.get('/addresses', 
  authenticate,
  getDepositAddresses
);

/**
 * @route   POST /api/deposits
 * @desc    Submit a new deposit request
 * @access  Private
 */
router.post('/', 
  authenticate,
  financialLimiter,
  validate(depositSchemas.create),
  createDeposit
);

/**
 * @route   GET /api/deposits
 * @desc    Get user's deposits with pagination
 * @access  Private
 */
router.get('/', 
  authenticate,
  validateQuery({
    ...commonSchemas.pagination,
    status: require('zod').enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),
  getUserDeposits
);

/**
 * @route   GET /api/deposits/:id
 * @desc    Get a specific deposit by ID
 * @access  Private
 */
router.get('/:id', 
  authenticate,
  validateParams({
    id: commonSchemas.uuid,
  }),
  getDeposit
);

module.exports = router;