// Role-based access control middleware
module.exports = function(requiredRoles = []) {
  return function(req, res, next) {
    // If no roles specified, allow anyone
    if (!requiredRoles.length) return next();
    // Must be authenticated
    if (!req.user || !req.user.role) {
      return res.status(401).json({ success: false, error: 'Not authenticated' });
    }
    // Allow if user has one of the required roles
    if (requiredRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ success: false, error: 'Forbidden: insufficient role' });
  };
};
