/**
 * Customer Routes
 * Handles customer profile, loans, and personal operations
 */

const express = require('express');
const { body } = require('express-validator');
const customerController = require('../controllers/customerController');
const { verifyToken, verifyCustomer } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * All routes are protected and customer-only
 */
router.use(verifyToken, verifyCustomer);

/**
 * GET /api/customers/profile
 * Get customer profile
 */
router.get('/profile', customerController.getProfile);

/**
 * PUT /api/customers/profile
 * Update customer profile
 */
router.put(
  '/profile',
  [
    body('firstName').optional().trim().isLength({ min: 2 }),
    body('lastName').optional().trim().isLength({ min: 2 }),
    body('phone').optional().matches(/^[0-9]{10}$/),
    body('monthlyIncome').optional().isFloat({ min: 0 }),
  ],
  customerController.updateProfile
);

/**
 * GET /api/customers/loans
 * Get customer's loan applications and active loans
 */
router.get('/loans', customerController.getMyLoans);

/**
 * GET /api/customers/dashboard
 * Get customer dashboard with statistics
 */
router.get('/dashboard', customerController.getDashboard);

/**
 * POST /api/customers/verify-kyc
 * Submit KYC documents
 */
router.post(
  '/verify-kyc',
  [
    body('aadharNumber')
      .optional()
      .matches(/^[0-9]{12}$/)
      .withMessage('Aadhar must be 12 digits'),
    body('panNumber')
      .optional()
      .matches(/^[A-Z0-9]{10}$/)
      .withMessage('PAN must be 10 alphanumeric characters'),
  ],
  customerController.submitKYC
);

module.exports = router;
