require('dotenv').config();
const axios = require('axios');

// Configuration
const PORT = process.env.PORT || 5000;
const API_BASE_URL = `http://localhost:${PORT}`;
const HEALTH_ENDPOINT = '/api/health';
const ROOT_ENDPOINT = '/api';
const TIMEOUT = 5000; // 5 seconds

/**
 * Checks if the E-Pharmacy server is running and reachable
 */
async function checkServerStatus() {
  console.log('===============================================');
  console.log('E-PHARMACY SERVER STATUS CHECK');
  console.log('===============================================');
  
  console.log(`\nAttempting to connect to server at: ${API_BASE_URL}`);
  
  // Try a few different endpoints to be thorough
  const endpointsToTry = [
    { url: API_BASE_URL, name: 'Server root' },
    { url: `${API_BASE_URL}${ROOT_ENDPOINT}`, name: 'API root' },
    { url: `${API_BASE_URL}${HEALTH_ENDPOINT}`, name: 'Health endpoint' }
  ];
  
  let serverRunning = false;
  let responseData = null;
  
  for (const endpoint of endpointsToTry) {
    try {
      console.log(`\nTrying endpoint: ${endpoint.name} (${endpoint.url})`);
      const startTime = Date.now();
      
      const response = await axios.get(endpoint.url, {
        timeout: TIMEOUT,
        validateStatus: () => true // Accept any status code
      });
      
      const duration = Date.now() - startTime;
      
      console.log(`Response received! (${duration}ms)`);
      console.log(`Status: ${response.status}`);
      
      // Any response means the server is running, even if it's an error
      serverRunning = true;
      responseData = {
        endpoint: endpoint.name,
        status: response.status,
        data: response.data
      };
      
      // If we got a successful response, no need to try other endpoints
      if (response.status >= 200 && response.status < 400) {
        break;
      }
    } catch (error) {
      console.log(`Could not connect to ${endpoint.name}: ${error.message}`);
    }
  }
  
  if (serverRunning) {
    console.log('\n✅ SERVER IS RUNNING');
    console.log('\nSuccessful response from:');
    console.log(`Endpoint: ${responseData.endpoint}`);
    console.log(`Status: ${responseData.status}`);
    if (responseData.data) {
      console.log('Response data:');
      console.log(JSON.stringify(responseData.data, null, 2));
    }
    return true;
  } else {
    console.error('\n❌ SERVER IS NOT RESPONDING');
    
    // Provide troubleshooting guidance
    console.log('\nTroubleshooting steps:');
    console.log('1. Make sure the server is started with: npm run dev');
    console.log(`2. Check if port ${PORT} is available and not blocked by firewall`);
    console.log('3. Verify there are no errors in the server console');
    console.log('4. Ensure database connection is working');
    console.log('5. Check if .env contains correct configuration');
    
    return false;
  }
}

// Run the check
console.log('Starting server status check...');

checkServerStatus()
  .then(isRunning => {
    if (isRunning) {
      console.log('\nServer check PASSED. You can now run the registration test:');
      console.log('node tests/testRegistration.js');
    } else {
      console.log('\nServer check FAILED. Please start the server before running tests.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\nUnexpected error during server check:');
    console.error(err);
    process.exit(1);
  });

