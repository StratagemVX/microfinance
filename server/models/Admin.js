/**
 * Admin Model
 * Represents bank administrators with role-based access control
 * Implements password hashing using bcryptjs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },

    // Admin Configuration
    role: {
      type: String,
      enum: ['super_admin', 'loan_officer', 'customer_service', 'compliance_officer'],
      default: 'customer_service',
      required: true,
    },

    // Permissions (based on role)
    permissions: {
      canApproveLoans: {
        type: Boolean,
        default: false,
      },
      canVerifyKYC: {
        type: Boolean,
        default: false,
      },
      canManageAdmins: {
        type: Boolean,
        default: false,
      },
      canViewAnalytics: {
        type: Boolean,
        default: false,
      },
      canManageCustomers: {
        type: Boolean,
        default: false,
      },
    },

    // Account Status
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },

    // Department
    department: {
      type: String,
      enum: ['loan_management', 'kyc_verification', 'customer_support', 'compliance', 'management'],
      required: true,
    },

    // Password Reset
    resetToken: {
      type: String,
      default: null,
      select: false,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
      select: false,
    },
    passwordChangedAt: {
      type: Date,
      default: null,
    },

    // Activity Tracking
    lastLoginAt: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },

    // Audit Log
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/**
 * Middleware: Auto-assign permissions based on role
 */
adminSchema.pre('save', function (next) {
  const rolePermissions = {
    super_admin: {
      canApproveLoans: true,
      canVerifyKYC: true,
      canManageAdmins: true,
      canViewAnalytics: true,
      canManageCustomers: true,
    },
    loan_officer: {
      canApproveLoans: true,
      canVerifyKYC: false,
      canManageAdmins: false,
      canViewAnalytics: true,
      canManageCustomers: false,
    },
    compliance_officer: {
      canApproveLoans: false,
      canVerifyKYC: true,
      canManageAdmins: false,
      canViewAnalytics: true,
      canManageCustomers: false,
    },
    customer_service: {
      canApproveLoans: false,
      canVerifyKYC: false,
      canManageAdmins: false,
      canViewAnalytics: false,
      canManageCustomers: true,
    },
  };

  if (this.isModified('role')) {
    this.permissions = rolePermissions[this.role];
  }

  next();
});

/**
 * Middleware: Hash password before saving
 */
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    // Update password changed timestamp only if password is being modified (not on initial creation)
    if (!this.isNew) {
      this.passwordChangedAt = Date.now();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance Method: Compare password
 * @param {string} enteredPassword - Password entered by user
 * @returns {Promise<boolean>} - True if password matches
 */
adminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance Method: Check if admin account is locked
 * @returns {boolean} - True if account is locked
 */
adminSchema.methods.isLocked = function () {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Instance Method: Increment failed login attempts
 */
adminSchema.methods.incLoginAttempts = async function () {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 },
    });
  }

  // Increment attempts and lock if max attempts exceeded
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes

  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked()) {
    updates.$set = { lockUntil: new Date(Date.now() + lockTime) };
  }

  return this.updateOne(updates);
};

/**
 * Instance Method: Reset login attempts
 */
adminSchema.methods.resetLoginAttempts = async function () {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 },
  });
};

/**
 * Instance Method: Generate password reset token
 * Creates a unique reset token and sets expiry time (30 minutes)
 * @returns {string} - Reset token
 */
adminSchema.methods.generateResetToken = function () {
  const crypto = require('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.resetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.resetTokenExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
  return resetToken;
};

/**
 * Instance Method: Clear reset token
 * Used after password reset is successful
 */
adminSchema.methods.clearResetToken = function () {
  this.resetToken = null;
  this.resetTokenExpiry = null;
};

module.exports = mongoose.model('Admin', adminSchema);
