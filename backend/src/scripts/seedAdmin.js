require('dotenv').config();

const database = require('../config/database');
const config = require('../config/config');
const logger = require('../config/logger');
const { hashPassword, generateReferralCode } = require('../utils/helpers');

/**
 * Seed initial admin user
 */
async function seedAdmin() {
  const prisma = database.getClient();

  try {
    await database.connect();
    
    logger.info('Starting admin user seeding...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: config.admin.email }
    });

    if (existingAdmin) {
      logger.info(`Admin user already exists: ${config.admin.email}`);
      
      // Update password if needed
      const hashedPassword = await hashPassword(config.admin.password);
      
      await prisma.user.update({
        where: { email: config.admin.email },
        data: {
          password_hash: hashedPassword,
          role: 'ADMIN',
          updated_at: new Date(),
        }
      });
      
      logger.info('Admin password updated successfully');
      return;
    }

    // Create admin user
    const hashedPassword = await hashPassword(config.admin.password);
    const referralCode = generateReferralCode();

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin',
        email: config.admin.email,
        password_hash: hashedPassword,
        referral_code: referralCode,
        role: 'ADMIN',
        balance_usd: 0,
        wallet_addresses: {},
      }
    });

    logger.info(`✅ Admin user created successfully!`);
    logger.info(`📧 Email: ${adminUser.email}`);
    logger.info(`🔑 Role: ${adminUser.role}`);
    logger.info(`🎯 Referral Code: ${adminUser.referral_code}`);
    logger.info(`🕒 Created at: ${adminUser.created_at}`);

    // Create default investment plans
    logger.info('Creating default investment plans...');

    const plans = [
      {
        name: 'Starter',
        daily_percentage: 1.5,
        min_deposit_usd: 10,
        duration_days: 30,
      },
      {
        name: 'Professional',
        daily_percentage: 2.0,
        min_deposit_usd: 100,
        duration_days: 45,
      },
      {
        name: 'Premium',
        daily_percentage: 2.5,
        min_deposit_usd: 500,
        duration_days: 60,
      },
    ];

    for (const plan of plans) {
      const existingPlan = await prisma.investmentPlan.findUnique({
        where: { name: plan.name }
      });

      if (!existingPlan) {
        const createdPlan = await prisma.investmentPlan.create({
          data: plan
        });
        
        logger.info(`✅ Created investment plan: ${createdPlan.name} (${createdPlan.daily_percentage}% daily)`);
      } else {
        logger.info(`📋 Investment plan already exists: ${plan.name}`);
      }
    }

    logger.info('🎉 Admin seeding completed successfully!');
    
  } catch (error) {
    logger.error('❌ Admin seeding failed:', error);
    throw error;
  } finally {
    await database.disconnect();
  }
}

/**
 * Reset admin password
 */
async function resetAdminPassword(newPassword) {
  const prisma = database.getClient();

  try {
    await database.connect();

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email: config.admin.email },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date(),
      }
    });

    logger.info('✅ Admin password reset successfully');
    
  } catch (error) {
    logger.error('❌ Admin password reset failed:', error);
    throw error;
  } finally {
    await database.disconnect();
  }
}

// CLI usage
if (require.main === module) {
  const command = process.argv[2];
  const arg = process.argv[3];

  switch (command) {
    case 'seed':
      seedAdmin()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    case 'reset-password':
      if (!arg) {
        console.error('Please provide new password: node seedAdmin.js reset-password <new-password>');
        process.exit(1);
      }
      
      resetAdminPassword(arg)
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
      break;
      
    default:
      console.log('Usage:');
      console.log('  node seedAdmin.js seed                    - Create admin user and default plans');
      console.log('  node seedAdmin.js reset-password <pass>   - Reset admin password');
      process.exit(1);
  }
}

module.exports = {
  seedAdmin,
  resetAdminPassword,
};