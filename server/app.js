/**
 * Express Application Configuration
 * Sets up middleware, routes, and global error handling
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const { errorHandler } = require('./middleware/errorMiddleware');
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const loanRoutes = require('./routes/loanRoutes');

const app = express();

// ============================================
// MIDDLEWARE CONFIGURATION
// ============================================

// Security Middleware with relaxed CSP for development
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"]
    }
  }
}));
app.use(cors()); // Enable CORS

// Body Parser Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Static Files Middleware
app.use(express.static(path.join(__dirname, '../public')));

// View Engine Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// ============================================
// LOGGING MIDDLEWARE
// ============================================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// API ROUTES
// ============================================

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Authentication Routes
app.use('/api/auth', authRoutes);

// Customer Routes
app.use('/api/customers', customerRoutes);

// Admin Routes
app.use('/api/admin', adminRoutes);

// Loan Routes
app.use('/api/loans', loanRoutes);

// ============================================
// FRONTEND ROUTES
// ============================================

// ============================================
// FRONTEND PAGE ROUTES
// ============================================

// Landing Page
app.get('/', (req, res) => {
  res.render('index', {
    title: 'MicroFinance - Home',
  });
});

// About Page
app.get('/about', (req, res) => {
  res.render('shared/about', {
    title: 'About Micro Finance',
  });
});

// Customer Pages
app.get('/customer/login', (req, res) => {
  res.render('customer/login', {
    title: 'Customer Login',
  });
});

app.get('/customer/register', (req, res) => {
  res.render('customer/register', {
    title: 'Customer Registration',
  });
});

app.get('/customer/forgot-password', (req, res) => {
  res.render('customer/forgot-password', {
    title: 'Forgot Password - Customer',
  });
});

app.get('/customer/reset-password', (req, res) => {
  res.render('customer/reset-password', {
    title: 'Reset Password - Customer',
  });
});

app.get('/customer/dashboard', (req, res) => {
  res.render('customer/dashboard', {
    title: 'Customer Dashboard',
  });
});

// Admin Pages
app.get('/admin/login', (req, res) => {
  res.render('admin/login', {
    title: 'Admin Login',
  });
});

app.get('/admin/forgot-password', (req, res) => {
  res.render('admin/forgot-password', {
    title: 'Forgot Password - Admin',
  });
});

app.get('/admin/reset-password', (req, res) => {
  res.render('admin/reset-password', {
    title: 'Reset Password - Admin',
  });
});

app.get('/admin/dashboard', (req, res) => {
  res.render('admin/dashboard', {
    title: 'Admin Dashboard',
  });
});

// ============================================
// 404 ERROR HANDLING
// ============================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use(errorHandler);

module.exports = app;
