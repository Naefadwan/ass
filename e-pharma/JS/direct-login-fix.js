// Direct login fix that works with the server's cookie authentication
console.log("🔑 Direct Login Fix loaded");

document.addEventListener('DOMContentLoaded', () => {
  // Find the login form
  const loginForm = document.getElementById('loginForm');
  
  if (loginForm) {
    console.log("🔑 Found login form, attaching direct login handler");
    
    // Add our own submit handler
    loginForm.addEventListener('submit', async function(e) {
      // Prevent default form submission
      e.preventDefault();
      
      // Get login credentials
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      
      // Show loading state if elements exist
      const buttonText = document.getElementById("buttonText");
      const spinner = document.getElementById("spinner");
      const errorMessage = document.getElementById("errorMessage");
      
      if (buttonText) buttonText.classList.add("hidden");
      if (spinner) spinner.classList.remove("hidden");
      if (errorMessage) {
        errorMessage.textContent = "";
        errorMessage.classList.add("hidden");
      }
      
      try {
        // Use our cookie-based login function
        const result = await window.loginWithCookie(email, password);
        
        if (result.success) {
          console.log("🔑 Login successful, checking for redirects");
          
          // Get user info and check role for appropriate redirect
          const userInfo = JSON.parse(localStorage.getItem('user_info'));
          const redirectPath = sessionStorage.getItem('login_redirect');
          const userRole = userInfo?.role?.toLowerCase();
          
          console.log("🔑 User role from database:", userRole);
          
          // Check if user is an admin - if so, always redirect to admin dashboard
          if (userRole === 'admin') {
            console.log("🔑 Admin login detected, redirecting to admin dashboard");
            window.location.href = "admin.html";
          } 
          // If there's a specific redirect path and user is not admin
          else if (redirectPath) {
            console.log("🔑 Redirecting to:", redirectPath);
            window.location.href = redirectPath;
            // Clear the redirect
            sessionStorage.removeItem('login_redirect');
          } 
          // Default redirect for patients
          else {
            console.log("🔑 Patient login detected, redirecting to home");
            window.location.href = "home2.html";
          }
        } else {
          // Show error
          if (errorMessage) {
            errorMessage.textContent = result.error || "Login failed";
            errorMessage.classList.remove("hidden");
          }
          console.error("🔑 Login failed:", result.error);
        }
      } catch (error) {
        // Show error
        if (errorMessage) {
          errorMessage.textContent = error.message || "An error occurred";
          errorMessage.classList.remove("hidden");
        }
        console.error("🔑 Login error:", error);
      } finally {
        // Reset button state
        if (buttonText) buttonText.classList.remove("hidden");
        if (spinner) spinner.classList.add("hidden");
      }
    });
    
    console.log("🔑 Direct login handler attached");
  } else {
    console.log("🔑 Login form not found");
  }
});
