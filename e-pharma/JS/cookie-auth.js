// Cookie-based authentication helper
console.log("🍪 Cookie Auth Helper loaded");

// Function to check if we're logged in with a cookie
function isLoggedInWithCookie() {
  // We can't directly check for httpOnly cookies in JavaScript
  // So we'll make a small API request to check if we're authenticated
  
  return new Promise(async (resolve) => {
    try {
      // Try to fetch a protected endpoint
      const response = await fetch('http://localhost:5000/api/users/profile', {
        method: 'GET',
        credentials: 'include' // Important to include cookies
      });
      
      // If response is 200, we're logged in
      if (response.ok) {
        const userData = await response.json();
        console.log("🍪 Successfully authenticated via cookie");
        console.log("🍪 User data:", userData);
        
        // Save user data to localStorage for easy access by other scripts
        if (userData.data) {
          localStorage.setItem('user_info', JSON.stringify(userData.data));
          
          // Also set a marker that we're logged in
          localStorage.setItem('e_pharma_auth_token', 'cookie_auth_' + Date.now());
          
          resolve(true);
          return;
        }
      }
      
      // If we get here, we're not logged in
      console.log("🍪 Not authenticated via cookie");
      resolve(false);
    } catch (error) {
      console.error("🍪 Error checking cookie auth:", error);
      resolve(false);
    }
  });
}

// Function to log in user with cookie auth
async function loginWithCookie(email, password) {
  try {
    console.log("🍪 Attempting cookie login for:", email);
    
    // Make login request to server
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Important to include cookies
    });
    
    // Parse response
    const data = await response.json();
    
    if (!response.ok) {
      console.error("🍪 Login failed:", data);
      return { success: false, error: data.message || "Login failed" };
    }
    
    console.log("🍪 Login successful:", data);
    
    // Helper function to set user login info
    function setUserData(userData) {
      if (!userData) return false;
      
      console.log('🍪 COOKIE AUTH: Setting user data for:', userData.email);
      
      // Clear existing user data
      localStorage.removeItem('user_info');
      localStorage.removeItem('e_pharma_user_profile');
      
      // Create a timestamp-based token if one doesn't exist
      localStorage.setItem('e_pharma_auth_token', 'cookie_auth_token_' + Date.now());
      
      // ALWAYS use the role directly from the database response
      // If present in the response data, log it
      if (userData.role) {
        console.log(`🍪 COOKIE AUTH: User role from database: ${userData.role}`);
        // Force lowercase for consistency in role checks
        userData.role = userData.role.toLowerCase();
        console.log(`🍪 COOKIE AUTH: Normalized role to lowercase: ${userData.role}`);
      } else {
        // Only if no role exists in the database response, use default role
        console.log('🍪 COOKIE AUTH: No role in database response, using default role');
        userData.role = 'patient';
      }
      
      // Ensure we prioritize fresh data over anything cached
      console.log('🍪 COOKIE AUTH: Updating user info with latest database values');
      
      // Store user info
      localStorage.setItem('user_info', JSON.stringify(userData));
      
      console.log('🍪 COOKIE AUTH: User data stored successfully');
      return true;
    }
    
    // Store user data in localStorage
    if (data.data) {
      setUserData(data.data);
      
      // Direct admin redirection - add it here to ensure it always runs
      try {
        const userInfo = JSON.parse(localStorage.getItem('user_info'));
        if (userInfo && userInfo.role === 'admin') {
          console.log('🍪 COOKIE AUTH: Admin user detected, redirecting to admin dashboard');
          // Use setTimeout to ensure this runs after other code has completed
          setTimeout(() => {
            window.location.href = 'admin.html';
          }, 100);
          return { success: true, redirecting: true };
        }
      } catch (e) {
        console.error('🍪 COOKIE AUTH: Error checking admin role:', e);
      }
    } else {
      // If no user data, create a minimal version
      const userInfo = {
        email: email,
        name: email.split('@')[0],
        lastLogin: new Date().toISOString()
      };
      localStorage.setItem('user_info', JSON.stringify(userInfo));
      localStorage.setItem('e_pharma_auth_token', 'cookie_auth_' + Date.now());
    }
    
    return { success: true, data: data.data };
  } catch (error) {
    console.error("🍪 Login error:", error);
    return { success: false, error: error.message || "Network error" };
  }
}

// Function to log out user
async function logoutWithCookie() {
  try {
    // Make logout request to server
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'GET',
      credentials: 'include' // Important to include cookies
    });
    
    // Clear local storage
    localStorage.removeItem('user_info');
    localStorage.removeItem('e_pharma_user_profile');
    localStorage.removeItem('e_pharma_auth_token');
    
    return true;
  } catch (error) {
    console.error("🍪 Logout error:", error);
    return false;
  }
}

// Check login status on load
document.addEventListener('DOMContentLoaded', async () => {
  console.log("🍪 Checking login status");
  await isLoggedInWithCookie();
});

// Export functions
window.isLoggedInWithCookie = isLoggedInWithCookie;
window.loginWithCookie = loginWithCookie;
window.logoutWithCookie = logoutWithCookie;
