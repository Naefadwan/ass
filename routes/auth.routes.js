console.log('[ROUTE] /api/auth loaded');

const express = require("express");
const router = express.Router();
const csrf = require('csurf');
const rateLimit = require('express-rate-limit');

// Import middleware
const { protect } = require("../middleware/authMiddleware");
const validate = require("../middleware/validate");  // Updated to use correct middleware

// Import validators from the centralized validators file
const { 
  registerValidator, 
  loginValidator, 
  patientRegisterValidator,
  doctorRegisterValidator,
  pharmacistRegisterValidator,
  adminRegisterValidator,
  updateDetailsValidator,
  updatePasswordValidator,
  resetPasswordValidator
} = require("../controllers/auth/validators");

// Import controllers
const register = require("../controllers/auth/register");
const login = require("../controllers/auth/login");
const logout = require("../controllers/auth/logout");
const getMe = require("../controllers/auth/getMe");
const updateDetails = require("../controllers/auth/updateDetails");
const updatePassword = require("../controllers/auth/updatePassword");
const forgotPassword = require("../controllers/auth/forgotPassword");
const resetPassword = require("../controllers/auth/resetPassword");
const verifySecurityQuestion = require("../controllers/auth/verifySecurityQuestion");

// Add any missing validators using express-validator
const { body } = require('express-validator');
const forgotPasswordValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
];
const verifySecurityQuestionValidator = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('securityAnswer').notEmpty().withMessage('Security answer is required'),
];

// Configure CSRF protection
const csrfProtection = csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
  }
});

// Configure rate limiters
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3 // 3 password reset requests per hour
});

const securityQuestionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts per 15 minutes
});
// Routes with debug logging
router.post("/register",
  (req, res, next) => {
    console.log('[ROUTE] /api/auth/register hit');
    next();
  },
  validate(registerValidator),  // Updated to use correct middleware format
  register
);

router.post("/login", validate(loginValidator), login);
router.get("/logout", protect, logout);
router.get("/me", protect, getMe);

// Profile update routes
router.put("/updatedetails", protect, csrfProtection, validate(updateDetailsValidator), updateDetails);
router.put("/updatepassword", protect, csrfProtection, validate(updatePasswordValidator), updatePassword);

// Password reset flow
router.post("/forgotpassword", resetPasswordLimiter, csrfProtection, validate(forgotPasswordValidator), forgotPassword);
router.put("/resetpassword/:resettoken", csrfProtection, validate(resetPasswordValidator), resetPassword);

// Security question verification
router.post("/verifysecurityquestion", securityQuestionLimiter, csrfProtection, validate(verifySecurityQuestionValidator), verifySecurityQuestion);

// CSRF token endpoint
router.get('/csrf-token', csrfProtection, (req, res) => {
  try {
    // Get the CSRF token
    const csrfToken = req.csrfToken();
    
    if (!csrfToken) {
      console.error('CSRF token generation failed');
      return res.status(500).json({
        success: false,
        error: 'Failed to generate CSRF token'
      });
    }

    // Set the CSRF token in a cookie
    res.cookie('XSRF-TOKEN', csrfToken, {
      httpOnly: false, // Needs to be accessible from JS
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send the CSRF token in the response
    res.json({
      success: true,
      csrfToken: csrfToken
    });
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add OPTIONS handler for CORS preflight
router.options('/csrf-token', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token, XSRF-TOKEN');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.status(204).end();
});

module.exports = router;
