const database = require('../config/database');
const logger = require('../config/logger');
const { decimalToNumber, generatePaginationMeta, addDays } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

/**
 * Get Investment Plans
 */
const getInvestmentPlans = async (req, res) => {
  const prisma = database.getClient();

  try {
    const plans = await prisma.investmentPlan.findMany({
      where: { is_active: true },
      orderBy: { min_deposit_usd: 'asc' },
      select: {
        id: true,
        name: true,
        daily_percentage: true,
        min_deposit_usd: true,
        duration_days: true,
        created_at: true,
      }
    });

    // Calculate additional metrics for each plan
    const plansWithMetrics = plans.map(plan => ({
      ...plan,
      total_return_percentage: parseFloat(plan.daily_percentage) * plan.duration_days,
      estimated_profit: {
        min_investment: parseFloat(plan.min_deposit_usd),
        daily_profit: (parseFloat(plan.min_deposit_usd) * parseFloat(plan.daily_percentage)) / 100,
        total_profit: (parseFloat(plan.min_deposit_usd) * parseFloat(plan.daily_percentage) * plan.duration_days) / 100,
      }
    }));

    res.json({
      success: true,
      message: 'Investment plans retrieved successfully',
      messageKey: 'investment.plans_retrieved',
      data: {
        plans: decimalToNumber(plansWithMetrics)
      }
    });

  } catch (error) {
    logger.error('Get investment plans error:', error);
    throw error;
  }
};

/**
 * Create Investment
 */
const createInvestment = async (req, res) => {
  const { plan_id, amount_usd } = req.body;
  const prisma = database.getClient();

  try {
    // Get investment plan
    const plan = await prisma.investmentPlan.findUnique({
      where: { id: plan_id, is_active: true }
    });

    if (!plan) {
      throw createError(404, 'Investment plan not found', 'investment.plan_not_found');
    }

    // Check minimum investment amount
    if (amount_usd < parseFloat(plan.min_deposit_usd)) {
      return res.status(400).json({
        success: false,
        message: `Minimum investment for ${plan.name} plan is $${plan.min_deposit_usd}`,
        messageKey: 'investment.minimum_amount'
      });
    }

    // Get user balance
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { balance_usd: true }
    });

    // Check if user has sufficient balance
    if (parseFloat(user.balance_usd) < amount_usd) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        messageKey: 'investment.insufficient_balance'
      });
    }

    // Calculate investment details
    const startDate = new Date();
    const endDate = addDays(startDate, plan.duration_days);

    // Create investment and update user balance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Deduct amount from user balance
      await tx.user.update({
        where: { id: req.user.id },
        data: {
          balance_usd: {
            decrement: amount_usd
          }
        }
      });

      // Create active investment
      const investment = await tx.activeInvestment.create({
        data: {
          user_id: req.user.id,
          plan_id: plan.id,
          amount_usd,
          start_date: startDate,
          end_date: endDate,
          daily_percent: plan.daily_percentage,
          status: 'ACTIVE',
        },
        include: {
          plan: true
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          user_id: req.user.id,
          type: 'INVESTMENT',
          amount_usd: -amount_usd,
          description: `Investment in ${plan.name} plan - ${plan.duration_days} days at ${plan.daily_percentage}% daily`,
        }
      });

      return investment;
    });

    logger.info(`Investment created`, {
      userId: req.user.id,
      investmentId: result.id,
      planName: plan.name,
      amount: amount_usd,
      duration: plan.duration_days,
    });

    res.status(201).json({
      success: true,
      message: 'Investment created successfully',
      messageKey: 'investment.created',
      data: {
        investment: decimalToNumber({
          id: result.id,
          plan: {
            id: result.plan.id,
            name: result.plan.name,
            daily_percentage: result.plan.daily_percentage,
            duration_days: result.plan.duration_days,
          },
          amount_usd: result.amount_usd,
          start_date: result.start_date,
          end_date: result.end_date,
          daily_percent: result.daily_percent,
          total_earned: result.total_earned,
          status: result.status,
          created_at: result.created_at,
        })
      }
    });

  } catch (error) {
    logger.error('Create investment error:', error);
    throw error;
  }
};

/**
 * Get User Investments
 */
const getUserInvestments = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;
    
    const where = {
      user_id: req.user.id,
      ...(status && { status }),
    };

    const [investments, totalCount] = await Promise.all([
      prisma.activeInvestment.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
        include: {
          plan: {
            select: {
              id: true,
              name: true,
              daily_percentage: true,
              duration_days: true,
            }
          }
        }
      }),
      prisma.activeInvestment.count({ where })
    ]);

    // Calculate additional metrics for each investment
    const investmentsWithMetrics = investments.map(investment => {
      const daysElapsed = Math.floor((new Date() - new Date(investment.start_date)) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.max(0, investment.plan.duration_days - daysElapsed);
      const progressPercentage = Math.min(100, (daysElapsed / investment.plan.duration_days) * 100);

      return {
        ...investment,
        metrics: {
          days_elapsed: Math.max(0, daysElapsed),
          days_remaining: daysRemaining,
          progress_percentage: Math.round(progressPercentage),
          expected_daily_profit: (parseFloat(investment.amount_usd) * parseFloat(investment.daily_percent)) / 100,
          expected_total_profit: (parseFloat(investment.amount_usd) * parseFloat(investment.daily_percent) * investment.plan.duration_days) / 100,
        }
      };
    });

    const pagination = generatePaginationMeta(totalCount, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Investments retrieved successfully',
      messageKey: 'investment.list_retrieved',
      data: {
        investments: decimalToNumber(investmentsWithMetrics),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get user investments error:', error);
    throw error;
  }
};

/**
 * Get Single Investment
 */
const getInvestment = async (req, res) => {
  const { id } = req.params;
  const prisma = database.getClient();

  try {
    const investment = await prisma.activeInvestment.findFirst({
      where: {
        id,
        user_id: req.user.id,
      },
      include: {
        plan: true
      }
    });

    if (!investment) {
      throw createError(404, 'Investment not found', 'investment.not_found');
    }

    // Calculate metrics
    const daysElapsed = Math.floor((new Date() - new Date(investment.start_date)) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, investment.plan.duration_days - daysElapsed);
    const progressPercentage = Math.min(100, (daysElapsed / investment.plan.duration_days) * 100);

    const investmentWithMetrics = {
      ...investment,
      metrics: {
        days_elapsed: Math.max(0, daysElapsed),
        days_remaining: daysRemaining,
        progress_percentage: Math.round(progressPercentage),
        expected_daily_profit: (parseFloat(investment.amount_usd) * parseFloat(investment.daily_percent)) / 100,
        expected_total_profit: (parseFloat(investment.amount_usd) * parseFloat(investment.daily_percent) * investment.plan.duration_days) / 100,
      }
    };

    res.json({
      success: true,
      message: 'Investment retrieved successfully',
      messageKey: 'investment.retrieved',
      data: {
        investment: decimalToNumber(investmentWithMetrics)
      }
    });

  } catch (error) {
    logger.error('Get investment error:', error);
    throw error;
  }
};

/**
 * Get Investment Statistics
 */
const getInvestmentStats = async (req, res) => {
  const prisma = database.getClient();

  try {
    const stats = await prisma.activeInvestment.aggregate({
      where: { user_id: req.user.id },
      _sum: {
        amount_usd: true,
        total_earned: true,
      },
      _count: {
        id: true,
      }
    });

    const activeInvestments = await prisma.activeInvestment.count({
      where: {
        user_id: req.user.id,
        status: 'ACTIVE',
      }
    });

    const completedInvestments = await prisma.activeInvestment.count({
      where: {
        user_id: req.user.id,
        status: 'COMPLETED',
      }
    });

    res.json({
      success: true,
      message: 'Investment statistics retrieved successfully',
      messageKey: 'investment.stats_retrieved',
      data: {
        stats: {
          total_invested: parseFloat(stats._sum.amount_usd || 0),
          total_earned: parseFloat(stats._sum.total_earned || 0),
          total_investments: stats._count.id || 0,
          active_investments: activeInvestments,
          completed_investments: completedInvestments,
        }
      }
    });

  } catch (error) {
    logger.error('Get investment stats error:', error);
    throw error;
  }
};

module.exports = {
  getInvestmentPlans,
  createInvestment,
  getUserInvestments,
  getInvestment,
  getInvestmentStats,
};