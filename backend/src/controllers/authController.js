const bcrypt = require('bcryptjs');
const database = require('../config/database');
const logger = require('../config/logger');
const emailService = require('../services/emailService');
const { generateTokens } = require('../middleware/auth');
const { generateReferralCode, generateSecureToken, hashPassword, comparePassword, decimalToNumber } = require('../utils/helpers');
const { createError } = require('../middleware/errorHandler');

/**
 * User Registration
 */
const register = async (req, res) => {
  const { name, email, password, referralCode } = req.body;
  const prisma = database.getClient();

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        messageKey: 'auth.user_exists'
      });
    }

    // Validate referral code if provided
    let referrer = null;
    if (referralCode) {
      referrer = await prisma.user.findUnique({
        where: { referral_code: referralCode.toUpperCase() }
      });

      if (!referrer) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code',
          messageKey: 'auth.invalid_referral_code'
        });
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Generate unique referral code
    let newReferralCode;
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 10) {
      newReferralCode = generateReferralCode();
      const existing = await prisma.user.findUnique({
        where: { referral_code: newReferralCode }
      });
      
      if (!existing) {
        isUnique = true;
      }
      attempts++;
    }

    if (!isUnique) {
      throw createError(500, 'Failed to generate unique referral code', 'auth.referral_generation_failed');
    }

    // Create user
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        referral_code: newReferralCode,
        referred_by: referrer ? referrer.referral_code : null,
        balance_usd: 0,
        wallet_addresses: {},
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance_usd: true,
        referral_code: true,
        created_at: true,
      }
    });

    // Create welcome transaction
    await prisma.transaction.create({
      data: {
        user_id: newUser.id,
        type: 'ADMIN_ADJUSTMENT',
        amount_usd: 0,
        description: 'Welcome to CryptoHaven! Account created successfully.',
      }
    });

    // Generate tokens
    const tokens = generateTokens(newUser);

    // Send welcome email (don't fail registration if email fails)
    try {
      await emailService.sendWelcomeEmail(newUser);
    } catch (emailError) {
      logger.warn('Failed to send welcome email:', emailError);
    }

    logger.info(`New user registered: ${newUser.email}`, {
      userId: newUser.id,
      referredBy: referrer?.referral_code,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      messageKey: 'auth.registration_success',
      data: {
        user: decimalToNumber(newUser),
        ...tokens,
      }
    });

  } catch (error) {
    logger.error('Registration error:', error);
    throw error;
  }
};

/**
 * User Login
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const prisma = database.getClient();

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: {
        id: true,
        name: true,
        email: true,
        password_hash: true,
        role: true,
        balance_usd: true,
        referral_code: true,
        created_at: true,
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        messageKey: 'auth.invalid_credentials'
      });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      logger.warn(`Failed login attempt for: ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        messageKey: 'auth.invalid_credentials'
      });
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${user.email}`, { userId: user.id });

    res.json({
      success: true,
      message: 'Login successful',
      messageKey: 'auth.login_success',
      data: {
        user: decimalToNumber(userWithoutPassword),
        ...tokens,
      }
    });

  } catch (error) {
    logger.error('Login error:', error);
    throw error;
  }
};

/**
 * Forgot Password
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  const prisma = database.getClient();

  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      // Don't reveal if email exists or not
      return res.json({
        success: true,
        message: 'If this email exists, you will receive password reset instructions',
        messageKey: 'auth.password_reset_sent'
      });
    }

    // Generate reset token
    const resetToken = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save reset token
    await prisma.passwordResetToken.create({
      data: {
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt,
      }
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
    } catch (emailError) {
      logger.error('Failed to send password reset email:', emailError);
      throw createError(500, 'Failed to send password reset email', 'auth.email_send_failed');
    }

    logger.info(`Password reset requested for: ${user.email}`, { userId: user.id });

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      messageKey: 'auth.password_reset_sent'
    });

  } catch (error) {
    logger.error('Forgot password error:', error);
    throw error;
  }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  const prisma = database.getClient();

  try {
    // Find valid token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false,
        expires_at: {
          gt: new Date()
        }
      },
      include: {
        user: true
      }
    });

    if (!resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        messageKey: 'auth.invalid_reset_token'
      });
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.user.id },
        data: { password_hash: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true }
      })
    ]);

    logger.info(`Password reset completed for: ${resetToken.user.email}`, { 
      userId: resetToken.user.id 
    });

    res.json({
      success: true,
      message: 'Password reset successful',
      messageKey: 'auth.password_reset_success'
    });

  } catch (error) {
    logger.error('Reset password error:', error);
    throw error;
  }
};

/**
 * Get User Profile
 */
const getProfile = async (req, res) => {
  const prisma = database.getClient();

  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance_usd: true,
        referral_code: true,
        referred_by: true,
        wallet_addresses: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!user) {
      throw createError(404, 'User not found', 'user.not_found');
    }

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      messageKey: 'user.profile_retrieved',
      data: {
        user: decimalToNumber(user)
      }
    });

  } catch (error) {
    logger.error('Get profile error:', error);
    throw error;
  }
};

/**
 * Update User Profile
 */
const updateProfile = async (req, res) => {
  const { name, wallet_addresses } = req.body;
  const prisma = database.getClient();

  try {
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        ...(name && { name: name.trim() }),
        ...(wallet_addresses && { wallet_addresses }),
        updated_at: new Date(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        balance_usd: true,
        referral_code: true,
        referred_by: true,
        wallet_addresses: true,
        created_at: true,
        updated_at: true,
      }
    });

    logger.info(`Profile updated for user: ${updatedUser.email}`, { 
      userId: updatedUser.id 
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      messageKey: 'user.profile_updated',
      data: {
        user: decimalToNumber(updatedUser)
      }
    });

  } catch (error) {
    logger.error('Update profile error:', error);
    throw error;
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
};