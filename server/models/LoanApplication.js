/**
 * Loan Application Model
 * Represents customer loan applications and their lifecycle
 * Tracks application status from pending to approval/rejection to active/closed
 */

const mongoose = require('mongoose');

const loanApplicationSchema = new mongoose.Schema(
  {
    // References
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: true,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: true,
    },

    // Application Details
    applicationNumber: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    loanAmount: {
      type: Number,
      required: [true, 'Loan amount is required'],
      min: [1000, 'Minimum loan amount is 1000'],
      max: [1000000, 'Maximum loan amount is 1000000'],
    },
    tenureMonths: {
      type: Number,
      required: [true, 'Tenure is required'],
      min: [1, 'Minimum tenure is 1 month'],
      max: [180, 'Maximum tenure is 180 months'],
    },
    purpose: {
      type: String,
      required: true,
    },

    // Status Tracking
    status: {
      type: String,
      enum: ['pending', 'under_review', 'approved', 'rejected', 'active', 'closed'],
      default: 'pending',
      index: true,
    },

    // Approval/Rejection Details
    approvalDate: {
      type: Date,
      default: null,
    },
    rejectionDate: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    remarks: {
      type: String,
      default: '',
    },

    // Loan Officer Details
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      default: null,
    },

    // Financial Details
    interestRate: {
      type: Number,
      required: true,
    },
    monthlyEMI: {
      type: Number,
      default: 0,
    },
    totalInterest: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0,
    },

    // EMI and Payment Tracking
    emiStartDate: {
      type: Date,
      default: null,
    },
    emiEndDate: {
      type: Date,
      default: null,
    },
    emisPaid: {
      type: Number,
      default: 0,
    },
    totalEMIs: {
      type: Number,
      default: 0,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    pendingAmount: {
      type: Number,
      default: 0,
    },

    // Additional Information
    documents: [
      {
        name: String,
        url: String,
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    lastStatusUpdate: {
      type: Date,
      default: Date.now,
    },

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

/**
 * Middleware: Generate application number before saving
 */
loanApplicationSchema.pre('save', async function (next) {
  if (!this.applicationNumber) {
    const count = await mongoose.model('LoanApplication').countDocuments();
    const year = new Date().getFullYear().toString().slice(-2);
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    this.applicationNumber = `APP-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

/**
 * Instance Method: Calculate EMI
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * Where P = Principal, R = Monthly Rate, N = Number of months
 */
loanApplicationSchema.methods.calculateEMI = function () {
  const principal = this.loanAmount;
  const monthlyRate = this.interestRate / 100 / 12;
  const numberOfMonths = this.tenureMonths;

  if (monthlyRate === 0) {
    this.monthlyEMI = principal / numberOfMonths;
  } else {
    this.monthlyEMI = (
      (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths)) /
      (Math.pow(1 + monthlyRate, numberOfMonths) - 1)
    ).toFixed(2);
  }

  this.totalInterest = (this.monthlyEMI * numberOfMonths - principal).toFixed(2);
  this.totalAmount = (parseFloat(this.monthlyEMI) * numberOfMonths).toFixed(2);
  this.totalEMIs = numberOfMonths;
  this.pendingAmount = this.totalAmount;
};

/**
 * Instance Method: Approve loan
 */
loanApplicationSchema.methods.approveLoan = function (approvingOfficerId) {
  this.status = 'approved';
  this.approvalDate = new Date();
  this.approvedBy = approvingOfficerId;
  this.calculateEMI();
};

/**
 * Instance Method: Reject loan
 */
loanApplicationSchema.methods.rejectLoan = function (reason) {
  this.status = 'rejected';
  this.rejectionDate = new Date();
  this.rejectionReason = reason;
};

/**
 * Instance Method: Activate loan (start EMI cycle)
 */
loanApplicationSchema.methods.activateLoan = function () {
  this.status = 'active';
  this.emiStartDate = new Date();
  this.emiEndDate = new Date(new Date().setMonth(new Date().getMonth() + this.tenureMonths));
};

/**
 * Instance Method: Record EMI payment
 */
loanApplicationSchema.methods.recordEMIPayment = function (amount) {
  this.emisPaid += 1;
  this.amountPaid += amount;
  this.pendingAmount = this.totalAmount - this.amountPaid;

  if (this.emisPaid >= this.totalEMIs) {
    this.status = 'closed';
  }
};

module.exports = mongoose.model('LoanApplication', loanApplicationSchema);
