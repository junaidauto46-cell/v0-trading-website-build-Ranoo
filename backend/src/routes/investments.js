const express = require('express');
const { 
  getInvestmentPlans, 
  createInvestment, 
  getUserInvestments, 
  getInvestment, 
  getInvestmentStats 
} = require('../controllers/investmentController');
const { authenticate } = require('../middleware/auth');
const { validate, validateQuery, validateParams, investmentSchemas, commonSchemas } = require('../middleware/validation');
const { financialLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

/**
 * @route   GET /api/investments/plans
 * @desc    Get all available investment plans
 * @access  Private
 */
router.get('/plans', 
  authenticate,
  getInvestmentPlans
);

/**
 * @route   GET /api/investments/stats
 * @desc    Get user's investment statistics
 * @access  Private
 */
router.get('/stats', 
  authenticate,
  getInvestmentStats
);

/**
 * @route   POST /api/investments
 * @desc    Create a new investment
 * @access  Private
 */
router.post('/', 
  authenticate,
  financialLimiter,
  validate(investmentSchemas.create),
  createInvestment
);

/**
 * @route   GET /api/investments
 * @desc    Get user's investments with pagination
 * @access  Private
 */
router.get('/', 
  authenticate,
  validateQuery(require('zod').object({
    ...commonSchemas.pagination.shape,
    status: require('zod').enum(['ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
  })),
  getUserInvestments
);

/**
 * @route   GET /api/investments/:id
 * @desc    Get a specific investment by ID
 * @access  Private
 */
router.get('/:id', 
  authenticate,
  validateParams({
    id: commonSchemas.uuid,
  }),
  getInvestment
);

module.exports = router;