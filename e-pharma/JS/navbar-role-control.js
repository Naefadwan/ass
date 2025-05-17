// Navbar Role Control Script
// This script adds or removes admin navigation links based on user role
console.log("🧭 NAVBAR: Role control script loaded");

document.addEventListener('DOMContentLoaded', function() {
  console.log("🧭 NAVBAR: Checking user role for navigation options");
  
  // Add admin dashboard link to navigation for admin users
  function updateNavbarForRole() {
    try {
      // Get user info
      const userInfoStr = localStorage.getItem('user_info');
      if (!userInfoStr) return;
      
      const userInfo = JSON.parse(userInfoStr);
      const userRole = userInfo?.role?.toLowerCase();
      
      // Check if user is logged in
      const isLoggedIn = !!localStorage.getItem('e_pharma_auth_token');
      
      if (!isLoggedIn) return;
      
      console.log("🧭 NAVBAR: User role detected:", userRole);
      
      // If user is admin, add admin dashboard link
      if (userRole === 'admin') {
        addAdminNavLink();
      }
    } catch (e) {
      console.error("🧭 NAVBAR: Error checking user role:", e);
    }
  }
  
  // Add admin dashboard link to navigation
  function addAdminNavLink() {
    // Find the navigation menu
    const nav = document.querySelector('nav ul');
    if (!nav) return;
    
    // Check if admin link already exists
    if (document.querySelector('.admin-link')) return;
    
    // Create admin dashboard link
    const adminLi = document.createElement('li');
    adminLi.className = 'admin-link';
    
    const adminLink = document.createElement('a');
    adminLink.href = 'admin.html';
    adminLink.textContent = 'Admin Dashboard';
    
    // Add admin icon if available
    try {
      const adminIcon = document.createElement('i');
      adminIcon.className = 'fas fa-user-shield';
      adminIcon.style.marginRight = '5px';
      adminLink.prepend(adminIcon);
    } catch (e) {
      // Icon not crucial, continue without it
    }
    
    // Add special styling
    adminLink.style.color = '#dc3545';
    adminLink.style.fontWeight = 'bold';
    
    // Add the link to the navigation
    adminLi.appendChild(adminLink);
    nav.appendChild(adminLi);
    
    console.log("🧭 NAVBAR: Added admin dashboard link to navigation");
  }
  
  // Run the navbar update
  updateNavbarForRole();
});
