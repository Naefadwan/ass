// This is an immediate fix script - run this in the console to fix your login right now

// First, let's check the current situation
console.log("🛠️ CURRENT STATE BEFORE FIXES:");
console.log("Auth Token:", localStorage.getItem('e_pharma_auth_token'));
console.log("User Info:", localStorage.getItem('user_info'));
console.log("User Profile:", localStorage.getItem('e_pharma_user_profile'));

// Function to fix the login immediately
function fixMyLogin() {
  // Step 1: See if we have a token but no user data
  const token = localStorage.getItem('e_pharma_auth_token');
  
  if (!token) {
    console.log("🛑 No auth token found. You need to log in first.");
    return false;
  }
  
  // Step 2: Check for existing user data
  let userInfo = null;
  try {
    userInfo = JSON.parse(localStorage.getItem('user_info'));
  } catch (e) {
    console.log("Error parsing user_info:", e);
  }
  
  // Also check the old key
  let oldUserInfo = null;
  try {
    oldUserInfo = JSON.parse(localStorage.getItem('e_pharma_user_profile'));
  } catch (e) {
    // Ignore error
  }
  
  // Step 3: If we have data in the old key but not the new one, transfer it
  if (!userInfo && oldUserInfo) {
    console.log("🔄 Found user data in old key, transferring to standard key");
    localStorage.setItem('user_info', JSON.stringify(oldUserInfo));
    localStorage.removeItem('e_pharma_user_profile');
    userInfo = oldUserInfo;
  }
  
  // Step 4: If we still don't have user info, create a default one
  if (!userInfo) {
    console.log("⚠️ No user info found. Creating default user info.");
    userInfo = {
      name: "Your Account",
      email: "user@example.com",
      role: "user",
      id: "user_" + Date.now(),
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('user_info', JSON.stringify(userInfo));
  }
  
  console.log("✅ Login fixed! User info:", userInfo);
  
  // Step 5: Force a page reload to apply the changes
  if (confirm("Login fixed! Do you want to reload the page to see the changes?")) {
    window.location.reload();
  }
  
  return true;
}

// Add fix button to page
document.addEventListener('DOMContentLoaded', function() {
  const fixButton = document.createElement('button');
  fixButton.textContent = 'Fix My Login Now';
  fixButton.style.position = 'fixed';
  fixButton.style.top = '20px';
  fixButton.style.left = '20px';
  fixButton.style.zIndex = '10000';
  fixButton.style.backgroundColor = '#28a745';
  fixButton.style.color = 'white';
  fixButton.style.padding = '10px 15px';
  fixButton.style.border = 'none';
  fixButton.style.borderRadius = '5px';
  fixButton.style.cursor = 'pointer';
  fixButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  
  fixButton.onclick = fixMyLogin;
  
  document.body.appendChild(fixButton);
});

// Also make the function available globally
window.fixMyLogin = fixMyLogin;

// Log instructions
console.log("👉 To fix your login manually, run fixMyLogin() in the console or click the 'Fix My Login Now' button");
