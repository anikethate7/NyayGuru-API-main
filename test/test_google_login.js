// Simple test script to verify Google login endpoint
const axios = require('axios');

async function testGoogleLogin() {
  try {
    console.log('Testing Google Login endpoint...');
    
    // This is just a test token - it won't actually work with Google
    // but we can check if our endpoint responds correctly
    const mockToken = 'test_token_123';
    
    const response = await axios.post('http://localhost:8000/api/auth/google-login', {
      token: mockToken
    });
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error response status:', error.response?.status);
    console.error('Error response data:', error.response?.data);
    console.error('Error message:', error.message);
  }
}

testGoogleLogin(); 