const database = require('../config/database');
const logger = require('../config/logger');
const config = require('../config/config');
const { decimalToNumber, generatePaginationMeta } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

/**
 * Request Withdrawal
 */
const createWithdrawal = async (req, res) => {
  const { amount_usd, destination_wallet, coin } = req.body;
  const prisma = database.getClient();

  try {
    // Check minimum withdrawal amount
    if (amount_usd < config.business.minWithdrawalUsd) {
      return res.status(400).json({
        success: false,
        message: `Minimum withdrawal amount is $${config.business.minWithdrawalUsd}`,
        messageKey: 'withdrawal.minimum_amount'
      });
    }

    // Get user with current balance
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        balance_usd: true,
        referred_by: true,
      }
    });

    // Check if user has sufficient balance
    if (parseFloat(user.balance_usd) < amount_usd) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance',
        messageKey: 'withdrawal.insufficient_balance'
      });
    }

    // Check referral requirement for withdrawal
    const referralStats = await prisma.user.findMany({
      where: {
        referred_by: req.user.referral_code,
      },
      include: {
        deposits: {
          where: {
            status: 'APPROVED'
          }
        }
      }
    });

    const referralsWithDeposits = referralStats.filter(referral => 
      referral.deposits.length > 0
    ).length;

    if (referralsWithDeposits < config.business.minReferralsForWithdrawal) {
      return res.status(403).json({
        success: false,
        message: `Withdrawals unlock after ${config.business.minReferralsForWithdrawal} referred users each complete a deposit`,
        messageKey: 'withdrawal.referral_requirement_not_met',
        data: {
          currentReferralsWithDeposits: referralsWithDeposits,
          requiredReferralsWithDeposits: config.business.minReferralsForWithdrawal,
        }
      });
    }

    // Create withdrawal request
    const withdrawal = await prisma.withdrawal.create({
      data: {
        user_id: req.user.id,
        amount_usd,
        destination_wallet,
        coin,
        status: 'PENDING',
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        user_id: req.user.id,
        type: 'WITHDRAWAL',
        amount_usd: -amount_usd, // Negative for withdrawal
        description: `Withdrawal request - ${coin} to ${destination_wallet.substring(0, 10)}...`,
      }
    });

    logger.info(`Withdrawal request created`, {
      userId: req.user.id,
      withdrawalId: withdrawal.id,
      amount: amount_usd,
      coin,
      destinationWallet: destination_wallet,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      messageKey: 'withdrawal.request_submitted',
      data: {
        withdrawal: decimalToNumber({
          id: withdrawal.id,
          amount_usd: withdrawal.amount_usd,
          destination_wallet: withdrawal.destination_wallet,
          coin: withdrawal.coin,
          status: withdrawal.status,
          created_at: withdrawal.created_at,
        })
      }
    });

  } catch (error) {
    logger.error('Create withdrawal error:', error);
    throw error;
  }
};

/**
 * Get User Withdrawals
 */
const getUserWithdrawals = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;
    
    const where = {
      user_id: req.user.id,
      ...(status && { status }),
    };

    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          amount_usd: true,
          destination_wallet: true,
          coin: true,
          status: true,
          admin_notes: true,
          created_at: true,
          approved_at: true,
        }
      }),
      prisma.withdrawal.count({ where })
    ]);

    const pagination = generatePaginationMeta(totalCount, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Withdrawals retrieved successfully',
      messageKey: 'withdrawal.list_retrieved',
      data: {
        withdrawals: decimalToNumber(withdrawals),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get user withdrawals error:', error);
    throw error;
  }
};

/**
 * Get Single Withdrawal
 */
const getWithdrawal = async (req, res) => {
  const { id } = req.params;
  const prisma = database.getClient();

  try {
    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id,
        user_id: req.user.id,
      },
      select: {
        id: true,
        amount_usd: true,
        destination_wallet: true,
        coin: true,
        status: true,
        admin_notes: true,
        created_at: true,
        approved_at: true,
      }
    });

    if (!withdrawal) {
      throw createError(404, 'Withdrawal not found', 'withdrawal.not_found');
    }

    res.json({
      success: true,
      message: 'Withdrawal retrieved successfully',
      messageKey: 'withdrawal.retrieved',
      data: {
        withdrawal: decimalToNumber(withdrawal)
      }
    });

  } catch (error) {
    logger.error('Get withdrawal error:', error);
    throw error;
  }
};

/**
 * Check Withdrawal Eligibility
 */
const checkWithdrawalEligibility = async (req, res) => {
  const prisma = database.getClient();

  try {
    // Get user balance
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        balance_usd: true,
        referral_code: true,
      }
    });

    // Check referral requirement
    const referralStats = await prisma.user.findMany({
      where: {
        referred_by: user.referral_code,
      },
      include: {
        deposits: {
          where: {
            status: 'APPROVED'
          }
        }
      }
    });

    const referralsWithDeposits = referralStats.filter(referral => 
      referral.deposits.length > 0
    ).length;

    const isEligible = referralsWithDeposits >= config.business.minReferralsForWithdrawal;

    res.json({
      success: true,
      message: 'Withdrawal eligibility checked',
      messageKey: 'withdrawal.eligibility_checked',
      data: {
        isEligible,
        currentBalance: parseFloat(user.balance_usd),
        minWithdrawalAmount: config.business.minWithdrawalUsd,
        referralRequirement: {
          current: referralsWithDeposits,
          required: config.business.minReferralsForWithdrawal,
          met: isEligible,
        }
      }
    });

  } catch (error) {
    logger.error('Check withdrawal eligibility error:', error);
    throw error;
  }
};

module.exports = {
  createWithdrawal,
  getUserWithdrawals,
  getWithdrawal,
  checkWithdrawalEligibility,
};