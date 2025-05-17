// Add real-time validation to registration form
document.addEventListener('DOMContentLoaded', () => {
  console.log('Registration validation loaded');
  
  // Add validation messages container after each field
  const addValidationMessage = (fieldId) => {
    const field = document.getElementById(fieldId);
    if (!field) return;
    
    let msgEl = document.getElementById(`${fieldId}-validation`);
    if (!msgEl) {
      msgEl = document.createElement('div');
      msgEl.id = `${fieldId}-validation`;
      msgEl.className = 'validation-message';
      msgEl.style.color = '#d32f2f';
      msgEl.style.fontSize = '12px';
      msgEl.style.marginTop = '4px';
      field.parentNode.appendChild(msgEl);
    }
    return msgEl;
  };
  
  // Initialize validation messages for all important fields
  ['username', 'nationalNumber', 'phone', 'email', 'reg-password', 'securityQuestion', 'securityAnswer'].forEach(addValidationMessage);
  
  // Add live validation for password
  const passwordField = document.getElementById('reg-password');
  if (passwordField) {
    const passwordMsg = document.getElementById('reg-password-validation');
    
    // Add password strength meter
    const strengthMeter = document.createElement('div');
    strengthMeter.className = 'password-strength';
    strengthMeter.style.height = '4px';
    strengthMeter.style.width = '100%';
    strengthMeter.style.backgroundColor = '#eee';
    strengthMeter.style.marginTop = '4px';
    
    const strengthIndicator = document.createElement('div');
    strengthIndicator.style.height = '100%';
    strengthIndicator.style.width = '0';
    strengthIndicator.style.backgroundColor = '#ccc';
    strengthIndicator.style.transition = 'width 0.3s, background-color 0.3s';
    
    strengthMeter.appendChild(strengthIndicator);
    passwordField.parentNode.appendChild(strengthMeter);
    
    passwordField.addEventListener('input', () => {
      const password = passwordField.value;
      
      // Calculate password strength
      let strength = 0;
      const validations = [
        { test: password.length >= 8, points: 1 },
        { test: /[A-Z]/.test(password), points: 1 },
        { test: /[a-z]/.test(password), points: 1 },
        { test: /[0-9]/.test(password), points: 1 },
        { test: /[!@#$%^&*(),.?":{}|<>]/.test(password), points: 1 }
      ];
      
      validations.forEach(validation => {
        if (validation.test) strength += validation.points;
      });
      
      // Update strength indicator
      const percentage = (strength / 5) * 100;
      strengthIndicator.style.width = `${percentage}%`;
      
      if (percentage < 40) {
        strengthIndicator.style.backgroundColor = '#f44336'; // Weak
      } else if (percentage < 80) {
        strengthIndicator.style.backgroundColor = '#ff9800'; // Medium
      } else {
        strengthIndicator.style.backgroundColor = '#4caf50'; // Strong
      }
      
      // Validate password
      if (window.validatePassword) {
        const result = window.validatePassword(password);
        passwordMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Add live validation for username
  const usernameField = document.getElementById('username');
  if (usernameField) {
    const usernameMsg = document.getElementById('username-validation');
    
    usernameField.addEventListener('input', () => {
      if (window.validateUsername) {
        const result = window.validateUsername(usernameField.value);
        usernameMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Add live validation for national number
  const nationalNumberField = document.getElementById('nationalNumber');
  if (nationalNumberField) {
    const nationalNumberMsg = document.getElementById('nationalNumber-validation');
    
    nationalNumberField.addEventListener('input', () => {
      if (window.validateNationalNumber) {
        const result = window.validateNationalNumber(nationalNumberField.value);
        nationalNumberMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Add live validation for phone
  const phoneField = document.getElementById('phone');
  if (phoneField) {
    const phoneMsg = document.getElementById('phone-validation');
    
    phoneField.addEventListener('input', () => {
      if (window.validatePhone) {
        const result = window.validatePhone(phoneField.value);
        phoneMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Add live validation for email
  const emailField = document.getElementById('email');
  if (emailField) {
    const emailMsg = document.getElementById('email-validation');
    
    emailField.addEventListener('input', () => {
      if (window.validateEmail) {
        const result = window.validateEmail(emailField.value);
        emailMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Add live validation for security question
  const securityQuestionField = document.getElementById('securityQuestion');
  if (securityQuestionField) {
    const securityQuestionMsg = document.getElementById('securityQuestion-validation');
    
    securityQuestionField.addEventListener('input', () => {
      if (window.validateSecurityQuestion) {
        const result = window.validateSecurityQuestion(securityQuestionField.value);
        securityQuestionMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Add live validation for security answer
  const securityAnswerField = document.getElementById('securityAnswer');
  if (securityAnswerField) {
    const securityAnswerMsg = document.getElementById('securityAnswer-validation');
    
    securityAnswerField.addEventListener('input', () => {
      if (window.validateSecurityAnswer) {
        const result = window.validateSecurityAnswer(securityAnswerField.value);
        securityAnswerMsg.textContent = result.valid ? '' : result.message;
      }
    });
  }
  
  // Enhanced validation before form submission
  const form = document.getElementById('registrationForm');
  if (form) {
    const originalSubmit = form.onsubmit;
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      
      // Validate all fields
      let isValid = true;
      const validations = [
        { field: 'username', validator: window.validateUsername },
        { field: 'nationalNumber', validator: window.validateNationalNumber },
        { field: 'phone', validator: window.validatePhone },
        { field: 'email', validator: window.validateEmail },
        { field: 'reg-password', validator: window.validatePassword },
        { field: 'securityQuestion', validator: window.validateSecurityQuestion },
        { field: 'securityAnswer', validator: window.validateSecurityAnswer }
      ];
      
      validations.forEach(({ field, validator }) => {
        if (validator) {
          const fieldEl = document.getElementById(field);
          const msgEl = document.getElementById(`${field}-validation`);
          
          if (fieldEl && msgEl) {
            const result = validator(fieldEl.value);
            msgEl.textContent = result.valid ? '' : result.message;
            
            if (!result.valid) {
              isValid = false;
              fieldEl.focus();
            }
          }
        }
      });
      
      // Check password confirmation
      const password = document.getElementById('reg-password').value;
      const confirmPassword = document.getElementById('confirm-password').value;
      
      if (password !== confirmPassword) {
        const confirmPasswordMsg = addValidationMessage('confirm-password');
        confirmPasswordMsg.textContent = 'Passwords do not match';
        isValid = false;
      } else {
        const confirmPasswordMsg = document.getElementById('confirm-password-validation');
        if (confirmPasswordMsg) confirmPasswordMsg.textContent = '';
      }
      
      if (isValid) {
        // If form is valid, proceed with original submission
        return originalSubmit(e);
      }
    };
  }
});
