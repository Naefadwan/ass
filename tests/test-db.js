/**
 * Test database configuration
 * Creates an isolated test database connection that won't exit the process on failure
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');
const colors = require('colors');

// Test-specific database configuration
const testConfig = {
  database: process.env.POSTGRES_DB || 'epharmacy_test',
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  host: process.env.POSTGRES_HOST || '127.0.0.1',
  port: process.env.POSTGRES_PORT || 5432,
  dialect: 'postgres',
  logging: false,
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
};

// Create a separate test sequelize instance
const testSequelize = new Sequelize(
  testConfig.database,
  testConfig.username,
  testConfig.password,
  {
    host: testConfig.host,
    port: testConfig.port,
    dialect: testConfig.dialect,
    logging: testConfig.logging,
    pool: testConfig.pool
  }
);

/**
 * Connect to the test database without exiting process on failure
 * @returns {Promise<boolean>} Connection success status
 */
const connectTestDB = async () => {
  try {
    await testSequelize.authenticate();
    console.log('Starting test environment setup...'.cyan);
    
    // Check if tables exist before trying to update NULL values
    try {
      const tableExists = await testSequelize.query(
        `SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      
      if (tableExists[0].exists) {
        console.log('Database schema synchronized');
      }
    } catch (prepError) {
      console.log('Tables may not exist yet, will be created during sync'.yellow);
    }

    // Sync with { force: true } for tests to ensure clean state
    await testSequelize.sync({ force: true });
    console.log('Test environment setup complete'.green);
    return true;
  } catch (error) {
    console.error('Test database connection error:'.red, error.message);
    // Don't exit process, just return false to indicate failure
    return false;
  }
};

/**
 * Close the test database connection
 */
const closeTestDB = async () => {
  try {
    await testSequelize.close();
    console.log('Database connection closed'.cyan);
  } catch (error) {
    console.error('Error closing database connection:'.red, error.message);
  }
};

module.exports = { 
  testSequelize, 
  connectTestDB, 
  closeTestDB,
  testConfig
};