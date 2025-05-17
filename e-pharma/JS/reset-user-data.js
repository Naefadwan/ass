// This script provides tools to reset all user data in localStorage
console.log("Reset user data tool loaded");

document.addEventListener('DOMContentLoaded', () => {
  // Create a floating reset button
  const resetDiv = document.createElement('div');
  resetDiv.style.position = 'fixed';
  resetDiv.style.bottom = '20px';
  resetDiv.style.right = '20px';
  resetDiv.style.padding = '10px';
  resetDiv.style.backgroundColor = '#f8f9fa';
  resetDiv.style.border = '1px solid #ddd';
  resetDiv.style.borderRadius = '5px';
  resetDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
  resetDiv.style.zIndex = '10000';
  resetDiv.style.display = 'flex';
  resetDiv.style.flexDirection = 'column';
  resetDiv.style.gap = '10px';
  
  // Add title
  const title = document.createElement('h4');
  title.textContent = 'User Data Tools';
  title.style.margin = '0 0 10px 0';
  title.style.fontSize = '14px';
  title.style.fontFamily = 'Arial, sans-serif';
  resetDiv.appendChild(title);
  
  // Add reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset All User Data';
  resetButton.style.backgroundColor = '#dc3545';
  resetButton.style.color = 'white';
  resetButton.style.border = 'none';
  resetButton.style.borderRadius = '4px';
  resetButton.style.padding = '8px 12px';
  resetButton.style.cursor = 'pointer';
  resetButton.onclick = () => {
    // Remove all user-related data from localStorage
    console.log('Clearing all user data from localStorage');
    localStorage.removeItem('e_pharma_auth_token');
    localStorage.removeItem('user_info');
    localStorage.removeItem('e_pharma_user_profile');
    localStorage.removeItem('reminders');
    localStorage.removeItem('cart');
    localStorage.removeItem('score');
    
    alert('All user data has been cleared from localStorage. The page will now reload.');
    window.location.reload();
  };
  resetDiv.appendChild(resetButton);
  
  // Add display current data button
  const displayButton = document.createElement('button');
  displayButton.textContent = 'Show Current User Data';
  displayButton.style.backgroundColor = '#007bff';
  displayButton.style.color = 'white';
  displayButton.style.border = 'none';
  displayButton.style.borderRadius = '4px';
  displayButton.style.padding = '8px 12px';
  displayButton.style.cursor = 'pointer';
  displayButton.onclick = () => {
    console.log('Current localStorage user data:');
    console.log('- auth_token:', localStorage.getItem('e_pharma_auth_token'));
    console.log('- user_info:', localStorage.getItem('user_info'));
    console.log('- e_pharma_user_profile:', localStorage.getItem('e_pharma_user_profile'));
    
    // Create or update status text
    let statusText = statusDiv.querySelector('pre');
    if (!statusText) {
      statusText = document.createElement('pre');
      statusText.style.fontSize = '11px';
      statusText.style.margin = '5px 0';
      statusText.style.backgroundColor = '#f5f5f5';
      statusText.style.padding = '5px';
      statusText.style.borderRadius = '3px';
      statusText.style.whiteSpace = 'pre-wrap';
      statusText.style.wordBreak = 'break-all';
      statusText.style.maxHeight = '150px';
      statusText.style.overflow = 'auto';
      statusDiv.appendChild(statusText);
    }
    
    // Show user data
    const userData = {
      "auth_token": localStorage.getItem('e_pharma_auth_token'),
      "user_info": localStorage.getItem('user_info') ? JSON.parse(localStorage.getItem('user_info')) : null,
      "e_pharma_user_profile": localStorage.getItem('e_pharma_user_profile') ? 
          JSON.parse(localStorage.getItem('e_pharma_user_profile')) : null
    };
    
    statusText.textContent = JSON.stringify(userData, null, 2);
  };
  resetDiv.appendChild(displayButton);
  
  // Add status div
  const statusDiv = document.createElement('div');
  statusDiv.style.marginTop = '5px';
  statusDiv.style.fontSize = '12px';
  resetDiv.appendChild(statusDiv);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = 'X';
  closeButton.style.position = 'absolute';
  closeButton.style.top = '5px';
  closeButton.style.right = '5px';
  closeButton.style.backgroundColor = 'transparent';
  closeButton.style.border = 'none';
  closeButton.style.fontSize = '12px';
  closeButton.style.cursor = 'pointer';
  closeButton.onclick = () => document.body.removeChild(resetDiv);
  resetDiv.appendChild(closeButton);
  
  // Add to body
  document.body.appendChild(resetDiv);
});
