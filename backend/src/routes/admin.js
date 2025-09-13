const express = require('express');
const { 
  getDashboardStats, 
  getAllDeposits, 
  approveDeposit, 
  rejectDeposit, 
  getAllWithdrawals, 
  approveWithdrawal, 
  rejectWithdrawal, 
  adjustUserBalance 
} = require('../controllers/adminController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, validateQuery, validateParams, depositSchemas, withdrawalSchemas, adminSchemas, commonSchemas } = require('../middleware/validation');
const { adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard statistics
 * @access  Admin
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/admin/deposits
 * @desc    Get all deposits with filters and pagination
 * @access  Admin
 */
router.get('/deposits', 
  validateQuery({
    ...commonSchemas.pagination,
    status: require('zod').enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    coin: require('zod').enum(['USDT', 'BTC', 'ETH']).optional(),
    search: require('zod').string().min(1).max(100).optional(),
  }),
  getAllDeposits
);

/**
 * @route   PUT /api/admin/deposits/:id/approve
 * @desc    Approve a deposit
 * @access  Admin
 */
router.put('/deposits/:id/approve', 
  validateParams(require('zod').object({
    id: commonSchemas.uuid,
  })),
  validate(require('zod').object({
    admin_notes: require('zod').string().max(1000).optional(),
    approved_amount: require('zod').number().positive().optional(),
  })),
  approveDeposit
);

/**
 * @route   PUT /api/admin/deposits/:id/reject
 * @desc    Reject a deposit
 * @access  Admin
 */
router.put('/deposits/:id/reject', 
  validateParams({
    id: commonSchemas.uuid,
  }),
  validate({
    admin_notes: require('zod').string().min(1).max(1000),
  }),
  rejectDeposit
);

/**
 * @route   GET /api/admin/withdrawals
 * @desc    Get all withdrawals with filters and pagination
 * @access  Admin
 */
router.get('/withdrawals', 
  validateQuery({
    ...commonSchemas.pagination,
    status: require('zod').enum(['PENDING', 'APPROVED', 'REJECTED', 'PAID']).optional(),
    coin: require('zod').enum(['USDT', 'BTC', 'ETH']).optional(),
    search: require('zod').string().min(1).max(100).optional(),
  }),
  getAllWithdrawals
);

/**
 * @route   PUT /api/admin/withdrawals/:id/approve
 * @desc    Approve a withdrawal
 * @access  Admin
 */
router.put('/withdrawals/:id/approve', 
  validateParams({
    id: commonSchemas.uuid,
  }),
  validate({
    admin_notes: require('zod').string().max(1000).optional(),
  }),
  approveWithdrawal
);

/**
 * @route   PUT /api/admin/withdrawals/:id/reject
 * @desc    Reject a withdrawal
 * @access  Admin
 */
router.put('/withdrawals/:id/reject', 
  validateParams({
    id: commonSchemas.uuid,
  }),
  validate({
    admin_notes: require('zod').string().min(1).max(1000),
  }),
  rejectWithdrawal
);

/**
 * @route   PUT /api/admin/users/:id/adjust-balance
 * @desc    Adjust user balance (add or subtract)
 * @access  Admin
 */
router.put('/users/:id/adjust-balance', 
  validateParams({
    id: commonSchemas.uuid,
  }),
  validate(adminSchemas.adjustBalance),
  adjustUserBalance
);

module.exports = router;