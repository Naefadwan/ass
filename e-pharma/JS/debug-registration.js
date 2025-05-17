// Registration debug helper
// This script helps diagnose issues with the registration form

document.addEventListener('DOMContentLoaded', () => {
  console.log('Debug registration helper loaded');
  
  // Create a floating debug panel
  const debugPanel = document.createElement('div');
  debugPanel.id = 'debug-panel';
  debugPanel.style.position = 'fixed';
  debugPanel.style.bottom = '20px';
  debugPanel.style.right = '20px';
  debugPanel.style.width = '300px';
  debugPanel.style.padding = '15px';
  debugPanel.style.backgroundColor = '#f8f9fa';
  debugPanel.style.border = '1px solid #ddd';
  debugPanel.style.borderRadius = '5px';
  debugPanel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  debugPanel.style.zIndex = '10000';
  debugPanel.style.fontFamily = 'sans-serif';
  debugPanel.style.fontSize = '14px';
  debugPanel.style.maxHeight = '400px';
  debugPanel.style.overflowY = 'auto';
  
  // Add heading
  const heading = document.createElement('h3');
  heading.textContent = 'Registration Debug';
  heading.style.margin = '0 0 10px 0';
  heading.style.fontSize = '16px';
  debugPanel.appendChild(heading);
  
  // Add test button
  const testButton = document.createElement('button');
  testButton.textContent = 'Test Minimal Registration';
  testButton.style.padding = '8px 12px';
  testButton.style.backgroundColor = '#007bff';
  testButton.style.color = 'white';
  testButton.style.border = 'none';
  testButton.style.borderRadius = '4px';
  testButton.style.marginBottom = '10px';
  testButton.style.cursor = 'pointer';
  testButton.style.width = '100%';
  debugPanel.appendChild(testButton);
  
  // Add results area
  const resultsArea = document.createElement('div');
  resultsArea.id = 'debug-results';
  resultsArea.style.marginTop = '10px';
  resultsArea.style.padding = '10px';
  resultsArea.style.backgroundColor = '#fff';
  resultsArea.style.border = '1px solid #eee';
  resultsArea.style.borderRadius = '4px';
  resultsArea.style.fontSize = '13px';
  resultsArea.innerHTML = '<p>Ready for testing</p>';
  debugPanel.appendChild(resultsArea);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '10px';
  closeButton.style.right = '10px';
  closeButton.style.padding = '2px 6px';
  closeButton.style.fontSize = '12px';
  closeButton.style.border = 'none';
  closeButton.style.backgroundColor = '#f5f5f5';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => document.body.removeChild(debugPanel);
  debugPanel.appendChild(closeButton);
  
  // Add the panel to the document
  document.body.appendChild(debugPanel);
  
  // Test minimal registration function
  testButton.onclick = async () => {
    resultsArea.innerHTML = '<p>Testing minimal registration...</p>';
    
    // Create minimal test registration data
    const testData = {
      firstName: 'Test',
      lastName: 'User',
      nationalNumber: '12345678',
      phone: '1234567890',
      gender: 'male',
      username: 'testuser' + Date.now().toString().slice(-4), // Make unique
      password: 'Test1234!',
      email: 'test' + Date.now().toString().slice(-4) + '@example.com', // Make unique
      securityQuestion: 'What is your favorite color?',
      securityAnswer: 'blue',
      role: 'patient',
      // Add minimal required fields only
    };
    
    try {
      // First get CSRF token
      resultsArea.innerHTML += '<p>Fetching CSRF token...</p>';
      const csrfRes = await fetch("http://localhost:5000/api", { credentials: "include" });
      const csrfData = await csrfRes.json();
      const csrfToken = csrfData.csrfToken;
      
      if (!csrfToken) {
        resultsArea.innerHTML += '<p style="color:red">❌ Could not retrieve CSRF token</p>';
        return;
      }
      
      resultsArea.innerHTML += '<p>✅ Got CSRF token</p>';
      
      // Now try registration
      resultsArea.innerHTML += '<p>Sending test registration...</p>';
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken
        },
        credentials: "include",
        body: JSON.stringify(testData),
      });
      
      // Get response
      const data = await res.json();
      console.log("Test registration response:", data);
      
      if (res.ok) {
        resultsArea.innerHTML += '<p style="color:green">✅ SUCCESS! Registration worked with minimal data</p>';
        
        // Log the successful data
        resultsArea.innerHTML += '<p><strong>Data that worked:</strong></p>';
        resultsArea.innerHTML += '<pre style="font-size:11px;overflow:auto;max-height:150px;">' + 
          JSON.stringify(testData, null, 2) + '</pre>';
      } else {
        resultsArea.innerHTML += '<p style="color:red">❌ Registration failed</p>';
        
        // Show error details
        if (data.details && Array.isArray(data.details)) {
          resultsArea.innerHTML += '<p><strong>Validation errors:</strong></p>';
          data.details.forEach(error => {
            resultsArea.innerHTML += `<p>• Field '${error.field}': ${error.message}</p>`;
          });
        } else {
          resultsArea.innerHTML += '<p><strong>Error:</strong> ' + (data.error || 'Unknown error') + '</p>';
        }
      }
    } catch (err) {
      resultsArea.innerHTML += '<p style="color:red">❌ Error: ' + err.message + '</p>';
      console.error("Debug registration error:", err);
    }
  };
});
