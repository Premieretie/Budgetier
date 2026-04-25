const path = require('path');

// CRITICAL: Load dotenv FIRST before any other requires that use env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
}

const express = require('express');
const cors = require('cors');
const { query } = require('./config/database');
const { securityMiddleware, xssPrevention, preventNoSQLInjection } = require('./middleware/security');

// Route imports
const authRoutes = require('./routes/auth');
const incomeRoutes = require('./routes/income');
const expenseRoutes = require('./routes/expenses');
const goalRoutes = require('./routes/goals');
const budgetRoutes = require('./routes/budgets');
const categoryRoutes = require('./routes/categories');
const notificationRoutes = require('./routes/notifications');
const dashboardRoutes = require('./routes/dashboard');
const gamificationRoutes = require('./routes/gamification');
const subscriptionRoutes = require('./routes/subscriptions');
const cosmeticsRoutes = require('./routes/cosmetics');
const bankingRoutes = require('./routes/banking');
const syncScheduler = require('./services/syncScheduler');

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.budgetier.ink' 
  : `http://localhost:${PORT}`;

// Trust proxy for rate limiting behind proxy (Cloudflare/Render)
app.set('trust proxy', 1);

// CORS must be FIRST - before any routes
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'https://budgetier.ink', 'https://www.budgetier.ink']
  : ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware
const { authLimiter } = securityMiddleware(app);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security middleware
app.use(xssPrevention);
app.use(preventNoSQLInjection);

// Request logging in development
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/cosmetics', cosmeticsRoutes);
app.use('/api/banking', bankingRoutes);

// Root route - API info
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Budgetier API Server',
    version: '1.0.0',
    documentation: `${BASE_URL}/api/health`,
    endpoints: {
      health: '/api/health',
      test: '/api/test',
      dbTest: '/api/db-test',
      auth: '/api/auth',
      income: '/api/income',
      expenses: '/api/expenses',
      goals: '/api/goals',
      budgets: '/api/budgets',
      categories: '/api/categories',
      notifications: '/api/notifications',
      dashboard: '/api/dashboard',
    }
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    baseUrl: BASE_URL,
  });
});

// Test endpoint - confirms API working
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API test endpoint working',
    timestamp: new Date().toISOString(),
    env: {
      nodeEnv: process.env.NODE_ENV || 'development',
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
    }
  });
});

// Database test endpoint - runs simple query
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await query('SELECT NOW() as server_time, version() as db_version');
    res.json({
      success: true,
      message: 'Database connection successful',
      data: {
        serverTime: result[0].server_time,
        dbVersion: result[0].db_version,
        timestamp: new Date().toISOString(),
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    res.status(503).json({
      success: false,
      message: 'Database connection failed',
      error: process.env.NODE_ENV === 'production' 
        ? 'Service temporarily unavailable' 
        : error.message
    });
  }
});

// Privacy policy endpoint (public)
app.get('/api/privacy-policy', (req, res) => {
  res.json({
    success: true,
    data: {
      title: 'Privacy Policy',
      lastUpdated: new Date().toISOString().split('T')[0],
      sections: [
        {
          title: 'Information We Collect',
          content: 'We collect email addresses, financial data (income, expenses, goals), and usage information to provide our budgeting services.'
        },
        {
          title: 'How We Use Your Information',
          content: 'Your data is used to provide budgeting features, generate reports, and send relevant notifications about your financial goals.'
        },
        {
          title: 'Data Security',
          content: 'We use industry-standard encryption and security practices. Passwords are hashed using bcrypt, and all data is stored securely.'
        },
        {
          title: 'Your Rights (GDPR & Australian Privacy Act)',
          content: 'You have the right to access, export, and delete your data at any time. Contact us for data-related requests.'
        },
        {
          title: 'Data Retention',
          content: 'We retain your data as long as your account is active. You can delete your account and all associated data at any time.'
        },
        {
          title: 'Third-Party Sharing',
          content: 'We do not sell or share your personal data with third parties. Your financial data is private and only accessible to you.'
        }
      ]
    }
  });
});

// 404 handler for API routes - specific API 404
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.',
    path: req.path,
    method: req.method,
    availableEndpoints: [
      '/api/health',
      '/api/test',
      '/api/db-test',
      '/api/auth',
      '/api/income',
      '/api/expenses',
      '/api/goals',
      '/api/budgets',
      '/api/categories',
      '/api/notifications',
      '/api/dashboard',
    ]
  });
});

// Generic 404 for non-API routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Not found. Visit / for API documentation.',
    path: req.originalUrl
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      origin: req.headers.origin
    });
  }
  
  if (err.type === 'validation') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: err.errors
    });
  }
  
  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      success: false,
      message: 'Service temporarily unavailable. Please try again later.'
    });
  }
  
  if (err.code === 'ENOTFOUND' && err.hostname) {
    return res.status(503).json({
      success: false,
      message: 'Database connection error. Please check configuration.',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined
    });
  }
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.'
      : err.message
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Budgetier API Server (PostgreSQL)                 ║
║   Running on port ${PORT}                               
║                                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              
║   Base URL: ${BASE_URL}                                 
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
  
  console.log(`📡 API Base: ${BASE_URL}`);
  console.log(`💚 Health: ${BASE_URL}/api/health`);
  console.log(`🧪 Test: ${BASE_URL}/api/test`);
  console.log(`🗄️  DB Test: ${BASE_URL}/api/db-test`);

  // Start automatic transaction sync scheduler
  syncScheduler.start();
});

module.exports = { app, server };
