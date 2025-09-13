# CryptoHaven Backend API

A secure, production-ready backend for the CryptoHaven crypto trading platform built with Node.js, Express, and PostgreSQL.

## 🚀 Features

- **Authentication & Authorization**: JWT-based auth with access/refresh tokens and role-based access control
- **User Management**: Complete user lifecycle with referral system
- **Deposit System**: Manual verification workflow with admin approval
- **Withdrawal System**: Admin approval required with referral requirements
- **Investment Plans**: Automated daily profit calculations
- **Admin Panel**: Comprehensive management dashboard
- **Security**: Rate limiting, input validation, password hashing, and audit logging
- **Email Service**: Automated notifications for all user actions
- **Fake Transactions API**: Simulated activity feed for frontend

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn
- SMTP email service (optional, for emails)

## 🛠️ Installation

1. **Clone and navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/cryptohaven_db"
   JWT_ACCESS_SECRET="your-super-secret-jwt-access-key"
   JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key"
   ADMIN_EMAIL="admin@cryptohaven.com"
   ADMIN_PASS="SecureAdminPassword123!"
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Run database migrations
   npm run migrate
   
   # Seed admin user and default investment plans
   npm run db:seed
   ```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Database Operations
```bash
# View database in Prisma Studio
npm run db:studio

# Reset admin password
node src/scripts/seedAdmin.js reset-password NewPassword123!

# Run daily profit job manually
npm run profit:job
```

## 📊 Health Check

Once running, verify the server health:
```bash
curl http://localhost:8000/api/health
```

## 🗄️ Database Schema

### Core Tables
- **users**: User accounts with roles, balances, and referral codes
- **deposits**: Deposit requests with admin approval workflow
- **withdrawals**: Withdrawal requests with referral requirements
- **investment_plans**: Trading plans with daily percentages
- **active_investments**: User investments with profit tracking
- **referral_commissions**: Commission tracking for referral system
- **transactions**: Complete transaction history
- **admin_logs**: Audit trail for admin actions

### Key Relationships
- Users have many deposits, withdrawals, and investments
- Deposits can generate referral commissions
- Investments are linked to plans and generate daily profits
- All financial operations are logged in transactions table

## 🔐 Authentication Flow

1. **Registration**: User registers with optional referral code
2. **Login**: Returns access token (15min) and refresh token (7 days)
3. **Protected Routes**: Require `Authorization: Bearer <access_token>`
4. **Token Refresh**: Use refresh token to get new access token
5. **Admin Routes**: Require admin role in JWT payload

## 💰 Business Logic

### Deposit Flow
1. User submits deposit with transaction ID
2. Admin reviews and approves/rejects
3. On approval: funds added, referrer gets 15% commission
4. Email notifications sent at each step

### Withdrawal Flow
1. User requests withdrawal (min $10)
2. System checks referral requirement (2 referrals with deposits)
3. Admin approves/rejects request
4. On approval: funds deducted, marked as paid

### Investment System
1. User invests from balance into selected plan
2. Daily profit calculation runs via background job
3. Profits automatically added to user balance
4. Investment completes after plan duration

### Referral System
1. Each user gets unique referral code on signup
2. New users can signup with referral code
3. When referee makes approved deposit, referrer gets 15% commission
4. Commissions are instantly added to referrer's balance

## 🛡️ Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Security**: Separate secrets for access/refresh tokens
- **Rate Limiting**: Different limits per endpoint type
- **Input Validation**: Zod schemas for all endpoints
- **CORS Protection**: Configurable allowed origins
- **Helmet**: Security headers for Express
- **Admin Logging**: All admin actions are logged
- **SQL Injection Protection**: Prisma ORM with parameterized queries

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/:id` - Get user by ID (admin)
- `DELETE /api/users/:id` - Delete user (admin)

### Deposits
- `POST /api/deposits` - Submit deposit request
- `GET /api/deposits` - Get user deposits
- `GET /api/admin/deposits` - Get all deposits (admin)
- `PUT /api/admin/deposits/:id/approve` - Approve deposit (admin)
- `PUT /api/admin/deposits/:id/reject` - Reject deposit (admin)

### Withdrawals
- `POST /api/withdrawals` - Request withdrawal
- `GET /api/withdrawals` - Get user withdrawals
- `GET /api/admin/withdrawals` - Get all withdrawals (admin)
- `PUT /api/admin/withdrawals/:id/approve` - Approve withdrawal (admin)

### Investments
- `GET /api/investments/plans` - Get investment plans
- `POST /api/investments` - Create investment
- `GET /api/investments` - Get user investments

### Admin Panel
- `GET /api/admin/dashboard` - Admin dashboard stats
- `PUT /api/admin/users/:id/adjust-balance` - Adjust user balance
- `GET /api/admin/export/users.csv` - Export users
- `GET /api/admin/export/transactions.csv` - Export transactions

### Misc
- `GET /api/fake-transactions` - Get fake activity feed
- `GET /api/health` - Health check
- `GET /api/docs` - API documentation (Swagger)

## 🎯 Rate Limits

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 attempts per 15 minutes
- **Password Reset**: 3 requests per hour
- **Financial Operations**: 10 requests per 5 minutes
- **Admin Operations**: 50 requests per minute

## 📧 Email Templates

The system includes responsive HTML email templates for:
- Welcome email on registration
- Password reset instructions
- Deposit received notification
- Deposit approval confirmation
- Withdrawal status updates

## 🔄 Background Jobs

### Daily Profit Calculation
- Runs daily to calculate investment profits
- Can be triggered manually or via cron job
- Updates user balances and creates transaction records
- Handles investment completion automatically

### Deployment Options

#### Option 1: Railway with PostgreSQL
```bash
# Deploy to Railway
railway login
railway init
railway add postgresql
railway deploy
```

#### Option 2: Render with PostgreSQL
1. Connect GitHub repository to Render
2. Add PostgreSQL database
3. Set environment variables
4. Deploy web service

#### Option 3: Vercel with Supabase
1. Deploy to Vercel
2. Connect Supabase PostgreSQL
3. Set up Edge Functions for background jobs
4. Configure environment variables

## 🔧 Environment Variables

### Required
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_ACCESS_SECRET`: Secret for access tokens
- `JWT_REFRESH_SECRET`: Secret for refresh tokens
- `ADMIN_EMAIL`: Initial admin email
- `ADMIN_PASS`: Initial admin password

### Optional
- `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`: SMTP configuration
- `FRONTEND_URL`: Frontend URL for CORS and email links
- `RATE_LIMIT_*`: Rate limiting configuration
- `PROFIT_JOB_ENABLED`: Enable/disable background jobs

## 🚨 Important Notes

1. **Change Default Secrets**: Update JWT secrets in production
2. **Database Security**: Use strong PostgreSQL credentials
3. **Admin Account**: Change default admin password after first login
4. **Email Service**: Configure SMTP for production email functionality
5. **Rate Limiting**: Adjust limits based on your traffic patterns
6. **Background Jobs**: Set up proper cron scheduling in production
7. **Monitoring**: Implement logging and monitoring in production
8. **Backup**: Set up regular database backups

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL format
   - Ensure database exists

2. **Migration Errors**
   - Run `npm run db:generate` first
   - Check database permissions
   - Verify Prisma schema syntax

3. **Admin Seeding Failed**
   - Check admin email/password format
   - Verify database connection
   - Run migrations first

4. **Email Not Sending**
   - Check SMTP credentials
   - Verify EMAIL_* environment variables
   - Test email configuration

## 📚 Development Guidelines

1. **Code Structure**: Follow MVC pattern with services layer
2. **Error Handling**: Use async/await with proper error catching
3. **Validation**: Validate all inputs with Zod schemas
4. **Logging**: Log important events and errors
5. **Testing**: Write unit tests for business logic
6. **Documentation**: Update API docs when adding endpoints

## 🔄 Version History

- **v1.0.0**: Initial release with core functionality
  - Authentication system
  - User management
  - Deposit/withdrawal workflows
  - Investment plans
  - Admin panel
  - Email notifications
  - Security features

## 📞 Support

For technical support or questions:
- Check the troubleshooting section
- Review server logs in `logs/` directory
- Verify environment configuration
- Test database connectivity

---

**⚠️ Security Notice**: This backend handles financial data. Always use HTTPS in production, implement proper monitoring, and follow security best practices.