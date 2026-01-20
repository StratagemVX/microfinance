/**
 * Loan Routes
 * Handles loan products and loan applications
 */

const express = require('express');
const { body } = require('express-validator');
const loanController = require('../controllers/loanController');
const { verifyToken, verifyCustomer, verifyAdmin } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * LOAN PRODUCT ROUTES
 */

/**
 * GET /api/loans
 * Get all active loan products
 * Public endpoint
 */
router.get('/', loanController.getAllLoans);

/**
 * GET /api/loans/:id
 * Get single loan product details
 * Public endpoint
 */
router.get('/:id', loanController.getLoanById);

/**
 * POST /api/loans
 * Create new loan product
 * Protected: Admin only
 */
router.post(
  '/',
  verifyToken,
  verifyAdmin,
  checkPermission('manage-customers'),
  [
    body('name').trim().isLength({ min: 3 }).withMessage('Loan name must be at least 3 characters'),
    body('description').trim().isLength({ min: 10 }),
    body('category').isIn(['personal', 'business', 'education', 'home', 'auto', 'agricultural']),
    body('minAmount').isFloat({ min: 1000 }),
    body('maxAmount').isFloat({ min: 1000 }),
    body('annualInterestRate').isFloat({ min: 0, max: 100 }),
  ],
  loanController.createLoan
);

/**
 * PUT /api/loans/:id
 * Update loan product
 * Protected: Admin only
 */
router.put(
  '/:id',
  verifyToken,
  verifyAdmin,
  checkPermission('manage-customers'),
  loanController.updateLoan
);

/**
 * LOAN APPLICATION ROUTES
 */

/**
 * POST /api/loans/apply
 * Apply for loan
 * Protected: Customer only
 */
router.post(
  '/apply',
  verifyToken,
  verifyCustomer,
  [
    body('loanId').isMongoId().withMessage('Invalid loan ID'),
    body('loanAmount').isFloat({ min: 1000 }).withMessage('Minimum loan amount is 1000'),
    body('tenureMonths').isInt({ min: 1 }).withMessage('Tenure must be at least 1 month'),
    body('purpose').trim().isLength({ min: 5 }).withMessage('Purpose must be at least 5 characters'),
  ],
  loanController.applyForLoan
);

/**
 * GET /api/loans/customer/:customerId
 * Get customer's loan applications
 * Protected: Customer or Admin
 */
router.get(
  '/customer/:customerId',
  verifyToken,
  loanController.getCustomerApplications
);

/**
 * GET /api/loans/application/:applicationId
 * Get loan application details
 * Protected: Customer or Admin
 */
router.get(
  '/application/:applicationId',
  verifyToken,
  loanController.getApplicationDetails
);

module.exports = router;
