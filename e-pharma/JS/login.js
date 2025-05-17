// Import authentication functions from auth.js
import { login, getToken, isDevelopmentMode } from '../js/auth.js';
import { ERROR_MESSAGES } from '../js/config.js';

document.addEventListener("DOMContentLoaded", () => {
  const prefillEmail = localStorage.getItem("prefillEmail");
  if (prefillEmail) {
    const emailInput = document.getElementById("login-email");
    if (emailInput) {
      emailInput.value = prefillEmail;
      localStorage.removeItem("prefillEmail");
    }
  }
});

document.addEventListener("DOMContentLoaded", () => {
  console.log('Login script loaded');
  
  // Check if user is already logged in
  if (getToken()) {
    // User is already logged in, redirect to dashboard
    console.log('User already logged in, redirecting to dashboard');
    window.location.href = "home2.html";
    return;
  }

  // Get elements from the DOM - match these with your HTML
  const loginForm = document.getElementById("loginForm");
  const errorMessage = document.getElementById("errorMessage");
  const buttonText = document.getElementById("buttonText");
  const spinner = document.getElementById("spinner");
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  // Password visibility toggle
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
      passwordInput.setAttribute("type", type);
      
      // Toggle icon
      togglePassword.classList.toggle("fa-eye");
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }

  // Login form submission
  if (loginForm) {
    console.log('Login form found');
    
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      console.log('Login form submitted');
      
      // Get form values
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      
      console.log('Attempting login for:', email);
      
      // Clear previous errors
      if (errorMessage) {
        errorMessage.textContent = "";
        errorMessage.classList.add("hidden");
      }
      
      // Show loading state
      if (buttonText) buttonText.classList.add("hidden");
      if (spinner) spinner.classList.remove("hidden");
      
      try {
        // Development mode bypass for testing
        if (isDevelopmentMode() && 
            (email === 'test@example.com' || email === 'Naefsa@ss') &&
            (password === 'testpassword' || password === 'password')) {
          console.log('DEVELOPMENT MODE: Using test account');
          
          // Simulate delay
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Store fake token
          const testToken = 'test_token_' + Date.now();
          localStorage.setItem('e_pharma_auth_token', testToken);
          
          // Redirect to dashboard
          window.location.href = "home2.html";
          return;
        }
        
        // Check for demo account (for development only)
        if (email === "demo@example.com" && password === "password") {
          console.warn("Using demo account - not secure for production!");
          // Store a fake token
          localStorage.setItem("e_pharma_auth_token", "demo_token_" + Date.now());
          // Also save user profile data
          const userProfile = {
            "id": "user123",
            "name": "Test User",
            "email": "demo@example.com",
            "role": "customer",
            "avatar": null,
            "memberSince": "April 2023",
            "lastLogin": new Date().toISOString()
          };
          localStorage.setItem("user_info", JSON.stringify(userProfile));
          // Redirect to dashboard
          window.location.href = "home2.html";
          return;
        }
        
        // Make actual API call
        const userData = await login(email, password);
        
        // IMPORTANT: Clear any existing test user data from localStorage
        localStorage.removeItem('user_info');
        localStorage.removeItem('e_pharma_user_profile');
        
        // Store the real user data from the login response
        if (userData && userData.token) {
          localStorage.setItem('e_pharma_auth_token', userData.token);
          
          // Store user profile if available
          if (userData.user) {
            localStorage.setItem('user_info', JSON.stringify(userData.user));
            console.log('Stored real user data:', userData.user);
          }
        }
        
        console.log('Login successful, redirecting');
        // If successful, redirect to dashboard
        window.location.href = "home2.html";
        
      } catch (error) {
        console.error("Login error:", error);
        
        // Display error message
        if (errorMessage) {
          errorMessage.textContent = error.message || ERROR_MESSAGES.LOGIN_FAILED;
          errorMessage.classList.remove("hidden");
        }
      } finally {
        // Reset button state
        if (buttonText) buttonText.classList.remove("hidden");
        if (spinner) spinner.classList.add("hidden");
      }
    });
  } else {
    console.error('Login form not found');
  }
});