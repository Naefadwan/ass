// Client-side validation helper for E-Pharma
// Add to registration and profile forms

/**
 * Validates a password against strong password requirements
 * @param {string} password - The password to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validatePassword(password) {
  const validations = [
    { test: password.length >= 8, message: 'Password must be at least 8 characters' },
    { test: /[A-Z]/.test(password), message: 'Password must contain at least one uppercase letter' },
    { test: /[a-z]/.test(password), message: 'Password must contain at least one lowercase letter' },
    { test: /[0-9]/.test(password), message: 'Password must contain at least one number' },
    { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), message: 'Password must contain at least one special character' }
  ];
  
  for (const validation of validations) {
    if (!validation.test) {
      return { valid: false, message: validation.message };
    }
  }
  
  return { valid: true, message: 'Password is valid' };
}

/**
 * Validates a username against username requirements
 * @param {string} username - The username to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validateUsername(username) {
  if (!username) {
    return { valid: false, message: 'Username is required' };
  }
  
  if (username.length < 3 || username.length > 30) {
    return { valid: false, message: 'Username must be between 3 and 30 characters' };
  }
  
  if (!/^[A-Za-z0-9_]+$/.test(username)) {
    return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
  }
  
  return { valid: true, message: 'Username is valid' };
}

/**
 * Validates a national number against requirements
 * @param {string} nationalNumber - The national number to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validateNationalNumber(nationalNumber) {
  if (!nationalNumber) {
    return { valid: false, message: 'National number is required' };
  }
  
  if (nationalNumber.length < 5 || nationalNumber.length > 20) {
    return { valid: false, message: 'National number must be between 5 and 20 characters' };
  }
  
  if (!/^[A-Za-z0-9\-]+$/.test(nationalNumber)) {
    return { valid: false, message: 'National number must contain only letters, numbers, and hyphens' };
  }
  
  return { valid: true, message: 'National number is valid' };
}

/**
 * Validates a phone number
 * @param {string} phone - The phone number to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validatePhone(phone) {
  if (!phone) {
    return { valid: false, message: 'Phone number is required' };
  }
  
  // Simple validation - adjust according to your country's phone format
  if (!/^\d{7,15}$/.test(phone.replace(/[\s\-\(\)]/g, ''))) {
    return { valid: false, message: 'Please enter a valid phone number' };
  }
  
  return { valid: true, message: 'Phone number is valid' };
}

/**
 * Validates an email address
 * @param {string} email - The email to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validateEmail(email) {
  if (!email) {
    return { valid: false, message: 'Email is required' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, message: 'Please enter a valid email address' };
  }
  
  return { valid: true, message: 'Email is valid' };
}

/**
 * Validates a security question against requirements
 * @param {string} question - The security question to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validateSecurityQuestion(question) {
  if (!question) {
    return { valid: false, message: 'Security question is required' };
  }
  
  if (question.length < 5) {
    return { valid: false, message: 'Security question must be at least 5 characters' };
  }
  
  return { valid: true, message: 'Security question is valid' };
}

/**
 * Validates a security answer against requirements
 * @param {string} answer - The security answer to validate
 * @returns {Object} - Validation result with success status and error message
 */
function validateSecurityAnswer(answer) {
  if (!answer) {
    return { valid: false, message: 'Security answer is required' };
  }
  
  if (answer.length < 2) {
    return { valid: false, message: 'Security answer must be at least 2 characters' };
  }
  
  return { valid: true, message: 'Security answer is valid' };
}

// Make validation functions available
window.validatePassword = validatePassword;
window.validateUsername = validateUsername;
window.validateNationalNumber = validateNationalNumber;
window.validatePhone = validatePhone;
window.validateEmail = validateEmail;
window.validateSecurityQuestion = validateSecurityQuestion;
window.validateSecurityAnswer = validateSecurityAnswer;
