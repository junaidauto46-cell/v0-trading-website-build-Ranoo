const express = require('express');
const { 
  getFakeTransactions, 
  getLiveActivityFeed, 
  getFakeStats 
} = require('../controllers/fakeTransactionController');
const { validateQuery } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/fake-transactions
 * @desc    Get fake transactions for activity feed
 * @access  Public
 * @note    This is simulation data for demo purposes only
 */
router.get('/', 
  validateQuery(require('zod').object({
    count: require('zod').string().optional().transform(val => val ? parseInt(val) : 20),
  })),
  getFakeTransactions
);

/**
 * @route   GET /api/fake-transactions/live
 * @desc    Get live activity feed with recent activities
 * @access  Public
 * @note    This is simulation data for demo purposes only
 */
router.get('/live', getLiveActivityFeed);

/**
 * @route   GET /api/fake-transactions/stats
 * @desc    Get fake platform statistics
 * @access  Public
 * @note    This is simulation data for demo purposes only
 */
router.get('/stats', getFakeStats);

module.exports = router;