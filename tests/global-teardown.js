/**
 * Global teardown for E-Pharmacy tests
 * Handles database cleanup and resource disposal
 */

const { sequelize } = require('../models');
const logger = require('../utils/logger');

module.exports = async () => {
  try {
    console.log('Starting test environment cleanup...');
    
    // Close database connection
    await sequelize.close();
    console.log('Database connection closed');
    
    console.log('Test environment cleanup complete');
  } catch (error) {
    console.error('Error cleaning up test environment:', error);
  }
};

