// E-Pharma Header Fix - Include this on all pages to ensure login state persists

// Function to be run immediately on script load
(function() {
  console.log("⭐ HEADER FIX: Script loaded");
  
  // Set a global variable to indicate this file is loaded
  window.headerFixLoaded = true;
  
  // Fix the auth_token detection across pages
  function fixLoginState() {
    console.log("⭐ HEADER FIX: Checking login state");
    
    // Get the current token from localStorage
    const token = localStorage.getItem('e_pharma_auth_token');
    console.log("⭐ HEADER FIX: Current token =", token);
    
    // Check if we have user info (try both keys for backward compatibility)
    let userInfo = null;
    try {
      // Try user_info first (our preferred/standard key)
      let userInfoStr = localStorage.getItem('user_info');
      
      // If not found, try e_pharma_user_profile
      if (!userInfoStr) {
        userInfoStr = localStorage.getItem('e_pharma_user_profile');
        // If found in e_pharma_user_profile, copy to user_info for consistency
        if (userInfoStr) {
          console.log("⭐ HEADER FIX: Found user data in old e_pharma_user_profile key, copying to standard key");
          localStorage.setItem('user_info', userInfoStr);
          // Also remove the old key to avoid confusion
          localStorage.removeItem('e_pharma_user_profile');
        }
      } else {
        // Always make sure we don't have duplicate data in both keys
        localStorage.removeItem('e_pharma_user_profile');
      }
      
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
        console.log("⭐ HEADER FIX: User info found:", userInfo);
      }
    } catch (e) {
      console.error("⭐ HEADER FIX: Error parsing user info:", e);
    }
    
    // If we have a token but no user info, create default user info
    if (token && !userInfo) {
      console.log("⭐ HEADER FIX: Creating default user info");
      userInfo = {
        name: 'User',
        email: 'user@example.com'
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
    }
    
    // Make login functions available globally
    window.setUserLoggedIn = function(userData) {
      console.log("⭐ HEADER FIX: Setting user logged in:", userData);
      
      // IMPORTANT: Clear any existing user data first to prevent conflicts
      localStorage.removeItem('user_info');
      localStorage.removeItem('e_pharma_user_profile');
      
      // Create a token if one doesn't exist
      const token = 'auth_token_' + Date.now();
      localStorage.setItem('e_pharma_auth_token', token);
      
      // Store user info
      localStorage.setItem('user_info', JSON.stringify(userData));
      console.log("⭐ HEADER FIX: Stored user data:", userData);
      
      // Call header update if available
      if (typeof window.updateAuthButtons === 'function') {
        window.updateAuthButtons();
      }
      
      return true;
    };
    
    // Helper function to check if user is logged in
    window.isUserLoggedIn = function() {
      const token = localStorage.getItem('e_pharma_auth_token');
      return !!token;
    };
    
    // Make logout function available globally
    window.doLogout = function() {
      console.log("⭐ HEADER FIX: Logging out");
      localStorage.removeItem('e_pharma_auth_token');
      localStorage.removeItem('user_info');
      
      // Redirect to login page
      window.location.href = '/login.html';
    };
    
    // Setup test user for debugging
    window.setupTestUser = function() {
      console.log("⭐ HEADER FIX: Setting up test user");
      const userData = {
        name: 'Test User',
        email: 'test@example.com'
      };
      window.setUserLoggedIn(userData);
      
      // Reload the page to show header changes
      window.location.reload();
    };
    
    // Fix missing logout function in header.js
    if (typeof window.logout !== 'function') {
      window.logout = window.doLogout;
    }
  }
  
  // Run immediately
  fixLoginState();
  
  // Run again when DOM is loaded
  document.addEventListener('DOMContentLoaded', fixLoginState);
  
  // Log all localStorage items on load
  console.log("⭐ HEADER FIX: All localStorage items:");
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    console.log(`- ${key}: ${localStorage.getItem(key)}`);
  }
})();
