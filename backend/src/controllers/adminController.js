const database = require('../config/database');
const logger = require('../config/logger');
const config = require('../config/config');
const emailService = require('../services/emailService');
const { decimalToNumber, generatePaginationMeta } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

/**
 * Admin Dashboard Statistics
 */
const getDashboardStats = async (req, res) => {
  const prisma = database.getClient();

  try {
    // Get overall statistics
    const [
      totalUsers,
      totalDeposits,
      totalWithdrawals,
      pendingDeposits,
      pendingWithdrawals,
      totalInvested,
      totalCommissions,
      activeInvestments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.deposit.aggregate({
        _sum: { amount_usd: true },
        _count: { id: true }
      }),
      prisma.withdrawal.aggregate({
        _sum: { amount_usd: true },
        _count: { id: true }
      }),
      prisma.deposit.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.activeInvestment.aggregate({
        _sum: { amount_usd: true },
        _count: { id: true }
      }),
      prisma.referralCommission.aggregate({
        _sum: { commission_usd: true },
        _count: { id: true }
      }),
      prisma.activeInvestment.count({ where: { status: 'ACTIVE' } })
    ]);

    // Get recent activities
    const recentDeposits = await prisma.deposit.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    const recentWithdrawals = await prisma.withdrawal.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    // Get user growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsersLast30Days = await prisma.user.count({
      where: {
        created_at: { gte: thirtyDaysAgo }
      }
    });

    res.json({
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      messageKey: 'admin.dashboard_stats_retrieved',
      data: {
        overview: {
          total_users: totalUsers,
          new_users_last_30_days: newUsersLast30Days,
          total_deposits: {
            count: totalDeposits._count.id || 0,
            amount: parseFloat(totalDeposits._sum.amount_usd || 0)
          },
          total_withdrawals: {
            count: totalWithdrawals._count.id || 0,
            amount: parseFloat(totalWithdrawals._sum.amount_usd || 0)
          },
          total_invested: {
            count: totalInvested._count.id || 0,
            amount: parseFloat(totalInvested._sum.amount_usd || 0)
          },
          total_commissions: {
            count: totalCommissions._count.id || 0,
            amount: parseFloat(totalCommissions._sum.commission_usd || 0)
          },
          active_investments: activeInvestments,
        },
        pending: {
          deposits: pendingDeposits,
          withdrawals: pendingWithdrawals,
        },
        recent_activities: {
          deposits: decimalToNumber(recentDeposits.map(d => ({
            id: d.id,
            user_name: d.user.name,
            user_email: d.user.email,
            amount: d.amount_usd,
            coin: d.coin,
            status: d.status,
            created_at: d.created_at,
          }))),
          withdrawals: decimalToNumber(recentWithdrawals.map(w => ({
            id: w.id,
            user_name: w.user.name,
            user_email: w.user.email,
            amount: w.amount_usd,
            coin: w.coin,
            status: w.status,
            created_at: w.created_at,
          })))
        }
      }
    });

  } catch (error) {
    logger.error('Get dashboard stats error:', error);
    throw error;
  }
};

/**
 * Get All Deposits (Admin)
 */
const getAllDeposits = async (req, res) => {
  const { page = 1, limit = 20, status, coin, search } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(status && { status }),
      ...(coin && { coin }),
      ...(search && {
        OR: [
          { txid: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ]
      })
    };

    const [deposits, totalCount] = await Promise.all([
      prisma.deposit.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              referral_code: true,
            }
          }
        }
      }),
      prisma.deposit.count({ where })
    ]);

    const pagination = generatePaginationMeta(totalCount, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Deposits retrieved successfully',
      messageKey: 'admin.deposits_retrieved',
      data: {
        deposits: decimalToNumber(deposits),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get all deposits error:', error);
    throw error;
  }
};

/**
 * Approve Deposit
 */
const approveDeposit = async (req, res) => {
  const { id } = req.params;
  const { admin_notes, approved_amount } = req.body;
  const prisma = database.getClient();

  try {
    // Get deposit with user info
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance_usd: true,
            referred_by: true,
          }
        }
      }
    });

    if (!deposit) {
      throw createError(404, 'Deposit not found', 'admin.deposit_not_found');
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Deposit is not in pending status',
        messageKey: 'admin.deposit_not_pending'
      });
    }

    const finalAmount = approved_amount || parseFloat(deposit.amount_usd);

    // Process deposit approval in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update deposit status
      const updatedDeposit = await tx.deposit.update({
        where: { id },
        data: {
          status: 'APPROVED',
          admin_notes,
          approved_at: new Date(),
          approved_by: req.user.id,
          ...(approved_amount && { amount_usd: approved_amount })
        }
      });

      // Add funds to user balance
      const updatedUser = await tx.user.update({
        where: { id: deposit.user.id },
        data: {
          balance_usd: {
            increment: finalAmount
          }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          user_id: deposit.user.id,
          type: 'DEPOSIT',
          amount_usd: finalAmount,
          description: `Deposit approved - ${deposit.coin} ${deposit.chain} (${deposit.txid})`,
        }
      });

      // Handle referral commission if user was referred
      if (deposit.user.referred_by) {
        const referrer = await tx.user.findUnique({
          where: { referral_code: deposit.user.referred_by }
        });

        if (referrer) {
          const commissionAmount = finalAmount * config.business.referralCommissionRate;

          // Add commission to referrer's balance
          await tx.user.update({
            where: { id: referrer.id },
            data: {
              balance_usd: {
                increment: commissionAmount
              }
            }
          });

          // Create referral commission record
          await tx.referralCommission.create({
            data: {
              referrer_id: referrer.id,
              referee_id: deposit.user.id,
              deposit_id: deposit.id,
              commission_usd: commissionAmount,
            }
          });

          // Create transaction record for commission
          await tx.transaction.create({
            data: {
              user_id: referrer.id,
              type: 'REFERRAL_COMMISSION',
              amount_usd: commissionAmount,
              description: `Referral commission from ${deposit.user.name} - ${config.business.referralCommissionRate * 100}%`,
            }
          });
        }
      }

      return { updatedDeposit, updatedUser };
    });

    // Send approval email (don't fail if email fails)
    try {
      await emailService.sendDepositApprovalEmail(
        { ...deposit.user, balance_usd: result.updatedUser.balance_usd }, 
        { ...deposit, amount_usd: finalAmount }
      );
    } catch (emailError) {
      logger.warn('Failed to send deposit approval email:', emailError);
    }

    // Log admin action
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: 'APPROVE_DEPOSIT',
        details: {
          deposit_id: deposit.id,
          user_id: deposit.user.id,
          amount: finalAmount,
          original_amount: parseFloat(deposit.amount_usd),
          admin_notes,
        }
      }
    });

    logger.info(`Deposit approved by admin`, {
      adminId: req.user.id,
      depositId: deposit.id,
      userId: deposit.user.id,
      amount: finalAmount,
    });

    res.json({
      success: true,
      message: 'Deposit approved successfully',
      messageKey: 'admin.deposit_approved',
      data: {
        deposit: decimalToNumber(result.updatedDeposit)
      }
    });

  } catch (error) {
    logger.error('Approve deposit error:', error);
    throw error;
  }
};

/**
 * Reject Deposit
 */
const rejectDeposit = async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;
  const prisma = database.getClient();

  try {
    const deposit = await prisma.deposit.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!deposit) {
      throw createError(404, 'Deposit not found', 'admin.deposit_not_found');
    }

    if (deposit.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Deposit is not in pending status',
        messageKey: 'admin.deposit_not_pending'
      });
    }

    // Update deposit status
    const updatedDeposit = await prisma.deposit.update({
      where: { id },
      data: {
        status: 'REJECTED',
        admin_notes,
        approved_at: new Date(),
        approved_by: req.user.id,
      }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: 'REJECT_DEPOSIT',
        details: {
          deposit_id: deposit.id,
          user_id: deposit.user.id,
          amount: parseFloat(deposit.amount_usd),
          admin_notes,
        }
      }
    });

    logger.info(`Deposit rejected by admin`, {
      adminId: req.user.id,
      depositId: deposit.id,
      userId: deposit.user.id,
      reason: admin_notes,
    });

    res.json({
      success: true,
      message: 'Deposit rejected successfully',
      messageKey: 'admin.deposit_rejected',
      data: {
        deposit: decimalToNumber(updatedDeposit)
      }
    });

  } catch (error) {
    logger.error('Reject deposit error:', error);
    throw error;
  }
};

/**
 * Get All Withdrawals (Admin)
 */
const getAllWithdrawals = async (req, res) => {
  const { page = 1, limit = 20, status, coin, search } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(status && { status }),
      ...(coin && { coin }),
      ...(search && {
        OR: [
          { destination_wallet: { contains: search, mode: 'insensitive' } },
          { user: { name: { contains: search, mode: 'insensitive' } } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
        ]
      })
    };

    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              balance_usd: true,
            }
          }
        }
      }),
      prisma.withdrawal.count({ where })
    ]);

    const pagination = generatePaginationMeta(totalCount, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Withdrawals retrieved successfully',
      messageKey: 'admin.withdrawals_retrieved',
      data: {
        withdrawals: decimalToNumber(withdrawals),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get all withdrawals error:', error);
    throw error;
  }
};

/**
 * Approve Withdrawal
 */
const approveWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;
  const prisma = database.getClient();

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            balance_usd: true,
          }
        }
      }
    });

    if (!withdrawal) {
      throw createError(404, 'Withdrawal not found', 'admin.withdrawal_not_found');
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal is not in pending status',
        messageKey: 'admin.withdrawal_not_pending'
      });
    }

    // Process withdrawal approval in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update withdrawal status
      const updatedWithdrawal = await tx.withdrawal.update({
        where: { id },
        data: {
          status: 'APPROVED',
          admin_notes,
          approved_at: new Date(),
          approved_by: req.user.id,
        }
      });

      // Deduct amount from user balance
      const updatedUser = await tx.user.update({
        where: { id: withdrawal.user.id },
        data: {
          balance_usd: {
            decrement: parseFloat(withdrawal.amount_usd)
          }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          user_id: withdrawal.user.id,
          type: 'WITHDRAWAL',
          amount_usd: -parseFloat(withdrawal.amount_usd),
          description: `Withdrawal approved - ${withdrawal.coin} to ${withdrawal.destination_wallet.substring(0, 10)}...`,
        }
      });

      return { updatedWithdrawal, updatedUser };
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: 'APPROVE_WITHDRAWAL',
        details: {
          withdrawal_id: withdrawal.id,
          user_id: withdrawal.user.id,
          amount: parseFloat(withdrawal.amount_usd),
          destination_wallet: withdrawal.destination_wallet,
          admin_notes,
        }
      }
    });

    logger.info(`Withdrawal approved by admin`, {
      adminId: req.user.id,
      withdrawalId: withdrawal.id,
      userId: withdrawal.user.id,
      amount: parseFloat(withdrawal.amount_usd),
    });

    res.json({
      success: true,
      message: 'Withdrawal approved successfully',
      messageKey: 'admin.withdrawal_approved',
      data: {
        withdrawal: decimalToNumber(result.updatedWithdrawal)
      }
    });

  } catch (error) {
    logger.error('Approve withdrawal error:', error);
    throw error;
  }
};

/**
 * Reject Withdrawal
 */
const rejectWithdrawal = async (req, res) => {
  const { id } = req.params;
  const { admin_notes } = req.body;
  const prisma = database.getClient();

  try {
    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    if (!withdrawal) {
      throw createError(404, 'Withdrawal not found', 'admin.withdrawal_not_found');
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: 'Withdrawal is not in pending status',
        messageKey: 'admin.withdrawal_not_pending'
      });
    }

    // Update withdrawal status
    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: {
        status: 'REJECTED',
        admin_notes,
        approved_at: new Date(),
        approved_by: req.user.id,
      }
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: 'REJECT_WITHDRAWAL',
        details: {
          withdrawal_id: withdrawal.id,
          user_id: withdrawal.user.id,
          amount: parseFloat(withdrawal.amount_usd),
          admin_notes,
        }
      }
    });

    logger.info(`Withdrawal rejected by admin`, {
      adminId: req.user.id,
      withdrawalId: withdrawal.id,
      userId: withdrawal.user.id,
      reason: admin_notes,
    });

    res.json({
      success: true,
      message: 'Withdrawal rejected successfully',
      messageKey: 'admin.withdrawal_rejected',
      data: {
        withdrawal: decimalToNumber(updatedWithdrawal)
      }
    });

  } catch (error) {
    logger.error('Reject withdrawal error:', error);
    throw error;
  }
};

/**
 * Adjust User Balance
 */
const adjustUserBalance = async (req, res) => {
  const { id: userId } = req.params;
  const { amount, reason } = req.body;
  const prisma = database.getClient();

  try {
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        balance_usd: true,
      }
    });

    if (!user) {
      throw createError(404, 'User not found', 'admin.user_not_found');
    }

    // Check if adjustment would result in negative balance
    if (parseFloat(user.balance_usd) + amount < 0) {
      return res.status(400).json({
        success: false,
        message: 'Adjustment would result in negative balance',
        messageKey: 'admin.negative_balance_not_allowed'
      });
    }

    // Adjust balance in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user balance
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          balance_usd: {
            increment: amount
          }
        }
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          user_id: userId,
          type: 'ADMIN_ADJUSTMENT',
          amount_usd: amount,
          description: `Admin balance adjustment: ${reason}`,
        }
      });

      return updatedUser;
    });

    // Log admin action
    await prisma.adminLog.create({
      data: {
        admin_id: req.user.id,
        action: 'ADJUST_USER_BALANCE',
        details: {
          user_id: userId,
          amount,
          reason,
          previous_balance: parseFloat(user.balance_usd),
          new_balance: parseFloat(result.balance_usd),
        }
      }
    });

    logger.info(`User balance adjusted by admin`, {
      adminId: req.user.id,
      userId,
      amount,
      reason,
      previousBalance: parseFloat(user.balance_usd),
      newBalance: parseFloat(result.balance_usd),
    });

    res.json({
      success: true,
      message: 'User balance adjusted successfully',
      messageKey: 'admin.balance_adjusted',
      data: {
        user: {
          id: result.id,
          name: result.name,
          email: result.email,
          previous_balance: parseFloat(user.balance_usd),
          new_balance: parseFloat(result.balance_usd),
          adjustment_amount: amount,
        }
      }
    });

  } catch (error) {
    logger.error('Adjust user balance error:', error);
    throw error;
  }
};

module.exports = {
  getDashboardStats,
  getAllDeposits,
  approveDeposit,
  rejectDeposit,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal,
  adjustUserBalance,
};