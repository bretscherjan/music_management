const axios = require('axios');

const API_URL = 'http://localhost:3004/api';

async function testContactSecurity() {
    console.log('--- Starting Contact Form Security Tests ---');

    const validData = {
        name: 'Test User',
        email: 'test@example.com',
        subject: 'Test Subject',
        message: 'This is a valid test message with more than 10 characters.'
    };

    const invalidData = {
        name: 'Test <script>',
        email: 'test@example.com',
        subject: 'Invalid @#$',
        message: 'Short'
    };

    // 1. Test invalid characters
    console.log('\n1. Testing invalid characters...');
    try {
        await axios.post(`${API_URL}/contact`, invalidData);
        console.error('❌ Error: Expected 400 for invalid data, but got success.');
    } catch (error) {
        if (error.response?.status === 400) {
            console.log('✅ Success: Received 400 for invalid data.');
            console.log('   Response:', JSON.stringify(error.response.data));
        } else {
            console.error(`❌ Error: Expected 400, but got ${error.response?.status}.`);
        }
    }

    // 2. Test valid submission and rate limiting
    console.log('\n2. Testing valid submission and rate limiting...');
    try {
        console.log('Sending first valid request...');
        const res1 = await axios.post(`${API_URL}/contact`, validData);
        console.log('✅ Success: First request completed.', res1.data);

        console.log('Sending second valid request (should be rate limited)...');
        await axios.post(`${API_URL}/contact`, validData);
        console.error('❌ Error: Expected 429 for second request, but got success.');
    } catch (error) {
        if (error.response?.status === 429) {
            console.log('✅ Success: Received 429 for rate limited request.');
            console.log('   Response:', JSON.stringify(error.response.data));
        } else {
            console.error(`❌ Error: Expected 429, but got ${error.response?.status}.`);
            if (error.response) console.error('   Data:', error.response.data);
        }
    }
}

testContactSecurity();
