const cron = require('node-cron');
const dailyProfitJob = require('./dailyProfitJob');
const logger = require('../config/logger');
const config = require('../config/config');

class JobScheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize and start all scheduled jobs
   */
  initialize() {
    if (this.isInitialized) {
      logger.warn('Job scheduler already initialized');
      return;
    }

    if (!config.jobs.profitJobEnabled) {
      logger.info('Background jobs are disabled in configuration');
      return;
    }

    logger.info('🚀 Initializing job scheduler...');

    // Schedule daily profit calculation job
    this.scheduleDailyProfitJob();

    // Schedule other jobs here as needed
    // this.scheduleOtherJobs();

    this.isInitialized = true;
    logger.info('✅ Job scheduler initialized successfully');
  }

  /**
   * Schedule daily profit calculation job
   */
  scheduleDailyProfitJob() {
    // Run every day at 12:00 AM UTC (midnight)
    const cronExpression = '0 0 * * *';
    
    const task = cron.schedule(cronExpression, async () => {
      logger.info('🕒 Daily profit job triggered by scheduler');
      try {
        const result = await dailyProfitJob.execute();
        
        if (result.success) {
          logger.info('✅ Scheduled daily profit job completed successfully', {
            processedInvestments: result.results?.processedInvestments,
            totalProfitDistributed: result.results?.totalProfitDistributed,
            completedInvestments: result.results?.completedInvestments,
            duration: result.duration
          });
        } else {
          logger.error('❌ Scheduled daily profit job failed', {
            error: result.error,
            message: result.message
          });
        }
      } catch (error) {
        logger.error('❌ Daily profit job crashed:', error);
      }
    }, {
      scheduled: false, // Don't start immediately
      timezone: config.jobs.profitJobTimezone || 'UTC'
    });

    this.scheduledJobs.set('dailyProfitJob', {
      task,
      name: 'Daily Profit Calculation',
      cronExpression,
      description: 'Calculates and distributes daily profits for active investments',
      isRunning: false
    });

    // Start the job
    task.start();
    
    logger.info(`📅 Daily profit job scheduled: ${cronExpression} (${config.jobs.profitJobTimezone || 'UTC'})`);
  }

  /**
   * Schedule hourly cleanup job (optional)
   */
  scheduleCleanupJob() {
    const cronExpression = '0 */6 * * *'; // Every 6 hours
    
    const task = cron.schedule(cronExpression, async () => {
      logger.info('🧹 Cleanup job triggered by scheduler');
      try {
        await this.runCleanupTasks();
        logger.info('✅ Cleanup job completed successfully');
      } catch (error) {
        logger.error('❌ Cleanup job failed:', error);
      }
    }, {
      scheduled: false,
      timezone: config.jobs.profitJobTimezone || 'UTC'
    });

    this.scheduledJobs.set('cleanupJob', {
      task,
      name: 'System Cleanup',
      cronExpression,
      description: 'Performs system cleanup tasks',
      isRunning: false
    });

    task.start();
    logger.info(`🧹 Cleanup job scheduled: ${cronExpression}`);
  }

  /**
   * Run cleanup tasks
   */
  async runCleanupTasks() {
    const database = require('../config/database');
    const prisma = database.getClient();

    try {
      // Clean up expired password reset tokens
      const expiredTokens = await prisma.passwordResetToken.deleteMany({
        where: {
          OR: [
            { expires_at: { lt: new Date() } },
            { used: true }
          ]
        }
      });

      if (expiredTokens.count > 0) {
        logger.info(`🗑️ Cleaned up ${expiredTokens.count} expired password reset tokens`);
      }

      // Add more cleanup tasks as needed
      // - Clean up old logs
      // - Archive completed investments
      // - etc.

    } catch (error) {
      logger.error('Error during cleanup tasks:', error);
      throw error;
    }
  }

  /**
   * Manually trigger daily profit job
   */
  async triggerDailyProfitJob() {
    logger.info('🔥 Manually triggering daily profit job');
    
    try {
      const result = await dailyProfitJob.execute();
      return result;
    } catch (error) {
      logger.error('❌ Manual daily profit job failed:', error);
      throw error;
    }
  }

  /**
   * Stop a specific job
   */
  stopJob(jobName) {
    const job = this.scheduledJobs.get(jobName);
    if (job && job.task) {
      job.task.stop();
      job.isRunning = false;
      logger.info(`⏹️ Stopped job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific job
   */
  startJob(jobName) {
    const job = this.scheduledJobs.get(jobName);
    if (job && job.task) {
      job.task.start();
      job.isRunning = true;
      logger.info(`▶️ Started job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Stop all jobs
   */
  stopAllJobs() {
    logger.info('⏹️ Stopping all scheduled jobs...');
    
    for (const [jobName, job] of this.scheduledJobs) {
      if (job.task) {
        job.task.stop();
        job.isRunning = false;
        logger.info(`⏹️ Stopped job: ${jobName}`);
      }
    }

    logger.info('✅ All jobs stopped');
  }

  /**
   * Get status of all jobs
   */
  getJobsStatus() {
    const status = {
      isInitialized: this.isInitialized,
      jobsEnabled: config.jobs.profitJobEnabled,
      timezone: config.jobs.profitJobTimezone || 'UTC',
      jobs: []
    };

    for (const [jobName, job] of this.scheduledJobs) {
      status.jobs.push({
        name: jobName,
        displayName: job.name,
        cronExpression: job.cronExpression,
        description: job.description,
        isRunning: job.task ? !job.task.destroyed : false,
        nextRun: job.task && !job.task.destroyed ? 'Scheduled' : 'Not scheduled'
      });
    }

    return status;
  }

  /**
   * Schedule a custom job
   */
  scheduleCustomJob(jobName, cronExpression, jobFunction, options = {}) {
    if (this.scheduledJobs.has(jobName)) {
      logger.warn(`Job ${jobName} already exists`);
      return false;
    }

    const task = cron.schedule(cronExpression, async () => {
      logger.info(`🔧 Custom job triggered: ${jobName}`);
      try {
        await jobFunction();
        logger.info(`✅ Custom job completed: ${jobName}`);
      } catch (error) {
        logger.error(`❌ Custom job failed: ${jobName}`, error);
      }
    }, {
      scheduled: false,
      timezone: options.timezone || config.jobs.profitJobTimezone || 'UTC'
    });

    this.scheduledJobs.set(jobName, {
      task,
      name: options.displayName || jobName,
      cronExpression,
      description: options.description || 'Custom scheduled job',
      isRunning: false
    });

    if (options.startImmediately !== false) {
      task.start();
    }

    logger.info(`📅 Custom job scheduled: ${jobName} - ${cronExpression}`);
    return true;
  }

  /**
   * Remove a job
   */
  removeJob(jobName) {
    const job = this.scheduledJobs.get(jobName);
    if (job) {
      if (job.task) {
        job.task.stop();
      }
      this.scheduledJobs.delete(jobName);
      logger.info(`🗑️ Removed job: ${jobName}`);
      return true;
    }
    return false;
  }

  /**
   * Graceful shutdown
   */
  shutdown() {
    logger.info('🔽 Shutting down job scheduler...');
    this.stopAllJobs();
    this.scheduledJobs.clear();
    this.isInitialized = false;
    logger.info('✅ Job scheduler shutdown complete');
  }
}

// Create singleton instance
const jobScheduler = new JobScheduler();

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down job scheduler gracefully');
  jobScheduler.shutdown();
});

process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down job scheduler gracefully');
  jobScheduler.shutdown();
});

module.exports = jobScheduler;