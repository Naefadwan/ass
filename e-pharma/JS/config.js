// config.js - Global Configuration
// This file defines global constants that can be used across the application

// API Base URL - change this if your API server changes
const API_URL = 'http://localhost:5000/api';
const API_BASE_URL = 'http://localhost:5000';

// Global API configuration object - accessible as API_ENDPOINTS from any script
const API_ENDPOINTS = {
  LOGIN: `${API_URL}/auth/login`,
  REGISTER: `${API_URL}/auth/register`,
  LOGOUT: `${API_URL}/auth/logout`,
  PRESCRIPTION: `${API_URL}/prescriptions`,
  PRESCRIPTION_VERIFY: `${API_URL}/prescriptions/verification`,
  PRESCRIPTION_STATUS: `${API_URL}/prescriptions/status/:id`,
  PRESCRIPTION_REVIEW: `${API_URL}/prescriptions/:id/review`,
  MEDICINES: `${API_URL}/medicines`,
  SKINCARE: `${API_URL}/skincare`,
  ORDERS: `${API_URL}/orders`,
  USERS: `${API_URL}/users`,
  PROFILE: `${API_URL}/users/profile`,
  AI_CHAT: `${API_URL}/ai-assistant/chat`,
  PAYMENTS: `${API_URL}/payments/intent`,
  CHECKOUT: `${API_URL}/payments/checkout`
};

// Error messages for consistent user feedback
const ERROR_MESSAGES = {
  LOGIN_FAILED: 'Invalid username or password',
  PASSWORD_MISMATCH: 'Passwords do not match',
  GENERIC: 'Something went wrong. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to access this resource.'
};

const AUTH_TOKEN_KEY = 'e_pharma_auth_token';