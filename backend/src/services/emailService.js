const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    if (!config.email.user || !config.email.pass) {
      logger.warn('Email configuration missing, emails will not be sent');
      return;
    }

    try {
      this.transporter = nodemailer.createTransporter({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.port === 465, // true for 465, false for other ports
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
        tls: {
          rejectUnauthorized: false, // Allow self-signed certificates
        },
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
    }
  }

  /**
   * Send email
   */
  async sendEmail(to, subject, html, text = null) {
    if (!this.transporter) {
      logger.warn('Email transporter not initialized, skipping email send');
      return { success: false, message: 'Email service not configured' };
    }

    try {
      const mailOptions = {
        from: config.email.from,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent successfully to ${to}:`, info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(user) {
    const subject = 'Welcome to CryptoHaven - Your Trading Journey Begins!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to CryptoHaven</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .highlight { background: #e8f2ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to CryptoHaven!</h1>
            <p>Your Smart Trading Platform</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name}!</h2>
            
            <p>Welcome to CryptoHaven, the most trusted platform for intelligent trading and investment growth.</p>
            
            <div class="highlight">
              <strong>Your Account Details:</strong><br>
              Email: ${user.email}<br>
              Referral Code: <strong>${user.referral_code}</strong><br>
              Account Balance: $0.00
            </div>
            
            <h3>What's Next?</h3>
            <ul>
              <li><strong>Make your first deposit</strong> - Start with as little as $10</li>
              <li><strong>Choose an investment plan</strong> - Starter, Professional, or Premium</li>
              <li><strong>Invite friends</strong> - Earn up to 20% commission on referrals</li>
              <li><strong>Track your progress</strong> - Monitor your investments in real-time</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${config.frontendUrl}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <h3>Need Help?</h3>
            <p>Our support team is available 24/7 to assist you. Contact us anytime!</p>
            
            <p>Thank you for joining CryptoHaven. Let's build your financial future together!</p>
            
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

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    const subject = 'Reset Your CryptoHaven Password';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
            <p>CryptoHaven Security</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            
            <p>We received a request to reset your CryptoHaven account password.</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${resetUrl}</p>
            
            <div class="warning">
              <strong>Security Notice:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Never share this link with anyone</li>
              </ul>
            </div>
            
            <p>If you didn't request a password reset, please contact our support team immediately.</p>
            
            <p>Best regards,<br>The CryptoHaven Security Team</p>
          </div>
          <div class="footer">
            <p>&copy; 2024 CryptoHaven. All rights reserved.</p>
            <p>This email was sent to ${user.email}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send deposit notification email to user
   */
  async sendDepositNotificationEmail(user, deposit) {
    const subject = 'Deposit Received - Under Review';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Received</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .deposit-details { background: #e8f5e8; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Deposit Received!</h1>
            <p>Thank you for your deposit</p>
          </div>
          <div class="content">
            <h2>Hello ${user.name},</h2>
            
            <p>We have received your deposit and it's currently under review by our team.</p>
            
            <div class="deposit-details">
              <h3>Deposit Details:</h3>
              <p><strong>Amount:</strong> $${deposit.amount_usd}</p>
              <p><strong>Coin:</strong> ${deposit.coin}</p>
              <p><strong>Chain:</strong> ${deposit.chain}</p>
              <p><strong>Transaction ID:</strong> ${deposit.txid}</p>
              <p><strong>Status:</strong> Pending Review</p>
            </div>
            
            <p>Our team typically reviews deposits within 24 hours. You'll receive another email once your deposit is approved and credited to your account.</p>
            
            <div style="text-align: center;">
              <a href="${config.frontendUrl}/dashboard" class="button">View Dashboard</a>
            </div>
            
            <p>Thank you for choosing CryptoHaven!</p>
            
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

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Send deposit approval email
   */
  async sendDepositApprovalEmail(user, deposit) {
    const subject = 'Deposit Approved - Funds Added to Your Account!';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Deposit Approved</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
          .success-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Deposit Approved!</h1>
            <p>Your funds have been added</p>
          </div>
          <div class="content">
            <h2>Congratulations ${user.name}!</h2>
            
            <div class="success-box">
              <h3>✅ Deposit Successfully Approved</h3>
              <p><strong>Amount Added:</strong> $${deposit.amount_usd}</p>
              <p><strong>Transaction ID:</strong> ${deposit.txid}</p>
              <p><strong>New Balance:</strong> $${user.balance_usd}</p>
            </div>
            
            <p>Your deposit has been approved and the funds have been added to your CryptoHaven account. You can now:</p>
            
            <ul>
              <li>Invest in our profitable trading plans</li>
              <li>Start earning daily returns</li>
              <li>Refer friends to earn commissions</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${config.frontendUrl}/dashboard" class="button">Start Trading Now</a>
            </div>
            
            <p>Thank you for trusting CryptoHaven with your investment!</p>
            
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

    return await this.sendEmail(user.email, subject, html);
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration() {
    if (!this.transporter) {
      return { success: false, message: 'Email transporter not initialized' };
    }

    try {
      await this.transporter.verify();
      logger.info('Email configuration test successful');
      return { success: true, message: 'Email configuration is valid' };
    } catch (error) {
      logger.error('Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create singleton instance
const emailService = new EmailService();

module.exports = emailService;