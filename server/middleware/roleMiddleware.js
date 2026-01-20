/**
 * Role-Based Access Control (RBAC) Middleware
 * Validates admin permissions for specific operations
 */

/**
 * Check if admin has specific permission
 * @param {string} permission - Permission to check
 * @returns {function} - Middleware function
 */
const checkPermission = (permission) => {
  return async (req, res, next) => {
    try {
      // Verify token first
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Authorization required.',
        });
      }

      // Get admin from database to check current permissions
      const Admin = require('../models/Admin');
      const admin = await Admin.findById(req.user.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found.',
        });
      }

      if (admin.accountStatus !== 'active') {
        return res.status(403).json({
          success: false,
          message: 'Admin account is inactive.',
        });
      }

      // Map permission names to check
      const permissionMap = {
        'approve-loans': 'canApproveLoans',
        'verify-kyc': 'canVerifyKYC',
        'manage-admins': 'canManageAdmins',
        'view-analytics': 'canViewAnalytics',
        'manage-customers': 'canManageCustomers',
      };

      const permissionField = permissionMap[permission];

      if (!admin.permissions[permissionField]) {
        return res.status(403).json({
          success: false,
          message: `You do not have permission to ${permission}.`,
        });
      }

      req.admin = admin;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Permission check failed.',
        error: error.message,
      });
    }
  };
};

module.exports = {
  checkPermission,
};
