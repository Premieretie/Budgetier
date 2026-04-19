const path = require('path');

// CRITICAL: Load dotenv FIRST before any other requires that use env vars
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
}

const express = require('express');
const cors = require('cors');
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

const app = express();
const PORT = process.env.PORT || 3000;

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
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
  
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred. Please try again later.'
      : err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   🚀 Budgetier API Server (PostgreSQL)                 ║
║   Running on port ${PORT}                              
║                                                        ║
║   Environment: ${process.env.NODE_ENV || 'development'}                             
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
  
  console.log(`📡 API available at: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
