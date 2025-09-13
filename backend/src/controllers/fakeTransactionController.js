const { generateFakeTransaction } = require('../utils/helpers');
const logger = require('../config/logger');

/**
 * Get Fake Transactions for Activity Feed
 * This endpoint generates simulated transactions for frontend display
 * NOT connected to real blockchain data
 */
const getFakeTransactions = async (req, res) => {
  const { count = 20 } = req.query;

  try {
    const transactionCount = Math.min(parseInt(count), 50); // Max 50 transactions
    const transactions = [];

    // Generate random transactions within the last 12 hours
    for (let i = 0; i < transactionCount; i++) {
      const transaction = generateFakeTransaction();
      transactions.push(transaction);
    }

    // Sort by timestamp (newest first)
    transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Add incremental IDs for frontend display
    const transactionsWithIds = transactions.map((tx, index) => ({
      id: `fake_${Date.now()}_${index}`,
      ...tx,
    }));

    res.json({
      success: true,
      message: 'Fake transactions retrieved successfully',
      messageKey: 'fake_transactions.retrieved',
      data: {
        transactions: transactionsWithIds,
        disclaimer: 'This data is simulated for demo purposes only. Not real blockchain transactions.',
        total: transactionCount,
        generated_at: new Date().toISOString(),
      }
    });

    // Log request (but don't spam logs)
    if (Math.random() < 0.1) { // Log ~10% of requests
      logger.debug('Fake transactions requested', {
        count: transactionCount,
        userAgent: req.get('User-Agent'),
      });
    }

  } catch (error) {
    logger.error('Get fake transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate fake transactions',
      messageKey: 'fake_transactions.generation_failed'
    });
  }
};

/**
 * Get Live Activity Feed
 * Generates a continuous stream of fake activities with different intervals
 */
const getLiveActivityFeed = async (req, res) => {
  try {
    // Generate activities with different types and frequencies
    const activities = [];
    const now = new Date();

    // Generate 15 activities over the last 2 hours
    for (let i = 0; i < 15; i++) {
      const minutesAgo = Math.floor(Math.random() * 120); // 0-120 minutes ago
      const timestamp = new Date(now.getTime() - (minutesAgo * 60 * 1000));
      
      const transaction = generateFakeTransaction();
      
      activities.push({
        id: `live_${timestamp.getTime()}_${i}`,
        ...transaction,
        timestamp: timestamp.toISOString(),
        minutes_ago: minutesAgo,
      });
    }

    // Sort by timestamp (newest first)
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json({
      success: true,
      message: 'Live activity feed retrieved successfully',
      messageKey: 'fake_transactions.live_feed_retrieved',
      data: {
        activities,
        disclaimer: 'This is simulated activity for demonstration purposes only.',
        last_updated: now.toISOString(),
        update_interval: '30 seconds',
      }
    });

  } catch (error) {
    logger.error('Get live activity feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate live activity feed',
      messageKey: 'fake_transactions.live_feed_failed'
    });
  }
};

/**
 * Get Fake Statistics
 * Provides simulated platform statistics for display
 */
const getFakeStats = async (req, res) => {
  try {
    // Generate realistic but fake statistics
    const baseValues = {
      totalUsers: 15420,
      totalInvested: 2500000,
      totalWithdrawals: 112500,
      dailyProfitRate: 4.5,
    };

    // Add small random variations (±5%)
    const stats = {
      total_users: Math.floor(baseValues.totalUsers * (0.95 + Math.random() * 0.1)),
      total_invested: Math.floor(baseValues.totalInvested * (0.95 + Math.random() * 0.1)),
      total_withdrawals: Math.floor(baseValues.totalWithdrawals * (0.95 + Math.random() * 0.1)),
      avg_daily_profit: parseFloat((baseValues.dailyProfitRate * (0.95 + Math.random() * 0.1)).toFixed(1)),
      active_traders: Math.floor(Math.random() * 500) + 800,
      online_now: Math.floor(Math.random() * 50) + 25,
    };

    res.json({
      success: true,
      message: 'Platform statistics retrieved successfully',
      messageKey: 'fake_transactions.stats_retrieved',
      data: {
        stats,
        disclaimer: 'These statistics are simulated for demonstration purposes.',
        last_updated: new Date().toISOString(),
      }
    });

  } catch (error) {
    logger.error('Get fake stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate platform statistics',
      messageKey: 'fake_transactions.stats_failed'
    });
  }
};

module.exports = {
  getFakeTransactions,
  getLiveActivityFeed,
  getFakeStats,
};