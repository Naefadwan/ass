// Admin Access Control
// This script ensures only users with admin role can access the admin dashboard
console.log("👑 ADMIN AUTH: Script loaded");

document.addEventListener('DOMContentLoaded', function() {
  console.log("👑 ADMIN AUTH: Checking admin access");

  // Function to check if current user has admin role
  function checkAdminAccess() {
    // Get authentication token
    const token = localStorage.getItem('e_pharma_auth_token');
    if (!token) {
      console.log("👑 ADMIN AUTH: No auth token found, redirecting to login");
      redirectToLogin("You must be logged in to access the admin dashboard");
      return false;
    }

    // Get user info
    let userInfo = null;
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
      }
    } catch (e) {
      console.error("👑 ADMIN AUTH: Error parsing user info:", e);
    }

    // Check if user exists and has admin role
    if (!userInfo) {
      console.log("👑 ADMIN AUTH: No user info found, redirecting to login");
      redirectToLogin("You must be logged in to access the admin dashboard");
      return false;
    }

    // Check user role from the database
    const role = userInfo.role?.toLowerCase();
    console.log("👑 ADMIN AUTH: User role from database:", role);
    
    // Only allow access if role is explicitly 'admin'
    if (role !== 'admin') {
      console.log("👑 ADMIN AUTH: User is not an admin, access denied");
      redirectToHome("Access denied: You do not have administrator privileges");
      return false;
    }

    console.log("👑 ADMIN AUTH: Admin access granted to", userInfo.name || userInfo.email);
    setupAdminDashboard(userInfo);
    return true;
  }

  // Redirect to login page with message
  function redirectToLogin(message) {
    // Store redirect message
    if (message) {
      sessionStorage.setItem('admin_redirect_message', message);
    }
    
    // Redirect to login page
    window.location.href = "login.html?redirect=admin";
  }

  // Redirect to home page with message
  function redirectToHome(message) {
    alert(message);
    window.location.href = "home2.html";
  }

  // Setup admin dashboard with user information
  function setupAdminDashboard(userInfo) {
    // Add admin info to the header
    const adminInfo = document.createElement('div');
    adminInfo.className = 'admin-info';
    adminInfo.innerHTML = `
      <div class="admin-badge">Admin Dashboard</div>
      <div class="admin-user">
        <span class="admin-name">${userInfo.name || userInfo.email}</span>
        <span class="admin-role">${userInfo.role || 'Administrator'}</span>
      </div>
    `;
    
    // Add to header if it exists
    const header = document.querySelector('header .container');
    if (header) {
      header.appendChild(adminInfo);
    }
    
    // Update page title to include admin indicator
    document.title = "Admin Dashboard - E-Pharma";
    
    // Make sure the auth buttons are updated
    if (typeof window.updateAuthButtons === 'function') {
      window.updateAuthButtons();
    }
  }

  // Run the access check
  checkAdminAccess();
});
