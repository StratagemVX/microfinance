/**
 * Authentication Middleware
 * Handles JWT token verification for protected routes
 * Identifies user type (customer or admin) from token
 */

const jwt = require('jsonwebtoken');

/**
 * Verify JWT token and extract user information
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next middleware function
 */
const verifyToken = (req, res, next) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Authorization denied.',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Authorization denied.',
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Token verification failed.',
    });
  }
};

/**
 * Verify customer authentication
 * Ensures the token belongs to a customer
 */
const verifyCustomer = (req, res, next) => {
  try {
    verifyToken(req, res, () => {
      if (req.user.role !== 'customer') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Customer authorization required.',
        });
      }
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Verify admin authentication
 * Ensures the token belongs to an admin
 */
const verifyAdmin = (req, res, next) => {
  try {
    verifyToken(req, res, () => {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin authorization required.',
        });
      }
      next();
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

module.exports = {
  verifyToken,
  verifyCustomer,
  verifyAdmin,
};
