require('dotenv').config();
const axios = require('axios');

// Configuration
const API_BASE_URL = `http://localhost:${process.env.PORT || 5000}`;
const REGISTRATION_ENDPOINT = '/api/auth/register';

/**
 * Test the registration endpoint with a valid user
 */
async function testRegistration() {
  console.log('===============================================');
  console.log('E-PHARMACY REGISTRATION TEST');
  console.log('===============================================');

  // Create a unique test user based on schema requirements
  const timestamp = Date.now();
  const testUser = {
    firstName: "Test",
    lastName: "User",
    username: `testuser_${timestamp}`,
    nationalNumber: "1234567890",
    phone: "+1234567890",
    gender: "male",
    email: `test${timestamp}@example.com`,
    password: "TestPass123!",
    securityQuestion: "What was your first pet's name?",
    securityAnswer: "Spot",
    role: "patient"
  };

  console.log('\nSending registration request with data:');
  console.log(JSON.stringify(testUser, null, 2));
  console.log(`\nEndpoint: ${API_BASE_URL}${REGISTRATION_ENDPOINT}`);

  try {
    console.log('\nSending request...');
    const startTime = Date.now();
    
    const response = await axios({
      method: 'post',
      url: `${API_BASE_URL}${REGISTRATION_ENDPOINT}`,
      data: testUser,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });
    
    const duration = Date.now() - startTime;
    
    console.log(`\nRegistration successful! (${duration}ms)`);
    console.log('\nResponse Status:', response.status);
    console.log('\nResponse Data:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return true;
  } catch (error) {
    console.error('\nRegistration failed!');
    
    if (error.response) {
      // The server responded with an error status code
      console.error(`Status: ${error.response.status}`);
      console.error('\nResponse Data:');
      console.error(JSON.stringify(error.response.data, null, 2));
      
      // Provide helpful debugging info for common errors
      if (error.response.status === 400) {
        console.log('\nPossible validation issues:');
        console.log('- Check if all required fields have correct formats');
        console.log('- Password may not meet complexity requirements');
        console.log('- Field length restrictions might be violated');
      } else if (error.response.status === 409) {
        console.log('\nConflict detected:');
        console.log('- Email or username might already be in use');
      } else if (error.response.status === 500) {
        console.log('\nServer error:');
        console.log('- Check server logs for more details');
        console.log('- Verify database connectivity');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('\nNo response received from server:');
      console.error('- Is the server running?');
      console.error(`- Is it accessible at ${API_BASE_URL}?`);
      console.error('- Check network connectivity');
    } else {
      // Something happened in setting up the request
      console.error('\nRequest setup error:', error.message);
    }
    
    return false;
  }
}

// Run the test
console.log('Starting registration test...');

testRegistration()
  .then(success => {
    if (success) {
      console.log('\nTEST PASSED: User registration works correctly.');
    } else {
      console.log('\nTEST FAILED: Unable to register user.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('\nUnexpected error during test execution:');
    console.error(err);
    process.exit(1);
  });

