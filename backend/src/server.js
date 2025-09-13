require('dotenv').config();
require('express-async-errors');

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const config = require('./config/config');
const logger = require('./config/logger');
const database = require('./config/database');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const authRoutes = require('./routes/auth');
const depositRoutes = require('./routes/deposits');
const withdrawalRoutes = require('./routes/withdrawals');
const investmentRoutes = require('./routes/investments');
const referralRoutes = require('./routes/referrals');
const adminRoutes = require('./routes/admin');
const fakeTransactionRoutes = require('./routes/fakeTransactions');

const app = express();

/**
 * Trust proxy for rate limiting and IP detection
 */
app.set('trust proxy', 1);

/**
 * Security middleware
 */
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

/**
 * CORS configuration
 */
app.use(cors({
  origin: [
    config.frontendUrl,
    'http://localhost:3000',
    'http://localhost:3001',
    /^https:\/\/.*\.vercel\.app$/,
    /^https:\/\/.*\.netlify\.app$/,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

/**
 * Body parsing middleware
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

/**
 * Request logging middleware
 */
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
  });
  next();
});

/**
 * Rate limiting
 */
app.use('/api/', generalLimiter);

/**
 * Health check endpoint
 */
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await database.healthCheck();
    
    res.json({
      success: true,
      message: 'Server is healthy',
      data: {
        server: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          environment: config.nodeEnv,
          version: '1.0.0',
        },
        database: dbHealth,
      },
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      success: false,
      message: 'Service unavailable',
      data: {
        server: {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
        },
        database: {
          status: 'unhealthy',
          error: error.message,
        },
      },
    });
  }
});

/**
 * API info endpoint
 */
app.get('/api/', (req, res) => {
  res.json({
    success: true,
    message: 'CryptoHaven Backend API',
    data: {
      name: 'CryptoHaven Backend',
      version: '1.0.0',
      description: 'Secure crypto trading platform backend',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/api/health',
        docs: '/api/docs',
        // Will add more endpoints in next phases
      },
    },
  });
});

/**
 * API Routes
 */
app.use('/api/auth', authRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/referrals', referralRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/fake-transactions', fakeTransactionRoutes);

/**
 * Swagger documentation (will be implemented in later phases)
 */
// const swaggerUi = require('swagger-ui-express');
// const swaggerSpec = require('./config/swagger');
// app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * 404 handler
 */
app.use(notFound);

/**
 * Global error handler
 */
app.use(errorHandler);

/**
 * Start server
 */
const startServer = async () => {
  try {
    // Connect to database
    await database.connect();
    
    // Start server
    const server = app.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 CryptoHaven Backend Server started successfully!`);
      logger.info(`🌍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 Server URL: ${config.apiBaseUrl}`);
      logger.info(`📊 Health Check: ${config.apiBaseUrl}/api/health`);
      logger.info(`📚 API Docs: ${config.apiBaseUrl}/api/docs (coming soon)`);
      logger.info(`⚡ Ready to accept connections!`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await database.disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

module.exports = app;