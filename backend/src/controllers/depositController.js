const database = require('../config/database');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const config = require('../config/config');
const { decimalToNumber, generatePaginationMeta } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

/**
 * Submit Deposit Request
 */
const createDeposit = async (req, res) => {
  const { txid, chain, amount_usd, coin, note } = req.body;
  const prisma = database.getClient();

  try {
    // Check if transaction ID already exists
    const existingDeposit = await prisma.deposit.findUnique({
      where: { txid }
    });

    if (existingDeposit) {
      return res.status(400).json({
        success: false,
        message: 'Transaction ID already exists',
        messageKey: 'deposit.txid_exists'
      });
    }

    // Create deposit request
    const deposit = await prisma.deposit.create({
      data: {
        user_id: req.user.id,
        txid,
        chain,
        amount_usd,
        coin,
        note: note || null,
        status: 'PENDING',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      }
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        user_id: req.user.id,
        type: 'DEPOSIT',
        amount_usd,
        description: `Deposit request submitted - ${coin} ${chain} (${txid})`,
      }
    });

    // Send notification email (don't fail if email fails)
    try {
      await emailService.sendDepositNotificationEmail(deposit.user, deposit);
    } catch (emailError) {
      logger.warn('Failed to send deposit notification email:', emailError);
    }

    logger.info(`Deposit request created`, {
      userId: req.user.id,
      depositId: deposit.id,
      amount: amount_usd,
      coin,
      chain,
      txid,
    });

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully',
      messageKey: 'deposit.request_submitted',
      data: {
        deposit: decimalToNumber({
          id: deposit.id,
          txid: deposit.txid,
          chain: deposit.chain,
          amount_usd: deposit.amount_usd,
          coin: deposit.coin,
          note: deposit.note,
          status: deposit.status,
          created_at: deposit.created_at,
        })
      }
    });

  } catch (error) {
    logger.error('Create deposit error:', error);
    throw error;
  }
};

/**
 * Get User Deposits
 */
const getUserDeposits = async (req, res) => {
  const { page = 1, limit = 10, status } = req.query;
  const prisma = database.getClient();

  try {
    const skip = (page - 1) * limit;
    
    const where = {
      user_id: req.user.id,
      ...(status && { status }),
    };

    const [deposits, totalCount] = await Promise.all([
      prisma.deposit.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          txid: true,
          chain: true,
          amount_usd: true,
          coin: true,
          note: true,
          status: true,
          admin_notes: true,
          created_at: true,
          approved_at: true,
        }
      }),
      prisma.deposit.count({ where })
    ]);

    const pagination = generatePaginationMeta(totalCount, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      message: 'Deposits retrieved successfully',
      messageKey: 'deposit.list_retrieved',
      data: {
        deposits: decimalToNumber(deposits),
        pagination,
      }
    });

  } catch (error) {
    logger.error('Get user deposits error:', error);
    throw error;
  }
};

/**
 * Get Deposit Addresses (Static)
 */
const getDepositAddresses = async (req, res) => {
  try {
    const addresses = {
      USDT: {
        ERC20: {
          address: config.depositAddresses.usdtErc20,
          network: 'Ethereum (ERC20)',
          minDeposit: 10,
        },
        TRC20: {
          address: config.depositAddresses.usdtTrc20,
          network: 'Tron (TRC20)',
          minDeposit: 10,
        }
      },
      BTC: {
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Example address
        network: 'Bitcoin',
        minDeposit: 0.001,
      },
      ETH: {
        address: config.depositAddresses.usdtErc20, // Same as USDT ERC20
        network: 'Ethereum',
        minDeposit: 0.01,
      }
    };

    res.json({
      success: true,
      message: 'Deposit addresses retrieved successfully',
      messageKey: 'deposit.addresses_retrieved',
      data: {
        addresses,
        instructions: {
          USDT: 'Send USDT to the appropriate network address above. Make sure to use the correct network.',
          BTC: 'Send Bitcoin to the address above. Minimum 1 confirmation required.',
          ETH: 'Send Ethereum to the address above. Minimum 3 confirmations required.',
        },
        warning: 'Always double-check the address and network before sending funds. Transactions cannot be reversed.'
      }
    });

  } catch (error) {
    logger.error('Get deposit addresses error:', error);
    throw error;
  }
};

/**
 * Get Single Deposit
 */
const getDeposit = async (req, res) => {
  const { id } = req.params;
  const prisma = database.getClient();

  try {
    const deposit = await prisma.deposit.findFirst({
      where: {
        id,
        user_id: req.user.id,
      },
      select: {
        id: true,
        txid: true,
        chain: true,
        amount_usd: true,
        coin: true,
        note: true,
        status: true,
        admin_notes: true,
        created_at: true,
        approved_at: true,
      }
    });

    if (!deposit) {
      throw createError(404, 'Deposit not found', 'deposit.not_found');
    }

    res.json({
      success: true,
      message: 'Deposit retrieved successfully',
      messageKey: 'deposit.retrieved',
      data: {
        deposit: decimalToNumber(deposit)
      }
    });

  } catch (error) {
    logger.error('Get deposit error:', error);
    throw error;
  }
};

module.exports = {
  createDeposit,
  getUserDeposits,
  getDepositAddresses,
  getDeposit,
};