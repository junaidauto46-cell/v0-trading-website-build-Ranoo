const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config/config');

/**
 * Generate a unique referral code
 */
const generateReferralCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = 'REF';
  
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Generate a secure random token
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash password using bcrypt
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, config.security.bcryptRounds);
};

/**
 * Compare password with hash
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate random amount within range
 */
const generateRandomAmount = (min, max, decimals = 2) => {
  const amount = Math.random() * (max - min) + min;
  return parseFloat(amount.toFixed(decimals));
};

/**
 * Generate random timestamp within range
 */
const generateRandomTimestamp = (hoursBack = 12) => {
  const now = new Date();
  const maxBack = hoursBack * 60 * 60 * 1000; // Convert hours to milliseconds
  const randomBack = Math.random() * maxBack;
  return new Date(now.getTime() - randomBack);
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, currency = 'USD', locale = 'en-US') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Format decimal for database storage
 */
const formatDecimal = (value, precision = 2) => {
  return parseFloat(parseFloat(value).toFixed(precision));
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength
 */
const isValidPassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

/**
 * Sanitize user input
 */
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 1000); // Limit length
};

/**
 * Calculate days between two dates
 */
const daysBetween = (date1, date2) => {
  const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
  return Math.round(Math.abs((date1 - date2) / oneDay));
};

/**
 * Check if date is in the future
 */
const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

/**
 * Add days to a date
 */
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Generate pagination metadata
 */
const generatePaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    totalItems,
    totalPages,
    currentPage: page,
    itemsPerPage: limit,
    hasNextPage,
    hasPrevPage,
    nextPage: hasNextPage ? page + 1 : null,
    prevPage: hasPrevPage ? page - 1 : null,
  };
};

/**
 * Mask sensitive data
 */
const maskEmail = (email) => {
  const [username, domain] = email.split('@');
  if (username.length <= 2) return email;
  
  const maskedUsername = username[0] + '*'.repeat(username.length - 2) + username[username.length - 1];
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask wallet address
 */
const maskWallet = (wallet) => {
  if (wallet.length <= 8) return wallet;
  
  return wallet.substring(0, 6) + '...' + wallet.substring(wallet.length - 4);
};

/**
 * Generate fake transaction data
 */
const generateFakeTransaction = () => {
  const names = [
    // English names
    'James Smith', 'Mary Johnson', 'Robert Brown', 'Patricia Davis', 'John Miller',
    'Jennifer Wilson', 'Michael Moore', 'Linda Taylor', 'William Anderson', 'Elizabeth Thomas',
    'David Jackson', 'Barbara White', 'Richard Harris', 'Susan Martin', 'Joseph Thompson',
    'Jessica Garcia', 'Thomas Martinez', 'Sarah Robinson', 'Christopher Clark', 'Karen Rodriguez',
    'Charles Lewis', 'Nancy Lee', 'Daniel Walker', 'Lisa Hall', 'Matthew Allen', 'Helen Young',
    'Anthony Hernandez', 'Sandra King', 'Mark Wright', 'Donna Lopez',
    
    // Pakistani Roman-Urdu names
    'Ahmed Ali', 'Fatima Khan', 'Muhammad Hassan', 'Ayesha Sheikh', 'Ali Raza',
    'Zainab Ahmad', 'Hassan Malik', 'Saira Bhatti', 'Usman Qureshi', 'Mariam Siddique',
    'Omar Farooq', 'Hina Nawaz', 'Bilal Shah', 'Noor Fatima', 'Imran Baig',
    'Sana Riaz', 'Tariq Mahmood', 'Rabia Iqbal', 'Shahid Hussain', 'Faiza Chaudhry',
    'Adnan Butt', 'Samina Khatoon', 'Waseem Akram', 'Lubna Malik', 'Kamran Ali',
    'Shazia Parvez', 'Faisal Ahmad', 'Rubina Sultana', 'Junaid Javed', 'Bushra Nasir'
  ];

  const types = ['deposit', 'withdraw'];
  const coins = ['USDT', 'BTC', 'ETH'];
  
  const name = names[Math.floor(Math.random() * names.length)];
  const type = types[Math.floor(Math.random() * types.length)];
  const coin = coins[Math.floor(Math.random() * coins.length)];
  
  let amount;
  if (coin === 'BTC') {
    amount = generateRandomAmount(0.001, 0.5, 4);
  } else if (coin === 'ETH') {
    amount = generateRandomAmount(0.01, 10, 3);
  } else { // USDT
    amount = generateRandomAmount(10, 5000, 2);
  }

  // Generate timestamp within last 12 hours
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - (12 * 60 * 60 * 1000));
  const randomTime = new Date(twelveHoursAgo.getTime() + Math.random() * (now.getTime() - twelveHoursAgo.getTime()));

  return {
    name,
    type,
    coin,
    amount,
    timestamp: randomTime.toISOString(),
  };
};

/**
 * Convert Decimal to number for JSON serialization
 */
const decimalToNumber = (obj) => {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'object' && obj.constructor && obj.constructor.name === 'Decimal') {
    return parseFloat(obj.toString());
  }
  
  if (Array.isArray(obj)) {
    return obj.map(decimalToNumber);
  }
  
  if (typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      result[key] = decimalToNumber(obj[key]);
    }
    return result;
  }
  
  return obj;
};

/**
 * Sleep function for delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateReferralCode,
  generateSecureToken,
  hashPassword,
  comparePassword,
  generateRandomAmount,
  generateRandomTimestamp,
  formatCurrency,
  formatDecimal,
  isValidEmail,
  isValidPassword,
  sanitizeInput,
  daysBetween,
  isFutureDate,
  addDays,
  generatePaginationMeta,
  maskEmail,
  maskWallet,
  generateFakeTransaction,
  decimalToNumber,
  sleep,
};