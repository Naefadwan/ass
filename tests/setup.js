/**
 * Setup file for individual test suites
 * Runs before each test file
 */

const { sequelize, User } = require('../models');

// Increase test timeout for all tests
jest.setTimeout(30000);

// Setup mocks
jest.mock('../utils/sendEmail', () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue(true)
}));

// Add global test utilities
global.createTestUser = async (userData = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    nationalNumber: 'TEST-123456',
    email: `test${Date.now()}@example.com`,
    phone: '+1234567890',
    gender: 'male',
    username: `testuser${Date.now()}`,
    password: 'Password123!',
    securityQuestion: 'What is your favorite color?',
    securityAnswer: 'blue',
    role: 'patient'
  };

  return await User.create({ ...defaultUser, ...userData });
};

// Cleanup after each test
afterEach(async () => {
  // Any cleanup operations after each individual test
});

// Global cleanup when all tests in the file are done
afterAll(async () => {
  // Close any open connections or resources
  await sequelize.close();
});

