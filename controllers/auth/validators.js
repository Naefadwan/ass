const { body, check } = require('express-validator');

// Common validation rules
const passwordValidation = body('password')
  .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/).withMessage('Password must contain at least one number')
  .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')
  .trim()
  .escape();

const emailValidation = body('email')
  .isEmail().withMessage('Valid email is required')
  .normalizeEmail()
  .trim()
  .escape();

const usernameValidation = body('username')
  .notEmpty().withMessage('Username is required')
  .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
  .matches(/^[A-Za-z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores')
  .trim()
  .escape();

// Base registration validators for all users
const baseRegistrationValidators = [
  body('firstName')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .matches(/^[A-Za-z\s\-']+$/).withMessage('First name must contain only letters, spaces, hyphens, and apostrophes')
    .trim()
    .escape(),
    
  body('lastName')
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[A-Za-z\s\-']+$/).withMessage('Last name must contain only letters, spaces, hyphens, and apostrophes')
    .trim()
    .escape(),
    
  body('nationalNumber')
    .notEmpty().withMessage('National number is required')
    .isLength({ min: 5, max: 20 }).withMessage('National number must be between 5 and 20 characters')
    .matches(/^[A-Za-z0-9\-]+$/).withMessage('National number must contain only letters, numbers, and hyphens')
    .trim()
    .escape(),
    
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Please enter a valid phone number')
    .trim()
    .escape(),
    
  body('gender')
    .notEmpty().withMessage('Gender is required')
    .isIn(['male', 'female', 'other']).withMessage('Gender must be male, female, or other')
    .trim()
    .escape(),
    
  emailValidation,
  passwordValidation,
  usernameValidation,
  
  body('securityQuestion')
    .notEmpty().withMessage('Security question is required')
    .isLength({ min: 5 }).withMessage('Security question must be at least 5 characters')
    .trim()
    .escape(),
    
  body('securityAnswer')
    .notEmpty().withMessage('Security answer is required')
    .isLength({ min: 2 }).withMessage('Security answer must be at least 2 characters')
    .trim()
    .escape(),
    
  body('role')
    .optional()
    .isIn(['patient', 'doctor', 'pharmacist', 'admin']).withMessage('Invalid role specified')
    .trim()
    .escape()
];

// Role-specific validators
const patientValidators = [
  body('dateOfBirth')
    .optional()
    .isDate().withMessage('Date of birth must be a valid date')
    .trim(),
    
  body('allergies')
    .optional()
    .isArray().withMessage('Allergies must be an array')
];

const doctorValidators = [
  body('specialization')
    .notEmpty().withMessage('Specialization is required for doctors')
    .isLength({ min: 2, max: 100 }).withMessage('Specialization must be between 2 and 100 characters')
    .trim()
    .escape(),
    
  body('licenseNumber')
    .notEmpty().withMessage('License number is required for doctors')
    .isLength({ min: 5, max: 30 }).withMessage('License number must be between 5 and 30 characters')
    .trim()
    .escape(),
    
  body('yearsOfExperience')
    .notEmpty().withMessage('Years of experience is required for doctors')
    .isInt({ min: 0, max: 70 }).withMessage('Years of experience must be a valid number between 0 and 70')
    .trim()
    .escape()
];

const pharmacistValidators = [
  body('pharmacyName')
    .notEmpty().withMessage('Pharmacy name is required for pharmacists')
    .isLength({ min: 2, max: 100 }).withMessage('Pharmacy name must be between 2 and 100 characters')
    .trim()
    .escape(),
    
  body('licenseNumber')
    .notEmpty().withMessage('License number is required for pharmacists')
    .isLength({ min: 5, max: 30 }).withMessage('License number must be between 5 and 30 characters')
    .trim()
    .escape(),
    
  body('pharmacyAddress')
    .notEmpty().withMessage('Pharmacy address is required for pharmacists')
    .isLength({ min: 5 }).withMessage('Pharmacy address must be at least 5 characters')
    .trim()
    .escape()
];

const adminValidators = [
  body('adminCode')
    .notEmpty().withMessage('Admin verification code is required')
    .isLength({ min: 6, max: 20 }).withMessage('Admin code must be between 6 and 20 characters')
    .trim()
    .escape(),
    
  body('department')
    .notEmpty().withMessage('Department is required for admins')
    .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters')
    .trim()
    .escape()
];

// Role-based registration validation
exports.registerValidator = [
  ...baseRegistrationValidators,
  
  // Conditional validation based on role
  body()
    .custom((value, { req }) => {
      const role = req.body.role || 'patient'; // Default to patient if no role specified
      
      // Validate based on role
      switch (role) {
        case 'doctor':
          if (!req.body.specialization) {
            throw new Error('Specialization is required for doctors');
          }
          if (!req.body.licenseNumber) {
            throw new Error('License number is required for doctors');
          }
          break;
        case 'pharmacist':
          if (!req.body.pharmacyName) {
            throw new Error('Pharmacy name is required for pharmacists');
          }
          if (!req.body.licenseNumber) {
            throw new Error('License number is required for pharmacists');
          }
          break;
        case 'admin':
          if (!req.body.adminCode) {
            throw new Error('Admin verification code is required');
          }
          break;
      }
      return true;
    })
];

// Role-specific registration validators
exports.patientRegisterValidator = [...baseRegistrationValidators, ...patientValidators];
exports.doctorRegisterValidator = [...baseRegistrationValidators, ...doctorValidators];
exports.pharmacistRegisterValidator = [...baseRegistrationValidators, ...pharmacistValidators];
exports.adminRegisterValidator = [...baseRegistrationValidators, ...adminValidators];

// Login validator with enhanced security
exports.loginValidator = [
  emailValidation,
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .trim()
    .escape()
];

// Reset password validator
exports.resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required')
    .trim()
    .escape(),
  passwordValidation,
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    })
];

// Update details validator
exports.updateDetailsValidator = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters')
    .matches(/^[A-Za-z\s\-']+$/).withMessage('First name must contain only letters, spaces, hyphens, and apostrophes')
    .trim()
    .escape(),
    
  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[A-Za-z\s\-']+$/).withMessage('Last name must contain only letters, spaces, hyphens, and apostrophes')
    .trim()
    .escape(),
    
  body('phone')
    .optional()
    .isMobilePhone().withMessage('Please enter a valid phone number')
    .trim()
    .escape()
];

// Update password validator
exports.updatePasswordValidator = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required')
    .trim()
    .escape(),
    
  passwordValidation,
  
  body('confirmPassword')
    .notEmpty().withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];
