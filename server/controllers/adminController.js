/**
 * Admin Controller
 * Handles admin-specific operations like loan approval, KYC verification, analytics
 */

const Admin = require('../models/Admin');
const Customer = require('../models/Customer');
const LoanApplication = require('../models/LoanApplication');
const Loan = require('../models/Loan');

/**
 * GET /api/admin/dashboard
 * Get admin dashboard with analytics
 * Protected: Admin only
 */
const getDashboard = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    // Calculate statistics
    const totalCustomers = await Customer.countDocuments();
    const verifiedCustomers = await Customer.countDocuments({ isVerified: true });
    const kycPendingCustomers = await Customer.countDocuments({ kycStatus: 'pending' });

    const totalApplications = await LoanApplication.countDocuments();
    const pendingApplications = await LoanApplication.countDocuments({ status: 'pending' });
    const approvedApplications = await LoanApplication.countDocuments({ status: 'approved' });
    const activeLoans = await LoanApplication.countDocuments({ status: 'active' });

    const totalLoanAmount = await LoanApplication.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$loanAmount' },
        },
      },
    ]);

    const disbursedAmount = await LoanApplication.aggregate([
      {
        $match: { status: { $in: ['active', 'closed'] } },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$loanAmount' },
        },
      },
    ]);

    // Get recent applications
    const recentApplications = await LoanApplication.find()
      .populate('customerId', 'firstName lastName email')
      .populate('loanId', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved',
      data: {
        admin: {
          name: `${admin.firstName} ${admin.lastName}`,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
        statistics: {
          customers: {
            total: totalCustomers,
            verified: verifiedCustomers,
            kycPending: kycPendingCustomers,
          },
          loans: {
            totalApplications,
            pending: pendingApplications,
            approved: approvedApplications,
            active: activeLoans,
            totalLoanAmount: totalLoanAmount[0]?.total || 0,
            disbursedAmount: disbursedAmount[0]?.total || 0,
          },
        },
        recentApplications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/customers
 * Get all customers with filters
 * Protected: Admin only
 */
const getAllCustomers = async (req, res) => {
  try {
    const { kycStatus, accountStatus, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (kycStatus) filter.kycStatus = kycStatus;
    if (accountStatus) filter.accountStatus = accountStatus;

    const skip = (page - 1) * limit;

    const customers = await Customer.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Customer.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Customers retrieved',
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/customer/:id
 * Get customer details
 */
const getCustomerDetails = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    // Get customer's loan applications
    const applications = await LoanApplication.find({ customerId: req.params.id })
      .populate('loanId', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Customer details retrieved',
      data: {
        customer: customer.getPublicProfile(),
        loanApplications: applications,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer details',
      error: error.message,
    });
  }
};

/**
 * PUT /api/admin/customer/:id/kyc
 * Verify/Reject customer KYC
 * Protected: Admin with KYC permission
 */
const verifyKYC = async (req, res) => {
  try {
    const { status, remarks } = req.body;

    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid KYC status',
      });
    }

    const customer = await Customer.findByIdAndUpdate(
      req.params.id,
      {
        kycStatus: status,
        isVerified: status === 'verified',
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `KYC ${status} successfully`,
      data: customer.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to verify KYC',
      error: error.message,
    });
  }
};

/**
 * GET /api/admin/applications
 * Get all loan applications with filters
 * Protected: Admin only
 */
const getAllApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const applications = await LoanApplication.find(filter)
      .populate('customerId', 'firstName lastName email phone')
      .populate('loanId', 'name category')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await LoanApplication.countDocuments(filter);

    res.status(200).json({
      success: true,
      message: 'Applications retrieved',
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
      data: applications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

/**
 * PUT /api/admin/application/:id/approve
 * Approve loan application
 * Protected: Admin with approve-loans permission
 */
const approveLoanApplication = async (req, res) => {
  try {
    const { remarks } = req.body;

    const application = await LoanApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve application with status: ${application.status}`,
      });
    }

    application.approveLoan(req.user.id);
    application.remarks = remarks || '';
    await application.save();

    res.status(200).json({
      success: true,
      message: `Loan application ${application.applicationNumber} approved successfully. Customer notification pending.`,
      data: application,
      customerNotified: false,
      notificationDetails: {
        method: 'pending',
        message: 'Configure email/SMS to notify customer of approval',
      },
      nextSteps: ['Activate the loan to start the EMI schedule', 'Complete customer KYC if not already done'],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to approve application',
      error: error.message,
    });
  }
};

/**
 * PUT /api/admin/application/:id/reject
 * Reject loan application
 * Protected: Admin with approve-loans permission
 */
const rejectLoanApplication = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    const application = await LoanApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'pending' && application.status !== 'under_review') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject application with status: ${application.status}`,
      });
    }

    application.rejectLoan(reason);
    await application.save();

    const reapplyDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    res.status(200).json({
      success: true,
      message: `Loan application ${application.applicationNumber} rejected. Rejection reason recorded.`,
      data: application,
      customerNotified: false,
      rejectionReasons: [reason],
      canReapply: true,
      reapplyEligibleDate: reapplyDate,
      nextSteps: ['Notify customer of rejection', 'Send reapply instructions for 30 days later'],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reject application',
      error: error.message,
    });
  }
};

/**
 * PUT /api/admin/application/:id/activate
 * Activate approved loan (start EMI cycle)
 * Protected: Admin only
 */
const activateLoan = async (req, res) => {
  try {
    const application = await LoanApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Only approved applications can be activated',
      });
    }

    application.activateLoan();
    await application.save();

    res.status(200).json({
      success: true,
      message: `Loan ${application.applicationNumber} activated successfully. EMI of ₹${(application.emiAmount || 0).toLocaleString()} scheduled.`,
      data: application,
      customerNotified: false,
      nextSteps: ['Send repayment schedule to customer', 'Enable EMI payment gateway', 'Send welcome message with first EMI date'],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to activate loan',
      error: error.message,
    });
  }
};

module.exports = {
  getDashboard,
  getAllCustomers,
  getCustomerDetails,
  verifyKYC,
  getAllApplications,
  approveLoanApplication,
  rejectLoanApplication,
  activateLoan,
};
