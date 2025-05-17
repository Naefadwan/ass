/**
 * Global setup for E-Pharmacy tests
 * Handles database initialization and test environment setup
 */

const { sequelize } = require('../models');
const logger = require('../utils/logger');

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.JWT_EXPIRE = '1h';
process.env.ADMIN_REGISTRATION_CODE = 'TEST-ADMIN-CODE-123';

module.exports = async () => {
  try {
    // Log test start
    console.log('Starting test environment setup...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully');
    
    // Sync database (force: true will drop tables and recreate them)
    // Only do this in test environment!
    if (process.env.NODE_ENV === 'test') {
      await sequelize.sync({ force: true });
      console.log('Database schema synchronized');
    }
    
    console.log('Test environment setup complete');
  } catch (error) {
    console.error('Error setting up test environment:', error);
    throw error;
  }
};

