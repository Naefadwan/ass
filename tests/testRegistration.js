require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000';

async function testRegistration() {
    console.log('=================================================');
    console.log('E-PHARMACY REGISTRATION TEST');
    console.log('=================================================');

    try {
        // 1. Check Server Availability
        console.log('\n1. Testing server availability...');
        const healthCheck = await axios.get(`${API_URL}/api`);
        console.log('✅ Server is responsive');
        
        // 2. Create Test User Data
        const timestamp = Date.now();
        const testUser = {
            firstName: "Test",
            lastName: "User",
            username: `testuser_${timestamp}`,
            nationalNumber: "1234567890",
            phone: "+12065550123",
            gender: "male",
            email: `test_${timestamp}@example.com`,
            password: "TestPass123!",
            securityQuestion: "What was your first pet's name?",
            securityAnswer: "Spot",
            role: "patient"
        };

        console.log('\n2. Preparing registration request with test data:');
        console.log('Email:', testUser.email);
        console.log('Username:', testUser.username);

        // 3. Send Registration Request
        console.log('\n3. Sending registration request...');
        const response = await axios({
            method: 'post',
            url: `${API_URL}/api/auth/register`,
            data: testUser,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Origin': process.env.CLIENT_URL || 'http://localhost:3000'
            },
            withCredentials: true,
            timeout: 10000 // 10 seconds timeout
        });

        // 4. Process Response
        console.log('\n4. Processing response:');
        console.log('Status:', response.status);
        console.log('Status Text:', response.statusText);
        console.log('\nResponse Headers:');
        console.log(JSON.stringify(response.headers, null, 2));
        console.log('\nResponse Data:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.status === 202) {
            console.log('\n✅ REGISTRATION SUCCESSFUL!');
            return true;
        } else {
            console.log('\n⚠️ Unexpected status code:', response.status);
            return false;
        }

    } catch (error) {
        console.error('\n❌ REGISTRATION FAILED!');
        
        if (error.response) {
            // Server responded with error status
            console.error('\nServer Response Error:');
            console.error('Status:', error.response.status);
            console.error('Data:', error.response.data);
            
            // Provide helpful debugging information
            switch (error.response.status) {
                case 400:
                    console.log('\nValidation Error Detected:');
                    console.log('- Check if all required fields are present');
                    console.log('- Verify password meets complexity requirements');
                    console.log('- Ensure all fields match expected format');
                    break;
                case 409:
                    console.log('\nConflict Error Detected:');
                    console.log('- Email or username might already exist');
                    console.log('- Try using different values');
                    break;
                case 429:
                    console.log('\nRate Limit Error Detected:');
                    console.log('- Too many requests from this IP');
                    console.log('- Wait before trying again');
                    break;
                case 500:
                    console.log('\nServer Error Detected:');
                    console.log('- Check server logs for details');
                    console.log('- Verify database connection');
                    break;
                default:
                    console.log('\nUnexpected Error Status:', error.response.status);
            }
        } else if (error.request) {
            // No response received
            console.error('\nNo Response Error:');
            console.error('- Is the server running on port 5000?');
            console.error('- Check network connectivity');
            console.error('- Verify no firewall blocking');
            console.error('Error:', error.message);
        } else {
            // Request setup error
            console.error('\nRequest Setup Error:', error.message);
        }

        if (error.config) {
            console.error('\nRequest Configuration:');
            console.error('URL:', error.config.url);
            console.error('Method:', error.config.method);
            console.error('Headers:', error.config.headers);
        }

        return false;
    }
}

// Run the test
console.log('Starting registration test...');
testRegistration()
    .then(success => {
        if (success) {
            console.log('\n✅ TEST PASSED: Registration functionality is working correctly');
            process.exit(0);
        } else {
            console.log('\n❌ TEST FAILED: Registration functionality is not working');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('\n❌ UNEXPECTED ERROR:', err.message);
        process.exit(1);
    });

