const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// Protect routes - secure implementation
exports.protect = asyncHandler(async (req, res, next) => {
  let token;

  // DEBUG: Show all available token sources
  console.log('[AUTH] Headers:', JSON.stringify(req.headers, null, 2));
  console.log('[AUTH] Cookies:', req.cookies);

  // Check for token in headers
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(" ")[1];
    console.log('[AUTH] Using authorization header token');
  }
  // Check for token in cookies
  else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
    console.log('[AUTH] Using cookie token');
  }
  // For cross-origin requests, check for token in custom header
  else if (req.headers['x-auth-token']) {
    token = req.headers['x-auth-token'];
    console.log('[AUTH] Using x-auth-token header');
  }
  // Allow debugging with query param token (development only)
  else if (process.env.NODE_ENV === 'development' && req.query && req.query.token) {
    token = req.query.token;
    console.log('[AUTH] Using query param token (dev only)');
  }

  // DEBUG: Print the token being used
  console.log('[AUTH DEBUG] Token:', token);

  // Make sure token exists
  if (!token) {
    console.log('[AUTH DEBUG] No token found');
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // DEBUG: Print the decoded JWT payload
    console.log('[AUTH DEBUG] Decoded JWT:', decoded);

    // Check token expiration
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTimestamp) {
      console.log('[AUTH DEBUG] Token expired');
      return next(new ErrorResponse("Token expired, please login again", 401));
    }

    // Get user from the token
    const user = await User.findByPk(decoded.id);
    // DEBUG: Print user lookup result
    console.log('[AUTH DEBUG] User lookup:', user ? { id: user.id, status: user.status, email: user.email } : user);

    if (!user) {
      console.log('[AUTH DEBUG] User not found for id:', decoded.id);
      return next(new ErrorResponse("User not found", 404));
    }

    // Check if user is active
    if (user.status !== "active") {
      console.log('[AUTH DEBUG] User is not active:', user.status);
      return next(new ErrorResponse("User account is deactivated", 401));
    }

    // Add user to request
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message);
    
    // Provide specific error messages based on error type
    if (err.name === 'JsonWebTokenError') {
      return next(new ErrorResponse("Invalid authentication token", 401));
    } else if (err.name === 'TokenExpiredError') {
      return next(new ErrorResponse("Token expired, please login again", 401));
    } else {
      return next(new ErrorResponse("Authentication failed: " + err.message, 401));
    }
  }
});

// Grant access to specific roles - improved implementation
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ErrorResponse('Not authorized to access this route', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(
          `User role ${req.user.role} is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};
