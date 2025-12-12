const jwt = require("jsonwebtoken");
const User = require("../models/User");

/**
 * checkAuth - Requires valid JWT token and attaches user to req.user
 * Returns 401 if token is missing, invalid, or expired
 * Returns 401 if user not found
 * Returns 403 if user is blocked
 */
const checkAuth = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication required'
        }
      });
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found'
        }
      });
    }

    // 4. Check if blocked
    if (user.isBlocked) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_BLOCKED',
          message: 'Your account has been blocked'
        }
      });
    }

    // 5. Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token'
        }
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token has expired'
        }
      });
    }
    return res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error'
      }
    });
  }
};

/**
 * optionalAuth - Attaches user if token is present, allows anonymous access
 * Does not return error if token is missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    // 1. Extract token from header
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // If no token, just continue without attaching user
    if (!token) {
      return next();
    }

    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Find user
    const user = await User.findById(decoded.userId);
    
    // If user found and not blocked, attach to request
    if (user && !user.isBlocked) {
      req.user = user;
    }
    
    // Always continue, even if token is invalid
    next();
  } catch (error) {
    // Silent fail - just continue without user
    next();
  }
};

/**
 * authorize - Role-based access control middleware
 * Must be used after checkAuth middleware
 * Returns a middleware function that checks if user has one of the allowed roles
 * 
 * @param {...string} allowedRoles - One or more role names that are allowed
 * @returns {Function} Express middleware function
 * 
 * @example
 * // Single role
 * router.get('/admin-only', checkAuth, authorize('admin'), handler);
 * 
 * // Multiple roles
 * router.post('/content', checkAuth, authorize('admin', 'moderator', 'editor'), handler);
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. Check if user is authenticated (must be called after checkAuth)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NOT_AUTHENTICATED',
          message: 'Authentication required'
        }
      });
    }

    // 2. Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to access this resource'
        }
      });
    }

    // 3. User has required role, continue
    next();
  };
};

module.exports = { 
  checkAuth, 
  optionalAuth, 
  authorize
};

