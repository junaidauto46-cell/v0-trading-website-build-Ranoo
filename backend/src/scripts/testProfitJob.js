require('dotenv').config();

const database = require('../config/database');
const dailyProfitJob = require('../jobs/dailyProfitJob');
const logger = require('../config/logger');

/**
 * Test script to create sample investments and run profit calculation
 */
async function testProfitJob() {
  try {
    await database.connect();
    logger.info('🚀 Starting profit job test...');

    const prisma = database.getClient();

    // Get or create a test user
    let testUser = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (!testUser) {
      // Create test user
      const { hashPassword, generateReferralCode } = require('../utils/helpers');
      const hashedPassword = await hashPassword('TestPassword123!');
      const referralCode = generateReferralCode();

      testUser = await prisma.user.create({
        data: {
          name: 'Test User',
          email: 'test@example.com',
          password_hash: hashedPassword,
          referral_code: referralCode,
          balance_usd: 1000, // Give them some balance
          role: 'USER',
        }
      });

      logger.info('✅ Created test user with $1000 balance');
    } else {
      // Update balance to $1000 for testing
      testUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { balance_usd: 1000 }
      });
      logger.info('✅ Updated test user balance to $1000');
    }

    // Get investment plans
    const plans = await prisma.investmentPlan.findMany({
      where: { is_active: true }
    });

    if (plans.length === 0) {
      logger.error('❌ No investment plans found. Run admin seeding first.');
      return;
    }

    // Create a test investment if none exists
    const existingInvestment = await prisma.activeInvestment.findFirst({
      where: {
        user_id: testUser.id,
        status: 'ACTIVE'
      }
    });

    if (!existingInvestment) {
      const starterPlan = plans.find(p => p.name === 'Starter');
      if (starterPlan) {
        const investmentAmount = 100;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 5); // Started 5 days ago
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + starterPlan.duration_days);

        const investment = await prisma.activeInvestment.create({
          data: {
            user_id: testUser.id,
            plan_id: starterPlan.id,
            amount_usd: investmentAmount,
            start_date: startDate,
            end_date: endDate,
            daily_percent: starterPlan.daily_percentage,
            status: 'ACTIVE',
            total_earned: 0,
          }
        });

        // Deduct from user balance
        await prisma.user.update({
          where: { id: testUser.id },
          data: {
            balance_usd: {
              decrement: investmentAmount
            }
          }
        });

        logger.info(`✅ Created test investment: $${investmentAmount} in ${starterPlan.name} plan (started 5 days ago)`);
      }
    } else {
      logger.info('✅ Test investment already exists');
    }

    // Show current state before profit calculation
    const userBefore = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { balance_usd: true }
    });

    const investmentsBefore = await prisma.activeInvestment.findMany({
      where: { user_id: testUser.id, status: 'ACTIVE' },
      include: { plan: true }
    });

    logger.info(`📊 Before profit calculation:`);
    logger.info(`   User balance: $${userBefore.balance_usd}`);
    investmentsBefore.forEach(inv => {
      const daysElapsed = Math.floor((new Date() - new Date(inv.start_date)) / (1000 * 60 * 60 * 24));
      logger.info(`   Investment: $${inv.amount_usd} in ${inv.plan.name} (${daysElapsed} days, earned $${inv.total_earned})`);
    });

    // Run the profit calculation job
    logger.info('🔥 Running daily profit calculation...');
    const result = await dailyProfitJob.execute();

    if (result.success) {
      logger.info('✅ Profit calculation completed successfully!');
      logger.info(`📈 Results:`);
      logger.info(`   Processed investments: ${result.results.processedInvestments}`);
      logger.info(`   Total profit distributed: $${result.results.totalProfitDistributed}`);
      logger.info(`   Completed investments: ${result.results.completedInvestments}`);
      logger.info(`   Emails sent: ${result.results.emailsSent}`);
      logger.info(`   Errors: ${result.results.errors.length}`);

      if (result.results.errors.length > 0) {
        logger.warn('⚠️ Errors encountered:');
        result.results.errors.forEach(error => {
          logger.warn(`   ${error.error}`);
        });
      }
    } else {
      logger.error('❌ Profit calculation failed:', result.error);
    }

    // Show state after profit calculation
    const userAfter = await prisma.user.findUnique({
      where: { id: testUser.id },
      select: { balance_usd: true }
    });

    const investmentsAfter = await prisma.activeInvestment.findMany({
      where: { user_id: testUser.id },
      include: { plan: true }
    });

    logger.info(`📊 After profit calculation:`);
    logger.info(`   User balance: $${userAfter.balance_usd} (change: $${(parseFloat(userAfter.balance_usd) - parseFloat(userBefore.balance_usd)).toFixed(2)})`);
    investmentsAfter.forEach(inv => {
      const daysElapsed = Math.floor((new Date() - new Date(inv.start_date)) / (1000 * 60 * 60 * 24));
      logger.info(`   Investment: $${inv.amount_usd} in ${inv.plan.name} (${daysElapsed} days, earned $${inv.total_earned}, status: ${inv.status})`);
    });

    // Show recent transactions
    const recentTransactions = await prisma.transaction.findMany({
      where: { user_id: testUser.id },
      orderBy: { created_at: 'desc' },
      take: 5
    });

    logger.info(`📋 Recent transactions:`);
    recentTransactions.forEach(tx => {
      logger.info(`   ${tx.type}: $${tx.amount_usd} - ${tx.description}`);
    });

  } catch (error) {
    logger.error('❌ Test failed:', error);
  } finally {
    await database.disconnect();
    logger.info('🔌 Disconnected from database');
  }
}

// CLI usage
if (require.main === module) {
  testProfitJob()
    .then(() => {
      logger.info('🎉 Test completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('💥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = testProfitJob;