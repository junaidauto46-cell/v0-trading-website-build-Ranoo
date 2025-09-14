const jobScheduler = require('../jobs/jobScheduler');
const dailyProfitJob = require('../jobs/dailyProfitJob');
const logger = require('../config/logger');
const { createError } = require('../middleware/errorHandler');

/**
 * Get job scheduler status
 */
const getJobsStatus = async (req, res) => {
  try {
    const status = jobScheduler.getJobsStatus();
    
    // Add individual job statuses
    const jobStatuses = {
      dailyProfitJob: dailyProfitJob.getStatus(),
    };

    res.json({
      success: true,
      message: 'Job status retrieved successfully',
      messageKey: 'jobs.status_retrieved',
      data: {
        scheduler: status,
        jobs: jobStatuses,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error('Get jobs status error:', error);
    throw error;
  }
};

/**
 * Manually trigger daily profit job
 */
const triggerDailyProfitJob = async (req, res) => {
  try {
    logger.info(`Admin ${req.user.email} manually triggered daily profit job`);

    const result = await jobScheduler.triggerDailyProfitJob();

    // Log admin action
    const database = require('../config/database');
    const prisma = database.getClient();
    
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: 'TRIGGER_DAILY_PROFIT_JOB',
        details: {
          result: result.success,
          processedInvestments: result.results?.processedInvestments,
          totalProfitDistributed: result.results?.totalProfitDistributed,
          errors: result.results?.errors?.length || 0,
          duration: result.duration
        }
      }
    });

    res.json({
      success: true,
      message: result.success ? 'Daily profit job executed successfully' : 'Daily profit job completed with errors',
      messageKey: result.success ? 'jobs.profit_job_success' : 'jobs.profit_job_partial',
      data: {
        jobResult: result,
        triggeredBy: req.user.email,
        triggeredAt: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error('Trigger daily profit job error:', error);
    
    // Log failed admin action
    try {
      const database = require('../config/database');
      const prisma = database.getClient();
      
      await prisma.adminLog.create({
        data: {
          admin_id: req.user.id,
          action: 'TRIGGER_DAILY_PROFIT_JOB_FAILED',
          details: {
            error: error.message,
            triggeredBy: req.user.email
          }
        }
      });
    } catch (logError) {
      logger.error('Failed to log admin action:', logError);
    }

    throw error;
  }
};

/**
 * Start or stop a specific job
 */
const controlJob = async (req, res) => {
  const { jobName } = req.params;
  const { action } = req.body; // 'start' or 'stop'

  try {
    if (!['start', 'stop'].includes(action)) {
      throw createError(400, 'Invalid action. Use "start" or "stop"', 'jobs.invalid_action');
    }

    let result = false;
    if (action === 'start') {
      result = jobScheduler.startJob(jobName);
    } else {
      result = jobScheduler.stopJob(jobName);
    }

    if (!result) {
      throw createError(404, 'Job not found', 'jobs.job_not_found');
    }

    // Log admin action
    const database = require('../config/database');
    const prisma = database.getClient();
    
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: `${action.toUpperCase()}_JOB`,
        details: {
          jobName,
          action,
          adminEmail: req.user.email
        }
      }
    });

    logger.info(`Admin ${req.user.email} ${action}ed job: ${jobName}`);

    res.json({
      success: true,
      message: `Job ${action}ed successfully`,
      messageKey: `jobs.job_${action}ed`,
      data: {
        jobName,
        action,
        performedBy: req.user.email,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error(`Job control error (${action} ${jobName}):`, error);
    throw error;
  }
};

/**
 * Get job execution history/logs
 */
const getJobLogs = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const database = require('../config/database');
  const prisma = database.getClient();

  try {
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, totalCount] = await Promise.all([
      prisma.adminLog.findMany({
        where: {
          action: {
            in: [
              'TRIGGER_DAILY_PROFIT_JOB',
              'TRIGGER_DAILY_PROFIT_JOB_FAILED',
              'START_JOB',
              'STOP_JOB'
            ]
          }
        },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          admin: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      }),
      prisma.adminLog.count({
        where: {
          action: {
            in: [
              'TRIGGER_DAILY_PROFIT_JOB',
              'TRIGGER_DAILY_PROFIT_JOB_FAILED',
              'START_JOB',
              'STOP_JOB'
            ]
          }
        }
      })
    ]);

    res.json({
      success: true,
      message: 'Job logs retrieved successfully',
      messageKey: 'jobs.logs_retrieved',
      data: {
        logs: logs.map(log => ({
          id: log.id,
          action: log.action,
          details: log.details,
          admin: log.admin,
          created_at: log.created_at,
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalItems: totalCount,
          itemsPerPage: parseInt(limit),
        }
      }
    });
  } catch (error) {
    logger.error('Get job logs error:', error);
    throw error;
  }
};

/**
 * Get investment statistics for profit job
 */
const getInvestmentStats = async (req, res) => {
  const database = require('../config/database');
  const prisma = database.getClient();

  try {
    const [
      activeInvestments,
      completedInvestments,
      totalInvested,
      totalProfitsDistributed,
      recentProfits
    ] = await Promise.all([
      // Active investments count
      prisma.activeInvestment.count({
        where: { status: 'ACTIVE' }
      }),
      
      // Completed investments count
      prisma.activeInvestment.count({
        where: { status: 'COMPLETED' }
      }),
      
      // Total amount invested
      prisma.activeInvestment.aggregate({
        _sum: { amount_usd: true }
      }),
      
      // Total profits distributed
      prisma.transaction.aggregate({
        where: { type: 'PROFIT' },
        _sum: { amount_usd: true }
      }),
      
      // Recent profit transactions
      prisma.transaction.findMany({
        where: { type: 'PROFIT' },
        orderBy: { created_at: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      })
    ]);

    // Get investments ending soon (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const investmentsEndingSoon = await prisma.activeInvestment.count({
      where: {
        status: 'ACTIVE',
        end_date: {
          lte: sevenDaysFromNow
        }
      }
    });

    res.json({
      success: true,
      message: 'Investment statistics retrieved successfully',
      messageKey: 'jobs.investment_stats_retrieved',
      data: {
        overview: {
          activeInvestments,
          completedInvestments,
          totalInvested: parseFloat(totalInvested._sum.amount_usd || 0),
          totalProfitsDistributed: parseFloat(totalProfitsDistributed._sum.amount_usd || 0),
          investmentsEndingSoon,
        },
        recentProfits: recentProfits.map(profit => ({
          id: profit.id,
          amount: parseFloat(profit.amount_usd),
          user: profit.user,
          description: profit.description,
          created_at: profit.created_at,
        })),
        lastUpdated: new Date().toISOString(),
      }
    });
  } catch (error) {
    logger.error('Get investment stats error:', error);
    throw error;
  }
};

module.exports = {
  getJobsStatus,
  triggerDailyProfitJob,
  controlJob,
  getJobLogs,
  getInvestmentStats,
};