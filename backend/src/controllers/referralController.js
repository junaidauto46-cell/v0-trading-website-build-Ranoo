const database = require('../config/database');
const logger = require('../config/logger');
const config = require('../config/config');
const { decimalToNumber, generatePaginationMeta } = require('../utils/helpers');

/**
 * Get Referral Statistics
 */
const getReferralStats = async (req, res) => {
  const prisma = database.getClient();

  try {
    // Get user's referral code
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { referral_code: true }
    });

    // Get all referrals
    const referrals = await prisma.user.findMany({
      where: { referred_by: user.referral_code },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        deposits: {
          where: { status: 'APPROVED' },
          select: {
            amount_usd: true,
            created_at: true,
          }
        }
      }
    });

    // Get commission earnings
    const commissions = await prisma.referralCommission.findMany({
      where: { referrer_id: req.user.id },
      select: {
        commission_usd: true,
        created_at: true,
        referee: {
          select: {
            name: true,
            email: true,
          }
        },
        deposit: {
          select: {
            amount_usd: true,
            coin: true,
          }
        }
      },
      orderBy: { created_at: 'desc' }
    });

    // Calculate statistics
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter(ref => ref.deposits.length > 0).length;
    const totalCommissionEarned = commissions.reduce((sum, comm) => sum + parseFloat(comm.commission_usd), 0);
    const totalReferralDeposits = referrals.reduce((sum, ref) => 
      sum + ref.deposits.reduce((depSum, dep) => depSum + parseFloat(dep.amount_usd), 0), 0
    );

    // Get recent referrals (last 10)
    const recentReferrals = referrals
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10)
      .map(ref => ({
        id: ref.id,
        name: ref.name,
        email: ref.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
        joined_date: ref.created_at,
        total_deposits: ref.deposits.length,
        total_deposit_amount: ref.deposits.reduce((sum, dep) => sum + parseFloat(dep.amount_usd), 0),
        status: ref.deposits.length > 0 ? 'active' : 'inactive',
      }));

    // Get recent commissions (last 10)
    const recentCommissions = commissions.slice(0, 10).map(comm => ({
      amount: parseFloat(comm.commission_usd),
      date: comm.created_at,
      referee_name: comm.referee.name,
      deposit_amount: parseFloat(comm.deposit.amount_usd),
      deposit_coin: comm.deposit.coin,
    }));

    res.json({
      success: true,
      message: 'Referral statistics retrieved successfully',
      messageKey: 'referral.stats_retrieved',
      data: {
        stats: {
          total_referrals: totalReferrals,
          active_referrals: activeReferrals,
          inactive_referrals: totalReferrals - activeReferrals,
          total_commission_earned: totalCommissionEarned,
          total_referral_deposits: totalReferralDeposits,
          commission_rate: config.business.referralCommissionRate * 100, // Convert to percentage
          referral_code: user.referral_code,
        },
        recent_referrals: recentReferrals,
        recent_commissions: decimalToNumber(recentCommissions),
      }
    });

  } catch (error) {
    logger.error('Get referral stats error:', error);
    throw error;
  }
};

/**
 * Get Referral List
 */
const getReferrals = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;

    // Get user's referral code
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { referral_code: true }
    });

    // Build where clause based on status filter
    let referrals = await prisma.user.findMany({
      where: { referred_by: user.referral_code },
      skip,
      take: parseInt(limit),
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        created_at: true,
        deposits: {
          where: { status: 'APPROVED' },
          select: {
            amount_usd: true,
            created_at: true,
          }
        }
      }
    });

    // Filter by status if provided
    if (status) {
      referrals = referrals.filter(ref => {
        const hasDeposits = ref.deposits.length > 0;
        return status === 'active' ? hasDeposits : !hasDeposits;
      });
    }

    // Get total count for pagination
    const totalReferrals = await prisma.user.count({
      where: { referred_by: user.referral_code }
    });

    // Format referrals data
    const formattedReferrals = referrals.map(ref => ({
      id: ref.id,
      name: ref.name,
      email: ref.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for privacy
      joined_date: ref.created_at,
      total_deposits: ref.deposits.length,
      total_deposit_amount: ref.deposits.reduce((sum, dep) => sum + parseFloat(dep.amount_usd), 0),
      last_deposit_date: ref.deposits.length > 0 ? 
        new Date(Math.max(...ref.deposits.map(d => new Date(d.created_at)))) : null,
      status: ref.deposits.length > 0 ? 'active' : 'inactive',
    }));

    const pagination = generatePaginationMeta(totalReferrals, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Referrals retrieved successfully',
      messageKey: 'referral.list_retrieved',
      data: {
        referrals: decimalToNumber(formattedReferrals),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get referrals error:', error);
    throw error;
  }
};

/**
 * Get Commission History
 */
const getCommissionHistory = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;

    const [commissions, totalCount] = await Promise.all([
      prisma.referralCommission.findMany({
        where: { referrer_id: req.user.id },
        skip,
        take: parseInt(limit),
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          commission_usd: true,
          created_at: true,
          referee: {
            select: {
              name: true,
              email: true,
            }
          },
          deposit: {
            select: {
              amount_usd: true,
              coin: true,
              chain: true,
              txid: true,
            }
          }
        }
      }),
      prisma.referralCommission.count({
        where: { referrer_id: req.user.id }
      })
    ]);

    // Format commission data
    const formattedCommissions = commissions.map(comm => ({
      id: comm.id,
      commission_amount: parseFloat(comm.commission_usd),
      commission_rate: config.business.referralCommissionRate * 100,
      date: comm.created_at,
      referee: {
        name: comm.referee.name,
        email: comm.referee.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email
      },
      deposit: {
        amount: parseFloat(comm.deposit.amount_usd),
        coin: comm.deposit.coin,
        chain: comm.deposit.chain,
        txid: comm.deposit.txid.substring(0, 10) + '...', // Mask txid
      }
    }));

    const pagination = generatePaginationMeta(totalCount, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Commission history retrieved successfully',
      messageKey: 'referral.commission_history_retrieved',
      data: {
        commissions: decimalToNumber(formattedCommissions),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get commission history error:', error);
    throw error;
  }
};

/**
 * Generate Referral Link
 */
const generateReferralLink = async (req, res) => {
  const prisma = database.getClient();

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { referral_code: true }
    });

    const referralLink = `${config.frontendUrl}/register?ref=${user.referral_code}`;

    res.json({
      success: true,
      message: 'Referral link generated successfully',
      messageKey: 'referral.link_generated',
      data: {
        referral_code: user.referral_code,
        referral_link: referralLink,
        instructions: {
          sharing: 'Share this link with friends to earn commissions',
          commission: `Earn ${config.business.referralCommissionRate * 100}% commission on their deposits`,
          requirements: 'Commissions are paid instantly when referrals make approved deposits',
        }
      }
    });

  } catch (error) {
    logger.error('Generate referral link error:', error);
    throw error;
  }
};

module.exports = {
  getReferralStats,
  getReferrals,
  getCommissionHistory,
  generateReferralLink,
};