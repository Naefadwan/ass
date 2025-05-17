// Login state test script
// Add to any page with: <script src="../JS/login-test.js"></script>

// Run test when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  console.log("🔍 LOGIN TEST: Running login state test");
  
  // Display all localStorage items
  console.log("🔍 LOGIN TEST: All localStorage items:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`- ${key}: ${localStorage.getItem(key)}`);
  }
  
  // Check login state with both methods
  const token1 = localStorage.getItem('auth_token');
  const token2 = localStorage.getItem('e_pharma_auth_token');
  
  console.log("🔍 LOGIN TEST: auth_token =", token1);
  console.log("🔍 LOGIN TEST: e_pharma_auth_token =", token2);
  
  // Check user info with both methods
  let userInfo1 = null;
  let userInfo2 = null;
  
  try {
    const userInfoStr1 = localStorage.getItem('user_info');
    if (userInfoStr1) {
      userInfo1 = JSON.parse(userInfoStr1);
    }
    
    const userInfoStr2 = localStorage.getItem('e_pharma_user_profile');
    if (userInfoStr2) {
      userInfo2 = JSON.parse(userInfoStr2);
    }
  } catch (e) {
    console.error("🔍 LOGIN TEST: Error parsing user info:", e);
  }
  
  console.log("🔍 LOGIN TEST: user_info =", userInfo1);
  console.log("🔍 LOGIN TEST: e_pharma_user_profile =", userInfo2);
  
  // Add easy login function to window for testing
  // Standard test login with mock data
window.testLogin = function() {
    console.log("🔍 LOGIN TEST: Setting up test login");
    
    const token = "test_token_" + Date.now();
    const userProfile = {
      "id": "test123",
      "name": "Test User",
      "email": "test@example.com",
      "role": "customer",
      "avatar": null,
      "memberSince": "May 2025",
      "lastLogin": new Date().toISOString()
    };
    
    localStorage.setItem('e_pharma_auth_token', token);
    localStorage.setItem('user_info', JSON.stringify(userProfile));
    
    console.log("🔍 LOGIN TEST: Test login complete - reload page to see effect");
    setTimeout(() => window.location.reload(), 1000);
  };
  
  // Add button for easy testing
  const loginTestBtn = document.createElement('button');
  loginTestBtn.textContent = 'Test Login';
  loginTestBtn.style.position = 'fixed';
  loginTestBtn.style.bottom = '10px';
  loginTestBtn.style.right = '10px';
  loginTestBtn.style.zIndex = '9999';
  loginTestBtn.style.padding = '8px 16px';
  loginTestBtn.style.background = '#1a73e8';
  loginTestBtn.style.color = 'white';
  loginTestBtn.style.border = 'none';
  loginTestBtn.style.borderRadius = '4px';
  loginTestBtn.style.cursor = 'pointer';
  loginTestBtn.onclick = window.testLogin;
  
  document.body.appendChild(loginTestBtn);
  
  // If no tokens but user profiles exist, automatically fix by creating token
  if ((localStorage.getItem('user_info') || localStorage.getItem('e_pharma_user_profile')) && 
      !localStorage.getItem('e_pharma_auth_token')) {
    console.log("🔍 LOGIN TEST: Found user profile but no token - fixing...");
    localStorage.setItem('e_pharma_auth_token', 'auto_fixed_token_' + Date.now());
    console.log("🔍 LOGIN TEST: Token created, refresh page to see effect");
  }
  
  // The DB login button is now created in db-account-test.js
});

// Also create a global function for manual testing from console
window.testLoginState = function() {
  const token = localStorage.getItem('e_pharma_auth_token');
  const userInfo = localStorage.getItem('user_info');
  console.log("Login State Check:");
  console.log("- Token exists:", !!token);
  console.log("- User info exists:", !!userInfo);
  return !!token && !!userInfo;
};
