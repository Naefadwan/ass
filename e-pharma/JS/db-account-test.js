// Database account testing module
// Must be included as a module type script
import { login } from '../js/auth.js';

// Function to test login with database accounts
async function testDatabaseLogin() {
  console.log("🔍 DB LOGIN TEST: Opening database account test dialog");

  // Create modal dialog
  const modal = document.createElement('div');
  modal.style.position = 'fixed';
  modal.style.top = '0';
  modal.style.left = '0';
  modal.style.width = '100%';
  modal.style.height = '100%';
  modal.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'center';
  modal.style.zIndex = '10000';

  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.backgroundColor = 'white';
  modalContent.style.padding = '20px';
  modalContent.style.borderRadius = '5px';
  modalContent.style.width = '400px';
  modalContent.style.maxWidth = '90%';
  modalContent.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';

  // Create title
  const title = document.createElement('h3');
  title.textContent = 'Test Database Account Login';
  title.style.marginTop = '0';
  title.style.color = '#1a73e8';

  // Create form
  const form = document.createElement('form');
  
  // Email field
  const emailLabel = document.createElement('label');
  emailLabel.textContent = 'Email:';
  emailLabel.style.display = 'block';
  emailLabel.style.marginBottom = '5px';
  
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.required = true;
  emailInput.placeholder = 'Enter database account email';
  emailInput.value = 'demo@example.com'; // Prefill with a test account
  emailInput.style.width = '100%';
  emailInput.style.padding = '8px';
  emailInput.style.marginBottom = '15px';
  emailInput.style.borderRadius = '4px';
  emailInput.style.border = '1px solid #ccc';

  // Password field
  const passwordLabel = document.createElement('label');
  passwordLabel.textContent = 'Password:';
  passwordLabel.style.display = 'block';
  passwordLabel.style.marginBottom = '5px';

  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.required = true;
  passwordInput.placeholder = 'Enter password';
  passwordInput.value = 'password'; // Prefill with test password
  
  // Add suggested accounts
  const suggestedAccounts = document.createElement('div');
  suggestedAccounts.style.marginTop = '5px';
  suggestedAccounts.style.marginBottom = '10px';
  suggestedAccounts.style.fontSize = '12px';
  suggestedAccounts.style.color = '#666';
  suggestedAccounts.innerHTML = '<strong>Try these development test accounts:</strong><br>- test@example.com / testpassword<br>- Naefsa@ss / password<br>- demo@example.com / password';
  
  passwordInput.style.width = '100%';
  passwordInput.style.padding = '8px';
  passwordInput.style.marginBottom = '15px';
  passwordInput.style.borderRadius = '4px';
  passwordInput.style.border = '1px solid #ccc';

  // Result display
  const resultDiv = document.createElement('div');
  resultDiv.style.marginTop = '10px';
  resultDiv.style.padding = '10px';
  resultDiv.style.border = '1px solid #eee';
  resultDiv.style.borderRadius = '4px';
  resultDiv.style.backgroundColor = '#f9f9f9';
  resultDiv.style.display = 'none';

  // Buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.justifyContent = 'space-between';
  buttonContainer.style.marginTop = '20px';

  const cancelButton = document.createElement('button');
  cancelButton.type = 'button';
  cancelButton.textContent = 'Cancel';
  cancelButton.style.padding = '8px 16px';
  cancelButton.style.backgroundColor = '#f1f1f1';
  cancelButton.style.border = 'none';
  cancelButton.style.borderRadius = '4px';
  cancelButton.style.cursor = 'pointer';
  cancelButton.onclick = () => {
    document.body.removeChild(modal);
  };

  const testButton = document.createElement('button');
  testButton.type = 'submit';
  testButton.textContent = 'Test Login';
  testButton.style.padding = '8px 16px';
  testButton.style.backgroundColor = '#1a73e8';
  testButton.style.color = 'white';
  testButton.style.border = 'none';
  testButton.style.borderRadius = '4px';
  testButton.style.cursor = 'pointer';

  // Spinner for loading
  const spinner = document.createElement('div');
  spinner.style.display = 'none';
  spinner.style.width = '20px';
  spinner.style.height = '20px';
  spinner.style.marginRight = '10px';
  spinner.style.border = '3px solid rgba(255,255,255,.3)';
  spinner.style.borderRadius = '50%';
  spinner.style.borderTopColor = '#fff';
  spinner.style.animation = 'spin 1s linear infinite';
  
  // Add animation style
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleEl);

  // Form submission
  form.onsubmit = async (e) => {
    e.preventDefault();
    
    // Show loading state
    testButton.textContent = 'Testing...';
    testButton.disabled = true;
    testButton.prepend(spinner);
    spinner.style.display = 'inline-block';
    resultDiv.style.display = 'none';
    
    try {
      const email = emailInput.value;
      const password = passwordInput.value;
      
      console.log("🔍 DB LOGIN TEST: Testing login for:", email);
      
      // Using imported login function from auth.js
      let result;
      
      try {
        // First try the real login
        result = await login(email, password);
      } catch (connectionError) {
        // If connection refused, use mock mode
        if (connectionError.message && connectionError.message.includes('fetch')) {
          console.log("🔍 DB LOGIN TEST: Backend server not available, using mock mode");
          
          // Display warning about mock mode
          const warningDiv = document.createElement('div');
          warningDiv.style.marginBottom = '15px';
          warningDiv.style.padding = '8px';
          warningDiv.style.backgroundColor = '#fff3cd';
          warningDiv.style.borderLeft = '4px solid #ffc107';
          warningDiv.style.color = '#856404';
          warningDiv.innerHTML = '<strong>⚠️ Backend server not detected!</strong><br>Using mock mode for testing. This will create test credentials without verifying against a real database.';
          
          // Insert before result display
          modalContent.insertBefore(warningDiv, resultDiv);
          
          // Create mock successful response
          const mockToken = 'mock_db_token_' + Date.now();
          localStorage.setItem('e_pharma_auth_token', mockToken);
          
          // Create user profile
          const mockUserProfile = {
            id: 'db_' + Date.now(),
            name: email.split('@')[0] || 'Database User',
            email: email,
            role: 'customer',
            avatar: null,
            memberSince: new Date().toLocaleDateString(),
            lastLogin: new Date().toISOString()
          };
          
          localStorage.setItem('user_info', JSON.stringify(mockUserProfile));
          
          // Return mock result
          result = {
            success: true,
            user: mockUserProfile,
            token: mockToken,
            mockMode: true
          };
        } else {
          // If it's some other error, rethrow it
          throw connectionError;
        }
      }
      
      // Display success
      resultDiv.style.display = 'block';
      resultDiv.style.color = 'green';
      resultDiv.style.borderColor = '#d4edda';
      resultDiv.style.backgroundColor = '#d4edda';
      
      // Build status message
      let statusHTML = `
        <strong>Login successful! ✅</strong><br>
        User: ${result.user?.name || 'Unknown'}<br>
        Email: ${result.user?.email || email}<br>
        Token: ${localStorage.getItem('e_pharma_auth_token') ? 'Stored ✓' : 'Not stored ✗'}<br>
        User Data: ${localStorage.getItem('user_info') ? 'Stored ✓' : 'Not stored ✗'}
      `;
      
      // Add mock indicator if in mock mode
      if (result.mockMode) {
        statusHTML += `<br><strong style="color:#856404">⚠️ Using mock credentials (no server connection)</strong>`;
      }
      
      resultDiv.innerHTML = statusHTML;
      
      console.log("🔍 DB LOGIN TEST: Login successful");
      
      // Add option to redirect
      const redirectBtn = document.createElement('button');
      redirectBtn.textContent = 'Go to Dashboard';
      redirectBtn.style.marginTop = '10px';
      redirectBtn.style.padding = '8px 16px';
      redirectBtn.style.backgroundColor = '#28a745';
      redirectBtn.style.color = 'white';
      redirectBtn.style.border = 'none';
      redirectBtn.style.borderRadius = '4px';
      redirectBtn.style.cursor = 'pointer';
      redirectBtn.onclick = () => {
        window.location.href = './home2.html';
      };
      resultDiv.appendChild(redirectBtn);
      
    } catch (error) {
      // Display error
      resultDiv.style.display = 'block';
      resultDiv.style.color = '#721c24';
      resultDiv.style.borderColor = '#f8d7da';
      resultDiv.style.backgroundColor = '#f8d7da';
      resultDiv.textContent = `Error: ${error.message || 'Unknown login error'}`;
      
      console.error("🔍 DB LOGIN TEST: Login failed:", error);
    } finally {
      // Reset button state
      testButton.textContent = 'Test Login';
      testButton.disabled = false;
      spinner.style.display = 'none';
    }
  };

  // Assemble the modal
  buttonContainer.appendChild(cancelButton);
  buttonContainer.appendChild(testButton);
  
  form.appendChild(emailLabel);
  form.appendChild(emailInput);
  form.appendChild(passwordLabel);
  form.appendChild(passwordInput);
  form.appendChild(suggestedAccounts); // Add suggested accounts below password field
  form.appendChild(buttonContainer);
  
  modalContent.appendChild(title);
  modalContent.appendChild(form);
  modalContent.appendChild(resultDiv);
  
  modal.appendChild(modalContent);
  document.body.appendChild(modal);
  
  // Focus the email field
  emailInput.focus();
}

// Make the function globally available
window.testDatabaseLogin = testDatabaseLogin;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('🔍 DB-ACCOUNT-TEST: Module loaded and ready');
  
  // Add test button - since login-test.js is a regular script, it can't access module functions directly
  const dbLoginTestBtn = document.createElement('button');
  dbLoginTestBtn.textContent = 'Test DB Login';
  dbLoginTestBtn.style.position = 'fixed';
  dbLoginTestBtn.style.bottom = '10px';
  dbLoginTestBtn.style.right = '120px';
  dbLoginTestBtn.style.zIndex = '9999';
  dbLoginTestBtn.style.padding = '8px 16px';
  dbLoginTestBtn.style.background = '#34a853';
  dbLoginTestBtn.style.color = 'white';
  dbLoginTestBtn.style.border = 'none';
  dbLoginTestBtn.style.borderRadius = '4px';
  dbLoginTestBtn.style.cursor = 'pointer';
  dbLoginTestBtn.onclick = testDatabaseLogin;
  
  document.body.appendChild(dbLoginTestBtn);
});
