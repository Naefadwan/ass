// Simple header.js file for E-Pharma
// This only needs to be included on pages with class="auth-buttons" elements

// Simple check if user is logged in
function isUserLoggedIn() {
  try {
    // Check if user is logged in (token exists)  
    const token = localStorage.getItem('e_pharma_auth_token');
    console.log('Token found:', token ? 'YES' : 'NO', 'Token value:', token);
    
    // Log all localStorage items for debugging
    console.log('All localStorage items:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      console.log(`- ${key}: ${localStorage.getItem(key)}`);
    }
    
    return !!token;
  } catch (e) {
    console.error('Error checking login status:', e);
    return false;
  }
}

// Get the logout function from window or define a simple one
function logoutUser() {
  try {
    if (typeof window.logout === 'function') {
      window.logout();
    } else {
      // Simple fallback logout - remove ALL user-related localStorage items
      localStorage.removeItem('e_pharma_auth_token');
      localStorage.removeItem('AUTH_TOKEN_KEY'); // Legacy key
      localStorage.removeItem('user_info'); // Standard key
      localStorage.removeItem('e_pharma_user_profile'); // Old key
      console.log('All user data cleared during logout');
      window.location.href = './login.html';
    }
  } catch (e) {
    console.error('Error during logout:', e);
    // Last resort
    localStorage.clear();
    window.location.reload();
  }
}

// Get user information from localStorage
function getUserInfo() {
  try {
    // Try to get user info from standard key
    let userInfoStr = localStorage.getItem('user_info');
    
    // If not found, try the alternate key
    if (!userInfoStr) {
      userInfoStr = localStorage.getItem('e_pharma_user_profile');
      // If found in alternate key, also save to standard key for consistency
      if (userInfoStr) {
        console.log('Converting old e_pharma_user_profile to standard user_info key');
        localStorage.setItem('user_info', userInfoStr);
        // Remove old key to avoid confusion
        localStorage.removeItem('e_pharma_user_profile');
      }
    } else {
      // Make sure we only have one copy by removing the old key if it exists
      localStorage.removeItem('e_pharma_user_profile');
    }
    
    if (userInfoStr) {
      return JSON.parse(userInfoStr);
    }
  } catch (e) {
    console.error('Error getting user info:', e);
  }
  return { name: 'User' }; // Default user info
}

// Update the header auth buttons
function updateAuthButtons() {
  const authButtonsElements = document.querySelectorAll('.auth-buttons');
  
  if (!authButtonsElements || authButtonsElements.length === 0) {
    console.log('No .auth-buttons found in the document');
    return;
  }
  
  console.log('Found', authButtonsElements.length, '.auth-buttons elements');
  
  // Check if user is logged in
  const isLoggedIn = isUserLoggedIn();
  console.log('User logged in:', isLoggedIn);
  
  authButtonsElements.forEach(authButtons => {
    if (isLoggedIn) {
      // User is logged in - show user info and logout button
      const user = getUserInfo();
      const name = user.name || 'User';
      
      // Create a very simple display with just text and a logout button
      authButtons.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:50%;background-color:#1a73e8;color:white;display:flex;align-items:center;justify-content:center;font-weight:bold;">${name.charAt(0)}</div>
          <span style="color:white;">${name}</span>
          <button id="logoutBtn" style="background-color:white;width:100px;height:45px;border-radius:25px;color:#1a73e8;font-size: 17px;border:none;padding:5px 10px;cursor:pointer;">Logout</button>
        </div>
      `;
      
      // Add event listener to logout button
      const logoutBtn = authButtons.querySelector('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
          e.preventDefault();
          logoutUser();
        });
      }
    } else {
      // User is not logged in - show login and register buttons
      authButtons.innerHTML = `
        <a href="login.html" style="color:white;text-decoration:none;padding:6px 12px;margin-right:5px;border:1px solid white;border-radius:4px;">Login</a>
        <a href="register.html" style="background-color:white;color:#1a73e8;text-decoration:none;padding:6px 12px;border-radius:4px;">Sign Up</a>
      `;
    }
  });
}

// Set test user data (for debugging)
window.setTestUserData = function() {
  const testUser = {
    name: 'Test User',
    email: 'test@example.com'
  };
  localStorage.setItem('e_pharma_auth_token', 'test_token_' + Date.now());
  localStorage.setItem('user_info', JSON.stringify(testUser));
  updateAuthButtons();
  console.log('Test user data set');
  return 'Test user set successfully. Refresh page if needed.';
};

// Run on page load
document.addEventListener('DOMContentLoaded', updateAuthButtons);

// Make functions available to other scripts
window.updateAuthButtons = updateAuthButtons;
