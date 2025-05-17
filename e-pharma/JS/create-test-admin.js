// Create Test Admin Account
// This script is for development purposes only
// It creates a test admin account in localStorage

console.log("🔑 ADMIN TEST: Creating test admin account");

function createTestAdminAccount() {
  // Check if we already have an admin account
  let userInfo = null;
  try {
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      userInfo = JSON.parse(userInfoStr);
      
      // If this user is already an admin, no need to recreate
      if (userInfo.role?.toLowerCase() === 'admin') {
        console.log("🔑 ADMIN TEST: Admin account already exists", userInfo);
        return userInfo;
      }
    }
  } catch (e) {
    console.error("🔑 ADMIN TEST: Error parsing user info:", e);
  }
  
  // Create admin user data with the role matching your database column
  const adminUser = {
    name: "Admin User",
    email: "admin@epharma.com",
    role: "admin", // This should match the exact value in your database role column
    id: "admin_" + Date.now()
  };
  
  // Store in localStorage
  localStorage.setItem('user_info', JSON.stringify(adminUser));
  
  // Create auth token
  const token = 'admin_token_' + Date.now();
  localStorage.setItem('e_pharma_auth_token', token);
  
  console.log("🔑 ADMIN TEST: Admin account created", adminUser);
  
  // Return the created admin user
  return adminUser;
}

// Access this globally
window.createTestAdminAccount = createTestAdminAccount;

// Auto-create admin by default for development
document.addEventListener('DOMContentLoaded', function() {
  // Add a button to the page to create an admin account
  const adminButton = document.createElement('button');
  adminButton.className = 'create-admin-btn';
  adminButton.textContent = 'Create Test Admin';
  adminButton.style.position = 'fixed';
  adminButton.style.bottom = '20px';
  adminButton.style.right = '20px';
  adminButton.style.padding = '10px 15px';
  adminButton.style.backgroundColor = '#dc3545';
  adminButton.style.color = 'white';
  adminButton.style.border = 'none';
  adminButton.style.borderRadius = '5px';
  adminButton.style.cursor = 'pointer';
  adminButton.style.zIndex = '9999';
  
  adminButton.addEventListener('click', function() {
    const adminUser = createTestAdminAccount();
    
    // Reload current page if we're on admin.html to trigger the auth check
    if (window.location.pathname.includes('admin.html')) {
      window.location.reload();
    } else {
      // Otherwise offer to redirect
      if (confirm('Admin account created. Go to admin dashboard?')) {
        window.location.href = 'admin.html';
      }
    }
  });
  
  document.body.appendChild(adminButton);
});
