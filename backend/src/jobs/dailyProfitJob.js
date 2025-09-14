const database = require('../config/database');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const { decimalToNumber } = require('../utils/helpers');

class DailyProfitJob {
  constructor() {
    this.jobName = 'DailyProfitCalculation';
    this.isRunning = false;
  }

  /**
   * Main profit calculation job
   */
  async execute() {
    if (this.isRunning) {
      logger.warn('Daily profit job is already running, skipping...');
      return { success: false, message: 'Job already running' };
    }

    this.isRunning = true;
    const startTime = new Date();
    
    logger.info(`🚀 Starting daily profit calculation job at ${startTime.toISOString()}`);

    const prisma = database.getClient();
    let results = {
      totalInvestments: 0,
      processedInvestments: 0,
      completedInvestments: 0,
      totalProfitDistributed: 0,
      errors: [],
      emailsSent: 0,
    };

    try {
      // Get all active investments
      const activeInvestments = await prisma.activeInvestment.findMany({
        where: {
          status: 'ACTIVE',
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              balance_usd: true,
            }
          },
          plan: {
            select: {
              name: true,
              daily_percentage: true,
              duration_days: true,
            }
          }
        }
      });

      results.totalInvestments = activeInvestments.length;
      logger.info(`Found ${activeInvestments.length} active investments to process`);

      for (const investment of activeInvestments) {
        try {
          const result = await this.processInvestment(investment, prisma);
          
          if (result.success) {
            results.processedInvestments++;
            results.totalProfitDistributed += result.profitAmount || 0;
            
            if (result.completed) {
              results.completedInvestments++;
            }

            if (result.emailSent) {
              results.emailsSent++;
            }
          } else {
            results.errors.push({
              investmentId: investment.id,
              userId: investment.user_id,
              error: result.error
            });
          }
        } catch (error) {
          logger.error(`Error processing investment ${investment.id}:`, error);
          results.errors.push({
            investmentId: investment.id,
            userId: investment.user_id,
            error: error.message
          });
        }
      }

      const endTime = new Date();
      const duration = endTime - startTime;

      logger.info(`✅ Daily profit job completed in ${duration}ms`, {
        ...results,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${duration}ms`
      });

      return {
        success: true,
        message: 'Daily profit calculation completed successfully',
        results,
        duration
      };

    } catch (error) {
      logger.error('❌ Daily profit job failed:', error);
      return {
        success: false,
        message: 'Daily profit calculation failed',
        error: error.message,
        results
      };
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Process individual investment
   */
  async processInvestment(investment, prisma) {
    try {
      const now = new Date();
      const startDate = new Date(investment.start_date);
      const endDate = new Date(investment.end_date);
      
      // Check if investment has ended
      if (now > endDate) {
        return await this.completeInvestment(investment, prisma);
      }

      // Calculate days elapsed since last profit calculation
      // For simplicity, we'll calculate profit for each day
      const daysElapsed = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
      
      if (daysElapsed < 1) {
        // Investment started today, no profit yet
        return { success: true, message: 'Investment too recent for profit' };
      }

      // Calculate total expected profit so far
      const expectedTotalProfit = (parseFloat(investment.amount_usd) * parseFloat(investment.daily_percent) * daysElapsed) / 100;
      const alreadyEarned = parseFloat(investment.total_earned);
      const newProfit = expectedTotalProfit - alreadyEarned;

      if (newProfit <= 0) {
        // No new profit to distribute
        return { success: true, message: 'No new profit to distribute' };
      }

      // Use transaction to ensure consistency
      const result = await prisma.$transaction(async (tx) => {
        // Update user balance
        const updatedUser = await tx.user.update({
          where: { id: investment.user_id },
          data: {
            balance_usd: {
              increment: newProfit
            }
          }
        });

        // Update investment total earned
        const updatedInvestment = await tx.activeInvestment.update({
          where: { id: investment.id },
          data: {
            total_earned: {
              increment: newProfit
            },
            updated_at: now
          }
        });

        // Create transaction record
        await tx.transaction.create({
          data: {
            user_id: investment.user_id,
            type: 'PROFIT',
            amount_usd: newProfit,
            description: `Daily profit from ${investment.plan.name} investment - ${investment.daily_percent}% daily return`,
          }
        });

        return {
          updatedUser,
          updatedInvestment,
          profitAmount: newProfit
        };
      });

      // Send profit notification email (don't fail job if email fails)
      let emailSent = false;
      try {
        await this.sendProfitNotificationEmail(investment.user, {
          planName: investment.plan.name,
          profitAmount: newProfit,
          newBalance: parseFloat(result.updatedUser.balance_usd),
          daysElapsed,
          totalEarned: parseFloat(result.updatedInvestment.total_earned)
        });
        emailSent = true;
      } catch (emailError) {
        logger.warn(`Failed to send profit notification email to ${investment.user.email}:`, emailError);
      }

      logger.info(`💰 Profit distributed: $${newProfit} to user ${investment.user.email}`, {
        investmentId: investment.id,
        userId: investment.user_id,
        profitAmount: newProfit,
        daysElapsed,
        planName: investment.plan.name
      });

      return {
        success: true,
        profitAmount: newProfit,
        emailSent,
        message: 'Profit calculated and distributed successfully'
      };

    } catch (error) {
      logger.error(`Error processing investment ${investment.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Complete investment when it reaches end date
   */
  async completeInvestment(investment, prisma) {
    try {
      const now = new Date();
      
      // Calculate any remaining profit
      const totalExpectedProfit = (parseFloat(investment.amount_usd) * parseFloat(investment.daily_percent) * investment.plan.duration_days) / 100;
      const alreadyEarned = parseFloat(investment.total_earned);
      const remainingProfit = Math.max(0, totalExpectedProfit - alreadyEarned);

      const result = await prisma.$transaction(async (tx) => {
        // Add any remaining profit to user balance
        let updatedUser = null;
        if (remainingProfit > 0) {
          updatedUser = await tx.user.update({
            where: { id: investment.user_id },
            data: {
              balance_usd: {
                increment: remainingProfit
              }
            }
          });

          // Create final profit transaction
          await tx.transaction.create({
            data: {
              user_id: investment.user_id,
              type: 'PROFIT',
              amount_usd: remainingProfit,
              description: `Final profit from completed ${investment.plan.name} investment`,
            }
          });
        }

        // Mark investment as completed
        const completedInvestment = await tx.activeInvestment.update({
          where: { id: investment.id },
          data: {
            status: 'COMPLETED',
            total_earned: totalExpectedProfit,
            updated_at: now
          }
        });

        // Create completion transaction
        await tx.transaction.create({
          data: {
            user_id: investment.user_id,
            type: 'INVESTMENT',
            amount_usd: 0,
            description: `Investment completed: ${investment.plan.name} - Total earned $${totalExpectedProfit}`,
          }
        });

        return {
          updatedUser,
          completedInvestment,
          remainingProfit
        };
      });

      // Send completion notification email
      let emailSent = false;
      try {
        await this.sendInvestmentCompletionEmail(investment.user, {
          planName: investment.plan.name,
          originalAmount: parseFloat(investment.amount_usd),
          totalEarned: totalExpectedProfit,
          finalProfit: remainingProfit,
          duration: investment.plan.duration_days,
          newBalance: result.updatedUser ? parseFloat(result.updatedUser.balance_usd) : parseFloat(investment.user.balance_usd)
        });
        emailSent = true;
      } catch (emailError) {
        logger.warn(`Failed to send completion email to ${investment.user.email}:`, emailError);
      }

      logger.info(`🎯 Investment completed: ${investment.id} for user ${investment.user.email}`, {
        investmentId: investment.id,
        userId: investment.user_id,
        totalEarned: totalExpectedProfit,
        remainingProfit,
        planName: investment.plan.name
      });

      return {
        success: true,
        completed: true,
        profitAmount: remainingProfit,
        emailSent,
        message: 'Investment completed successfully'
      };

    } catch (error) {
      logger.error(`Error completing investment ${investment.id}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Send profit notification email
   */
  async sendProfitNotificationEmail(user, profitData) {
    const subject = `💰 Daily Profit Credited - $${profitData.profitAmount.toFixed(2)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Profit Credited</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .profit-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .stats { display: flex; justify-content: space-between; margin: 20px 0; }
          .stat { text-align: center; flex: 1; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 Daily Profit Credited!</h1>
            <p>Your investment is generating returns</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            
            <div class="profit-box">
              <h3 style="margin: 0; font-size: 24px;">$${profitData.profitAmount.toFixed(2)}</h3>
              <p style="margin: 5px 0; color: #155724;">Profit Added to Your Account</p>
            </div>
            
            <h3>Investment Details:</h3>
            <div class="stats">
              <div class="stat">
                <strong>Plan</strong><br>
                ${profitData.planName}
              </div>
              <div class="stat">
                <strong>Days Active</strong><br>
                ${profitData.daysElapsed}
              </div>
              <div class="stat">
                <strong>Total Earned</strong><br>
                $${profitData.totalEarned.toFixed(2)}
              </div>
            </div>
            
            <p><strong>New Account Balance:</strong> $${profitData.newBalance.toFixed(2)}</p>
            
            <p>Your investment continues to generate daily returns. Keep watching your balance grow!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Dashboard
              </a>
            </div>
            
            <p>Thank you for investing with CryptoHaven!</p>
            
            <p>Best regards,<br>The CryptoHaven Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CryptoHaven. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await emailService.sendEmail(user.email, subject, html);
  }

  /**
   * Send investment completion email
   */
  async sendInvestmentCompletionEmail(user, completionData) {
    const subject = `🎯 Investment Completed - Total Earned $${completionData.totalEarned.toFixed(2)}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Investment Completed</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #007bff 0%, #6610f2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .completion-box { background: #d1ecf1; border: 1px solid #bee5eb; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center; }
          .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
          .stat { text-align: center; background: white; padding: 15px; border-radius: 5px; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 Investment Completed!</h1>
            <p>Congratulations on your successful investment</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            
            <div class="completion-box">
              <h3 style="margin: 0; font-size: 28px; color: #0c5460;">$${completionData.totalEarned.toFixed(2)}</h3>
              <p style="margin: 5px 0;">Total Profit Earned</p>
            </div>
            
            <h3>Investment Summary:</h3>
            <div class="stats">
              <div class="stat">
                <strong>Plan</strong><br>
                ${completionData.planName}
              </div>
              <div class="stat">
                <strong>Duration</strong><br>
                ${completionData.duration} days
              </div>
              <div class="stat">
                <strong>Original Investment</strong><br>
                $${completionData.originalAmount.toFixed(2)}
              </div>
              <div class="stat">
                <strong>Final Profit</strong><br>
                $${completionData.finalProfit.toFixed(2)}
              </div>
            </div>
            
            <p><strong>Current Account Balance:</strong> $${completionData.newBalance.toFixed(2)}</p>
            
            <p>🎉 Your investment has successfully completed its term! All profits have been credited to your account and are available for withdrawal or reinvestment.</p>
            
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>What's Next?</strong></p>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Reinvest your profits in a new plan</li>
                <li>Withdraw your earnings</li>
                <li>Refer friends to earn commission</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                View Dashboard
              </a>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/investments" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                New Investment
              </a>
            </div>
            
            <p>Thank you for choosing CryptoHaven for your investment needs!</p>
            
            <p>Best regards,<br>The CryptoHaven Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CryptoHaven. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await emailService.sendEmail(user.email, subject, html);
  }

  /**
   * Get job status
   */
  getStatus() {
    return {
      jobName: this.jobName,
      isRunning: this.isRunning,
      lastRun: this.lastRun || null,
    };
  }
}

module.exports = new DailyProfitJob();