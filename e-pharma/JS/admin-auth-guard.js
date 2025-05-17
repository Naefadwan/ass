// Admin Authentication Guard
// This script ensures that only users with admin privileges can access the admin dashboard
// Enhanced with security best practices for authentication and session management

console.log("🔒 ADMIN GUARD: Script loaded");

// Security configuration
const SECURITY_CONFIG = {
  sessionTimeoutMinutes: 30,        // Session timeout in minutes
  tokenRefreshIntervalMinutes: 15,  // Token refresh interval in minutes
  maxFailedAttempts: 5,             // Max failed login attempts before temporary lockout
  csrfTokenName: 'admin_csrf_token' // CSRF token name
};

// Security audit logging
const SecurityLogger = {
  log: function(action, details = {}) {
    const timestamp = new Date().toISOString();
    const userId = this.getCurrentUserId();
    const logEntry = {
      timestamp,
      userId,
      action,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    console.log(`🔒 SECURITY LOG: ${action}`, logEntry);
    
    // Send security log to server if API available
    if (window.AdminAPIService && window.AdminAPIService.logSecurityEvent) {
      window.AdminAPIService.logSecurityEvent(logEntry).catch(err => {
        console.error('Failed to send security log to server:', err);
      });
    }
    
    // Store locally as backup
    this.storeLocalLog(logEntry);
  },
  
  getCurrentUserId: function() {
    try {
      const userInfo = getUserInfoFromStorage();
      return userInfo ? (userInfo.id || userInfo.userId || userInfo.email || 'unknown') : 'unauthenticated';
    } catch (e) {
      return 'error-getting-user';
    }
  },
  
  storeLocalLog: function(logEntry) {
    try {
      const currentLogs = JSON.parse(sessionStorage.getItem('admin_security_logs') || '[]');
      // Limit to 100 entries to avoid excessive storage use
      if (currentLogs.length >= 100) currentLogs.shift();
      currentLogs.push(logEntry);
      sessionStorage.setItem('admin_security_logs', JSON.stringify(currentLogs));
    } catch (e) {
      console.error('Failed to store security log locally:', e);
    }
  }
};

document.addEventListener('DOMContentLoaded', function() {
  console.log("🔒 ADMIN GUARD: Checking admin authorization");
  
  // Apply security headers if possible
  applySecurityHeaders();
  
  // Setup CSRF protection
  setupCSRFProtection();
  
  // Check if we're on an admin page
  if (window.location.pathname.includes('admin.html')) {
    validateAdminAccess();
    
    // Setup session timeout monitoring
    setupSessionMonitoring();
    
    // Schedule token refresh
    scheduleTokenRefresh();
  }
});

// Apply security headers using meta tags (as we can't set HTTP headers directly in JS)
function applySecurityHeaders() {
  // Content Security Policy
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://api.e-pharma.com";
  document.head.appendChild(cspMeta);
  
  // X-Frame-Options (prevent clickjacking)
  const xfoMeta = document.createElement('meta');
  xfoMeta.httpEquiv = 'X-Frame-Options';
  xfoMeta.content = 'DENY';
  document.head.appendChild(xfoMeta);
  
  // X-Content-Type-Options (prevent MIME sniffing)
  const xctoMeta = document.createElement('meta');
  xctoMeta.httpEquiv = 'X-Content-Type-Options';
  xctoMeta.content = 'nosniff';
  document.head.appendChild(xctoMeta);
}

// Setup CSRF protection
function setupCSRFProtection() {
  // Generate CSRF token if not exists
  let csrfToken = sessionStorage.getItem(SECURITY_CONFIG.csrfTokenName);
  if (!csrfToken) {
    csrfToken = generateRandomToken();
    sessionStorage.setItem(SECURITY_CONFIG.csrfTokenName, csrfToken);
  }
  
  // Add CSRF token to all AJAX requests
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    const result = originalXhrOpen.apply(this, arguments);
    this.setRequestHeader(SECURITY_CONFIG.csrfTokenName, csrfToken);
    return result;
  };
  
  // Also add for fetch API if used
  const originalFetch = window.fetch;
  window.fetch = function(url, options = {}) {
    if (!options.headers) {
      options.headers = {};
    }
    
    // If headers is a Headers object, not a plain object
    if (options.headers instanceof Headers) {
      options.headers.append(SECURITY_CONFIG.csrfTokenName, csrfToken);
    } else {
      options.headers[SECURITY_CONFIG.csrfTokenName] = csrfToken;
    }
    
    return originalFetch.call(this, url, options);
  };
  
  SecurityLogger.log('csrf_protection_initialized');
}

// Generate a random token for CSRF protection
function generateRandomToken() {
  const array = new Uint8Array(24);
  window.crypto.getRandomValues(array);
  return Array.from(array, byte => ('0' + (byte & 0xFF).toString(16)).slice(-2)).join('');
}

// Monitor user activity and handle session timeout
function setupSessionMonitoring() {
  let lastActivity = Date.now();
  const timeoutMs = SECURITY_CONFIG.sessionTimeoutMinutes * 60 * 1000;
  
  // Reset timer on user activity
  const resetTimer = () => { lastActivity = Date.now(); };
  
  // Events that indicate user activity
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  activityEvents.forEach(event => {
    document.addEventListener(event, resetTimer, { passive: true });
  });
  
  // Check session status periodically
  const sessionChecker = setInterval(() => {
    const now = Date.now();
    const inactiveTime = now - lastActivity;
    
    // Warn user when session is about to expire
    if (inactiveTime > (timeoutMs - 60000) && inactiveTime < timeoutMs) {
      showSessionWarning(Math.floor((timeoutMs - inactiveTime) / 1000));
    }
    
    // Session expired
    if (inactiveTime >= timeoutMs) {
      clearInterval(sessionChecker);
      SecurityLogger.log('session_timeout', { inactiveTime });
      sessionExpired();
    }
  }, 10000); // Check every 10 seconds
  
  SecurityLogger.log('session_monitoring_initialized');
}

// Schedule token refresh to maintain authentication
function scheduleTokenRefresh() {
  const refreshIntervalMs = SECURITY_CONFIG.tokenRefreshIntervalMinutes * 60 * 1000;
  
  const refreshToken = async () => {
    try {
      // Check if API service is available
      if (window.AdminAPIService && window.AdminAPIService.refreshAuthToken) {
        const result = await window.AdminAPIService.refreshAuthToken();
        if (result.success) {
          SecurityLogger.log('token_refreshed');
        } else {
          SecurityLogger.log('token_refresh_failed', { reason: result.error });
          // If token refresh fails, verify admin status again
          validateAdminAcc

// Validate that the current user has admin access
async function validateAdminAccess() {
  try {
    // First try to use the AdminAPIService if available
    if (window.AdminAPIService) {
      const accessCheck = window.AdminAPIService.checkAdminAccess();
      if (!accessCheck.isAdmin) {
        console.error("🔒 ADMIN GUARD: Access denied - " + accessCheck.error);
        redirectToLogin();
        return;
      }
      console.log("🔒 ADMIN GUARD: Access granted via API service");
      return;
    }
    
    // Fallback to direct localStorage check
    const userInfo = getUserInfoFromStorage();
    if (!userInfo) {
      console.error("🔒 ADMIN GUARD: No user info found");
      redirectToLogin();
      return;
    }
    
    if (!userInfo.role || userInfo.role.toLowerCase() !== 'admin') {
      console.error("🔒 ADMIN GUARD: User is not an admin");
      redirectToHome();
      return;
    }
    
    console.log("🔒 ADMIN GUARD: Admin access granted to " + (userInfo.email || userInfo.username));
  } catch (error) {
    console.error("🔒 ADMIN GUARD: Error checking admin access", error);
    redirectToLogin();
  }
}

// Get user info from various possible storage locations
function getUserInfoFromStorage() {
  try {
    // Try to use header-fix.js if available
    if (window.getUserInfo && typeof window.getUserInfo === 'function') {
      return window.getUserInfo();
    }
    
    // Try localStorage
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      return JSON.parse(userInfoStr);
    }
    
    // Try other possible storage keys
    const userData = localStorage.getItem('userData');
    if (userData) {
      return JSON.parse(userData);
    }
    
    return null;
  } catch (e) {
    console.error("🔒 ADMIN GUARD: Error getting user info", e);
    return null;
  }
}

// Redirect unauthorized users to login
function redirectToLogin() {
  // Create and show error notification
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = '#dc3545';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.innerHTML = '<strong>Access Denied:</strong> Please log in with admin credentials.';
  
  document.body.appendChild(notification);
  
  // Redirect after a short delay
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 2000);
}

// Redirect non-admin users to home
function redirectToHome() {
  // Create and show error notification
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '10px';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.backgroundColor = '#dc3545';
  notification.style.color = 'white';
  notification.style.padding = '10px 20px';
  notification.style.borderRadius = '5px';
  notification.style.zIndex = '9999';
  notification.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
  notification.innerHTML = '<strong>Access Denied:</strong> Your account does not have admin privileges.';
  
  document.body.appendChild(notification);
  
  // Redirect after a short delay
  setTimeout(() => {
    window.location.href = 'home2.html';
  }, 2000);
}
