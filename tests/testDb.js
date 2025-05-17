require('dotenv').config();
const { sequelize } = require('../config/db');
const colors = require('colors');

async function testDatabase() {
    console.log('\n🔍 Testing Database Connection...'.cyan);
    
    try {
        // Test basic connection
        await sequelize.authenticate();
        console.log('✅ Database connection successful'.green.bold);
        
        // Get database info
        const [dbInfo] = await sequelize.query("SELECT current_database(), current_user, version();");
        console.log('\n📊 Database Information:'.cyan);
        console.log(`Database: ${dbInfo[0].current_database}`.yellow);
        console.log(`User: ${dbInfo[0].current_user}`.yellow);
        console.log(`PostgreSQL Version: ${dbInfo[0].version.split(',')[0]}`.yellow);
        
        // Get all tables
        const tables = await sequelize.getQueryInterface().showAllTables();
        console.log('\n📋 Database Tables:'.cyan);
        if (tables.length === 0) {
            console.log('No tables found in database'.red);
        } else {
            tables.forEach(table => {
                console.log(`- ${table}`.yellow);
            });
        }
        
        // Check if users table exists and get its structure
        if (tables.includes('users')) {
            console.log('\n👤 Examining users table structure...'.cyan);
            const userTableStructure = await sequelize.getQueryInterface().describeTable('users');
            
            console.log('\n📝 Users Table Schema:'.cyan);
            Object.entries(userTableStructure).forEach(([column, details]) => {
                console.log(`- ${column}: ${details.type} ${details.primaryKey ? '(PK)' : ''} ${details.allowNull ? '' : '(NOT NULL)'}`);
            });
            
            // Check record count
            const [userCount] = await sequelize.query("SELECT COUNT(*) FROM users;");
            console.log(`\n📊 Total user records: ${userCount[0].count}`.yellow);
        } else {
            console.log('\n⚠️ Users table does not exist!'.red);
            console.log('This may cause registration to fail.'.red.bold);
        }
        
        // Check required tables for registration
        const requiredTables = ['users', 'audit_logs'];
        const missingTables = requiredTables.filter(table => !tables.includes(table));
        
        if (missingTables.length > 0) {
            console.log('\n⚠️ Missing required tables:'.red);
            missingTables.forEach(table => {
                console.log(`- ${table}`.yellow);
            });
            console.log('\nRegistration may fail due to missing tables.'.red.bold);
        } else {
            console.log('\n✅ All required tables exist'.green.bold);
        }
        
        return true;
    } catch (error) {
        console.error('\n❌ Database Error:'.red.bold);
        console.error(error.message.red);
        
        // Provide troubleshooting advice
        console.log('\n🔧 Troubleshooting suggestions:'.cyan);
        
        if (error.message.includes('connect ECONNREFUSED')) {
            console.log('- Is PostgreSQL server running?'.yellow);
            console.log('- Check POSTGRES_HOST and POSTGRES_PORT in .env file'.yellow);
        } else if (error.message.includes('does not exist')) {
            console.log(`- Database "${process.env.POSTGRES_DB}" doesn't exist.`.yellow);
            console.log('- Create the database first:'.yellow);
            console.log('  $ psql -U postgres -c "CREATE DATABASE epharmacy;"'.gray);
        } else if (error.message.includes('password authentication failed')) {
            console.log('- Incorrect POSTGRES_USER or POSTGRES_PASSWORD in .env file'.yellow);
        }
        
        return false;
    } finally {
        // Close the connection
        await sequelize.close();
        console.log('\n🔌 Database connection closed'.gray);
    }
}

// Run the test
console.log('================================================='.blue);
console.log('📋 E-PHARMACY DATABASE CONNECTION TEST'.blue.bold);
console.log('================================================='.blue);

testDatabase()
    .then(success => {
        if (success) {
            console.log('\n✅ Database test completed successfully'.green.bold);
        } else {
            console.log('\n❌ Database test failed'.red.bold);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('\n❌ Unexpected error during test:'.red.bold, err);
        process.exit(1);
    });

