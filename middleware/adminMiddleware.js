const ErrorResponse = require('../utils/errorResponse');

/**
 * Middleware to check if the authenticated user has admin role
 * This should be used after the authMiddleware to ensure req.user exists
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
exports.adminMiddleware = (req, res, next) => {
  // Log the access attempt for audit purposes
  console.log(`[AdminCheck] User ${req.user.id} attempting to access admin route: ${req.originalUrl}`);
  
  // Check if user exists and has admin role
  if (!req.user) {
    return next(new ErrorResponse('Authentication required for this route', 401));
  }
  
  // Check for admin role - adjust based on your role structure
  // This assumes your User model has a 'role' field that can be 'admin', 'pharmacist', etc.
  if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
    // Log unauthorized attempt
    console.warn(`[AdminCheck] Unauthorized admin access attempt by user ${req.user.id} (${req.user.email}) with role ${req.user.role}`);
    
    // Create audit log entry for security monitoring
    try {
      const AuditLog = require('../models/AuditLog');
      AuditLog.create({
        userId: req.user.id,
        action: 'UNAUTHORIZED_ADMIN_ACCESS',
        resourceType: 'AdminRoute',
        resourceId: null,
        details: JSON.stringify({
          route: req.originalUrl,
          method: req.method,
          userRole: req.user.role
        }),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      }).catch(err => console.error('Error creating audit log:', err));
    } catch (err) {
      console.error('Error with audit logging:', err);
    }
    
    return next(new ErrorResponse('Admin access required for this route', 403));
  }
  
  // If we reach here, user is an admin
  console.log(`[AdminCheck] Admin access granted to user ${req.user.id}`);
  next();
};

/**
 * Middleware to check for specific roles
 * More flexible version that accepts an array of allowed roles
 * 
 * @param {Array} roles - Array of roles allowed to access the route
 * @returns {Function} Middleware function
 */
exports.roleCheck = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Authentication required for this route', 401));
    }
    
    if (!roles.includes(req.user.role)) {
      console.warn(`[RoleCheck] Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}. Required roles: ${roles.join(', ')}`);
      return next(new ErrorResponse(`Access denied. Required role: ${roles.join(' or ')}`, 403));
    }
    
    next();
  };
};