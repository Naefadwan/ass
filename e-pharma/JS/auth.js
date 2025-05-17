// auth.js
import { API_ENDPOINTS, ERROR_MESSAGES, AUTH_TOKEN_KEY } from './config.js';

// Authentication functions
export async function login(email, password) {
  try {
    console.log('Login attempt for:', email);
    
    // Development mode checks
    if (isDevelopmentMode()) {
      // For development testing - remove in production
      if (email === 'demo@example.com' && password === 'password') {
        console.log('Using demo account');
        const demoToken = 'demo_token_' + Date.now();
        localStorage.setItem(AUTH_TOKEN_KEY, demoToken);
        return { 
          success: true, 
          user: { email, name: 'Demo User' },
          token: demoToken
        };
      }
      
      // Test account bypass for development
      if ((email === 'test@example.com' || email === 'Naefsa@ss') && 
          (password === 'testpassword' || password === 'password')) {
        console.log('DEVELOPMENT MODE: Bypassing authentication for test account');
        
        // Store fake token
        const testToken = 'test_token_' + Date.now();
        localStorage.setItem(AUTH_TOKEN_KEY, testToken);
        
        // Return mock response
        return {
          success: true,
          user: { email, name: 'Test User', role: 'admin' },
          token: testToken
        };
      }
    }
    
    // Make the API call
    console.log('Sending request to:', API_ENDPOINTS.LOGIN);
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // Important for cookies
    });

    console.log('Response status:', response.status);
    
    // Get the response data
    let data;
    try {
      data = await response.json();
      console.log('Response data:', data);
    } catch (e) {
      console.error('Error parsing response:', e);
      data = { message: 'Could not parse server response' };
    }
    
    // Handle different response statuses
    if (!response.ok) {
      throw new Error(data.message || ERROR_MESSAGES.LOGIN_FAILED);
    }
    
    // Store token and user info in localStorage
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      if (data.user) {
        localStorage.setItem('user_info', JSON.stringify(data.user));
      }
    } else {
      console.warn('No token received from server');
    }
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

export async function register(userData) {
  try {
    console.log('Registration attempt for:', userData.email);
    
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData),
      credentials: 'include'
    });

    console.log('Registration response status:', response.status);
    
    // Get the response data
    let data;
    try {
      data = await response.json();
      console.log('Registration response data:', data);
    } catch (e) {
      console.error('Error parsing registration response:', e);
      data = { message: 'Could not parse server response' };
    }
    
    if (!response.ok) {
      throw new Error(data.message || ERROR_MESSAGES.GENERIC);
    }
    
    // Store token and user info in localStorage
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      if (data.user) {
        localStorage.setItem('user_info', JSON.stringify(data.user));
      }
    } else {
      console.warn('No token received from server');
    }
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

export function logout() {
  console.log('Logging out user');
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem('user_info');
  
  // Also try to call logout endpoint if it exists
  try {
    fetch(API_ENDPOINTS.LOGOUT, {
      method: 'POST',
      headers: getAuthHeader(),
      credentials: 'include'
    }).catch(err => console.error('Error calling logout endpoint:', err));
  } catch (e) {
    console.error('Error during logout:', e);
  }
  
  window.location.href = './html/login.html';
}

export function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  
  // You could add token validation here if needed
  // For development tokens, we'll consider them valid
  if (token.startsWith('demo_token_') || token.startsWith('test_token_')) {
    return true;
  }
  
  // For real tokens, you might want to check expiration or other validation
  return true;
}

export function getAuthHeader() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Helper function to check if we're in development mode
export function isDevelopmentMode() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1';
}