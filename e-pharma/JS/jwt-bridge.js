// JWT Bridge - Aligns localStorage tokens with backend JWT format
// Place this script after header-fix.js and before any API calls

(function() {
  console.log("🔑 JWT BRIDGE: Script loaded");
  
  // Function to create a simple JWT-like token
  function createSimpleJWT(payload) {
    // Create a simple JWT structure (header.payload.signature)
    // This is a simplified version - in production, use a proper JWT library
    
    // Header - always the same for our simple JWT
    const header = {
      alg: "HS256",
      typ: "JWT"
    };
    
    // Add timestamp if not present
    if (!payload.iat) {
      payload.iat = Math.floor(Date.now() / 1000);
    }
    
    // Add expiration (24 hours)
    if (!payload.exp) {
      payload.exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60);
    }
    
    // Encode header and payload
    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    
    // Create a simple signature (this is just for format compatibility, not security)
    // In a real system, this would be cryptographically signed
    const signature = btoa("e-pharma-local-signature");
    
    // Combine all parts
    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }
  
  // Check if we need to convert the token
  function syncTokens() {
    console.log("🔑 JWT BRIDGE: Syncing tokens");
    
    // Get the current token from localStorage
    const authToken = localStorage.getItem('e_pharma_auth_token') || 
                     localStorage.getItem('cookie_auth_token') || 
                     localStorage.getItem('token');
    
    // If no token, nothing to do
    if (!authToken) {
      console.log("🔑 JWT BRIDGE: No token found");
      return;
    }
    
    // Check if it's already a JWT (has two dots)
    if (authToken.includes('.') && authToken.split('.').length === 3) {
      console.log("🔑 JWT BRIDGE: Token is already in JWT format");
      
      // Make sure we store it in jwt key as well for API calls
      localStorage.setItem('jwt', authToken);
      return;
    }
    
    // Get user info
    let userInfo = null;
    try {
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        userInfo = JSON.parse(userInfoStr);
      }
    } catch (e) {
      console.error("🔑 JWT BRIDGE: Error parsing user info:", e);
    }
    
    // Create JWT payload
    const payload = {
      // Use user info or create minimal payload
      ...(userInfo || {}),
      // Add required JWT fields
      sub: userInfo?.id || userInfo?.username || 'local-user',
      iss: 'e-pharma-client',
      aud: 'e-pharma-api',
      // Add original token as reference
      originalToken: authToken
    };
    
    // Create JWT
    const jwt = createSimpleJWT(payload);
    console.log("🔑 JWT BRIDGE: Created JWT token");
    
    // Store JWT for API calls (don't replace the original token to maintain compatibility)
    localStorage.setItem('jwt', jwt);
    localStorage.setItem('e_pharma_jwt', jwt);
  }
  
  // Function to handle login/logout to update JWT
  function setupLoginHooks() {
    // Store original functions
    const originalSetUserLoggedIn = window.setUserLoggedIn;
    const originalDoLogout = window.doLogout;
    
    // Override setUserLoggedIn
    if (typeof originalSetUserLoggedIn === 'function') {
      window.setUserLoggedIn = function(userData) {
        // Call original function
        const result = originalSetUserLoggedIn(userData);
        
        // Sync tokens
        syncTokens();
        
        return result;
      };
    }
    
    // Override doLogout
    if (typeof originalDoLogout === 'function') {
      window.doLogout = function() {
        // Clear JWT tokens first
        localStorage.removeItem('jwt');
        localStorage.removeItem('e_pharma_jwt');
        
        // Call original logout
        return originalDoLogout();
      };
    }
  }
  
  // Initialize
  function init() {
    // Run token sync
    syncTokens();
    
    // Setup login/logout hooks
    setupLoginHooks();
    
    // Expose functions globally
    window.jwtBridge = {
      syncTokens,
      createJWT: createSimpleJWT
    };
  }
  
  // Run immediately
  init();
  
  // Run again when DOM is loaded
  document.addEventListener('DOMContentLoaded', syncTokens);
})();