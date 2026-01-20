/**
 * Customer Controller
 * Handles customer profile management and customer-specific operations
 */

const Customer = require('../models/Customer');
const LoanApplication = require('../models/LoanApplication');

/**
 * GET /api/customers/profile
 * Get customer profile
 * Protected: Customer only
 */
const getProfile = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile retrieved successfully',
      data: customer.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

/**
 * PUT /api/customers/profile
 * Update customer profile
 * Protected: Customer only
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, street, city, state, pincode, monthlyIncome, occupation } =
      req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.user.id,
      {
        firstName,
        lastName,
        phone,
        'address.street': street,
        'address.city': city,
        'address.state': state,
        'address.pincode': pincode,
        monthlyIncome,
        occupation,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: customer.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

/**
 * GET /api/customers/loans
 * Get customer's loan applications and active loans
 * Protected: Customer only
 */
const getMyLoans = async (req, res) => {
  try {
    const loans = await LoanApplication.find({
      customerId: req.user.id,
      status: { $in: ['approved', 'active', 'closed'] },
    })
      .populate('loanId', 'name category')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: 'Loans retrieved successfully',
      count: loans.length,
      data: loans,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error.message,
    });
  }
};

/**
 * GET /api/customers/dashboard
 * Get customer dashboard data
 * Protected: Customer only
 */
const getDashboard = async (req, res) => {
  try {
    const customer = await Customer.findById(req.user.id);

    // Get statistics
    const totalApplications = await LoanApplication.countDocuments({
      customerId: req.user.id,
    });

    const approvedLoans = await LoanApplication.countDocuments({
      customerId: req.user.id,
      status: { $in: ['approved', 'active'] },
    });

    const activeLoans = await LoanApplication.countDocuments({
      customerId: req.user.id,
      status: 'active',
    });

    const totalBorrowed = await LoanApplication.aggregate([
      { $match: { customerId: require('mongoose').Types.ObjectId(req.user.id) } },
      { $group: { _id: null, total: { $sum: '$loanAmount' } } },
    ]);

    res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved',
      data: {
        customer: customer.getPublicProfile(),
        statistics: {
          totalApplications,
          approvedLoans,
          activeLoans,
          totalBorrowed: totalBorrowed[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message,
    });
  }
};

/**
 * POST /api/customers/verify-kyc
 * Submit KYC documents
 * Protected: Customer only
 */
const submitKYC = async (req, res) => {
  try {
    const { aadharNumber, panNumber } = req.body;

    const customer = await Customer.findByIdAndUpdate(
      req.user.id,
      {
        aadharNumber,
        panNumber,
        kycStatus: 'pending',
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true }
    );

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'KYC documents submitted for verification',
      data: customer.getPublicProfile(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit KYC',
      error: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getMyLoans,
  getDashboard,
  submitKYC,
};
