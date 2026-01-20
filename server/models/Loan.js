/**
 * Loan Model
 * Represents loan products offered by the microfinance institution
 */

const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema(
  {
    // Loan Product Details
    name: {
      type: String,
      required: [true, 'Loan name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ['personal', 'business', 'education', 'home', 'auto', 'agricultural'],
      required: true,
    },

    // Loan Terms
    minAmount: {
      type: Number,
      required: true,
      min: [0, 'Minimum amount cannot be negative'],
    },
    maxAmount: {
      type: Number,
      required: true,
      min: [0, 'Maximum amount cannot be negative'],
    },
    minTenureMonths: {
      type: Number,
      required: true,
      min: [1, 'Tenure must be at least 1 month'],
    },
    maxTenureMonths: {
      type: Number,
      required: true,
      min: [1, 'Tenure must be at least 1 month'],
    },
    annualInterestRate: {
      type: Number,
      required: true,
      min: [0, 'Interest rate cannot be negative'],
      max: [100, 'Interest rate cannot exceed 100%'],
    },

    // Eligibility Criteria
    minMonthlyIncome: {
      type: Number,
      required: true,
      default: 15000,
    },
    maxAge: {
      type: Number,
      default: 60,
    },
    minAge: {
      type: Number,
      default: 21,
    },
    requiredCreditScore: {
      type: Number,
      default: 0,
    },

    // Product Status
    isActive: {
      type: Boolean,
      default: true,
    },
    description_long: {
      type: String,
      default: '',
    },
    features: [String],
    requirements: [String],

    // Admin Information
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },

    // Timestamps
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

module.exports = mongoose.model('Loan', loanSchema);
