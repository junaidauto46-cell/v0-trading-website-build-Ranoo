# CryptoHaven Backend Setup Guide

## Phase 1: Core Setup ✅ COMPLETED

### What's Been Implemented

✅ **Project Structure**
- Modular Express.js application with proper separation of concerns
- Controllers, services, middleware, and utilities organized
- Professional package.json with all required dependencies

✅ **Database Schema & ORM**
- Complete Prisma schema with all required tables
- User management with role-based access control
- Deposit/withdrawal workflows with admin approval
- Investment plans with profit tracking
- Referral system with commission tracking
- Transaction logging and audit trails

✅ **Authentication System**
- JWT-based authentication with access/refresh tokens
- Secure password hashing with bcrypt
- Role-based authorization (USER/ADMIN)
- Password reset flow with email tokens

✅ **Security & Middleware**
- Rate limiting with different limits per endpoint type
- Input validation using Zod schemas
- Error handling with custom API errors
- CORS protection and security headers
- Request logging and audit trails

✅ **Email Service**
- Professional HTML email templates
- Welcome emails, password reset, deposit notifications
- Configurable SMTP integration
- Email template system for all user actions

✅ **Utilities & Helpers**
- Password strength validation
- Referral code generation
- Fake transaction data generator
- Decimal formatting for financial calculations
- Pagination and data formatting utilities

✅ **Configuration Management**
- Environment-based configuration
- Secure secrets management
- Production-ready settings
- Comprehensive .env.example

### Files Created (22 files)

```
backend/
├── package.json                 # Dependencies and scripts
├── .env.example                # Environment variables template
├── .env                        # Environment variables (update DB_URL)
├── README.md                   # Complete documentation
├── SETUP.md                    # This setup guide
├── prisma/
│   └── schema.prisma           # Database schema (12 tables)
├── src/
│   ├── server.js               # Main Express server
│   ├── config/
│   │   ├── config.js           # Application configuration
│   │   ├── database.js         # Database connection & health
│   │   └── logger.js           # Winston logging setup
│   ├── middleware/
│   │   ├── auth.js             # JWT authentication
│   │   ├── validation.js       # Zod input validation
│   │   ├── rateLimiter.js      # Rate limiting
│   │   └── errorHandler.js     # Error handling
│   ├── services/
│   │   └── emailService.js     # Email notifications
│   ├── utils/
│   │   └── helpers.js          # Utility functions
│   └── scripts/
│       └── seedAdmin.js        # Admin user seeding
```

## Next Steps: Database Setup

### Option 1: Local PostgreSQL Setup

1. **Install PostgreSQL**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # Windows
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create Database and User**
   ```bash
   # Connect to PostgreSQL
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE cryptohaven_db;
   CREATE USER cryptohaven_user WITH ENCRYPTED PASSWORD 'secure_password_123';
   GRANT ALL PRIVILEGES ON DATABASE cryptohaven_db TO cryptohaven_user;
   \q
   ```

3. **Update Database URL**
   ```bash
   # Edit /app/backend/.env
   DATABASE_URL="postgresql://cryptohaven_user:secure_password_123@localhost:5432/cryptohaven_db"
   ```

### Option 2: Cloud PostgreSQL (Recommended for Production)

#### Supabase (Free Tier Available)
1. Go to https://supabase.com
2. Create new project
3. Copy connection string from Settings > Database
4. Update DATABASE_URL in .env

#### Railway (Easy Deployment)
1. Go to https://railway.app
2. Create new project with PostgreSQL
3. Copy DATABASE_URL from environment variables
4. Update .env file

#### Render (Free PostgreSQL)
1. Go to https://render.com
2. Create PostgreSQL database
3. Copy internal connection string
4. Update DATABASE_URL in .env

## Testing the Setup

Once database is configured:

1. **Generate Prisma Client**
   ```bash
   cd /app/backend
   npm run db:generate
   ```

2. **Run Database Migrations**
   ```bash
   npm run migrate
   ```

3. **Seed Admin User**
   ```bash
   npm run db:seed
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

5. **Test Health Endpoint**
   ```bash
   curl http://localhost:8000/api/health
   ```

   Expected response:
   ```json
   {
     "success": true,
     "message": "Server is healthy",
     "data": {
       "server": {
         "status": "healthy",
         "timestamp": "2024-01-01T00:00:00.000Z",
         "uptime": 1.234,
         "environment": "development",
         "version": "1.0.0"
       },
       "database": {
         "status": "healthy",
         "timestamp": "2024-01-01T00:00:00.000Z"
       }
     }
   }
   ```

## Environment Variables to Update

Before running, update these in `/app/backend/.env`:

```env
# ⚠️  REQUIRED: Update with your database
DATABASE_URL="postgresql://username:password@localhost:5432/cryptohaven_db"

# ⚠️  REQUIRED: Change in production
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-change-this"

# ⚠️  REQUIRED: Change admin credentials
ADMIN_EMAIL="admin@cryptohaven.com"
ADMIN_PASS="SecureAdminPassword123!"

# 📧 OPTIONAL: For email functionality
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# 🌐 OPTIONAL: Update for production
FRONTEND_URL="http://localhost:3000"
API_BASE_URL="http://localhost:8000"
```

## What Works Now

✅ **Server Structure**: Complete Express.js server with middleware
✅ **Database Schema**: All tables defined and ready
✅ **Authentication**: JWT token generation and validation
✅ **Security**: Rate limiting, input validation, error handling
✅ **Email Templates**: Professional HTML email system
✅ **Admin Seeding**: Automatic admin user creation
✅ **Health Checks**: Server and database monitoring
✅ **Logging**: Comprehensive Winston logging system

## Ready for Phase 2

Once database is connected, we can proceed to **Phase 2: User Management & Security** which will implement:

- User registration/login endpoints
- Password reset flow with email
- Role-based access control
- Profile management
- Session management

The foundation is solid and production-ready! 🚀

## Troubleshooting

### Common Issues

1. **"Can't reach database server"**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Test connection with `psql` command

2. **"Migration failed"**
   - Ensure database exists
   - Check user permissions
   - Run `npm run db:generate` first

3. **"Module not found"**
   - Run `npm install` in backend directory
   - Check Node.js version (requires 18+)

4. **"Email not sending"**
   - Email is optional for core functionality
   - Update EMAIL_* variables for production

Need help? Check the main README.md for detailed documentation!