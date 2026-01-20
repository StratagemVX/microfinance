/**
 * Customer Model
 * Represents a microfinance customer with personal and financial information
 * Implements password hashing using bcryptjs
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const customerSchema = new mongoose.Schema(
  {
    // Personal Information
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      minlength: [2, 'First name must be at least 2 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      minlength: [2, 'Last name must be at least 2 characters'],
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
      unique: true,
      match: [/^[0-9]{10}$/, 'Phone number must be 10 digits'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't return password by default
    },

    // Address Information
    address: {
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      pincode: {
        type: String,
        required: true,
        match: [/^[0-9]{6}$/, 'Pincode must be 6 digits'],
      },
    },

    // KYC Information
    kycStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    aadharNumber: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^[0-9]{12}$/, 'Aadhar number must be 12 digits'],
    },
    panNumber: {
      type: String,
      unique: true,
      sparse: true,
      match: [/^[A-Z0-9]{10}$/, 'PAN number must be 10 alphanumeric characters'],
    },

    // Financial Information
    monthlyIncome: {
      type: Number,
      required: true,
      min: [0, 'Monthly income cannot be negative'],
    },
    occupation: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      enum: ['salaried', 'self-employed', 'business', 'retired', 'other'],
      required: true,
    },

    // Account Status
    accountStatus: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active',
    },
    isVerified: {
      type: Boolean,
      default: false,
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

    // Tracking Information
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
 * Middleware: Hash password before saving
 * Only hashes if password is new or modified
 */
customerSchema.pre('save', async function (next) {
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
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
customerSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Instance Method: Generate password reset token
 * Creates a unique reset token and sets expiry time (30 minutes)
 * @returns {string} - Reset token
 */
customerSchema.methods.generateResetToken = function () {
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
customerSchema.methods.clearResetToken = function () {
  this.resetToken = null;
  this.resetTokenExpiry = null;
};

/**
 * Instance Method: Get public profile (mask sensitive data)
 * @returns {object} - Customer profile without sensitive fields
 */
customerSchema.methods.getPublicProfile = function () {
  const customer = this.toObject();
  delete customer.password;
  // Mask sensitive information
  customer.aadharNumber = customer.aadharNumber
    ? `XXXX-XXXX-${customer.aadharNumber.slice(-4)}`
    : null;
  customer.panNumber = customer.panNumber
    ? `${customer.panNumber.slice(0, 2)}XXXX-XXXX-${customer.panNumber.slice(-2)}`
    : null;
  return customer;
};

module.exports = mongoose.model('Customer', customerSchema);
