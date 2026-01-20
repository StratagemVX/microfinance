/**
 * Admin Routes
 * Handles admin dashboard, customer management, loan approval
 */

const express = require('express');
const { body } = require('express-validator');
const adminController = require('../controllers/adminController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { checkPermission } = require('../middleware/roleMiddleware');

const router = express.Router();

/**
 * All routes are protected and admin-only
 */
router.use(verifyToken, verifyAdmin);

/**
 * GET /api/admin/dashboard
 * Get admin dashboard with analytics
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * CUSTOMER MANAGEMENT ROUTES
 */

/**
 * GET /api/admin/customers
 * Get all customers with filters
 * Requires: manage-customers permission
 */
router.get('/customers', checkPermission('manage-customers'), adminController.getAllCustomers);

/**
 * GET /api/admin/customer/:id
 * Get customer details and loan history
 * Requires: manage-customers permission
 */
router.get('/customer/:id', checkPermission('manage-customers'), adminController.getCustomerDetails);

/**
 * PUT /api/admin/customer/:id/kyc
 * Verify or reject customer KYC
 * Requires: verify-kyc permission
 */
router.put(
  '/customer/:id/kyc',
  checkPermission('verify-kyc'),
  [body('status').isIn(['verified', 'rejected']).withMessage('Invalid status')],
  adminController.verifyKYC
);

/**
 * LOAN APPLICATION MANAGEMENT ROUTES
 */

/**
 * GET /api/admin/applications
 * Get all loan applications with filters
 * Requires: view-analytics permission
 */
router.get('/applications', checkPermission('view-analytics'), adminController.getAllApplications);

/**
 * PUT /api/admin/application/:id/approve
 * Approve loan application
 * Requires: approve-loans permission
 */
router.put(
  '/application/:id/approve',
  checkPermission('approve-loans'),
  [body('remarks').optional().isString()],
  adminController.approveLoanApplication
);

/**
 * PUT /api/admin/application/:id/reject
 * Reject loan application
 * Requires: approve-loans permission
 */
router.put(
  '/application/:id/reject',
  checkPermission('approve-loans'),
  [body('reason').trim().isLength({ min: 5 }).withMessage('Reason must be at least 5 characters')],
  adminController.rejectLoanApplication
);

/**
 * PUT /api/admin/application/:id/activate
 * Activate approved loan (start EMI cycle)
 * Requires: approve-loans permission
 */
router.put('/application/:id/activate', checkPermission('approve-loans'), adminController.activateLoan);

module.exports = router;
