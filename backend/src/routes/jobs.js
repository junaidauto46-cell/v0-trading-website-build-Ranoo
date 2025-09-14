const express = require('express');
const { 
  getJobsStatus, 
  triggerDailyProfitJob, 
  controlJob, 
  getJobLogs, 
  getInvestmentStats 
} = require('../controllers/jobController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validate, validateParams, validateQuery, commonSchemas } = require('../middleware/validation');
const { adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authenticate);
router.use(requireAdmin);
router.use(adminLimiter);

/**
 * @route   GET /api/jobs/status
 * @desc    Get status of all background jobs
 * @access  Admin
 */
router.get('/status', getJobsStatus);

/**
 * @route   POST /api/jobs/daily-profit/trigger
 * @desc    Manually trigger daily profit calculation job
 * @access  Admin
 */
router.post('/daily-profit/trigger', triggerDailyProfitJob);

/**
 * @route   POST /api/jobs/:jobName/control
 * @desc    Start or stop a specific job
 * @access  Admin
 */
router.post('/:jobName/control', 
  validateParams(require('zod').object({
    jobName: require('zod').string().min(1),
  })),
  validate(require('zod').object({
    action: require('zod').enum(['start', 'stop']),
  })),
  controlJob
);

/**
 * @route   GET /api/jobs/logs
 * @desc    Get job execution logs with pagination
 * @access  Admin
 */
router.get('/logs', 
  validateQuery(commonSchemas.pagination),
  getJobLogs
);

/**
 * @route   GET /api/jobs/investment-stats
 * @desc    Get investment statistics for profit job monitoring
 * @access  Admin
 */
router.get('/investment-stats', getInvestmentStats);

module.exports = router;