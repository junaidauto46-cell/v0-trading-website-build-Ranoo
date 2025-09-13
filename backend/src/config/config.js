require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 8000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:8000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',

  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT Configuration
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },

  // Admin Configuration
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@cryptohaven.com',
    password: process.env.ADMIN_PASS || 'SecureAdminPassword123!',
  },

  // Email Configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    from: process.env.EMAIL_FROM || 'CryptoHaven <noreply@cryptohaven.com>',
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  },

  // Business Logic Configuration
  business: {
    referralCommissionRate: parseFloat(process.env.REFERRAL_COMMISSION_RATE) || 0.15,
    minWithdrawalUsd: parseFloat(process.env.MIN_WITHDRAWAL_USD) || 10,
    minReferralsForWithdrawal: parseInt(process.env.MIN_REFERRALS_FOR_WITHDRAWAL) || 2,
  },

  // Deposit Addresses
  depositAddresses: {
    usdtErc20: process.env.DEPOSIT_ADDRESS_USDT_ERC20 || '0x6646D5aC236d940e033CFb1C61Ca2f30B5A1B453',
    usdtTrc20: process.env.DEPOSIT_ADDRESS_USDT_TRC20 || 'TAy9roPsbyWPxYUN56iEWpQ4bfqtUtfG7L',
  },

  // Background Job Configuration
  jobs: {
    profitJobEnabled: process.env.PROFIT_JOB_ENABLED === 'true',
    profitJobTimezone: process.env.PROFIT_JOB_TIMEZONE || 'UTC',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
  },
};

// Validation
const requiredEnvVars = ['DATABASE_URL'];

if (config.nodeEnv === 'production') {
  requiredEnvVars.push(
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ADMIN_EMAIL',
    'ADMIN_PASS'
  );
}

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
  process.exit(1);
}

module.exports = config;