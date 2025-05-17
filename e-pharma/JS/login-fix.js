// Login fix helper - this ensures proper user data is saved during login
console.log("⭐ LOGIN FIX: Script loaded");

// This script runs after login.js but before redirecting to clean up user data

// Wait for document to be ready
document.addEventListener('DOMContentLoaded', () => {
  console.log("⭐ LOGIN FIX: Document ready");
  
  // Find the login form
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    console.log("⭐ LOGIN FIX: Found login form, attaching login helper");
    
    // Intercept the login form submission
    const originalSubmitEvent = loginForm.onsubmit;
    
    loginForm.addEventListener('submit', async function(e) {
      // Clear existing login data to force a fresh login
      console.log("⭐ LOGIN FIX: Clearing existing login data to ensure fresh login");
      localStorage.removeItem('e_pharma_auth_token');
      localStorage.removeItem('user_info');
      localStorage.removeItem('e_pharma_user_profile');
      
      // Let the original handler run first
      // The actual login happens in login.js
      
      // Wait a short time to ensure login.js has processed the form
      setTimeout(() => {
        const email = document.getElementById('email')?.value;
        const loginToken = localStorage.getItem('e_pharma_auth_token');
        
        if (loginToken) {
          console.log("⭐ LOGIN FIX: Login successful, token found");
          
          // Check if we have proper user data
          let userInfo = null;
          try {
            userInfo = JSON.parse(localStorage.getItem('user_info'));
          } catch (e) {
            console.log("⭐ LOGIN FIX: Error parsing user info", e);
          }
          
          // If no user data found but we have a token, create basic user data
          if (!userInfo && email) {
            console.log("⭐ LOGIN FIX: Creating basic user data for", email);
            
            // Create basic user data
            const basicUserInfo = {
              name: email.split('@')[0], // Use part of email as name
              email: email,
              role: 'patient', // Default role for new users - use 'patient' to match database column  
              id: 'user_' + Date.now(),
              lastLogin: new Date().toISOString()
            };
            
            // Clear any old data first
            localStorage.removeItem('e_pharma_user_profile');
            
            // Save the new user data
            localStorage.setItem('user_info', JSON.stringify(basicUserInfo));
            console.log("⭐ LOGIN FIX: Saved basic user data:", basicUserInfo);
          }
          
          // Redirect based on user role after successful login
          redirectBasedOnRole();
        }
      }, 100); // Short timeout to run after login.js
      
      // Function to redirect users based on their role
      function redirectBasedOnRole() {
        try {
          // Check if we have user info
          const userInfoStr = localStorage.getItem('user_info');
          if (!userInfoStr) return;
          
          const userInfo = JSON.parse(userInfoStr);
          // Force lowercase comparison and log the exact value for debugging
          const userRole = userInfo?.role?.toLowerCase();
          
          console.log("⭐ LOGIN FIX: Checking role for redirect - Role value:", userInfo?.role);
          console.log("⭐ LOGIN FIX: Normalized role (lowercase):", userRole);
          console.log("⭐ LOGIN FIX: Full user object:", JSON.stringify(userInfo));
          
          // Admin users go to admin dashboard
          if (userRole === 'admin') {
            console.log("⭐ LOGIN FIX: Admin user detected, redirecting to admin dashboard");
            // Use window.location.replace to ensure a complete redirect
            window.location.replace("admin.html");
          }
          // Regular patients go to home page
          else {
            console.log("⭐ LOGIN FIX: Regular user detected, redirecting to home");
            window.location.replace("home2.html");
          }
        } catch (e) {
          console.error("⭐ LOGIN FIX: Error during role-based redirect:", e);
          // Fallback to home page
          window.location.href = "home2.html";
        }
      }
    });
    
    console.log("⭐ LOGIN FIX: Login form interceptor attached");
  } else {
    console.log("⭐ LOGIN FIX: Login form not found");
  }
});
