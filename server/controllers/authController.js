/**
 * Authentication Controller
 * Handles customer and admin registration, login, and token generation
 * Implements JWT-based authentication with bcrypt password hashing
 */

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const Customer = require('../models/Customer');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../middleware/authMiddleware');
const { sendCustomerPasswordResetEmail, sendAdminPasswordResetEmail } = require('../utils/emailService');

/**
 * Generate JWT Token
 * @param {string} id - User ID
 * @param {string} role - User role (customer or admin)
 * @param {string} email - User email
 * @returns {string} - JWT token
 */
const generateToken = (id, role, email) => {
  return jwt.sign(
    {
      id,
      role,
      email,
    },
    getJwtSecret(),
    {
      expiresIn: process.env.JWT_EXPIRY || '7d',
    }
  );
};

/**
 * Customer Registration
 * POST /api/auth/customer/register
 * Creates new customer account with validation
 */
const customerRegister = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessages = errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation failed. Please check your information.',
        details: errorMessages,
        errors: errors.array(),
      });
    }

    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      confirmPassword,
      street,
      city,
      state,
      pincode,
      monthlyIncome,
      occupation,
      employmentType,
    } = req.body;

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingCustomer) {
      const duplicateField = existingCustomer.email === email ? 'email' : 'phone';
      return res.status(409).json({
        success: false,
        message: `${duplicateField === 'email' ? 'Email' : 'Phone number'} already registered with another account`,
        field: duplicateField,
        suggestedAction: 'Login with your existing account or use a different email/phone number',
        loginLink: `/customer/login`,
        forgotPasswordLink: `/customer/forgot-password`
      });
    }

    // Create new customer
    const customer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      password,
      address: {
        street,
        city,
        state,
        pincode,
      },
      monthlyIncome,
      occupation,
      employmentType,
    });

    await customer.save();

    // Generate token
    const token = generateToken(customer._id, 'customer', customer.email);

    // Return response
    res.status(201).json({
      success: true,
      message: 'Customer registered successfully.',
      token,
      customer: customer.getPublicProfile(),
    });
  } catch (error) {
    console.error('❌ Registration Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Registration failed.',
    });
  }
};

/**
 * Customer Login
 * POST /api/auth/customer/login
 * Authenticates customer and returns JWT token
 */
const customerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
        details: 'Please provide both your registered email and password to login'
      });
    }

    // Find customer and select password field
    const customer = await Customer.findOne({ email }).select('+password');

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect',
        suggestedAction: 'Check your email and password, or reset your password if forgotten',
        forgotPasswordLink: '/customer/forgot-password',
      });
    }

    // Check account status
    if (customer.accountStatus !== 'active') {
      const statusMap = {
        suspended: 'Your account has been suspended. Please contact support.',
        blocked: 'Your account has been blocked. Please contact support.',
        inactive: 'Your account is inactive. Please verify your email to continue.',
        deleted: 'Your account has been deleted.'
      };
      return res.status(403).json({
        success: false,
        message: `Account ${customer.accountStatus}`,
        details: statusMap[customer.accountStatus] || `Your account is ${customer.accountStatus}`,
        contactSupport: true
      });
    }

    // Compare passwords
    const isPasswordValid = await customer.matchPassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email or password is incorrect',
        suggestedAction: 'Check your email and password, or reset your password if forgotten',
        forgotPasswordLink: '/customer/forgot-password',
        details: 'The email or password you entered does not match our records'
      });
    }

    // Generate token
    const token = generateToken(customer._id, 'customer', customer.email);

    // Return response
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      customer: customer.getPublicProfile(),
    });
  } catch (error) {
    console.error('Login Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Login failed.',
    });
  }
};

/**
 * Admin Login
 * POST /api/auth/admin/login
 * Authenticates admin and returns JWT token
 */
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required for admin login'
      });
    }

    // Find admin and select password field
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      const unlockTime = new Date(admin.lockUntil);
      return res.status(403).json({
        success: false,
        message: 'Account temporarily locked for security',
        reason: 'Multiple failed login attempts detected',
        unlockAt: unlockTime,
        contactSupport: true,
        details: `Your account is locked. Try again after ${unlockTime.toLocaleString()}`
      });
    }

    // Check account status
    if (admin.accountStatus !== 'active') {
      const statusMessages = {
        suspended: 'Your admin account has been suspended. Contact superuser.',
        blocked: 'Your admin account has been blocked. Contact superuser.',
        inactive: 'Your admin account is inactive. Contact superuser.'
      };
      return res.status(403).json({
        success: false,
        message: `Admin account ${admin.accountStatus}`,
        details: statusMessages[admin.accountStatus] || `Your account is ${admin.accountStatus}`,
        contactSupport: true
      });
    }

    // Compare passwords
    const isPasswordValid = await admin.matchPassword(password);

    if (!isPasswordValid) {
      // Increment login attempts
      const attempts = await admin.incLoginAttempts();
      const remainingAttempts = 5 - attempts;
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        attemptNumber: attempts,
        remainingAttempts: remainingAttempts,
        warning: remainingAttempts <= 2 ? `Warning: ${remainingAttempts} attempts remaining before account lock` : null,
        details: 'The email or password you entered is incorrect'
      });
    }

    // Reset login attempts on successful login
    await admin.resetLoginAttempts();

    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save();

    // Generate token
    const token = generateToken(admin._id, 'admin', admin.email);

    // Return response (exclude password)
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(200).json({
      success: true,
      message: 'Admin login successful.',
      token,
      admin: adminData,
    });
  } catch (error) {
    console.error('Admin Login Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Login failed.',
    });
  }
};

/**
 * Admin Register (create new admin)
 * POST /api/auth/admin/register
 * Only super admins can create new admins
 */
const adminRegister = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, confirmPassword, role, department } =
      req.body;

    // Verify caller is super admin
    if (req.user.role !== 'admin' || !req.admin.permissions.canManageAdmins) {
      return res.status(403).json({
        success: false,
        message: 'Only super admins can create new admins.',
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match.',
      });
    }

    // Check if admin exists
    const existingAdmin = await Admin.findOne({
      $or: [{ email }, { phone }],
    });

    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email or phone already exists.',
      });
    }

    // Create new admin
    const admin = new Admin({
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      department,
      createdBy: req.user.id,
    });

    await admin.save();

    // Return response
    const adminData = admin.toObject();
    delete adminData.password;

    res.status(201).json({
      success: true,
      message: 'Admin created successfully.',
      admin: adminData,
    });
  } catch (error) {
    console.error('Admin Registration Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Admin creation failed.',
    });
  }
};

/**
 * Forgot Password - Customer
 * POST /api/auth/customer/forgot-password
 * Generates a password reset token and sends reset link
 */
const customerForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find customer by email
    const customer = await Customer.findOne({ email });

    if (!customer) {
      // Don't reveal if email exists for security reasons
      return res.status(200).json({
        success: true,
        message: 'If email exists, password reset link has been sent',
        info: 'Check your email for password reset instructions'
      });
    }

    // Generate a secure, single-use reset token (hash stored in DB)
    const resetToken = customer.generateResetToken();
    await customer.save();

    try {
      await sendCustomerPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Customer password reset email error:', emailError.name || 'Error');
    }

    res.status(200).json({
      success: true,
      message: 'If email exists, password reset link has been sent',
      info: 'Check your email for password reset instructions'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
    });
  }
};

/**
 * Reset Password - Customer
 * POST /api/auth/customer/reset-password
 * Resets customer password using reset token
 */
const customerResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirm password are required',
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Validate hashed token + expiry (single-use token)
    const customer = await Customer.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }, // Token not expired
    }).select('+resetToken +resetTokenExpiry');

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        suggestedAction: 'Request a new password reset link'
      });
    }

    // Update password and clear reset token (hashing happens in model pre-save hook)
    customer.password = password;
    customer.clearResetToken();
    await customer.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      info: 'You can now login with your new password',
    });
  } catch (error) {
    console.error('Reset Password Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

/**
 * Forgot Password - Admin
 * POST /api/auth/admin/forgot-password
 * Generates a password reset token for admin
 */
const adminForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Find admin by email
    const admin = await Admin.findOne({ email });

    if (!admin) {
      // Don't reveal if email exists for security reasons
      return res.status(200).json({
        success: true,
        message: 'If email exists, password reset link has been sent',
        info: 'Check your email for password reset instructions'
      });
    }

    // Generate a secure, single-use reset token (hash stored in DB)
    const resetToken = admin.generateResetToken();
    await admin.save();

    const correlationId = crypto.randomUUID();
    console.log('🔐 Admin reset flow initiated', { correlationId });

    try {
      await sendAdminPasswordResetEmail(email, resetToken);
    } catch (emailError) {
      console.error('Admin password reset email error:', emailError.name || 'Error');
    }

    res.status(200).json({
      success: true,
      message: 'If email exists, password reset link has been sent',
      info: 'Check your email for password reset instructions'
    });
  } catch (error) {
    console.error('Admin Forgot Password Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to process forgot password request',
    });
  }
};

/**
 * Reset Password - Admin
 * POST /api/auth/admin/reset-password
 * Resets admin password using reset token
 */
const adminResetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, password, and confirm password are required',
      });
    }

    // Validate password match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match',
      });
    }

    // Validate password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
    }

    // Hash the token to match stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Validate hashed token + expiry (single-use token)
    const admin = await Admin.findOne({
      resetToken: hashedToken,
      resetTokenExpiry: { $gt: Date.now() }, // Token not expired
    }).select('+resetToken +resetTokenExpiry');

    if (!admin) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
        suggestedAction: 'Request a new password reset link'
      });
    }

    // Update password and clear reset token (hashing happens in model pre-save hook)
    admin.password = password;
    admin.clearResetToken();
    admin.resetLoginAttempts(); // Reset login attempts after password reset
    await admin.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successful',
      info: 'You can now login with your new password',
    });
  } catch (error) {
    console.error('Admin Reset Password Error:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
    });
  }
};

/**
 * Verify Token
 * GET /api/auth/verify
 * Verifies JWT token validity
 */
const verifyTokenEndpoint = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided.',
      });
    }

    const decoded = jwt.verify(token, getJwtSecret());

    res.status(200).json({
      success: true,
      message: 'Token is valid.',
      user: decoded,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

module.exports = {
  customerRegister,
  customerLogin,
  adminLogin,
  adminRegister,
  customerForgotPassword,
  customerResetPassword,
  adminForgotPassword,
  adminResetPassword,
  verifyTokenEndpoint,
  generateToken,
};
