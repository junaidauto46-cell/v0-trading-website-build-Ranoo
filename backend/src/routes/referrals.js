const express = require('express');
const { 
  getReferralStats, 
  getReferrals, 
  getCommissionHistory, 
  generateReferralLink 
} = require('../controllers/referralController');
const { authenticate } = require('../middleware/auth');
const { validateQuery, commonSchemas } = require('../middleware/validation');

const router = express.Router();

/**
 * @route   GET /api/referrals/stats
 * @desc    Get user's referral statistics
 * @access  Private
 */
router.get('/stats', 
  authenticate,
  getReferralStats
);

/**
 * @route   GET /api/referrals/link
 * @desc    Generate referral link
 * @access  Private
 */
router.get('/link', 
  authenticate,
  generateReferralLink
);

/**
 * @route   GET /api/referrals/commissions
 * @desc    Get commission history with pagination
 * @access  Private
 */
router.get('/commissions', 
  authenticate,
  validateQuery(commonSchemas.pagination),
  getCommissionHistory
);

/**
 * @route   GET /api/referrals
 * @desc    Get user's referrals with pagination
 * @access  Private
 */
router.get('/', 
  authenticate,
  validateQuery(require('zod').object({
    ...commonSchemas.pagination.shape,
    status: require('zod').enum(['active', 'inactive']).optional(),
  })),
  getReferrals
);

module.exports = router;