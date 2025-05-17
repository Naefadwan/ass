// Login debug script to help diagnose redirect issues
console.log("🔍 LOGIN DEBUG: Script loaded");

document.addEventListener('DOMContentLoaded', function() {
  console.log("🔍 LOGIN DEBUG: Document ready");
  
  // Check for auth token and user info from all possible storage locations
  const authToken = localStorage.getItem('e_pharma_auth_token');
  let userInfo = null;
  let userData = null;
  
  // Try to get user info from user_info
  try {
    const userInfoStr = localStorage.getItem('user_info');
    if (userInfoStr) {
      userInfo = JSON.parse(userInfoStr);
    }
  } catch (e) {
    console.error("🔍 LOGIN DEBUG: Error parsing user_info:", e);
  }
  
  // Try to get user data from userData
  try {
    const userDataStr = localStorage.getItem('userData');
    if (userDataStr) {
      userData = JSON.parse(userDataStr);
    }
  } catch (e) {
    console.error("🔍 LOGIN DEBUG: Error parsing userData:", e);
  }
  
  // Log authentication status
  console.log("🔍 LOGIN DEBUG: Auth token present:", !!authToken);
  console.log("🔍 LOGIN DEBUG: User info present:", !!userInfo);
  console.log("🔍 LOGIN DEBUG: User data present:", !!userData);
  
  // Determine the user role from all available sources
  let userRole = null;
  
  if (userInfo && userInfo.role) {
    userRole = userInfo.role;
    console.log("🔍 LOGIN DEBUG: User role from user_info:", userRole);
    console.log("🔍 LOGIN DEBUG: Full user info:", userInfo);
  }
  
  if (userData && userData.role) {
    console.log("🔍 LOGIN DEBUG: User role from userData:", userData.role);
    console.log("🔍 LOGIN DEBUG: Full userData:", userData);
    // If we didn't have a role from userInfo, use the one from userData
    if (!userRole) userRole = userData.role;
  }
  
  // Also check window.userRole if it exists
  if (window.userRole) {
    console.log("🔍 LOGIN DEBUG: User role from window.userRole:", window.userRole);
    // If we didn't have a role yet, use the one from window
    if (!userRole) userRole = window.userRole;
  }
  
  console.log("🔍 LOGIN DEBUG: Final determined user role:", userRole);
  
  // Check if this is an admin that should be redirected
  if (userRole?.toLowerCase() === 'admin' && 
      !window.location.pathname.includes('admin.html')) {
    console.log("🔍 LOGIN DEBUG: Admin user detected outside admin page, redirecting...");
      
    // Create a visible notification
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
    notification.innerHTML = '<strong>Admin Account:</strong> Redirecting to admin dashboard...';
    
    document.body.appendChild(notification);
    
    // Force redirect after a short delay
    setTimeout(() => {
      window.location.href = 'admin.html';
    }, 1500);
  }
  
  // Add debugging controls
  addDebugControls();
});

// Add debugging controls to help diagnose issues
function addDebugControls() {
  // Create controls container
  const debugControls = document.createElement('div');
  debugControls.style.position = 'fixed';
  debugControls.style.bottom = '20px';
  debugControls.style.left = '20px';
  debugControls.style.zIndex = '9999';
  debugControls.style.backgroundColor = '#f8f9fa';
  debugControls.style.padding = '10px';
  debugControls.style.borderRadius = '5px';
  debugControls.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  
  // Create title
  const title = document.createElement('div');
  title.textContent = 'Login Debug Tools';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '10px';
  
  // Create buttons
  const clearDataBtn = createDebugButton('Clear Login Data', function() {
    localStorage.removeItem('e_pharma_auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('e_pharma_user_profile');
    console.log("🔍 LOGIN DEBUG: All login data cleared");
    alert("Login data cleared. Please refresh the page.");
  });
  
  const forceAdminBtn = createDebugButton('Force Admin Role', function() {
    try {
      let userInfoUpdated = false;
      
      // Update user_info if it exists
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        userInfo.role = 'admin';
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        userInfoUpdated = true;
        console.log("🔍 LOGIN DEBUG: user_info role set to admin");
      }
      
      // Update userData if it exists
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userData.role = 'admin';
        localStorage.setItem('userData', JSON.stringify(userData));
        userInfoUpdated = true;
        console.log("🔍 LOGIN DEBUG: userData role set to admin");
      }
      
      // Also set window.userRole if it exists
      window.userRole = 'admin';
      
      if (userInfoUpdated) {
        alert("User role set to admin. Redirecting to admin page...");
        setTimeout(() => {
          window.location.href = 'admin.html';
        }, 500);
      } else {
        alert("No user info found in any storage location. Please login first.");
      }
    } catch (e) {
      console.error("🔍 LOGIN DEBUG: Error setting admin role:", e);
      alert("Error setting admin role: " + e.message);
    }
  });
  
  const forcePatientBtn = createDebugButton('Force Patient Role', function() {
    try {
      let userInfoUpdated = false;
      
      // Update user_info if it exists
      const userInfoStr = localStorage.getItem('user_info');
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        userInfo.role = 'patient';
        localStorage.setItem('user_info', JSON.stringify(userInfo));
        userInfoUpdated = true;
        console.log("🔍 LOGIN DEBUG: user_info role set to patient");
      }
      
      // Update userData if it exists
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        userData.role = 'patient';
        localStorage.setItem('userData', JSON.stringify(userData));
        userInfoUpdated = true;
        console.log("🔍 LOGIN DEBUG: userData role set to patient");
      }
      
      // Also set window.userRole if it exists
      window.userRole = 'patient';
      
      if (userInfoUpdated) {
        alert("User role set to patient. Redirecting to home page...");
        setTimeout(() => {
          window.location.href = 'home2.html';
        }, 500);
      } else {
        alert("No user info found in any storage location. Please login first.");
      }
    } catch (e) {
      console.error("🔍 LOGIN DEBUG: Error setting patient role:", e);
      alert("Error setting patient role: " + e.message);
    }
  });
  
  const viewDataBtn = createDebugButton('View Login Data', function() {
    try {
      const authToken = localStorage.getItem('e_pharma_auth_token');
      const userInfoStr = localStorage.getItem('user_info');
      
      let outputText = "AuthToken: " + (authToken || "NONE") + "\n\n";
      
      if (userInfoStr) {
        const userInfo = JSON.parse(userInfoStr);
        outputText += "User Info:\n" + JSON.stringify(userInfo, null, 2);
      } else {
        outputText += "No user info found.";
      }
      
      const textarea = document.createElement('textarea');
      textarea.value = outputText;
      textarea.style.width = '300px';
      textarea.style.height = '200px';
      textarea.style.padding = '5px';
      textarea.style.marginTop = '10px';
      
      // Clear previous textarea if exists
      const existingTextarea = document.getElementById('debug-output');
      if (existingTextarea) {
        existingTextarea.remove();
      }
      
      textarea.id = 'debug-output';
      debugControls.appendChild(textarea);
      
      console.log("🔍 LOGIN DEBUG: Viewing login data");
    } catch (e) {
      console.error("🔍 LOGIN DEBUG: Error viewing login data:", e);
      alert("Error viewing login data: " + e.message);
    }
  });
  
  const goToAdminBtn = createDebugButton('Go To Admin Page', function() {
    window.location.href = 'admin.html';
  });
  
  // Add elements to container
  debugControls.appendChild(title);
  debugControls.appendChild(clearDataBtn);
  debugControls.appendChild(forceAdminBtn);
  debugControls.appendChild(forcePatientBtn);
  debugControls.appendChild(viewDataBtn);
  debugControls.appendChild(goToAdminBtn);
  
  // Add to page
  document.body.appendChild(debugControls);
}

// Helper to create debug buttons
function createDebugButton(text, onClick) {
  const button = document.createElement('button');
  button.textContent = text;
  button.style.display = 'block';
  button.style.width = '100%';
  button.style.padding = '5px';
  button.style.marginBottom = '5px';
  button.style.backgroundColor = '#007bff';
  button.style.color = 'white';
  button.style.border = 'none';
  button.style.borderRadius = '3px';
  button.style.cursor = 'pointer';
  
  button.addEventListener('click', onClick);
  
  return button;
}
