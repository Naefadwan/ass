// Final user authentication helper
// This script ensures consistent user authentication across all pages
console.log("🔒 FINAL AUTH: Script loaded");

document.addEventListener('DOMContentLoaded', function() {
  console.log("🔒 FINAL AUTH: Checking auth state");
  
  // Clear any leftover test auth
  function clearTestAuth() {
    // Remove any test-specific data
    if (localStorage.getItem('user_info') && 
        JSON.parse(localStorage.getItem('user_info'))?.name === "Test User") {
      console.log("🔒 FINAL AUTH: Removing test user data");
      localStorage.removeItem('user_info');
    }
    
    // Remove old data storage key
    if (localStorage.getItem('e_pharma_user_profile')) {
      console.log("🔒 FINAL AUTH: Removing old e_pharma_user_profile key");
      localStorage.removeItem('e_pharma_user_profile');
    }
  }
  
  // Add a visual indicator of current login state
  function showLoginStatus() {
    // Check if authenticated
    const token = localStorage.getItem('e_pharma_auth_token');
    const userInfoStr = localStorage.getItem('user_info');
    
    let userInfo = null;
    if (userInfoStr) {
      try {
        userInfo = JSON.parse(userInfoStr);
      } catch (e) {
        console.error("🔒 FINAL AUTH: Error parsing user info:", e);
      }
    }
    
    // Create status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'login-status-indicator';
    statusDiv.style.position = 'fixed';
    statusDiv.style.top = '5px';
    statusDiv.style.right = '5px';
    statusDiv.style.zIndex = '10000';
    statusDiv.style.padding = '4px 8px';
    statusDiv.style.borderRadius = '4px';
    statusDiv.style.fontSize = '12px';
    statusDiv.style.fontFamily = 'Arial, sans-serif';
    statusDiv.style.display = 'flex';
    statusDiv.style.alignItems = 'center';
    statusDiv.style.gap = '5px';
    statusDiv.style.userSelect = 'none';
    statusDiv.style.backgroundColor = token ? '#d4edda' : '#f8d7da';
    statusDiv.style.color = token ? '#155724' : '#721c24';
    statusDiv.style.border = `1px solid ${token ? '#c3e6cb' : '#f5c6cb'}`;
    
    // Add icon
    const icon = document.createElement('span');
    icon.textContent = token ? '✓' : '✗';
    icon.style.fontWeight = 'bold';
    statusDiv.appendChild(icon);
    
    // Add text
    const text = document.createElement('span');
    if (token && userInfo) {
      text.textContent = `Logged in: ${userInfo.firstName || userInfo.username || userInfo.email || 'Unknown'}`;
    } else {
      text.textContent = 'Not logged in';
    }
    statusDiv.appendChild(text);
    
    // Add to page
    document.body.appendChild(statusDiv);
    
    // Update auth header buttons if they exist
    if (typeof window.updateAuthButtons === 'function') {
      window.updateAuthButtons();
    }
  }
  
  // Run our auth checks
  clearTestAuth();
  showLoginStatus();
});
