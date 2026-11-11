/**
 * Loan Controller
 * Handles loan product management and loan applications
 */

const Loan = require('../models/Loan');
const LoanApplication = require('../models/LoanApplication');
const Customer = require('../models/Customer');
const notificationMessages = require('../utils/notificationMessages');

/**
 * GET /api/loans
 * Get all active loan products
 * Public endpoint
 */
const getAllLoans = async (req, res) => {
  try {
    const loans = await Loan.find({ isActive: true })
      .select('-createdBy -updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Loans retrieved successfully',
      count: loans.length,
      data: loans,
    });
  } catch (error) {
    console.error('Failed to fetch loans:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
    });
  }
};

/**
 * GET /api/loans/:id
 * Get single loan product details
 * Public endpoint
 */
const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loan details retrieved',
      data: loan,
    });
  } catch (error) {
    console.error('Failed to fetch loan:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
    });
  }
};

/**
 * POST /api/loans
 * Create new loan product
 * Protected: Admin only
 */
const createLoan = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      annualInterestRate,
      minMonthlyIncome,
      maxAge,
      minAge,
      features,
      requirements,
    } = req.body;

    // Validate loan terms
    if (minAmount >= maxAmount) {
      return res.status(400).json({
        success: false,
        message: 'Minimum amount must be less than maximum amount',
      });
    }

    if (minTenureMonths >= maxTenureMonths) {
      return res.status(400).json({
        success: false,
        message: 'Minimum tenure must be less than maximum tenure',
      });
    }

    const loan = new Loan({
      name,
      description,
      category,
      minAmount,
      maxAmount,
      minTenureMonths,
      maxTenureMonths,
      annualInterestRate,
      minMonthlyIncome,
      maxAge,
      minAge,
      features: features || [],
      requirements: requirements || [],
      createdBy: req.user.id,
    });

    await loan.save();

    res.status(201).json({
      success: true,
      message: 'Loan product created successfully',
      data: loan,
    });
  } catch (error) {
    console.error('Failed to create loan:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to create loan',
    });
  }
};

const ALLOWED_LOAN_UPDATE_FIELDS = [
  'name',
  'description',
  'category',
  'minAmount',
  'maxAmount',
  'minTenureMonths',
  'maxTenureMonths',
  'annualInterestRate',
  'minMonthlyIncome',
  'maxAge',
  'minAge',
  'features',
  'requirements',
  'isActive',
];

/**
 * PUT /api/loans/:id
 * Update loan product
 * Protected: Admin only
 */
const updateLoan = async (req, res) => {
  try {
    const updates = {};
    for (const field of ALLOWED_LOAN_UPDATE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, field)) {
        updates[field] = req.body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid loan fields supplied for update',
      });
    }

    const loan = await Loan.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Loan product updated successfully',
      data: loan,
    });
  } catch (error) {
    console.error('Failed to update loan:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to update loan',
    });
  }
};

/**
 * POST /api/loans/apply
 * Apply for loan
 * Protected: Customer only
 */
const applyForLoan = async (req, res) => {
  try {
    const { loanId, loanAmount, tenureMonths, purpose } = req.body;
    const customerId = req.user.id;

    // Validate loan exists
    const loan = await Loan.findById(loanId);
    if (!loan) {
      return res.status(404).json({
        success: false,
        message: 'Loan product not found',
      });
    }

    // Validate customer exists and eligibility
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Check eligibility
    if (customer.monthlyIncome < loan.minMonthlyIncome) {
      return res.status(400).json({
        success: false,
        message: `Minimum monthly income required: ₹${loan.minMonthlyIncome}`,
      });
    }

    // Validate loan amount within limits
    if (loanAmount < loan.minAmount || loanAmount > loan.maxAmount) {
      return res.status(400).json({
        success: false,
        message: `Loan amount must be between ₹${loan.minAmount} and ₹${loan.maxAmount}`,
      });
    }

    // Validate tenure within limits
    if (tenureMonths < loan.minTenureMonths || tenureMonths > loan.maxTenureMonths) {
      return res.status(400).json({
        success: false,
        message: `Tenure must be between ${loan.minTenureMonths} and ${loan.maxTenureMonths} months`,
      });
    }

    // Create loan application
    const loanApplication = new LoanApplication({
      customerId,
      loanId,
      loanAmount,
      tenureMonths,
      purpose,
      interestRate: loan.annualInterestRate,
      status: 'pending',
    });

    // Calculate EMI
    loanApplication.calculateEMI();
    await loanApplication.save();

    const reviewETA = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
    const kycRequired = customer.kycStatus !== 'verified';

    // Use message templates
    const msgTemplate = notificationMessages.loan.application.submitted;
    const messageText = msgTemplate.message
      .replace('{amount}', `₹${loanAmount.toLocaleString()}`);

    res.status(201).json({
      success: true,
      message: messageText,
      applicationNumber: loanApplication.applicationNumber,
      data: loanApplication,
      nextSteps: kycRequired
        ? ['Complete KYC verification to speed up approval']
        : ['We will notify you once the review is complete'],
      reviewETA,
      kycRequired,
      statusText: kycRequired
        ? 'Application submitted • KYC required'
        : 'Application submitted • Under review',
    });
  } catch (error) {
    console.error('Failed to apply for loan:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to apply for loan',
    });
  }
};

/**
 * GET /api/loans/customer/:customerId
 * Get customer's loan applications
 * Protected: Owner Customer or Admin
 */
const getCustomerApplications = async (req, res) => {
  try {
    const { customerId } = req.params;
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && String(req.user.id) === String(customerId);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You may only inspect your own loan applications.',
      });
    }

    const applications = await LoanApplication.find({ customerId })
      .populate('loanId', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Applications retrieved successfully',
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.error('Failed to fetch applications:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
    });
  }
};

/**
 * GET /api/loans/application/:applicationId
 * Get loan application details
 * Protected: Owner Customer or Admin
 */
const getApplicationDetails = async (req, res) => {
  try {
    const application = await LoanApplication.findById(req.params.applicationId)
      .populate('customerId', 'firstName lastName email phone')
      .populate('loanId', 'name category')
      .populate('approvedBy', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    const ownerId = application.customerId && application.customerId._id
      ? application.customerId._id
      : application.customerId;
    const isAdmin = req.user && req.user.role === 'admin';
    const isOwner = req.user && ownerId && String(ownerId) === String(req.user.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You may only inspect your own loan application.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Application details retrieved',
      data: application,
    });
  } catch (error) {
    console.error('Failed to fetch application:', error.name || 'Error');
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
    });
  }
};

module.exports = {
  getAllLoans,
  getLoanById,
  createLoan,
  updateLoan,
  applyForLoan,
  getCustomerApplications,
  getApplicationDetails,
};
