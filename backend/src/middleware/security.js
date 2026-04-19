const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const securityMiddleware = (app) => {
  // Define allowed origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://budgetier.ink',
    'https://www.budgetier.ink',
    'http://localhost:3000',
    'http://localhost:3001',
  ].filter(Boolean); // Remove undefined/null

  // Helmet for security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", ...allowedOrigins],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration - dynamic origin validation
  const corsOptions = {
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
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  };
  app.use(cors(corsOptions));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: {
      success: false,
      message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Stricter rate limiting for auth routes
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes.'
    },
    skipSuccessfulRequests: true,
  });

  return { authLimiter };
};

// Input sanitization helper
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim();
};

// XSS prevention middleware
const xssPrevention = (req, res, next) => {
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeInput(req.body[key]);
      }
    });
  }
  next();
};

// Prevent NoSQL injection
const preventNoSQLInjection = (req, res, next) => {
  if (req.body) {
    const hasProhibitedKeys = Object.keys(req.body).some(key => 
      key.startsWith('$') || key.includes('.')
    );
    
    if (hasProhibitedKeys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input detected.'
      });
    }
  }
  next();
};

module.exports = {
  securityMiddleware,
  xssPrevention,
  preventNoSQLInjection,
  sanitizeInput,
};
